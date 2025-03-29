import { NextResponse } from "next/server";
import { mocoUsers } from "@/lib/mocoUsers";

const MOCO_API_TOKEN = process.env.MOCO_API_TOKEN!;
const MOCO_BASE_URL = "https://netnode.mocoapp.com/api/v1";

const headers = {
  Authorization: `Token token=${MOCO_API_TOKEN}`,
  Accept: "application/json",
};

// Zeitspanne: Montag bis heute
function getMondayToToday() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  return {
    from: monday.toISOString().split("T")[0],
    to: now.toISOString().split("T")[0],
  };
}

export async function POST(req: Request) {
  let tasks: { key: string }[] = [];

  try {
    const body = await req.json();
    tasks = body.tasks || [];
  } catch {
    console.warn("⚠️ Kein JSON-Body erhalten oder ungültig.");
    return NextResponse.json({ entries: [] });
  }

  if (tasks.length === 0) {
    return NextResponse.json({ entries: [] });
  }

  const taskKeys = tasks.map((t: { key: string }) => t.key);
  const { from, to } = getMondayToToday();
  const entries: {
    user: string;
    date: string;
    minutes: number;
    description: string;
    project?: string;
  }[] = [];

  for (const user of mocoUsers) {
    const url = `${MOCO_BASE_URL}/activities?from=${from}&to=${to}&user_id=${user.id}`;

    const res = await fetch(url, { headers });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`⚠️ Fehler bei User ${user.name} – ${res.status}`);
      console.warn(`📩 Response Body: ${text}`);
      continue;
    }

    const activities = await res.json();

    const matching = activities.filter((entry: { description?: string }) =>
      taskKeys.some((key) =>
        entry.description?.toLowerCase().includes(key.toLowerCase())
      )
    );

    for (const entry of matching) {
        console.log("🕒 Matching entry:", {
          user: user.name,
          date: entry.date,
          hours: entry.hours,
          description: entry.description,
          project: entry.project?.name,
        });
      }

    entries.push(
      ...matching.map((entry: {
        date: string;
        hours: number;
        description: string;
        project?: { name: string };
      }) => ({
        user: user.name,
        date: entry.date,
        hours: entry.hours,
        description: entry.description,
        project: entry.project?.name,
      }))
    );
  }

  return NextResponse.json({ entries });
}
