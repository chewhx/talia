"use client";

import AIMessage from "@/components/ai-message/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input/prompt-input";
import { PromptShortcuts } from "@/components/prompt-shortcuts";
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
import { ChatRequestOptions, generateId } from "ai";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";
import { ExtensionActionButton } from "@/components/extension-action-buttons";
import { create } from "zustand";
import { useUserNeedToCallTool } from "@/components/ai-message/user-need-call-tool-hook";

export default function MainPage() {
  const { userNeedToCallTool } = useUserNeedToCallTool();
  const {
    messages,
    input,
    status,
    error,
    handleInputChange,
    handleSubmit,
    stop,
    addToolResult,
    reload,
    setMessages,
    append,
  } = useChat({
    async onError(error) {
      setMessages((existingMessage) => [
        ...existingMessage,
        {
          role: "assistant",
          content: error.message,
          id: generateId(),
        },
      ]);
    },
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

  const customReload = async (_chatRequestOptions?: ChatRequestOptions) => {
    if (error !== null && error?.message && status === "error") {
      const errors = JSON.stringify(
        error.message.match(/-\s\*\*(.+?)\*\*:\s(.+)/g)
      );

      return await reload({
        allowEmptySubmit: true,
        data: {
          error: errors,
        },
      });
    }
  };

  // Scrolling state and refs
  const contentRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const scrollToBottom = useCallback((smooth = true) => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
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
                <Text c="var(--talia-purple-1)" fw={700} fz="xl" m={0}>
                  Hey Jane!
                </Text>
                <Text fz="xl" fw={600}>
                  How may I help you today?
                </Text>

                <PromptShortcuts append={append} />
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

                {((pendingToolCallConfirmation && !userNeedToCallTool) ||
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
        customSubmit={customReload}
        error={error}
        disabled={pendingToolCallConfirmation}
        stop={stop}
        status={status}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        reload={customReload}
      />
    </Box>
  );
}
