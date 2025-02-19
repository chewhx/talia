import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, streamText, UIMessage } from "ai";
import { tools } from "./tools";
import { processToolCalls } from "./utils";
import { env } from "@/env";
import { Resend } from "resend";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();

    // Logging to check the messages sent are correct
    // console.log(JSON.stringify(messages, null, 2));

    return createDataStreamResponse({
      execute: async (dataStream) => {
        // Utility function to handle tools that require human confirmation
        // Checks for confirmation in last message and then runs associated tool
        const processedMessages = await processToolCalls(
          {
            messages,
            dataStream,
            tools,
          },
          {
            // type-safe object for tools without an execute function
            postToParentsGateway: async ({ result, postType }) => {
              // The real action to post to PG
              // Take the schema and the result, fill the result to the schema
              // Post the schema to extensions
              console.log(`Posted to Parents Gateway: `, {
                result,
                postType,
              });
              return `Posted to Parents Gateway: ${result}`;
            },
            sendEmail: async ({
              emailAddresses,
              emailContent,
              emailSubject,
            }) => {
              if (emailAddresses.length) {
                const resend = new Resend(env.RESEND_API_KEY);

                await resend.emails.send({
                  from: "Talia<me@chewhx.com>",
                  to: emailAddresses,
                  subject: emailSubject,
                  text: emailContent,
                });
              }

              return `Inform the user: "Email sent to ${emailAddresses.join(
                ", "
              )}"`;
            },
          }
        );

        const result = streamText({
          model: openai("gpt-4o-mini"),
          system:
            "You are an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach. When asked to send email, do not assume the email addresses. Ask the user for the email addresses.",
          messages: processedMessages,
          tools,
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (err) {
    console.error(err);
  }
}
