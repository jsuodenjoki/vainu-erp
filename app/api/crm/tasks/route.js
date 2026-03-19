import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Task from "@/models/crm/Task";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const companyId = searchParams.get("company") || "";
    const contactId = searchParams.get("contact") || "";
    const dealId = searchParams.get("deal") || "";
    const userId = searchParams.get("userId") || "";

    const filter = {};
    if (status) filter.status = status;
    if (companyId) filter.company = companyId;
    if (contactId) filter.contacts = contactId;
    if (dealId) filter.deals = dealId;
    if (userId) filter.assignedTo = userId;

    const tasks = await Task.find(filter)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage")
      .populate("assignedTo", "name email")
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({ tasks });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const body = await req.json();
    const task = await Task.create({ ...body, workspace: session.user.id });
    const populated = await Task.findById(task._id)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage")
      .populate("assignedTo", "name email")
      .lean();
    return NextResponse.json({ task: populated }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
