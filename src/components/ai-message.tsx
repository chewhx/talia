import { renderToolUIVariables, tools } from "@/app/api/chat/tools";
import { getToolsRequiringConfirmation } from "@/app/api/chat/utils";
import { useChat } from "@ai-sdk/react";
import {
  Button,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { Message } from "ai";
import Markdown from "./markdown";
import { fillFormWithAi } from "@/app/actions";
import { useFormFields } from "../../shared/form-fields";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

export default function AIMessage({
  message,
  addToolResult,
}: {
  message: Message;
  addToolResult: ReturnType<typeof useChat>["addToolResult"];
}) {
  const { formFields } = useFormFields();

  return (
    <Stack gap="xs">
      {message?.parts?.map((part, idx) => {
        switch (part.type) {
          case "text":
            return (
              <Paper
                px="xs"
                py="5"
                fz="sm"
                bg="white"
                w="100%"
                key={`text-${idx}`}
              >
                <Markdown>{part.text}</Markdown>
              </Paper>
            );
          case "tool-invocation":
            const toolInvocation = part.toolInvocation;
            const toolCallId = toolInvocation.toolCallId;
            // render confirmation tool (client-side tool with user interaction)
            if (
              toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
              toolInvocation.state === "call" &&
              toolInvocation.toolName === "postToParentsGateway"
            ) {
              const { description, options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              return (
                <Stack key={toolCallId}>
                  <Paper px="xs" py="5" fz="sm" bg="white" w="100%">
                    <Markdown>{description}</Markdown>
                  </Paper>
                  <SimpleGrid cols={2}>
                    {options.map((option) => (
                      <UnstyledButton
                        key={`toolCall-${toolCallId}-option-${option.title}`}
                        onClick={async () => {
                          // Use AI to fill up form fields
                          const filledFormFields = await fillFormWithAi(
                            formFields,
                            toolInvocation.args.result || ""
                          );

                          window.parent.postMessage(
                            {
                              type: "PRE_FILL",
                              data: JSON.stringify(filledFormFields),
                            },
                            "*"
                          );

                          addToolResult({
                            toolCallId,
                            result: option.result,
                          });
                        }}
                      >
                        <Paper
                          shadow="sm"
                          radius={0}
                          bg="var(--talia-orange)"
                          p="sm"
                        >
                          <Stack gap={0}>
                            <Text fw={500} m={0} fz="sm">
                              + {option.title}
                            </Text>
                            <Text fz="xs" c="gray">
                              {option.description}
                            </Text>
                          </Stack>
                        </Paper>
                      </UnstyledButton>
                    ))}
                  </SimpleGrid>
                </Stack>
              );
            }

            if (
              toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
              toolInvocation.state === "call" &&
              toolInvocation.toolName === "sendEmail"
            ) {
              const { options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              return (
                <Stack key={toolCallId}>
                  <Paper px="xs" py="5" fz="sm" bg="white" ml="auto">
                    <Text fz="xs" fw={500}>
                      Send email to{" "}
                      {toolInvocation.args.emailAddresses.join(", ")}
                    </Text>
                  </Paper>
                  <Paper px="xs" py="5" fz="sm" bg="white" w="100%">
                    <Markdown>{toolInvocation.args.emailContent}</Markdown>
                  </Paper>
                  <Group justify="right">
                    {options.map((option) => (
                      <Button
                        size="xs"
                        key={`toolCall-${toolCallId}-option-${option.title}`}
                        onClick={() =>
                          addToolResult({
                            toolCallId,
                            result: option.result,
                          })
                        }
                      >
                        {option.title}
                      </Button>
                    ))}
                  </Group>
                </Stack>
              );
            }
          default:
            return null;
        }
      })}
    </Stack>
  );
}
