import {
  BedrockAgentRuntimeClient,
  RetrieveCommand,
} from "@aws-sdk/client-bedrock-agent-runtime";
import { tool } from "ai";
import { z } from "zod";
import { APPROVAL, PG_POSTS_TYPE } from "./utils";

const postToParentsGateway = tool({
  description:
    "Post the final message to Parents Gateway (alias PG) upon request by the user.",
  parameters: z.object({
    result: z.string(),
    postType: z.enum([PG_POSTS_TYPE.ANNOUNCEMENT, PG_POSTS_TYPE.CONSENT_FORM]),
  }),
  // no execute function, we want human in the loop
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

export const tools = {
  postToParentsGateway,
  sendEmail,
  retrieveResource,
};

export const renderToolUIVariables = (
  toolName: keyof typeof tools | string
): {
  description: string;
  options: Array<{
    title: string;
    description: string;
    result: string;
  }>;
} => {
  switch (toolName) {
    case "postToParentsGateway":
      return {
        description: "What post would you like to create? (Select one)",
        options: [
          {
            title: "Announcement",
            description: "Provides information only.",
            result: PG_POSTS_TYPE.ANNOUNCEMENT,
          },
          {
            title: "Consent Form",
            description: "Requires parents to acknowledge or provide consent.",
            result: PG_POSTS_TYPE.CONSENT_FORM,
          },
        ],
      };
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
    default:
      return {
        description: "",
        options: [],
      };
  }
};
