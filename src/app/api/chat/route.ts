import { openai } from "@ai-sdk/openai";
import { createDataStreamResponse, streamText, UIMessage } from "ai";
import { tools } from "./tools";
import { processToolCalls } from "./utils";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages: uiMessages,
  }: { messages: UIMessage[]; doRetrieval: boolean } = await req.json();

  const messages = [...uiMessages];

  // To be implemented
  // if (doRetrieval) {
  //   const awsBedrockClient = new BedrockAgentRuntimeClient({});

  //   const retrieveCommand = new RetrieveCommand({
  //     knowledgeBaseId: process.env.AWS_BEDROCK_KNOWLEDGEBASE_ID,
  //     retrievalQuery: {
  //       text: messages.at(-1)?.content,
  //     },
  //   });

  //   const response = await awsBedrockClient.send(retrieveCommand);

  //   const relevantPastContent = response.retrievalResults?.slice(
  //     0,
  //     4
  //   ) as KnowledgeBaseRetrievalResult[];

  //   const lastUserMessage = messages.pop();

  //   const parts: Array<UIMessage["parts"][0]> = relevantPastContent.map(
  //     (e) => ({
  //       type: "text",
  //       text: e.content?.text?.toString() || "",
  //     })
  //   );

  //   const newUserMessage: UIMessage = {
  //     id: nanoid(16),
  //     role: "user",
  //     content: lastUserMessage?.content || "",
  //     parts: [
  //       ...(lastUserMessage?.parts || []),
  //       {
  //         type: "text",
  //         text: "If relevant, refer to the following past content for reference to structure, format, and tone.",
  //       },
  //       ...parts,
  //     ],
  //   };

  //   messages.push(newUserMessage);
  // }

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
          // type-safe object for tools without an execute function
          postToParentsGateway: async ({ result, postType }) => {
            // The real action to post to PG
            console.log(`Posted to Parents Gateway: `, {
              result,
              postType,
            });
            return `Posted to Parents Gateway: ${result}`;
          },
          sendEmail: async ({ emailAddresses, emailContent }) => {
            console.log({ emailAddresses, emailContent });
            return `Sent email to ${JSON.stringify(emailAddresses)}`;
          },
        }
      );

      const result = streamText({
        model: openai("gpt-4o-mini"),
        system:
          "You are an AI writing assistant to teaching staff of MOE (Ministry of Education) schools in Singapore. Your role is to faciliate staff in creating and writing content for their newsletter, bulletin boards, and school outreach. When asked to send email, do not assume the email addresses. Ask the user for the email addresses.",
        messages: processedMessages,
        tools,
      });

      result.mergeIntoDataStream(dataStream);
    },
  });
}
