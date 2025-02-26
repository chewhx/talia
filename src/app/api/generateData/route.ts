import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export async function POST(req: Request) {
  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: z.object({
        recipe: z.object({
          name: z.string(),
          ingredients: z.array(
            z.object({ name: z.string(), amount: z.string() })
          ),
          steps: z.array(z.string()),
        }),
      }),
      prompt: "Generate a lasagna recipe.",
    });
  } catch (err) {
    console.error(err);
  }
}
