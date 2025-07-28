import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { NextResponse } from "next/server"

export async function POST(req, { params }) {
  try {
    const { fileId } = params
    const body = await req.json()
    const { password } = body

    if (!fileId || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Fetch file metadata
    const { data: fileData, error: fetchError } = await supabase
      .from("file_shares")
      .select("*")
      .eq("file_id", fileId)
      .single()

    if (fetchError || !fileData) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Validate password
    const passwordMatch = await bcrypt.compare(password, fileData.password_hash)
    if (!passwordMatch) {
      return NextResponse.json({ error: "Incorrect password" }, { status: 401 })
    }

    // Check expiry date
    const now = new Date()
    const expiry = new Date(fileData.expiry_date)
    if (now > expiry) {
      return NextResponse.json({ error: "Link has expired" }, { status: 410 })
    }

    // Generate signed URL
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from("files")
      .createSignedUrl(fileData.storage_path, 60 * 5) // valid for 5 mins

    if (signedUrlError) {
      return NextResponse.json({ error: "Could not generate download URL" }, { status: 500 })
    }

    return NextResponse.json({ downloadUrl: signedUrlData.signedUrl })
  } catch (error) {
    console.error("Download error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
