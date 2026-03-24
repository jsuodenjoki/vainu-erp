import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Company from "@/models/crm/Company";
import Contact from "@/models/crm/Contact";
import Deal from "@/models/crm/Deal";
import "@/models/User";
import Task from "@/models/crm/Task";
import Activity from "@/models/crm/Activity";
import Meeting from "@/models/crm/Meeting";
import Call from "@/models/crm/Call";

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { id } = await params;

    const [company, contacts, deals, tasks, activities, meetings, calls] = await Promise.all([
      Company.findById(id).populate("owner", "name email").lean(),
      Contact.find({ company: id }).sort({ createdAt: -1 }).lean(),
      Deal.find({ company: id }).populate("owner", "name email").sort({ createdAt: -1 }).lean(),
      Task.find({ company: id }).populate("assignedTo", "name email").sort({ dueDate: 1 }).lean(),
      Activity.find({ company: id }).populate("createdBy", "name email").populate("contact", "firstName lastName").sort({ createdAt: -1 }).limit(50).lean(),
      Meeting.find({ company: id })
        .populate("contacts", "firstName lastName email")
        .populate("deals", "title stage amount")
        .sort({ meetingDate: -1 }).lean(),
      Call.find({ company: id })
        .populate("contacts", "firstName lastName email")
        .populate("deals", "title stage")
        .populate("createdBy", "name email")
        .sort({ callDate: -1 })
        .lean(),
    ]);

    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ company, contacts, deals, tasks, activities, meetings, calls });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { id } = await params;
    const body = await req.json();

    const company = await Company.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!company) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ company });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { id } = await params;
    await Company.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
