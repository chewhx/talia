import { Button, Grid, Text } from "@mantine/core";
import { ChatRequestOptions, CreateMessage, Message, generateId } from "ai";

type PromptShortcutsProps = {
  append: (
    message: Message | CreateMessage,
    chatRequestOptions?: ChatRequestOptions | undefined
  ) => Promise<string | null | undefined>;
};

export const PromptShortcuts = ({ append }: PromptShortcutsProps) => {
  const PROMPT_SHORTCUTS: {
    title: string;
    disabled: boolean;
    onClick?: () => Promise<void>;
  }[] = [
    {
      disabled: false,
      title: "📢 PG announcement",
      onClick: async () => {
        await append({
          content: "Draft a Parent Gateway (PG) announcement.",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: false,
      title: "📝 PG form",
      onClick: async () => {
        await append({
          content: "Draft a Parent Gateway (PG) form.",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: false,
      title: "📎 School letter (PDF/Word)",
      onClick: async () => {
        await append({
          content: "Draft an school letter (PDF/Word)",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: false,
      title: "📧 Email",
      onClick: async () => {
        await append({
          content: "Send an email.",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: false,
      title: "📢 SLS announcement",
      onClick: async () => {
        await append({
          content: "Draft a Student Learning Space (SLS) announcement.",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: false,
      title: "📢 Google classroom announcement",
      onClick: async () => {
        await append({
          content: "Draft a Google Classroom announcement.",
          role: "user",
          id: generateId(),
        });
      },
    },
    {
      disabled: true,
      title: "🐰AllEars form",
    },
    {
      disabled: true,
      title: "📌 Flexilist",
    },
    {
      disabled: true,
      title: " 🗓️ Schedule meeting",
    },
  ];

  return (
    <Grid overflow="hidden" align="flex-start" justify="flex-start" gutter="md">
      {PROMPT_SHORTCUTS.map(({ disabled, title, onClick }, index) => (
        <Grid.Col key={`shortcut-${index}`} span="content">
          <Button
            bg={disabled ? "var(--talia-disabled)" : "var(--talia-purple-2)"}
            variant="light"
            onClick={onClick}
            disabled={disabled}
          >
            <Text fw={400} size="sm" c={"var(--talia-title)"}>
              {title}
            </Text>
          </Button>
        </Grid.Col>
      ))}
    </Grid>
  );
};
