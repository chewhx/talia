import { env } from "@/env";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
  Group,
  Space,
  Text,
} from "@mantine/core";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export default function Layout({ children }: { readonly children: ReactNode }) {
  const cookieStore = cookies();
  const talia_password = cookieStore.get("talia_password")?.value;

  if (talia_password !== env.TALIA_PASSWORD) {
    redirect("/");
  }

  return (
    <AppShell header={{ height: 50 }} withBorder={false}>
      <AppShellHeader>
        <Container size="sm">
          <Group align="center" h="50">
            <Text fz="lg" fw={600} style={{ letterSpacing: "-0.03em" }}>
              HeyTalia
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
