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
  Divider,
  Group,
  List,
  Paper,
  SimpleGrid,
  Stack,
  Text,
} from "@mantine/core";
import { Message, ToolInvocation } from "ai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { TALIA_EVENTS } from "../../../shared/constants";
import Markdown from "../markdown";
import { PGAnnouncementFields } from "../pg-field-display/pg-announcement-field";
import { PGFormField } from "../pg-field-display/pg-form-field";
import { ToolCallButton } from "./tool-call-buttons";
import { ToolCallConfirmationMessage } from "./tool-call-confirmation-message";
import { formatKey } from "@/utils/helper";
import remarkGfm from "remark-gfm";

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
              <Stack>
                <Text fz="md" fw={500} mb={0}>
                  Send email to:
                </Text>
                <List spacing="xs" withPadding>
                  {args.emailAddresses.map((email: string) => (
                    <List.Item key={email}>
                      <Text fz="md">{email}</Text>
                    </List.Item>
                  ))}
                </List>

                {args.emailCCAddress?.length > 0 && (
                  <>
                    <Text fz="md" fw={500} mb={0}>
                      CC:
                    </Text>
                    <List spacing="xs" withPadding>
                      {args.emailCCAddress.map((ccEmail: string) => (
                        <List.Item key={ccEmail}>
                          <Text fz="md">{ccEmail}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </>
                )}
              </Stack>
            </Paper>
            <Paper px="xs" py="5" fz="md" bg="white" w="100%">
              <div dangerouslySetInnerHTML={{ __html: args.emailContent }} />
            </Paper>

            <SimpleGrid cols={2}>
              {options.map((option: ToolOption) => (
                <ToolCallButton
                  option={option}
                  onClick={() =>
                    addToolResult({ toolCallId, result: option.result })
                  }
                  toolCallId={toolCallId}
                />
              ))}
            </SimpleGrid>
          </Stack>
        );

      case "createPGAnnouncementDraft":
      case "createPGFormDraft":
        const isAnnouncement = toolName === "createPGAnnouncementDraft";
        const fields = args?.fields ?? {};

        return (
          <Stack key={toolCallId}>
            <Paper px="md" py="lg" bg="white" radius="md">
              <Stack fz="sm">
                <Text fz="sm" m={0}>
                  Sure, Jane!
                </Text>
                <Divider />

                {isAnnouncement ? (
                  <PGAnnouncementFields data={fields} />
                ) : (
                  <PGFormField data={fields} />
                )}

                <Divider />

                <ToolCallConfirmationMessage platform="Parent Gateway (PG)" />
              </Stack>
            </Paper>
            {!isLoading && (
              <SimpleGrid cols={2}>
                {options.map((option: ToolOption) => (
                  <ToolCallButton
                    option={option}
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
                    toolCallId={toolCallId}
                  />
                ))}
              </SimpleGrid>
            )}
          </Stack>
        );

      case "createSLSAnnouncement":
      case "createClassroomAnnouncement": {
        const isSLS = toolName === "createSLSAnnouncement";

        return (
          <Stack key={toolCallId}>
            <Paper px="md" py="lg" bg="white" radius="md">
              <Stack fz="sm">
                <Text fz="sm" m={0}>
                  Sure, Jane!
                </Text>
                <Divider />

                {isSLS ? (
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
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => (
                            <Text
                              fz="sm"
                              style={{ margin: 0, whiteSpace: "pre-wrap" }}
                            >
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

                <Divider />

                <ToolCallConfirmationMessage
                  platform={
                    isSLS ? "Student Learning Space (SLS)" : "Google Classroom"
                  }
                />
              </Stack>
            </Paper>
            <SimpleGrid cols={2}>
              {!isLoading &&
                options.map((option: ToolOption) => (
                  <ToolCallButton
                    option={option}
                    onClick={() =>
                      isSLS
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
                    toolCallId={toolCallId}
                  />
                ))}
            </SimpleGrid>
          </Stack>
        );
      }

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

        if ((await isCurrentWebsiteMatchAction()) !== "SLS") {
          addToolResult({
            toolCallId,
            result:
              "Error: Ensure you're on the Student Learning Space (SLS) tab and logged in before attempting to pre-fill content.",
          });
          return;
        }

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

        if ((await isCurrentWebsiteMatchAction()) !== "PG") {
          addToolResult({
            toolCallId,
            result:
              "Error: Ensure you're on the Parent Gateway (PG) tab and logged in before attempting to create draft.",
          });
          return;
        }

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
        result: `An error occurred: ${error?.message}`,
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
        setIsLoading?.(true);

        if ((await isCurrentWebsiteMatchAction()) !== "GoogleClassroom") {
          addToolResult({
            toolCallId,
            result:
              "Error: Ensure you're on the Google Classroom tab and logged in before attempting to pre-fill content.",
          });
          return;
        }

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
        setIsLoading?.(false);
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

const isCurrentWebsiteMatchAction = async () => {
  const currentWebsite = await callExtensionFunction({
    requestBody: {
      action: TALIA_EVENTS.actions.IDENTITY_CURRENT_ACTIVE_TAB,
    },
    responseAction: TALIA_EVENTS.listeners.CURRENT_ACTIVE_TAB_RESPONSE,
  });

  return currentWebsite?.currentWebsite;
};
