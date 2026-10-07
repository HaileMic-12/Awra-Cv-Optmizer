import { NextResponse } from "next/server";
import { GoogleGenAI, Type } from "@google/genai";
import { db } from "@/lib/firebase/config";
import { doc, runTransaction } from "firebase/firestore";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL = "gemini-3.8-flash";
const MAX_INPUT_LENGTH = 80_000;

// ============================================================
// CREDIT COSTS
// ============================================================

const SERVICE_COSTS = {
  coverLetter: 1,
  cvOptimizations: 1,
  optimizedCV: 2,
} as const;

type ServiceKey = keyof typeof SERVICE_COSTS;

const ALL_SERVICES: ServiceKey[] = [
  "coverLetter",
  "cvOptimizations",
  "optimizedCV",
];

// ============================================================
// GEMINI RESPONSE SCHEMA
// All fields are optional because the customer may request
// only one service.
// ============================================================

const generationSchema = {
  type: Type.OBJECT,
  properties: {
    coverLetter: {
      type: Type.STRING,
      description:
        "A professional, tailored cover letter based on the CV and Job Description. Return an empty string if this service was not requested.",
    },

    cvOptimizations: {
      type: Type.STRING,
      description:
        "A bulleted list of actionable CV improvements tailored to the job. Return an empty string if this service was not requested.",
    },

    optimizedCV: {
      type: Type.STRING,
      description:
        "The fully rewritten ATS-friendly CV. Return an empty string if this service was not requested.",
    },
  },
  required: ["coverLetter", "cvOptimizations", "optimizedCV"],
};

// ============================================================
// HELPERS
// ============================================================

function cleanInput(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, maxLength);
}

function normalizeServices(value: unknown): ServiceKey[] {
  if (!Array.isArray(value)) return [];

  const valid = value.filter(
    (service): service is ServiceKey =>
      typeof service === "string" &&
      ALL_SERVICES.includes(service as ServiceKey)
  );

  // Remove duplicates
  return [...new Set(valid)];
}

function calculateCreditCost(services: ServiceKey[]): number {
  return services.reduce((total, service) => {
    return total + SERVICE_COSTS[service];
  }, 0);
}

function buildRequestedServicesText(services: ServiceKey[]): string {
  const labels: Record<ServiceKey, string> = {
    coverLetter: "Tailored Cover Letter",
    cvOptimizations: "CV Optimization / Improvement Suggestions",
    optimizedCV: "Fully Optimized ATS CV",
  };

  return services.map((service) => `- ${labels[service]}`).join("\n");
}

// ============================================================
// POST
// ============================================================

export async function POST(req: Request) {
  let userId = "";
  let chargedCredits = 0;

  try {
    // ========================================================
    // 1. BASIC CONFIGURATION CHECK
    // ========================================================

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "AI service is not configured." },
        { status: 500 }
      );
    }

    // ========================================================
    // 2. READ REQUEST
    // ========================================================

    const body = await req.json();

    const cvData = cleanInput(
      body.cvData,
      MAX_INPUT_LENGTH
    );

    const jobDescription = cleanInput(
      body.jobDescription,
      MAX_INPUT_LENGTH
    );

    const missingSkills = Array.isArray(body.missingSkills)
      ? body.missingSkills
          .filter((skill: unknown) => typeof skill === "string")
          .slice(0, 50)
      : [];

    userId =
      typeof body.userId === "string"
        ? body.userId.trim()
        : "";

    // New field sent by the frontend.
    //
    // Example:
    // ["coverLetter"]
    //
    // or:
    // ["coverLetter", "cvOptimizations"]
    //
    // or:
    // ["coverLetter", "cvOptimizations", "optimizedCV"]
    const requestedServices = normalizeServices(
      body.services ?? body.requestedServices
    );

    // ========================================================
    // 3. VALIDATE INPUT
    // ========================================================

    if (!cvData || !jobDescription) {
      return NextResponse.json(
        {
          error:
            "Missing required CV or job description.",
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Unauthorized. Please log in to generate premium assets.",
        },
        { status: 401 }
      );
    }

    if (requestedServices.length === 0) {
      return NextResponse.json(
        {
          error:
            "Please select at least one service to generate.",
        },
        { status: 400 }
      );
    }

    // ========================================================
    // 4. CALCULATE COST SERVER-SIDE
    // ========================================================
    //
    // NEVER trust a "cost" value sent by the frontend.
    // The server calculates the price from the selected services.
    //

    const generationCost = calculateCreditCost(
      requestedServices
    );

    chargedCredits = generationCost;

    // ========================================================
    // 5. DEDUCT ONLY THE SELECTED SERVICES
    // ========================================================

    const userRef = doc(db, "users", userId);

    let remainingCredits = 0;

    try {
      await runTransaction(db, async (transaction) => {
        const userDoc = await transaction.get(userRef);

        if (!userDoc.exists()) {
          throw new Error("USER_NOT_FOUND");
        }

        const userData = userDoc.data();

        const currentCredits =
          typeof userData.credits === "number"
            ? userData.credits
            : 0;

        if (currentCredits < generationCost) {
          throw new Error("INSUFFICIENT_CREDITS");
        }

        remainingCredits =
          currentCredits - generationCost;

        transaction.update(userRef, {
          credits: remainingCredits,
          updatedAt: new Date(),
        });
      });
    } catch (transactionError: any) {
      if (
        transactionError?.message ===
        "INSUFFICIENT_CREDITS"
      ) {
        return NextResponse.json(
          {
            error: `Insufficient credits. The selected service${requestedServices.length > 1 ? "s" : ""} require${requestedServices.length > 1 ? "" : "s"} ${generationCost} credit${generationCost !== 1 ? "s" : ""}.`,
            requiredCredits: generationCost,
            remainingCredits: 0,
            requestedServices,
          },
          { status: 402 }
        );
      }

      if (
        transactionError?.message ===
        "USER_NOT_FOUND"
      ) {
        return NextResponse.json(
          {
            error:
              "User account could not be found.",
          },
          { status: 404 }
        );
      }

      throw transactionError;
    }

    // ========================================================
    // 6. BUILD ONLY THE REQUESTED GENERATION INSTRUCTIONS
    // ========================================================

    const requestedServicesText =
      buildRequestedServicesText(
        requestedServices
      );

    const shouldGenerateCoverLetter =
      requestedServices.includes("coverLetter");

    const shouldGenerateOptimizations =
      requestedServices.includes(
        "cvOptimizations"
      );

    const shouldGenerateOptimizedCV =
      requestedServices.includes("optimizedCV");

    const prompt = `
You are an expert career coach and senior technical recruiter.

Your job is to generate ONLY the services explicitly requested below.

REQUESTED SERVICES:
${requestedServicesText}

============================================================
JOB DESCRIPTION
============================================================

${jobDescription}

============================================================
CANDIDATE CV
============================================================

${cvData}

============================================================
MISSING REQUIRED SKILLS
============================================================

${
  missingSkills.length > 0
    ? missingSkills.join(", ")
    : "None"
}

============================================================
SERVICE RULES
============================================================

IMPORTANT:
- Generate ONLY the requested services.
- Do NOT generate unrequested services.
- For every unrequested service, return an empty string.
- Never invent employers, degrees, certifications, dates,
  achievements, technologies, metrics, or experience.
- Use only information supported by the candidate CV.
- Missing skills may only be incorporated when they are
  genuinely supported by the candidate's background.
- Maintain factual accuracy.

------------------------------------------------------------
COVER LETTER
------------------------------------------------------------

Requested:
${shouldGenerateCoverLetter ? "YES" : "NO"}

${
  shouldGenerateCoverLetter
    ? `
Write a professional, concise and highly targeted cover letter.

Target:
- The specific job description
- The employer/job title when available
- The candidate's real experience and strengths

Do not fabricate experience.
`
    : "DO NOT GENERATE A COVER LETTER."
}

------------------------------------------------------------
CV OPTIMIZATION / TWEAKS
------------------------------------------------------------

Requested:
${shouldGenerateOptimizations ? "YES" : "NO"}

${
  shouldGenerateOptimizations
    ? `
Provide 3-6 actionable CV improvements specifically related
to this job description.

Focus on:
- Missing or weak keywords
- Better wording
- Skills that should be emphasized
- Experience bullet improvements
- ATS alignment
- Relevant measurable evidence

Do not invent qualifications.

Return the recommendations as a clean bulleted list.
`
    : "DO NOT GENERATE CV OPTIMIZATION SUGGESTIONS."
}

------------------------------------------------------------
FULL OPTIMIZED CV
------------------------------------------------------------

Requested:
${shouldGenerateOptimizedCV ? "YES" : "NO"}

${
  shouldGenerateOptimizedCV
    ? `
Rewrite the candidate CV into an ATS-friendly format.

STRICT STRUCTURAL BLUEPRINT:

1. HEADER
   Full Name
   Professional Title
   Phone
   Email
   Location

2. PROFESSIONAL SUMMARY
   3 impactful sentences targeted toward the job.

3. EDUCATIONAL QUALIFICATIONS
   Degree
   Institution
   GPA/Scores
   Retain exact original metrics.

4. PROFESSIONAL EXPERIENCE
   Use strong action verbs.
   Preserve original performance metrics.
   Never fabricate achievements.

5. ACADEMIC PROJECT WORK

6. TECHNICAL SKILLS
   Categorize clearly:
   - Programming Languages
   - Frameworks
   - Databases
   - Tools
   - Other Technical Skills

7. SOFT SKILLS & LANGUAGES

8. REFERENCES

Make the result ATS-friendly, readable and professional.
Do not introduce fake information.
`
    : "DO NOT GENERATE AN OPTIMIZED CV."
}

============================================================
FINAL OUTPUT RULE
============================================================

The JSON response contains exactly these fields:

coverLetter
cvOptimizations
optimizedCV

For every service NOT requested, return:

""

Do not put explanations in unrequested fields.
`;

    // ========================================================
    // 7. GENERATE WITH GEMINI
    // ========================================================

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: generationSchema,
        temperature: 0.2,
      },
    });

    if (!response.text) {
      throw new Error(
        "EMPTY_GENERATION_RESPONSE"
      );
    }

    // ========================================================
    // 8. PARSE AI RESPONSE
    // ========================================================

    let generatedAssets: {
      coverLetter: string;
      cvOptimizations: string;
      optimizedCV: string;
    };

    try {
      generatedAssets = JSON.parse(
        response.text
      );
    } catch {
      throw new Error(
        "INVALID_GENERATION_JSON"
      );
    }

    // ========================================================
    // 9. SAFETY: REMOVE ANY UNREQUESTED OUTPUT
    // ========================================================
    //
    // Even if Gemini accidentally returns something in an
    // unrequested field, we don't expose it to the customer.
    //

    const finalAssets = {
      coverLetter: shouldGenerateCoverLetter
        ? cleanInput(
            generatedAssets.coverLetter,
            MAX_INPUT_LENGTH
          )
        : "",

      cvOptimizations:
        shouldGenerateOptimizations
          ? cleanInput(
              generatedAssets.cvOptimizations,
              MAX_INPUT_LENGTH
            )
          : "",

      optimizedCV: shouldGenerateOptimizedCV
        ? cleanInput(
            generatedAssets.optimizedCV,
            MAX_INPUT_LENGTH
          )
        : "",
    };

    // ========================================================
    // 10. VALIDATE THAT REQUESTED ASSETS WERE GENERATED
    // ========================================================

    const missingGeneratedAssets: string[] = [];

    if (
      shouldGenerateCoverLetter &&
      !finalAssets.coverLetter
    ) {
      missingGeneratedAssets.push(
        "coverLetter"
      );
    }

    if (
      shouldGenerateOptimizations &&
      !finalAssets.cvOptimizations
    ) {
      missingGeneratedAssets.push(
        "cvOptimizations"
      );
    }

    if (
      shouldGenerateOptimizedCV &&
      !finalAssets.optimizedCV
    ) {
      missingGeneratedAssets.push(
        "optimizedCV"
      );
    }

    if (missingGeneratedAssets.length > 0) {
      throw new Error(
        `MISSING_GENERATED_ASSETS:${missingGeneratedAssets.join(",")}`
      );
    }

    // ========================================================
    // 11. SUCCESS
    // ========================================================

    return NextResponse.json({
      ...finalAssets,

      requestedServices,

      creditsUsed: generationCost,

      remainingCredits,

      success: true,
    });
  } catch (error: any) {
    console.error(
      "Asset Generation Error:",
      error
    );

    // ========================================================
    // 12. REFUND CREDITS IF GENERATION FAILED
    // ========================================================
    //
    // This is important.
    //
    // Without this, a customer could lose credits even when
    // Gemini fails or returns invalid output.
    //

    if (userId && chargedCredits > 0) {
      try {
        const userRef = doc(db, "users", userId);

        await runTransaction(
          db,
          async (transaction) => {
            const userDoc =
              await transaction.get(userRef);

            if (!userDoc.exists()) {
              throw new Error(
                "USER_NOT_FOUND_DURING_REFUND"
              );
            }

            const currentCredits =
              typeof userDoc.data().credits ===
              "number"
                ? userDoc.data().credits
                : 0;

            transaction.update(userRef, {
              credits:
                currentCredits + chargedCredits,

              updatedAt: new Date(),
            });
          }
        );

        console.log(
          `Refunded ${chargedCredits} credits to user ${userId}`
        );
      } catch (refundError) {
        // Do not hide the original generation error.
        // Log the refund failure so it can be investigated.
        console.error(
          "CRITICAL: Credit refund failed:",
          refundError
        );
      }
    }

    // ========================================================
    // 13. FRIENDLY ERROR RESPONSE
    // ========================================================

    return NextResponse.json(
      {
        error:
          "We couldn't generate the selected service(s). Your credits have been refunded. Please try again.",
        success: false,
      },
      { status: 500 }
    );
  }
}