import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Call from "@/models/crm/Call";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const companyId = searchParams.get("company") || "";
    const contactId = searchParams.get("contact") || "";
    const dealId = searchParams.get("deal") || "";
    const userId = searchParams.get("userId") || "";

    const filter = {};
    if (companyId) filter.company = companyId;
    if (contactId) filter.contacts = contactId;   // array field: matches if contactId is in array
    if (dealId) filter.deals = dealId;
    if (userId) filter.createdBy = userId;

    const calls = await Call.find(filter)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage")
      .populate("createdBy", "name email")
      .sort({ callDate: -1 })
      .lean();

    return NextResponse.json({ calls });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const body = await req.json();
    const call = await Call.create({ ...body, createdBy: session.user.id });
    const populated = await Call.findById(call._id)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage")
      .populate("createdBy", "name email")
      .lean();
    return NextResponse.json({ call: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
