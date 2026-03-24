import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Activity from "@/models/crm/Activity";

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const { id } = await params;
    await Activity.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
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
    const activity = await Activity.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!activity) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ activity });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
