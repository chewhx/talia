import { renderToolUIVariables, tools } from "@/app/api/chat/tools";
import {
  getToolsRequiringConfirmation,
  callExtensionFunction,
  APPROVAL,
} from "@/app/api/chat/utils";
import { useChat } from "@ai-sdk/react";
import {
  Box,
  Button,
  Divider,
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
import { mapFieldsToSchema } from "@/schema/studentLearningSpace.schema";
import { parseToTiptap } from "@/app/api/generateRichText/utils";
import ReactMarkdown from "react-markdown";
import { PGFormField } from "./pg-form-field";
import { PGAnnouncementFields } from "./pg-announcement-field";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

type ToolOption = {
  title: string;
  description: string;
  result: string;
};

const formatKey = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before uppercase letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

export default function AIMessage({
  message,
  addToolResult,
}: {
  message: Message;
  addToolResult: ReturnType<typeof useChat>["addToolResult"];
}) {
  const preFillSLSFormHandling = async (
    option: ToolOption,
    fields: any,
    toolCallId: string
  ) => {
    if (option.result === APPROVAL.YES) {
      const formFields = await callExtensionFunction({
        requestBody: {
          action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST,
        },
        responseAction: TALIA_EVENTS.listeners.SCAN_FORM_RESPONSE,
      });

      const mappedFields = mapFieldsToSchema(
        JSON.parse(formFields.result),
        fields
      );

      await callExtensionFunction({
        requestBody: {
          action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
          data: JSON.stringify(mappedFields),
        },
        callback: () => {
          addToolResult({
            toolCallId,
            result: option.result,
          });
        },
      });
    } else {
      addToolResult({
        toolCallId,
        result: option.result,
      });
    }
  };

  const createDraft = async ({
    fields,
    option,
    toolCallId,
    postType,
  }: {
    option: ToolOption;
    fields: any;
    toolCallId: string;
    postType: "PG_ANNOUNCEMENT" | "PG_CONSENT_FORM";
  }) => {
    try {
      if (option.title === "Confirm") {
        const richTextContent = await fetch("/api/generateRichText", {
          method: "POST",
          body: JSON.stringify({
            content: fields?.content,
          }),
        });

        const formattedContent =
          (await richTextContent.json())?.object?.content ?? "";

        console.log({
          formattedContent,
          richText: parseToTiptap(formattedContent, true),
        });

        const draftDetails = await callExtensionFunction({
          requestBody: {
            action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
            data: {
              ...fields,
              content: JSON.stringify(parseToTiptap(formattedContent, true)),
            },
            type: postType,
          },
          responseAction: TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE,
        });

        const draftID =
          postType === "PG_ANNOUNCEMENT"
            ? draftDetails?.result?.announcementDraftId
            : draftDetails?.result?.consentFormDraftId;
        console.log({ draftID });
        if (draftID) {
          await callExtensionFunction({
            requestBody: {
              action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,
              draftInfo: {
                id: draftID,
                type:
                  postType === "PG_ANNOUNCEMENT"
                    ? "announcements"
                    : "consentForms",
              },
            },
            callback: () => {
              addToolResult({
                toolCallId,
                result: option.result,
              });
            },
          });
        } else {
          console.log("I am into the error");
          throw new Error("Unexpected error while creating the draft.");
        }
      } else {
        addToolResult({
          toolCallId,
          result: option.result,
        });
      }
    } catch (error: any) {
      console.error("Error processing tool action:", error);

      addToolResult({
        toolCallId,
        result: `An error occurred: ${error?.message}. Please try again.`,
      });
    }
  };

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
              (toolInvocation.toolName === "createPGAnnouncementDraft" ||
                toolInvocation.toolName === "createPGFormDraft")
            ) {
              const { options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              const isAnnouncement =
                toolInvocation.toolName === "createPGAnnouncementDraft";
              const fields = toolInvocation.args?.fields ?? {};

              return (
                <Stack key={toolCallId}>
                  <Paper px="md" py="lg" bg="white" shadow="xs" radius="md">
                    <Stack>
                      <Text fz="lg" fw={700} c="var(--mantine-color-dark)">
                        📌 Draft Information
                      </Text>
                      <Divider />

                      {isAnnouncement ? (
                        <PGAnnouncementFields data={fields} />
                      ) : (
                        <PGFormField data={fields} />
                      )}
                    </Stack>
                  </Paper>

                  <SimpleGrid cols={2}>
                    {options.map((option) => (
                      <UnstyledButton
                        key={`toolCall-${toolCallId}-option-${option.title}`}
                        onClick={async () => {
                          await createDraft({
                            fields,
                            toolCallId,
                            postType: isAnnouncement
                              ? "PG_ANNOUNCEMENT"
                              : "PG_CONSENT_FORM",
                            option,
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

            if (
              toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
              toolInvocation.state === "call" &&
              toolInvocation.toolName === "createSLSAnnouncement"
            ) {
              const { options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              const args = toolInvocation.args;

              return (
                <Stack key={toolCallId}>
                  <Paper px="md" py="lg" bg="white" shadow="xs" radius="md">
                    <Stack>
                      <Text fz="lg" fw={700} c="var(--mantine-color-dark)">
                        📌 Draft Information
                      </Text>
                      <Divider />

                      {Object.entries(args.fields).map(([key, field]: any) => (
                        <Group key={key} align="flex-start">
                          <Text
                            fw={600}
                            fz="sm"
                            c="gray.7"
                            style={{ width: 120 }}
                          >
                            {formatKey(key)}:
                          </Text>

                          <Box style={{ flex: 1 }}>
                            {key === "message" ? (
                              <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <Text fz="sm" style={{ margin: 0 }}>
                                      {children}
                                    </Text>
                                  ),
                                }}
                              >
                                {field.value}
                              </ReactMarkdown>
                            ) : (
                              <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                                {field.value}
                              </Text>
                            )}
                          </Box>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                  <SimpleGrid cols={2}>
                    {options.map((option) => (
                      <UnstyledButton
                        key={`toolCall-${toolCallId}-option-${option.title}`}
                        onClick={async () => {
                          await preFillSLSFormHandling(
                            option,
                            args.fields,
                            toolCallId
                          );
                        }}
                        className="custom-tool-button"
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
