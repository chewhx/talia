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
        error={error}
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
