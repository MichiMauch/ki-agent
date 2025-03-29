"use client";

import { useEffect, useState } from "react";

type ProjectInfo = {
  name: string;
  planned_hours: number | null;
  recorded_hours: number | null;
  remaining_hours: number | null;
  budget_total: number | null;
  budget_used_percent: number | null;
};

export default function ProjectInfoBlock({
  projectName,
}: {
  projectName: string;
}) {
  const [info, setInfo] = useState<ProjectInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const res = await fetch("/api/moco-project-hours", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ project: projectName }),
        });

        if (!res.ok)
          throw new Error("Fehler beim Laden der Projektinformationen");

        const data = await res.json();
        setInfo(data);
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

    fetchProjectInfo();
  }, [projectName]);

  if (loading)
    return (
      <p className="text-gray-500 italic">
        Projektinformationen werden geladen…
      </p>
    );
  if (error) return <p className="text-red-600">Fehler: {error}</p>;
  if (!info) return null;

  return (
    <div className="bg-white p-4 border rounded-md shadow text-sm text-gray-800 space-y-2 mt-6">
      <h2 className="text-base font-semibold">Projektinformationen</h2>
      <div>
        <strong>Projekt:</strong> {info.name}
      </div>
      <div>
        <strong>Geplante Stunden:</strong> {info.planned_hours ?? "–"}
      </div>
      <div>
        <strong>Erfasste Stunden:</strong> {info.recorded_hours ?? "–"}
      </div>
      <div>
        <strong>Verbleibende Stunden:</strong> {info.remaining_hours ?? "–"}
      </div>
      <div>
        <strong>Budget total:</strong>{" "}
        {info.budget_total?.toLocaleString("de-CH", {
          style: "currency",
          currency: "CHF",
        }) ?? "–"}
      </div>
      <div>
        <strong>Budget verwendet:</strong>{" "}
        {info.budget_used_percent != null
          ? `${info.budget_used_percent}%`
          : "–"}
      </div>
    </div>
  );
}
