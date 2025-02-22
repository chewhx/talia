"use client";

import AIMessage from "@/components/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input";
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
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";
import { mockAnnouncement } from "@/schema/announcementDraft.schema";
import { useWindowEvent } from "@mantine/hooks";
import { TALIA_EVENTS } from "../../../shared/constants";

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
    const chromeExtensionID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID;
    const allowedDomain = ["http://localhost:8082", chromeExtensionID];

    if (!allowedDomain.includes(origin)) {
      return;
    }

    switch (data.action) {
      case TALIA_EVENTS.listeners.SCAN_FORM_RESPONSE: {
        const receivedData = data.data; // This is the data passed from the extension
        console.log("🟢 Web App: SCAN_FORM_RESPONSE", JSON.parse(receivedData));
        break;
      }

      case TALIA_EVENTS.listeners.PG_DRAFT_RESPONSE: {
        console.log("🟢 WebApp: PG_DRAFT_RESPONSE", JSON.parse(data));
        break;
      }

      case TALIA_EVENTS.listeners.PG_UNAUTHORIZED: {
        console.log("🟢 WebApp: PG_UNAUTHORIZED");
        break;
      }
    }
  });

  const scanFormFields = () => {
    console.log("🟢 Web App: SCAN_FORM_REQUEST");
    window.parent.postMessage(
      { action: TALIA_EVENTS.actions.SCAN_FORM_REQUEST },
      "*"
    );
  };

  const submitDraft = async () => {
    try {
      console.log("🟢 Web App: PG_DRAFT_REQUEST");

      window.parent.postMessage(
        {
          action: TALIA_EVENTS.actions.PG_DRAFT_REQUEST,
          type: "announcement",
          data: JSON.stringify(mockAnnouncement),
        },
        `http://localhost:8082`
      );
    } catch (error) {
      console.log({ error });
    }
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

            <Button onClick={scanFormFields}>Scan</Button>
            <Space h={50} />
            <Button onClick={submitDraft}>Draft</Button>
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
