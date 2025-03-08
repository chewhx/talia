"use client";

import { UseChatHelpers } from "@ai-sdk/react";
import { ActionIcon, Button, Flex, Paper, Space, Tooltip } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconEdit } from "@tabler/icons-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { marked } from "marked";
import { useEffect, useState } from "react";
import { Markdown as MarkdownExtension } from "tiptap-markdown";
import TurndownService from "turndown";
import Markdown from "../markdown";

type EditableAIMessageProps = {
  content: string;
  index: number;
  isLastAIMessage: boolean;
  onContentChange?: (newContent: string) => void;
  messageStatus: UseChatHelpers["status"];
};

export const EditableAIMessage = ({
  content,
  index,
  isLastAIMessage,
  messageStatus,
  onContentChange,
}: EditableAIMessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);
  const [isHovered, setIsHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize turndown service for HTML to Markdown conversion
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  const editor = useEditor({
    extensions: [StarterKit, MarkdownExtension],
    content: content,
    onUpdate: ({ editor }) => {
      // Convert HTML to Markdown when content changes
      const html = editor.getHTML();
      const markdown = turndownService.turndown(html);
      setEditedContent(markdown);
    },
    immediatelyRender: false,
  });

  // Update editor content when the input content changes
  useEffect(() => {
    if (editor && !isEditing) {
      // Parse markdown to HTML for the editor
      const html = marked.parse(content);
      editor.commands.setContent(html);
      setEditedContent(content);
    }
  }, [content, editor, isEditing]);

  // Handle the TipTap Hydration Issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggleEdit = () => {
    setIsEditing(!isEditing);

    if (!isEditing && editor) {
      // When entering edit mode, ensure editor has latest content
      const html = marked.parse(content);
      editor.commands.setContent(html);
    }
  };

  const handleSubmit = () => {
    if (onContentChange) {
      onContentChange(editedContent);
    }
    setIsEditing(false);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        console.log("Content copied to clipboard");
        // Optionally, you can show a notification that the content was copied
        notifications.show({
          message: "Content copied to clipboard",
          position: "top-center",
          autoClose: 1000,
        });
      })
      .catch((err) => {
        console.error("Failed to copy content: ", err);
        notifications.show({
          message: "Failed to copy content",
          position: "top-center",
          autoClose: 1000,
        });
      });
  };

  if (!mounted) return null; // Avoid hydration mismatch

  const showActions = isLastAIMessage || isHovered;

  return (
    <div
      style={{
        position: "relative",
        paddingBottom: showActions ? "30px" : "0px",
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Paper
        px="md"
        py="lg"
        radius="md"
        fz="sm"
        bg="white"
        w="100%"
        c="var(--talia-title)"
        key={`text-${index}`}
      >
        {!isEditing ? (
          <Markdown>{content}</Markdown>
        ) : (
          <>
            <EditorContent
              key={`tiptap-editor-message-${index}`}
              contentEditable
              editor={editor}
              style={{
                borderRadius: "8px",
                padding: "12px",
                minHeight: "150px",
                maxHeight: "200px",
                overflowY: "auto", // Ensures smooth scrolling
                fontSize: "14px",
                lineHeight: "1.6",
                backgroundColor: "#fff", // Light background for better contrast
                border: "1px solid #ccc", // Soft border
                transition: "border-color 0.2s ease-in-out", // Smooth focus effect
              }}
              className="focus:outline-none focus:ring-2 focus:ring-blue-400 hover:border-blue-300"
            />
            <Space h="md" />
            <Flex justify="flex-end" gap="sm" align="center">
              <Button
                variant="filled"
                color={"var(--talia-purple-2)"}
                onClick={handleToggleEdit}
                size="sm"
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                color={"var(--talia-purple-1)"}
                onClick={handleSubmit}
                size="sm"
              >
                Submit
              </Button>
            </Flex>
          </>
        )}
      </Paper>

      {messageStatus !== "streaming" && !isEditing && showActions && (
        <Flex
          gap="xs"
          justify="flex-start"
          style={{
            display: showActions ? "block" : "none",
            position: "absolute",
            left: 0,
            marginTop: 5,
            transition: "opacity 0.5s ease, transform 0.5s ease",
            opacity: showActions ? 1 : 0,
            pointerEvents: showActions ? "auto" : "none",
            transform: showActions ? "translateY(0)" : "translateY(10px)",
          }}
        >
          <Tooltip label="Copy" openDelay={500}>
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Copy message"
              onClick={handleCopy}
              popover="auto"
            >
              <IconCopy style={{ width: "60%", height: "60%" }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Edit" openDelay={500}>
            <ActionIcon
              variant="subtle"
              color={isEditing ? "blue" : "gray"}
              aria-label={isEditing ? "Cancel edit" : "Edit message"}
              onClick={handleToggleEdit}
            >
              <IconEdit style={{ width: "60%", height: "60%" }} stroke={1.5} />
            </ActionIcon>
          </Tooltip>
        </Flex>
      )}
    </div>
  );
};
