import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  const { tasks } = await req.json()

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ summary: 'Keine relevanten Tasks gefunden.' })
  }

  const summaries = tasks.map(
    (t: any) =>
      `"${t.summary}" (von ${t.lastStatusFrom} zu ${t.lastStatusTo} am ${new Date(
        t.lastStatusChange
      ).toLocaleDateString("de-CH")})`
  )

  const prompt = `
Fasse die folgenden Jira-Tasks als sachlichen Projektstatus für einen Kunden zusammen.
Keine Aufzählung. Keine Einleitung. Keine Übertreibungen.

Aufgaben diese Woche:
${summaries.join("\n")}
`.trim()

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const summary = chatResponse.choices[0]?.message?.content || ""

  return NextResponse.json({ summary })
}
