// src/app/jira/page.tsx
import { Suspense } from "react";
import JiraPage from "@/components/JiraPage";

export default function JiraPageWrapper() {
  return (
    <Suspense fallback={<div className="p-6">Lade Jira-Daten…</div>}>
      <JiraPage />
    </Suspense>
  );
}
