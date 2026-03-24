import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const companySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    domain: { type: String, trim: true, lowercase: true },
    website: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    industry: { type: String },
    size: {
      type: String,
      enum: ["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+", ""],
    },
    annualRevenue: { type: Number },
    description: { type: String },
    lifecycleStage: {
      type: String,
      enum: ["lead", "prospect", "opportunity", "customer", "evangelist", "other", ""],
      default: "lead",
    },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    tags: [{ type: String }],
    linkedinUrl: { type: String },
    businessId: { type: String, trim: true }, // Y-tunnus / Business ID
    notes: { type: String },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

companySchema.plugin(toJSON);

export default mongoose.models.CRMCompany || mongoose.model("CRMCompany", companySchema);
