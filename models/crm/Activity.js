import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const activitySchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["note", "email", "call", "meeting", "task", "deal", "company", "contact", "system"],
      required: true,
    },
    action: { type: String },
    content: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CRMCompany" },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "CRMContact" },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "CRMDeal" },
    task: { type: mongoose.Schema.Types.ObjectId, ref: "CRMTask" },
    call: { type: mongoose.Schema.Types.ObjectId, ref: "CRMCall" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    metadata: { type: mongoose.Schema.Types.Mixed },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

activitySchema.plugin(toJSON);

export default mongoose.models.CRMActivity || mongoose.model("CRMActivity", activitySchema);
