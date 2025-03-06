import { Anchor, Box, Group, Paper, Stack, Text } from "@mantine/core";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export interface EventStartEndDate {
  date: string;
  time: string;
}

export interface FormData {
  title: string;
  status: "DRAFT" | string;
  content: string;
  venue?: string;
  consentByDate: string;
  eventStartDate?: EventStartEndDate;
  eventEndDate?: EventStartEndDate;
  addReminderType: "ONE_TIME" | "DAILY" | "NONE";
  enquiryEmailAddress: string;
  responseType: "YES_NO" | "ACKNOWLEDGEMENT";
  urls?: { webLink: string; linkDescription: string }[];
  shortcuts?: string[];
  questions?: Question[];
}

interface Question {
  type: "single_selection" | "multi_selection" | "text";
  title: string;
  description: string;
  id: string;
  choices?: { label: string }[];
}

interface EventFieldsProps {
  data: FormData;
}

export const PGFormField: React.FC<EventFieldsProps> = ({ data }) => {
  const {
    title,
    status,
    content,
    venue,
    consentByDate,
    eventStartDate,
    eventEndDate,
    enquiryEmailAddress,
    responseType,
    urls,
    shortcuts,
    addReminderType,
    questions,
  } = data;

  // Function to format date and time
  const formatDate = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} at ${time}`;
  };

  return (
    <Stack>
      <Paper shadow="xs" p="md" bg="white" fz="sm">
        {/* Status */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Status:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {status}
            </Text>
          </Box>
        </Group>

        {/* Enquiry Email */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Enquiry Email:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {enquiryEmailAddress}
            </Text>
          </Box>
        </Group>

        {/* Title */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Title:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {title}
            </Text>
          </Box>
        </Group>

        {/* Content */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Content:
          </Text>
          <Box style={{ flex: 1 }}>
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <Text fz="sm" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
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
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Shortcuts:
            </Text>
            <Box style={{ flex: 1 }}>
              {shortcuts.map((url, index) => (
                <Text
                  key={index}
                  fz="sm"
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
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Website link:
            </Text>
            <Box style={{ flex: 1 }}>
              {urls.map((url, index) => (
                <Text
                  key={index}
                  fz="sm"
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

        {/* Response Type */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Response Type:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {responseType}
            </Text>
          </Box>
        </Group>

        {/* URLs */}
        {urls && urls.length > 0 && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Website link:
            </Text>
            <Box style={{ flex: 1 }}>
              {urls.map((url, index) => (
                <Text
                  key={index}
                  fz="sm"
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

        {/* Event Start Date */}
        {eventStartDate && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Event Start:
            </Text>
            <Box style={{ flex: 1 }}>
              <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                {formatDate(eventStartDate.date, eventStartDate.time)}
              </Text>
            </Box>
          </Group>
        )}

        {/* Event End Date */}
        {eventEndDate && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Event End:
            </Text>
            <Box style={{ flex: 1 }}>
              <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                {formatDate(eventEndDate.date, eventEndDate.time)}
              </Text>
            </Box>
          </Group>
        )}

        {/* Venue */}

        {venue && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Venue:
            </Text>
            <Box style={{ flex: 1 }}>
              <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
                {venue}
              </Text>
            </Box>
          </Group>
        )}

        {/* Consent By Date */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Consent By:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {new Date(consentByDate).toLocaleDateString()}
            </Text>
          </Box>
        </Group>

        {/* Reminder Type */}
        <Group align="flex-start" mb="md">
          <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
            Reminder Type:
          </Text>
          <Box style={{ flex: 1 }}>
            <Text fz="sm" style={{ whiteSpace: "pre-wrap" }}>
              {addReminderType}
            </Text>
          </Box>
        </Group>

        {questions && questions.length > 0 && (
          <Group align="flex-start" mb="md">
            <Text fw={600} fz="sm" c="gray.7" style={{ width: 130 }}>
              Questions:
            </Text>
            <Box style={{ flex: 1 }}>
              {questions.map((question, index) => (
                <Box key={question.id} mb="sm">
                  <Text fz="sm" fw={600}>
                    {index + 1}. {question.title}
                  </Text>
                  <Text fz="sm" c="gray.6" mb="xs">
                    {question.description}
                  </Text>
                  {question.type !== "text" && question.choices && (
                    <Box ml="md">
                      {question.choices.map((choice, choiceIndex) => (
                        <Text key={choiceIndex} fz="sm">
                          - {choice.label}
                        </Text>
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
          </Group>
        )}
      </Paper>
    </Stack>
  );
};
