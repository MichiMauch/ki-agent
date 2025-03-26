import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const body = await req.json();
  const { text } = body;

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ status: 'invalid-input' });
  }

  const todos: { name: string; note: string; due: string }[] = [];
  const existingTodos = new Set<string>();
  const currentTitle = '';
  const currentNoteLines: string[] = [];

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
  
    if (trimmed.startsWith('- ') && trimmed.includes(':')) {
      const [titlePart, ...noteParts] = trimmed.slice(2).split(':');
      const title = titlePart.trim();
      const note = noteParts.join(':').trim();

      const todoKey = `${title}-${note}`;
      if (!existingTodos.has(todoKey) && title && note) {
        todos.push({
          name: title,
          note,
          due: new Date().toISOString().split('T')[0],
        });
        existingTodos.add(todoKey);
      }
    }
  }
  

  if (currentTitle && currentNoteLines.length > 0) {
    todos.push({
      name: currentTitle,
      note: currentNoteLines.join('\n'),
      due: new Date().toISOString().split('T')[0],
    });
  }

  if (todos.length === 0) {
    return NextResponse.json({ status: 'no-todos' });
  }

  const timeline = await getTimeline();

  const created = await Promise.all(
    todos.map((todo) => createTask(todo.name, todo.note, todo.due, timeline))
  );

  return NextResponse.json({ created, count: created.length });
}

async function createTask(
  name: string,
  note: string,
  due: string,
  timeline: string
): Promise<{ name: string; note: string; due: string; result: string }> {
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
  const task = Array.isArray(taskSeries.task) ? taskSeries.task[0] : taskSeries.task;

  await addNoteToTask(
    data.rsp.list.id,
    taskSeries.id,
    task.id,
    note,
    timeline
  );

  await setDueDate(
    data.rsp.list.id,
    taskSeries.id,
    task.id,
    due,
    timeline
  );

  return { name, note, due, result: data.rsp.stat };
}

async function setDueDate(
  listId: string,
  taskSeriesId: string,
  taskId: string,
  due: string,
  timeline: string
): Promise<void> {
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
  await fetch(`https://api.rememberthemilk.com/services/rest/?${searchParams.toString()}`);
}

async function addNoteToTask(
  listId: string,
  taskSeriesId: string,
  taskId: string,
  note: string,
  timeline: string
): Promise<void> {
  const params = {
    method: 'rtm.tasks.notes.add',
    api_key: process.env.RTM_API_KEY!,
    auth_token: process.env.RTM_AUTH_TOKEN!,
    list_id: listId,
    taskseries_id: taskSeriesId,
    task_id: taskId,
    note_title: 'Notiz',
    note_text: note,
    timeline,
    format: 'json',
  };

  const api_sig = sign(params);
  const searchParams = new URLSearchParams({ ...params, api_sig });
  await fetch(`https://api.rememberthemilk.com/services/rest/?${searchParams.toString()}`);
}

async function getTimeline(): Promise<string> {
  const params = {
    method: 'rtm.timelines.create',
    api_key: process.env.RTM_API_KEY!,
    auth_token: process.env.RTM_AUTH_TOKEN!,
    format: 'json',
  };
  const api_sig = sign(params);
  const searchParams = new URLSearchParams({ ...params, api_sig });

  const res = await fetch(`https://api.rememberthemilk.com/services/rest/?${searchParams.toString()}`);
  const data = await res.json();
  return data.rsp.timeline;
}

function sign(params: Record<string, string>): string {
  const keys = Object.keys(params).sort();
  const raw = keys.map((k) => `${k}${params[k]}`).join('');
  return crypto
    .createHash('md5')
    .update(`${process.env.RTM_SHARED_SECRET}${raw}`)
    .digest('hex');
}
