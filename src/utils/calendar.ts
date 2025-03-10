// app/actions/calendar.ts
"use server";

import { google } from "googleapis";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  calendarId: string;
}

export async function fetchCalendarEvents(
  calendarIds: string[]
): Promise<CalendarEvent[]> {
  const calendar = google.calendar({
    version: "v3",
    auth: process.env.GOOGLE_API_KEY,
  });

  let allEvents: CalendarEvent[] = [];

  for (const calendarId of calendarIds) {
    try {
      const res = await calendar.events.list({
        calendarId,
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      const events =
        res.data.items?.map((event) => ({
          id: event.id || "",
          title: event.summary || "Untitled Event",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          description: event.description,
          location: event.location,
          calendarId,
        })) || [];

      allEvents = [...allEvents, ...events];
    } catch (error) {
      console.error(`Error fetching events for calendar ${calendarId}:`, error);
    }
  }

  return allEvents;
}
