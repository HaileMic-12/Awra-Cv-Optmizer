import { NextRequest, NextResponse } from "next/server";
import { generateCoverLetter } from "@/lib/ai/cover-letter";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvData, jobDescription } = body;

    if (!cvData) {
      return NextResponse.json(
        { error: "CV context is required to write a cover letter." },
        { status: 400 }
      );
    }

    const coverLetterResult = await generateCoverLetter(cvData, jobDescription);

    return NextResponse.json({
      success: true,
      data: coverLetterResult,
    });
  } catch (error: any) {
    console.error("[COVER_LETTER_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate cover letter." },
      { status: 500 }
    );
  }
}