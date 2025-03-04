"use client";

import AIMessage from "@/components/ai-message/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input/prompt-input";
import { Message, useChat } from "@ai-sdk/react";
import {
  Box,
  Container,
  Group,
  Loader,
  Space,
  Stack,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";
import { ExtensionActionButton } from "@/components/extension-action-buttons";

export default function MainPage() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    status,
    stop,
    addToolResult,
    error,
    reload,
    append,
  } = useChat({
    maxSteps: 10,
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

  // Scrolling state and refs
  const contentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "auto",
      });
    }
  }, []);

  // Scroll on first render and when new messages are added
  useLayoutEffect(() => {
    if (isFirstRender.current) {
      scrollToBottom();
      isFirstRender.current = false;
    }
  }, [scrollToBottom]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (status === "submitted") {
      const scrollInterval = setInterval(scrollToBottom, 3000);
      return () => clearInterval(scrollInterval);
    }
  }, [status, scrollToBottom]);

  if (error) {
    append({
      content: error?.message,
      role: "system",
    });
  }

  return (
    <Box style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Container
        size="sm"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
        }}
      >
        {/* <ExtensionActionButton /> */}
        <Box
          ref={contentRef}
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "20px",
            width: "100%",
          }}
        >
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
                  const MessageComponent =
                    message.role === "user" ? HumanMessage : AIMessage;

                  return (
                    <MessageComponent
                      key={message.id}
                      message={message}
                      addToolResult={addToolResult}
                    />
                  );
                })}

                {(pendingToolCallConfirmation ||
                  status === "streaming" ||
                  status === "submitted") && (
                  <Group justify="center" py="md">
                    <Loader type="dots" />
                  </Group>
                )}

                <div ref={messagesEndRef} style={{ height: "1px" }} />
              </Stack>
            )}
          </TypographyStylesProvider>
        </Box>
      </Container>

      <PromptInput
        error={error}
        disabled={pendingToolCallConfirmation}
        stop={stop}
        status={status}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        reload={reload}
      />
    </Box>
  );
}
