import { Paper } from "@mantine/core";
import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function AIMessage({ children }: React.PropsWithChildren) {
  return (
    <Paper px="xs" py="5" fz="sm" bg="white" w="100%">
      <Markdown remarkPlugins={[remarkGfm]}>{String(children)}</Markdown>
    </Paper>
  );
}
