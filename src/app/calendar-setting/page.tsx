"use client";

import { useUser } from "@/context/userContext";
import { CalendarEvent, fetchCalendarEvents } from "@/utils/calendar";
import {
  Badge,
  Button,
  Card,
  Container,
  Flex,
  Grid,
  Group,
  List,
  Modal,
  ScrollArea,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import React, { useEffect, useMemo, useState } from "react";

export default function SettingsPage() {
  const { userDetails } = useUser();
  const [calendarIds, setCalendarIds] = useState<string[]>([]);
  const [newCalendarId, setNewCalendarId] = useState("");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
    null
  );
  const [opened, { open, close }] = useDisclosure(false);

  const uniqueCalendarIds = useMemo(
    () => [...new Set(calendarIds)],
    [calendarIds]
  );

  useEffect(() => {
    const savedIds = JSON.parse(localStorage.getItem("calendarIds") || "[]");
    const allIds = [
      ...new Set([...savedIds, ...(userDetails?.calendarIDs || [])]),
    ];
    setCalendarIds(allIds);
    loadEvents(allIds);
  }, [userDetails]);

  const addCalendarId = () => {
    if (newCalendarId.trim()) {
      const updatedIds = [...calendarIds, newCalendarId.trim()];
      setCalendarIds(updatedIds);
      localStorage.setItem("calendarIds", JSON.stringify(updatedIds));
      setNewCalendarId("");
      loadEvents(updatedIds);
    }
  };

  const removeCalendarId = (index: number) => {
    const updatedIds = calendarIds.filter((_, i) => i !== index);
    setCalendarIds(updatedIds);
    localStorage.setItem("calendarIds", JSON.stringify(updatedIds));
    loadEvents(updatedIds);
  };

  const loadEvents = async (ids: string[]) => {
    setLoading(true);
    try {
      const calendarEvents = await fetchCalendarEvents(ids);
      setEvents(calendarEvents);
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const showEventDetails = (event: CalendarEvent) => {
    setSelectedEvent(event);
    open();
  };

  const openCalenadr = (calendarID: string) => [
    window.open(
      ` https://calendar.google.com/calendar/embed?src=${encodeURIComponent(
        calendarID
      )}&ctz=Asia/Singapore`,
      "_blank"
    ),
  ];

  return (
    <Container size="sm">
      <Card withBorder shadow="sm" padding="md" radius="md" mb="xl" mt="lg">
        <Title order={2} mb="md">
          Your Calendar IDs
        </Title>
        {uniqueCalendarIds.length > 0 ? (
          <Grid gutter="xs">
            {uniqueCalendarIds.map((id, index) => (
              <React.Fragment key={id}>
                <Grid.Col span={8}>
                  <Text size="sm" style={{ wordBreak: "break-all" }}>
                    {id}
                  </Text>
                </Grid.Col>
                <Grid.Col
                  span={4}
                  style={{ display: "flex", justifyContent: "flex-end" }}
                >
                  <Flex align="center" justify="space-between">
                    <Button
                      color="red"
                      variant="subtle"
                      onClick={() => removeCalendarId(index)}
                    >
                      Remove
                    </Button>
                    <Button variant="subtle" onClick={() => openCalenadr(id)}>
                      Open
                    </Button>
                  </Flex>
                </Grid.Col>
              </React.Fragment>
            ))}
          </Grid>
        ) : (
          <Text c="dimmed">No calendar IDs configured.</Text>
        )}
      </Card>

      <Card withBorder shadow="sm" padding="md" radius="md" mb="xl">
        <Title order={2} mb="md">
          Add New Calendar
        </Title>
        <Group gap="sm" align="flex-end">
          <TextInput
            placeholder="Enter public calendar ID"
            value={newCalendarId}
            onChange={(event) => setNewCalendarId(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Button onClick={addCalendarId}>Add</Button>
        </Group>
      </Card>

      <Card withBorder shadow="sm" padding="md" radius="md">
        <Title order={2} mb="md">
          Upcoming Events - {events.length}
        </Title>
        {loading ? (
          <Text ta="center">Loading events...</Text>
        ) : events.length > 0 ? (
          <ScrollArea h={400}>
            <Stack gap="xs">
              {events.map((event) => (
                <Card
                  key={event.id}
                  withBorder
                  shadow="sm"
                  padding="sm"
                  radius="md"
                >
                  <Group>
                    <div>
                      <Text fw={500}>{event.title}</Text>
                      <Text size="sm" c="dimmed">
                        {new Date(event.start).toLocaleString()} -{" "}
                        {new Date(event.end).toLocaleString()}
                      </Text>
                    </div>
                    <Button
                      variant="light"
                      onClick={() => showEventDetails(event)}
                    >
                      Details
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>
          </ScrollArea>
        ) : (
          <Text c="dimmed">No upcoming events found.</Text>
        )}
      </Card>

      <Modal
        opened={opened}
        onClose={close}
        title={<Text fw="bold">Event Details</Text>}
        size="lg"
      >
        {selectedEvent && (
          <List spacing="sm">
            <List.Item>
              <Text fw="bold">Title:</Text> {selectedEvent.title}
            </List.Item>
            <List.Item>
              <Text fw="bold">Start:</Text>{" "}
              {new Date(selectedEvent.start).toLocaleString()}
            </List.Item>
            <List.Item>
              <Text fw="bold">End:</Text>{" "}
              {new Date(selectedEvent.end).toLocaleString()}
            </List.Item>
            {selectedEvent.description && (
              <List.Item>
                <Text fw="bold">Description:</Text> {selectedEvent.description}
              </List.Item>
            )}
            {selectedEvent.location && (
              <List.Item>
                <Text fw="bold">Location:</Text> {selectedEvent.location}
              </List.Item>
            )}
            <List.Item>
              <Text fw="bold">Calendar ID:</Text>
              <Badge color="blue" variant="light">
                {selectedEvent.calendarId}
              </Badge>
            </List.Item>
          </List>
        )}
      </Modal>
    </Container>
  );
}
