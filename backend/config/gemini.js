import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;

let genAI = null;
let model = null;

if (apiKey && apiKey !== "your_gemini_api_key_here") {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-pro"});
  console.log("✅  Gemini client initialised");
} else {
  console.warn("⚠️   GEMINI_API_KEY not set — AI pipeline will return mock data");
}

export { model };
