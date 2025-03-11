"use client";
import { Header } from "@/components/header/header";
import { UserProvider } from "@/context/userContext";
import { AppShell, AppShellMain } from "@mantine/core";
import { ReactNode } from "react";

export default function Layout({ children }: { readonly children: ReactNode }) {
  return (
    <UserProvider>
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
