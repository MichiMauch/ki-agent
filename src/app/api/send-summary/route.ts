import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import OpenAI from 'openai';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type CalendarEvent = {
  summary?: string;
  start?: {
    dateTime?: string;
    date?: string;
  };
};

export async function GET() {
  const calendar = await getGoogleCalendarClientFromRefreshToken();

  const date = new Date();
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

  const textList = events.map((e) => {
    const start = e.start?.dateTime || e.start?.date || '';
    const time = start ? new Date(start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
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

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO!,
    subject: `Dein Tagesüberblick – ${date.toLocaleDateString('de-CH')}`,
    text: `🧠 Dein Tag in einem Satz:\n\n"${summary}"\n\n📅 Termine:\n${textList}`,
  });

  return NextResponse.json({ status: 'sent', summary });
}
