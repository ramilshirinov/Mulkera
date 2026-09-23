import { NextResponse } from "next/server";
import {
  getLiveStreams,
  getLiveStreamById,
  sendGiftToStream,
  addStreamComment,
  votePkStream,
  createLiveStream
} from "@/lib/backend/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (id) {
      const stream = getLiveStreamById(id);
      if (!stream) {
        return NextResponse.json({ success: false, message: "Canlı yayım tapılmadı" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: stream });
    }

    const streams = getLiveStreams();
    return NextResponse.json({ success: true, data: streams });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { action, streamId, ...payload } = body;

    if (action === "create") {
      const newStream = createLiveStream(payload);
      return NextResponse.json({ success: true, data: newStream });
    }

    if (!streamId) {
      return NextResponse.json({ success: false, message: "Canlı yayım ID tələb olunur" }, { status: 400 });
    }

    if (action === "gift") {
      const result = sendGiftToStream(streamId, payload);
      if (!result) return NextResponse.json({ success: false, message: "Yayım tapılmadı" }, { status: 404 });
      return NextResponse.json({ success: true, data: result });
    }

    if (action === "comment") {
      const comment = addStreamComment(streamId, payload);
      if (!comment) return NextResponse.json({ success: false, message: "Yayım tapılmadı" }, { status: 404 });
      return NextResponse.json({ success: true, data: comment });
    }

    if (action === "vote") {
      const updated = votePkStream(streamId, payload.side || "left");
      if (!updated) return NextResponse.json({ success: false, message: "Yayım tapılmadı" }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, message: "Bilinməyən əməliyyat" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
