"use client";

import { useEffect, useState, useRef } from "react";

type Task = {
  id: string;
  key: string;
  summary: string;
  status: string;
  due: string | null;
  assignee: string;
  lastStatusChange: string | null;
  lastStatusFrom: string | null;
  lastStatusTo: string | null;
};

export default function JiraPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);

  const copyHtmlToClipboard = () => {
    if (summaryRef.current) {
      const html = summaryRef.current.innerHTML;
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
        }),
      ]);
    }
  };

  // Hole Tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await fetch("/api/jira");
        if (!res.ok) throw new Error("Fehler beim Laden der Tasks");
        const data = await res.json();
        setTasks(data.tasks);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unbekannter Fehler");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // GPT-Zusammenfassung generieren
  useEffect(() => {
    if (tasks.length === 0) return;

    const generateSummary = async () => {
      try {
        setGenerating(true);
        const res = await fetch("/api/jira-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks }),
        });
        const data = await res.json();
        setSummary(data.summary);
      } catch {
        setSummary("Fehler beim Erzeugen der Zusammenfassung.");
      } finally {
        setGenerating(false);
      }
    };

    generateSummary();
  }, [tasks]);

  if (loading) return <p>Lade deine Jira-Tasks...</p>;
  if (error) return <p className="text-red-600">Fehler: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Projekt: economiesuisse.ch Relaunch
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linke Spalte – Tasks */}
        <div>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <li key={task.id} className="p-4 border rounded-lg shadow-sm">
                <div className="font-semibold">{task.key}</div>
                <div>{task.summary}</div>
                <div className="text-sm text-gray-500">
                  Status: {task.status}
                </div>
                <div className="text-sm text-gray-500">
                  Zugewiesen an: {task.assignee}
                </div>
                {task.due && (
                  <div className="text-sm text-gray-400">
                    Fällig am: {new Date(task.due).toLocaleDateString("de-CH")}
                  </div>
                )}
                {task.lastStatusChange && (
                  <div className="text-sm text-gray-400">
                    Von <span className="italic">{task.lastStatusFrom}</span> →{" "}
                    <span className="italic">{task.lastStatusTo}</span> am{" "}
                    {new Date(task.lastStatusChange).toLocaleString("de-CH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Rechte Spalte – Zusammenfassung */}
        <div>
          {generating ? (
            <p className="text-gray-500 italic">
              Zusammenfassung wird erstellt…
            </p>
          ) : summary ? (
            <>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-semibold">
                  Projektstatus für Kunden
                </h2>
                <button
                  onClick={copyHtmlToClipboard}
                  className="text-sm px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition"
                >
                  📋 HTML in Zwischenablage kopieren
                </button>
              </div>

              <div
                ref={summaryRef}
                className="bg-gray-50 p-6 border border-gray-200 rounded-lg shadow-sm text-sm font-sans text-gray-800 leading-relaxed space-y-4"
              >
                <h1 className="text-lg font-bold mb-2">
                  Projektupdate der aktuellen Woche.
                </h1>

                <div
                  className="space-y-3"
                  dangerouslySetInnerHTML={{ __html: summary || "" }}
                />

                <div className="border-t pt-4">
                  <div className="font-semibold mb-2">Erledigte Tasks:</div>
                  <ul className="list-disc list-inside space-y-1">
                    {tasks.map((task) => (
                      <li
                        key={task.id}
                        className="p-4 border border-gray-200 rounded-lg shadow-sm bg-white space-y-1"
                      >
                        <strong>{task.key}</strong> – {task.summary}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <p className="text-gray-500 italic">
              Keine Zusammenfassung verfügbar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
