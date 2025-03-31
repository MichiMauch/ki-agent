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
    (t: { summary: string; lastStatusFrom: string; lastStatusTo: string; lastStatusChange: string }) =>
      `"${t.summary}" (von ${t.lastStatusFrom} zu ${t.lastStatusTo} am ${new Date(
        t.lastStatusChange
      ).toLocaleDateString("de-CH")})`
  )

  const prompt = `
  Fasse die folgenden Jira-Tasks in einem sachlichen Projektstatusbericht für einen Kunden zusammen. Halte dich strikt an folgende Vorgaben:

*   **Fokus:** Beschreibe in präzisen, deutschen Sätzen *ausschließlich* die geleistete Arbeit an jedem einzelnen Task *innerhalb dieser Woche*.
*   **Ausschluss:** Vermeide jegliche Angaben über Statusänderungen (z.B. "von 'In Bearbeitung' zu 'Erledigt'"), deren Bedeutung oder jegliche Interpretation des Fortschritts.
*   **Stil:** Vermeide Floskeln, Mutmaßungen, Bewertungen und subjektive Einschätzungen. Der Bericht soll rein faktisch sein.
*   **Sprache:** Verwende Deutsch für die Beschreibung der Arbeit. Englische Aufgabentitel dürfen beibehalten werden.
*   **Formatierung:** Kein einleitender Satz, keine Aufzählungspunkte, keine abschließende Zusammenfassung.
*   **Tastatur:** Verwende die Schweizer Tastatur (Layout).
*   **Zusätzliche Präzisierung (Optional):** Beschreibe nur die **substantielle** Arbeit. Kleinere Anpassungen oder unwesentliche Tätigkeiten sind **nicht** zu berücksichtigen.
*   **Reihenfolge (Optional):** Gib die Tasks in der Reihenfolge aus, wie sie im Originaldokument vorliegen.

  
  Aufgaben:
  ${summaries.join("\n")}
  `.trim();
        

  const chatResponse = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
  })

  const summary = chatResponse.choices[0]?.message?.content || ""

  return NextResponse.json({ summary })
}
