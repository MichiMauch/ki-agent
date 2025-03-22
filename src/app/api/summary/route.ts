import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type CalendarEvent = {
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
  };
};

export async function GET(req: NextRequest) {
  const calendar = await getGoogleCalendarClientFromRefreshToken();

  const dateParam = req.nextUrl.searchParams.get('date');
  const date = dateParam ? new Date(dateParam) : new Date();

  const start = new Date(date.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(date.setHours(23, 59, 59, 999)).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = (res.data.items || []).slice(0, 7) as CalendarEvent[];

  const formatter = new Intl.DateTimeFormat('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Zurich',
  });

  const textList = events.map((e) => {
    const rawStart = e.start?.dateTime || e.start?.date || '';
    const time = rawStart ? formatter.format(new Date(rawStart)) : '';
    return `- ${time} ${e.summary}`;
  }).join('\n');

  const prompt = `
Hier ist mein Tagesplan:

${textList}

Fasse das Ganze in einem einzigen, kurzen Satz zusammen.
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const summary = completion.choices[0]?.message?.content?.trim() || 'Heute ist ein entspannter Tag.';

  return NextResponse.json({ summary });
}
