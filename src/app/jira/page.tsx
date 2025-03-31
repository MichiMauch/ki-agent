"use client";

import { useEffect, useState } from "react";
import Kalenderwoche from "@/components/Kalenderwoche";
import TaskCard from "@/components/TaskCard";
import SummaryBlock from "@/components/SummaryBlock";
import TimeTracking from "@/components/TimeTracking";
import ProjectInfoBlock from "@/components/ProjectInfoBlock";

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
  sprint: string | null;
};

export default function JiraPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [projectNames, setProjectNames] = useState<string[]>([]);
  const [completing, setCompleting] = useState(false);

  const showToast = (message: string) => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className =
      "fixed bottom-6 right-6 bg-black text-white text-sm px-4 py-2 rounded shadow z-50 animate-fade-in-out";
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  // Tasks & Projekte holen
  useEffect(() => {
    const fetchTasksAndProjects = async () => {
      try {
        const res = await fetch("/api/jira");
        if (!res.ok) throw new Error("Fehler beim Laden der Tasks");
        const data = await res.json();
        setTasks(data.tasks);

        // Projekte aus Zeiterfassung holen
        const timeRes = await fetch("/api/moco-time", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tasks: data.tasks }),
        });
        const timeData = await timeRes.json();
        const entries = timeData.entries || [];

        const uniqueProjects = Array.from(
          new Set(
            entries
              .map((e: { project: string | null }) => e.project)
              .filter(Boolean)
          )
        ) as string[];
        setProjectNames(uniqueProjects);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("Unbekannter Fehler");
      } finally {
        setLoading(false);
      }
    };

    fetchTasksAndProjects();
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

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Projekt: economiesuisse.ch Relaunch (<Kalenderwoche />)
          </h1>
          <div className="flex gap-2">
            <button
              disabled
              className="text-sm px-3 py-1 rounded bg-gray-300 text-gray-600 cursor-not-allowed"
            >
              ⏳ Wird verschoben…
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Linke Spalte Skeletons */}
          <div className="space-y-4">
            {/* TaskCard Skeletons */}
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 border rounded-lg shadow-sm space-y-2 animate-pulse"
              >
                <div className="h-4 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}

            {/* TimeTracking Skeleton */}
            <div className="mt-6 space-y-2 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-300 rounded" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`tt-${i}`}
                  className="p-3 border rounded space-y-2 bg-white"
                >
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-4 bg-gray-100 rounded w-1/3" />
                </div>
              ))}
            </div>

            {/* ProjectInfoBlock Skeleton */}
            <div className="mt-6 space-y-2 animate-pulse">
              <div className="h-5 w-1/2 bg-gray-300 rounded" />
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
            </div>
          </div>

          {/* Rechte Spalte Skeleton Summary */}
          <div className="space-y-4 animate-pulse">
            <div className="h-6 w-1/2 bg-gray-300 rounded" />
            <div className="h-4 w-full bg-gray-100 rounded" />
            <div className="h-4 w-11/12 bg-gray-100 rounded" />
            <div className="h-4 w-5/6 bg-gray-100 rounded" />
            <div className="h-4 w-3/4 bg-gray-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (error) return <p className="text-red-600">Fehler: {error}</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Projekt: economiesuisse.ch Relaunch (<Kalenderwoche />)
        </h1>

        <div className="flex gap-2">
          <button
            disabled={completing}
            onClick={async () => {
              setCompleting(true);
              const keys = tasks.map((t) => t.key);
              const res = await fetch("/api/jira-complete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskKeys: keys }),
              });
              await res.json();
              showToast("✅ Tasks wurden verschoben");
              setCompleting(false);
            }}
            className={`text-sm px-3 py-1 rounded transition ${
              completing
                ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {completing
              ? "⏳ Wird verschoben…"
              : "✅ Tasks als erledigt markieren"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Linke Spalte – Tasks */}
        <div>
          <ul className="space-y-4">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </ul>

          <TimeTracking tasks={tasks} />

          {/* Dynamische Projektinfo-Blöcke */}
          <div className="mt-8 space-y-4">
            {projectNames.map((name) => (
              <ProjectInfoBlock key={name} projectName={name} />
            ))}
          </div>
        </div>

        {/* Rechte Spalte – Zusammenfassung */}
        <SummaryBlock
          summary={summary}
          tasks={tasks}
          generating={generating}
          onCopy={() => showToast("📋 HTML wurde kopiert")}
        />
      </div>
    </div>
  );
}
