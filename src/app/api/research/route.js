import { askGemini } from '@/lib/gemini';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FALLBACK_ARTICLES = [
  { title: 'Tamil Script — Wikipedia', summary: 'Tamil script is an abugida script used to write the Tamil language. It has 12 vowels, 18 consonants, and one special character (āytam), combining to form 247 characters.', source: 'Wikipedia', date: '2026-01', category: 'research', relevance: 10, url: 'https://en.wikipedia.org/wiki/Tamil_script' },
  { title: 'Optical Character Recognition — Wikipedia', summary: 'OCR is the electronic or mechanical conversion of images of text into machine-encoded text. Modern OCR systems use neural networks and deep learning for improved accuracy.', source: 'Wikipedia', date: '2026-01', category: 'research', relevance: 9, url: 'https://en.wikipedia.org/wiki/Optical_character_recognition' },
  { title: 'Tesseract OCR Engine — GitHub', summary: 'Tesseract is an open-source OCR engine maintained by Google. Version 5.x supports LSTM-based recognition and has trained data available for Tamil (tam) language.', source: 'GitHub', date: '2025-11', category: 'tool', relevance: 9, url: 'https://github.com/tesseract-ocr/tesseract' },
  { title: 'Tamil Wikisource — Digitized Tamil Literature', summary: 'Tamil Wikisource hosts thousands of digitized Tamil literary works including Sangam literature, Thirukkural, and modern texts — a key resource for OCR training datasets.', source: 'Wikisource', date: '2026-01', category: 'research', relevance: 8, url: 'https://ta.wikisource.org/wiki/%E0%AE%AE%E0%AF%81%E0%AE%A4%E0%AE%B1%E0%AF%8D_%E0%AE%AA%E0%AE%95%E0%AF%8D%E0%AE%95%E0%AE%AE%E0%AF%8D' },
  { title: 'PaddleOCR — Multi-language OCR Toolkit', summary: 'PaddleOCR supports 80+ languages including Tamil, with PP-OCR series achieving state-of-the-art accuracy. Provides pre-trained models and easy fine-tuning for Tamil text.', source: 'GitHub', date: '2025-09', category: 'tool', relevance: 7, url: 'https://github.com/PaddlePaddle/PaddleOCR' },
  { title: 'EasyOCR — Ready-to-use OCR with Tamil Support', summary: 'EasyOCR is a Python library supporting 80+ languages including Tamil. Built on PyTorch with CRAFT text detection and CRNN recognition architecture.', source: 'GitHub', date: '2025-10', category: 'tool', relevance: 7, url: 'https://github.com/JaidedAI/EasyOCR' },
  { title: 'Google Cloud Vision API — Document OCR', summary: 'Google Cloud Vision provides enterprise-grade OCR for Tamil documents with layout detection, table extraction, and handwriting recognition capabilities.', source: 'Google Cloud', date: '2026-01', category: 'news', relevance: 8, url: 'https://cloud.google.com/vision/docs/ocr' },
  { title: 'Tamil Language — Wikipedia', summary: 'Tamil is a Dravidian language with over 80 million native speakers. Its 2,000+ year literary tradition makes it one of the longest-surviving classical languages, creating unique OCR challenges.', source: 'Wikipedia', date: '2026-01', category: 'research', relevance: 9, url: 'https://en.wikipedia.org/wiki/Tamil_language' },
  { title: 'Tesseract Tamil Training Data', summary: 'Pre-trained data files for Tesseract 4/5 Tamil recognition (tam.traineddata). Includes best and fast variants for different accuracy/speed trade-offs.', source: 'GitHub', date: '2025-12', category: 'tool', relevance: 8, url: 'https://github.com/tesseract-ocr/tessdata_best' },
  { title: 'ICDAR — Document Analysis and Recognition', summary: 'International Conference on Document Analysis and Recognition (ICDAR) is the premier venue for OCR research, featuring competitions and benchmarks for Indic script recognition.', source: 'ICDAR', date: '2025-09', category: 'benchmark', relevance: 8, url: 'https://icdar2025.com/' },
];

async function saveArticlesToSupabase(articles) {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    for (const article of articles) {
      const { data: existing } = await supabase.from('research_articles').select('id').eq('title', article.title).limit(1);
      if (!existing || existing.length === 0) {
        await supabase.from('research_articles').insert({
          title: article.title, summary: article.summary, source: article.source,
          date: article.date, category: article.category, relevance: article.relevance || 5,
          url: article.url || '',
        });
      }
    }
  } catch (err) {
    console.error('Supabase save research error:', err);
  }
}

async function getStoredArticles() {
  if (!isSupabaseConfigured() || !supabase) return [];
  try {
    const { data, error } = await supabase.from('research_articles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch { return []; }
}

export async function GET() {
  try {
    const storedArticles = await getStoredArticles();

    let freshArticles = [];
    try {
      const prompt = `Find the latest real-world information about Tamil OCR from these actual web sources:
- Wikipedia articles about Tamil script, Tamil language, OCR technology
- Tamil Wikisource (ta.wikisource.org) for digitized Tamil literature relevant to OCR
- GitHub repositories (tesseract-ocr, PaddleOCR, EasyOCR, kraken)
- arXiv papers about Tamil/Indic OCR
- Google Cloud Vision, AWS Textract documentation for Tamil

For EACH item, provide an ACTUAL working URL. Do not make up URLs.

Return a JSON array with 5 items:
{"title":"...","summary":"2-3 real sentences","source":"Wikipedia|Wikisource|GitHub|arXiv|Google Cloud","date":"YYYY-MM","category":"research|tool|benchmark|news","relevance":1-10,"url":"actual real URL"}

ONLY valid JSON array. No markdown fences.`;

      const reply = await askGemini(prompt);
      let jsonStr = reply.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      // eslint-disable-next-line no-control-regex
      jsonStr = jsonStr.replace(/[\x00-\x1F\x7F]/g, (ch) => {
        if (ch === '\n' || ch === '\r' || ch === '\t') return ' ';
        return '';
      });
      freshArticles = JSON.parse(jsonStr);

      if (Array.isArray(freshArticles) && freshArticles.length > 0) {
        await saveArticlesToSupabase(freshArticles);
      }
    } catch (err) {
      console.log('Could not fetch fresh research:', err.message);
    }

    const allArticles = [...freshArticles];
    const titles = new Set(allArticles.map(a => a.title));

    for (const article of storedArticles) {
      if (!titles.has(article.title)) {
        allArticles.push(article);
        titles.add(article.title);
      }
    }

    // Add fallback articles that aren't already present
    for (const article of FALLBACK_ARTICLES) {
      if (!titles.has(article.title)) {
        allArticles.push(article);
        titles.add(article.title);
      }
    }

    return Response.json({ articles: allArticles });
  } catch (error) {
    console.error('Research API error:', error);
    return Response.json({ articles: FALLBACK_ARTICLES });
  }
}
