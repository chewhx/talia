"use client";
import { createClient } from "@/utils/supabase/client";
import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  Container,
  Group,
  Space,
  Text,
} from "@mantine/core";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { ReactNode } from "react";
import { UserProvider } from "./context/userContext";
import { HeaderMenu } from "./headerMenu";

export default function Header({ children }: { readonly children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  const signOut = async () => {
    const result = await supabase.auth.signOut();
    if (result.error) {
      alert(result.error.message);
    } else {
      Cookies.remove("user-displayName");
      Cookies.remove("user-id");
      Cookies.remove("user-role");
      router.push("/login");
      router.refresh();
    }
  };

  return (
    <UserProvider>
      <AppShell header={{ height: 50 }} withBorder={false}>
        <AppShellHeader>
          <Container size="sm">
            <Group align="center" h="50" justify="space-between">
              <Text fz="lg" fw={600} style={{ letterSpacing: "-0.03em" }}>
                HeyTalia
              </Text>

              <HeaderMenu signOut={signOut} />
            </Group>
          </Container>
        </AppShellHeader>
        <AppShellMain>
          <Space h={10} />
          {children}
        </AppShellMain>
      </AppShell>
    </UserProvider>
  );
}
