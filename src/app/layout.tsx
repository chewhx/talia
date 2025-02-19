import {
  ColorSchemeScript,
  createTheme,
  mantineHtmlProps,
  MantineProvider,
} from "@mantine/core";
import "@mantine/core/styles.css";
import "@fontsource/geist-sans";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hey Talia",
  description: "Chatbot",
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
        <MantineProvider theme={theme}>{children}</MantineProvider>
      </body>
    </html>
  );
}
