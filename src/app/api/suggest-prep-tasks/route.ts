import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function GET(): Promise<NextResponse> {
  const calendar = await getGoogleCalendarClientFromRefreshToken();

  // Prüfe Termine für die nächsten 3 Tage
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  const start = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const end = new Date(threeDaysLater.setHours(23, 59, 59, 999)).toISOString();

  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: start,
    timeMax: end,
    singleEvents: true,
    orderBy: 'startTime',
  });

  const events = res.data.items || [];

  // Filtere nur relevante Termine (z. B. Meetings, Kunden, Reviews etc.)
  const candidates = events.filter(e => {
    const summary = e.summary?.toLowerCase() || '';
    return /kund|meeting|review|besprechung|call/.test(summary);
  });

  if (candidates.length === 0) {
    return NextResponse.json({ suggestions: [], note: 'Keine relevanten Termine in 3 Tagen.' });
  }

  const prompt = `Du bekommst eine Liste mit Terminen. Erkenne, für welche Termine eine Vorbereitung sinnvoll ist, und schlage jeweils 1–2 Aufgaben zur Vorbereitung vor. Gib die Vorschläge im folgenden Format zurück: \n\n1. Aufgabe 1 für Termin 1 am Datum\n2. Aufgabe 2 für Termin 1 am Datum\n3. Aufgabe 1 für Termin 2 am Datum\n\nTermine:\n${candidates.map((e) => `- ${e.start?.dateTime ? new Date(e.start.dateTime).toLocaleDateString('de-CH') : e.start?.date ? new Date(e.start.date).toLocaleDateString('de-CH') : 'Unbekanntes Datum'} ${e.summary}`).join('\n')}`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const text = completion.choices[0].message?.content || '';

  return NextResponse.json({ suggestions: text });
}