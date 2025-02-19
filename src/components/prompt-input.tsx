"use client";

import { useChat } from "@ai-sdk/react";
import {
  ActionIcon,
  Affix,
  Container,
  FileButton,
  Group,
  Paper,
  Pill,
  Stack,
  Textarea,
} from "@mantine/core";
import { useListState } from "@mantine/hooks";
import {
  IconArrowUp,
  IconPaperclip,
  IconPlayerStopFilled,
} from "@tabler/icons-react";
import React from "react";
import { IMAGE_MIME_TYPE } from "./constants";
import pdf2md from "@opendocsg/pdf2md";

const ACCEPT_MIME_TYPES = [...IMAGE_MIME_TYPE, "application/pdf"];

export default function PromptInput({
  disabled = true,
  status,
  input,
  handleInputChange,
  handleSubmit,
  stop,
}: {
  disabled?: boolean;
} & Pick<
  ReturnType<typeof useChat>,
  "input" | "handleInputChange" | "status" | "handleSubmit" | "stop"
>) {
  const [_files, filesHandler] = useListState<File>([]);
  const [_pdfs, pdfsHandler] = useListState<{ id: string; content: string }>(
    []
  );
  const [doRetrieval, setDoRetrieval] = React.useState<boolean>(false);

  const btnRef = React.useRef<HTMLButtonElement>(null);

  return (
    <Affix bottom={0} left={0} bg="var(--talia-gray)" py="md">
      <Container size="sm">
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
              <Textarea
                disabled={disabled}
                name="prompt"
                value={input}
                onChange={handleInputChange}
                rows={2}
                variant="unstyled"
                placeholder="How may I help you?"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Check if Alt or Shift key is pressed
                    if (e.altKey || e.shiftKey) {
                      // Do not submit form, allow default behavior (new line)
                      return;
                    }
                    // Enter key alone is pressed
                    e.preventDefault(); // Prevent default behavior (new line)
                    btnRef?.current?.click();
                  }
                }}
              />
              <Group justify="space-between">
                <Group>
                  <FileButton
                    disabled={disabled}
                    accept={ACCEPT_MIME_TYPES.join(",")}
                    onChange={(newFiles) => {
                      newFiles.forEach((file) => {
                        if (file && !_files.find((e) => e.name === file.name)) {
                          if (file.type === "application/pdf") {
                            file.arrayBuffer().then((buf) => {
                              pdf2md(buf).then((markdown) => {
                                const blob = new Blob([markdown], {
                                  type: "text/plain",
                                });
                                const markdownFile = new File(
                                  [blob],
                                  file.name,
                                  { type: "text/plain" }
                                );
                                filesHandler.append(markdownFile);
                              });
                            });
                          } else {
                            filesHandler.append(file);
                          }
                        }
                      });
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
                  {/* <input
                    type="hidden"
                    name="doRetrieval"
                    value={doRetrieval ? "yes" : "no"}
                  />
                  <Chip
                    checked={doRetrieval}
                    onChange={setDoRetrieval}
                    color={doRetrieval ? "orange" : "gray"}
                    variant={doRetrieval ? "filled" : "outline"}
                    opacity={doRetrieval ? 1 : 0.4}
                    icon={<IconBulb size="15" />}
                  >
                    Leverage Past Insights
                  </Chip> */}
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
                <Group>
                  {_files?.map((file, i) => (
                    <Pill
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
    </Affix>
  );
}
