"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

// Animated count-up hook
function useCountUp(target, duration = 1200) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (target === 0) { setCount(0); return; }
    const step = Math.ceil(target / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, target);
      setCount(current);
      if (current >= target) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
}

export default function DashboardPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const meetingCount = useCountUp(meetings.length);

  useEffect(() => {
    fetch('/api/meetings')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMeetings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() =>
    meetings.filter(m => m.title?.toLowerCase().includes(search.toLowerCase())),
    [meetings, search]
  );

  const lastActivity = meetings.length > 0
    ? new Date(Math.max(...meetings.map(m => new Date(m.createdAt)))).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
    : '—';

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="header fade-up" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
        <h1 style={{
          fontSize: '3.5rem',
          marginBottom: '0.5rem',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Strategic Archive</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Overview of parsed intelligence reports and overall system sentiment logic.
        </p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }} className="fade-up">
        <div className="ultra-glass" style={{ padding: '1.75rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.75rem' }}>Total Intel Docs</div>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{meetingCount}</div>
        </div>

        <div className="ultra-glass" style={{ padding: '1.75rem', textAlign: 'center', borderColor: 'rgba(6,182,212,0.3)' }}>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.75rem' }}>Neural Engine</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
            <span style={{ width: '12px', height: '12px', background: 'var(--accent-cyan)', borderRadius: '50%', display: 'inline-block', boxShadow: 'var(--shadow-neon-cyan)', animation: 'pulse-border 2s infinite' }}></span>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--accent-cyan)', textShadow: 'var(--shadow-neon-cyan)', letterSpacing: '2px' }}>ACTIVE</span>
          </div>
        </div>

        <div className="ultra-glass" style={{ padding: '1.75rem', textAlign: 'center', borderColor: 'rgba(139,92,246,0.3)' }}>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '2px', marginBottom: '0.75rem' }}>Last Activity</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#C4B5FD', lineHeight: 1.4 }}>{lastActivity}</div>
        </div>

        <Link href="/ingest" style={{ textDecoration: 'none' }}>
          <div className="ultra-glass highlight-hover" style={{ padding: '1.75rem', textAlign: 'center', height: '100%', borderColor: 'rgba(225,29,72,0.3)', background: 'linear-gradient(135deg, rgba(225,29,72,0.05), transparent)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
            <div style={{ fontSize: '2.5rem', color: 'var(--accent-crimson)', textShadow: 'var(--shadow-neon)', lineHeight: 1 }}>+</div>
            <div style={{ color: 'var(--text-main)', fontSize: '1rem', fontWeight: 700, letterSpacing: '1px' }}>Import Intelligence</div>
          </div>
        </Link>
      </div>

      {/* Search Bar */}
      <div className="fade-up" style={{ animationDelay: '0.15s', marginBottom: '2rem' }}>
        <div style={{ position: 'relative', maxWidth: '480px' }}>
          <span style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1rem', pointerEvents: 'none' }}>🔍</span>
          <input
            className="input-futuristic"
            placeholder="Search intelligence archive..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '3rem', borderRadius: '999px' }}
          />
        </div>
      </div>

      {/* Meetings Grid */}
      <div className="fade-up" style={{ animationDelay: '0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>📂</span> Processed Intel
          </h2>
          {search && <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''} found</span>}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="loader-aurora"></div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="ultra-glass" style={{ padding: '5rem 2rem', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.15)' }}>
            <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.3 }}>
              {search ? '🔎' : '📭'}
            </span>
            <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontSize: '1.5rem' }}>
              {search ? 'No matches found' : 'Archive Empty'}
            </h3>
            <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>
              {search ? `No reports matching "${search}".` : 'Navigate to the Ingestion Hub to process your first operative transmit.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {filtered.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                <div className="ultra-glass meeting-card" style={{ transition: 'all 0.3s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: '1.4', flex: 1 }}>{m.title}</h3>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 700, background: 'rgba(6,182,212,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.25)', fontSize: '0.75rem', flexShrink: 0, marginLeft: '1rem' }}>
                      #{m.id}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                    <span style={{ color: 'var(--text-muted)' }}>
                      {new Date(m.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                    <span style={{ color: 'var(--accent-purple)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      VIEW REPORT →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

