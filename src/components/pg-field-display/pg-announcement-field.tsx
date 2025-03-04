import { Anchor, Box, Group, Paper, Stack, Text } from "@mantine/core";
import React from "react";
import ReactMarkdown from "react-markdown";

interface AnnouncementFieldsProps {
  data: AnnouncementData;
}

interface Url {
  webLink: string;
  linkDescription: string;
}

interface AnnouncementData {
  title: string;
  status: "DRAFT" | string;
  content: string;
  enquiryEmailAddress: string;
  urls?: Url[];
  shortcuts?: string[];
}

export const PGAnnouncementFields: React.FC<AnnouncementFieldsProps> = ({
  data,
}) => {
  const { title, status, content, enquiryEmailAddress, urls, shortcuts } = data;

  return (
    <Stack>
      <Paper shadow="xs" p="md" bg="white">
        {/* Status */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
            Status:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="md" style={{ whiteSpace: "pre-wrap" }}>
              {status}
            </Text>
          </Box>
        </Group>

        {/* Enquiry Email */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
            Enquiry Email:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="md" style={{ whiteSpace: "pre-wrap" }}>
              {enquiryEmailAddress}
            </Text>
          </Box>
        </Group>

        {/* Title */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
            Title:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="md" style={{ whiteSpace: "pre-wrap" }}>
              {title}
            </Text>
          </Box>
        </Group>

        {/* Content */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
            Content:
          </Text>
          <Box style={{ flex: 1 }}>
            <ReactMarkdown
              components={{
                div: ({ children }) => (
                  <Text fz="sm" style={{ margin: 0 }}>
                    {children}
                  </Text>
                ),
              }}
            >
              {content}
            </ReactMarkdown>
          </Box>
        </Group>

        {/* Shortcuts */}
        {shortcuts && shortcuts.length > 0 && (
          <Group align="flex-start">
            <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
              Shortcuts:
            </Text>
            <Box style={{ flex: 1 }}>
              {shortcuts.map((url, index) => (
                <Text
                  key={index}
                  fz="md"
                  style={{ whiteSpace: "pre-wrap", marginBottom: 4 }}
                >
                  {index + 1}.{" "}
                  <Anchor href={url} target="_blank" rel="noopener noreferrer">
                    {url}
                  </Anchor>
                </Text>
              ))}
            </Box>
          </Group>
        )}

        {/* URLs */}
        {urls && urls.length > 0 && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="md" c="gray.7" style={{ width: 130 }}>
              Website link:
            </Text>
            <Box style={{ flex: 1 }}>
              {urls.map((url, index) => (
                <Text
                  key={index}
                  fz="md"
                  style={{ whiteSpace: "pre-wrap", marginBottom: 4 }}
                >
                  {index + 1}.{" "}
                  <Anchor
                    href={url.webLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {url.linkDescription} ({url.webLink})
                  </Anchor>
                </Text>
              ))}
            </Box>
          </Group>
        )}
      </Paper>
    </Stack>
  );
};
