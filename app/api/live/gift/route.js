import { NextResponse } from "next/server";
import { sendGiftToStream } from "@/lib/backend/db";

/**
 * POST /api/live/gift
 * İki realtorun canlıda bir-biri ilə rəqabət apardığı PK otağında
 * izləyicilərin hədiyyə göndərmə balansı, xal artımı və real-vaxt reytinq cədvəli.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));

    const {
      streamId,
      giftType = "key",
      senderName = "İzləyici",
      targetSide = "left"
    } = body;

    if (!streamId) {
      return NextResponse.json(
        { success: false, error: "streamId parametri tələb olunur." },
        { status: 400 }
      );
    }

    const result = sendGiftToStream(streamId, {
      giftType,
      senderName,
      targetSide
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "Canlı yayım otağı tapılmadı." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Hədiyyə (${result.gift.name}) uğurla ${targetSide === "left" ? "Sol" : "Sağ"} tərəfə göndərildi!`,
      data: result
    });
  } catch (error) {
    console.error("Hədiyyə göndərmə xətası:", error);
    return NextResponse.json(
      { success: false, error: "Hədiyyə göndərilərkən xəta baş verdi." },
      { status: 500 }
    );
  }
}
