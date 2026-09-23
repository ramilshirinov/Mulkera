import { NextResponse } from "next/server";
import { registerNewUser } from "@/lib/backend/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, fullName, phone, role, agencyName, commissionRate, legalStatus } = body;

    if (!email || !password || !fullName) {
      return NextResponse.json({ success: false, message: "Bütün məcburi xanaları doldurun." }, { status: 400 });
    }

    const user = registerNewUser({
      email,
      password,
      fullName,
      phone,
      role,
      agencyName,
      commissionRate,
      legalStatus,
    });

    const response = NextResponse.json({ success: true, user, profile: user });
    response.cookies.set("mulkera_user_id", user.id, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || "Qeydiyyat zamanı xəta baş verdi." }, { status: 400 });
  }
}
