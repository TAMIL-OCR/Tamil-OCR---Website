-- =============================================
-- Tamil OCR Hub — Schema Update
-- Run this in Supabase SQL Editor
-- =============================================

-- Add raw content and links columns to uploads
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS raw_content TEXT;
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]';

-- Add URL column to research articles
ALTER TABLE research_articles ADD COLUMN IF NOT EXISTS url TEXT;
