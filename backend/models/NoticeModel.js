import mongoose from "mongoose";

const deadlineSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    date: { type: String, required: true },
  },
  { _id: false }
);

const checklistItemSchema = new mongoose.Schema(
  {
    task: { type: String, required: true },
    done: { type: Boolean, default: false },
  },
  { _id: false }
);

const noticeSchema = new mongoose.Schema(
  {
    rawText: { type: String, required: true },
    sourceType: { type: String, enum: ["PASTE", "PDF"], required: true },
    summary: { type: String, default: "" },
    deadlines: { type: [deadlineSchema], default: [] },
    eligibility: { type: [String], default: [] },
    checklist: { type: [checklistItemSchema], default: [] },
    category: {
      type: String,
      enum: ["Exam", "Fee", "Scholarship", "Hostel", "Event", "Other"],
      default: "Other",
    },
  },
  { versionKey: false, timestamps: true, strict: "throw" }
);

const NoticeModel = mongoose.model("Notice", noticeSchema);
export default NoticeModel;
