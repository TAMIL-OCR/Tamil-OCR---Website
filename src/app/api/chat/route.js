import { GoogleGenerativeAI } from '@google/generative-ai';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_INSTRUCTION = `You are an expert AI assistant dedicated to the Tamil OCR Collaboration Platform.
You are extremely knowledgeable about Optical Character Recognition (OCR), specifically for Indic scripts and the Tamil language.
You should behave like a highly professional, helpful, and intelligent AI assistant (like Gemini).
Your tone should be professional, clear, and structured. 
Use Markdown extensively to structure your answers (use bolding, bullet points, headers, and code blocks where relevant).
If a user asks about the Tamil OCR project, explain that it is a collaborative platform to upload, clean, and organize Tamil OCR data, using AI to extract links, structure information, and maintain a historical benchmark of OCR tools (like Tesseract, EasyOCR, PaddleOCR).
Answer all user questions thoroughly.`;

export async function POST(request) {
  try {
    const { messages } = await request.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Invalid messages array' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION,
    });

    // Format history for Gemini API
    const history = messages.slice(0, -1).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const lastMessage = messages[messages.length - 1].content;
    const chat = model.startChat({ history });

    const result = await chat.sendMessage(lastMessage);
    const response = await result.response;
    const text = response.text();

    return Response.json({ text });
  } catch (error) {
    console.error('Chat API Error:', error);
    return Response.json({ error: error.message || 'Failed to communicate with AI' }, { status: 500 });
  }
}
