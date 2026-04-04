"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/meetings/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Document Not Found or Access Denied");
        return res.json();
      })
      .then(data => {
        setMeeting(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [params.id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to permanently purge this intelligence report?")) return;
    
    try {
      const res = await fetch(`/api/meetings/${params.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/');
    } catch (err) {
      alert("Purge operation failed.");
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div className="loader-aurora" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
      </div>
    );
  }

  if (error || !meeting) {
    return (
      <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--accent-crimson)', fontWeight: 600, fontSize: '2rem', textShadow: 'var(--shadow-neon)' }}>⚠️ {error}</h2>
        <button onClick={() => router.push('/')} className="btn-innovative primary-action" style={{ marginTop: '2rem' }}>RETURN TO ARCHIVE</button>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3.5rem' }}>
        <div>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontWeight: 600, fontSize: '0.9rem', padding: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.2rem', textShadow: 'var(--shadow-neon-cyan)' }}>←</span> BACK TO ARCHIVE
          </button>
          <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--text-main)', textShadow: '0 0 20px rgba(255,255,255,0.2)' }}>{meeting.title}</h1>
          <div style={{ color: 'var(--text-dim)', fontSize: '0.95rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <span><span style={{color:'var(--accent-cyan)'}}>DATE:</span> {new Date(meeting.createdAt).toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' })}</span>
            <span style={{ background: 'rgba(6, 182, 212, 0.1)', padding: '0.25rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(6,182,212,0.3)', color: 'var(--accent-cyan)', fontWeight: 600, letterSpacing: '1px' }}>ID: {meeting.id}</span>
          </div>
        </div>
        
        <button className="btn-innovative" onClick={handleDelete} style={{ background: 'rgba(225, 29, 72, 0.1)', color: 'var(--accent-crimson)', borderColor: 'rgba(225, 29, 72, 0.3)', boxShadow: 'var(--shadow-neon)' }}>
          PURGE REPORT
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(0, 1fr)', gap: '2rem' }}>
        
        {/* Left Column: Summary & Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <section className="ultra-glass fade-up" style={{ padding: '2.5rem', animationDelay: '0.1s' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{color: 'var(--accent-cyan)', textShadow: 'var(--shadow-neon-cyan)'}}>■</span> Executive Synopsis
            </h2>
            {meeting.summary ? (
              <p style={{ lineHeight: '1.8', color: 'var(--text-main)', fontSize: '1.1rem', letterSpacing: '0.3px', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{meeting.summary.content}</p>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Synopsis generation failed.</p>
            )}
            
            <div style={{ marginTop: '2rem', background: 'rgba(0,0,0,0.3)', padding: '1.25rem 1.5rem', borderRadius: '12px', borderLeft: `4px solid ${meeting.sentiment === 'positive' ? 'var(--accent-cyan)' : meeting.sentiment === 'negative' ? 'var(--accent-crimson)' : 'var(--accent-purple)'}` }}>
              <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px' }}>Neural Sentiment Analysis</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 600, textTransform: 'capitalize', marginTop: '0.25rem', color: 'var(--text-main)', textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>
                {meeting.sentiment || 'Neutral'}
              </div>
            </div>
          </section>

          <section className="ultra-glass fade-up" style={{ animationDelay: '0.2s', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{color: 'var(--accent-purple)', textShadow: '0 0 15px rgba(139, 92, 246, 0.5)'}}>▶</span> Tactical Deliverables
            </h2>
            {meeting.actionItems && meeting.actionItems.length > 0 ? (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {meeting.actionItems.map((item, idx) => (
                  <li key={idx} style={{ 
                    background: 'rgba(255,255,255,0.02)', 
                    padding: '1.25rem', 
                    borderRadius: '12px', 
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1.25rem',
                    color: 'var(--text-main)',
                    transition: 'all 0.3s ease',
                  }} className="highlight-hover">
                    <span style={{ 
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(139, 92, 246, 0.15)',
                      color: '#C4B5FD',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.9rem',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)'
                    }}>{idx + 1}</span>
                    <span style={{ lineHeight: '1.6', fontSize: '1.05rem', letterSpacing: '0.2px' }}>{item.content}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No tactical deliverables detected.</p>
            )}
          </section>
        </div>

        {/* Right Column: Transcript */}
        <div>
          <section className="ultra-glass fade-up" style={{ animationDelay: '0.3s', height: '100%', display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', marginTop: 0, borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem', color: 'var(--text-main)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{color: 'var(--text-dim)'}}>≡</span> Raw Telemetry
            </h2>
            <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.4)', padding: '1.5rem', borderRadius: '12px', color: 'var(--text-dim)', fontSize: '0.95rem', lineHeight: '1.7', whiteSpace: 'pre-wrap', maxHeight: '700px', border: '1px solid rgba(255,255,255,0.02)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
              {meeting.transcript || "No transcript available."}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
