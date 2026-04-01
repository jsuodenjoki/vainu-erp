import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

export async function POST(req) {
  try {
    await connectMongo();
    const { token, password } = await req.json();

    if (!token || !password) {
      return NextResponse.json({ error: "missing-fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "password-too-short" }, { status: 400 });
    }

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "invalid-or-expired" }, { status: 400 });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
