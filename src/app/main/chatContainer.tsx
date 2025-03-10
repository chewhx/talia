"use client";
import { Header } from "@/components/header/header";
import { UserProvider } from "@/context/userContext";
import { AppShell, AppShellMain } from "@mantine/core";
import { ReactNode, useEffect } from "react";
import { verifyUserAuthStatus } from "../actions";

export default function ChatContainer({
  children,
  events,
}: {
  readonly children: ReactNode;
  events: any;
}) {
  useEffect(() => {
    const verify = async () => {
      await verifyUserAuthStatus();
    };

    verify();
  }, []);

  return (
    <UserProvider calendarEvents={events}>
      <AppShell
        header={{ height: 50 }}
        withBorder={false}
        bg={"var(--talia-background)"}
      >
        <Header />
        <AppShellMain>{children}</AppShellMain>
      </AppShell>
    </UserProvider>
  );
}
