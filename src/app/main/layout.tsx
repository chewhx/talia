import { env } from "@/env";
import {
  Anchor,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
  Group,
  Image,
  Space,
  Text,
} from "@mantine/core";
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

const logoImg = "/favicon.png";

export default function Layout({ children }: { readonly children: ReactNode }) {
  const cookieStore = cookies();
  const talia_password = cookieStore.get("talia_password")?.value;

  if (talia_password !== env.TALIA_PASSWORD) {
    redirect("/");
  }

  return (
    <AppShell
      header={{ height: 50 }}
      withBorder={false}
      bg={"var(--talia-background)"}
    >
      <AppShellHeader>
        <Container size="sm">
          <Group align="center" h="50">
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
        </Container>
      </AppShellHeader>
      <AppShellMain>
        <Space h={10} />
        {children}
      </AppShellMain>
    </AppShell>
  );
}
