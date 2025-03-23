// app/api/rtm/token/route.ts
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const baseUrl = 'https://api.rememberthemilk.com/services/rest/';

export async function GET(req: NextRequest) {
  const frob = req.nextUrl.searchParams.get('frob');

  if (!frob) {
    return new Response('Missing frob', { status: 400 });
  }

  const url = `${baseUrl}?method=rtm.auth.getToken&api_key=${process.env.RTM_API_KEY}&frob=${frob}&format=json&api_sig=${sign({
    method: 'rtm.auth.getToken',
    api_key: process.env.RTM_API_KEY!,
    frob,
    format: 'json',
  })}`;

  const res = await fetch(url);
  const data = await res.json();

  const token = data.rsp.auth.token;

  return NextResponse.json({ token });
}

function sign(params: Record<string, string>) {
  const keys = Object.keys(params).sort();
  const raw = keys.map((k) => `${k}${params[k]}`).join('');
  return crypto
    .createHash('md5')
    .update(`${process.env.RTM_SHARED_SECRET}${raw}`)
    .digest('hex');
}
