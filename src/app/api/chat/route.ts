import { env } from "@/env";
import { formatKey } from "@/utils/helper";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { openai } from "@ai-sdk/openai";
import {
  createDataStreamResponse,
  generateId,
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
import fs from "fs";
import path from "path";
import { getCookie } from "@/app/actions";
import UserData from "../../../config/user-data.json";
import { CalendarEvent } from "@/utils/calendar";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      data,
      calendarEvents,
    }: {
      messages: UIMessage[];
      data: any;
      calendarEvents: CalendarEvent[];
    } = await req.json();

    const messagesHavePDF = messages.some((message) =>
      message.experimental_attachments?.some(
        (a) => a.contentType === "application/pdf"
      )
    );

    if (data?.error) {
      const content = `Please refine the content while considering the following restriction: "${
        data?.error || "The data may be invalid or incomplete."
      }". If the issue persists, analyze the data and improve it as needed to enhance clarity and correctness. Also, you can ask me any question that you want to clarify!
        `;

      messages.push({
        content: content,
        id: generateId(),
        role: "assistant",
        parts: [
          {
            type: "text",
            text: content,
          },
        ],
      });
    }

    const systemPrompt = await generateSystemPrompt(calendarEvents);

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
            sendEmail: async ({
              emailAddresses,
              emailContent,
              emailSubject,
              emailCCAddress,
            }) => {
              if (emailAddresses.length) {
                const resend = new Resend(env.RESEND_API_KEY);

                await resend.emails.send({
                  from: "Talia<me@chewhx.com>",
                  to: emailAddresses,
                  subject: emailSubject,
                  cc: emailCCAddress ?? [],
                  html: emailContent,
                });

                return `✅ Email sent successfully.

                **Recipients:**
                ${emailAddresses.map((email) => `- ${email}`).join("\n")}

                ${
                  emailCCAddress?.length
                    ? `**CC:**\n${emailCCAddress
                        .map((email) => `- ${email}`)
                        .join("\n")}`
                    : ""
                }

                Is there anything else I can assist you with?`;
              }
              return "No email addresses provided. Please provide at least one recipient to send the message.";
            },
            createPGAnnouncementDraft: async () => {
              return `Your announcement draft has been successfully created.
              You can review it on the Parent Gateway webpage.

              Note: Currently, modifications cannot be made directly through this system.
              If you need to make changes, please edit the draft manually on the Parent Gateway website.

              Let me know if you need any guidance!`;
            },

            createPGFormDraft: async () => {
              return `
              Your consent form draft has been successfully created.
              You can review it on the Parent Gateway webpage.

              Note: Currently, modifications cannot be made directly through this system.
              If you need to make changes, please edit the draft manually on the Parent Gateway website.

              Let me know if you need any guidance!
            `;
            },

            createSLSAnnouncement: async () => {
              return ` Your SLS announcement form has been pre-filled.
              You can review it on the Student Learning Space (SLS) website.

              Need changes? I can update and re-prefill it for you, or you can edit it manually.
              `;
            },

            createClassroomAnnouncement: async () => {
              return `Your Google Classroom announcement draft has been pre-filled.
              You can review it on the Google Classroom website.

              Need modifications? I can update and re-prefill it for you, or you can edit it manually.
             `;
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
          maxSteps: 5,
        });

        result.mergeIntoDataStream(dataStream);
      },
      onError(error: any) {
        console.log("Route Error: ", error);
        const errorMessage = "An unexpected error occurred. Please try again.";

        if (NoSuchToolError.isInstance(error)) {
          console.error("The model tried to call a unknown tool.");
        } else if (ToolExecutionError.isInstance(error)) {
          console.error("An error occurred during tool execution");
        } else if (InvalidToolArgumentsError.isInstance(error)) {
          const platform = extractToolPlatform(error.toolName);
          const errors = extractZodErrors(error.message);

          let startOfMessage = "";
          let endOfMessage = "";

          if (platform) {
            startOfMessage = `There are some requirements on **${platform}**: `;
            endOfMessage = `Please click **Retry** to regenerate or modify your prompt for better results. You can also adjust your input to help AI generate a more accurate response.`;
          }

          const validationErrors = errors.map((err: any) => {
            const fieldPath = err.field[1];
            return `**${formatKey(fieldPath)}**: ${
              err.message === "Invalid"
                ? "The field is missing or in an incorrect format (e.g., Date, Time)"
                : err.message
            }`;
          });

          return `${startOfMessage}\n- ${validationErrors.join(
            "\n- "
          )}\n\n${endOfMessage}`;
        }

        return errorMessage;
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("An unexpected error occurred. Please try again.", {
      status: 500,
    });
  }
}

const generateSystemPrompt = async (calendarEvents: CalendarEvent[]) => {
  const markdownFilePath = path.join(
    process.cwd(),
    "shared",
    "system-prompt.md"
  );

  let fileContent = fs.readFileSync(markdownFilePath, "utf-8");

  const userEmail = (await getCookie("user_email")) as keyof typeof UserData;
  const { HODEmail, HODName, displayName, emailAddress } =
    UserData?.[userEmail];

  fileContent += `\n\n
  ## **User Information**
    - **User Name:** ${displayName}
    - **Email:** ${emailAddress}
    - **User HOD:** ${HODName}
    - **HOD Email:** ${HODEmail}
    `;

  if (calendarEvents && calendarEvents.length > 0) {
    fileContent += `\n\n
      **Please auto fill in the draft content if there are any same topic/event with the Google Calendar.**
      You must inform user that the data is from Google Calendar!
      Calendar: ${JSON.stringify(calendarEvents, null, 2)}
    `;
  }

  fileContent += `
  ## **Others**
  - You should ensure that all dates reflect the current year. If a past reference uses a previous year (e.g., 2024), update it to the correct year (e.g., 2025) while maintaining the correct day and date for recurring events (e.g., National Day in Singapore should remain on August 9, regardless of the year). Use the provided date utility (e.g., dayjs) to ensure accuracy, given current year and date is: ${dayjs().format(
    "MMMM D, YYYY"
  )}
  `;

  return fileContent;
};

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

function extractToolPlatform(toolName: string) {
  switch (toolName) {
    case "createPGFormDraft":
    case "createPGAnnouncementDraft":
      return "Parent Gateway (PG)";
    case "createSLSAnnouncement":
      return "Student Learning Space (SLS)";
    case "createClassroomAnnouncement":
      return "Google Classroom";
  }
  return null;
}
