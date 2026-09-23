import { NextResponse } from "next/server";
import { authenticateUser, getUserProfileById } from "@/lib/backend/db";

export async function POST(req) {
  try {
    const body = await req.json();
    const { email, password, quickRole } = body;

    // Tez Giriş (Demo One-Click Login)
    if (quickRole) {
      let targetId = "client-001";
      if (quickRole === "admin") targetId = "admin-001";
      if (quickRole === "realtor") targetId = "r1";
      const user = getUserProfileById(targetId);
      if (user) {
        const response = NextResponse.json({ success: true, user, profile: user });
        response.cookies.set("mulkera_user_id", user.id, {
          path: "/",
          httpOnly: false,
          maxAge: 60 * 60 * 24 * 30, // 30 gün
        });
        return response;
      }
    }

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email və şifrə daxil edilməlidir." }, { status: 400 });
    }

    const user = authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ success: false, message: "Email və ya şifrə yanlışdır." }, { status: 401 });
    }

    const response = NextResponse.json({ success: true, user, profile: user });
    response.cookies.set("mulkera_user_id", user.id, {
      path: "/",
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message || "Giriş zamanı xəta baş verdi." }, { status: 500 });
  }
}
