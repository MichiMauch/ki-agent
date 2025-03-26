import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import OpenAI from 'openai';
import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY!);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

type CalendarEvent = {
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
  };
};

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

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

  const tasks = [
    "Überlege dir, in welchen Bereichen du dich verbessert hast und welche Ziele du erreicht hast. Bereite Beispiele vor, um diese Punkte zu untermauern.",
    "Entscheide, was du für zukünftige Ziele in deinem Job hast und wie du planst, diese zu erreichen.",
    "Sammle alle relevanten Dokumente und Informationen, die für den Anruf erforderlich sind.",
    "Fasse die Schlüsselprobleme oder -fragen zusammen, die du während des Anrufs ansprechen möchtest.",
    "Bereite dich auf eine Präsentation deiner Designideen vor.",
    "Sammle Feedback oder Bemerkungen zu früheren Projekten, die für dieses Meeting relevant sein könnten."
  ];

  const tasksList = tasks.map((task, index) => `${index + 1}. ${task}`).join('\n');

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: process.env.EMAIL_TO!,
    subject: `Mein Tag – ${date.toLocaleDateString('de-CH')}`,
    text: `🧠 Mein Tag in einem Satz:\n\n"${summary}"\n\n📅 Termine:\n${textList}\n\n📝 Aufgaben:\n${tasksList}`,
  });

  return NextResponse.json({ status: 'sent', summary });
}
