import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function GET(request: Request, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  try {
    // ✅ Step 1: Get file record from Supabase table
    const { data: files, error: fetchError } = await supabase
      .from('files')
      .select('file_name')
      .eq('id', fileId)
      .single();

    if (fetchError || !files) {
      console.error('File not found:', fetchError);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileName = files.file_name; // e.g., 'myresume.pdf'

    // ✅ Step 2: Create signed URL for download
    const { data: signedUrlData, error: urlError } = await supabase
      .storage
      .from('uploads')
      .createSignedUrl(fileName, 3600);

    if (urlError || !signedUrlData) {
      console.error('Signed URL Error:', urlError);
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    // ✅ Step 3: Return the signed URL
    return NextResponse.json({ url: signedUrlData.signedUrl });

  } catch (err) {
    console.error('Download API Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
