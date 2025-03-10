"use client";

import {
  AppShellHeader,
  Container,
  Group,
  Image,
  Space,
  Text,
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
    !isIframe && (
      <>
        <AppShellHeader>
          <Container size="sm">
            <Group align="center" h="50" justify="space-between">
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

              <HeaderMenu />
            </Group>
          </Container>
        </AppShellHeader>

        <Space h={10} />
      </>
    )
  );
};
