"use client";
import { createClient } from "@/utils/supabase/client";
import {
  ActionIcon,
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
  Group,
  Menu,
  Space,
  Text,
} from "@mantine/core";
import { IconDashboard, IconHistory, IconLogout2, IconMenu2, IconMessageChatbot } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import Cookies from "js-cookie";

export default function Header({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState<string | null>(null);

  useEffect(() => {
    const displayNameFromCookies = Cookies.get("user-displayName");
    if (displayNameFromCookies) {
      setDisplayName(displayNameFromCookies);
    }
  }, []);

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    if (result.error) {
      alert(result.error.message);
    } else {
      Cookies.remove("user-displayName");
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <AppShell header={{ height: 50 }} withBorder={false}>
      <AppShellHeader>
        <Container size="sm">
          <Group align="center" h="50" justify="space-between">
            <Text fz="lg" fw={600} style={{ letterSpacing: "-0.03em" }}>
              HeyTalia
            </Text>

            <Menu shadow="md" width={200}>
              <Menu.Target>
                <ActionIcon variant="subtle">
                  <IconMenu2 />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    padding: "8px 12px",
                  }}
                >
                  Hi, {displayName}
                </Menu.Label>

                <Menu.Item
                  onClick={() => router.push("/chat")}
                  leftSection={<IconMessageChatbot size={18} />}
                >
                  Chatbot
                </Menu.Item>

                <Menu.Item
                  onClick={() => router.push("/dashboard")}
                  leftSection={<IconDashboard size={18} />}
                >
                  Dashboard
                </Menu.Item>

                <Menu.Divider />

                <Menu.Item
                  onClick={signOut}
                  color="red"
                  leftSection={<IconLogout2 size={18} />}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
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
