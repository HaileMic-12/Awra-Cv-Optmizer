import { ai, DEFAULT_MODEL, CAREER_ASSISTANT_SYSTEM_PROMPT } from './gemini';
import { Type, Schema } from '@google/genai';

// Schema for generating questions
const questionsSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          category: { type: Type.STRING, description: "e.g., 'Behavioral', 'Technical', 'Experience'" },
          focus: { type: Type.STRING, description: "What this question is trying to assess." },
          tips: { type: Type.STRING, description: "Quick tip on how to answer it (e.g., Use STAR method)." }
        }
      }
    }
  },
  required: ["questions"]
};

// Schema for evaluating an answer
const evaluationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: { type: Type.INTEGER, description: "Score out of 10 for the answer." },
    feedback: { type: Type.STRING, description: "Constructive feedback on what was good and what was missing." },
    improvedAnswer: { type: Type.STRING, description: "An example of a strong, polished answer based on their actual experience." }
  },
  required: ["score", "feedback", "improvedAnswer"]
};

export async function generateInterviewQuestions(parsedCV: any, jobDescription?: string) {
  const jobContext = jobDescription ? `\nTARGET JOB:\n${jobDescription}` : "";
  const prompt = `
    You are an expert Hiring Manager. Based on the candidate's CV and the target job (if provided), 
    generate 3 highly relevant interview questions. Include 1 Behavioral, 1 Technical/Role-Specific, and 1 Situational question.
    
    CANDIDATE CV:
    ${JSON.stringify(parsedCV, null, 2)}
    ${jobContext}
  `;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: CAREER_ASSISTANT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: questionsSchema,
    }
  });

  return JSON.parse(response.text!);
}

export async function evaluateInterviewAnswer(question: string, answer: string, parsedCV: any) {
  const prompt = `
    You are an expert Interview Coach. Evaluate the candidate's answer to the following interview question.
    
    QUESTION: ${question}
    CANDIDATE'S ANSWER: ${answer}
    
    CANDIDATE BACKGROUND:
    ${JSON.stringify(parsedCV, null, 2)}
    
    Provide a score (out of 10), constructive feedback, and an improved example answer that strictly uses the candidate's actual experience (do not fabricate facts).
  `;

  const response = await ai.models.generateContent({
    model: DEFAULT_MODEL,
    contents: prompt,
    config: {
      systemInstruction: CAREER_ASSISTANT_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: evaluationSchema,
    }
  });

  return JSON.parse(response.text!);
}