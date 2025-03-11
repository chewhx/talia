"use client";
import { Header } from "@/components/header/header";
import { UserProvider } from "@/context/userContext";
import { CalendarEvent } from "@/utils/calendar";
import { AppShell, AppShellMain } from "@mantine/core";
import { ReactNode } from "react";

export default function ChatContainer({
  children,
  events,
}: {
  readonly children: ReactNode;
  events: CalendarEvent[];
}) {
  return (
    <UserProvider calendarEvents={events}>
      <AppShell
        header={{ height: 50 }}
        withBorder={false}
        bg="var(--talia-background)"
      >
        <Header />
        <AppShellMain>{children}</AppShellMain>
      </AppShell>
    </UserProvider>
  );
}
