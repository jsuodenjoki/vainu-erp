import { NextResponse } from "next/server";
import crypto from "crypto";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";
import { sendEmail } from "@/libs/resend";

export async function POST(req) {
  try {
    await connectMongo();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "email-required" }, { status: 400 });
    }

    // Always return success to prevent email enumeration
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user || !user.password) {
      return NextResponse.json({ success: true });
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = token;
    user.passwordResetExpires = expires;
    await user.save();

    const baseUrl = process.env.NEXTAUTH_URL || "https://vaiku-erp.vercel.app";
    const resetUrl = `${baseUrl}/auth/reset-password?token=${token}`;

    await sendEmail({
      to: email,
      subject: "Vaihda salasanasi – Vaiku",
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
          <img src="${baseUrl}/logo.png" alt="Vaiku" style="height: 40px; margin-bottom: 24px;" />
          <h2 style="color: #1e1b4b; margin-bottom: 8px;">Salasanan vaihto</h2>
          <p style="color: #4b5563; margin-bottom: 24px;">
            Saimme pyynnön vaihtaa Vaiku-tilisi salasana. Klikkaa alla olevaa linkkiä vaihtaaksesi salasanan.
            Linkki on voimassa 1 tunnin.
          </p>
          <a href="${resetUrl}"
             style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Vaihda salasana
          </a>
          <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
            Jos et pyytänyt salasanan vaihtoa, voit sivuuttaa tämän viestin. Tilisi pysyy suojattuna.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px;">Vaiku · vaiku.io</p>
        </div>
      `,
      text: `Salasanan vaihto\n\nKlikkaa linkkiä vaihtaaksesi salasanan (voimassa 1h):\n${resetUrl}\n\nJos et pyytänyt tätä, sivuuta viesti.`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "server-error" }, { status: 500 });
  }
}
