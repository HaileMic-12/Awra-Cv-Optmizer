import { NextRequest, NextResponse } from "next/server";
import { generateInterviewQuestions } from "@/lib/ai/interview";

export async function POST(req: NextRequest) {
  try {
    const { cvData, jobDescription } = await req.json();
    if (!cvData) return NextResponse.json({ error: "CV context is required." }, { status: 400 });

    const data = await generateInterviewQuestions(cvData, jobDescription);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate questions." }, { status: 500 });
  }
}