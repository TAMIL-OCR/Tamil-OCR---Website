'use client';
import { useState, useEffect } from 'react';

const categoryColors = {
  research: '#3b82f6',
  tool: '#22c55e',
  benchmark: '#f5a623',
  news: '#c9302c',
};

export default function ResearchPage() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchResearch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/research');
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchResearch(); }, []);

  const filtered = filter === 'all' ? articles : articles.filter(a => a.category === filter);

  return (
    <div className="container">
      <div className="page-header" id="research-header">
        <h1>Auto <span className="gradient-text">Research Feed</span></h1>
        <p>AI-powered collection of the latest Tamil OCR research, tools, and news — updated automatically.</p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tabs" style={{ marginBottom: 0, flex: 1 }}>
          {['all', 'research', 'tool', 'benchmark', 'news'].map(cat => (
            <button key={cat} className={`tab ${filter === cat ? 'active' : ''}`} onClick={() => setFilter(cat)}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
        <button className="btn-secondary" onClick={fetchResearch} disabled={loading} id="refresh-research-btn">
          {loading ? '⏳' : '🔄'} Refresh
        </button>
      </div>

      {loading ? (
        <div className="grid-2">
          {[1, 2, 3, 4].map(i => (
            <div className="glass-card" key={i}>
              <div className="skeleton" style={{ width: '80px', height: '20px', marginBottom: '12px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '20px', marginBottom: '8px' }}></div>
              <div className="skeleton" style={{ width: '90%', height: '14px', marginBottom: '6px' }}></div>
              <div className="skeleton" style={{ width: '70%', height: '14px' }}></div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔬</div>
          <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No articles found</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Try refreshing or changing the filter.</p>
        </div>
      ) : (
        <div className="grid-2">
          {filtered.map((article, i) => (
            <div className="glass-card research-card" key={i}>
              <span className="research-tag" style={{ borderColor: categoryColors[article.category] || '#c9302c', color: categoryColors[article.category] || '#c9302c', background: `${categoryColors[article.category] || '#c9302c'}15` }}>
                {article.category}
              </span>
              <h3>{article.title}</h3>
              <p>{article.summary}</p>
              <div className="research-meta">
                <span>📅 {article.date}</span>
                <span>📰 {article.source}</span>
                {article.relevance && <span>⭐ {article.relevance}/10</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
