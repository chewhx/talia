"use client";

import AIMessage from "@/components/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input";
import { Message, useChat } from "@ai-sdk/react";
import {
  Container,
  Group,
  Loader,
  Space,
  Stack,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";
import { useWindowEvent } from "@mantine/hooks";
import { useState } from "react";
import { TALIA_EVENTS } from "../../../shared/constants";
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";

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
      // For SLS/Classroom
      // Listen the field attributes (id, name, etc)
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

      // For PG only
      // Listen the create draft response
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

  // For SLS, GoogleClassroom, FormSG, etc
  // Send request to extension to scan form field
  // Action name: "SCAN_FORM_REQUEST"
  const scanFormFields = () => {
    sendMessageToExtension({ action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST });
  };

  // For SLS, GoogleClassroom, FormSG, etc
  // Send request to extension, extension will fill in field in the active tab (SLS/Classroom)
  // action: "FILL_FORM_REQUEST"
  // data:
  //    SLS: refer to studentLearningSpace.schema.ts > StudentLearningSpacePrefillSchema
  //    classroom: refer to googleClassroom.schema.ts
  const fillForm = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.FILL_FORM_REQUEST,
      data: mockData,
    });
  };

  // For PG only
  // Send request to extension, extension will send request create draft to pgw
  // action: "PG_DRAFT_REQUEST"
  // type: Post type (Announcement or Form)
  // data: Format refer to file announcementDraft.schema.ts or formDraft.schema.ts. Need in string type because too much data
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

  // For PG only
  // Send request to extension, extension will change the active tab url to draft page
  // action: "GO_DRAFT_PAGE"
  // data: {
  //   id: announcementDraftId || consentFormDraftId,
  //   type: "announcements" || "consentForms",
  // }
  const goToDraftPage = () => {
    sendMessageToExtension({
      action: TALIA_EVENTS.actions.GO_DRAFT_PAGE,
      draftInfo: draftInfo,
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
