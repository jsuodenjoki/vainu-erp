import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";

const SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/calendar.readonly",
].join(" ");

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GOOGLE_ID || !process.env.GOOGLE_SECRET) {
    return NextResponse.json(
      { error: "GOOGLE_ID and GOOGLE_SECRET must be set in .env.local" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const redirectUri = `${baseUrl}/api/integrations/google/callback`;

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_ID,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: session.user.id,
  });

  const url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  return NextResponse.redirect(url);
}
