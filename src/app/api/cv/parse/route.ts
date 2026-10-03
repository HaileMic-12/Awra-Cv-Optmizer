import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    return NextResponse.json({ success: true, message: "Parser route deprecated." });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to parse" }, { status: 500 });
  }
}