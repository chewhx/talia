"use client";

import { useChat } from "@ai-sdk/react";
import {
  ActionIcon,
  Box,
  Button,
  Container,
  FileButton,
  Flex,
  Group,
  Paper,
  Pill,
  Stack,
  Text,
  Textarea,
} from "@mantine/core";
import { useListState } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconArrowUp,
  IconPaperclip,
  IconPlayerStopFilled,
  IconReload,
} from "@tabler/icons-react";
import mammoth from "mammoth";
import React, { useEffect, useRef } from "react";
import { IMAGE_MIME_TYPE, MIME_TYPES } from "../../../shared/constants";
import { validateFiles } from "./prompt-input.utils";

const ACCEPT_MIME_TYPES = [...IMAGE_MIME_TYPE, MIME_TYPES.pdf, MIME_TYPES.docx];

export default function PromptInput({
  disabled = true,
  status,
  input,
  handleInputChange,
  handleSubmit,
  stop,
  reload,
  error,
}: {
  disabled?: boolean;
} & Pick<
  ReturnType<typeof useChat>,
  | "input"
  | "handleInputChange"
  | "status"
  | "handleSubmit"
  | "stop"
  | "error"
  | "reload"
>) {
  const [_files, filesHandler] = useListState<File>([]);
  const [_pdfs, pdfsHandler] = useListState<{ id: string; content: string }>(
    []
  );
  const [doRetrieval, setDoRetrieval] = React.useState<boolean>(false);

  const btnRef = React.useRef<HTMLButtonElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 150)}px`;
    }
  }, [input]);

  return (
    <Box
      style={{
        position: "sticky",
        bottom: 0,
        left: 0,
        width: "100%",
        background: "var(--talia-gray)",
        zIndex: 100,
        padding: "12px 0",
      }}
    >
      <Container size="sm">
        {error && (
          <Flex align="center" justify="center" my={10} gap="md">
            <Text c="red" fw={600} size="md">
              Oops! Something went wrong.
            </Text>
            <Button
              leftSection={<IconReload size={18} />}
              onClick={() => reload()}
              variant="light"
              color="red"
              radius="md"
            >
              Retry
            </Button>
          </Flex>
        )}
        <Paper bg={disabled ? "gray.1" : "white"} py="xs" px="sm" w="100%">
          <form
            onSubmit={(ev) => {
              const dataTransfer = new DataTransfer();
              _files.forEach((file) => {
                dataTransfer.items.add(file);
                // if (file.type.includes("image")) {
                // }
              });
              const files = dataTransfer.files;
              handleSubmit(ev, {
                experimental_attachments: files,
                body: { doRetrieval, pdfs: _pdfs },
              });
              filesHandler.setState([]);
              pdfsHandler.setState([]);
              setDoRetrieval(false);
            }}
          >
            <Stack>
              <div
                style={{
                  position: "relative",
                  maxHeight: "150px",
                  overflow: "auto",
                }}
              >
                <Textarea
                  disabled={disabled}
                  name="prompt"
                  value={input}
                  onChange={handleInputChange}
                  rows={2}
                  variant="unstyled"
                  placeholder="How may I help you?"
                  ref={textareaRef}
                  style={{
                    resize: "none",
                    overflow: "hidden",
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      if (e.altKey || e.shiftKey) {
                        return;
                      }
                      e.preventDefault();
                      btnRef?.current?.click();
                    }
                  }}
                />
              </div>
              <Group justify="space-between">
                <Group>
                  <FileButton
                    disabled={disabled}
                    accept={ACCEPT_MIME_TYPES.join(",")}
                    onChange={(newFiles) => {
                      const validationResults = validateFiles(newFiles, _files);
                      const errors = validationResults.filter(
                        (e) => e.success === false
                      );

                      if (errors.length) {
                        errors.forEach((err) => {
                          notifications.show({
                            title: err.reason,
                            color: "red",
                            message: err.fileName,
                          });
                        });
                      } else {
                        Promise.all(
                          newFiles.map(async (file) => {
                            if (file.type === MIME_TYPES.docx) {
                              const result = await mammoth.extractRawText({
                                arrayBuffer: await file.arrayBuffer(),
                              });
                              const textContent = result.value;
                              const fileName = file.name;
                              const textFile = new File(
                                [textContent],
                                fileName,
                                {
                                  type: "text/plain",
                                }
                              );

                              // Append the new text file
                              filesHandler.append(textFile);
                            } else {
                              filesHandler.append(file);
                            }
                          })
                        );
                      }
                    }}
                    multiple
                  >
                    {(props) => (
                      <ActionIcon
                        disabled={disabled}
                        {...props}
                        variant="light"
                      >
                        <IconPaperclip size="18" />
                      </ActionIcon>
                    )}
                  </FileButton>
                </Group>
                {status === "streaming" ? (
                  <ActionIcon
                    onClick={() => stop()}
                    variant="filled"
                    radius="lg"
                  >
                    <IconPlayerStopFilled size="18" />
                  </ActionIcon>
                ) : (
                  <ActionIcon
                    type="submit"
                    ref={btnRef}
                    disabled={status === "submitted" || disabled}
                    variant="filled"
                    radius="lg"
                  >
                    <IconArrowUp size="15" />
                  </ActionIcon>
                )}
              </Group>
              {!_files.length ? null : (
                <Group className="file-pill">
                  {_files?.map((file, i) => (
                    <Pill
                      size="md"
                      key={file.name}
                      withRemoveButton
                      onRemove={() => {
                        filesHandler.remove(i);
                        if (file.type === "application/pdf") {
                          pdfsHandler.filter((f) => f.id === file.name);
                        }
                      }}
                    >
                      {file.name}
                    </Pill>
                  ))}
                </Group>
              )}
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}
