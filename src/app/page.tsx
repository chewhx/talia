"use client";

import AIMessage from "@/components/ai-message";
import HumanMessage from "@/components/human-message";
import PromptInput from "@/components/prompt-input";
import { useChat } from "@ai-sdk/react";
import {
  Container,
  Space,
  Stack,
  Text,
  TypographyStylesProvider,
} from "@mantine/core";

export default function Home() {
  const { messages, input, handleInputChange, handleSubmit, status, stop } =
    useChat();
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
                  return <HumanMessage message={message} />;
                case "assistant":
                  return <AIMessage>{message.content}</AIMessage>;
                default:
                  return null;
              }
            })}
          </Stack>
        )}
      </TypographyStylesProvider>
      <Space h={300} />
      <PromptInput
        stop={stop}
        status={status}
        input={input}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
      />
    </Container>
  );
}
