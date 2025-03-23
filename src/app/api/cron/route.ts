import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  console.log('Authorization:', auth);

  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    console.log('Unauthorized!');
    return new Response('Unauthorized', { status: 401 });
  }

  console.log('Triggering /api/send-summary...');

  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/send-summary`, {
    headers: {
      Authorization: `Bearer ${process.env.CRON_SECRET}`,
    },
  });

  const data = await res.json();
  console.log('Response from send-summary:', data);

  return NextResponse.json({ triggered: true, data });
}
