import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const res = await fetch(`${process.env.BASE_URL}/api/send-summary`, {
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  const data = await res.json();

  return NextResponse.json({ triggered: true, data });
}
