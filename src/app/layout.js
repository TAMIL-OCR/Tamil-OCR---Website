import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AIChat from '@/components/AIChat';

export const metadata = {
  title: 'Tamil OCR Hub — Collaborative Learning Platform',
  description: 'A comprehensive platform for learning Tamil OCR, Tesseract training, and collaborative research. Powered by Gemini AI.',
  keywords: 'Tamil, OCR, Tesseract, Tamil Script, Machine Learning, AI, Training',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <AIChat />
      </body>
    </html>
  );
}
