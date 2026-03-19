import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/crm/Deal";
import "@/models/User";
import "@/models/crm/Contact";
import "@/models/crm/Company";

export async function GET(req, { params }) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await connectMongo();
    const { id } = await params;
    const deal = await Deal.findById(id)
      .populate("company", "name domain")
      .populate("contacts", "firstName lastName email jobTitle")
      .populate("owner", "name email")
      .lean();
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deal });
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
    const deal = await Deal.findByIdAndUpdate(id, body, { new: true })
      .populate("company", "name domain")
      .populate("contacts", "firstName lastName email jobTitle")
      .populate("owner", "name email")
      .lean();
    if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ deal });
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
    await Deal.findByIdAndDelete(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
