"use client";

import { useRef } from "react";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

type Task = {
  id: string;
  key: string;
  summary: string;
};

type SummaryBlockProps = {
  summary: string | null;
  tasks: Task[];
  generating: boolean;
  onCopy?: () => void;
};

export default function SummaryBlock({
  summary,
  tasks,
  generating,
  onCopy,
}: SummaryBlockProps) {
  const summaryRef = useRef<HTMLDivElement>(null);

  const copyHtmlToClipboard = () => {
    if (!summaryRef.current) return;

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = summaryRef.current.innerHTML;
    tempDiv.style.position = "fixed";
    tempDiv.style.pointerEvents = "none";
    tempDiv.style.opacity = "0";

    document.body.appendChild(tempDiv);

    const range = document.createRange();
    range.selectNodeContents(tempDiv);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);

    try {
      document.execCommand("copy");
      if (onCopy) onCopy();
    } catch (err) {
      console.error("Kopieren fehlgeschlagen", err);
    }

    selection?.removeAllRanges();
    document.body.removeChild(tempDiv);
  };

  return (
    <div>
      {generating ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-5 w-2/3 bg-gray-300 rounded" />
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-11/12 bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
          <div className="h-4 w-4/6 bg-gray-100 rounded" />
          <div className="h-4 w-3/4 bg-gray-100 rounded" />
        </div>
      ) : summary ? (
        <>
          <div className="relative">
            <button
              onClick={copyHtmlToClipboard}
              title="HTML kopieren"
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <ContentCopyIcon fontSize="small" />
            </button>

            <div
              ref={summaryRef}
              className="bg-white p-6 border rounded-md shadow text-sm font-sans text-gray-800 leading-relaxed space-y-4 prose"
            >
              <h1 className="text-lg font-bold mb-2">Projektupdate </h1>

              <div
                className="summary-content"
                dangerouslySetInnerHTML={{ __html: summary || "" }}
              />

              <div className="border-t pt-4">
                <div className="font-semibold mb-2">Erledigte Tasks:</div>
                <ul className="list-disc list-inside space-y-1">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <strong>{task.key}</strong> – {task.summary}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </>
      ) : (
        <p className="text-gray-500 italic">Keine Zusammenfassung verfügbar.</p>
      )}
    </div>
  );
}
