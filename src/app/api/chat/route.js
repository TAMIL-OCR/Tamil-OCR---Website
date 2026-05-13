import { askGemini } from '@/lib/gemini';

const SYSTEM_PROMPT = `You are a helpful AI assistant embedded in the "Tamil OCR Hub" — a collaborative learning platform about Tamil Optical Character Recognition.

Your expertise includes:
- Tamil script history, structure, and Unicode encoding
- Tesseract OCR engine: installation, training, usage, and fine-tuning
- OCR accuracy metrics, dataset preparation, and evaluation
- Tamil language processing and text digitization challenges
- Machine learning concepts related to OCR (CNNs, LSTMs, CTC loss)

Rules:
- Be concise but thorough. Use bullet points when helpful.
- If the user asks in Tamil, respond in Tamil.
- Include code snippets when discussing Tesseract commands.
- Always be encouraging and educational.`;

export async function POST(request) {
  try {
    const { message } = await request.json();
    if (!message) {
      return Response.json({ reply: 'Please send a message.' }, { status: 400 });
    }
    const reply = await askGemini(message, SYSTEM_PROMPT);
    return Response.json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json({ reply: 'Sorry, I encountered an error. Please try again.' }, { status: 500 });
  }
}
