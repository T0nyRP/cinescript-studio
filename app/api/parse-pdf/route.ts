import { NextRequest, NextResponse } from "next/server";
import { extractText } from "unpdf";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    const { text, totalPages } = await extractText(uint8, { mergePages: true });

    if (!text?.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted. The PDF may be image-based (scanned)." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, pages: totalPages });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. Please try a different file." },
      { status: 500 }
    );
  }
}
