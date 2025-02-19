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
    emailContent: z.string(),
    emailAddresses: z.array(z.string()),
  }),
  // no execute function, we want human in the loop
});

export const tools = {
  postToParentsGateway,
  sendEmail,
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
