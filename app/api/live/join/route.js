import { NextResponse } from "next/server";
import { joinLiveStreamSession } from "@/lib/backend/db";

/**
 * POST /api/live/join
 * İzləyicilərin və ya rəqib rieltorların canlı otağa WebRTC vasitəsilə qoşulması,
 * media server tokeni və otaq məlumatlarını təmin edir.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const { streamId, participantId, participantName, role = "viewer" } = body;

    if (!streamId) {
      return NextResponse.json(
        { success: false, error: "streamId parametri tələb olunur." },
        { status: 400 }
      );
    }

    const result = joinLiveStreamSession(streamId, {
      participantId,
      participantName,
      role
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Göstərilən canlı yayım sessiyası tapılmadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Canlı yayım otağına uğurla qoşuldunuz.",
      ...result
    });
  } catch (error) {
    console.error("Canlı yayıma qoşulma xətası:", error);
    return NextResponse.json(
      { success: false, error: "Yayıma qoşularkən xəta baş verdi." },
      { status: 500 }
    );
  }
}
