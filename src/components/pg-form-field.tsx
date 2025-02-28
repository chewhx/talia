import { Paper, Stack, Text } from "@mantine/core";

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
  } = data;

  // Function to format date and time
  const formatDate = (date: string, time: string) => {
    return `${new Date(date).toLocaleDateString()} at ${time}`;
  };

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

        {/* Venue */}
        {venue && (
          <Text fz="sm" mt="xs">
            <strong>Venue:</strong> {venue}
          </Text>
        )}

        {/* Consent By Date */}
        <Text fz="sm" mt="xs">
          <strong>Consent By:</strong>{" "}
          {new Date(consentByDate).toLocaleDateString()}
        </Text>

        {/* Event Start Date */}
        {eventStartDate && (
          <Text fz="sm" mt="xs">
            <strong>Event Start:</strong>{" "}
            {formatDate(eventStartDate.date, eventStartDate.time)}
          </Text>
        )}

        {/* Event End Date */}
        {eventEndDate && (
          <Text fz="sm" mt="xs">
            <strong>Event End:</strong>{" "}
            {formatDate(eventEndDate.date, eventEndDate.time)}
          </Text>
        )}

        {/* Enquiry Email Address */}
        <Text fz="sm" mt="xs">
          <strong>Enquiry Email:</strong> {enquiryEmailAddress}
        </Text>

        {/* Response Type */}
        <Text fz="sm" mt="xs">
          <strong>Response Type:</strong> {responseType}
        </Text>

        {/* URLs */}
        {urls && urls.length > 0 && (
          <>
            <Text fz="sm" mt="xs">
              <strong>Event Links:</strong>
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
