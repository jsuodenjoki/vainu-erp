import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    const { firstName, lastName, email, password } = await req.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "password-too-short" }, { status: 400 });
    }

    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "email-exists" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: `${firstName} ${lastName}`,
      email: email.toLowerCase(),
      password: hashed,
    });

    return NextResponse.json({ id: user._id.toString(), email: user.email, name: user.name }, { status: 201 });
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
