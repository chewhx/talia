import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import {
  ColorSchemeScript,
  createTheme,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import "@fontsource/geist-sans";
import "./globals.css";
import type { Metadata } from "next";
import { Notifications } from "@mantine/notifications";

export const metadata: Metadata = {
  title: "Hey Talia",
  description: "Chatbot",
  icons: "/favicon.png",
};

const theme = createTheme({
  primaryColor: "dark",
  defaultRadius: "md",
  fontFamily: "Geist Sans, sans-serif",
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
      <body>
        <MantineProvider theme={theme}>
          <Notifications />
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
