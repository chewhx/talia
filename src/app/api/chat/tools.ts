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
  description: "Send an email to a specified recipient.",
  parameters: z.object({
    emailContent: z.string().describe("Markdown content of the email"),
    emailSubject: z
      .string()
      .describe("Email subject that defines the email content"),
    emailAddresses: z
      .array(z.string())
      .describe("List of recipient email addresses"),
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
  description: "Create a Parent Gateway (PG) consent form draft.",
  parameters: z.object({
    fields: FormDraftSchema.describe(
      "Form draft schema. Leave optional fields empty if not applicable."
    ),
  }),
});

const createPGAnnouncementDraft = tool({
  description: `
    Create a Parent Gateway (PG) announcement draft.`,
  parameters: z.object({
    fields: AnnouncementDraftSchema.describe(
      "Announcement draft schema. Leave optional fields empty if not applicable."
    ),
  }),
});

const createSLSAnnouncement = tool({
  description:
    "Generate or pre-fill a Student Learning Space (SLS) announcement.",
  parameters: z.object({
    fields: StudentLearningSpacePrefillSchema.describe(
      "SLS announcement pre-fill schema"
    ),
  }),
});

const createClassroomAnnouncement = tool({
  description:
    "Create a Google Classroom announcement using plain text with markdown-like formatting.",
  parameters: z.object({
    content: z
      .string()
      .describe(
        "Announcement content using bold (**text**), numbered lists, and line breaks (\\n). No HTML tags."
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
    sendEmail: "Confirm to send the email or cancel the action.",
    createPGFormDraft: "Create a Parent Gateway (PG) consent form draft.",
    createPGAnnouncementDraft:
      "Create a Parent Gateway (PG) announcement draft.",
    createSLSAnnouncement:
      "Pre-fill a Student Learning Space (SLS) announcement",
    createClassroomAnnouncement: "Pre-fill a Google Classroom announcement.",
  };

  return {
    description: toolDescriptions[toolName] || "",
    options: toolName in toolDescriptions ? defaultOptions : [],
  };

  // switch (toolName) {
  //   case "sendEmail":
  //     return {
  //       description: "",
  //       options: [
  //         {
  //           title: "Send",
  //           description: "",
  //           result: APPROVAL.YES,
  //         },
  //         {
  //           title: "Cancel",
  //           description: "",
  //           result: APPROVAL.NO,
  //         },
  //       ],
  //     };
  //   case "createPGFormDraft":
  //     return {
  //       description: "",
  //       options: [
  //         {
  //           title: "Confirm",
  //           description: "Proceed to create a consent form draft",
  //           result: APPROVAL.YES,
  //         },
  //         {
  //           title: "Cancel",
  //           description: "Cancel to create a consent form draft",
  //           result: APPROVAL.NO,
  //         },
  //       ],
  //     };
  //   case "createPGAnnouncementDraft":
  //     return {
  //       description: "",
  //       options: [
  //         {
  //           title: "Confirm",
  //           description: "Proceed to create a announcement draft",
  //           result: APPROVAL.YES,
  //         },
  //         {
  //           title: "Cancel",
  //           description: "Cancel to create a announcement draft",
  //           result: APPROVAL.NO,
  //         },
  //       ],
  //     };
  //   case "createSLSAnnouncement":
  //     return {
  //       description: "",
  //       options: [
  //         {
  //           title: "Confirm",
  //           description: "Proceed to pre-fill a announcement",
  //           result: APPROVAL.YES,
  //         },
  //         {
  //           title: "Cancel",
  //           description: "Cancel to pre-fill a announcement",
  //           result: APPROVAL.NO,
  //         },
  //       ],
  //     };
  //   case "createClassroomAnnouncement":
  //     return {
  //       description: "",
  //       options: [
  //         {
  //           title: "Confirm",
  //           description: "Proceed to pre-fill a announcement",
  //           result: APPROVAL.YES,
  //         },
  //         {
  //           title: "Cancel",
  //           description: "Cancel to pre-fill a announcement",
  //           result: APPROVAL.NO,
  //         },
  //       ],
  //     };
  //   default:
  //     return {
  //       description: "",
  //       options: [],
  //     };
  // }
};
