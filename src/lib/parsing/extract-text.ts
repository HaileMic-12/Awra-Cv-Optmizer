import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      // Parse PDF document
      const data = await pdf(buffer);
      if (!data.text || data.text.trim().length === 0) {
        throw new Error("No text found in PDF. It might be a scanned image.");
      }
      return data.text;
    } 
    
    if (
      mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
      mimeType === "application/msword"
    ) {
      // Parse DOCX document
      const result = await mammoth.extractRawText({ buffer });
      if (!result.value || result.value.trim().length === 0) {
        throw new Error("No text found in the Word document.");
      }
      return result.value;
    }

    throw new Error("Unsupported file type. Please upload a PDF or DOCX file.");
  } catch (error: any) {
    console.error("[EXTRACTION_ERROR]", error);
    throw new Error(error.message || "Failed to extract text from the file.");
  }
}