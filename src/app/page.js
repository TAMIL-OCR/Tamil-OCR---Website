import Link from 'next/link';

const features = [
  { icon: '📖', title: 'Complete Knowledge Base', desc: 'Everything about Tamil OCR — from history to cutting-edge research, all in one place.' },
  { icon: '⚙️', title: 'Tesseract Training Lab', desc: 'Step-by-step guides to train, fine-tune, and optimize Tesseract for Tamil text recognition.' },
  { icon: '📊', title: 'Analytics Dashboard', desc: 'Live statistics on Tamil OCR accuracy, performance benchmarks, and research trends.' },
  { icon: '🤖', title: 'AI-Powered Assistant', desc: 'Ask Gemini AI anything about Tamil OCR. Get instant, contextual explanations.' },
  { icon: '📤', title: 'Upload & Clean Data', desc: 'Upload messy research data — our AI cleans, structures, and organizes it automatically.' },
  { icon: '🔬', title: 'Auto Research Feed', desc: 'Automatically collects the latest Tamil OCR news, papers, and tools from the web.' },
];

const stats = [
  { value: '247', label: 'Tamil Characters' },
  { value: '96%+', label: 'Modern OCR Accuracy' },
  { value: '2000+', label: 'Years of Script History' },
  { value: '80M+', label: 'Tamil Speakers' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="hero" id="hero-section">
        <div className="container">
          <div className="hero-content">
            <div className="hero-badge">🔴 Collaborative Learning Platform</div>
            <h1>
              Unlock the Power of<br />
              <span className="gradient-text">Tamil OCR</span>
            </h1>
            <p>
              A comprehensive hub for your group to learn, train, and research Tamil Optical Character Recognition.
              Powered by Tesseract, Supabase, and Gemini AI.
            </p>
            <div className="hero-actions">
              <Link href="/learn" className="btn-primary">Start Learning →</Link>
              <Link href="/training" className="btn-secondary">Training Guide</Link>
            </div>
            <div className="hero-stats">
              {stats.map((s, i) => (
                <div className="hero-stat" key={i}>
                  <h3><span className="gradient-text">{s.value}</span></h3>
                  <p>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-tamil" aria-hidden="true">தமிழ்</div>
        </div>
      </section>

      {/* Stats Banner */}
      <section className="section" id="stats-section">
        <div className="container">
          <div className="stats-banner">
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-item" key={i}>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="section" id="features-section">
        <div className="container">
          <h2 className="section-title">Everything You Need</h2>
          <p className="section-subtitle">
            From learning fundamentals to advanced training — everything your group needs to master Tamil OCR.
          </p>
          <div className="grid-3">
            {features.map((f, i) => (
              <div className="glass-card" key={i}>
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section" id="cta-section">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-title">Ready to Dive In?</h2>
          <p className="section-subtitle" style={{ margin: '0 auto 32px' }}>
            Start exploring Tamil OCR, or ask our AI assistant anything.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/learn" className="btn-primary">Explore Knowledge Base →</Link>
            <Link href="/dashboard" className="btn-secondary">View Dashboard</Link>
          </div>
        </div>
      </section>
    </>
  );
}
