'use client';
import { useState, useEffect } from 'react';

const fileTypeIcons = { 'image':'🖼️','application/pdf':'📕','text':'📄','application/json':'📋','video':'🎬','audio':'🎵','default':'📁' };
function getFileIcon(m) { if(!m) return '📁'; for(const [k,v] of Object.entries(fileTypeIcons)) { if(m.startsWith(k)||m===k) return v; } return '📁'; }
function formatFileSize(b) { if(!b) return '—'; if(b<1024) return b+' B'; if(b<1048576) return (b/1024).toFixed(1)+' KB'; return (b/1048576).toFixed(1)+' MB'; }

export default function UploadPage() {
  const [rawData, setRawData] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploads, setUploads] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [expandedId, setExpandedId] = useState(null);
  const [viewingRawId, setViewingRawId] = useState(null);
  const [queue, setQueue] = useState([]); // {name, status:'pending'|'processing'|'done'|'error', error?}

  useEffect(() => { loadFromSupabase(); }, []);

  const loadFromSupabase = async () => {
    try {
      const res = await fetch('/api/clean');
      const data = await res.json();
      if (data.uploads?.length > 0) {
        setUploads(data.uploads.map(u => ({ ...u, keyPoints: u.key_points, cleanedText: u.cleaned_text, fileName: u.file_name, fileType: u.file_type, fileSize: u.file_size, rawContent: u.raw_content, links: u.links || [], timestamp: new Date(u.created_at).toLocaleString() })));
      }
    } catch {}
  };

  const readBase64 = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });

  const handleFileSelect = (e) => {
    const files = e.dataTransfer?.files || e.target?.files;
    if (!files?.length) return;
    e.preventDefault?.();
    setDragOver(false);
    setSelectedFiles(prev => [...prev, ...Array.from(files)]);
  };

  const removeFile = (i) => setSelectedFiles(prev => prev.filter((_, idx) => idx !== i));

  const handleAnalyzeAll = async () => {
    const hasFiles = selectedFiles.length > 0;
    const hasText = rawData.trim().length > 0;
    if (!hasFiles && !hasText) return;

    setLoading(true);
    setError('');

    const items = [];
    if (hasText) items.push({ name: 'Text Input', isText: true, status: 'pending' });
    selectedFiles.forEach(f => items.push({ name: f.name, file: f, status: 'pending' }));
    setQueue([...items]);

    for (let i = 0; i < items.length; i++) {
      items[i].status = 'processing';
      setQueue([...items]);
      try {
        let body;
        if (items[i].isText) {
          body = { rawData };
        } else {
          const b64 = await readBase64(items[i].file);
          body = { fileBase64: b64, mimeType: items[i].file.type || 'application/octet-stream', fileName: items[i].file.name, fileSize: items[i].file.size };
        }
        const res = await fetch('/api/clean', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        items[i].status = 'done';
      } catch (err) {
        items[i].status = 'error';
        items[i].error = err.message;
      }
      setQueue([...items]);
    }

    await loadFromSupabase();
    setSelectedFiles([]);
    setRawData('');
    setLoading(false);
    const errs = items.filter(q => q.status === 'error');
    if (errs.length) setError(`${errs.length} file(s) failed, ${items.length - errs.length} succeeded.`);
    if (items.some(q => q.status === 'done')) setActiveTab('results');
  };

  const doneCount = queue.filter(q => q.status === 'done').length;

  return (
    <div className="container">
      <div className="page-header" id="upload-header">
        <h1>Upload & <span className="gradient-text">Clean Data</span></h1>
        <p>Upload multiple files at once — each is analyzed separately by Gemini AI and merged into your knowledge base.</p>
      </div>

      <div className="tabs" id="upload-tabs" style={{ marginBottom: '32px' }}>
        {[{ key: 'upload', label: '📤 Upload & Analyze' }, { key: 'files', label: `📁 Uploaded Files (${uploads.length})` }, { key: 'results', label: `✅ Analysis Results (${uploads.length})` }].map(tab => (
          <button key={tab.key} className={`tab ${activeTab === tab.key ? 'active' : ''}`} onClick={() => setActiveTab(tab.key)}>{tab.label}</button>
        ))}
      </div>

      {/* Upload Tab */}
      {activeTab === 'upload' && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <div>
            <div className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileSelect}
              onClick={() => document.getElementById('file-input')?.click()}
              id="upload-drop-zone">
              <div className="upload-icon">📂</div>
              <div className="upload-text"><strong>Drop files here</strong> or click to browse</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>Select multiple files — Images, PDFs, Word Docs, Text, Code, CSV, JSON</div>
              <input type="file" id="file-input" multiple style={{ display: 'none' }} onChange={handleFileSelect} />
            </div>

            {/* Selected Files List */}
            {selectedFiles.length > 0 && (
              <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>{selectedFiles.length} file(s) selected:</div>
                {selectedFiles.map((f, i) => (
                  <div key={i} style={{ padding: '8px 12px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{getFileIcon(f.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{formatFileSize(f.size)}</div>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); removeFile(i); }} style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ margin: '16px 0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>— or paste data below —</div>
            <textarea value={rawData} onChange={(e) => setRawData(e.target.value)} placeholder="Paste messy OCR data, research notes, or any unstructured Tamil OCR information here..." id="raw-data-input"
              style={{ width: '100%', minHeight: '140px', padding: '16px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', resize: 'vertical', outline: 'none', lineHeight: '1.7' }} />

            <button className="btn-primary" onClick={handleAnalyzeAll} disabled={loading || (!rawData.trim() && selectedFiles.length === 0)}
              style={{ marginTop: '16px', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }} id="clean-data-btn">
              {loading ? (<><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Analyzing {doneCount}/{queue.length}...</>) : (`🤖 Analyze ${selectedFiles.length > 1 ? selectedFiles.length + ' Files' : ''} with Gemini`)}
            </button>

            {error && (<div style={{ marginTop: '12px', padding: '12px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '0.88rem' }}>{error}</div>)}
          </div>

          {/* Processing Queue / Status */}
          <div>
            {queue.length > 0 ? (
              <div className="glass-card">
                <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Processing Queue</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {queue.map((q, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: q.status === 'done' ? 'rgba(34,197,94,0.08)' : q.status === 'error' ? 'rgba(201,48,44,0.08)' : q.status === 'processing' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-sm)', border: `1px solid ${q.status === 'done' ? 'rgba(34,197,94,0.2)' : q.status === 'error' ? 'rgba(201,48,44,0.2)' : q.status === 'processing' ? 'rgba(59,130,246,0.2)' : 'var(--border-glass)'}` }}>
                      <span style={{ fontSize: '1.1rem' }}>
                        {q.status === 'done' ? '✅' : q.status === 'error' ? '❌' : q.status === 'processing' ? '⏳' : '⬜'}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.name}</div>
                        {q.error && <div style={{ fontSize: '0.78rem', color: 'var(--accent-primary)' }}>{q.error}</div>}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{q.status}</span>
                    </div>
                  ))}
                </div>
                {/* Progress bar */}
                <div style={{ marginTop: '16px', height: '4px', background: 'var(--bg-primary)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${queue.length > 0 ? (queue.filter(q => q.status !== 'pending').length / queue.length) * 100 : 0}%`, background: 'var(--accent-gradient)', transition: 'width 0.5s ease' }}></div>
                </div>
              </div>
            ) : (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 28px', opacity: 0.6 }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🧹</div>
                <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>Ready to Analyze</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Select files or paste data, then click Analyze. Each file is processed separately and merged into the knowledge base.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uploaded Files Tab */}
      {activeTab === 'files' && (
        <div>
          {uploads.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Files Uploaded Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Go to the Upload tab to add files.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((file) => (
                <div className="glass-card" key={file.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{getFileIcon(file.fileType)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.fileName}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatFileSize(file.fileSize)} • {file.fileType || 'Unknown'} • {file.timestamp}</div>
                    </div>
                    <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{file.category}</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6', marginBottom: '12px' }}>{file.summary}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => setViewingRawId(viewingRawId === file.id ? null : file.id)}>
                      {viewingRawId === file.id ? '✕ Hide' : '📄 View Original'}
                    </button>
                    <button className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }} onClick={() => { setExpandedId(file.id); setActiveTab('results'); }}>✅ View Analysis</button>
                  </div>
                  {viewingRawId === file.id && (
                    <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-glass)', maxHeight: '400px', overflow: 'auto' }}>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>📄 Original Content</div>
                      <pre style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0 }}>{file.rawContent || 'Original text not available for this file type.'}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analysis Results Tab */}
      {activeTab === 'results' && (
        <div>
          {uploads.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Analyses Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Upload and analyze data to see results here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((u) => {
                const isExp = expandedId === u.id;
                return (
                  <div className="glass-card" key={u.id} onClick={() => setExpandedId(isExp ? null : u.id)}
                    style={{ cursor: 'pointer', transition: 'all 0.3s ease', border: isExp ? '1px solid rgba(201,48,44,0.4)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ fontSize: '1.1rem', transition: 'transform 0.3s', transform: isExp ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
                          <h3 style={{ fontWeight: 700 }}>{u.title}</h3>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', paddingLeft: '26px' }}>📁 {u.fileName} &nbsp;•&nbsp; 📅 {u.timestamp}</div>
                      </div>
                      <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>{u.category}</span>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '12px', paddingLeft: '26px' }}>{u.summary}</p>

                    {!isExp && u.keyPoints?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingLeft: '26px' }}>
                        {u.keyPoints.slice(0, 3).map((p, i) => (
                          <span key={i} style={{ padding: '4px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{typeof p === 'string' && p.length > 50 ? p.slice(0, 50) + '...' : p}</span>
                        ))}
                        {u.keyPoints.length > 3 && <span style={{ padding: '4px 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>+{u.keyPoints.length - 3} more</span>}
                      </div>
                    )}

                    {isExp && (
                      <div style={{ paddingLeft: '26px', marginTop: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }} onClick={(e) => e.stopPropagation()}>
                        {u.keyPoints?.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>📌 All Key Points</div>
                            {u.keyPoints.map((p, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '8px', fontSize: '0.88rem' }}>
                                <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{i + 1}.</span>
                                <span style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>{p}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {u.links?.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px', fontWeight: 600 }}>🔗 Extracted Links</div>
                            {u.links.map((lnk, i) => (
                              <a key={i} href={lnk.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: 'var(--radius-sm)', marginBottom: '8px', textDecoration: 'none', border: '1px solid var(--border-glass)' }}>
                                <div style={{ color: 'var(--accent-secondary)', fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-all' }}>↗ {lnk.url}</div>
                                {lnk.description && <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '3px' }}>{lnk.description}</div>}
                              </a>
                            ))}
                          </div>
                        )}
                        {(u.cleanedText || u.cleaned_text) && (
                          <div style={{ marginBottom: '20px' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>📄 Full Cleaned Text</div>
                            <div style={{ background: 'rgba(0,0,0,0.35)', padding: '16px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.8', maxHeight: '400px', overflow: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--border-glass)' }}>{u.cleanedText || u.cleaned_text}</div>
                          </div>
                        )}
                        <div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', fontWeight: 600 }}>ℹ️ Source Information</div>
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', border: '1px solid var(--border-glass)' }}>
                            <div style={{ marginBottom: '4px' }}><strong>File:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.fileName || 'Direct text input'}</span></div>
                            {u.fileType && <div style={{ marginBottom: '4px' }}><strong>Type:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.fileType}</span></div>}
                            {u.fileSize > 0 && <div style={{ marginBottom: '4px' }}><strong>Size:</strong> <span style={{ color: 'var(--text-secondary)' }}>{formatFileSize(u.fileSize)}</span></div>}
                            <div><strong>Analyzed:</strong> <span style={{ color: 'var(--text-secondary)' }}>{u.timestamp}</span></div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!isExp && <div style={{ textAlign: 'right', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Click to view full details →</div>}
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
