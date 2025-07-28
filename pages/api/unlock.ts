// pages/api/unlock.ts

import { supabase } from '@/lib/supabase';
import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id, password } = req.body;

  // Fetch file from Supabase DB
  const { data: file, error: fileError } = await supabase
    .from('files') // Your table name
    .select('*')
    .eq('id', id)
    .single();

  if (fileError || !file) return res.status(404).json({ error: 'File not found' });

  const now = new Date();
  const expiry = new Date(file.expiry);

  if (now > expiry) return res.status(403).json({ error: 'Link has expired' });
  if (file.password !== password) return res.status(401).json({ error: 'Invalid password' });

  // Generate signed URL from Supabase Storage
  const { data: signedUrlData, error: signedUrlError } = await supabase
    .storage
    .from('uploads') // your bucket name
    .createSignedUrl(file.path, 60 * 60); // 1 hour expiry

  if (signedUrlError || !signedUrlData) {
    return res.status(500).json({ error: 'Failed to create signed URL' });
  }

  return res.status(200).json({
    file: {
      id: file.id,
      name: file.name,
      type: file.type,
    },
    url: signedUrlData.signedUrl,
  });
}
