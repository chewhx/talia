import { env } from "@/env";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, streamText, UIMessage } from "ai";
import dayjs from "dayjs";
import { Resend } from "resend";
import { tools } from "./tools";
import { processToolCalls } from "./utils";

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
    console.log(JSON.stringify(messages, null, 2));

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
            sendEmail: async ({
              emailAddresses,
              emailContent,
              emailSubject,
            }) => {
              if (emailAddresses.length) {
                console.log({
                  emailAddresses,
                  emailContent,
                  emailSubject,
                });
                const resend = new Resend(env.RESEND_API_KEY);

                await resend.emails.send({
                  from: "Talia<me@chewhx.com>",
                  to: emailAddresses,
                  subject: emailSubject,
                  text: emailContent,
                });

                return `Email sent successfully to ${emailAddresses.join(
                  ", "
                )}. Is there anything else I can help you with?`;
              }
              return "No email addresses provided. Please provide email addresses to send the message.";
            },

            createPGAnnouncementDraft: async ({ fields }) => {
              return `
              Announcement draft created with the following fields: ${JSON.stringify(
                fields
              )}
              Would you like to review and modify the draft?
            `;
            },

            createPGFormDraft: async ({ fields }) => {
              return `
              Form draft created with the following fields: ${JSON.stringify(
                fields
              )}
              Would you like to review and modify the draft?
            `;
            },

            createSLSAnnouncement: async ({ fields }) => {
              return `SLS announcement form pre-filled with the following details: ${JSON.stringify(
                fields
              )}
              Is there anything you'd like to add or modify before submission?`;
            },

            createClassroomAnnouncement: async ({ content }) => {
              return `Google Classroom announcement draft created with the following content: "${content}"
              Is there anything you'd like to add or modify before submission?`;
            },
          }
        );

        const result = streamText({
          model: messagesHavePDF
            ? bedrock("anthropic.claude-3-5-sonnet-20240620-v1:0")
            : openai("gpt-4o-mini"),
          system: `Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore.
          Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach.

          Key points:
          - When asked to send email, do not assume, ask the user for the email addresses.
          - Do not assume the user actions during tool calls, ask and clarify. Let the user know if you used a past reference retrieve from any tool calls.
          - When the user ask you to generate or create content, do not assume tool calls. You will always help the user generate content before taking any tool call actions.
          - Maintain a helpful and professional tone, focusing on educational context.
          - Do not reveal internal tool functions name or implementation details to the user.

          Today's date is ${dayjs().format(
            "MM DDDD YYYY"
          )} and the current year is ${dayjs().format("YYYY")}`,
          messages: processedMessages,
          tools,
          maxSteps: 5,
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError(error: any) {
        console.error(error);
        return `I apologize, but an error occurred. Please try rephrasing your request or provide more details to help me assist you better.`;
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(
      "An unexpected error occurred. Please try again later.",
      { status: 500 }
    );
  }
}
