import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";

export async function GET(req) {
  const session = await auth();
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const settingsUrl = `${baseUrl}/dashboard/crm/settings`;

  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(`${settingsUrl}?google=error`);
  }

  if (!session) {
    return NextResponse.redirect(`${settingsUrl}?google=error`);
  }

  try {
    const redirectUri = `${baseUrl}/api/integrations/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ID,
        client_secret: process.env.GOOGLE_SECRET,
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenRes.json();

    if (!tokens.access_token) {
      return NextResponse.redirect(`${settingsUrl}?google=error`);
    }

    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;

    await User.findByIdAndUpdate(session.user.id, {
      googleAccessToken: tokens.access_token,
      googleRefreshToken: tokens.refresh_token || undefined,
      googleTokenExpiry: tokens.expires_in
        ? Date.now() + tokens.expires_in * 1000
        : undefined,
      googleConnected: true,
    });

    return NextResponse.redirect(`${settingsUrl}?google=connected`);
  } catch {
    return NextResponse.redirect(`${settingsUrl}?google=error`);
  }
}
