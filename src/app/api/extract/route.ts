import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Use require to bypass any strict TypeScript typing issues for pdf2json
    const PDFParser = require("pdf2json");

    // pdf2json operates on callbacks, so we wrap it in a modern Promise
    return await new Promise((resolve) => {
      const pdfParser = new PDFParser(null, 1); // The '1' tells it to extract pure text

      pdfParser.on("pdfParser_dataError", (errData: any) => {
        console.error("Parse Error:", errData.parserError);
        resolve(NextResponse.json({ error: "Failed to parse PDF" }, { status: 500 }));
      });

      pdfParser.on("pdfParser_dataReady", () => {
        const extractedText = pdfParser.getRawTextContent();
        resolve(NextResponse.json({ text: extractedText }));
      });

      pdfParser.parseBuffer(buffer);
    });
    
  } catch (error) {
    console.error("PDF Extraction Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}