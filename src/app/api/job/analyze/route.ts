import { NextRequest, NextResponse } from "next/server";
import { calculateATSScore } from "@/lib/ai/ats-scorer";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cvData, jobDescription } = body;

    if (!cvData || !jobDescription) {
      return NextResponse.json(
        { error: "Both CV context and Job Description are required." },
        { status: 400 }
      );
    }

    const atsResult = await calculateATSScore(cvData, jobDescription);

    return NextResponse.json({
      success: true,
      data: atsResult,
    });
  } catch (error: any) {
    console.error("[ATS_ANALYZE_ERROR]", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze job." },
      { status: 500 }
    );
  }
}