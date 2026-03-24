import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const DEAL_STAGES = [
  "appointment-scheduled",
  "follow-up",
  "waiting-offer",
  "offer-sent",
  "contract-sent",
  "closed-won",
  "closed-lost",
];

const dealSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    amount: { type: Number, default: 0 },
    currency: { type: String, default: "EUR" },
    stage: {
      type: String,
      enum: DEAL_STAGES,
      default: "appointment-scheduled",
    },
    closeDate: { type: Date },
    probability: { type: Number, min: 0, max: 100, default: 0 },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CRMCompany" },
    contacts: [{ type: mongoose.Schema.Types.ObjectId, ref: "CRMContact" }],
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: { type: String },
    lostReason: { type: String },
    tags: [{ type: String }],
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

dealSchema.plugin(toJSON);

export { DEAL_STAGES };
export default mongoose.models.CRMDeal || mongoose.model("CRMDeal", dealSchema);
