import {
  Group,
  Image,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from "@mantine/core";
import { IconPaperclip } from "@tabler/icons-react";
import { Attachment, UIMessage } from "ai";
import Markdown from "./markdown";

export default function HumanMessage({ message }: { message: UIMessage }) {
  return (
    <Stack align="end">
      <Paper
        px="md"
        py="xs"
        radius="md"
        fz="sm"
        bg="var(--talia-purple-3)"
        maw="80%"
        c="var(--talia-title)"
      >
        <Markdown>{message.content}</Markdown>
      </Paper>
      {message?.experimental_attachments?.map((attachment, index) => (
        <AttachmentMessage
          attachment={attachment}
          key={`attachment-${attachment.name}-${index}`}
        />
      ))}
    </Stack>
  );
}

function AttachmentMessage({ attachment }: { attachment: Attachment }) {
  if (attachment.contentType?.startsWith("image/")) {
    return (
      <Image src={attachment.url} alt={attachment.name} radius="md" w={250} />
    );
  }

  return (
    <UnstyledButton>
      <Paper
        withBorder
        p="xs"
        px="sm"
        radius="lg"
        miw={200}
        c="var(--talia-title)"
      >
        <Group>
          <ThemeIcon size="lg">
            <IconPaperclip size="18" />
          </ThemeIcon>
          <Stack gap={0}>
            <Text fz="sm" fw={500} m={0}>
              {attachment.name}
            </Text>
            <Text fz="xs" tt="uppercase" m={0}>
              {attachment?.name?.split(".").at(-1)}
            </Text>
          </Stack>
        </Group>
      </Paper>
    </UnstyledButton>
  );
}
