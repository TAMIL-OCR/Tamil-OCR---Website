import { askGemini, askGeminiWithFile } from '@/lib/gemini';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import mammoth from 'mammoth';

const GEMINI_SUPPORTED_MIME = [
  'image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/heic', 'image/heif',
  'application/pdf',
  'video/mp4', 'video/mpeg', 'video/webm', 'video/quicktime',
  'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac',
  'text/plain', 'text/html', 'text/css', 'text/javascript',
  'application/json', 'application/xml',
];

const CLEAN_PROMPT = `You are a data cleaning assistant for a Tamil OCR research platform.
Analyze the provided content and:
1. Clean and fix any formatting issues, typos, or encoding errors
2. Structure it into a clear, organized format
3. Extract key facts, statistics, and findings
4. Extract ALL URLs/links found in the content (including YouTube links, video links, social media, articles, etc.)
5. If URLs are found, briefly describe what each link points to
6. Return the result as a JSON object with these fields:
   - "title": a concise title for this data
   - "summary": a 2-3 sentence summary
   - "keyPoints": an array of key findings or facts (max 8)
   - "cleanedText": the full cleaned and formatted text
   - "category": one of "research", "statistics", "training", "general"
   - "links": an array of objects with {"url": "...", "description": "..."} for every URL found in the content. Return empty array if no links found.

Respond ONLY with valid JSON. No markdown fences.`;

async function extractTextFromDocx(base64Data) {
  const buffer = Buffer.from(base64Data, 'base64');
  const result = await mammoth.extractRawText({ buffer });
  return result.value;
}

async function saveToSupabase(cleaned, fileName, fileType, fileSize, rawContent) {
  if (!isSupabaseConfigured() || !supabase) { console.log('Supabase not configured, skipping save'); return; }
  try {
    const row = {
      title: cleaned.title,
      summary: cleaned.summary,
      key_points: cleaned.keyPoints || [],
      cleaned_text: cleaned.cleanedText,
      category: cleaned.category,
      file_name: fileName || 'Text Input',
      file_type: fileType || 'text/plain',
      file_size: fileSize || 0,
    };
    // Add optional columns (may not exist if user hasn't run schema update)
    if (rawContent) row.raw_content = rawContent;
    if (cleaned.links?.length > 0) row.links = cleaned.links;

    const { error } = await supabase.from('uploads').insert(row);
    if (error) {
      console.error('Supabase insert error:', error.message);
      // Retry without optional columns
      if (error.message.includes('raw_content') || error.message.includes('links')) {
        delete row.raw_content;
        delete row.links;
        const { error: retryErr } = await supabase.from('uploads').insert(row);
        if (retryErr) console.error('Supabase retry error:', retryErr.message);
        else console.log('Saved without optional columns');
      }
    } else {
      console.log('Saved to Supabase:', cleaned.title);
    }
  } catch (err) {
    console.error('Supabase save exception:', err);
  }
}

export async function POST(request) {
  try {
    const { rawData, fileBase64, mimeType, fileName, fileSize } = await request.json();

    let reply;
    let rawContent = rawData || '';

    if (fileBase64 && mimeType) {
      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          mimeType === 'application/msword' ||
          fileName?.match(/\.docx?$/i)) {
        const extractedText = await extractTextFromDocx(fileBase64);
        if (!extractedText.trim()) {
          return Response.json({ error: 'Could not extract text from the Word document.' }, { status: 400 });
        }
        rawContent = extractedText;
        reply = await askGemini(`${CLEAN_PROMPT}\n\nExtracted text from Word document "${fileName}":\n${extractedText}`);

      } else if (GEMINI_SUPPORTED_MIME.includes(mimeType) || ['image/', 'video/', 'audio/', 'text/'].some(p => mimeType.startsWith(p))) {
        const filePrompt = `${CLEAN_PROMPT}\n\nThe user uploaded a file named "${fileName}" (type: ${mimeType}). Analyze its contents thoroughly.`;
        reply = await askGeminiWithFile(filePrompt, fileBase64, mimeType);
        rawContent = `[Binary file: ${fileName}]`;

      } else {
        try {
          const textContent = Buffer.from(fileBase64, 'base64').toString('utf-8');
          if (textContent && textContent.length > 10) {
            rawContent = textContent;
            reply = await askGemini(`${CLEAN_PROMPT}\n\nExtracted text from file "${fileName}" (type: ${mimeType}):\n${textContent}`);
          } else {
            return Response.json({ error: `Unsupported file type: ${mimeType}. Try converting to PDF or paste text.` }, { status: 400 });
          }
        } catch {
          return Response.json({ error: `Cannot read file type: ${mimeType}. Convert to PDF or paste text.` }, { status: 400 });
        }
      }
    } else if (rawData) {
      reply = await askGemini(`${CLEAN_PROMPT}\n\nRaw data:\n${rawData}`);
    } else {
      return Response.json({ error: 'No data provided.' }, { status: 400 });
    }

    let jsonStr = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    // eslint-disable-next-line no-control-regex
    jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '\t') return ' ';
      return '';
    });
    const parsed = JSON.parse(jsonStr);

    // Save to Supabase
    await saveToSupabase(parsed, fileName, mimeType, fileSize, rawContent);

    return Response.json({ cleaned: parsed, rawContent });
  } catch (error) {
    console.error('Clean API error:', error);
    return Response.json({ error: 'Failed to clean data: ' + error.message }, { status: 500 });
  }
}

// GET: Retrieve all uploads from Supabase
export async function GET() {
  if (!isSupabaseConfigured() || !supabase) {
    return Response.json({ uploads: [] });
  }
  try {
    const { data, error } = await supabase
      .from('uploads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return Response.json({ uploads: data || [] });
  } catch (err) {
    console.error('Fetch uploads error:', err);
    return Response.json({ uploads: [] });
  }
}
