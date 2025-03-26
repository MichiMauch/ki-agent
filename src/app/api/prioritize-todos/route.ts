import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest): Promise<NextResponse> {
  const { todos } = await req.json();

  if (!Array.isArray(todos) || todos.length === 0) {
    return NextResponse.json({ error: 'Keine To-dos angegeben.' }, { status: 400 });
  }

  const prompt = `
Du erhältst eine Liste von Aufgaben, die aus meinem Kalender generiert wurden.

Bitte analysiere jede Aufgabe und:
1. Entferne Aufgaben, die keine aktive Vorbereitung benötigen (z. B. regelmässige Meetings, Daily, Lunch and Learn und ähnliches).
2. Erstelle Aufgaben von Meeting welche eine Nachbereitung benötigen.
3. Erstelle Aufgaben von Meetings, die eine Vorbereitung benötigen.
4. Erstelle Aufgaben von Meetings, die eine aktive Teilnahme erfordern.
5. Erstelle Aufgaben von Meetings, die eine aktive Vorbereitung erfordern.
6. Erstelle Aufgaben von Meetings, die eine aktive Nachbereitung erfordern.
7. Priorisiere Aufgaben nach Relevanz: Vorbereitung und kritische Themen zuerst, dann Meetings, dann Unwichtiges.
8. Gib die bereinigte und sortierte Liste zurück – max. 3 Punkte.
9. Verwende eine nummerierte Liste (1–3).

${todos.map((todo: string) => `- ${todo}`).join('\n')}

Bitte ordne diese Aufgaben nach Priorität (hoch, mittel, niedrig). 
Berücksichtige dabei zeitliche Nähe, Bedeutung und Dringlichkeit.

Gib die Antwort in folgender Form zurück:
1. 🟥 Hoch – ...
2. 🟨 Mittel – ...
3. 🟩 Niedrig – ...
`;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const prioritizedText = completion.choices[0]?.message?.content?.trim();

  return NextResponse.json({ prioritized: prioritizedText });
}
