import { AnnouncementDraftSchema } from "@/schema/announcementDraft.schema";
import { FormDraftSchema } from "@/schema/formDraft.schema";
import { StudentLearningSpacePrefillSchema } from "@/schema/studentLearningSpace.schema";
import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { tool } from "ai";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { z } from "zod";
import { APPROVAL } from "./utils";

export type ToolOption = {
  title: string;
  description: string;
  result: string;
};

dayjs.extend(customParseFormat);

const DAYS_OF_WEEK = {
  0: "Sunday",
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
} as const;

const getDayOfTheWeek = tool({
  description:
    "Get the day of the week based on a given date, for assistant to produce response with accurate date and day.",
  parameters: z.object({
    year: z.number().describe("Four-digit year"),
    month: z.number().describe("Month, 2-digits, beginning at 01"),
    day: z.number().describe("Day of month, 2-digits"),
  }),
  execute: async ({ year, month, day }): Promise<string> => {
    return DAYS_OF_WEEK[dayjs(`${year}-${month}-${day}`).day()];
  },
});

const sendEmail = tool({
  description:
    "Send an email to the specified recipients upon request, regardless of the content. Should ask any CC recipients. Accepts any valid email address, including CC recipients if provided. It must be in HTML format!",
  parameters: z.object({
    // emailContent: z.string().describe("Markdown content of the email"),
    emailContent: z.string().describe("Content of the email in HTML format"),
    emailSubject: z
      .string()
      .describe("Email subject that defines the email content"),
    emailAddresses: z
      .array(z.string())
      .describe(
        "List of recipient email addresses. Can be any valid email address."
      ),
    emailCCAddress: z
      .array(z.string())
      .optional()
      .describe(
        "List of carbon copy (CC) email addresses. Can be any valid email addresses."
      ),
  }),
});

const retrieveResource = tool({
  description:
    "Retrieve a relevant resource from database, should the user mention to reference to past materials",
  parameters: z.object({
    query: z
      .string()
      .describe(
        "the user prompt or query string to search the database for relevant resources"
      ),
  }),
  execute: async ({ query }) => {
    try {
      const awsBedrockClient = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });

      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: process.env.AWS_BEDROCK_KNOWLEDGEBASE_ID,
        retrievalQuery: {
          text: query,
        },
      });

      const response = await awsBedrockClient.send(retrieveCommand);

      const relevantPastContent = response.retrievalResults
        ?.filter((e) => (e?.score || 0) >= 0.5)
        .slice(0, 5)
        .map((e) => e.content?.text);

      return `Based the tone and style of your writing on the following past references (if any):
      ${relevantPastContent?.join("\n----\n")}
      `;
    } catch (err) {
      console.error(err);
      return "";
    }
  },
});

const createPGFormDraft = tool({
  description: `Create a Parent Gateway (PG) consent form draft. Default email: parentsgateway.otp@gmail.com. Custom email allowed only from @gmail.com, @moe.edu.sg, @schools.gov.sg.

  Include custom questions using FormQuestionsSchema and is only for YES_NO response type:
  1. Single Selection: Up to 2 choices, one selectable.
  2. Multi Selection: Up to 7 choices, multiple selectable.
  3. Text: Free-form response.
  Max 5 custom questions. Each question needs:
  - Title
  - Description
  - Unique UUID
  - Choices array (for selection types)
  Question structure:
  {
    type: "single_selection" | "multi_selection" | "text",
    title: "Question title",
    description: "Details/instructions",
    id: "uuid",
    choices: [{ label: "Choice 1" }, { label: "Choice 2" }],
    properties: {
      choices: [{ label: "Choice 1" }, { label: "Choice 2" }]
    }
  }
  Draft the form with standard consent language and include custom questions as specified. Ensure all required fields are present and properly formatted.`,
  parameters: z.object({
    fields: FormDraftSchema.describe(
      "Form draft schema. Leave optional fields empty if not applicable. The custom question only apply to YES or NO type of form. Acknowledgement form no need custom question!"
    ),
  }),
});

const createPGAnnouncementDraft = tool({
  description: `
  Create a Parent Gateway (PG) announcement draft for school communications.
  This tool helps generate a structured draft for announcements to be sent through the Parent Gateway system.
  It ensures all necessary information is captured and follows the required format.
    Key points:
    - The announcement includes a title, content, and contact email (use default parentsgateway.otp@gmail.com).
    - If user want to change default email, the input email must be @gmail.com, @moe.edu.sg, or @schools.gov.sg only.
    - Optional fields include related website links and shortcuts.
    - The draft status is set by default, currently only create draft.
    - Make sure all the fields are follow the schema/limitation setting before execute the tool call!
    `,
  parameters: z.object({
    fields: AnnouncementDraftSchema.describe(
      "Announcement draft schema. Provide values for all required fields. Optional fields can be left empty if not applicable."
    ),
  }),
});

const createSLSAnnouncement = tool({
  description: `Generate or pre-fill a Student Learning Space (SLS) announcement with the following fields:
  - title: Engaging, 1-50 chars
  - message: Concise, informative, 10-2000 chars. Use **bold** for emphasis, \n for line breaks. No HTML tags.
    Example:
    "Dear Students,\n\n**Event Announcement**\n- Date: [Date]\n- Time: [Time]\n\n[Details...]\n\nWe look forward to your participation!"
  - startDate: 'DD MMM YYYY' (e.g., '24 Feb 2025')
  - startTime: 'HH:mm' 24-hour format

  Adhere to formats and length requirements.
`,
  parameters: z.object({
    fields: StudentLearningSpacePrefillSchema.describe(
      "SLS announcement pre-fill schema"
    ),
  }),
});

const createClassroomAnnouncement = tool({
  description: `Create a Google Classroom announcement using plain text.
  The content should be structured as follows:

  - Use plain text for all content, including text that should be emphasized
  - Create bullet points with hyphens (-) at the start of lines
  - Separate paragraphs with blank lines
  - Emojis can be included directly
  - Maximum length: 20,000 characters

  The returned content should be ready for direct input into Google Classroom's editor without any need for manual formatting.`,
  parameters: z.object({
    content: z
      .string()
      .describe(
        "Announcement content using plain text:\n" +
          "- Regular text for all content\n" +
          "- Bullet points: - Item 1\n  - Item 2\n" +
          "- Paragraphs: Separated by blank lines\n" +
          "- Emojis: 👋 🎉\n" +
          "Avoid using any special formatting symbols or HTML tags."
      ),
  }),
});

export const tools = {
  sendEmail,
  retrieveResource,
  getDayOfTheWeek,
  createPGFormDraft,
  createPGAnnouncementDraft,
  createSLSAnnouncement,
  createClassroomAnnouncement,
};

export const renderToolUIVariables = (
  toolName: keyof typeof tools | (string & {})
): {
  description: string;
  options: Array<ToolOption>;
} => {
  const defaultOptions: Array<ToolOption> = [
    {
      title: "Confirm",
      description: "Proceed with the action",
      result: APPROVAL.YES,
    },
    { title: "Cancel", description: "Cancel the action", result: APPROVAL.NO },
  ];

  const toolDescriptions: Record<string, string> = {
    sendEmail:
      "Confirm to send the email to the following recipients. If applicable, include CC recipients. Would you like to proceed or cancel?",
    createPGFormDraft:
      "Create a draft Parent Gateway (PG) consent form. Do not submit; only prefill the consent form. It is only explicitly instructed to do action for PG.",
    createPGAnnouncementDraft:
      "Create a draft Parent Gateway (PG) announcement. Do not submit; only prefill the announcement. It is only explicitly instructed to do action for PG.",
    createSLSAnnouncement:
      "Prefill a Student Learning Space (SLS) announcement draft. Do not post or submit. It is only explicitly instructed to do action for SLS.",
    createClassroomAnnouncement:
      "Prefill a Google Classroom announcement draft. Do not post or submit. It is only explicitly instructed to do action for Google Classroom.",
  };

  return {
    description: toolDescriptions[toolName] || "",
    options: toolName in toolDescriptions ? defaultOptions : [],
  };
};
