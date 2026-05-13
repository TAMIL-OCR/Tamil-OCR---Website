'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/learn', label: 'Learn' },
  { href: '/training', label: 'Training' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/upload', label: 'Upload' },
  { href: '/research', label: 'Research' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        <Link href="/" className="navbar-logo">
          <span>தமிழ்</span>
          <span className="logo-accent">OCR Hub</span>
        </Link>
        <div className={`navbar-links ${open ? 'open' : ''}`}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={pathname === link.href ? 'active' : ''}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button className="mobile-menu-btn" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? '✕' : '☰'}
        </button>
      </div>
    </nav>
  );
}
