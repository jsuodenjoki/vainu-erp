import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Call from "@/models/crm/Call";
import "@/models/crm/Contact";
import "@/models/crm/Company";
import "@/models/crm/Deal";
import "@/models/User";

export async function PUT(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const { id } = await params;
    const body = await req.json();
    const call = await Call.findByIdAndUpdate(id, body, { new: true }).lean();
    if (!call) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ call });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const { id } = await params;
    await Call.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
