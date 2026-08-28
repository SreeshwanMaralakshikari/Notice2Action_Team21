import { createRequire } from "module";
const require = createRequire(import.meta.url);
const _mod = require("pdf-parse");
const pdfParse = typeof _mod === "function" ? _mod : (_mod.default || _mod);

/**
 * Extracts plain text from a PDF buffer (from multer memory storage).
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