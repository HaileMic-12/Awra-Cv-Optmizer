import mammoth from "mammoth";

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
      // Fully inline dynamic load to bypass Turbopack's static import checks
      const pdfParse = (await eval('import("pdf-parse")')).default;
      const data = await pdfParse(buffer);
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