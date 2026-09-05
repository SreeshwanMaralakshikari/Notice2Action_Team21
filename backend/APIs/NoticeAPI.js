import express from "express";
import multer from "multer";
import NoticeModel from "../models/NoticeModel.js";
import { extractPdfText } from "../utils/extractPdfText.js";
import { buildNoticePrompt } from "../utils/buildNoticePrompt.js";
import { buildChatPrompt } from "../utils/buildChatPrompt.js";
import { generateText } from "../config/groq.js";

const noticeApp = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB — matches the UI's stated limit
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /notice-api/process
// ─────────────────────────────────────────────────────────────────────────────
noticeApp.post("/process", upload.single("pdf"), async (req, res, next) => {
  try {
    let rawText = "";
    let sourceType = "PASTE";

    if (req.file) {
      rawText = await extractPdfText(req.file.buffer);
      sourceType = "PDF";
    } else if (req.body.text && req.body.text.trim()) {
      rawText = req.body.text.trim();
      sourceType = "PASTE";
    } else {
      return res.status(400).json({ message: "Please paste notice text or upload a PDF file." });
    }

    const prompt = buildNoticePrompt(rawText);
    const responseText = await generateText(prompt);

    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("AI did not return valid JSON. Please try again.");
    const parsed = JSON.parse(jsonMatch[0]);

    const safeArr = (v) => (Array.isArray(v) ? v : []);

    const checklist = safeArr(parsed.actions).map((a) => ({
      task: a.title && a.description ? `${a.title}: ${a.description}` : (a.title || a.description || ""),
      done: false,
      priority: a.priority || "medium",
    }));

    const notice = await NoticeModel.create({
      rawText,
      sourceType,
      title:        parsed.title        || "",
      organization: parsed.organization || "",
      category:     parsed.category     || "General Notice",
      summary:      parsed.summary      || "",
      eligibility: safeArr(parsed.eligibility).map((e) => ({
        criterion:   e.criterion   || "",
        value:       e.value       || "",
        source:      e.source      || "",
        isMandatory: e.isMandatory !== false,
      })),
      importantDates: safeArr(parsed.importantDates).map((d) => ({
        type:       d.type       || "",
        date:       d.date       || "",
        source:     d.source     || "",
        isDeadline: d.isDeadline !== false,
      })),
      documents: safeArr(parsed.documents).map((d) => ({
        name:     d.name     || "",
        required: d.required !== false,
        source:   d.source   || "",
      })),
      actions: safeArr(parsed.actions).map((a) => ({
        title:       a.title       || "",
        description: a.description || "",
        priority:    a.priority    || "medium",
        deadline:    a.deadline    || "",
      })),
      links: safeArr(parsed.links).map((l) => ({
        label: l.label || "",
        url:   l.url   || "",
      })),
      contacts: safeArr(parsed.contacts).map((c) => ({
        type:  c.type  || "",
        value: c.value || "",
      })),
      checklist,
      uncertainties: safeArr(parsed.uncertainties).filter(Boolean),
      deadlines: [],
    });

    res.status(201).json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /notice-api/notice/:id
// ─────────────────────────────────────────────────────────────────────────────
noticeApp.get("/notice/:id", async (req, res, next) => {
  try {
    const notice = await NoticeModel.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found." });
    res.json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /notice-api/notice/:id/checklist
// ─────────────────────────────────────────────────────────────────────────────
noticeApp.put("/notice/:id/checklist", async (req, res, next) => {
  try {
    const { index, done } = req.body;
    if (typeof index !== "number" && typeof index !== "string") {
      return res.status(400).json({ message: "index is required." });
    }
    const notice = await NoticeModel.findById(req.params.id);
    if (!notice) return res.status(404).json({ message: "Notice not found." });

    const idx = Number(index);
    if (idx < 0 || idx >= notice.checklist.length) {
      return res.status(400).json({ message: "Checklist index out of range." });
    }

    notice.checklist[idx].done = done;
    notice.markModified("checklist");
    await notice.save();

    res.json(notice);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /notice-api/notice/:id/chat
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
      chatHistory: history.slice(-6),
    });

    const reply = (await generateText(prompt))?.trim() || "I couldn't generate a response. Please try again.";

    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
});

export default noticeApp;
