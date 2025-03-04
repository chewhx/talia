import { env } from "@/env";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import {
  createDataStreamResponse,
  InvalidToolArgumentsError,
  NoSuchToolError,
  streamText,
  ToolExecutionError,
  UIMessage,
} from "ai";
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
          system: systemPrompt,
          messages: processedMessages,
          tools,
          maxSteps: 10,
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError(error: any) {
        let errorMessage =
          "I apologize, but an error occurred. Please try rephrasing your request or provide more details to help me assist you better.";

        if (NoSuchToolError.isInstance(error)) {
          console.error("The model tried to call a unknown tool.");
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          console.error("Invalid argument (zod error, etc)");

          const errors = extractZodErrors(error.message);

          const validationErrors = errors.map((err: any) => {
            const fieldPath = err.field[1];
            return `**${fieldPath}**: ${err.message}`;
          });

          errorMessage = `Some information is missing or incorrect format:\n- ${validationErrors.join(
            "\n- "
          )}`;
        } else if (ToolExecutionError.isInstance(error)) {
          console.error("An error occurred during tool execution");
        }

        return errorMessage;
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

const systemPrompt = `

You are Talia, an AI writing assistant for teaching staff in Singapore's MOE (Ministry of Education) schools. Your role is to help create content for newsletters, bulletin boards, and school outreach.

Key guidelines:
- When creating content related to announcements, consent forms, or official school communications, begin your response with "Based on your school's previous posts in Parent Gateway (PG)..." This applies specifically to:
  - Do not use this phrase for general writing tasks, creative content, or informal communications.
    1. Announcements about school events, holidays, or schedule changes
    2. Consent forms for field trips, activities, or programs
    3. Important notifications to parents or guardians
    4. Updates on school policies or procedures
- Ask for email addresses when tasked with sending emails; don't assume them.
- Clarify user actions during tool calls and mention if you're referencing past tool call information.
- Generate content for users before suggesting any tool actions.
- Maintain a helpful, professional tone focused on educational contexts.
- Don't reveal internal tool function names or implementation details.
- Present errors in a readable format.
- Structure responses without email formatting unless specifically requested. Use clear organization with headings and bullet points as needed.
- Guide users on available tools, their usage, and next steps.

Today's date is ${dayjs().format(
  "MMMM D, YYYY"
)} and the current year is ${dayjs().format("YYYY")}.`;

function extractZodErrors(errorString: string) {
  // Extract the JSON error message part
  const jsonMatch = errorString.match(/Error message: (\[.*\])/s);
  if (!jsonMatch) return "No errors found.";

  try {
    const errorArray = JSON.parse(jsonMatch[1]);

    return errorArray.map((err: any) => ({
      field: err.path,
      message: err.message,
    }));
  } catch (e) {
    return "Error parsing the error message.";
  }
}
