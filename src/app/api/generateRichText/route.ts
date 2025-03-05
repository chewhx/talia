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
        "Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to facilitate staff in creating and writing content for their newsletter, bulletin boards, and school outreach.",
      prompt: `Please convert the following content to a semantically correct and well-structured HTML format that precisely preserves:

1. Paragraph Structure:
   - Wrap each paragraph in '<p>' tags
   - Maintain the exact spacing and line breaks between paragraphs
   - Preserve paragraph order

2. Text Formatting:
   - Use '<strong>' for bold text
   - Use '<em>' for italic text
   - Use '<u>' for underlined text
   - Preserve any existing formatting exactly as it appears in the original content

3. List Handling:
   - Convert markdown-style lists to proper HTML lists
   - Use '<ul>' for unordered (bullet) lists
   - Use '<ol>' for ordered (numbered) lists
   - Ensure list items are wrapped in '<li>' tags

4. Special Considerations:
   - Escape any special HTML characters (like < or >)
   - Maintain any email addresses or placeholders exactly as they appear
   - Preserve text alignment if specified in the original content

5. Additional Requirements:
   - Generate clean, semantic HTML
   - Ensure the output is valid HTML5
   - Do not add any unnecessary styling or classes unless explicitly part of the original content

Content to convert:
"${content}"

Please return ONLY the HTML output without any additional commentary or explanation.
      `,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
  }
}
