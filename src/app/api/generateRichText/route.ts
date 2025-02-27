import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { content }: { content: string } = await req.json();

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({ content: z.string() }),
      system:
        "Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach. When asked to send email, do not assume, ask the user for the email addresses. Do not assume the user actions during tool calls, ask and clarify. Let the user know if you used a past reference retrieve from any tool calls.",
      prompt: `I have the following content: ${content}. Please return it in HTML format, keeping the structure (e.g., paragraphs, bold text, and text alignment).`,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
  }
}
