"use client";

import AIMessage from "@/components/ai-message/ai-message";
import { useUserNeedToCallTool } from "@/components/ai-message/user-need-call-tool-hook";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input/prompt-input";
import { PromptShortcuts } from "@/components/prompt-shortcuts";
import { useUser } from "@/context/userContext";
import { Message, useChat } from "@ai-sdk/react";
import {
  Box,
  Center,
  Container,
  Group,
  Loader,
  Skeleton,
  Space,
  Stack,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";
import { useInViewport, useMergedRef, useScrollIntoView } from "@mantine/hooks";
import { ChatRequestOptions, generateId } from "ai";
import { useEffect, useMemo } from "react";
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";

export default function MainPage() {
  const { calendarEvents, userDetails, isLoading } = useUser();
  const { userNeedToCallTool } = useUserNeedToCallTool();

  const chatOptions = useMemo(
    () => ({
      body: { calendarEvents },
      onError: async (error: Error) => {
        setMessages((existingMessages) => [
          ...existingMessages,
          {
            role: "assistant",
            content: error.message,
            id: generateId(),
          },
        ]);
      },
    }),
    [calendarEvents]
  );

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
  } = useChat(chatOptions);

  const toolsRequiringConfirmation = useMemo(
    () => getToolsRequiringConfirmation(tools),
    []
  );

  const pendingToolCallConfirmation = useMemo(
    () =>
      messages.some((m: Message) =>
        m.parts?.some(
          (part) =>
            part.type === "tool-invocation" &&
            part.toolInvocation.state === "call" &&
            toolsRequiringConfirmation.includes(part.toolInvocation.toolName)
        )
      ),
    [messages, toolsRequiringConfirmation]
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
  const { targetRef, scrollIntoView } = useScrollIntoView<HTMLDivElement>();
  const { ref, inViewport } = useInViewport();
  const mergedRef = useMergedRef(targetRef, ref);

  useEffect(() => {
    if (
      !inViewport &&
      (status === "streaming" || pendingToolCallConfirmation)
    ) {
      scrollIntoView();
    }
  }, [inViewport, scrollIntoView, status, pendingToolCallConfirmation]);

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
          style={{
            flex: 1,
            overflowY: "auto",
            width: "100%",
            position: "relative",
          }}
        >
          <TypographyStylesProvider>
            {!messages.length ? (
              <Stack gap={0}>
                <Space h={50} />

                <Skeleton visible={isLoading} height={28} width="200">
                  <Text c="var(--talia-purple-1)" fw={700} fz="xl" m={0}>
                    Hey {userDetails?.displayName ?? "There"}!
                  </Text>
                </Skeleton>

                <Text fz="xl" fw={600} c="var(--talia-title)">
                  How may I help you today?
                </Text>

                <PromptShortcuts append={append} />
              </Stack>
            ) : (
              <Stack>
                {messages.map((message, index) => {
                  if (message.role === "user") {
                    return <HumanMessage key={message.id} message={message} />;
                  } else {
                    const isLastAIMessage = index === messages.length - 1;
                    return (
                      <AIMessage
                        key={message.id}
                        message={message}
                        addToolResult={addToolResult}
                        append={append}
                        isLastAIMessage={isLastAIMessage}
                        messageStatus={status}
                        pendingToolCallConfirmation={
                          pendingToolCallConfirmation
                        }
                      />
                    );
                  }
                })}

                {(userNeedToCallTool ||
                  status === "streaming" ||
                  status === "submitted") && (
                  <Group justify="center" py="md">
                    <Loader type="dots" />
                  </Group>
                )}
              </Stack>
            )}
          </TypographyStylesProvider>
          <Box h={20} ref={mergedRef} />
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
