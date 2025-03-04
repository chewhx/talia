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
import { tools } from "../api/chat/tools";
import { getToolsRequiringConfirmation } from "../api/chat/utils";
import { useUser } from "@/components/header/context/userContext";
import CenteredLoader from "@/components/centeredLoader";

export default function ChatPage() {
  const { displayName, isLoading } = useUser();

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

  if (error) {
    append({
      content: error?.message,
      role: "system",
    });
  }

  if (isLoading) {
    return <CenteredLoader message="Preparing your chat experience..." />; // Or any other loading indicator
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
        <Box
          style={{
            flex: 1,
            overflowY: "auto",
            paddingBottom: "20px",
            width: "100%",
            position: "relative",
          }}
        >
          <TypographyStylesProvider>
            {!messages.length ? (
              <Stack gap={0}>
                <Space h={50} />
                <Text c="orange" fw={600} fz="xl" m={0}>
                  Hey {displayName ?? "there"}!
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
