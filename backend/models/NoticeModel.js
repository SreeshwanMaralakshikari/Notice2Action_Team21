import mongoose from "mongoose";

// ── Sub-schemas ───────────────────────────────────────────────────────────────

/** Legacy deadline format — kept so old DB documents still load fine */
const deadlineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    date:  { type: String, required: true },
  },
  { _id: false }
);

/**
 * Rich eligibility item (Phase 4).
 * criterion: the category of requirement (e.g. "Minimum CGPA")
 * value:     the actual requirement (e.g. "7.5 or above")
 * source:    verbatim phrase from the notice
 * isMandatory: whether this is a hard requirement
 */
const eligibilityItemSchema = new mongoose.Schema(
  {
    criterion:   { type: String, default: "" },
    value:       { type: String, default: "" },
    source:      { type: String, default: "" },
    isMandatory: { type: Boolean, default: true },
  },
  { _id: false }
);

/**
 * Important date (Phase 4).
 * isDeadline: true → highlight in red/orange in the UI
 */
const importantDateSchema = new mongoose.Schema(
  {
    type:       { type: String, default: "" },   // "Application Deadline", "Exam Date", etc.
    date:       { type: String, default: "" },
    source:     { type: String, default: "" },
    isDeadline: { type: Boolean, default: false },
  },
  { _id: false }
);

/** Document required to apply (Phase 4) */
const documentSchema = new mongoose.Schema(
  {
    name:     { type: String, default: "" },
    required: { type: Boolean, default: true },
    source:   { type: String, default: "" },
  },
  { _id: false }
);

/** Action item with priority (Phase 4) */
const actionSchema = new mongoose.Schema(
  {
    title:       { type: String, default: "" },
    description: { type: String, default: "" },
    priority:    { type: String, default: "medium" }, // "high" | "medium" | "low"
    deadline:    { type: String, default: "" },
  },
  { _id: false }
);

/** Official link */
const linkSchema = new mongoose.Schema(
  {
    label: { type: String, default: "" },
    url:   { type: String, default: "" },
  },
  { _id: false }
);

/** Contact (email / phone / office) */
const contactSchema = new mongoose.Schema(
  {
    type:  { type: String, default: "" }, // "email" | "phone" | "office"
    value: { type: String, default: "" },
  },
  { _id: false }
);

/** Checklist item — now includes priority carried over from actions */
const checklistItemSchema = new mongoose.Schema(
  {
    task:     { type: String, required: true },
    done:     { type: Boolean, default: false },
    priority: { type: String, default: "medium" }, // "high" | "medium" | "low"
  },
  { _id: false }
);

// ── Main schema ───────────────────────────────────────────────────────────────

const noticeSchema = new mongoose.Schema(
  {
    // Core
    rawText:    { type: String, required: true },
    sourceType: { type: String, enum: ["PASTE", "PDF"], required: true },

    // Identity (Phase 4)
    title:        { type: String, default: "" },
    organization: { type: String, default: "" },

    // Category — widened enum covers both legacy and Phase 4 values
    category: {
      type: String,
      enum: [
        "Scholarship", "Internship", "Placement", "Examination",
        "Competition", "Workshop", "Event",
        "Academic Opportunity", "Government Opportunity", "General Notice",
        // Legacy values (kept so old docs still validate on re-save)
        "Exam", "Fee", "Hostel", "Other",
      ],
      default: "General Notice",
    },

    // Summary
    summary: { type: String, default: "" },

    // Eligibility — rich objects (Phase 4)
    eligibility:    { type: [eligibilityItemSchema],  default: [] },

    // Dates — new rich format (Phase 4)
    importantDates: { type: [importantDateSchema],    default: [] },
    // Legacy deadlines kept so old notices in DB still render
    deadlines:      { type: [deadlineSchema],         default: [] },

    // Documents, actions, links, contacts (Phase 4)
    documents:      { type: [documentSchema],         default: [] },
    actions:        { type: [actionSchema],            default: [] },
    links:          { type: [linkSchema],              default: [] },
    contacts:       { type: [contactSchema],           default: [] },

    // Checklist (priority added in Phase 4)
    checklist:      { type: [checklistItemSchema],    default: [] },

    // Warnings / ambiguities (Phase 4)
    uncertainties:  { type: [String],                 default: [] },
  },
  { versionKey: false, timestamps: true, strict: "throw" }
);

const NoticeModel = mongoose.model("Notice", noticeSchema);
export default NoticeModel;
