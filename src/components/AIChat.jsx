'use client';
import { useState, useRef, useEffect } from 'react';

export default function AIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'வணக்கம்! I am your Tamil OCR assistant powered by Gemini AI. Ask me anything about Tamil OCR, Tesseract training, or Tamil script!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: 'bot', text: data.reply || 'Sorry, something went wrong.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'bot', text: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') sendMessage();
  };

  return (
    <>
      <button className="ai-chat-toggle" onClick={() => setOpen(!open)} id="ai-chat-toggle" aria-label="Toggle AI Chat">
        {open ? '✕' : '🤖'}
      </button>
      {open && (
        <div className="ai-chat-panel" id="ai-chat-panel">
          <div className="ai-chat-header">
            <h3>🤖 Gemini AI Assistant</h3>
            <button onClick={() => setOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>✕</button>
          </div>
          <div className="ai-chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`ai-msg ${msg.role}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="ai-msg bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                Thinking...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="ai-chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about Tamil OCR..."
              id="ai-chat-input-field"
            />
            <button onClick={sendMessage} disabled={loading}>Send</button>
          </div>
        </div>
      )}
    </>
  );
}
