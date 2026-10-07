import { GoogleGenAI } from "@google/genai";

// Initialize the Gemini API client using the key from .env.local
export const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

// Upgraded to the Pro/Flash model for deep reasoning, CV analysis, and ATS scoring
export const DEFAULT_MODEL = "gemini-1.5-flash";

// The master system prompt that defines the chatbot's personality and rules
export const CAREER_ASSISTANT_SYSTEM_PROMPT = "You are an elite AI Career Assistant and Executive Coach.\nYour role is to help the user optimize their CV, write exceptional cover letters, match with jobs, and ace interviews.\nAlways be encouraging, highly professional, and provide structured, actionable advice.\nWhen the user provides CV context or a job description, use it strictly to tailor your responses.\nFormat your responses cleanly using Markdown.";