import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const password = formData.get("password") as string
    const expiryDate = formData.get("expiryDate") as string

    if (!file || !password || !expiryDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Generate unique file ID
    const fileId = Math.random().toString(36).substring(2, 15) +
                   Math.random().toString(36).substring(2, 15)

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)

    // Upload file to Supabase Storage
    const fileName = ${fileId}/${file.name}
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("files")
      .upload(fileName, buffer, {
        contentType: file.type,
      })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      throw uploadError
    }

    // Save metadata to database
    const { error: dbError } = await supabase.from("file_shares").insert({
      file_id: fileId,
      original_name: file.name,
      file_size: file.size,
      password_hash: hashedPassword,
      expiry_date: new Date(expiryDate).toISOString(), // ensure valid timestamp format
      storage_path: uploadData?.path,
    })

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await supabase.storage.from("files").remove([fileName])
      console.error("DB insert error:", dbError)
      throw dbError
    }

    // Return success with shareable link
    return NextResponse.json({
      fileId,
      shareableLink: ${process.env.NEXT_PUBLIC_APP_URL}/download/${fileId},
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
