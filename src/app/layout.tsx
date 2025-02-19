import {
  AppShell,
  AppShellHeader,
  AppShellMain,
  ColorSchemeScript,
  Container,
  createTheme,
  Group,
  mantineHtmlProps,
  MantineProvider,
  Space,
  Text,
} from "@mantine/core";
import "@mantine/core/styles.css";
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Hey Talia",
  description: "Chatbot",
};

const theme = createTheme({
  primaryColor: "dark",
  defaultRadius: "md",
  fontFamily: "Geist, sans-serif",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <MantineProvider theme={theme}>
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
        </MantineProvider>
      </body>
    </html>
  );
}
