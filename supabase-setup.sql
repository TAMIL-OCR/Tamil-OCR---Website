-- =============================================
-- Tamil OCR Hub — Supabase Database Setup
-- Run this in Supabase SQL Editor
-- =============================================

-- 1. Uploads table — stores analyzed data from user uploads
CREATE TABLE IF NOT EXISTS uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  key_points JSONB DEFAULT '[]',
  cleaned_text TEXT,
  category TEXT DEFAULT 'general',
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by TEXT DEFAULT 'anonymous',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Research articles — auto-collected and stored
CREATE TABLE IF NOT EXISTS research_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT,
  source TEXT,
  date TEXT,
  category TEXT DEFAULT 'news',
  relevance INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Enable Row Level Security (but allow public read/write for group use)
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_articles ENABLE ROW LEVEL SECURITY;

-- Allow anyone with the anon key to read and insert
CREATE POLICY "Allow public read uploads" ON uploads FOR SELECT USING (true);
CREATE POLICY "Allow public insert uploads" ON uploads FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read research" ON research_articles FOR SELECT USING (true);
CREATE POLICY "Allow public insert research" ON research_articles FOR INSERT WITH CHECK (true);
