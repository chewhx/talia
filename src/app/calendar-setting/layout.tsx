"use client";
import { Header } from "@/components/header/header";
import { AppShell, AppShellMain } from "@mantine/core";
import { ReactNode, useEffect } from "react";
import { verifyUserAuthStatus } from "../actions";

export default function Layout({ children }: { readonly children: ReactNode }) {
  useEffect(() => {
    const verify = async () => {
      await verifyUserAuthStatus();
    };

    verify();
  }, []);

  return (
    <AppShell
      header={{ height: 50 }}
      withBorder={false}
      bg={"var(--talia-background)"}
    >
      <Header />
      <AppShellMain>{children}</AppShellMain>
    </AppShell>
  );
}
