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
    emailAddresses: z.array(z.string()).describe("List of email addresses"),
  }),
  // no execute function, we want human in the loop
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
  description: "Create a PG consent form draft based on the content",
  parameters: z.object({
    result: z.string().describe("The consent form original content"),
    fields: FormDraftSchema.describe(
      "The schema to create a form draft. Return empty for optional field if the content does not match."
    ),
  }),
});

const createPGAnnouncementDraft = tool({
  description: `
    Create a PG announcement draft based on the content.`,
  parameters: z.object({
    result: z.string().describe("The announcement original content"),
    fields: AnnouncementDraftSchema.describe(
      "The schema to create a announcement draft. Return empty for optional field if the content does not match."
    ),
  }),
});

const createSLSAnnouncement = tool({
  description: "Create or prefill a SLS announcement based on the content.",
  parameters: z.object({
    result: z.string().describe("The announcement original content"),
    fields: StudentLearningSpacePrefillSchema.describe(
      "The schema to pre fill student learning space announcement"
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
};

export const renderToolUIVariables = (
  toolName: keyof typeof tools | (string & {})
): {
  description: string;
  options: Array<{
    title: string;
    description: string;
    result: string;
  }>;
} => {
  switch (toolName) {
    case "sendEmail":
      return {
        description: "",
        options: [
          {
            title: "Send",
            description: "",
            result: APPROVAL.YES,
          },
        ],
      };
    case "createPGFormDraft":
      return {
        description: "",
        options: [
          {
            title: "Confirm",
            description: "Proceed to create a consent form draft",
            result: APPROVAL.YES,
          },
          {
            title: "Cancel",
            description: "Cancel to create a consent form draft",
            result: APPROVAL.NO,
          },
        ],
      };
    case "createPGAnnouncementDraft":
      return {
        description: "",
        options: [
          {
            title: "Confirm",
            description: "Proceed to create a announcement draft",
            result: APPROVAL.YES,
          },
          {
            title: "Cancel",
            description: "Cancel to create a announcement draft",
            result: APPROVAL.NO,
          },
        ],
      };
    case "createSLSAnnouncement":
      return {
        description: "",
        options: [
          {
            title: "Confirm",
            description: "Proceed to pre-fill a announcement",
            result: APPROVAL.YES,
          },
          {
            title: "Cancel",
            description: "Cancel to pre-fill a announcement",
            result: APPROVAL.NO,
          },
        ],
      };
    default:
      return {
        description: "",
        options: [],
      };
  }
};
