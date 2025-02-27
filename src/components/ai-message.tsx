import { renderToolUIVariables, tools } from "@/app/api/chat/tools";
import {
  getToolsRequiringConfirmation,
  callExtensionFunction,
  APPROVAL,
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
import { mapFieldsToSchema } from "@/schema/studentLearningSpace.schema";
import { parseToTiptap } from "@/app/api/generateRichText/utils";

const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);

type ToolOption = {
  title: string;
  description: string;
  result: string;
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
      const formFields = await callExtensionFunction(
        {
          action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST,
        },
        TALIA_EVENTS.listeners.SCAN_FORM_RESPONSE
      );

      const mappedFields = mapFieldsToSchema(
        JSON.parse(formFields.result),
        fields
      );

      await callExtensionFunction(
        {
          action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
          data: JSON.stringify(mappedFields),
        },
        undefined,
        () => {
          addToolResult({
            toolCallId,
            result: option.result,
          });
        }
      );
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

      const draftDetails = await callExtensionFunction(
        {
          action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
          data: {
            ...fields,
            content: JSON.stringify(parseToTiptap(formattedContent, true)),
          },
          type: postType,
        },
        TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE
      );

      const draftID =
        postType === "PG_ANNOUNCEMENT"
          ? draftDetails?.result?.announcementDraftId
          : draftDetails?.result?.consentFormDraftId;

      if (draftID) {
        addToolResult({
          toolCallId,
          result: option.result,
        });

        await callExtensionFunction({
          action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,
          draftInfo: {
            id: draftID,
            type:
              postType === "PG_ANNOUNCEMENT" ? "announcements" : "consentForms",
          },
        });
      } else {
        addToolResult({
          toolCallId,
          result: `${option.result} However, there are some unexpected error. Please try again.`,
        });
        return;
      }
    }

    addToolResult({
      toolCallId,
      result: option.result,
    });
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
              (toolInvocation.toolName === "createPGAnnouncementDraft" ||
                toolInvocation.toolName === "createPGAnnouncementDraft")
            ) {
              const { options } = renderToolUIVariables(
                toolInvocation.toolName
              );

              const isAnnouncement =
                toolInvocation.toolName === "createPGAnnouncementDraft";
              const fields = toolInvocation.args?.fields ?? {};
              const formattedArgs =
                "```\n" + JSON.stringify(fields, null, 2) + "\n```";

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
              toolInvocation.toolName === "prefillSLSForm"
            ) {
              const { options } = renderToolUIVariables(
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
                          await preFillSLSFormHandling(
                            option,
                            args.fields,
                            toolCallId
                          );
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
