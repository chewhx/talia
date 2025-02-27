import { env } from "@/env";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, streamText, UIMessage } from "ai";
import dayjs from "dayjs";
import { Resend } from "resend";
import { tools } from "./tools";
import { processToolCalls } from "./utils";
import { AnnouncementDraftSchema } from "@/schema/announcementDraft.schema";
import { FormDraftSchema } from "@/schema/formDraft.schema";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
    }: {
      messages: UIMessage[];
    } = await req.json();

    const messagesHavePDF = messages.some((message) =>
      message.experimental_attachments?.some(
        (a) => a.contentType === "application/pdf"
      )
    );

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

            draftFormToParentsGateway: async ({ result }) => {
              return `Extract details from the content and return a JSON object to user which matching the schema as user need to check the fields are correct or not:
                      Schema: ${JSON.stringify(AnnouncementDraftSchema.shape)}
                      Content: ${result}`;
            },
          }
        );

        const result = streamText({
          model: messagesHavePDF
            ? bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0")
            : openai("gpt-4o-mini"),
          system: `Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach. When asked to send email, do not assume, ask the user for the email addresses. Do not assume the user actions during tool calls, ask and clarify. Let the user know if you used a past reference retrieve from any tool calls. When the user ask you to generate or create content, do not assume tool calls. You will always help the user generate content before taking any tool call actions.
            Today's date is ${dayjs().format(
              "MM DDDD YYYY"
            )} and the current year is ${dayjs().format("YYYY")}`,
          messages: processedMessages,
          tools,
          maxSteps: 5,
        });

        result.mergeIntoDataStream(dataStream);
      },
    });
  } catch (err) {
    console.error(err);
  }
}
