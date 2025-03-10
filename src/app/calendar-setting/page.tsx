// app/settings/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const [calendarIds, setCalendarIds] = useState<string[]>([]);
  const [newCalendarId, setNewCalendarId] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Load saved calendar IDs from localStorage
    const savedIds = localStorage.getItem("calendarIds");
    if (savedIds) {
      setCalendarIds(JSON.parse(savedIds));
    }
  }, []);

  const addCalendarId = () => {
    if (newCalendarId.trim()) {
      const updatedIds = [...calendarIds, newCalendarId.trim()];
      setCalendarIds(updatedIds);
      localStorage.setItem("calendarIds", JSON.stringify(updatedIds));
      setNewCalendarId("");
    }
  };

  const removeCalendarId = (index: number) => {
    const updatedIds = calendarIds.filter((_, i) => i !== index);
    setCalendarIds(updatedIds);
    localStorage.setItem("calendarIds", JSON.stringify(updatedIds));
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Calendar Settings</h1>

      <div className="mb-6">
        <h2 className="text-xl mb-2">Your Calendar IDs</h2>
        <ul className="space-y-2">
          {calendarIds.map((id, index) => (
            <li
              key={index}
              className="flex items-center justify-between p-3 bg-gray-100 rounded"
            >
              <span className="font-mono text-sm truncate">{id}</span>
              <button
                onClick={() => removeCalendarId(index)}
                className="text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newCalendarId}
          onChange={(e) => setNewCalendarId(e.target.value)}
          placeholder="Add public calendar ID"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={addCalendarId}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add
        </button>
      </div>

      <div className="mt-8">
        <button
          onClick={() => router.push("/calendar-analysis")}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Analyze Calendars
        </button>
      </div>
    </div>
  );
}
