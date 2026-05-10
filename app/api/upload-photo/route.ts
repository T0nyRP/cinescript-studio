import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const runtime = "nodejs"
export const maxDuration = 30

/**
 * POST /api/upload-photo
 * Accepts { dataUrl: "data:image/jpeg;base64,..." , fileName?: string }
 * Uploads to Supabase Storage → returns { url: "https://..." }
 *
 * Creates the bucket automatically if it doesn't exist yet.
 */
export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY  // needed for storage admin ops
  const anonKey     = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Use service role if available (allows bucket creation), fall back to anon
  const key = serviceKey || anonKey
  if (!supabaseUrl || !key) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
  }

  let dataUrl = ""
  let fileName = ""
  try {
    const body = await request.json() as { dataUrl: string; fileName?: string }
    dataUrl  = body.dataUrl ?? ""
    fileName = body.fileName ?? `photo-${Date.now()}.jpg`
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!dataUrl.startsWith("data:image/")) {
    return NextResponse.json({ error: "dataUrl must be a base64 image" }, { status: 400 })
  }

  // Strip the data URL header to get raw base64
  const base64 = dataUrl.split(",")[1]
  if (!base64) return NextResponse.json({ error: "Could not parse base64 data" }, { status: 400 })

  // Detect MIME type
  const mimeMatch = dataUrl.match(/^data:(image\/[a-z]+);base64,/)
  const contentType = mimeMatch?.[1] ?? "image/jpeg"
  const ext = contentType.split("/")[1] ?? "jpg"
  const safeFileName = fileName.replace(/[^a-z0-9._-]/gi, "_").replace(/\.[^.]+$/, "") + `.${ext}`
  const storagePath = `characters/${Date.now()}_${safeFileName}`

  const buffer = Buffer.from(base64, "base64")

  // Use service role client so we can upsert without RLS restrictions
  const supabase = createClient(supabaseUrl, key, {
    auth: { persistSession: false },
  })

  const BUCKET = "cinescript-media"

  // Create bucket if it doesn't exist (idempotent — errors on "already exists" are fine)
  try {
    await supabase.storage.createBucket(BUCKET, { public: true, fileSizeLimit: 10 * 1024 * 1024 })
  } catch {
    // Bucket already exists — that's fine
  }

  // Upload the file
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

  if (uploadError) {
    console.error("[upload-photo] Supabase upload error:", uploadError.message)
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  const publicUrl = urlData?.publicUrl

  if (!publicUrl) {
    return NextResponse.json({ error: "Upload succeeded but could not get public URL" }, { status: 500 })
  }

  return NextResponse.json({ url: publicUrl })
}
