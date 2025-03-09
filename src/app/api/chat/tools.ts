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
  description: `
    - You should trigger a retrieval of relevant past resources from the knowledge base **only when drafting a new announcement or form from scratch.**
    - This ensures consistency in tone, structure, and formatting.
    - Do **not** retrieve resources when modifying or adding to an existing draft. Do not include reference links in the content!
    - It is apply to SLS, Google Classroom and PG drafts.
    -
  `,
  parameters: z.object({
    query: z
      .string()
      .describe(
        "The input query used to search the knowledge base for relevant past content. This can be a topic, title, date, name, or other relevant keyword."
      ),
  }),
  execute: async ({ query }) => {
    try {
      const awsBedrockClient = new BedrockAgentRuntimeClient({
        region: process.env.AWS_REGION!,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          sessionToken: process.env.AWS_SESSION_TOKEN,
        },
      });

      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: process.env.AWS_BEDROCK_KNOWLEDGEBASE_ID,
        retrievalQuery: {
          text: query,
        },
      });

      const response = await awsBedrockClient.send(retrieveCommand);

      const relevantPastContent = response.retrievalResults?.slice(0, 2) ?? [];

      const contents: string[] = [];
      const urls: string[] = [];

      relevantPastContent?.forEach((pastContent) => {
        if (!pastContent) return;
        const { content, location } = pastContent;

        if (content && content?.text) {
          contents.push(content.text);
        }

        if (location && location?.s3Location && location?.s3Location?.uri) {
          urls.push(location?.s3Location?.uri);
        }
      });

      console.log("Retrieve past content: ", urls);

      return {
        content: `
        "Generate a draft for my topic by following the provided template and ensuring it aligns with the tone, style, and structure of past references (if available). Do not include or return the reference content directly. Instead, adapt the language, phrasing, and formatting to match the established pattern while maintaining consistency in writing style.
        ${contents?.join("\n----\n")}`,
        urls: urls,
      };
    } catch (err) {
      console.error(err);
      return "";
    }
  },
});

const createPGFormDraft = tool({
  description: `Create a consent form with the following details:
  - **Default Email**: **jane_tan@schools.gov.sg** (Custom email allowed only from @gmail.com, @moe.edu.sg, @schools.gov.sg).

  Include up to **5 custom questions** with these types:
    - **Single Selection**: Up to 2 choices, one selectable.
    - **Multi Selection**: Up to 7 choices, multiple selectable.
    - **Text**: Free-form response.

  Each question should have:
    - **Title**
    - **Description**
    - **Unique UUID**
    - **Choices array** (for selection types)
  Example structure:
  {
    type: "single_selection" | "multi_selection" | "text",
    title: "Question title",
    description: "Details/instructions",
    id: "uuid",
    choices: [{ label: "Choice 1" }, { label: "Choice 2" }],
    properties: { choices: [{ label: "Choice 1" }, { label: "Choice 2" }] }
  }

  Ensure to include standard consent language with all required fields properly formatted.
  `,
  parameters: z.object({
    fields: FormDraftSchema.describe(
      "Form draft schema. Leave optional fields empty if not applicable. The custom question only apply to YES or NO type of form. Acknowledgement form no need custom question!"
    ),
  }),
});

// const createPGFormDraft = tool({
//   description: `Create a Parent Gateway (PG) consent form draft. Default email: jane_tan@schools.gov.sg. Custom email allowed only from @gmail.com, @moe.edu.sg, @schools.gov.sg.

//   Include custom questions using FormQuestionsSchema and is only for YES_NO response type:
//   1. Single Selection: Up to 2 choices, one selectable.
//   2. Multi Selection: Up to 7 choices, multiple selectable.
//   3. Text: Free-form response.
//   Max 5 custom questions. Each question needs:
//   - Title
//   - Description
//   - Unique UUID
//   - Choices array (for selection types)
//   Question structure:
//   {
//     type: "single_selection" | "multi_selection" | "text",
//     title: "Question title",
//     description: "Details/instructions",
//     id: "uuid",
//     choices: [{ label: "Choice 1" }, { label: "Choice 2" }],
//     properties: {
//       choices: [{ label: "Choice 1" }, { label: "Choice 2" }]
//     }
//   }
//   Draft the form with standard consent language and include custom questions as specified. Ensure all required fields are present and properly formatted.`,
//   parameters: z.object({
//     fields: FormDraftSchema.describe(
//       "Form draft schema. Leave optional fields empty if not applicable. The custom question only apply to YES or NO type of form. Acknowledgement form no need custom question!"
//     ),
//   }),
// });

const createPGAnnouncementDraft = tool({
  description: `Announcement Draft - Required and Optional Fields
  Please fill out the fields below. Required fields must be completed to proceed. Optional fields can be left blank if not needed.

  Required:
    Title (1-120 characters): Please provide the title of the announcement.
    Content (50-2000 characters): Please provide the detailed content of the announcement.
    Enquiry Email: The default email is jane_tan@schools.gov.sg. You can provide an official contact email (must end with @gmail.com, @moe.edu.sg, or @schools.gov.sg).
  Optional:
    Related Links: Provide up to 3 related website links with brief descriptions.
    Shortcuts: Provide any predefined system shortcut URLs.

  Expected Response Format:
  Required:
    Title: [User’s title]
    Content: [User’s content]
    Enquiry Email: [User’s default email]

  Optional:
    Related Links: [User’s links or leave blank]
    Shortcuts: [User’s shortcuts or leave blank]`,
  parameters: z.object({
    fields: AnnouncementDraftSchema.describe(`Announcement draft schema`),
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
  switch (toolName) {
    case "sendEmail": {
      return {
        description: toolDescriptions["sendEmail"] || "",
        options: generateDraftOptions(),
      };
    }
    case "createPGFormDraft":
    case "createPGAnnouncementDraft": {
      return {
        description: toolDescriptions[toolName] || "",
        options: generateDraftOptions("PG"),
      };
    }
    case "createSLSAnnouncement": {
      return {
        description: toolDescriptions[toolName] || "",
        options: generateDraftOptions("SLS"),
      };
    }
    case "createClassroomAnnouncement": {
      return {
        description: toolDescriptions[toolName] || "",
        options: generateDraftOptions("GoogleClassroom"),
      };
    }
  }

  return {
    description: toolDescriptions[toolName] ?? "",
    options: generateDraftOptions() ?? [],
  };
};

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

const generateDraftOptions = (
  platform?: "SLS" | "PG" | "GoogleClassroom"
): Array<ToolOption> => {
  let targetPlatform = null;
  switch (platform) {
    case "PG":
      targetPlatform = "Parent Gateway (PG)";
      break;
    case "SLS":
      targetPlatform = "Student Learning Space (SLS)";
      break;
    case "GoogleClassroom":
      targetPlatform = "Google Classroom";
      break;
  }

  if (targetPlatform) {
    return [
      {
        title: "Confirm",
        description: "Proceed with creating the draft in " + targetPlatform,
        result: APPROVAL.YES,
      },
      {
        title: "Cancel",
        description: "Cancel the draft creation in " + targetPlatform,
        result: APPROVAL.NO,
      },
    ];
  }

  return [
    {
      title: "Confirm",
      description: "Proceed with the action",
      result: APPROVAL.YES,
    },
    { title: "Cancel", description: "Cancel the action", result: APPROVAL.NO },
  ];
};
