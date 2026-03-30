import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "missing-token" }, { status: 400 });
    }

    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "invalid-or-expired" }, { status: 400 });
    }

    user.emailVerified = new Date();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Verify email error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
