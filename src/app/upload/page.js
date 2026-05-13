'use client';
import { useState, useEffect } from 'react';

const fileTypeIcons = {
  'image': '🖼️',
  'application/pdf': '📕',
  'text': '📄',
  'application/json': '📋',
  'video': '🎬',
  'audio': '🎵',
  'default': '📁',
};

function getFileIcon(mimeType) {
  if (!mimeType) return fileTypeIcons.default;
  for (const [key, icon] of Object.entries(fileTypeIcons)) {
    if (mimeType.startsWith(key) || mimeType === key) return icon;
  }
  return fileTypeIcons.default;
}

function formatFileSize(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const [rawData, setRawData] = useState('');
  const [cleanedData, setCleanedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');
  const [expandedId, setExpandedId] = useState(null);
  const [viewingRawId, setViewingRawId] = useState(null);

  // Load all data from Supabase on mount
  useEffect(() => {
    loadFromSupabase();
  }, []);

  const loadFromSupabase = async () => {
    try {
      const res = await fetch('/api/clean');
      const data = await res.json();
      if (data.uploads && data.uploads.length > 0) {
        setUploads(data.uploads.map(u => ({
          ...u,
          keyPoints: u.key_points,
          cleanedText: u.cleaned_text,
          fileName: u.file_name,
          fileType: u.file_type,
          fileSize: u.file_size,
          rawContent: u.raw_content,
          links: u.links || [],
          timestamp: new Date(u.created_at).toLocaleString(),
        })));
      }
    } catch { /* silent */ }
  };

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const readFileAsText = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileSelect = async (e) => {
    const file = e.dataTransfer?.files?.[0] || e.target?.files?.[0];
    if (!file) return;
    e.preventDefault?.();
    setDragOver(false);
    setSelectedFile(file);

    const textTypes = ['text/', 'application/json', 'application/xml', 'application/csv'];
    if (textTypes.some(t => file.type.startsWith(t)) || file.name.match(/\.(txt|csv|json|md|xml|log|py|js|html|css)$/i)) {
      try {
        const text = await readFileAsText(file);
        setRawData(text);
      } catch { /* Not a text file */ }
    }
  };

  const handleClean = async () => {
    if (!rawData.trim() && !selectedFile) return;
    setLoading(true);
    setError('');
    setCleanedData(null);

    try {
      let body = {};

      if (selectedFile) {
        const base64 = await readFileAsBase64(selectedFile);
        body = {
          fileBase64: base64,
          mimeType: selectedFile.type || 'application/octet-stream',
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
        };
        if (rawData.trim()) body.rawData = rawData;
      } else {
        body = { rawData };
      }

      const res = await fetch('/api/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setCleanedData(data.cleaned);

      // Reload from Supabase to get the saved version with all fields
      await loadFromSupabase();
      setActiveTab('results');
    } catch (err) {
      setError(err.message || 'Failed to clean data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="page-header" id="upload-header">
        <h1>Upload & <span className="gradient-text">Clean Data</span></h1>
        <p>Upload any file — Gemini AI analyzes, extracts links, and structures it. All uploads are saved permanently.</p>
      </div>

      {/* Tabs */}
      <div className="tabs" id="upload-tabs" style={{ marginBottom: '32px' }}>
        {[
          { key: 'upload', label: '📤 Upload & Analyze' },
          { key: 'files', label: `📁 Uploaded Files (${uploads.length})` },
          { key: 'results', label: `✅ Analysis Results (${uploads.length})` },
        ].map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div>
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileSelect}
              onClick={() => document.getElementById('file-input')?.click()}
              id="upload-drop-zone"
            >
              <div className="upload-icon">📂</div>
              <div className="upload-text"><strong>Drop any file here</strong> or click to browse</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                Supports: Images, PDFs, Word Docs, Text, Code, CSV, JSON, and more
              </div>
              <input type="file" id="file-input" style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>

            {selectedFile && (
              <div style={{ marginTop: '12px', padding: '12px 16px', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '1.3rem' }}>{getFileIcon(selectedFile.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}</div>
                </div>
                <button onClick={() => { setSelectedFile(null); setRawData(''); }} style={{ color: 'var(--text-muted)', fontSize: '1.2rem', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
              </div>
            )}

            <div style={{ margin: '16px 0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>— or paste your data below —</div>

            <textarea value={rawData} onChange={(e) => setRawData(e.target.value)}
              placeholder="Paste your messy OCR data, research notes, or any unstructured Tamil OCR information here..."
              id="raw-data-input"
              style={{ width: '100%', minHeight: '180px', padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', lineHeight: '1.7' }}
            />

            <button className="btn-primary" onClick={handleClean} disabled={loading || (!rawData.trim() && !selectedFile)}
              style={{ marginTop: '16px', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }} id="clean-data-btn">
              {loading ? (<><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Analyzing with AI...</>) : ('🤖 Analyze & Structure with Gemini')}
            </button>

            {error && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '0.88rem' }}>{error}</div>
            )}
          </div>

          {/* Latest Result Preview */}
          <div>
            {cleanedData ? (
              <div className="glass-card" id="cleaned-output">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>✓</span>
                  <h3 style={{ fontWeight: 700 }}>Analysis Complete</h3>
                </div>
                <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Title</div><div style={{ fontWeight: 600 }}>{cleanedData.title}</div></div>
                <div style={{ marginBottom: '12px' }}><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Summary</div><p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>{cleanedData.summary}</p></div>
                {cleanedData.links && cleanedData.links.length > 0 && (
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>🔗 Extracted Links</div>
                    {cleanedData.links.map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', marginBottom: '6px', color: 'var(--accent-secondary)', fontSize: '0.85rem', textDecoration: 'none', border: '1px solid var(--border-glass)' }}>
                        <div style={{ fontWeight: 600 }}>{link.url}</div>
                        {link.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '2px' }}>{link.description}</div>}
                      </a>
                    ))}
                  </div>
                )}
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button className="btn-secondary" onClick={() => setActiveTab('results')} style={{ fontSize: '0.85rem' }}>View Full Details in Results Tab →</button>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 28px', opacity: 0.6 }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧹</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Analysis Yet</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Upload a file or paste data and click &quot;Analyze&quot; to see the AI-structured result here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files Tab — Shows all files from Supabase */}
      {activeTab === 'files' && (
        <div>
          {uploads.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Files Uploaded Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Go to the Upload tab to add files. All uploads are saved permanently.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((file) => (
                <div className="glass-card" key={file.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{getFileIcon(file.fileType || file.file_type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.fileName || file.file_name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {formatFileSize(file.fileSize || file.file_size)} • {file.fileType || file.file_type || 'Unknown'} • {file.timestamp}
                      </div>
                    </div>
                    <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{file.category}</span>
                  </div>

                  {/* Quick summary */}
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '12px' }}>{file.summary}</p>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => setViewingRawId(viewingRawId === file.id ? null : file.id)}>
                      {viewingRawId === file.id ? '✕ Hide' : '📄 View Original'}
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      onClick={() => { setExpandedId(file.id); setActiveTab('results'); }}>
                      ✅ View Analysis
                    </button>
                  </div>

                  {/* Original content viewer */}
                  {viewingRawId === file.id && (
                    <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', maxHeight: '400px', overflow: 'auto' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>📄 Original Content</div>
                      <pre style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>
                        {file.rawContent || file.raw_content || 'Original text content not available for this file type.'}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis Results Tab — Expandable */}
      {activeTab === 'results' && (
        <div>
          {uploads.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Analyses Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Upload and analyze data to see structured results here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((u) => {
                const isExpanded = expandedId === u.id;
                return (
                  <div className="glass-card" key={u.id} onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease', border: isExpanded ? '1px solid rgba(201,48,44,0.4)' : undefined }}>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.1rem', transition: 'transform 0.3s', transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          <h3 style={{ fontWeight: 700 }}>{u.title}</h3>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '26px' }}>
                          📁 {u.fileName || u.file_name || 'Text Input'} &nbsp;•&nbsp; 📅 {u.timestamp}
                        </div>
                      </div>
                      <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{u.category}</span>
                    </div>

                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '12px', paddingLeft: '26px' }}>{u.summary}</p>

                    {!isExpanded && u.keyPoints && u.keyPoints.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '26px' }}>
                        {u.keyPoints.slice(0, 3).map((point, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                            {typeof point === 'string' && point.length > 50 ? point.slice(0, 50) + '...' : point}
                          </span>
                        ))}
                        {u.keyPoints.length > 3 && <span style={{ padding: '4px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>+{u.keyPoints.length - 3} more</span>}
                      </div>
                    )}

                    {isExpanded && (
                      <div style={{ paddingLeft: '26px', marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                        {u.keyPoints && u.keyPoints.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>📌 All Key Points</div>
                            {u.keyPoints.map((point, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.88rem' }}>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{i + 1}.</span>
                                <span style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{point}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Links extracted from the file */}
                        {u.links && u.links.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>🔗 Extracted Links</div>
                            {u.links.map((link, i) => (
                              <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                                style={{ display: 'block', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', textDecoration: 'none', border: '1px solid var(--border-glass)', transition: 'border-color 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(201,48,44,0.5)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-glass)'}>
                                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all' }}>↗ {link.url}</div>
                                {link.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '3px' }}>{link.description}</div>}
                              </a>
                            ))}
                          </div>
                        )}

                        {(u.cleanedText || u.cleaned_text) && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>📄 Full Cleaned Text</div>
                            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8', maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--border-glass)' }}>
                              {u.cleanedText || u.cleaned_text}
                            </div>
                          </div>
                        )}

                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>ℹ️ Source Information</div>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid var(--border-glass)' }}>
                            <div style={{ marginBottom: '4px' }}><strong>File:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.fileName || u.file_name || 'Direct text input'}</span></div>
                            {u.fileType && <div style={{ marginBottom: '4px' }}><strong>Type:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.fileType}</span></div>}
                            {u.fileSize > 0 && <div style={{ marginBottom: '4px' }}><strong>Size:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatFileSize(u.fileSize)}</span></div>}
                            <div style={{ marginBottom: '4px' }}><strong>Analyzed:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.timestamp}</span></div>
                            <div><strong>AI Model:</strong> <span style={{ color: 'var(--text-secondary)' }}>Google Gemini</span></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {!isExpanded && <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to view full details →</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
