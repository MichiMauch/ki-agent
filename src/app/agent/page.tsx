"use client";

import { useEffect, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Event = {
  summary: string;
  start: string;
  location?: string;
};

export default function AgentPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const fetchEvents = async (date: Date) => {
    setLoading(true);
    const res = await fetch(`/api/today?date=${date.toISOString()}`);
    const data = await res.json();
    setEvents(data.events);
    setLoading(false);
  };

  const formatSuggestions = (suggestions: string): string => {
    // Trenne die Vorschläge in einzelne Zeilen und filtere leere Zeilen
    return suggestions
      .split('\n')
      .filter((line) => line.trim() !== '')
      .join('\n');
  };

  const formatSuggestionsForRTM = (suggestions: string): string => {
    // Formatiere die Vorschläge für RTM im Format "- Titel: Notiz"
    return suggestions
      .split('\n')
      .filter((line) => line.trim() !== '')
      .map((line) => {
        const [task, ...rest] = line.split(' am ');
        const date = rest.join(' am ');
        return `- ${task.trim()}: Fällig am ${date.trim()}`;
      })
      .join('\n');
  };

  const saveSuggestions = async () => {
    if (!suggestions) return;
    const formattedSuggestions = formatSuggestionsForRTM(suggestions);
    if (formattedSuggestions === "") return;
    setSaving(true);
    await fetch("/api/save-prep-tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer AHojagx8teahmQmJrWDY", // 
      },
      body: JSON.stringify({ text: formattedSuggestions }),
    });
    setSaving(false);
    setSaved(true);
  };

  useEffect(() => {
    fetchEvents(selectedDate);

    fetch(`/api/summary?date=${selectedDate.toISOString()}`)
      .then((res) => res.json())
      .then((data) => {
        setSummary(data.summary);
      });

    fetch("/api/suggest-prep-tasks")
      .then((res) => res.json())
      .then((data) => {
        setSuggestions(data.suggestions ? formatSuggestions(data.suggestions) : null);
        setSaved(false);
      });
  }, [selectedDate]);

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">
        📅 Termine für den {selectedDate.toLocaleDateString("de-CH")}
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
          <h2 className="font-semibold mb-2"> 🧠 Dein Tag in einem Satz:</h2>
          <p className="italic">&quot;{summary}&quot;</p>
        </div>
      )}

      {suggestions && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <h2 className="font-semibold mb-2">
            💡 Vorschläge für vorbereitende Tasks:
          </h2>
          <pre className="whitespace-pre-wrap text-sm text-gray-800 mb-3">
            {suggestions}
          </pre>
          <button
            onClick={saveSuggestions}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={saving || saved}
          >
            {saving
              ? "Speichern…"
              : saved
              ? "Gespeichert ✅"
              : "Zu RTM speichern"}
          </button>
        </div>
      )}

      {loading ? (
        <p>Lade Termine…</p>
      ) : events.length === 0 ? (
        <p>Keine Termine an diesem Tag ✌️</p>
      ) : (
        <ul className="space-y-2">
          {events.map((event, index) => {
            const time = new Date(event.start).toLocaleTimeString("de-CH", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Zurich",
            });

            return (
              <li key={index} className="border rounded p-3 shadow">
                <strong>{event.summary}</strong>
                <br />
                <span className="text-sm text-gray-600">{time}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
