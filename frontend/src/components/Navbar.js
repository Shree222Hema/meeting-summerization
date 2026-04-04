"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === '/login' || pathname === '/register') return null;

  const isActive = (path) => pathname === path;

  return (
    <nav className="ultra-glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.75rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTop: 'none',
      borderLeft: 'none',
      borderRight: 'none',
      borderRadius: 0,
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            fontSize: '1.4rem', 
            margin: 0, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontWeight: 700,
            color: 'var(--text-main)',
            textShadow: '0 0 10px rgba(255,255,255,0.3)'
          }}>
            <span style={{ color: 'var(--accent-cyan)', textShadow: 'var(--shadow-neon-cyan)' }}>⚡</span> Intel Hub
          </h1>
        </Link>
        
        {session && (
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link href="/" style={{
              textDecoration: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              background: isActive('/') ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: isActive('/') ? 'var(--accent-cyan)' : 'var(--text-muted)',
              border: isActive('/') ? '1px solid rgba(6, 182, 212, 0.3)' : '1px solid transparent',
              boxShadow: isActive('/') ? 'var(--shadow-neon-cyan)' : 'none'
            }}>Dashboard</Link>

            <Link href="/ingest" style={{
              textDecoration: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              background: isActive('/ingest') ? 'rgba(225, 29, 72, 0.15)' : 'transparent',
              color: isActive('/ingest') ? 'var(--accent-crimson)' : 'var(--text-muted)',
              border: isActive('/ingest') ? '1px solid rgba(225, 29, 72, 0.3)' : '1px solid transparent',
              boxShadow: isActive('/ingest') ? 'var(--shadow-neon)' : 'none'
            }}>Ingestion Hub</Link>

            <Link href="/chat" style={{
              textDecoration: 'none',
              padding: '0.5rem 1.25rem',
              borderRadius: '999px',
              fontWeight: 600,
              fontSize: '0.9rem',
              transition: 'all 0.3s',
              background: isActive('/chat') ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: isActive('/chat') ? '#A78BFA' : 'var(--text-muted)',
              border: isActive('/chat') ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid transparent',
              boxShadow: isActive('/chat') ? '0 0 15px var(--accent-purple-glow)' : 'none'
            }}>Intel Chat</Link>
          </div>
        )}
      </div>

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Agent: <strong style={{ color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px' }}>{session.user?.name?.toUpperCase() || 'UNKNOWN'}</strong>
          </div>
          <button 
            onClick={() => signOut()} 
            className="btn-innovative"
            style={{ padding: '0.4rem 1.25rem', fontSize: '0.8rem' }}
          >
            DISCONNECT
          </button>
        </div>
      )}
    </nav>
  );
}
