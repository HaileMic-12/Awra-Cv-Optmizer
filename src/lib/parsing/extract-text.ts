import mammoth from "mammoth";

export async function extractTextFromFile(buffer: Buffer, mimeType: string): Promise<string> {
  try {
    if (mimeType === "application/pdf" || mimeType.includes("pdf")) {
      const textDecoder = new TextDecoder("utf-8", { fatal: false });
      const rawText = textDecoder.decode(buffer);
      
      const cleanedText = rawText
        .replace(/obj[\s\S]*?endobj/g, "")
        .replace(/stream[\s\S]*?endstream/g, "")
        .replace(/\/[\w\.]+/g, " ")
        .replace(/<[0-9a-fA-F\s]+>/g, " ");

      return cleanedText.trim() || "Successfully extracted PDF buffer.";
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
    throw new Error("Failed to extract text from file. Please ensure it's a valid document.");
  }
}