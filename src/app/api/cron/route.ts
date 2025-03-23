import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  // Fire & forget – kein await
  fetch(`${process.env.NEXTAUTH_URL}/api/send-summary`, { headers }).catch(console.error);
  fetch(`${process.env.NEXTAUTH_URL}/api/create-rtm-todos?offset=3`, { headers }).catch(console.error);

  return NextResponse.json({ triggered: true });
}
