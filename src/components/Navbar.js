"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard', color: 'var(--accent-cyan)', glow: 'rgba(6,182,212,0.3)' },
  { href: '/ingest', label: 'Ingestion Hub', color: 'var(--accent-crimson)', glow: 'rgba(225,29,72,0.3)', badge: true },
  { href: '/chat', label: 'Intel Chat', color: '#A78BFA', glow: 'rgba(139,92,246,0.3)' },
];

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (pathname === '/login' || pathname === '/register' || (pathname === '/' && !session)) return null;

  const isActive = (path) => pathname === path;

  // Derive user initials for avatar
  const initials = session?.user?.name
    ? session.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <nav className="ultra-glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.65rem 2rem',
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        <Link href="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ 
            fontSize: '1.35rem', 
            margin: 0, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            fontWeight: 700,
            color: 'var(--text-main)',
          }}>
            <span style={{ color: 'var(--accent-cyan)', textShadow: 'var(--shadow-neon-cyan)', animation: 'pulseCyan 3s infinite' }}>⚡</span> Intel Hub
          </h1>
        </Link>
        
        {session && (
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            {NAV_LINKS.map(link => {
              const active = isActive(link.href);
              return (
                <Link key={link.href} href={link.href} style={{
                  textDecoration: 'none',
                  padding: '0.5rem 1.1rem',
                  borderRadius: '999px',
                  fontWeight: 600,
                  fontSize: '0.875rem',
                  transition: 'all 0.25s ease',
                  background: active ? `${link.color}1A` : 'transparent',
                  color: active ? link.color : 'var(--text-muted)',
                  border: active ? `1px solid ${link.color}50` : '1px solid transparent',
                  boxShadow: active ? `0 0 12px ${link.glow}` : 'none',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}>
                  {link.label}
                  {link.badge && (
                    <span style={{
                      width: '6px', height: '6px',
                      borderRadius: '50%',
                      background: 'var(--accent-crimson)',
                      boxShadow: 'var(--shadow-neon)',
                      flexShrink: 0,
                      animation: 'pulse-border 2s infinite'
                    }} />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {session && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Avatar + Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 800, color: '#fff',
              flexShrink: 0
            }}>
              {initials}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.2 }}>
              <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-muted)' }}>Agent</div>
              <strong style={{ color: 'var(--text-main)', fontWeight: 600 }}>{session.user?.name?.toUpperCase() || 'UNKNOWN'}</strong>
            </div>
          </div>

          <button 
            onClick={() => signOut()} 
            className="btn-innovative"
            style={{ padding: '0.4rem 1.1rem', fontSize: '0.78rem', letterSpacing: '0.5px' }}
          >
            DISCONNECT
          </button>
        </div>
      )}
    </nav>
  );
}
