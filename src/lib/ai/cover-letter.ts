import { ai, DEFAULT_MODEL, CAREER_ASSISTANT_SYSTEM_PROMPT } from './gemini';
import { Type, Schema } from '@google/genai';

const coverLetterSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    subject: { type: Type.STRING, description: "A professional subject line for an email application." },
    body: { 
      type: Type.STRING, 
      description: "The full text of the cover letter. Use standard paragraph breaks. Do NOT include placeholder brackets like [Date] or [Company Name] if the information is missing, write around it smoothly." 
    }
  },
  required: ["subject", "body"]
};

export async function generateCoverLetter(parsedCV: any, jobDescription?: string) {
  try {
    const jobContext = jobDescription 
      ? `\n\nTARGET JOB DESCRIPTION:\n${jobDescription}` 
      : `\n\n(No specific job description provided. Write a strong, general cover letter based on the candidate's headline and top skills.)`;

    const prompt = `
      You are an expert Executive Career Coach and Resume Writer. 
      Write a highly tailored, compelling cover letter for the candidate based on their CV and the target job description.
      
      CRITICAL RULES:
      1. DO NOT fabricate experience, metrics, or skills that are not in the CV.
      2. Keep it concise (3-4 paragraphs max).
      3. Adopt a confident, professional, yet engaging tone.
      4. Highlight specific intersections between the candidate's CV and the job requirements.
      5. Sign off using the candidate's name from the CV.
      
      CANDIDATE CV (JSON):
      ${JSON.stringify(parsedCV, null, 2)}
      ${jobContext}
    `;

    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction: CAREER_ASSISTANT_SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: coverLetterSchema,
        temperature: 0.6, // Higher temperature for more natural, engaging writing flow
      }
    });

    if (!response.text) throw new Error("No response generated");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating cover letter:", error);
    throw new Error("Failed to generate cover letter.");
  }
}