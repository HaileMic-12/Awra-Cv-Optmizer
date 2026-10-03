import { ai, DEFAULT_MODEL, CAREER_ASSISTANT_SYSTEM_PROMPT } from './gemini';
import { Type, Schema } from '@google/genai';

const optimizerSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    generalFeedback: { type: Type.STRING, description: "Overall advice on the CV's tone and structure." },
    optimizations: {
      type: Type.ARRAY,
      description: "List of specific rewrites for weak bullet points or summaries.",
      items: {
        type: Type.OBJECT,
        properties: {
          section: { type: Type.STRING, description: "e.g., 'Experience', 'Summary', 'Projects'" },
          originalText: { type: Type.STRING, description: "The exact original text from the CV" },
          optimizedText: { type: Type.STRING, description: "The improved, rewritten text" },
          rationale: { type: Type.STRING, description: "Why this change improves ATS matching or readability" }
        }
      }
    }
  },
  required: ["generalFeedback", "optimizations"]
};

export async function optimizeCVContent(parsedCV: any, jobDescription?: string) {
  try {
    const jobContext = jobDescription 
      ? `\n\nTARGET JOB DESCRIPTION:\n${jobDescription}\n(Tailor the optimizations specifically to align with these requirements and keywords.)` 
      : `\n\n(No specific job description provided. Optimize for general best practices, clarity, and impact.)`;

    const prompt = `
      You are an expert Resume Writer. Review the following Candidate CV JSON.
      Identify 3 to 4 of the weakest bullet points, descriptions, or summaries.
      Rewrite them to be more impactful, action-oriented, and metric-driven.
      
      CRITICAL RULE: DO NOT FABRICATE INFORMATION. Do not invent numbers, dates, tools, or roles.
      If a bullet point needs a metric but none is provided, use placeholders like "[Add %, e.g., 20%]" instead of making one up.
      
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
        responseSchema: optimizerSchema,
        temperature: 0.3, // Slight creativity for writing, but strict on facts
      }
    });

    if (!response.text) throw new Error("No response generated");
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error optimizing CV:", error);
    throw new Error("Failed to generate CV optimizations.");
  }
}