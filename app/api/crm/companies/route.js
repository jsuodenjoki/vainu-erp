import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import Company from "@/models/crm/Company";
import "@/models/User";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectMongo();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const stage = searchParams.get("stage") || "";
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const filter = {};
    if (search) filter.name = { $regex: search, $options: "i" };
    if (stage) filter.lifecycleStage = stage;

    const [companies, total] = await Promise.all([
      Company.find(filter)
        .populate("owner", "name email")
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      Company.countDocuments(filter),
    ]);

    return NextResponse.json({ companies, total });
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
    const company = await Company.create({ ...body, owner: session.user.id });
    return NextResponse.json({ company }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
