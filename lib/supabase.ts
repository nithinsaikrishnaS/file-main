import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database schema for file_shares table
/*
CREATE TABLE file_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id TEXT UNIQUE NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  password_hash TEXT NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  downloaded_at TIMESTAMP WITH TIME ZONE,
  download_count INTEGER DEFAULT 0
);

-- Create RLS policies
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read file metadata (needed for download page)
CREATE POLICY "Allow public read access" ON file_shares
  FOR SELECT USING (true);

-- Allow anyone to insert new file shares
CREATE POLICY "Allow public insert" ON file_shares
  FOR INSERT WITH CHECK (true);

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('files', 'files', false);

-- Create storage policy for file uploads
CREATE POLICY "Allow public uploads" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'files');

-- Create storage policy for file downloads (with authentication via app logic)
CREATE POLICY "Allow public downloads" ON storage.objects
  FOR SELECT USING (bucket_id = 'files');
*/
