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
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [activeTab, setActiveTab] = useState('upload');

  // Load past uploads from Supabase on mount
  useEffect(() => {
    async function loadPastUploads() {
      try {
        const res = await fetch('/api/clean');
        const data = await res.json();
        if (data.uploads && data.uploads.length > 0) {
          setUploads(data.uploads.map(u => ({
            ...u,
            keyPoints: u.key_points,
            cleanedText: u.cleaned_text,
            fileName: u.file_name,
            timestamp: new Date(u.created_at).toLocaleString(),
          })));
        }
      } catch { /* silent */ }
    }
    loadPastUploads();
  }, []);

  const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
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

    // Save original file to the uploaded files list
    const fileUrl = URL.createObjectURL(file);
    setUploadedFiles(prev => [
      { name: file.name, size: file.size, type: file.type, url: fileUrl, timestamp: new Date().toLocaleString(), id: Date.now() },
      ...prev,
    ]);

    // For text-based files, also show content in textarea
    const textTypes = ['text/', 'application/json', 'application/xml', 'application/csv'];
    if (textTypes.some(t => file.type.startsWith(t)) || file.name.match(/\.(txt|csv|json|md|xml|log|py|js|html|css)$/i)) {
      try {
        const text = await readFileAsText(file);
        setRawData(text);
      } catch {
        // Not a text file, that's fine
      }
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
        };
        // Also include text if available
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
      setUploads(prev => [
        { ...data.cleaned, fileName: selectedFile?.name || 'Text Input', timestamp: new Date().toLocaleString(), id: Date.now() },
        ...prev,
      ]);
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
        <p>Upload any file — images, PDFs, text, code — Gemini AI will analyze and structure it for you.</p>
      </div>

      {/* Tabs */}
      <div className="tabs" id="upload-tabs" style={{ marginBottom: '32px' }}>
        {[
          { key: 'upload', label: '📤 Upload & Analyze' },
          { key: 'files', label: `📁 Uploaded Files (${uploadedFiles.length})` },
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
              <div className="upload-text">
                <strong>Drop any file here</strong> or click to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '8px' }}>
                Supports: Images, PDFs, Text, Code, CSV, JSON, and more
              </div>
              <input
                type="file"
                id="file-input"
                style={{ display: 'none' }}
                onChange={handleFileSelect}
              />
            </div>

            {selectedFile && (
              <div style={{
                marginTop: '12px', padding: '12px 16px',
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
                borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '10px',
              }}>
                <span style={{ fontSize: '1.3rem' }}>{getFileIcon(selectedFile.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedFile.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}</div>
                </div>
                <button onClick={() => { setSelectedFile(null); setRawData(''); }} style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>✕</button>
              </div>
            )}

            <div style={{ margin: '16px 0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center' }}>
              — or paste your data below —
            </div>

            <textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              placeholder="Paste your messy OCR data, research notes, or any unstructured Tamil OCR information here..."
              id="raw-data-input"
              style={{
                width: '100%', minHeight: '180px', padding: '16px',
                background: 'var(--bg-glass)', border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
                fontFamily: 'var(--font-sans)', fontSize: '0.9rem', resize: 'vertical',
                outline: 'none', lineHeight: '1.7',
              }}
            />

            <button
              className="btn-primary"
              onClick={handleClean}
              disabled={loading || (!rawData.trim() && !selectedFile)}
              style={{ marginTop: '16px', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
              id="clean-data-btn"
            >
              {loading ? (
                <><div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px' }}></div> Analyzing with AI...</>
              ) : (
                '🤖 Analyze & Structure with Gemini'
              )}
            </button>

            {error && (
              <div style={{ marginTop: '12px', padding: '12px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.3)', borderRadius: 'var(--radius-sm)', color: 'var(--accent-primary)', fontSize: '0.88rem' }}>
                {error}
              </div>
            )}
          </div>

          {/* Output */}
          <div>
            {cleanedData ? (
              <div className="glass-card" id="cleaned-output">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--success)', fontSize: '1.2rem' }}>✓</span>
                  <h3 style={{ fontWeight: 700 }}>Analysis Result</h3>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Title</div>
                  <div style={{ fontWeight: 600 }}>{cleanedData.title}</div>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Category</div>
                  <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                    {cleanedData.category}
                  </span>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Summary</div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>{cleanedData.summary}</p>
                </div>
                {cleanedData.keyPoints && cleanedData.keyPoints.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>Key Points</div>
                    {cleanedData.keyPoints.map((point, i) => (
                      <div key={i} style={{ display: 'flex', gap: '8px', marginBottom: '6px', fontSize: '0.88rem' }}>
                        <span style={{ color: 'var(--accent-primary)' }}>▸</span>
                        <span style={{ color: 'var(--text-secondary)' }}>{point}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Cleaned Text</div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.7', maxHeight: '200px', overflow: 'auto' }}>
                    {cleanedData.cleanedText}
                  </div>
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

      {/* Uploaded Files Tab */}
      {activeTab === 'files' && (
        <div>
          {uploadedFiles.length === 0 ? (
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📁</div>
              <h3 style={{ fontWeight: 700, marginBottom: '8px' }}>No Files Uploaded Yet</h3>
              <p style={{ color: 'var(--text-secondary)' }}>Go to the Upload tab to add files.</p>
            </div>
          ) : (
            <div className="grid-3">
              {uploadedFiles.map((file) => (
                <div className="glass-card" key={file.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2rem' }}>{getFileIcon(file.type)}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatFileSize(file.size)}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{file.timestamp}</span>
                    <a
                      href={file.url}
                      download={file.name}
                      className="btn-secondary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      ↓ Download
                    </a>
                  </div>
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
              <p style={{ color: 'var(--text-secondary)' }}>Upload and analyze data to see structured results here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {uploads.map((u) => (
                <div className="glass-card" key={u.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <h3 style={{ fontWeight: 700, marginBottom: '4px' }}>{u.title}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From: {u.fileName} • {u.timestamp}</div>
                    </div>
                    <span style={{ padding: '4px 10px', background: 'rgba(201,48,44,0.1)', border: '1px solid rgba(201,48,44,0.2)', borderRadius: '50px', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                      {u.category}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7', marginBottom: '12px' }}>{u.summary}</p>
                  {u.keyPoints && u.keyPoints.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {u.keyPoints.slice(0, 4).map((point, i) => (
                        <span key={i} style={{ padding: '4px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border-glass)', borderRadius: '50px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                          {point.length > 60 ? point.slice(0, 60) + '...' : point}
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

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
