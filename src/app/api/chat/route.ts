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
import UserData from "../../../mock-user-data/user-data.json";
import { CalendarEvent } from "@/utils/calendar";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

type ChatProps = {
  messages: UIMessage[];
  data: any;
  calendarEvents: CalendarEvent[];
};

export async function POST(req: Request) {
  try {
    const { messages, data, calendarEvents }: ChatProps = await req.json();

    // Check PDF Existent
    const messagesHavePDF = messages.some((message) =>
      message.experimental_attachments?.some(
        (a) => a.contentType === "application/pdf"
      )
    );

    // Append Error Message
    if (data?.error) {
      messages.push(createErrorMessage(data.error));
    }

    // Generate System Prompt
    const systemPrompt = await generateSystemPrompt(calendarEvents);

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const processedMessages = await processToolCalls(
          {
            messages,
            dataStream,
            tools,
          },
          toolHandlers()
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
      onError: handleError,
    });
  } catch (err) {
    console.error("Route error: ", err);
    return new Response("An unexpected error occurred. Please try again.", {
      status: 500,
    });
  }
}

async function generateSystemPrompt(calendarEvents: CalendarEvent[]) {
  const markdownFilePath = path.join(
    process.cwd(),
    "shared",
    "system-prompt-v5.md"
  );

  let prompt = fs.readFileSync(markdownFilePath, "utf-8");

  const userEmail = (await getCookie("user_email")) as keyof typeof UserData;
  const { HODEmail, HODName, displayName, emailAddress } =
    UserData?.[userEmail] || {};

  // User Info Section
  prompt += `
    ## **User Information**
      - **User Name:** ${displayName}
      - **Email:** ${emailAddress}
      - **User HOD:** ${HODName}
      - **HOD Email:** ${HODEmail}

    ## **Additional Context**

      - **User Name:** ${displayName}
      - **User Email:** ${emailAddress}
      - **User HOD:** ${HODName}
      - **HOD Email:** ${HODEmail}
      - **User's Google Calendar Events:** ${
        calendarEvents && calendarEvents.length > 0
          ? JSON.stringify(calendarEvents, null, 2)
          : ""
      }
      - **Current Date and Year:** ${dayjs().format("MMMM D, YYYY")}

    ---
  `;

  console.log({ prompt });

  // User's calendar events
  // if (calendarEvents && calendarEvents.length > 0) {
  //   prompt += `
  //     **If there are any events in Google Calendar matching the same topic/event/title, automatically draft the content using those details.
  //     - Make the content align with the format.
  //     - Make sure to clearly inform the user that the data is sourced from Google Calendar.**
  //     - **Google Calendar Events:**
  //       ${JSON.stringify(calendarEvents, null, 2)}
  //   `;
  // }

  // console.log("System Prompt: ", prompt);

  return prompt;
}

function createErrorMessage(error: string): UIMessage {
  const content = `Please refine the content while considering the following restriction: "${
    error || "The data may be invalid or incomplete."
  }". If the issue persists, analyze the data and improve it as needed to enhance clarity and correctness. Also, you can ask me any question that you want to clarify!
    `;

  return {
    content,
    id: generateId(),
    role: "assistant",
    parts: [
      {
        type: "text",
        text: content,
      },
    ],
  };
}

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
    console.error("Error parsing the error message.");
    return null;
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

function handleError(error: any) {
  console.log("Tool Error: ", error);

  if (NoSuchToolError.isInstance(error)) {
    console.error("An error occurred: The model tried to use an unknown tool.");
  } else if (ToolExecutionError.isInstance(error)) {
    console.error(
      "An error occurred while executing a tool. Please try again."
    );
  } else if (InvalidToolArgumentsError.isInstance(error)) {
    const platform = extractToolPlatform(error.toolName);
    const errors = extractZodErrors(error.message);

    if (errors) {
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
  }

  return "An unexpected error occurred. Please try again.";
}

function toolHandlers() {
  return {
    sendEmail: async ({
      emailAddresses,
      emailContent,
      emailSubject,
      emailCCAddress,
    }: {
      emailAddresses: string[];
      emailContent: string;
      emailSubject: string;
      emailCCAddress?: string[];
    }) => {
      if (!emailAddresses.length) {
        return "No email addresses provided. Please provide at least one recipient to send the message.";
      }

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
        ${emailAddresses.map((email: string) => `- ${email}`).join("\n")}

        ${
          emailCCAddress?.length
            ? `**CC:**\n${emailCCAddress
                .map((email: string) => `- ${email}`)
                .join("\n")}`
            : ""
        }

        Is there anything else I can assist you with?`;
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
  };
}
