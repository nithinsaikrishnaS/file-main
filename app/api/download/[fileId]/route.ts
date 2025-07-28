import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  const { fileId } = params;

  const { data, error } = await supabase.storage
    .from('uploads')
    .createSignedUrl(fileId, 60 * 60); // expires in 1 hour

  if (error || !data?.signedUrl) {
    return NextResponse.json({ error: 'Unable to generate signed URL' }, { status: 500 });
  }

  return NextResponse.json({ url: data.signedUrl });
}
