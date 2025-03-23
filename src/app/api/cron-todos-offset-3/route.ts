import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const auth = req.headers.get('Authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const url = `${process.env.NEXTAUTH_URL}/api/create-rtm-todos?offset=3`;
  const headers = {
    Authorization: `Bearer ${process.env.CRON_SECRET}`,
  };

  console.log('🟡 Triggering:', url);

  try {
    const res = await fetch(url, { headers });
    const data = await res.json();
    console.log('✅ Response von /create-rtm-todos:', JSON.stringify(data, null, 2));
    return NextResponse.json({ triggered: true, data });
  } catch (error) {
    console.error('❌ Fehler beim Aufruf von /create-rtm-todos:', error);
    return new NextResponse('Fehler beim Triggern', { status: 500 });
  }
}
