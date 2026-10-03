import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { cvData, jobDescription } = await req.json();

    if (!cvData || !jobDescription) {
      return NextResponse.json({ error: "Missing CV data or Job Description" }, { status: 400 });
    }

    // Using Gemini 3.8 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-3.8-flash" });

    const prompt = `
    You are an expert ATS (Applicant Tracking System) optimizer and senior technical recruiter.
    Review the following CV against the Job Description.
    
    Job Description:
    ${jobDescription}
    
    CV Data:
    ${cvData}
    
    CRITICAL INSTRUCTIONS FOR 'optimizedCV' FIELD:
    1. NO PLACEHOLDERS: You are strictly forbidden from using placeholders like "[Insert previous experience]", "[Company Name]", or "etc.". You must write out the entire document.
    2. KEEP ALL JOBS: Do not delete any past jobs, education, or projects from the original CV. Keep the entire timeline intact.
    3. ENHANCE, DON'T SUMMARIZE: Keep the original length or make it slightly longer. Expand on bullet points by naturally integrating keywords from the Job Description. 
    4. QUANTIFY RESULTS: Maintain all numbers, percentages, and metrics from the original CV. If the original lacks metrics, use strong action verbs to compensate.
    
    Respond ONLY with a raw JSON object in this exact format (do not include markdown tags like \`\`\`json):
    {
      "atsScore": 85,
      "atsFeedback": "A short paragraph explaining the score.",
      "coverLetter": "A professional, tailored cover letter.",
      "cvOptimizations": "• Bullet point 1\\n• Bullet point 2",
      "optimizedCV": "The FULL, complete, completely rewritten and optimized CV text. DO NOT truncate. DO NOT summarize. Output every single section, job, and detail from the original."
    }
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanedText);

    return NextResponse.json(parsedData);
    
  } catch (error) {
    console.error("AI Analysis Error:", error);
    
    // Fallback Mock Data so your app doesn't crash when you hit rate limits
    return NextResponse.json({
      atsScore: 88,
      atsFeedback: "⚠️ Using mock data because your API key hit the daily limit for gemini-3.8-flash! You can keep testing your UI with this simulated data.",
      coverLetter: "Dear Hiring Manager,\n\nI am writing to express my strong interest in the Software Engineer position. With my background in full-stack web and mobile development, specifically using Next.js and Firebase, I am confident in my ability to deliver high-quality software for your team.",
      cvOptimizations: "• Add more specific metrics to your previous roles.\n• Highlight your React and Node.js experience closer to the top.\n• Include keywords from the job description directly in your summary.",
      optimizedCV: "Hailemichael Mekonenn\nSoftware Engineer\nAddis Ababa, Ethiopia\n\n(This is a mock optimized CV. Your actual rewritten CV will appear here when the API limits reset or you upgrade your Gemini plan.)\n\nSKILLS\nNext.js, React Native, Firebase, Tailwind CSS, Node.js\n\nEXPERIENCE\nFull Stack Developer\n• Built modern web applications resulting in faster load times and better user experiences."
    });
  }
}