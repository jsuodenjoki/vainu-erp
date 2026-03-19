import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const { ObjectId } = mongoose.Schema.Types;

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    notes: { type: String },
    dueDate: { type: Date },
    status: {
      type: String,
      enum: ["not-started", "in-progress", "completed", "deferred"],
      default: "not-started",
    },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "task", "follow-up", "deadline"],
      default: "task",
    },
    assignedTo: { type: ObjectId, ref: "User" },
    company: { type: ObjectId, ref: "CRMCompany" },
    contacts: [{ type: ObjectId, ref: "CRMContact" }],
    deals: [{ type: ObjectId, ref: "CRMDeal" }],
    completedAt: { type: Date },
    workspace: { type: ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

taskSchema.plugin(toJSON);

export default mongoose.models.CRMTask || mongoose.model("CRMTask", taskSchema);
