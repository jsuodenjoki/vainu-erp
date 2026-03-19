import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const { ObjectId } = mongoose.Schema.Types;

const callSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    callDate: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 },
    direction: { type: String, enum: ["inbound", "outbound"], default: "outbound" },
    outcome: {
      type: String,
      enum: ["connected", "left-voicemail", "no-answer", "busy", "wrong-number", ""],
      default: "",
    },
    notes: { type: String },
    company: { type: ObjectId, ref: "CRMCompany" },
    contacts: [{ type: ObjectId, ref: "CRMContact" }],
    deals: [{ type: ObjectId, ref: "CRMDeal" }],
    createdBy: { type: ObjectId, ref: "User" },
    workspace: { type: ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

callSchema.plugin(toJSON);

export default mongoose.models.CRMCall || mongoose.model("CRMCall", callSchema);
