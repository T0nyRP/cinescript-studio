import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { fileURLToPath } from "url";

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

    // Use the legacy build for Node.js
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

    // Point workerSrc to the bundled worker file on disk
    // In production (Vercel), use the CDN fallback
    const workerPath = path.join(
      process.cwd(),
      "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"
    );
    pdfjsLib.GlobalWorkerOptions.workerSrc = `file://${workerPath}`;

    const loadingTask = pdfjsLib.getDocument({
      data: uint8,
      useSystemFonts: true,
    });

    const pdf = await loadingTask.promise;
    const pages: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = content.items.map((item: any) => item.str ?? "").join(" ");
      pages.push(pageText);
    }

    const text = pages.join("\n\n");

    if (!text.trim()) {
      return NextResponse.json(
        { error: "No text could be extracted. The PDF may be image-based (scanned)." },
        { status: 422 }
      );
    }

    return NextResponse.json({ text, pages: pdf.numPages });
  } catch (err) {
    console.error("PDF parse error:", err);
    return NextResponse.json(
      { error: "Failed to parse PDF. Please try a different file." },
      { status: 500 }
    );
  }
}
