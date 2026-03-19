import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

async function seed() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  try {
    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;

    const email = process.env.SEED_USER_EMAIL || "admin@vaiku.fi";
    const password = process.env.SEED_USER_PASSWORD || "Test1234!";

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ message: "Test user already exists", email, hint: "Login at /login" });
    }

    const hashed = await bcrypt.hash(password, 12);
    await User.create({ name: "Test Admin", email, password: hashed });

    return NextResponse.json({ message: "✅ Test user created!", email, password, hint: "Now login at /login" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() { return seed(); }
export async function POST() { return seed(); }
