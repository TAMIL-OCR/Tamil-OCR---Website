'use client';
import { useState, useEffect } from 'react';

const categoryColors = {
  research: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.3)', text: '#a855f7' },
  tool: { bg: 'rgba(34,197,94,0.1)', border: 'rgba(34,197,94,0.3)', text: '#22c55e' },
  benchmark: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', text: '#3b82f6' },
  news: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', text: '#f59e0b' },
};

export default function ResearchPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResearch();
  }, []);

  const fetchResearch = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/research');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      setError('Failed to load research data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter);
  const categories = ['all', ...new Set(articles.map(a => a.category).filter(Boolean))];

  return (
    <div className="container">
      <div className="page-header" id="research-header">
        <h1>Research <span className="gradient-text">Feed</span></h1>
        <p>Auto-collected Tamil OCR research, news, and tool updates — powered by Gemini AI. Click any article to visit the source.</p>
      </div>

      {/* Filter Tabs */}
      <div className="tabs" style={{ marginBottom: '24px' }}>
        {categories.map(cat => (
          <button key={cat} className={`tab ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)} style={{ textTransform: 'capitalize' }}>
            {cat === 'all' ? '🌐 All' : cat}
          </button>
        ))}
      </div>

      {/* Refresh */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{filtered.length} article{filtered.length !== 1 ? 's' : ''} found</span>
        <button className="btn-secondary" onClick={fetchResearch} disabled={loading} style={{ fontSize: '0.85rem' }}>
          {loading ? '⏳ Refreshing...' : '🔄 Fetch Latest'}
        </button>
      </div>

      {error && (
        <div style={{ padding: '12px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '0.88rem', marginBottom: '16px' }}>{error}</div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}><div className="spinner"></div></div>
      ) : (
        <div className="grid-2">
          {filtered.map((article, i) => {
            const colors = categoryColors[article.category] || categoryColors.news;
            const hasUrl = article.url && article.url.startsWith('http');
            
            const CardWrapper = hasUrl ? 'a' : 'div';
            const cardProps = hasUrl ? {
              href: article.url,
              target: '_blank',
              rel: 'noopener noreferrer',
              style: { textDecoration: 'none', color: 'inherit', display: 'block' },
            } : {};

            return (
              <CardWrapper key={i} {...cardProps}>
                <div className="glass-card" style={{
                  cursor: hasUrl ? 'pointer' : 'default',
                  transition: 'all 0.3s ease',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  {/* Relevance indicator */}
                  <div style={{ position: 'absolute', top: 0, left: 0, width: `${(article.relevance || 5) * 10}%`, height: '3px', background: colors.text, borderRadius: '0 3px 3px 0' }}></div>

                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '8px', marginBottom: '12px', marginTop: '8px' }}>
                    <span style={{ padding: '4px 10px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: '50px', fontSize: '0.75rem', color: colors.text, fontWeight: 600, textTransform: 'capitalize' }}>
                      {article.category}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{article.date}</span>
                  </div>

                  {/* Title */}
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '10px', lineHeight: '1.4' }}>{article.title}</h3>

                  {/* Summary */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.7', marginBottom: '16px', flex: 1 }}>{article.summary}</p>

                  {/* Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📰 {article.source}</span>
                    {hasUrl ? (
                      <span style={{ fontSize: '0.8rem', color: colors.text, fontWeight: 600 }}>Visit Source ↗</span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Relevance: {article.relevance}/10</span>
                    )}
                  </div>
                </div>
              </CardWrapper>
            );
          })}
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
