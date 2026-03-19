import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Deal from "@/models/crm/Deal";
import "@/models/User";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const companyId = searchParams.get("company") || "";

    const contactId = searchParams.get("contact") || "";
    const filter = {};
    if (search) filter.title = { $regex: search, $options: "i" };
    if (stage) filter.stage = stage;
    if (companyId) filter.company = companyId;
    if (contactId) filter.contacts = contactId;

    const deals = await Deal.find(filter)
      .populate("company", "name domain")
      .populate("contacts", "firstName lastName email")
      .populate("owner", "name email")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ deals });
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
    const deal = await Deal.create({ ...body, owner: session.user.id });
    const populated = await Deal.findById(deal._id)
      .populate("company", "name domain")
      .populate("contacts", "firstName lastName email")
      .populate("owner", "name email")
      .lean();
    return NextResponse.json({ deal: populated }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
