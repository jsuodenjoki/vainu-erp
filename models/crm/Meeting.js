import mongoose from "mongoose";

const { ObjectId } = mongoose.Schema.Types;

const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    meetingDate: { type: Date, required: true },
    duration: { type: Number, default: 0 },
    location: { type: String, default: "" },
    // Modality: how the meeting takes place
    type: { type: String, enum: ["in-person", "video", "phone"], default: "in-person" },
    // Subtype: what kind of meeting it is
    subtype: {
      type: String,
      enum: ["first-meeting", "discovery", "demo", "follow-up", "decision", "other"],
      default: "other",
    },
    // Outcome / status
    outcome: {
      type: String,
      enum: ["scheduled", "completed", "no-show", "cancelled", "rescheduled", ""],
      default: "scheduled",
    },
    notes: { type: String, default: "" },
    company: { type: ObjectId, ref: "CRMCompany" },
    contacts: [{ type: ObjectId, ref: "CRMContact" }],
    deals: [{ type: ObjectId, ref: "CRMDeal" }],
    createdBy: { type: ObjectId, ref: "User" },
    // Google Calendar sync
    googleEventId: { type: String, default: null },
    source: { type: String, enum: ["crm", "google"], default: "crm" },
  },
  { timestamps: true }
);

export default mongoose.models.CRMMeeting ||
  mongoose.model("CRMMeeting", MeetingSchema);
