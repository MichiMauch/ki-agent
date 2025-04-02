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
  
  * **Format:** Gib das Ergebnis ausschliesslich als HTML zurück. Verwende <h2> oder <h3> als Abschnittstitel. Absätze sollen in <p>-Tags formatiert sein. Verwende keine Markdown-Syntax.
  * **Struktur:** Fasse thematisch verwandte Tasks in sinnvolle Abschnitte zusammen. Jeder Abschnitt beginnt mit einem passenden Titel.
  * **Inhalt:** Beschreibe präzise, was innerhalb dieser Woche gearbeitet wurde. Fasse Aufgaben logisch zusammen, ohne jede Aufgabe einzeln aufzulisten.
  * **Projektfokus:** Der Bericht darf **nur Informationen zum Projekt "${projectKey}"** enthalten. Andere Projekte oder Namen dürfen **nicht erwähnt** werden – auch nicht, wenn sie im Tasktitel vorkommen.
  * **Fokus:** Beschreibe nur substanzielle Arbeiten aus dieser Woche. Kleinere oder irrelevante Tätigkeiten weglassen.
  * **Stil:** Keine Floskeln oder Bewertungen. Nur sachlich, informativ, klar.
  * **Sprache:** Verwende Deutsch für die Beschreibung. Englische Tasktitel können erwähnt werden, aber nicht priorisiert.
  * **Rechtschreibung:** Achte auf korrekte Rechtschreibung und Grammatik. Verwende keine Abkürzungen. 
  * **Tastatur:** Verwende nur die schweizerdeutsche Tastaturbelegung. Verwende keine Umlaute oder Sonderzeichen, die nicht auf der schweizerdeutschen Tastatur vorhanden sind.
  
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
