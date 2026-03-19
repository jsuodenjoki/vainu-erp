import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";
import "@/models/User";
import "@/models/crm/Contact";
import "@/models/crm/Deal";
import "@/models/crm/Company";

async function getModels() {
  await connectMongo();
  const Meeting = mongoose.models.CRMMeeting || (await import("@/models/crm/Meeting")).default;
  return { Meeting };
}

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { Meeting } = await getModels();
    const { searchParams } = new URL(req.url);
    const company = searchParams.get("company");
    const deal = searchParams.get("deal");
    const userId = searchParams.get("userId") || "";
    const limit = parseInt(searchParams.get("limit") || "50");

    const contact = searchParams.get("contact");

    const query = {};
    if (company) query.company = company;
    if (contact) query.contacts = contact;
    if (deal) query.deals = deal;
    if (userId) query.createdBy = userId;

    const meetings = await Meeting.find(query)
      .sort({ meetingDate: -1 })
      .limit(limit)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage amount")
      .populate("createdBy", "name")
      .lean();

    return NextResponse.json({ meetings });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { Meeting } = await getModels();
    const body = await req.json();

    const meeting = await Meeting.create({
      ...body,
      createdBy: session.user.id,
    });

    const populated = await Meeting.findById(meeting._id)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage amount")
      .populate("createdBy", "name")
      .lean();

    return NextResponse.json({ meeting: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
