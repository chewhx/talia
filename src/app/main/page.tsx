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
        behavior: smooth ? "smooth" : "auto",
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

  // Scroll while streaming
  useEffect(() => {
    if (status === "streaming") {
      const scrollInterval = setInterval(scrollToBottom, 400);
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
          {/* <ExtensionActionButton /> */}

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

                {pendingToolCallConfirmation ||
                  status === "streaming" ||
                  (status === "submitted" && (
                    <Group justify="center" py="md">
                      <Loader type="dots" />
                    </Group>
                  ))}

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
      />
    </Box>
  );
}
