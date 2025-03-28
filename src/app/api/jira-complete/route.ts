import { NextResponse } from "next/server";

const JIRA_DOMAIN = "https://netnode.atlassian.net";
const JIRA_EMAIL = process.env.JIRA_EMAIL!;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!;

const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString("base64");

export async function POST(req: Request) {
  const { taskKeys } = await req.json();

  if (!Array.isArray(taskKeys) || taskKeys.length === 0) {
    return NextResponse.json({ error: "Keine Task-Keys übergeben." }, { status: 400 });
  }

  const results: { key: string; success: boolean; reason?: string }[] = [];

  for (const key of taskKeys) {
    // 1. Transition holen
    const transitionRes = await fetch(
      `${JIRA_DOMAIN}/rest/api/3/issue/${key}/transitions`,
      {
        headers: {
          Authorization: `Basic ${auth}`,
          Accept: "application/json",
        },
      }
    );

    const transitionData = await transitionRes.json();
    interface Transition {
      id: string;
      name: string;
    }

    const fertigTransition = transitionData.transitions.find(
      (t: Transition) => t.name.toLowerCase() === "fertig"
    );

    if (!fertigTransition) {
      results.push({ key, success: false, reason: "Keine 'Fertig'-Transition gefunden" });
      continue;
    }

    // 2. Transition ausführen
    const moveRes = await fetch(`${JIRA_DOMAIN}/rest/api/3/issue/${key}/transitions`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        transition: {
          id: fertigTransition.id,
        },
      }),
    });

    if (moveRes.ok) {
      results.push({ key, success: true });
    } else {
      results.push({ key, success: false, reason: "Fehler beim Wechseln" });
    }
  }

  return NextResponse.json({ results });
}
