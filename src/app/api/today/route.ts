import { getGoogleCalendarClientFromRefreshToken } from '@/lib/google';
import { NextRequest, NextResponse } from 'next/server';

type CalendarEvent = {
  summary?: string | null;
  start?: {
    dateTime?: string | null;
    date?: string | null;
  };
  location?: string | null; // 👈 Ort hinzufügen
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

  const events = (res.data.items || []).map((event: CalendarEvent) => ({
    summary: event.summary || 'Kein Titel',
    start: event.start?.dateTime || event.start?.date || null,
    location: event.location || null, // 👈 Ort hinzufügen
  }));

  return NextResponse.json({ events });
}
