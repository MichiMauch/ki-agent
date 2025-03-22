"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Event = {
  summary: string;
  start: string;
};

export default function AgentPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (date: Date) => {
    setLoading(true);
    const res = await fetch(`/api/today?date=${date.toISOString()}`);
    const data = await res.json();
    setEvents(data.events);
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents(selectedDate);
  }, [selectedDate]);

  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents(selectedDate);

    fetch(`/api/summary?date=${selectedDate.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
      });
  }, [selectedDate]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📅 Termine für den {selectedDate.toLocaleDateString()}
      </h1>
      <div className="mb-6">
        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => date && setSelectedDate(date)}
          className="border rounded px-3 py-2"
        />
      </div>
      {summary && (
        <div className="mt-8 p-4 bg-gray-100 rounded mb-4">
          <h2 className="font-semibold mb-2">🧠 Dein Tag in einem Satz:</h2>
          <p className="italic">&quot;{summary}&quot;</p>
        </div>
      )}

      {loading ? (
        <p>Lade Termine…</p>
      ) : events.length === 0 ? (
        <p>Keine Termine an diesem Tag ✌️</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, index) => (
            <li key={index} className="border rounded p-3 shadow">
              <strong>{event.summary}</strong>
              <br />
              <span className="text-sm text-gray-600">
                {new Date(event.start).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
