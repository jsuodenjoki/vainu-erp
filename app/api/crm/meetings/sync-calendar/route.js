import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Meeting from "@/models/crm/Meeting";
import "@/models/User";
import "@/models/crm/Contact";
import "@/models/crm/Deal";
import "@/models/crm/Company";

/**
 * POST /api/crm/meetings/sync-calendar
 * Body: { company: string, events: GoogleCalendarEvent[] }
 *
 * Upserts Google Calendar events as CRM meetings (keyed by googleEventId).
 * Only sets title/date/location/source on creation — never overwrites
 * user-edited fields (contacts, deals, notes, subtype, outcome) on subsequent syncs.
 */
export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectMongo();
    const { company, contactId, events = [] } = await req.json();
    if (!Array.isArray(events)) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const upserted = await Promise.all(
      events.map(async (ev) => {
        const googleEventId = ev.id;
        if (!googleEventId) return null;

        // Always keep meetingDate and title in sync with Google Calendar
        const setAlways = {
          meetingDate: new Date(ev.start),
          title: ev.summary || "Google Calendar -tapahtuma",
        };

        // Only set these fields on insert — never overwrite user-edited fields on subsequent syncs
        const setOnInsert = {
          location: ev.location || "",
          type: "video",
          subtype: "other",
          outcome: "scheduled",
          notes: ev.description || "",
          deals: [],
          source: "google",
          ...(company ? { company } : {}),
        };

        // Filter: match by googleEventId + company (or no company if not provided)
        const filter = { googleEventId };
        if (company) filter.company = company;

        // Build update: always sync date/title, ensure contactId is in contacts array
        const update = { $set: setAlways, $setOnInsert: setOnInsert };
        if (contactId) update.$addToSet = { contacts: contactId };

        const doc = await Meeting.findOneAndUpdate(
          filter,
          update,
          { upsert: true, new: true }
        )
          .populate("contacts", "firstName lastName email")
          .populate("deals", "title stage amount")
          .lean();

        return doc;
      })
    );

    const meetings = upserted.filter(Boolean);
    return NextResponse.json({ meetings });
  } catch (err) {
    console.error("sync-calendar error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
