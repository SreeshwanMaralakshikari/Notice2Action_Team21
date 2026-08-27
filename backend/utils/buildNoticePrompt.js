/**
 * Builds the Gemini prompt for notice parsing.
 * Returns a prompt string that asks Gemini for strict JSON only.
 */
export function buildNoticePrompt(rawText) {
  return `
You are an AI assistant that reads official notices and extracts structured information.

Given the notice text below, return ONLY a valid JSON object — no markdown, no code fences, no extra text — that matches this exact schema:

{
  "summary": "A 2-3 sentence plain-language summary of what the notice is about.",
  "category": "One of: Exam | Fee | Scholarship | Hostel | Event | Other",
  "deadlines": [
    { "label": "What this date is for", "date": "DD MMM YYYY or as stated" }
  ],
  "eligibility": [
    "Condition 1",
    "Condition 2"
  ],
  "checklist": [
    { "task": "Action the reader must take", "done": false }
  ]
}

Rules:
- summary: plain English, no jargon, max 3 sentences.
- category: pick the single best fit from the enum.
- deadlines: list every concrete date or deadline mentioned. Use the date exactly as stated in the notice.
- eligibility: list every condition that determines who this notice applies to. If none, return an empty array.
- checklist: list every concrete action the reader must take to comply with or benefit from the notice. Each task should be a short, clear imperative sentence.
- done is always false — it is toggled by the user later.
- If a field has no data, return an empty array (not null).

NOTICE TEXT:
"""
${rawText}
"""
`.trim();
}
