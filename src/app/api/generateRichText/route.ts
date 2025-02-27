import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { prompt }: { prompt: string } = await req.json();

    const result = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({ content: z.string() }),
      system: "Provide me the format in ProseMirror JSON document",
      prompt: prompt,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
  }
}
