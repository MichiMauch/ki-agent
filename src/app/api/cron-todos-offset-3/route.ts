import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const headers = {
    Authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  // Fire & Forget – löst die lange Funktion aus, aber wartet nicht
  fetch(`${process.env.NEXTAUTH_URL}/api/create-rtm-todos?offset=3`, { headers }).catch(console.error);

  return NextResponse.json({ triggered: true, note: 'offset 3 gestartet' });
}
