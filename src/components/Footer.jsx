export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-links">
          <a href="https://github.com/tesseract-ocr/tesseract" target="_blank" rel="noopener noreferrer">Tesseract GitHub</a>
          <a href="https://en.wikipedia.org/wiki/Tamil_script" target="_blank" rel="noopener noreferrer">Tamil Script Wiki</a>
          <a href="https://supabase.com" target="_blank" rel="noopener noreferrer">Supabase</a>
        </div>
        <p>© {new Date().getFullYear()} Tamil OCR Hub — Built for collaborative learning.</p>
      </div>
    </footer>
  );
}
