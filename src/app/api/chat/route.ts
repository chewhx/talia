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
import { ZodError } from "zod";

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
          system: `Your name is Talia, an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore.
          Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach.

          Key points:
          - When asked to send email, do not assume, ask the user for the email addresses.
          - Do not assume the user actions during tool calls, ask and clarify. Let the user know if you used a past reference retrieve from any tool calls.
          - When the user ask you to generate or create content, do not assume tool calls. You will always help the user generate content before taking any tool call actions.
          - Maintain a helpful and professional tone, focusing on educational context.
          - Do not reveal internal tool functions name or implementation details to the user.
          - Must return the error in a readable format.

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
        // if (NoSuchToolError.isInstance(error)) {
        //   return "The model tried to call a unknown tool.";
        // } else if (InvalidToolArgumentsError.isInstance(error)) {
        //   try {
        //     const zodError = error?.cause || error?.details || error;
        //     console.log({ zodError });

        //     if (zodError.format) {
        //       const formattedErrors = formatZodErrors(zodError);
        //       return `I need some additional or corrected information to complete this action:\n\n${formattedErrors}\n\nCould you provide these details?`;
        //     }

        //     // If we have issues array from Zod
        //     if (zodError.issues && Array.isArray(zodError.issues)) {
        //       const formattedIssues = formatZodIssues(zodError.issues);
        //       return `I need some additional or corrected information to complete this action:\n\n${formattedIssues}\n\nCould you provide these details?`;
        //     }

        //     const toolName = error.toolName || "the requested action";
        //     return `Some information is missing or incorrect for ${toolName}. Could you provide more details?`;
        //   } catch (e) {
        //     console.error("Error parsing Zod validation details:", e);
        //     return "I couldn't process some of the information you provided. Could you try again with more complete details?";
        //   }
        // } else if (ToolExecutionError.isInstance(error)) {
        //   return "An error occurred during tool execution.";
        // }

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

// Recursively extract path and message from nested Zod errors
function extractErrors(obj, path = []) {
  if (!obj) return;

  // Handle leaf nodes (actual error messages)
  if (obj._errors && Array.isArray(obj._errors)) {
    const fullPath = path.join(".");
    obj._errors.forEach((message) => {
      errorDetails.push({
        path: fullPath || "value",
        message: message,
      });
    });
  }

  // Recurse into nested objects
  for (const [key, value] of Object.entries(obj)) {
    if (key !== "_errors" && typeof value === "object") {
      extractErrors(value, [...path, key]);
    }
  }
}

// Helper function to format Zod errors into readable text
function formatZodErrors(zodError) {
  try {
    // Try to get formatted errors if available
    const errorDetails = [];

    // Start extraction from the formatted error
    const formatted = zodError.format();
    extractErrors(formatted);

    // Format the extracted errors
    return errorDetails
      .map((detail) => {
        const readablePath = formatFieldName(detail.path);
        return `- ${readablePath}: ${detail.message}`;
      })
      .join("\n");
  } catch (e) {
    console.error("Error in formatZodErrors:", e);
    return "There were some validation errors with the information provided.";
  }
}

// Helper function specifically for Zod issues array
function formatZodIssues(issues) {
  try {
    const groupedIssues = {};

    // Group issues by path to avoid repetition
    issues.forEach((issue) => {
      const path = issue.path.join(".") || "value";
      if (!groupedIssues[path]) {
        groupedIssues[path] = [];
      }
      groupedIssues[path].push(issue.message);
    });

    // Format grouped issues
    return Object.entries(groupedIssues)
      .map(([path, messages]) => {
        const readablePath = formatFieldName(path);
        return `- ${readablePath}: ${messages.join(", ")}`;
      })
      .join("\n");
  } catch (e) {
    console.error("Error in formatZodIssues:", e);
    return "There were some validation errors with the information provided.";
  }
}

// Helper function to format field names for better readability
function formatFieldName(field) {
  if (typeof field !== "string") return "unknown field";

  return field
    .replace(/([A-Z])/g, " $1") // Insert space before capital letters
    .replace(/\./g, " → ") // Replace dots with arrows for nested paths
    .replace(/_/g, " ") // Replace underscores with spaces
    .trim() // Remove extra spaces
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase()); // Capitalize first letter
}
