import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
let ai = null;

if (apiKey && apiKey !== "your_gemini_api_key_here") {
  ai = new GoogleGenAI({ apiKey });
  console.log("✅  Gemini client initialised");
} else {
  console.warn("⚠️  GEMINI_API_KEY not set");
}

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export async function generateWithRetry(prompt, maxRetries = 3) {
  if (!ai) throw new Error("Gemini not configured.");
  let wait = 1000;
  for (let i = 1; i <= maxRetries; i++) {
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
      });
      return response.text;
    } catch (err) {
      const status = err.status || err.statusCode;
      if ((status === 429 || status === 503) && i < maxRetries) {
        console.warn(`Gemini busy, retry ${i}/${maxRetries} in ${wait}ms...`);
        await delay(wait + Math.random() * 200);
        wait *= 2;
      } else throw err;
    }
  }
}