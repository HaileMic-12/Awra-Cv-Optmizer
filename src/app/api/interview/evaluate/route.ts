import { NextRequest, NextResponse } from "next/server";
import { evaluateInterviewAnswer } from "@/lib/ai/interview";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, cvData } = await req.json();
    if (!question || !answer || !cvData) {
      return NextResponse.json({ error: "Question, answer, and CV context are required." }, { status: 400 });
    }

    const data = await evaluateInterviewAnswer(question, answer, cvData);
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to evaluate answer." }, { status: 500 });
  }
}