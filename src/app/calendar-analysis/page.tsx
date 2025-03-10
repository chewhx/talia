// app/calendar-analysis/page.tsx
"use client";

import { CalendarEvent, fetchCalendarEvents } from "@/utils/calendar";
import { useState, useEffect } from "react";

export default function CalendarAnalysisPage() {
  const [calendarIds, setCalendarIds] = useState<string[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<string>("");

  useEffect(() => {
    // Load calendar IDs
    const savedIds = localStorage.getItem("calendarIds");
    if (savedIds) {
      const ids = JSON.parse(savedIds);
      setCalendarIds(ids);
      loadEvents(ids);
    } else {
      setLoading(false);
    }
  }, []);

  const loadEvents = async (ids: string[]) => {
    setLoading(true);
    try {
      // This now calls a server action
      const calendarEvents = await fetchCalendarEvents(ids);
      setEvents(calendarEvents);

      console.log({ calendarEvents });

      // if (calendarEvents.length > 0) {
      //   await analyzeEvents(calendarEvents);
      // }
    } catch (error) {
      console.error("Failed to load events:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeEvents = async (events: CalendarEvent[]) => {
    try {
      // Format events for the AI prompt
      const formattedEvents = events.map((event) => ({
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description || "No description",
        location: event.location || "No location",
        calendarId: event.calendarId,
      }));

      // Create the prompt for AI analysis
      const prompt = `
        Please analyze the following calendar events for conflicts and potential issues:
        ${JSON.stringify(formattedEvents, null, 2)}

        Identify any of the following:
        1. Time conflicts (events that overlap)
        2. Scheduling issues (events too close together)
        3. Missing information (events lacking important details)
        4. Potential concerns based on event descriptions or locations
      `;

      // Call your AI endpoint
      const response = await fetch("/api/analyze-calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (error) {
      console.error("Error analyzing events:", error);
      setAnalysis("Failed to analyze calendar events. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Calendar Analysis</h1>

      {loading ? (
        <div className="text-center my-12">Loading events...</div>
      ) : (
        <>
          {calendarIds.length === 0 ? (
            <div className="bg-yellow-100 p-4 rounded">
              <p>
                No calendar IDs configured. Please add calendars in the settings
                page.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-xl mb-4">
                  Upcoming Events ({events.length})
                </h2>
                <div className="space-y-3">
                  {events.map((event) => (
                    <div key={event.id} className="p-4 border rounded">
                      <h3 className="font-bold">{event.title}</h3>
                      <p>
                        <span className="font-semibold">When:</span>{" "}
                        {new Date(event.start).toLocaleString()} -{" "}
                        {new Date(event.end).toLocaleString()}
                      </p>
                      {event.description && (
                        <p>
                          <span className="font-semibold">Description:</span>{" "}
                          {event.description}
                        </p>
                      )}
                      {event.location && (
                        <p>
                          <span className="font-semibold">Location:</span>{" "}
                          {event.location}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className="font-semibold">Calendar:</span>{" "}
                        {event.calendarId}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-xl mb-4">AI Analysis</h2>
                <div className="p-4 bg-gray-50 rounded whitespace-pre-wrap">
                  {analysis || "No analysis available yet."}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
