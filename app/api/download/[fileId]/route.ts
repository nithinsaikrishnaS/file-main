import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { password } = await request.json()
    const { fileId } = params

    // Get file metadata
    const { data: fileData, error: fetchError } = await supabase
      .from("file_shares")
      .select("*")
      .eq("file_id", fileId)
      .single()

    if (fetchError || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Check if file has expired
    if (new Date(fileData.expiry_date) <= new Date()) {
      return NextResponse.json({ error: "File has expired" }, { status: 410 })
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, fileData.password_hash)

    if (!isValidPassword) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 })
    }

    // Get signed URL for download
    const { data: signedUrlData, error: urlError } = await supabase.storage
      .from("files")
      .createSignedUrl(fileData.storage_path, 3600) // 1 hour expiry

    if (urlError) {
      throw urlError
    }

    // Update download count
    await supabase
      .from("file_shares")
      .update({
        download_count: fileData.download_count + 1,
        downloaded_at: new Date().toISOString(),
      })
      .eq("file_id", fileId)

    return NextResponse.json({
      downloadUrl: signedUrlData.signedUrl,
      fileName: fileData.original_name,
      fileSize: fileData.file_size,
    })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Download failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { fileId: string } }) {
  try {
    const { fileId } = params

    // Get file metadata (without password verification)
    const { data: fileData, error: fetchError } = await supabase
      .from("file_shares")
      .select("file_id, original_name, file_size, expiry_date")
      .eq("file_id", fileId)
      .single()

    if (fetchError || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const isExpired = new Date(fileData.expiry_date) <= new Date()

    return NextResponse.json({
      ...fileData,
      isExpired,
    })
  } catch (error) {
    console.error("Fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch file data" }, { status: 500 })
  }
}
