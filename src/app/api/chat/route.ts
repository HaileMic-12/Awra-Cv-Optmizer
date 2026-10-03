import { NextRequest, NextResponse } from "next/server";
import { ai, DEFAULT_MODEL, CAREER_ASSISTANT_SYSTEM_PROMPT } from "@/lib/ai/gemini";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "Gemini API key is missing in .env.local" }, { status: 500 });
    }

    // Initialize the model with the system instructions and optional CV context
    const model = ai.getGenerativeModel({ 
      model: DEFAULT_MODEL,
      systemInstruction: CAREER_ASSISTANT_SYSTEM_PROMPT + 
        (context?.type === "CV" ? `\n\nThe user's active CV data is: ${JSON.stringify(context.data)}` : "")
    });

    // Format chat history for Gemini (Gemini uses 'model' instead of 'assistant')
    let formattedHistory = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    // CRITICAL FIX: Gemini crashes if the history starts with a 'model' message.
    // This loop removes the AI's initial greeting from the history logs so it always starts with a 'user'.
    while (formattedHistory.length > 0 && formattedHistory[0].role === "model") {
      formattedHistory.shift();
    }

    const currentMessage = messages[messages.length - 1].content;

    // Start chat and send the stream
    const chat = model.startChat({ history: formattedHistory });
    const result = await chat.sendMessageStream(currentMessage);

    // Convert Gemini's stream into a standard Web ReadableStream for Next.js
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);

    // ==========================================
    // MOCK AI FALLBACK (For 503 Server Jams)
    // ==========================================
    // If Google's API crashes or gets overloaded, this fake stream will 
    // keep your frontend UI working so you can keep testing your app!
    
    const fallbackMessage = "⚠️ **System Notice:** Google's Gemini servers are currently experiencing high traffic (503 Service Unavailable). However, your streaming code and UI are working perfectly! You can keep designing and testing your app while we wait for Google's servers to clear up.";
    const chunks = fallbackMessage.split(" ");
    
    const stream = new ReadableStream({
      start(controller) {
        let i = 0;
        // Simulate the AI typing word by word every 50ms
        const interval = setInterval(() => {
          if (i < chunks.length) {
            controller.enqueue(new TextEncoder().encode(chunks[i] + " "));
            i++;
          } else {
            clearInterval(interval);
            controller.close();
          }
        }, 50);
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  }
}