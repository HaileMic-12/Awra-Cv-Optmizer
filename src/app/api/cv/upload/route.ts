import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parsing/extract-text";
import { parseCVTextToJSON } from "@/lib/ai/cv-parser";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Convert Next.js File object to Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Extract raw text from the file
    const rawText = await extractTextFromFile(buffer, file.type);

    // 2. Pass the extracted text to our Gemini AI tool
    const structuredCV = await parseCVTextToJSON(rawText);

    return NextResponse.json({
      success: true,
      message: "CV processed successfully",
      data: structuredCV,
    });
  } catch (error: any) {
    console.error("[UPLOAD_CV_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred during processing." },
      { status: 500 }
    );
  }
}