import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: Request) {
  const { tasks, project } = await req.json()
  const projectKey = project || "ECO2025"

  if (!tasks || tasks.length === 0) {
    return NextResponse.json({ summary: 'Keine relevanten Tasks gefunden.' })
  }

  const summaries = tasks.map((t: { summary: string }) => `– ${t.summary}`)

  const prompt = `
Fasse die folgenden Jira-Tasks in einem sachlichen Projektstatusbericht für den Kunden des Projekts "${projectKey}" zusammen. Halte dich strikt an folgende Vorgaben:

* **Fokus:** Beschreibe in präzisen, deutschen Sätzen *ausschliesslich* die geleistete Arbeit an jedem einzelnen Task *innerhalb dieser Woche*.
* **Projektfokus:** Der Bericht darf **ausschliesslich Informationen zum Projekt "${projectKey}"** enthalten. Andere Projekte oder Projektnamen dürfen **nicht erwähnt** werden – auch nicht, wenn sie im Aufgabentitel stehen.
* **Ausschluss:** Vermeide jegliche Angaben über Statusänderungen (z. B. "von 'In Bearbeitung' zu 'Erledigt'") oder Mutmassungen zur Bedeutung des Status.
* **Stil:** Vermeide Floskeln, Mutmassungen, Bewertungen und subjektive Einschätzungen. Der Bericht soll rein faktisch und klar verständlich sein.
* **Sprache:** Verwende Deutsch für die Beschreibung der Arbeit. Englische Aufgabentitel dürfen beibehalten werden.
* **Formatierung:** Kein einleitender Satz, keine Aufzählungspunkte, keine abschliessende Zusammenfassung.
* **Tastatur:** Verwende die Schweizer Tastatur (Layout).
* **Optional:** Kleinere Anpassungen oder unwesentliche Tätigkeiten sind **nicht** zu berücksichtigen.

Aufgaben:
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
