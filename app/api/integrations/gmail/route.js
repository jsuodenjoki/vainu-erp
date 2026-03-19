import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import connectMongo from "@/libs/mongoose";
import mongoose from "mongoose";

async function getValidToken(user, User) {
  const now = Date.now();
  if (user.googleTokenExpiry && user.googleTokenExpiry > now + 60000) {
    return user.googleAccessToken;
  }
  if (!user.googleRefreshToken) throw new Error("no-refresh-token");

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_ID,
      client_secret: process.env.GOOGLE_SECRET,
      refresh_token: user.googleRefreshToken,
      grant_type: "refresh_token",
    }),
  });

  const data = await res.json();
  if (!data.access_token) throw new Error("token-refresh-failed");

  const expiry = Date.now() + (data.expires_in || 3600) * 1000;
  await User.findByIdAndUpdate(user._id, {
    googleAccessToken: data.access_token,
    googleTokenExpiry: expiry,
  });

  return data.access_token;
}

export async function GET(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const emails = searchParams.get("emails") || "";

  if (!emails) return NextResponse.json({ messages: [] });

  try {
    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;
    const user = await User.findById(session.user.id).lean();

    if (!user?.googleConnected) {
      return NextResponse.json({ connected: false, messages: [] });
    }

    const token = await getValidToken(user, User);

    const emailList = emails.split(",").map(e => e.trim()).filter(Boolean);
    const query = emailList.map(e => `from:${e} OR to:${e}`).join(" OR ");

    const listRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!listRes.ok) {
      const err = await listRes.json();
      return NextResponse.json({ error: err.error?.message || "Gmail API error" }, { status: 400 });
    }

    const listData = await listRes.json();
    const messageIds = (listData.messages || []).slice(0, 10);

    const messages = await Promise.all(
      messageIds.map(async ({ id }) => {
        const msgRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (!msgRes.ok) return null;
        const msg = await msgRes.json();
        const headers = {};
        (msg.payload?.headers || []).forEach(h => { headers[h.name] = h.value; });
        return {
          id: msg.id,
          threadId: msg.threadId,
          snippet: msg.snippet,
          subject: headers["Subject"] || "(no subject)",
          from: headers["From"] || "",
          to: headers["To"] || "",
          date: headers["Date"] || "",
          labelIds: msg.labelIds || [],
        };
      })
    );

    return NextResponse.json({ connected: true, messages: messages.filter(Boolean) });
  } catch (err) {
    if (err.message === "no-refresh-token" || err.message === "token-refresh-failed") {
      return NextResponse.json({ connected: false, messages: [], error: "reconnect-required" });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
