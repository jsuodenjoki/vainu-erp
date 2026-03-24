import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Contact from "@/models/crm/Contact";
import Company from "@/models/crm/Company";
import Activity from "@/models/crm/Activity";

const OUTREACH_STATUS_LABELS = {
  contacted:      "Lähetetty — ei vastausta",
  interested:     "Kiinnostunut ✅",
  not_interested: "Ei kiinnostunut",
  bounced:        "Ei toimitettu (bounce) ⚠️",
  replied:        "Vastannut 💬",
  unsubscribed:   "Peruuttanut tilauksen",
};

/**
 * Maps Instantly "Interest Status" column → CRM outreachStatus
 * "Lead"         = email sent, no reply    → "contacted"
 * "Interested"   = showed interest         → "interested"
 * "Not Interested"                         → "not_interested"
 * "Meeting Booked"                         → "interested"
 */
function mapOutreachStatusFromInterest(interestStatus) {
  if (!interestStatus) return "contacted";
  const s = interestStatus.toLowerCase().trim();
  if (s === "lead" || s === "") return "contacted";
  if (s.includes("not interested")) return "not_interested";
  if (s.includes("unsubscribed")) return "unsubscribed";
  if (s.includes("meeting booked") || s.includes("meeting scheduled")) return "interested";
  if (s.includes("interested")) return "interested";
  if (s.includes("replied") || s.includes("positive")) return "interested";
  return "contacted";
}

/**
 * Maps Instantly "Interest Status" → CRM lifecycleStage
 */
function mapLifecycleStage(interestStatus) {
  if (!interestStatus) return "lead";
  const s = interestStatus.toLowerCase().trim();
  if (s.includes("not interested") || s.includes("unsubscribed")) return "other";
  if (s.includes("meeting booked") || s.includes("meeting scheduled")) return "prospect";
  if (s.includes("interested")) return "prospect";
  return "lead";
}

/**
 * Override outreachStatus with "bounced" if Lead Status says Bounced
 */
function checkBounced(leadStatus) {
  return leadStatus?.toLowerCase().includes("bounced") ?? false;
}

/**
 * POST /api/crm/import
 * Body: { rows: Array<{
 *   "Campaign Name", "Email", "First Name", "Last Name",
 *   "jobTitle", "linkedIn", "companyName",
 *   "Lead Status", "Interest Status"
 * }> }
 */
export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectMongo();
    const { rows } = await req.json();

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "No rows provided" }, { status: 400 });
    }

    const ownerId = session.user.id;
    const companyCache = {}; // companyName.toLowerCase() → companyDoc._id
    const upgradedCompanies = new Set(); // track which companies got upgraded this batch
    let created = 0, updated = 0, skipped = 0;
    const errors = [];

    for (const row of rows) {
      const email = row["Email"]?.trim().toLowerCase();
      const firstName = row["First Name"]?.trim() || row["firstName"]?.trim();
      const lastName = row["Last Name"]?.trim() || row["lastName"]?.trim();

      // Skip rows without email or first name
      if (!email) { skipped++; continue; }
      if (!firstName) { skipped++; continue; }

      try {
        // --- Determine outreachStatus early so company creation can use it ---
        const campaignName = row["Campaign Name"]?.trim() || row["campaignName"]?.trim() || "";
        const interestStatus = row["Interest Status"] || row["interestStatus"] || "";
        const leadStatus = row["Lead Status"] || row["leadStatus"] || "";
        const lifecycleStage = mapLifecycleStage(interestStatus);
        const outreachStatus = checkBounced(leadStatus)
          ? "bounced"
          : mapOutreachStatusFromInterest(interestStatus);
        const isInterested = outreachStatus === "interested";

        // --- Company: find or create ---
        let companyId = null;
        const rawCompanyName = row["companyName"]?.trim() || row["Company Name"]?.trim();
        if (rawCompanyName) {
          const key = rawCompanyName.toLowerCase();
          if (companyCache[key]) {
            companyId = companyCache[key];
          } else {
            const existing = await Company.findOne({
              name: { $regex: `^${rawCompanyName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
            }).lean();
            if (existing) {
              companyId = existing._id;
            } else {
              const newCompany = await Company.create({
                name: rawCompanyName,
                lifecycleStage: isInterested ? "opportunity" : "lead",
                owner: ownerId,
              });
              companyId = newCompany._id;
              if (isInterested) upgradedCompanies.add(companyId.toString());
            }
            companyCache[key] = companyId;
          }

          // Upgrade company to opportunity if any contact is interested
          // Never downgrade from customer/evangelist
          if (isInterested && companyId && !upgradedCompanies.has(companyId.toString())) {
            await Company.updateOne(
              { _id: companyId, lifecycleStage: { $nin: ["customer", "evangelist"] } },
              { $set: { lifecycleStage: "opportunity" } }
            );
            upgradedCompanies.add(companyId.toString());
          }
        }

        // --- Contact: upsert by email ---
        const linkedinUrl = row["linkedIn"]?.trim() || row["linkedinUrl"]?.trim() || "";
        const jobTitle = row["jobTitle"]?.trim() || row["Job Title"]?.trim() || "";

        const updateData = {
          firstName,
          ...(lastName ? { lastName } : {}),
          ...(jobTitle ? { jobTitle } : {}),
          ...(linkedinUrl ? { linkedinUrl } : {}),
          ...(companyId ? { company: companyId } : {}),
          lifecycleStage,
          outreachStatus,
          ...(campaignName ? { outreachCampaign: campaignName } : {}),
          owner: ownerId,
        };

        // Add campaign name as tag (won't duplicate)
        if (campaignName) {
          updateData.$addToSet = { tags: campaignName };
        }

        let contactId;
        const existing = await Contact.findOne({ email });
        if (existing) {
          await Contact.findByIdAndUpdate(existing._id, {
            $set: { ...updateData },
            ...(campaignName ? { $addToSet: { tags: campaignName } } : {}),
          });
          contactId = existing._id;
          updated++;
        } else {
          const newContact = await Contact.create({
            ...updateData,
            email,
            tags: campaignName ? [campaignName] : [],
          });
          contactId = newContact._id;
          created++;
        }

        // --- Activity: upsert by (contact + campaignName) so re-imports update, not duplicate ---
        const statusLabel = OUTREACH_STATUS_LABELS[outreachStatus] || outreachStatus;
        const activityContent = [
          campaignName ? `Kampanja: "${campaignName}"` : null,
          `Status: ${statusLabel}`,
        ].filter(Boolean).join("\n");

        const activityFilter = {
          type: "email",
          contact: contactId,
          "metadata.source": "instantly",
          ...(campaignName ? { "metadata.campaignName": campaignName } : {}),
        };
        await Activity.findOneAndUpdate(
          activityFilter,
          {
            $set: {
              content: activityContent,
              ...(companyId ? { company: companyId } : {}),
              createdBy: ownerId,
              metadata: { source: "instantly", campaignName, outreachStatus },
            },
          },
          { upsert: true }
        );
      } catch (rowErr) {
        errors.push({ email, error: rowErr.message });
        skipped++;
      }
    }

    return NextResponse.json({ created, updated, skipped, errors });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
