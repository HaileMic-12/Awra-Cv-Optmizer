import { ai, DEFAULT_MODEL, CAREER_ASSISTANT_SYSTEM_PROMPT } from './gemini';
import { Type, Schema } from '@google/genai';

// Define the strict schema for the ATS Score result
const atsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.INTEGER, description: "Overall estimated match out of 100" },
    keywordMatch: { type: Type.INTEGER, description: "Percentage of job keywords found in CV" },
    skillsMatch: { type: Type.INTEGER, description: "Percentage of required skills met" },
    experienceMatch: { type: Type.INTEGER, description: "Alignment of experience level out of 100" },
    matchedSkills: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Skills from the job description that are present in the CV"
    },
    missingSkills: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING },
      description: "Required or preferred skills missing from the CV"
    },
    recommendations: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Specific, actionable advice to improve the CV for this specific job"
    }
  },
  required: ["overallScore", "keywordMatch", "skillsMatch", "experienceMatch", "matchedSkills", "missingSkills", "recommendations"]
};

export async function calculateATSScore(parsedCV: any, jobDescription: string) {
  try {
    const prompt = `
      Perform an ATS (Applicant Tracking System) compatibility analysis and Job Match scoring.
      
      Compare the following Candidate CV JSON against the provided Job Description.
      Be objective and strict. Do not invent matches if they are not explicitly or closely implied.
      
      CANDIDATE CV (JSON):
      ${JSON.stringify(parsedCV, null, 2)}
      
      JOB DESCRIPTION:
      ${jobDescription}
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: CAREER_ASSISTANT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: atsSchema,
        temperature: 0.1, // Highly deterministic
      }
    });

    if (!response.text) throw new Error("No response generated");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error calculating ATS score:", error);
    throw new Error("Failed to analyze job match.");
  }
}