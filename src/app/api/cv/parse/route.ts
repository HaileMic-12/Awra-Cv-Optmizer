import { NextRequest, NextResponse } from "next/server";
import { parseCVTextToJSON } from "@/lib/ai/cv-parser";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "Valid resume text is required." },
        { status: 400 }
      );
    }

    // Call our server-side Gemini wrapper
    const structuredCV = await parseCVTextToJSON(text);

    return NextResponse.json({
      success: true,
      data: structuredCV,
    });
  } catch (error: any) {
    console.error("[CV_PARSE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to process CV." },
      { status: 500 }
    );
  }
}