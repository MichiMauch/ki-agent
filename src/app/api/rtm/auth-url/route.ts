// app/api/rtm/auth-url/route.ts
import crypto from 'crypto';
import { NextResponse } from 'next/server';

const baseUrl = 'https://api.rememberthemilk.com/services/rest/';
const perms = 'delete'; // erlaubt Aufgaben erstellen/löschen

export async function GET() {
  const frobUrl = `${baseUrl}?method=rtm.auth.getFrob&api_key=${process.env.RTM_API_KEY}&format=json&api_sig=${sign({
    method: 'rtm.auth.getFrob',
    api_key: process.env.RTM_API_KEY!,
    format: 'json',
  })}`;

  const frobRes = await fetch(frobUrl);
  const frobJson = await frobRes.json();
  const frob = frobJson.rsp.frob;

  const authUrl = `https://www.rememberthemilk.com/services/auth/?api_key=${process.env.RTM_API_KEY}&perms=${perms}&frob=${frob}&api_sig=${sign({
    api_key: process.env.RTM_API_KEY!,
    perms,
    frob,
  })}`;

  return NextResponse.json({ frob, authUrl });
}

// Signatur generieren (MD5 Hash)
function sign(params: Record<string, string>) {
  const keys = Object.keys(params).sort();
  const raw = keys.map((k) => `${k}${params[k]}`).join('');
  return crypto
    .createHash('md5')
    .update(`${process.env.RTM_SHARED_SECRET}${raw}`)
    .digest('hex');
}
