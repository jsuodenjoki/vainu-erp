import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";
import crypto from "crypto";
import { sendEmail } from "@/libs/resend";

export async function POST(req) {
  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "missing-email" }, { status: 400 });

    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;

    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to avoid email enumeration
    if (!user || user.emailVerified) {
      return NextResponse.json({ success: true });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verifyUrl = `${baseUrl}/auth/verify-email?token=${token}`;
    const firstName = user.name?.split(" ")[0] || "";

    await sendEmail({
      to: email,
      subject: "Vahvista sähköpostiosoitteesi – Vaiku",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px; color: #1f2937;">
          <h1 style="font-size: 22px; font-weight: 700; margin-bottom: 8px; color: #4f46e5;">Vaiku</h1>
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 8px;">Vahvistusviesti uudelleen</h2>
          <p style="font-size: 15px; color: #4b5563; margin-bottom: 28px;">
            Klikkaa alla olevaa nappia vahvistaaksesi sähköpostiosoitteesi.
            Linkki on voimassa 24 tuntia.
          </p>
          <a href="${verifyUrl}"
            style="display: inline-block; background-color: #4f46e5; color: #ffffff; font-size: 15px;
                   font-weight: 600; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
            Vahvista sähköposti
          </a>
          <p style="font-size: 13px; color: #9ca3af; margin-top: 28px;">
            Tai kopioi tämä osoite selaimeesi: <span style="color:#6b7280;">${verifyUrl}</span>
          </p>
        </div>
      `,
      text: `Vahvista sähköpostiosoitteesi:\n${verifyUrl}\n\nLinkki on voimassa 24 tuntia.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Resend verification error:", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
