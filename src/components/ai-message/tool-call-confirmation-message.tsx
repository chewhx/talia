import { Text } from "@mantine/core";

type ToolCallConfirmationMessageProps = {
  platform: string;
};

export const ToolCallConfirmationMessage = ({
  platform,
}: ToolCallConfirmationMessageProps) => {
  return (
    <Text fw={500} m={0} fz="sm" c="var(--talia-title)">
      📌 Ensure you are on the{" "}
      <span
        style={{
          fontWeight: "bold",
          textDecorationLine: "underline",
        }}
      >
        {platform}
      </span>{" "}
      tab and logged in. If everything is correct, click <b>Confirm</b> to
      proceed. Otherwise, click <b>Cancel</b> and let me know what needs to be
      changed!
    </Text>
  );
};
