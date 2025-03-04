// components/CenteredLoader.tsx
import React from "react";
import { Center, Loader, Text, Stack, Paper, Transition } from "@mantine/core";

interface CenteredLoaderProps {
  message?: string;
  color?: string;
}

const CenteredLoader: React.FC<CenteredLoaderProps> = ({
  message = "Loading...",
  color = "blue",
}) => {
  return (
    <Center style={{ height: "100vh" }}>
      <Transition
        mounted={true}
        transition="fade"
        duration={400}
        timingFunction="ease"
      >
        {(styles) => (
          <Paper shadow="md" p="xl" radius="md" style={styles}>
            <Stack align="center">
              <Loader size="lg" variant="bars" color={color} />
              <Text size="sm" c="dimmed" aria-live="polite">
                {message}
              </Text>
            </Stack>
          </Paper>
        )}
      </Transition>
    </Center>
  );
};

export default CenteredLoader;
