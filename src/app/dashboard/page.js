'use client';
import { useState, useEffect } from 'react';

const benchmarks = [
  { name: 'Tesseract 5', print: 94, handwritten: 65, historical: 58 },
  { name: 'EasyOCR', print: 89, handwritten: 71, historical: 52 },
  { name: 'PaddleOCR', print: 92, handwritten: 74, historical: 60 },
  { name: 'Google Vision', print: 97, handwritten: 82, historical: 75 },
  { name: 'Custom LSTM', print: 96, handwritten: 78, historical: 70 },
];

const timelineData = [
  { year: '2006', event: 'Tesseract open-sourced by Google' },
  { year: '2015', event: 'LSTM engine added to Tesseract' },
  { year: '2018', event: 'Tesseract 4.0 with neural nets' },
  { year: '2021', event: 'Tesseract 5.0 release' },
  { year: '2023', event: 'Tamil accuracy reaches 94%+' },
  { year: '2025', event: 'Transformer-based Tamil OCR research' },
];

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [uploads, setUploads] = useState([]);
  const [researchArticles, setResearchArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [uploadRes, researchRes] = await Promise.all([
        fetch('/api/clean'),
        fetch('/api/research'),
      ]);
      const uploadData = await uploadRes.json();
      const researchData = await researchRes.json();
      setUploads(uploadData.uploads || []);
      setResearchArticles(researchData.articles || []);
    } catch { /* silent */ }
    setLoading(false);
  };

  // Compute stats
  const uploadCategories = { research: 0, statistics: 0, training: 0, general: 0 };
  uploads.forEach(u => { if (uploadCategories[u.category] !== undefined) uploadCategories[u.category]++; });

  const researchCategories = {};
  researchArticles.forEach(a => { researchCategories[a.category] = (researchCategories[a.category] || 0) + 1; });

  // Collect all links from uploads
  const allLinks = [];
  uploads.forEach(u => {
    (u.links || []).forEach(lnk => {
      allLinks.push({ ...lnk, fromFile: u.file_name || u.title, fromDate: u.created_at });
    });
  });
  // Also collect research article URLs
  researchArticles.forEach(a => {
    if (a.url) allLinks.push({ url: a.url, description: a.title, fromFile: a.source || 'Research', fromDate: a.created_at || a.date });
  });

  const stats = [
    { label: 'Tamil Characters', value: 247, suffix: '', icon: '🔤' },
    { label: 'Best Print Accuracy', value: 97, suffix: '%', icon: '🎯' },
    { label: 'Group Uploads', value: uploads.length, suffix: '', icon: '📤' },
    { label: 'Research Articles', value: researchArticles.length, suffix: '', icon: '📰' },
    { label: 'OCR Engines Tracked', value: benchmarks.length, suffix: '', icon: '⚙️' },
    { label: 'Links Collected', value: allLinks.length, suffix: '', icon: '🔗' },
  ];

  const [animatedStats, setAnimatedStats] = useState(stats.map(() => 0));

  useEffect(() => {
    const timers = stats.map((stat, i) => {
      const increment = Math.max(stat.value / 40, 0.5);
      let current = 0;
      return setInterval(() => {
        current += increment;
        if (current >= stat.value) {
          current = stat.value;
          clearInterval(timers[i]);
        }
        setAnimatedStats(prev => { const next = [...prev]; next[i] = Math.round(current); return next; });
      }, 30);
    });
    return () => timers.forEach(t => clearInterval(t));
  }, [uploads.length, researchArticles.length]);

  return (
    <div className="container">
      <div className="page-header" id="dashboard-header">
        <h1>Analytics <span className="gradient-text">Dashboard</span></h1>
        <p>Live statistics combining Tamil OCR benchmarks, your group&apos;s uploads, and auto-collected research data.</p>
      </div>

      <div className="tabs" id="dashboard-tabs">
        {['overview', 'links', 'contributions', 'benchmarks', 'timeline'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab === 'links' ? `🔗 Links (${allLinks.length})` : tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="stats-banner" style={{ marginBottom: '32px' }}>
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              {stats.map((s, i) => {
                const clickMap = { 'Links Collected': 'links', 'Group Uploads': 'contributions', 'OCR Engines Tracked': 'benchmarks' };
                const tabTarget = clickMap[s.label];
                return (
                  <div className="stat-item" key={i} style={{ textAlign: 'center', cursor: tabTarget ? 'pointer' : 'default', transition: 'transform 0.2s' }}
                    onClick={() => tabTarget && setActiveTab(tabTarget)}
                    onMouseEnter={(e) => tabTarget && (e.currentTarget.style.transform = 'scale(1.05)')}
                    onMouseLeave={(e) => tabTarget && (e.currentTarget.style.transform = 'scale(1)')}>
                    <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{s.icon}</div>
                    <div className="stat-value">{animatedStats[i]}{s.suffix}</div>
                    <div className="stat-label">{s.label}</div>
                    {tabTarget && <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', marginTop: '2px' }}>Click to view →</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid-2">
            {/* Upload Categories */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>📤 Upload Categories</h3>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
              ) : uploads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📤</div>No uploads yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(uploadCategories).map(([cat, count]) => (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.88rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${uploads.length > 0 ? (count / uploads.length) * 100 : 0}%`, background: 'var(--accent-gradient)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Research Categories */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>📰 Research Categories</h3>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
              ) : researchArticles.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📰</div>No research articles yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {Object.entries(researchCategories).map(([cat, count]) => (
                    <div key={cat}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.88rem' }}>
                        <span style={{ textTransform: 'capitalize' }}>{cat}</span>
                        <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${researchArticles.length > 0 ? (count / researchArticles.length) * 100 : 0}%`, background: 'linear-gradient(90deg, #a855f7, #3b82f6)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tamil Script Breakdown */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>🔤 Tamil Script Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { label: 'Vowels (உயிர்)', count: 12, pct: 5 },
                  { label: 'Consonants (மெய்)', count: 18, pct: 7 },
                  { label: 'Combined (உயிர்மெய்)', count: 216, pct: 87 },
                  { label: 'Special (ஆய்தம்)', count: 1, pct: 1 },
                ].map((item, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.88rem' }}>
                      <span>{item.label}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{item.count}</span>
                    </div>
                    <div style={{ height: '6px', background: 'var(--bg-primary)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${item.pct}%`, background: 'linear-gradient(90deg, #f59e0b, #ef4444)', borderRadius: '3px', transition: 'width 1s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-card">
              <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>🕐 Recent Activity</h3>
              {uploads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No activity yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {uploads.slice(0, 5).map((u, i) => (
                    <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'start', padding: '8px 0', borderBottom: i < 4 ? '1px solid var(--border-glass)' : 'none' }}>
                      <span style={{ fontSize: '1.1rem' }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.title}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{u.file_name} • {new Date(u.created_at).toLocaleDateString()}</div>
                      </div>
                      <span style={{ padding: '2px 8px', background: 'rgba(201,48,44,0.1)', borderRadius: '50px', fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{u.category}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Links Tab */}
      {activeTab === 'links' && (
        <div>
          {allLinks.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔗</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Links Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Upload files containing links or browse research to collect links here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allLinks.map((lnk, i) => (
                <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <div className="glass-card" style={{ cursor: 'pointer', transition: 'border-color 0.2s', padding: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ color: 'var(--accent-secondary)', fontSize: '0.9rem', fontWeight: 600, wordBreak: 'break-all', marginBottom: '4px' }}>↗ {lnk.url}</div>
                        {lnk.description && <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5' }}>{lnk.description}</div>}
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>From: {lnk.fromFile}</div>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>Visit ↗</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contributions Tab */}
      {activeTab === 'contributions' && (
        <div>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner"></div></div>
          ) : uploads.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Contributions Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Upload and analyze data to see group contributions here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((u) => (
                <div className="glass-card" key={u.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{u.title}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>📁 {u.file_name} • 📅 {new Date(u.created_at).toLocaleDateString()}</div>
                    </div>
                    <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{u.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '12px' }}>{u.summary}</p>
                  {u.key_points && u.key_points.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {u.key_points.slice(0, 5).map((point, i) => (
                        <span key={i} style={{ padding: '4px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {typeof point === 'string' && point.length > 50 ? point.slice(0, 50) + '...' : point}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Benchmarks Tab */}
      {activeTab === 'benchmarks' && (
        <div className="glass-card">
          <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>⚙️ OCR Engine Benchmarks (Tamil)</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Engine</th><th>Printed (%)</th><th>Handwritten (%)</th><th>Historical (%)</th></tr></thead>
              <tbody>
                {benchmarks.map((b, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{b.name}</td>
                    <td><span style={{ color: b.print >= 95 ? 'var(--success)' : 'var(--text-primary)' }}>{b.print}%</span></td>
                    <td><span style={{ color: b.handwritten >= 80 ? 'var(--success)' : 'var(--accent-secondary)' }}>{b.handwritten}%</span></td>
                    <td><span style={{ color: b.historical >= 70 ? 'var(--success)' : 'var(--accent-primary)' }}>{b.historical}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {activeTab === 'timeline' && (
        <div style={{ position: 'relative', paddingLeft: '40px' }}>
          <div style={{ position: 'absolute', left: '15px', top: 0, bottom: 0, width: '2px', background: 'var(--accent-gradient)' }}></div>
          {timelineData.map((item, i) => (
            <div key={i} style={{ position: 'relative', marginBottom: '32px' }}>
              <div style={{ position: 'absolute', left: '-33px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--accent-gradient)', border: '3px solid var(--bg-primary)' }}></div>
              <div className="glass-card" style={{ marginLeft: '16px' }}>
                <div style={{ color: 'var(--accent-secondary)', fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>{item.year}</div>
                <div style={{ fontWeight: 600 }}>{item.event}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
