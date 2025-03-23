import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Fire & forget: send-summary für heute
  fetch(`${process.env.NEXTAUTH_URL}/api/send-summary`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  }).catch((err) => {
    console.error('Fehler beim Triggern von /api/send-summary:', err);
  });

  // Fire & forget: create-rtm-todos mit offset 3
  fetch(`${process.env.NEXTAUTH_URL}/api/create-rtm-todos?offset=3`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  }).catch((err) => {
    console.error('Fehler beim Triggern von /api/create-rtm-todos:', err);
  });

  return NextResponse.json({ triggered: true });
}
