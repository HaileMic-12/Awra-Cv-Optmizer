import { NextRequest, NextResponse } from "next/server";
import { extractTextFromFile } from "@/lib/parsing/extract-text";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const extractedText = await extractTextFromFile(buffer, file.type);

    return NextResponse.json({ success: true, text: extractedText });
  } catch (error: any) {
    console.error("Upload parse error:", error);
    return NextResponse.json({ error: error.message || "Failed to process file" }, { status: 500 });
  }
}