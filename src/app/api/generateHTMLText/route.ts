import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { message }: { message: string } = await req.json();

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({ message: z.string() }),
      system:
        "Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to facilitate staff in creating and writing content for their newsletter, bulletin boards, and school outreach.",
      prompt: `I have the following content: ${message}.
      Please return it in TinyVue format,
        - Use proper HTML tags for formatting
        - Use <p> for paragraphs
        - Use <strong> for bold text
        - Use <ul> and <li> for lists
        - USe <br> for line breaks
        - Informative and motivating content
      You must reserving the exact structure, including paragraphs, line breaks, bold text, text alignment, and any other formatting present in the original content.
      Use appropriate HTML tags to maintain the original structure and styling.`,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
  }
}
