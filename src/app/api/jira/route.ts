import { NextResponse } from 'next/server'

const JIRA_DOMAIN = 'https://netnode.atlassian.net'
const JIRA_EMAIL = process.env.JIRA_EMAIL!
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN!

export async function GET() {
  const jql = `project = ECO2025 AND status in ("Ready to Review", "Ready to Deploy", "Release Notes")`
  const url = `${JIRA_DOMAIN}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,duedate,assignee,customfield_10401&expand=changelog`

  const auth = Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Accept': 'application/json',
    },
  })

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch Jira tasks' }, { status: res.status })
  }

  const data = await res.json()
  console.log("🔍 Beispiel-Issue-Felder:", data.issues?.[0]?.fields);
  console.log("🔑 Alle Felder:", Object.keys(data.issues?.[0]?.fields || {}));
  const fields = data.issues?.[0]?.fields || {};

  Object.entries(fields).forEach(([key, value]) => {
    if (key.startsWith("customfield_") && Array.isArray(value)) {
      console.log(`🔍 ${key}:`, JSON.stringify(value, null, 2));
    }
  });

  interface JiraIssue {
    id: string;
    key: string;
    fields: {
      summary: string;
      status: { name: string };
      assignee?: { displayName: string };
      duedate?: string;
      customfield_10020?: Array<{ name: string }>;
      customfield_10401?: Array<{ name: string }>;
    };
    changelog?: {
      histories: Array<{
        created: string;
        items: Array<{
          field: string;
          fromString?: string;
          toString?: string;
        }>;
      }>;
    };
  }

  const tasks = data.issues.map((issue: JiraIssue) => {
    const history = issue.changelog?.histories || []

    const lastStatusChange = history
      .flatMap((h: { created: string; items: Array<{ field: string; fromString?: string; toString?: string }> }) =>
        h.items
          .filter((item) => item.field === 'status')
          .map((item) => ({
            from: item.fromString,
            to: item.toString,
            changed: h.created,
          }))
      )
      .sort((a, b) => new Date(b.changed).getTime() - new Date(a.changed).getTime())[0] // neueste zuerst

    return {
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      due: issue.fields.duedate || null,
      lastStatusChange: lastStatusChange?.changed || null,
      lastStatusFrom: lastStatusChange?.from || null,
      sprint: issue.fields.customfield_10020?.[0]?.name || issue.fields.customfield_10401?.[0]?.name || null,


    }
  })

  return NextResponse.json({ tasks })
}
