/**
 * buildChatPrompt.js — Phase 4 Priority 3
 *
 * Builds a grounded Gemini prompt for the "Ask This Notice" chatbot.
 * All answers are strictly grounded in the notice text + metadata —
 * no hallucination, no guessing outside the document.
 *
 * @param {object} opts
 *   noticeText     — raw text of the notice (notice.rawText)
 *   noticeMetadata — structured fields extracted by Phase 4 P1 AI
 *   studentProfile — from localStorage (null if not set)
 *   userMessage    — the student's current question
 *   chatHistory    — [{role:'user'|'ai', content:string}] last ≤6 turns
 * @returns {string} prompt string to pass to model.generateContent()
 */
export function buildChatPrompt({
  noticeText,
  noticeMetadata,
  studentProfile,
  userMessage,
  chatHistory = [],
}) {
  const profileStr = studentProfile
    ? [
        `Year: ${studentProfile.year}`,
        `Branch: ${studentProfile.branch}`,
        `CGPA: ${studentProfile.cgpa}`,
        `Graduation Year: ${studentProfile.graduationYear}`,
        studentProfile.skills?.length
          ? `Skills: ${studentProfile.skills.join(', ')}`
          : '',
        studentProfile.interests?.length
          ? `Interests: ${studentProfile.interests.join(', ')}`
          : '',
      ]
        .filter(Boolean)
        .join(' | ')
    : 'No profile provided — answer generally for any college student.';

  const historyStr = chatHistory.length
    ? chatHistory
        .map((m) => `${m.role === 'user' ? 'Student' : 'AI'}: ${m.content}`)
        .join('\n')
    : '(No prior conversation)';

  const metaStr = JSON.stringify(
    {
      title:          noticeMetadata.title          || '',
      organization:   noticeMetadata.organization   || '',
      category:       noticeMetadata.category       || '',
      summary:        noticeMetadata.summary        || '',
      eligibility:    noticeMetadata.eligibility    || [],
      importantDates: noticeMetadata.importantDates || [],
      documents:      noticeMetadata.documents      || [],
      actions:        noticeMetadata.actions        || [],
      contacts:       noticeMetadata.contacts       || [],
      links:          noticeMetadata.links          || [],
    },
    null,
    2
  );

  return `You are the "Ask This Notice" grounded AI assistant for Notice2Action.
Your role is to help a college student understand a specific uploaded notice.

STUDENT PROFILE:
${profileStr}

NOTICE TEXT (source of truth):
"""
${noticeText}
"""

NOTICE METADATA (structured extraction from the notice):
${metaStr}

STRICT RULES — follow these exactly:
1. Base ALL answers solely on the notice text and metadata above. Never invent or assume information not present.
2. If asked about eligibility, go criterion by criterion using the student's profile where available.
3. If information is not in the notice, say clearly: "I couldn't find that in this notice."
4. Never fabricate dates, links, amounts, or names.
5. Keep answers concise and helpful. Use bullet points where it aids clarity.
6. If the student asks something unrelated to the notice, politely redirect: "I can only answer questions about this specific notice."
7. Address the student directly (use "you" / "your").

CONVERSATION SO FAR:
${historyStr}

Student: ${userMessage}
AI:`;
}
