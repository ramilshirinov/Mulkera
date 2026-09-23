import { NextResponse } from "next/server";
import { startLiveStreamSession } from "@/lib/backend/db";

/**
 * POST /api/live/start
 * Realtorların sayt üzərindən canlı yayım və ya PK Arenası açması üçün
 * WebRTC / Media Server (Agora, LiveKit, SFU uyğun) inteqrasiyası və otaq yaradılması.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      hostId = "r1",
      title = "Canlı Əmlak Təqdimatı & PK Arenası",
      description = "MÜLKERA Canlı Yayım sessiyası",
      isPk = true,
      rivalId,
      leftPropertyId,
      rightPropertyId
    } = body;

    const stream = startLiveStreamSession({
      hostId,
      title,
      description,
      isPk,
      rivalId,
      leftPropertyId,
      rightPropertyId
    });

    return NextResponse.json({
      success: true,
      message: "Canlı yayım otağı uğurla başladıldı və WebRTC kanalı aktivdir.",
      streamId: stream.id,
      roomName: stream.webrtc.room_name,
      webrtc: stream.webrtc,
      stream
    });
  } catch (error) {
    console.error("Canlı yayım başlatma xətası:", error);
    return NextResponse.json(
      { success: false, error: "Canlı yayım sessiyasını başladarkən xəta baş verdi." },
      { status: 500 }
    );
  }
}
