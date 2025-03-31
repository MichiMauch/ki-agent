"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { projects } from "@/lib/projects"; // neu

export default function HomePage() {
  const router = useRouter();
  const [project, setProject] = useState(projects[0].key); // erstes Projekt vorausgewählt

  const handleSubmit = () => {
    router.push(`/jira?project=${project}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Projekt auswählen</h1>
      <select
        className="border rounded p-2 w-full mb-4"
        value={project}
        onChange={(e) => setProject(e.target.value)}
      >
        {projects.map((p) => (
          <option key={p.key} value={p.key}>
            {p.name}
          </option>
        ))}
      </select>

      <button
        onClick={handleSubmit}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
      >
        Projekt anzeigen
      </button>
    </div>
  );
}
