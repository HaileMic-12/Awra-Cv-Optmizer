import mammoth from "mammoth";

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
      // Dynamic require avoids ESM export mismatch issues with pdf-parse in Next.js
      const pdf = require("pdf-parse");
      const data = await pdf(buffer);
      return data.text;
    } 
    
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      mimeType.includes("word")
    ) {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    }

    return buffer.toString("utf-8");
  } catch (error: any) {
    console.error("Extraction error:", error);
    throw new Error("Failed to extract text from file. Please ensure it's a valid text-based PDF or Word document.");
  }
}