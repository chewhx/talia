import { renderToolUIVariables, tools } from "@/app/api/chat/tools";
import {
  getToolsRequiringConfirmation,
  waitForScanResponse,
} from "@/app/api/chat/utils";
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
import { TALIA_EVENTS } from "../../shared/constants";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

export default function AIMessage({
  message,
  addToolResult,
}: {
  message: Message;
  addToolResult: ReturnType<typeof useChat>["addToolResult"];
}) {
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
                        onClick={() =>
                          addToolResult({
                            toolCallId,
                            result: option.result,
                          })
                        }
                      >
                        <Paper
                          shadow="sm"
                          radius={0}
                          bg="var(--talia-orange)"
                          p="sm"
                        >
                          <Stack gap={0}>
                            <Text fw={500} m={0} fz="sm">
                              {option.title}
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

            if (
              toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
              toolInvocation.state === "call" &&
              toolInvocation.toolName === "createPGAnnouncementDraft"
            ) {
              const { description, options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              const args = toolInvocation.args;

              const formattedArgs =
                "```\n" + JSON.stringify(args.fields, null, 2) + "\n```";

              return (
                <Stack key={toolCallId}>
                  <Paper px="xs" py="5" fz="sm" bg="white" w="100%">
                    Your current fields are: <br />
                    {/* Todo: the UI of the fields, for user to confirm and check */}
                    <Markdown>{formattedArgs}</Markdown>
                  </Paper>
                  <SimpleGrid cols={2}>
                    {options.map((option) => (
                      <UnstyledButton
                        key={`toolCall-${toolCallId}-option-${option.title}`}
                        onClick={async () => {
                          if (option.title === "Confirm") {
                            // Intercept API call to update the content to specific format
                            const formattedContent = await fetch(
                              "/api/generateRichText",
                              {
                                method: "POST",
                                body: JSON.stringify({
                                  prompt: args?.fields?.content,
                                }),
                              }
                            );

                            const content = await formattedContent.json();

                            // TODO: Create draft error handling (unsafe url, etc)
                            const announcementDraftDetail =
                              await waitForScanResponse(
                                {
                                  action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
                                  data: {
                                    ...args.fields,
                                    content: JSON.stringify(
                                      content?.object?.content ?? ""
                                    ),
                                  },
                                  type: "PG_ANNOUNCEMENT",
                                },
                                TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE
                              );

                            const announcementDraftID =
                              announcementDraftDetail.result
                                .announcementDraftId;

                            // Todo: To decide either navigate automatically or let user to click the link
                            await waitForScanResponse({
                              action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,
                              draftInfo: {
                                id: announcementDraftID,
                                type: "announcements",
                              },
                            });
                          }
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
                              {option.title}
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

          default:
            return null;
        }
      })}
    </Stack>
  );
}
