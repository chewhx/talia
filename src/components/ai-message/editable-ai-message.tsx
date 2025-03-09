"use client";

import { getPresignedUrl, parseS3Uri } from "@/app/api/getSignedUrl/utils";
import { UseChatHelpers } from "@ai-sdk/react";
import {
  ActionIcon,
  Button,
  Flex,
  Paper,
  Space,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCopy, IconEdit, IconExternalLink } from "@tabler/icons-react";
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
  messageStatus: UseChatHelpers["status"];
  referenceUrls?: string[];
  onContentChange?: (newContent: string) => void;
};

export const EditableAIMessage = ({
  content,
  index,
  isLastAIMessage,
  messageStatus,
  referenceUrls,
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
        // Optionally, you can show a notification that the content was copied
        notifications.show({
          message: "Content copied to clipboard",
          position: "top-center",
          autoClose: 1000,
        });
      })
      .catch((err) => {
        notifications.show({
          message: "Failed to copy content",
          position: "top-center",
          autoClose: 1000,
        });
      });
  };

  const openReference = async (url: string) => {
    notifications.show({
      title: "Opening File",
      message: "Processing your request...",
      position: "bottom-right",
      autoClose: 3000,
    });

    const presignedUrl = await getPresignedUrl(url);
    // Only works in browser environments
    if (typeof window !== "undefined") {
      window.open(presignedUrl, "_blank");
    } else {
      throw new Error("Cannot open URL in non-browser environment");
    }
  };

  if (!mounted) return null; // Avoid hydration mismatch

  const showActions = isLastAIMessage || isHovered;

  return (
    <div
      style={{
        position: "relative",
      }}
    >
      <div
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
            <>
              <Markdown>{content}</Markdown>
              {messageStatus !== "streaming" &&
                referenceUrls &&
                referenceUrls.length > 0 && (
                  <Stack
                    align="flex-start"
                    justify="flex-start"
                    gap="xs"
                    mt={10}
                  >
                    <Text fw="bold" mb="0" fz="sm">
                      References:
                    </Text>
                    {referenceUrls.map((url, referenceIndex) => {
                      const fileDetails = parseS3Uri(url);
                      const fileName =
                        fileDetails?.key ?? `Reference ${referenceIndex + 1}`;
                      const truncatedFileName =
                        fileName.length > 50
                          ? `${fileName.slice(0, 35)}...${fileName.slice(-10)}`
                          : fileName;

                      return (
                        <Button
                          key={`references-${referenceIndex}-message-${index}`}
                          leftSection={<IconExternalLink />}
                          onClick={async () => await openReference(url)}
                          justify="flex-start"
                          w="60%"
                          variant="default"
                          fz="sm"
                        >
                          {truncatedFileName}
                        </Button>
                      );
                    })}
                  </Stack>
                )}
            </>
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
                  maxHeight: "max-content",
                  overflowY: "auto",
                  fontSize: "14px",
                  lineHeight: "1.6",
                  backgroundColor: "#fff",
                  border: "1px solid #ccc",
                  transition: "border-color 0.2s ease-in-out",
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
            mt={5}
            left={0}
            opacity={showActions ? 1 : 0}
            display={showActions ? "block" : "none"}
            style={{
              transition: "opacity 0.5s ease, transform 0.5s ease",
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
                <IconCopy
                  style={{ width: "60%", height: "60%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit" openDelay={500}>
              <ActionIcon
                variant="subtle"
                color={isEditing ? "blue" : "gray"}
                aria-label={isEditing ? "Cancel edit" : "Edit message"}
                onClick={handleToggleEdit}
              >
                <IconEdit
                  style={{ width: "60%", height: "60%" }}
                  stroke={1.5}
                />
              </ActionIcon>
            </Tooltip>
          </Flex>
        )}
      </div>

      {/* {messageStatus !== "streaming" &&
        referenceUrls &&
        referenceUrls.length > 0 && (
          <Stack align="flex-start" justify="flex-start" gap="xs" mt={10}>
            {referenceUrls.map((url, i) => {
              const fileDetails = parseS3Uri(url);
              const fileName = fileDetails?.key ?? `Reference ${i + 1}`;
              const truncatedFileName =
                fileName.length > 50
                  ? `${fileName.slice(0, 35)}...${fileName.slice(-10)}`
                  : fileName;

              return (
                <Button
                  onClick={async () => await openReference(url)}
                  justify="flex-start"
                  w="70%"
                  variant="default"
                >
                  {truncatedFileName}
                </Button>
              );
            })}
          </Stack>
        )} */}
    </div>
  );
};
