
import mammoth from "mammoth";
import PDFParser from "pdf2json";

export async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    if (
      mimeType === "application/pdf" ||
      mimeType.toLowerCase().includes("pdf")
    ) {
      const text = await extractPdfText(buffer);

      if (!text.trim()) {
        throw new Error("No readable text was found in the PDF.");
      }

      return text.trim();
    }

    if (
      mimeType ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      mimeType.toLowerCase().includes("word")
    ) {
      const result = await mammoth.extractRawText({ buffer });

      return result.value.trim();
    }

    return buffer.toString("utf-8").trim();
  } catch (error) {
    console.error("Extraction error:", error);

    throw new Error(
      "Failed to extract text from file. Please ensure it is a valid PDF or Word document."
    );
  }
}

function extractPdfText(buffer: Buffer): Promise<string> {
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (error: unknown) => {
      reject(error);
    });

    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages = pdfData?.Pages ?? [];

        const text = pages
          .map((page: any) => {
            const texts = page?.Texts ?? [];

            return texts
              .map((item: any) => {
                const runs = item?.R ?? [];

                return runs
                  .map((run: any) => {
                    const encoded = run?.T;

                    if (!encoded) return "";

                    try {
                      return decodeURIComponent(encoded);
                    } catch {
                      return encoded;
                    }
                  })
                  .join("");
              })
              .join(" ");
          })
          .join("\n");

        resolve(text);
      } catch (error) {
        reject(error);
      }
    });

    pdfParser.parseBuffer(buffer);
  });
}
