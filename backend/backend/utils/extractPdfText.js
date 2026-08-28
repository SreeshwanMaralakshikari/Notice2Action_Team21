import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

/**
 * Extracts plain text from a PDF buffer (from multer memory storage).
 * Uses createRequire so the CommonJS pdf-parse package loads correctly
 * inside an ES Module project on Node 18+ / Node 24 (Render).
 *
 * @param {Buffer} buffer  - The PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractPdfText(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text?.trim();
  if (!text) throw new Error("Could not extract text from the uploaded PDF.");
  return text;
}
