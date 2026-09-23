import { NextResponse } from "next/server";
import { getUserProfileById } from "@/lib/backend/db";

export async function GET(req) {
  try {
    const userIdCookie = req.cookies.get("mulkera_user_id");
    let userId = userIdCookie?.value;

    // Header və ya query parametrindən də yoxlayaq
    if (!userId) {
      userId = req.headers.get("x-user-id");
    }

    if (!userId) {
      return NextResponse.json({ user: null, profile: null });
    }

    const user = getUserProfileById(userId);
    return NextResponse.json({ user: user || null, profile: user || null });
  } catch (err) {
    return NextResponse.json({ user: null, profile: null });
  }
}
