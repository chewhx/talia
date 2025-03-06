import { ToolOption } from "@/app/api/chat/tools";
import { Paper, Stack, Text, UnstyledButton } from "@mantine/core";

type ToolCallButtonProps = {
  option: ToolOption;
  toolCallId: string;
  onClick: () => void;
};

export const ToolCallButton = ({
  onClick,
  option,
  toolCallId,
}: ToolCallButtonProps) => {
  return (
    <UnstyledButton
      key={`toolCall-${toolCallId}-option-${option.title}`}
      onClick={onClick}
      className="custom-tool-button"
    >
      <Paper shadow="sm" radius={0} bg={"var(--talia-purple-2)"} p="sm">
        <Stack gap={0}>
          <Text fw="bold" m={0} fz="sm">
            {option.title}
          </Text>
          <Text fz="xs" c="var(--talia-dimmed)">
            {option.description}
          </Text>
        </Stack>
      </Paper>
    </UnstyledButton>
  );
};
