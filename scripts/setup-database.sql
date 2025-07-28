-- Create the file_shares table
CREATE TABLE IF NOT EXISTS file_shares (
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

-- Enable Row Level Security
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access" ON file_shares
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON file_shares
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_file_shares_file_id ON file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expiry ON file_shares(expiry_date);
CREATE INDEX IF NOT EXISTS idx_file_shares_created_at ON file_shares(created_at);
