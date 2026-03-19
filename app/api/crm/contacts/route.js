import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Contact from "@/models/crm/Contact";
import "@/models/User";
import "@/models/crm/Company";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const companyId = searchParams.get("company") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const filter = {};
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: "i" } },
        { lastName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }
    if (companyId) filter.company = companyId;

    const [contacts, total] = await Promise.all([
      Contact.find(filter)
        .populate("company", "name domain")
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Contact.countDocuments(filter),
    ]);

    return NextResponse.json({ contacts, total });
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
    const contact = await Contact.create({ ...body, owner: session.user.id });
    return NextResponse.json({ contact }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
