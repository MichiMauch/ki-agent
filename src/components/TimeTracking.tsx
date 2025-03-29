"use client";

import { useEffect, useState } from "react";

type Task = {
  key: string;
  summary: string;
};

type Entry = {
  user: string;
  date: string;
  project: string;
  description: string;
  hours: number;
};

type TimeTrackingProps = {
  tasks: Task[];
};

export default function TimeTracking({ tasks }: TimeTrackingProps) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTime = async () => {
      try {
        const res = await fetch("/api/moco-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks }),
        });
        const data = await res.json();
        setEntries(data.entries || []);
      } catch (err) {
        console.error("Fehler beim Laden der Zeiterfassung:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tasks.length > 0) {
      fetchTime();
    }
  }, [tasks]);

  if (loading)
    return <p className="text-gray-500 italic">Zeiterfassung wird geladen…</p>;

  if (entries.length === 0)
    return <p className="text-gray-500 italic">Keine Zeiteinträge gefunden.</p>;

  // 👉 Gruppiere Stunden pro Task-Key
  const hoursPerTask: Record<string, number> = {};
  entries.forEach((entry) => {
    const matchedKey = tasks.find((task) =>
      entry.description?.includes(task.key)
    )?.key;

    if (matchedKey) {
      hoursPerTask[matchedKey] = (hoursPerTask[matchedKey] || 0) + entry.hours;
    }
  });

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-2">Zeiterfassung</h2>
      <ul className="space-y-2 text-sm text-gray-800">
        {entries.map((entry, index) => (
          <li key={index} className="border p-2 rounded">
            <div>
              <strong>{entry.user}</strong> am{" "}
              {(() => {
                const d = new Date(entry.date);
                const day = String(d.getDate()).padStart(2, "0");
                const month = String(d.getMonth() + 1).padStart(2, "0");
                const year = d.getFullYear();
                return `${day}.${month}.${year}`;
              })()}
              : <strong>{entry.hours.toFixed(2)} h</strong>{" "}
            </div>
            <div className="text-gray-600">
              Arbeitspaket Moco: {entry.project}
            </div>
            <div className="text-gray-500 italic">
              Beschreibung: {entry.description}
            </div>
          </li>
        ))}
      </ul>

      {/* 🔢 Totalstunden pro Task */}
      <div className="mt-8 border-t pt-4">
        <h3 className="text-md font-semibold mb-2">
          Total Aufwand pro Jira-Task
        </h3>
        <ul className="text-sm space-y-1">
          {tasks.map((task) => (
            <li key={task.key}>
              <strong>{task.key}</strong>:{" "}
              {hoursPerTask[task.key]?.toFixed(2) || "0.00"} h
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
