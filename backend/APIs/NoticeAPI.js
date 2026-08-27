import express from "express";
import multer from "multer";
import NoticeModel from "../models/NoticeModel.js";
import { extractPdfText } from "../utils/extractPdfText.js";
import { buildNoticePrompt } from "../utils/buildNoticePrompt.js";
import { model } from "../config/gemini.js";

const noticeApp = express.Router();

// Memory storage — no temp files written to disk
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────
// POST /notice-api/process
// Accepts: multipart/form-data with either
//   • field "text"  (paste mode)
//   • field "pdf"   (PDF upload mode)
// ─────────────────────────────────────────────
noticeApp.post("/process", upload.single("pdf"), async (req, res, next) => {
  try {
    let rawText = "";
    let sourceType = "PASTE";

    if (req.file) {
      // ── PDF upload path ──────────────────────
      rawText = await extractPdfText(req.file.buffer);
      sourceType = "PDF";
    } else if (req.body.text && req.body.text.trim()) {
      // ── Paste text path ──────────────────────
      rawText = req.body.text.trim();
      sourceType = "PASTE";
    } else {
      return res
        .status(400)
        .json({ message: "Please paste notice text or upload a PDF file." });
    }

    // Build prompt and call Gemini
    const prompt = buildNoticePrompt(rawText);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Gemini may wrap JSON in a markdown code fence — strip it
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Gemini did not return valid JSON.");
    const parsed = JSON.parse(jsonMatch[0]);

    // Save to MongoDB
    const notice = await NoticeModel.create({
      rawText,
      sourceType,
      summary: parsed.summary || "",
      deadlines: parsed.deadlines || [],
      eligibility: parsed.eligibility || [],
      checklist: (parsed.checklist || []).map((item) => ({
        task: typeof item === "string" ? item : item.task,
        done: false,
      })),
      category: parsed.category || "Other",
    });

    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// GET /notice-api/notice/:id
// Re-fetch a previously processed notice
// ─────────────────────────────────────────────
noticeApp.get("/notice/:id", async (req, res, next) => {
  try {
    const notice = await NoticeModel.findById(req.params.id);
    if (!notice)
      return res.status(404).json({ message: "Notice not found." });
    res.json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────
// PUT /notice-api/notice/:id/checklist
// Flip one checklist item's done flag
// Body: { index: Number, done: Boolean }
// ─────────────────────────────────────────────
noticeApp.put("/notice/:id/checklist", async (req, res, next) => {
  try {
    const { index, done } = req.body;
    const notice = await NoticeModel.findById(req.params.id);
    if (!notice)
      return res.status(404).json({ message: "Notice not found." });

    notice.checklist[index].done = done;
    notice.markModified("checklist");
    await notice.save();

    res.json(notice);
  } catch (err) {
    next(err);
  }
});

export default noticeApp;