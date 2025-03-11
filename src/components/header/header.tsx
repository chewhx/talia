"use client";

import {
  AppShellHeader,
  Container,
  Group,
  Image,
  Space,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { HeaderMenu } from "./headerMenu";

const logoImg = "/favicon.png";

export const Header = () => {
  const [isIframe, setIsIframe] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsIframe(window.self !== window.top);
    }
  }, []);

  return (
    <>
      <AppShellHeader>
        <Container size="sm">
          <Group align="center" h="50" justify="space-between">
            <UnstyledButton
              onClick={() => {
                window.location.reload();
              }}
            >
              <Group>
                <Image
                  radius="md"
                  src={logoImg}
                  fit="contain"
                  w="auto"
                  h={28}
                  alt="logo"
                />
                <Text fz="lg" fw={600}>
                  <span>Hey</span>
                  <span style={{ color: "var(--talia-purple-1)" }}>Talia</span>
                </Text>
              </Group>
            </UnstyledButton>

            <HeaderMenu />
          </Group>
        </Container>
      </AppShellHeader>

      <Space h={10} />
    </>
  );
};
