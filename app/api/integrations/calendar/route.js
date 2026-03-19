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
  const query = searchParams.get("q") || "";
  const emailsParam = searchParams.get("emails") || "";

  try {
    await connectMongo();
    const User = mongoose.models.User || (await import("@/models/User")).default;
    const user = await User.findById(session.user.id).lean();

    if (!user?.googleConnected) {
      return NextResponse.json({ connected: false, events: [] });
    }

    const token = await getValidToken(user, User);

    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

    const fetchEvents = async (q) => {
      const params = new URLSearchParams({
        timeMin: oneYearAgo,
        maxResults: "20",
        orderBy: "startTime",
        singleEvents: "true",
        q,
      });
      const res = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.items || [];
    };

    let rawItems;
    if (emailsParam) {
      // Fetch per-email in parallel (finds events where each email is an attendee)
      const emailList = emailsParam.split(",").map(e => e.trim()).filter(Boolean);
      const results = await Promise.all(emailList.map(fetchEvents));
      // Deduplicate by event id
      const seen = new Set();
      rawItems = results.flat().filter(ev => {
        if (seen.has(ev.id)) return false;
        seen.add(ev.id);
        return true;
      });
    } else {
      rawItems = await fetchEvents(query);
    }

    const events = rawItems.map(ev => ({
      id: ev.id,
      summary: ev.summary || "(no title)",
      description: ev.description || "",
      start: ev.start?.dateTime || ev.start?.date,
      end: ev.end?.dateTime || ev.end?.date,
      location: ev.location || "",
      attendees: (ev.attendees || []).map(a => ({ email: a.email, name: a.displayName })),
      hangoutLink: ev.hangoutLink || "",
      htmlLink: ev.htmlLink || "",
    })).sort((a, b) => new Date(b.start) - new Date(a.start));

    return NextResponse.json({ connected: true, events });
  } catch (err) {
    if (err.message === "no-refresh-token" || err.message === "token-refresh-failed") {
      return NextResponse.json({ connected: false, events: [], error: "reconnect-required" });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
