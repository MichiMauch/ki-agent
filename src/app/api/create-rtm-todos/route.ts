import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import OpenAI from 'openai';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type CalendarEvent = {
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
  };
};

export async function GET(req: NextRequest): Promise<NextResponse> {
  // 🔐 CRON-Sicherheitscheck
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);
  const calendar = await getGoogleCalendarClientFromRefreshToken();

  const date = new Date();
  date.setDate(date.getDate() + offset);
  const selectedDate = new Date(date); // kopie

  const start = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = (res.data.items || []) as CalendarEvent[];

  const termindaten = events.map((event) => {
    const summary = event.summary || 'Ohne Titel';
    const rawStart = event.start?.dateTime || event.start?.date || '';
    const dateObj = new Date(rawStart);
    const time = dateObj.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dateStr = dateObj.toISOString().split('T')[0];

    return {
      summary,
      time,
      date: dateStr,
      promptLine: `- ${time} ${summary}`,
    };
  });

  const prompt = `
Hier ist mein Tagesplan für ${selectedDate.toLocaleDateString('de-CH')}:

${termindaten.map((e) => e.promptLine).join('\n')}

Erstelle für jeden Termin maximal zwei konkrete, umsetzbare To-dos.
Verwende jeweils den Titel des Termins am Anfang des To-dos.
Formuliere die To-dos in Stichpunkten – kurz, präzise, ohne Wiederholungen.
Gib nur die To-dos aus, keine Kommentare.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const todoText = completion.choices[0].message?.content || '';
  const todos = todoText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('-'));

  const timeline = await getTimeline();

  const created = await Promise.all(
    todos.map(async (todo) => {
      const content = todo.replace(/^[-•]\s*/, '');
      const matchingTermin = termindaten.find((t) =>
        content.startsWith(t.summary)
      );
      const due = matchingTermin?.date || selectedDate.toISOString().split('T')[0];
      return createTask(content, due, timeline);
    })
  );

  return NextResponse.json({ offset, created, count: created.length });
}

// ➕ Aufgabe anlegen (inkl. due setzen)
async function createTask(
  name: string,
  due: string,
  timeline: string
): Promise<{ name: string; due: string; result: string }> {
  const url = `https://api.rememberthemilk.com/services/rest/`;
  const method = 'rtm.tasks.add';

  const params = {
    method,
    api_key: process.env.RTM_API_KEY!,
    auth_token: process.env.RTM_AUTH_TOKEN!,
    timeline,
    name,
    list_id: process.env.RTM_LIST_ID!,
    parse: '0',
    format: 'json',
  };

  const api_sig = sign(params);
  const searchParams = new URLSearchParams({ ...params, api_sig });
  const res = await fetch(`${url}?${searchParams.toString()}`);
  const data = await res.json();

  const taskSeries = Array.isArray(data.rsp.list.taskseries)
    ? data.rsp.list.taskseries[0]
    : data.rsp.list.taskseries;
  const task = Array.isArray(taskSeries.task)
    ? taskSeries.task[0]
    : taskSeries.task;

  const setDueResult = await setDueDate(
    data.rsp.list.id,
    taskSeries.id,
    task.id,
    due,
    timeline
  );

  return { name, due, result: setDueResult };
}

// 📅 Fälligkeit setzen
async function setDueDate(
  listId: string,
  taskSeriesId: string,
  taskId: string,
  due: string,
  timeline: string
): Promise<string> {
  const params = {
    method: 'rtm.tasks.setDueDate',
    api_key: process.env.RTM_API_KEY!,
    auth_token: process.env.RTM_AUTH_TOKEN!,
    list_id: listId,
    taskseries_id: taskSeriesId,
    task_id: taskId,
    due,
    timeline,
    format: 'json',
  };

  const api_sig = sign(params);
  const searchParams = new URLSearchParams({ ...params, api_sig });

  const res = await fetch(
    `https://api.rememberthemilk.com/services/rest/?${searchParams.toString()}`
  );
  const data = await res.json();

  return data.rsp?.stat || 'unknown';
}

// 🕒 Timeline erstellen
async function getTimeline(): Promise<string> {
  const params = {
    method: 'rtm.timelines.create',
    api_key: process.env.RTM_API_KEY!,
    auth_token: process.env.RTM_AUTH_TOKEN!,
    format: 'json',
  };
  const api_sig = sign(params);
  const searchParams = new URLSearchParams({ ...params, api_sig });

  const res = await fetch(
    `https://api.rememberthemilk.com/services/rest/?${searchParams.toString()}`
  );
  const data = await res.json();
  return data.rsp.timeline;
}

// 🔐 Signatur
function sign(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const raw = keys.map((k) => `${k}${params[k]}`).join('');
  return crypto
    .createHash('md5')
    .update(`${process.env.RTM_SHARED_SECRET}${raw}`)
    .digest('hex');
}
