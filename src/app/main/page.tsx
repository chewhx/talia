"use client";

import AIMessage from "@/components/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input";
import { mockAnnouncement } from "@/schema/announcementDraft.schema";
import { mockForm } from "@/schema/formDraft.schema";
import { Message, useChat } from "@ai-sdk/react";
import {
  Button,
  Container,
  Group,
  Loader,
  Space,
  Stack,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";
import { useWindowEvent } from "@mantine/hooks";
import { TALIA_EVENTS } from "../../../shared/constants";
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";
import { useState } from "react";

export default function MainPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    addToolResult,
  } = useChat({
    maxSteps: 5,
  });

  const toolsRequiringConfirmation = getToolsRequiringConfirmation(tools);
  const [draftInfo, setDraftInfo] = useState<{} | null>(null);
  const [mockData, setMockData] = useState<string>("mock-data");
  const chromeExtensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;

  // used to disable input while confirmation is pending
  const pendingToolCallConfirmation = messages.some((m: Message) =>
    m.parts?.some(
      (part) =>
        part.type === "tool-invocation" &&
        part.toolInvocation.state === "call" &&
        toolsRequiringConfirmation.includes(part.toolInvocation.toolName)
    )
  );

  // TODO: Listen to the chrome extension for the schema
  // TODO: Pass this schema to the LLM upon tool result return by
  // TODO: Post final message with filled in schema to extension

  useWindowEvent("message", ({ data, origin }: MessageEvent) => {
    const allowedDomain = [chromeExtensionID];

    // Only get response through chrome extension (panel.js or background.js)
    if (!allowedDomain.includes(origin)) {
      return;
    }

    switch (data.action) {
      case TALIA_EVENTS.listeners.SCAN_FORM_RESPONSE: {
        const receivedData = JSON.parse(data?.result ?? {});
        console.log("🟢 HeyTalia: SCAN_FORM_RESPONSE", receivedData);

        let mockData = [];
        if (data?.currentWebsite === "SLS") {
          mockData = receivedData.map((field) => {
            const id = field?.id;

            if (field.category === "title") {
              return { id, value: "mock-title" };
            } else if (field.category === "start-date") {
              return { id, value: "25 Feb 2025" };
            } else if (field.category === "start-time") {
              return { id, value: "10:30" };
            } else if (field.category === "message") {
              return { id, value: "<b>mock-</b>message" };
            }

            return {
              id: field.id,
              value: "mock-" + (field?.attributes?.placeholder ?? "data"),
            };
          });
        } else if (data?.currentWebsite === "GoogleClassroom") {
        }
        setMockData(JSON.stringify(mockData));

        break;
      }

      case TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE: {
        const receivedData = JSON.parse(data.result ?? {});
        console.log("🟢 HeyTalia: PG_DRAFT_RESPONSE", receivedData);
        if (receivedData?.announcementDraftId) {
          setDraftInfo({
            id: receivedData.announcementDraftId,
            type: "announcements",
          });
        } else if (receivedData?.consentFormDraftId) {
          setDraftInfo({
            id: receivedData.consentFormDraftId,
            type: "consentForms",
          });
        }

        break;
      }

      case TALIA_EVENTS.listeners.PG_UNAUTHORIZED: {
        console.log("🟢 HeyTalia: PG_UNAUTHORIZED");
        break;
      }
    }
  });

  const scanFormFields = () => {
    sendMessageToExtension({ action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST });
  };

  const submitDraft = (
    type: "PG_ANNOUNCEMENT" | "PG_CONSENT_FORM",
    data: any
  ) => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
      type,
      data: JSON.stringify(data),
    });
  };

  const goToDraftPage = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,

      draftInfo: draftInfo,
    });
  };

  const fillForm = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
      data: mockData,
    });
  };

  const sendMessageToExtension = (data: any) => {
    console.log(`🟢 HeyTalia: ${data?.action}`);
    window.parent.postMessage(data, `${chromeExtensionID}`);
  };

  return (
    <Container size="sm">
      <TypographyStylesProvider>
        {!messages.length ? (
          <Stack gap={0}>
            <Space h={100} />
            <Text c="orange" fw={600} fz="xl" m={0}>
              Hey there!
            </Text>
            <Text fz="xl" fw={600}>
              How may I help you today?
            </Text>

            <Button mt={10} onClick={scanFormFields}>
              Scan
            </Button>
            <Button
              mt={10}
              onClick={() => submitDraft("PG_CONSENT_FORM", mockForm)}
            >
              DraftForm
            </Button>
            <Button
              mt={10}
              onClick={() => submitDraft("PG_ANNOUNCEMENT", mockAnnouncement)}
            >
              DraftAnn
            </Button>

            <Button mt={10} onClick={goToDraftPage}>
              DraftPage
            </Button>
            <Button mt={10} onClick={fillForm}>
              Fill Form
            </Button>
          </Stack>
        ) : (
          <Stack>
            {messages.map((message) => {
              switch (message.role) {
                case "user":
                  return <HumanMessage message={message} key={message.id} />;
                case "assistant":
                  return (
                    <AIMessage
                      message={message}
                      addToolResult={addToolResult}
                      key={message.id}
                    />
                  );
                default:
                  return null;
              }
            })}
          </Stack>
        )}
      </TypographyStylesProvider>
      {pendingToolCallConfirmation ||
      status === "streaming" ||
      status === "submitted" ? (
        <Group justify="center" py="md">
          <Loader type="dots" />
        </Group>
      ) : null}
      <Space h={300} />
      <PromptInput
        disabled={pendingToolCallConfirmation}
        stop={stop}
        status={status}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
}
