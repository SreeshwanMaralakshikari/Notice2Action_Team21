import express from "express";
import multer from "multer";
import NoticeModel from "../models/NoticeModel.js";
import { extractPdfText } from "../utils/extractPdfText.js";
import { buildNoticePrompt } from "../utils/buildNoticePrompt.js";
import { buildChatPrompt } from "../utils/buildChatPrompt.js";
import { model } from "../config/gemini.js";

const noticeApp = express.Router();

// Memory storage — no temp files written to disk
const upload = multer({ storage: multer.memoryStorage() });

// ─────────────────────────────────────────────────────────────────────────────
// POST /notice-api/process
// Accepts: multipart/form-data with either
//   • field "text"  (paste mode)
//   • field "pdf"   (PDF upload mode)
// ─────────────────────────────────────────────────────────────────────────────
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

    // ── Helper: safe array ────────────────────
    const safeArr = (v) => (Array.isArray(v) ? v : []);

    // ── Map checklist: one item per action, carry priority ──
    const checklist = safeArr(parsed.actions).map((a) => ({
      task:     a.title && a.description
                  ? `${a.title}: ${a.description}`
                  : (a.title || a.description || ""),
      done:     false,
      priority: a.priority || "medium",
    }));

    // ── Save to MongoDB ────────────────────────
    const notice = await NoticeModel.create({
      rawText,
      sourceType,

      // Identity
      title:        parsed.title        || "",
      organization: parsed.organization || "",
      category:     parsed.category     || "General Notice",

      // Summary
      summary: parsed.summary || "",

      // Eligibility — rich objects
      eligibility: safeArr(parsed.eligibility).map((e) => ({
        criterion:   e.criterion   || "",
        value:       e.value       || "",
        source:      e.source      || "",
        isMandatory: e.isMandatory !== false, // default true
      })),

      // Important dates
      importantDates: safeArr(parsed.importantDates).map((d) => ({
        type:       d.type       || "",
        date:       d.date       || "",
        source:     d.source     || "",
        isDeadline: d.isDeadline !== false, // default true
      })),

      // Documents
      documents: safeArr(parsed.documents).map((d) => ({
        name:     d.name     || "",
        required: d.required !== false,
        source:   d.source   || "",
      })),

      // Actions
      actions: safeArr(parsed.actions).map((a) => ({
        title:       a.title       || "",
        description: a.description || "",
        priority:    a.priority    || "medium",
        deadline:    a.deadline    || "",
      })),

      // Links & contacts
      links: safeArr(parsed.links).map((l) => ({
        label: l.label || "",
        url:   l.url   || "",
      })),
      contacts: safeArr(parsed.contacts).map((c) => ({
        type:  c.type  || "",
        value: c.value || "",
      })),

      // Checklist (generated from actions)
      checklist,

      // Uncertainties
      uncertainties: safeArr(parsed.uncertainties).filter(Boolean),

      // Legacy deadlines field left empty — UI falls back to importantDates
      deadlines: [],
    });

    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /notice-api/notice/:id
// Re-fetch a previously processed notice
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notice-api/notice/:id/checklist
// Flip one checklist item's done flag
// Body: { index: Number, done: Boolean }
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /notice-api/notice/:id/chat
// "Ask This Notice" chatbot — grounded strictly in the notice's text.
// Body: { message: String, history: [{role, content}], studentProfile?: Object }
// ─────────────────────────────────────────────────────────────────────────────
noticeApp.post("/notice/:id/chat", async (req, res, next) => {
  try {
    const { message, history = [], studentProfile = null } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ success: false, message: "Message is required." });
    }

    const notice = await NoticeModel.findById(req.params.id);
    if (!notice) {
      return res.status(404).json({ success: false, message: "Notice not found." });
    }

    if (!model) {
      // Gemini not configured — return a polite fallback
      return res.json({
        success: true,
        data: {
          reply:
            "The AI assistant is not configured on this server. " +
            "Please check your GEMINI_API_KEY environment variable.",
        },
      });
    }

    const prompt = buildChatPrompt({
      noticeText: notice.rawText,
      noticeMetadata: {
        title:          notice.title,
        organization:   notice.organization,
        category:       notice.category,
        summary:        notice.summary,
        eligibility:    notice.eligibility,
        importantDates: notice.importantDates,
        documents:      notice.documents,
        actions:        notice.actions,
        contacts:       notice.contacts,
        links:          notice.links,
      },
      studentProfile,
      userMessage: message.trim(),
      chatHistory: history.slice(-6), // keep last 6 turns to stay within context limits
    });

    const result = await model.generateContent(prompt);
    const reply  = result.response?.text()?.trim() ||
                   "I couldn't generate a response. Please try again.";

    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
});

export default noticeApp;
