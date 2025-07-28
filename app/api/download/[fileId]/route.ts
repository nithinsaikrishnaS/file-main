import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  try {
    // Look up file metadata in your database (optional)
    // For now assume the path in storage = `uploads/${fileId}`
    const { data, error } = await supabase
  .storage
  .from('uploads')
  .createSignedUrl(`${fileId}`, 3600); // ✅ correct if uploaded directly in 'uploads'

    if (error || !data) {
      console.error('Signed URL Error:', error);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    return NextResponse.json({ url: data.signedUrl });
  } catch (err) {
    console.error('Download API Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
