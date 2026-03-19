import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";

async function getModel() {
  await connectMongo();
  return mongoose.models.CRMMeeting || (await import("@/models/crm/Meeting")).default;
}

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const Meeting = await getModel();
    const { id } = await params;
    const meeting = await Meeting.findById(id)
      .populate("company", "name")
      .populate("contacts", "firstName lastName email jobTitle")
      .populate("deals", "title stage amount")
      .populate("createdBy", "name")
      .lean();
    if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const Meeting = await getModel();
    const { id } = await params;
    const body = await req.json();

    const meeting = await Meeting.findByIdAndUpdate(id, body, { new: true })
      .populate("company", "name")
      .populate("contacts", "firstName lastName email")
      .populate("deals", "title stage amount")
      .lean();

    if (!meeting) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ meeting });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const Meeting = await getModel();
    const { id } = await params;
    await Meeting.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
