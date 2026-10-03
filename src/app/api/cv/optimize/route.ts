import { NextRequest, NextResponse } from "next/server";
import { optimizeCVContent } from "@/lib/ai/cv-optimizer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvData, jobDescription } = body;

    if (!cvData) {
      return NextResponse.json(
        { error: "CV context is required for optimization." },
        { status: 400 }
      );
    }

    const optimizationResult = await optimizeCVContent(cvData, jobDescription);

    return NextResponse.json({
      success: true,
      data: optimizationResult,
    });
  } catch (error: any) {
    console.error("[CV_OPTIMIZE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to optimize CV." },
      { status: 500 }
    );
  }
}