import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const noteSchema = new mongoose.Schema(
  {
    content: { type: String, required: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CRMCompany" },
    contact: { type: mongoose.Schema.Types.ObjectId, ref: "CRMContact" },
    deal: { type: mongoose.Schema.Types.ObjectId, ref: "CRMDeal" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

noteSchema.plugin(toJSON);

export default mongoose.models.CRMNote || mongoose.model("CRMNote", noteSchema);
