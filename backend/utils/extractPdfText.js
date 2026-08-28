import { PDFParse } from "pdf-parse";

/**
 * Extracts plain text from a PDF buffer (from multer memory storage).
 * Uses pdf-parse v2 class-based API.
 *
 * @param {Buffer} buffer  - The PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
export async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  const text = result.text?.trim();
  if (!text) throw new Error("Could not extract text from the uploaded PDF.");
  return text;
}