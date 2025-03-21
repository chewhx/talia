"use client";
import { ToolOption, renderToolUIVariables, tools } from "@/app/api/chat/tools";
import {
  APPROVAL,
  callExtensionFunction,
  getToolsRequiringConfirmation,
} from "@/app/api/chat/utils";
import { getSupportedExtensions } from "@/utils/tipTapUtils";
import { mapFieldsToSchema } from "@/schema/studentLearningSpace.schema";
import { formatKey } from "@/utils/helper";
import { UseChatHelpers, useChat } from "@ai-sdk/react";
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
import { generateJSON } from "@tiptap/html";
import { ChatRequestOptions, CreateMessage, Message, ToolInvocation } from "ai";
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { TALIA_EVENTS } from "../../../shared/constants";
import { PGAnnouncementFields } from "../pg-field-display/pg-announcement-field";
import { PGFormField } from "../pg-field-display/pg-form-field";
import { EditableAIMessage } from "./editable-ai-message";
import { md, removeEmptyListItems } from "./markdown-it.util";
import { ToolCallButton } from "./tool-call-buttons";
import { ToolCallConfirmationMessage } from "./tool-call-confirmation-message";
import { useUserNeedToCallTool } from "./user-need-call-tool-hook";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

type AIMessageProps = {
  message: Message;
  addToolResult: ReturnType<typeof useChat>["addToolResult"];
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => Promise<string | null | undefined>;
  isLastAIMessage: boolean;
  pendingToolCallConfirmation: boolean;
  messageStatus: UseChatHelpers["status"];
};

export default function AIMessage({
  message,
  isLastAIMessage,
  messageStatus,
  pendingToolCallConfirmation,
  addToolResult,
  append,
}: AIMessageProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toggleUserNeedToCallTool } = useUserNeedToCallTool();
  const { createDraft, preFillClassroomFormHandling, preFillSLSFormHandling } =
    useToolActions(addToolResult, setIsLoading, toggleUserNeedToCallTool);

  const renderToolInvocation = (toolInvocation: ToolInvocation) => {
    const { toolName, toolCallId, args } = toolInvocation;
    const { options } = renderToolUIVariables(toolName);

    switch (toolName) {
      case "sendEmail":
        return (
          <Stack key={toolCallId}>
            <Paper
              p="md"
              radius="md"
              fz="sm"
              bg="white"
              w="100%"
              c="var(--talia-title)"
            >
              <Stack>
                <Text fz="sm" fw={500} mb={0}>
                  Send email to:
                </Text>
                <List spacing="xs" withPadding>
                  {args.emailAddresses.map((email: string) => (
                    <List.Item key={email}>
                      <Text fz="sm">{email}</Text>
                    </List.Item>
                  ))}
                </List>

                {args.emailCCAddress?.length > 0 && (
                  <>
                    <Text fz="sm" fw={500} mb={0}>
                      CC:
                    </Text>
                    <List spacing="xs" withPadding>
                      {args.emailCCAddress.map((ccEmail: string) => (
                        <List.Item key={ccEmail}>
                          <Text fz="sm">{ccEmail}</Text>
                        </List.Item>
                      ))}
                    </List>
                  </>
                )}
              </Stack>
            </Paper>
            <Paper
              px="10"
              py="10"
              fz="sm"
              bg="white"
              w="100%"
              c="var(--talia-title)"
            >
              <div dangerouslySetInnerHTML={{ __html: args.emailContent }} />
            </Paper>

            <SimpleGrid cols={2}>
              {options.map((option: ToolOption, index) => (
                <ToolCallButton
                  key={`tool-call-button-${toolCallId}-${index}`}
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
            <Paper p="md" radius="md" bg="white" c="var(--talia-title)" fz="sm">
              <Stack fz="sm">
                <Text m={0} fz="sm">
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
                {options.map((option: ToolOption, index) => (
                  <ToolCallButton
                    key={`tool-call-button-${toolCallId}-${index}`}
                    option={option}
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
            <Paper p="md" radius="md" bg="white" c="var(--talia-title)">
              <Stack fz="sm">
                <Text m={0} fz="sm">
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
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => (
                                  <Text
                                    fz="sm"
                                    style={{
                                      margin: 0,
                                      whiteSpace: "pre-wrap",
                                    }}
                                  >
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
                options.map((option: ToolOption, index) => (
                  <ToolCallButton
                    key={`tool-call-button-${toolCallId}-${index}`}
                    option={option}
                    onClick={async () => {
                      if (isSLS) {
                        await preFillSLSFormHandling(
                          option,
                          args.fields,
                          toolCallId
                        );
                      } else {
                        await preFillClassroomFormHandling(
                          option,
                          args.content,
                          toolCallId
                        );
                      }
                    }}
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

  // Edit Content
  const onContentChange = async (content: string) => {
    await append({
      role: "user",
      content: content,
    });
  };

  const referenceUrls =
    (message as any)?.toolInvocations?.[0]?.result?.urls ?? [];
  const messagePartLength = (message?.parts ?? []).length;

  return (
    <Stack gap="xs">
      {message?.parts?.map((part, idx) => {
        const isLastPart = idx === messagePartLength - 1;

        switch (part.type) {
          case "text": {
            return (
              <EditableAIMessage
                content={part.text}
                referenceUrls={referenceUrls}
                index={idx}
                key={`text-${idx}`}
                onContentChange={onContentChange}
                isLastAIMessage={isLastAIMessage && isLastPart}
                messageStatus={messageStatus}
                pendingToolCallConfirmation={pendingToolCallConfirmation}
              />
            );
          }
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
  setIsLoading?: (isLoading: boolean) => void,
  toggleUserNeedToCallTool?: (userNeedToCallTool?: boolean) => void
) => {
  const extendAddToolResult = ({
    toolCallId,
    result,
    pendingUserCallTool = false,
  }: {
    toolCallId: string;
    result: string;
    pendingUserCallTool?: boolean;
  }) => {
    toggleUserNeedToCallTool?.(pendingUserCallTool);
    addToolResult({
      toolCallId,
      result,
    });
  };

  const preFillSLSFormHandling = async (
    option: ToolOption,
    fields: any,
    toolCallId: string
  ) => {
    if (option.result === APPROVAL.YES) {
      try {
        setIsLoading?.(true);
        toggleUserNeedToCallTool?.(true);

        if ((await isCurrentWebsiteMatchAction()) !== "SLS") {
          extendAddToolResult({
            toolCallId,
            result:
              "Error: Inform user that need to on the Student Learning Space (SLS) tab and logged in before attempting to pre-fill content. Action needed for user.",
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
          callback: () =>
            extendAddToolResult({
              toolCallId,
              result: option.result,
            }),
        });
      } catch (error) {
        console.error("Error in preFillSLSFormHandling:", error);
        extendAddToolResult({
          toolCallId,
          result:
            "Error occurred while processing the form. Please ensure that user has been logged in.",
        });
      } finally {
        setIsLoading?.(false);
        toggleUserNeedToCallTool?.(false);
      }
    } else {
      extendAddToolResult({
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
        toggleUserNeedToCallTool?.(true);

        if ((await isCurrentWebsiteMatchAction()) !== "PG") {
          extendAddToolResult({
            toolCallId,
            result:
              "Error: Inform user that need to on the Parent Gateway (PG) tab and logged in before attempting to create a draft. Action needed for user.",
          });

          return;
        }

        const html = md.render(fields?.content);

        console.log({
          Content: fields?.content,
          Html: html,
          ReplacedHtml: html.replaceAll("\n", "<p><br/></p>"),
        });

        const json = removeEmptyListItems(
          generateJSON(
            html.replaceAll("<br>", "</p><p>").replaceAll("\n", "<p><br/></p>"),
            getSupportedExtensions()
          )
        );

        fields.content = JSON.stringify(json);

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
              extendAddToolResult({
                toolCallId,
                result: option.result,
              }),
          });
        } else {
          throw new Error(
            "Unexpected error while creating the draft. Please ensure that user has been logged in."
          );
        }
      } else {
        extendAddToolResult({
          toolCallId,
          result: "Cancel the action. I want to modify the content.",
        });
      }
    } catch (error: any) {
      console.error(error);
      extendAddToolResult({
        toolCallId,
        result: `An error occurred: ${error?.message}`,
      });
    } finally {
      setIsLoading?.(false);
      toggleUserNeedToCallTool?.(false);
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
        toggleUserNeedToCallTool?.(true);

        if ((await isCurrentWebsiteMatchAction()) !== "GoogleClassroom") {
          extendAddToolResult({
            toolCallId,
            result:
              "Error: Inform user that need to on the Google Classroom tab and logged in before attempting to pre-fill content. Action needed for user.",
          });

          return;
        }

        // commonmark mode
        const data = md.render(content).replaceAll("\n", "<p></br></p>");

        await callExtensionFunction({
          requestBody: {
            action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
            data,
          },
          callback: () =>
            extendAddToolResult({
              toolCallId,
              result: option.result,
            }),
        });
      } catch (error) {
        console.error("Error in preFillClassroomFormHandling:", error);
        extendAddToolResult({
          toolCallId,
          result:
            "Error occurred while processing the form. Please ensure that user has been logged in.",
        });
      } finally {
        setIsLoading?.(false);
        toggleUserNeedToCallTool?.(false);
      }
    } else {
      extendAddToolResult({
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
