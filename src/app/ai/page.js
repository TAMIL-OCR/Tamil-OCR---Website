'use client';
import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AIPage() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am the Tamil OCR AI Assistant. I can help you understand OCR concepts, analyze text formatting, summarize research, or answer general questions. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMessage];
    
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      setMessages([...newMessages, { role: 'assistant', content: data.text }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages([...newMessages, { role: 'assistant', content: '⚠️ **Error:** I encountered an issue connecting to the servers. Please try again later.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1000px', height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
      <div className="page-header" style={{ marginBottom: '20px' }}>
        <h1>Tamil OCR <span className="gradient-text">Intelligence</span></h1>
        <p>Ask anything about OCR, datasets, or general text processing.</p>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
        
        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ display: 'flex', gap: '16px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
              
              {/* Avatar */}
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                background: msg.role === 'user' ? 'var(--bg-glass)' : 'var(--accent-gradient)',
                border: msg.role === 'user' ? '1px solid var(--border-glass)' : 'none',
                boxShadow: msg.role === 'user' ? 'none' : '0 4px 12px rgba(168, 85, 247, 0.4)'
              }}>
                {msg.role === 'user' ? '👤' : '✨'}
              </div>

              {/* Message Bubble */}
              <div style={{
                maxWidth: '80%', padding: '16px 20px', borderRadius: '16px',
                background: msg.role === 'user' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                border: '1px solid var(--border-glass)',
                borderTopRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderTopLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                lineHeight: '1.6'
              }}>
                {msg.role === 'user' ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                ) : (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {loading && (
            <div style={{ display: 'flex', gap: '16px', flexDirection: 'row' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-gradient)', boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)' }}>✨</div>
              <div style={{ padding: '16px 20px', borderRadius: '16px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-glass)', borderTopLeftRadius: '4px' }}>
                <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '20px', background: 'rgba(0,0,0,0.3)', borderTop: '1px solid var(--border-glass)' }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', padding: '8px' }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask the AI anything..."
              style={{
                flex: 1, background: 'transparent', border: 'none', color: 'var(--text-primary)',
                padding: '8px 12px', fontSize: '1rem', fontFamily: 'inherit', resize: 'none',
                maxHeight: '150px', outline: 'none', minHeight: '44px'
              }}
              rows={input.split('\n').length > 1 ? Math.min(input.split('\n').length, 5) : 1}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: '44px', height: '44px', borderRadius: '50%', background: input.trim() && !loading ? 'var(--text-primary)' : 'rgba(255,255,255,0.1)',
                color: input.trim() && !loading ? 'var(--bg-primary)' : 'var(--text-muted)',
                border: 'none', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem',
                transition: 'all 0.2s', marginLeft: '8px', flexShrink: 0
              }}
            >
              ↑
            </button>
          </div>
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            AI can make mistakes. Consider verifying important information.
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .markdown-body h1, .markdown-body h2, .markdown-body h3 { margin-top: 24px; margin-bottom: 12px; font-weight: 700; }
        .markdown-body h1 { font-size: 1.5rem; }
        .markdown-body h2 { font-size: 1.3rem; }
        .markdown-body h3 { font-size: 1.1rem; }
        .markdown-body p { margin-bottom: 16px; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 16px; padding-left: 24px; }
        .markdown-body li { margin-bottom: 6px; }
        .markdown-body strong { color: var(--accent-secondary); font-weight: 700; }
        .markdown-body code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 0.85em; }
        .markdown-body pre { background: rgba(0,0,0,0.4); padding: 16px; border-radius: 8px; overflow-x: auto; margin-bottom: 16px; border: 1px solid var(--border-glass); }
        .markdown-body pre code { background: transparent; padding: 0; color: #e2e8f0; }
        .markdown-body a { color: var(--accent-primary); text-decoration: underline; }
        .markdown-body > *:last-child { margin-bottom: 0; }
        .markdown-body > *:first-child { margin-top: 0; }
      `}} />
    </div>
  );
}
