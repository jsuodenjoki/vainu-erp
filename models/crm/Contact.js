import mongoose from "mongoose";
import toJSON from "../plugins/toJSON";

const contactSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    mobilePhone: { type: String, trim: true },
    jobTitle: { type: String, trim: true },
    company: { type: mongoose.Schema.Types.ObjectId, ref: "CRMCompany" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    lifecycleStage: {
      type: String,
      enum: ["lead", "prospect", "customer", "other", ""],
      default: "lead",
    },
    linkedinUrl: { type: String },
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    notes: { type: String },
    tags: [{ type: String }],
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    // Email outreach (Instantly / cold email campaigns)
    outreachStatus: {
      type: String,
      enum: ["contacted", "bounced", "replied", "not_interested", "interested", "unsubscribed", ""],
      default: "",
    },
    outreachCampaign: { type: String, trim: true },
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

contactSchema.virtual("fullName").get(function () {
  return [this.firstName, this.lastName].filter(Boolean).join(" ");
});

contactSchema.plugin(toJSON);

export default mongoose.models.CRMContact || mongoose.model("CRMContact", contactSchema);
