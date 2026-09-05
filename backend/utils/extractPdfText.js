import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text from a PDF buffer (from multer memory storage).
 * Uses pdf-parse v2 class-based API.
 * Sanitizes the extracted text to remove characters that can break JSON parsing.
 *
 * @param {Buffer} buffer  - The PDF file buffer
 * @returns {Promise<string>} - Extracted and sanitized text
 */
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text?.trim();
  if (!text) throw new Error("Could not extract text from the uploaded PDF.");

  // Sanitize: remove control characters and characters that break JSON
  const clean = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ") // control characters
    .replace(/\\/g, " ")                                   // backslashes
    .replace(/"/g, "'")                                    // double quotes → single quotes
    .replace(/\s+/g, " ")                                  // collapse multiple spaces
    .trim();

  return clean;
}