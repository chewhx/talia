"use client";
import { ToolOption, renderToolUIVariables, tools } from "@/app/api/chat/tools";
import {
  APPROVAL,
  callExtensionFunction,
  getToolsRequiringConfirmation,
} from "@/app/api/chat/utils";
import { parseToTiptap } from "@/app/api/generateRichText/utils";
import { mapFieldsToSchema } from "@/schema/studentLearningSpace.schema";
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
import { Message, ToolInvocation } from "ai";
import ReactMarkdown from "react-markdown";
import { TALIA_EVENTS } from "../../../shared/constants";
import Markdown from "../markdown";
import { PGAnnouncementFields } from "../pg-field-display/pg-announcement-field";
import { PGFormField } from "../pg-field-display/pg-form-field";
import { useState } from "react";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

type AIMessageProps = {
  message: Message;
  addToolResult: ReturnType<typeof useChat>["addToolResult"];
};

export default function AIMessage({ message, addToolResult }: AIMessageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { createDraft, preFillClassroomFormHandling, preFillSLSFormHandling } =
    useToolActions(addToolResult, setIsLoading);

  const renderToolInvocation = (toolInvocation: ToolInvocation) => {
    const { toolName, toolCallId, args } = toolInvocation;
    const { options } = renderToolUIVariables(toolName);

    switch (toolName) {
      case "sendEmail":
        return (
          <Stack key={toolCallId}>
            <Paper px="xs" py="5" fz="sm" bg="white" ml="auto">
              <Text fz="xs" fw={500}>
                Send email to {args.emailAddresses.join(", ")}
              </Text>
            </Paper>
            <Paper px="xs" py="5" fz="sm" bg="white" w="100%">
              <Markdown>{args.emailContent}</Markdown>
            </Paper>
            <Group justify="right">
              {options.map((option: ToolOption) => (
                <Button
                  size="xs"
                  key={`toolCall-${toolCallId}-option-${option.title}`}
                  onClick={() =>
                    addToolResult({ toolCallId, result: option.result })
                  }
                >
                  {option.title}
                </Button>
              ))}
            </Group>
          </Stack>
        );

      case "createPGAnnouncementDraft":
      case "createPGFormDraft":
        const isAnnouncement = toolName === "createPGAnnouncementDraft";
        const fields = args?.fields ?? {};

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
            {!isLoading && (
              <SimpleGrid cols={2}>
                {options.map((option: ToolOption) => (
                  <UnstyledButton
                    key={`toolCall-${toolCallId}-option-${option.title}`}
                    onClick={() =>
                      createDraft({
                        fields,
                        toolCallId,
                        postType: isAnnouncement
                          ? "PG_ANNOUNCEMENT"
                          : "PG_CONSENT_FORM",
                        option,
                      })
                    }
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
            )}
          </Stack>
        );

      case "createSLSAnnouncement":
      case "createClassroomAnnouncement":
        return (
          <Stack key={toolCallId}>
            <Paper px="md" py="lg" bg="white" shadow="xs" radius="md">
              <Stack>
                <Text fz="lg" fw={700} c="var(--mantine-color-dark)">
                  📌 Announcement Information
                </Text>
                <Divider />
                {toolName === "createSLSAnnouncement" ? (
                  Object.entries(args.fields).map(
                    ([key, field]: [string, any]) => (
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
                    )
                  )
                ) : (
                  <Group align="flex-start">
                    <Text fw={600} fz="sm" c="gray.7" style={{ width: 120 }}>
                      Content:
                    </Text>
                    <Box style={{ flex: 1 }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <Text fz="sm" style={{ margin: 0 }}>
                              {children}
                            </Text>
                          ),
                        }}
                      >
                        {args?.content || ""}
                      </ReactMarkdown>
                    </Box>
                  </Group>
                )}
              </Stack>
            </Paper>
            <SimpleGrid cols={2}>
              {!isLoading &&
                options.map((option: ToolOption) => (
                  <UnstyledButton
                    key={`toolCall-${toolCallId}-option-${option.title}`}
                    onClick={() =>
                      toolName === "createSLSAnnouncement"
                        ? preFillSLSFormHandling(
                            option,
                            args.fields,
                            toolCallId
                          )
                        : preFillClassroomFormHandling(
                            option,
                            args.content,
                            toolCallId
                          )
                    }
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

      default:
        return null;
    }
  };

  return (
    <Stack gap="xs">
      {message?.parts?.map((part, idx) => {
        switch (part.type) {
          case "text":
            return (
              <Paper
                px="10"
                py="10"
                fz="sm"
                bg="white"
                w="100%"
                key={`text-${idx}`}
              >
                <Markdown>{part.text}</Markdown>
              </Paper>
            );
          case "tool-invocation": {
            const toolInvocation = part.toolInvocation;
            if (
              toolsRequiringConfirmation.includes(toolInvocation.toolName) &&
              toolInvocation.state === "call"
            ) {
              return renderToolInvocation(toolInvocation);
            }
            return null;
          }
          default:
            return null;
        }
      })}
    </Stack>
  );
}

/* Helper Functions */

const formatKey = (key: string) => {
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2") // Add space before uppercase letters
    .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

const useToolActions = (
  addToolResult: AIMessageProps["addToolResult"],
  setIsLoading?: (isLoading: boolean) => void
) => {
  const preFillSLSFormHandling = async (
    option: ToolOption,
    fields: any,
    toolCallId: string
  ) => {
    if (option.result === APPROVAL.YES) {
      try {
        setIsLoading?.(true);
        const tinyVueFormatMessage = await fetch("/api/generateHTMLText", {
          method: "POST",
          body: JSON.stringify({ message: fields?.message?.value }),
        });

        const formattedMessage = (await tinyVueFormatMessage.json())?.object
          ?.message;

        if (formattedMessage) {
          fields.message.value = formattedMessage;
        }

        const formFields = await callExtensionFunction({
          requestBody: { action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST },
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
          callback: () => addToolResult({ toolCallId, result: option.result }),
        });
      } catch (error) {
        console.error("Error in preFillSLSFormHandling:", error);
        addToolResult({
          toolCallId,
          result: "Error occurred while processing the form.",
        });
      } finally {
        setIsLoading?.(false);
      }
    } else {
      addToolResult({
        toolCallId,
        result: "Cancel the action. I want to modify the content.",
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
        setIsLoading?.(true);
        const richTextContent = await fetch("/api/generateRichText", {
          method: "POST",
          body: JSON.stringify({ content: fields?.content }),
        });

        const formattedContent =
          (await richTextContent.json())?.object?.content ?? "";
        if (formattedContent) {
          const parsedContent = JSON.stringify(
            parseToTiptap(formattedContent, true)
          );

          fields.content = parsedContent ?? fields.content;
        }

        const draftDetails = await callExtensionFunction({
          requestBody: {
            action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
            data: fields,
            type: postType,
          },
          responseAction: TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE,
        });

        if (draftDetails?.result?.error) {
          throw new Error(
            `Unexpected error while creating the draft. ${draftDetails?.result?.error}`
          );
        }

        const draftID =
          postType === "PG_ANNOUNCEMENT"
            ? draftDetails?.result?.announcementDraftId
            : draftDetails?.result?.consentFormDraftId;

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
            callback: () =>
              addToolResult({ toolCallId, result: option.result }),
          });
        } else {
          throw new Error("Unexpected error while creating the draft.");
        }
      } else {
        addToolResult({
          toolCallId,
          result: "Cancel the action. I want to modify the content.",
        });
      }
    } catch (error: any) {
      console.error(error);
      addToolResult({
        toolCallId,
        result: `An error occurred: ${error?.message}. Please try again.`,
      });
    } finally {
      setIsLoading?.(false);
    }
  };

  const preFillClassroomFormHandling = async (
    option: ToolOption,
    content: string,
    toolCallId: string
  ) => {
    if (option.result === APPROVAL.YES) {
      try {
        // setIsLoading?.(true);
        // const tinyVueFormatMessage = await fetch("/api/generateHTMLText", {
        //   method: "POST",
        //   body: JSON.stringify({ message: fields?.message?.value }),
        // });

        await callExtensionFunction({
          requestBody: {
            action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
            data: content,
          },
          callback: () => addToolResult({ toolCallId, result: option.result }),
        });
      } catch (error) {
        console.error("Error in preFillClassroomFormHandling:", error);
        addToolResult({
          toolCallId,
          result: "Error occurred while processing the form.",
        });
      } finally {
        // setIsLoading?.(false);
      }
    } else {
      addToolResult({
        toolCallId,
        result: "Cancel the action. I want to modify the content.",
      });
    }
  };

  return { preFillSLSFormHandling, createDraft, preFillClassroomFormHandling };
};
