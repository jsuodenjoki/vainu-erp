import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Activity from "@/models/crm/Activity";
import Note from "@/models/crm/Note";
import "@/models/crm/Contact";

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
    if (contactId) filter.contact = contactId;
    if (dealId) filter.deal = dealId;
    if (userId) filter.createdBy = userId;

    const activities = await Activity.find(filter)
      .populate("createdBy", "name email image")
      .populate("contact", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ activities });
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

    const activity = await Activity.create({ ...body, createdBy: session.user.id });

    if (body.type === "note" && body.content) {
      await Note.create({
        content: body.content,
        company: body.company,
        contact: body.contact,
        deal: body.deal,
        createdBy: session.user.id,
      });
    }

    const populated = await Activity.findById(activity._id)
      .populate("createdBy", "name email image")
      .populate("contact", "firstName lastName")
      .lean();
    return NextResponse.json({ activity: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
