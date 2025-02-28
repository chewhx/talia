import { Paper, Stack, Text } from "@mantine/core";
import React from "react";

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
        {/* Title */}
        <Text fw={600} fz="lg" mb="xs">
          {title}
        </Text>

        {/* Status */}
        <Text fz="sm" c="gray">
          Status: {status}
        </Text>

        {/* Content */}
        <Text fz="sm" mt="xs" style={{ whiteSpace: "pre-wrap" }}>
          {content}
        </Text>

        {/* Enquiry Email */}
        <Text fz="sm" mt="xs">
          <strong>Enquiry Email:</strong> {enquiryEmailAddress}
        </Text>

        {/* URLs */}
        {urls && urls.length > 0 && (
          <>
            <Text fz="sm" mt="xs">
              <strong>Links:</strong>
            </Text>
            {urls.map((url, index) => (
              <Text key={index} fz="sm" mt="xs">
                <a href={url.webLink} target="_blank" rel="noopener noreferrer">
                  {url.linkDescription || url.webLink}
                </a>
              </Text>
            ))}
          </>
        )}

        {/* Shortcuts */}
        {shortcuts && shortcuts.length > 0 && (
          <>
            <Text fz="sm" mt="xs">
              <strong>Shortcuts:</strong>
            </Text>
            {shortcuts.map((shortcut, index) => (
              <Text key={index} fz="sm" mt="xs">
                <a href={shortcut} target="_blank" rel="noopener noreferrer">
                  {shortcut}
                </a>
              </Text>
            ))}
          </>
        )}
      </Paper>
    </Stack>
  );
};
