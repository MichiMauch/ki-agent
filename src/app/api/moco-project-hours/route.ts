import { NextResponse } from "next/server";

const MOCO_API_TOKEN = process.env.MOCO_API_TOKEN!;
const MOCO_BASE_URL = "https://netnode.mocoapp.com/api/v1";

const headers = {
  Authorization: `Token token=${MOCO_API_TOKEN}`,
  Accept: "application/json",
};

export async function POST(req: Request) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Ungültiger JSON-Body" }, { status: 400 });
  }

  const projectName = body.project;

  if (!projectName) {
    return NextResponse.json({ error: "Kein Projektname angegeben." }, { status: 400 });
  }

  // Schritt 1: Projekte abrufen
  const res = await fetch(`${MOCO_BASE_URL}/projects`, { headers });
  if (!res.ok) {
    return NextResponse.json({ error: "Fehler beim Abrufen der Projekte." }, { status: res.status });
  }

  const projects = await res.json();
  interface Project {
    id: string;
    name: string;
    // Add other relevant fields if necessary
  }

  const project = projects.find((p: Project) => p.name.toLowerCase() === projectName.toLowerCase());

  if (!project) {
    return NextResponse.json({ error: "Projekt nicht gefunden." }, { status: 404 });
  }

  // Schritt 2: Projektreport abrufen
  const reportRes = await fetch(`${MOCO_BASE_URL}/projects/${project.id}/report`, { headers });
  if (!reportRes.ok) {
    return NextResponse.json({ error: "Fehler beim Abrufen des Projekt-Reports." }, { status: reportRes.status });
  }

  const report = await reportRes.json();

  // Rückgabe mit erweiterten Feldern
  const result = {
    name: project.name,
    planned_hours: report.hours_total ?? null,
    recorded_hours: report.hours_billable ?? null,
    remaining_hours: report.hours_remaining ?? null,
    budget_total: report.budget_total ?? null,
    budget_used_percent: report.budget_progress_in_percentage ?? null,
  };

  return NextResponse.json(result);
}
