import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const file = formData.get('file') as File;
    const password = formData.get('password')?.toString();
    const expiresIn = formData.get('expiresIn')?.toString(); // e.g. '1d', '7d'
    const senderName = formData.get('senderName')?.toString() || 'Anonymous';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop();
    const fileId = uuidv4(); // Unique file ID
    const filePath = `${fileId}.${fileExt}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload Error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // Optional password hash
    let passwordHash = null;
    if (password) {
      const salt = bcrypt.genSaltSync(10);
      passwordHash = bcrypt.hashSync(password, salt);
    }

    // Optional expiry calculation
    let expiresAt = null;
    if (expiresIn) {
      const now = new Date();
      if (expiresIn === '1d') now.setDate(now.getDate() + 1);
      if (expiresIn === '7d') now.setDate(now.getDate() + 7);
      expiresAt = now.toISOString();
    }

    // Insert metadata into DB
    const { error: dbError } = await supabase
      .from('files')
      .insert([
        {
          id: fileId,
          file_name: file.name,
          file_url: filePath,
          password_hash: passwordHash,
          expires_at: expiresAt,
          sender_name: senderName,
          created_at: new Date().toISOString()
        }
      ]);

    if (dbError) {
      console.error('DB Insert Error:', dbError);
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }

    return NextResponse.json({ fileId });
  } catch (err) {
    console.error('Upload Route Error:', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
