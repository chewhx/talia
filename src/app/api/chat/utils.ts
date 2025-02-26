import { formatDataStreamPart, Message } from "@ai-sdk/ui-utils";
import {
  convertToCoreMessages,
  DataStreamWriter,
  ToolExecutionOptions,
  ToolSet,
} from "ai";
import { z } from "zod";
import { TALIA_EVENTS } from "../../../../shared/constants";

// PG Posts types to be shared across frontend and backend
export const PG_POSTS_TYPE = {
  ANNOUNCEMENT: "PG_ANNOUNCEMENT",
  CONSENT_FORM: "PG_CONSENT_FORM",
} as const;

// Approval string to be shared across frontend and backend
export const APPROVAL = {
  YES: "Yes, confirmed.",
  NO: "No, denied.",
} as const;

function isValidToolName<K extends PropertyKey, T extends object>(
  key: K,
  obj: T
): key is K & keyof T {
  return key in obj;
}

/**
 * Processes tool invocations where human input is required, executing tools when authorized.
 *
 * @param options - The function options
 * @param options.tools - Map of tool names to Tool instances that may expose execute functions
 * @param options.dataStream - Data stream for sending results back to the client
 * @param options.messages - Array of messages to process
 * @param executionFunctions - Map of tool names to execute functions
 * @returns Promise resolving to the processed messages
 */
export async function processToolCalls<
  Tools extends ToolSet,
  ExecutableTools extends {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    [Tool in keyof Tools as Tools[Tool] extends { execute: Function }
      ? never
      : Tool]: Tools[Tool];
  }
>(
  {
    dataStream,
    messages,
  }: {
    tools: Tools; // used for type inference
    dataStream: DataStreamWriter;
    messages: Message[];
  },
  executeFunctions: {
    [K in keyof Tools & keyof ExecutableTools]?: (
      args: z.infer<ExecutableTools[K]["parameters"]>,
      context: ToolExecutionOptions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) => Promise<any>;
  }
): Promise<Message[]> {
  const lastMessage = messages[messages.length - 1];
  const parts = lastMessage.parts;
  if (!parts) return messages;

  const processedParts = await Promise.all(
    parts.map(async (part) => {
      // Only process tool invocations parts
      if (part.type !== "tool-invocation") return part;

      const { toolInvocation } = part;
      const toolName = toolInvocation.toolName;

      // Only continue if we have an execute function for the tool (meaning it requires confirmation) and it's in a 'result' state
      if (!(toolName in executeFunctions) || toolInvocation.state !== "result")
        return part;

      let result;

      if (
        toolInvocation.result === APPROVAL.YES ||
        toolInvocation.result === PG_POSTS_TYPE.ANNOUNCEMENT ||
        toolInvocation.result === PG_POSTS_TYPE.CONSENT_FORM
      ) {
        // Get the tool and check if the tool has an execute function.
        if (
          !isValidToolName(toolName, executeFunctions) ||
          toolInvocation.state !== "result"
        ) {
          return part;
        }

        const toolInstance = executeFunctions[toolName];
        if (toolInstance) {
          result = await toolInstance(
            {
              ...toolInvocation.args,
              postType: toolInvocation.result || "",
            },
            {
              messages: convertToCoreMessages(messages),
              toolCallId: toolInvocation.toolCallId,
            }
          );
        } else {
          result = "Error: No execute function found on tool";
        }
      } else if (toolInvocation.result === APPROVAL.NO) {
        result = "Error: User denied access to tool execution";
      } else {
        // For any unhandled responses, return the original part.
        return part;
      }

      // Forward updated tool result to the client.
      dataStream.write(
        formatDataStreamPart("tool_result", {
          toolCallId: toolInvocation.toolCallId,
          result,
        })
      );

      // Return updated toolInvocation with the actual result.
      return {
        ...part,
        toolInvocation: {
          ...toolInvocation,
          result,
        },
      };
    })
  );

  // Finally return the processed messages
  return [...messages.slice(0, -1), { ...lastMessage, parts: processedParts }];
}

export function getToolsRequiringConfirmation<T extends ToolSet>(
  tools: T
): string[] {
  return (Object.keys(tools) as (keyof T)[]).filter((key) => {
    const maybeTool = tools[key];
    return typeof maybeTool.execute !== "function";
  }) as string[];
}

// export function waitForScanResponse(): Promise<any> {
//   return new Promise((resolve, reject) => {
//     const chromeExtensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
//     window.parent.postMessage(
//       { action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST },
//       `${chromeExtensionID}`
//     );

//     const handleMessage = (event: MessageEvent) => {
//       if (event.data.action === "SCAN_FORM_RESPONSE") {
//         window.removeEventListener("message", handleMessage); // Cleanup listener
//         resolve(event.data.fields); // Resolve with scanned form data
//       }
//     };

//     // Listen for messages
//     window.addEventListener("message", handleMessage);

//     // Timeout in case no response is received
//     setTimeout(() => {
//       window.removeEventListener("message", handleMessage);
//     }, 5000); // Adjust timeout if needed
//   });
// }

export function waitForScanResponse(
  requestBody?: any,
  responseAction?: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    console.log({
      requestBody,
      responseAction,
    });
    const chromeExtensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
    window.parent.postMessage(requestBody, `${chromeExtensionID}`);

    const handleMessage = (event: MessageEvent) => {
      console.log("Event: ", event);
      if (event.data.action === responseAction) {
        window.removeEventListener("message", handleMessage); // Cleanup listener
        resolve(event.data); // Resolve with scanned form data
      }
    };

    if (responseAction) {
      // Listen for messages
      console.log(responseAction);
      window.addEventListener("message", handleMessage);

      // Timeout in case no response is received
      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
      }, 5000); // Adjust timeout if needed
    }
  });
}
