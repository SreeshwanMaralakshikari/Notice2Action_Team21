import Groq from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GROQ_API_KEY;
let groq = null;

if (apiKey && apiKey !== "your_groq_api_key_here") {
  groq = new Groq({ apiKey });
  console.log("✅  Groq client initialised");
} else {
  console.warn("⚠️  GROQ_API_KEY not set — AI features will not work.");
}

/**
 * Sends a prompt to Groq (llama-3.3-70b-versatile) and returns the response text.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
export async function generateText(prompt) {
  if (!groq) throw new Error("Groq not configured. Set GROQ_API_KEY in your environment.");

  const response = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.3,
  });

  return response.choices[0].message.content;
}
