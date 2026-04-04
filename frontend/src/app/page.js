"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="header fade-up" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3.5rem', 
          marginBottom: '0.5rem', 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #A1A1AA 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 40px rgba(255,255,255,0.1)'
        }}>Strategic Archive</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Overview of parsed intelligence reports and overall system sentiment logic.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem', marginBottom: '4rem' }} className="fade-up">
        {/* Total Documents Card */}
        <div className="ultra-glass highlight-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px' }}>Total Intel Documents</div>
          <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'var(--text-main)', textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>{meetings.length}</div>
        </div>
        
        {/* Status Card */}
        <div className="ultra-glass highlight-hover" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', textAlign: 'center', borderColor: 'rgba(6, 182, 212, 0.3)' }}>
          <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '2px' }}>Neural Engine Status</div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginTop: '0.5rem' }}>
             <span style={{ width: '20px', height: '20px', background: 'var(--accent-cyan)', borderRadius: '50%', display: 'inline-block', boxShadow: 'var(--shadow-neon-cyan)', animation: 'pulse-border 2s infinite' }}></span>
             <span style={{ textShadow: 'var(--shadow-neon-cyan)' }}>ACTIVE</span>
          </div>
        </div>
        
        {/* Import Action Card */}
        <Link href="/ingest" style={{ textDecoration: 'none' }} className="ultra-glass highlight-hover">
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', height: '100%', borderColor: 'rgba(225, 29, 72, 0.3)', background: 'linear-gradient(135deg, rgba(225,29,72,0.05), transparent)' }}>
            <div style={{ fontSize: '3rem', color: 'var(--text-main)', textShadow: 'var(--shadow-neon)' }}>+</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 700, letterSpacing: '1px' }}>Import Intelligence</div>
            </div>
          </div>
        </Link>
      </div>

      <div className="fade-up" style={{ animationDelay: '0.2s' }}>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-main)', fontWeight: 600 }}>
          <span style={{textShadow: '0 0 10px rgba(255,255,255,0.5)'}}>📂</span> Processed Intel
        </h2>
        
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
            <div className="loader-aurora"></div>
          </div>
        ) : meetings.length === 0 ? (
          <div className="ultra-glass" style={{ padding: '5rem 2rem', textAlign: 'center', borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.2)' }}>
             <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem', opacity: 0.3, filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))' }}>📭</span>
             <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)', fontWeight: 600, fontSize: '1.5rem' }}>Archive Empty</h3>
             <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem' }}>Navigate to the Ingestion Hub to process your first operative transmit.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {meetings.map((m) => (
              <Link key={m.id} href={`/meetings/${m.id}`} style={{ textDecoration: 'none' }}>
                <div className="ultra-glass meeting-card">
                  <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.25rem', color: 'var(--text-main)', fontWeight: 600, lineHeight: '1.4' }}>{m.title}</h3>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-dim)' }}>{new Date(m.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, background: 'rgba(6, 182, 212, 0.1)', padding: '0.3rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)', boxShadow: '0 0 10px rgba(6,182,212,0.1)' }}>
                      ID: {m.id}
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
