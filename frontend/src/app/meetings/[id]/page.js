"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Simplified Sentiment Gauge Component
const SentimentGauge = ({ sentiment, score }) => {
  const color = sentiment === 'positive' ? 'var(--accent-cyan)' : sentiment === 'negative' ? 'var(--accent-crimson)' : 'var(--accent-purple)';
  const normalizedScore = score || 50;
  const strokeDasharray = 251.2; // 2 * PI * 40
  const offset = strokeDasharray - (normalizedScore / 100) * strokeDasharray;

  return (
    <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
        <circle 
          cx="50" cy="50" r="40" 
          fill="transparent" 
          stroke={color} 
          strokeWidth="8" 
          strokeDasharray={strokeDasharray}
          style={{ 
            strokeDashoffset: offset,
            transition: 'stroke-dashoffset 1.5s ease-in-out',
            transform: 'rotate(-90deg)',
            transformOrigin: '50% 50%',
            filter: `drop-shadow(0 0 8px ${color}88)`
          }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>{normalizedScore}%</div>
        <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', color: 'var(--text-dim)', letterSpacing: '1px' }}>Intensity</div>
      </div>
    </div>
  );
};

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const synthRef = useRef(null);

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

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
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

  const toggleNarration = () => {
    if (!window.speechSynthesis) return alert("Speech synthesis not supported in this browser.");

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      const text = meeting.summary?.content || "No summary available for narration.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsNarrating(false);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      
      // Try to find a professional sounding voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'));
      if (preferred) utterance.voice = preferred;

      window.speechSynthesis.speak(utterance);
      setIsNarrating(true);
    }
  };

  // Mocked topic extraction from summary for innovative UI
  const getTopics = () => {
    if (!meeting?.summary?.content) return [];
    return meeting.summary.content
      .split(/\s+/)
      .filter(w => w.length > 5 && /^[a-zA-Z]+$/.test(w))
      .slice(0, 6)
      .map(w => w.replace(/[.,]/g, ''));
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
        <h2 className="gradient-text-crimson" style={{ fontSize: '2rem' }}>⚠️ {error}</h2>
        <button onClick={() => router.push('/')} className="btn-innovative primary-action" style={{ marginTop: '2rem' }}>RETURN TO ARCHIVE</button>
      </div>
    );
  }

  const sentimentType = (meeting.summary?.sentimentLabel || 'neutral').toLowerCase();
  const sentimentBorderClass = sentimentType.includes('pos') ? 'border-sentiment-pos' : sentimentType.includes('neg') ? 'border-sentiment-neg' : 'border-sentiment-neu';
  const sentimentBgClass = sentimentType.includes('pos') ? 'bg-sentiment-pos' : sentimentType.includes('neg') ? 'bg-sentiment-neg' : 'bg-sentiment-neu';

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      {/* Header Section */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem' }}>
        <div style={{ flex: 1 }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem', padding: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.4rem' }}>←</span> Return to Repository
          </button>
          <h1 className="gradient-text" style={{ fontSize: '2.8rem', margin: '0 0 0.75rem 0', lineHeight: 1.1 }}>{meeting.title}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>INDEXED:</span> 
              <span>{new Date(meeting.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
              SIG-INT #{meeting.id}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn-innovative ${isNarrating ? 'primary-action' : ''}`} onClick={toggleNarration}>
             {isNarrating ? '■ STOP NARRATION' : '▶ NARRATE SUMMARY'}
          </button>
          <button className="btn-innovative" onClick={handleDelete} style={{ background: 'rgba(225, 29, 72, 0.05)', color: 'var(--accent-crimson)', borderColor: 'rgba(225, 29, 72, 0.2)' }}>
            PURGE RECORD
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)', gap: '2.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Intelligence Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          
          {/* Executive Intelligence Card */}
          <section className={`ultra-glass ${sentimentBorderClass} ${sentimentBgClass}`} style={{ padding: '2.5rem', position: 'relative' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '24px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></span>
                  Executive Intelligence
                </h2>
                <p style={{ lineHeight: '1.9', color: 'var(--text-main)', fontSize: '1.15rem', opacity: 0.9 }}>
                  {meeting.summary?.content || "Strategic summary unavailable."}
                </p>
              </div>
              
              <div style={{ marginLeft: '2rem', flexShrink: 0 }}>
                 <SentimentGauge sentiment={sentimentType} score={meeting.summary?.sentimentScore} />
                 <div style={{ textAlign: 'center', marginTop: '0.5rem', textTransform: 'capitalize', fontWeight: 600, color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    {sentimentType} Analysis
                 </div>
              </div>
            </div>

            {/* Strategic Topics */}
            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem', marginTop: '1rem' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '1rem' }}>Strategic Focus Areas</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {getTopics().map((t, i) => (
                  <span key={i} className="topic-chip">{t}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Tactical Deliverables */}
          <section className="ultra-glass pulse-glow-purple" style={{ padding: '2.5rem' }}>
            <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '24px', background: 'var(--accent-purple)', borderRadius: '2px' }}></span>
              Tactical Deliverables
            </h2>
            
            {meeting.actionItems && meeting.actionItems.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {meeting.actionItems.map((item, idx) => (
                  <div key={idx} className="ultra-glass task-card-active" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase' }}>Objective 0{idx+1}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>STATUS: PENDING</span>
                    </div>
                    <p style={{ fontSize: '1.05rem', lineHeight: 1.6, marginBottom: '1.5rem', color: 'var(--text-main)' }}>{item.task}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Assignee</div>
                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>{item.assignee}</div>
                      </div>
                      <div style={{ fontSize: '0.75rem', textAlign: 'right' }}>
                        <div style={{ color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '2px' }}>Deadline</div>
                        <div style={{ color: 'var(--text-main)' }}>{item.deadline}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'rgba(255,255,255,0.01)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontStyle: 'italic' }}>No critical deliverables identified in this session.</p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Raw Data */}
        <section className="ultra-glass" style={{ height: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', padding: '2.5rem' }}>
           <h2 style={{ fontSize: '1.5rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '24px', background: 'var(--text-dim)', borderRadius: '2px' }}></span>
              Raw Telemetry
            </h2>
            <div style={{ 
              flex: 1, 
              background: 'rgba(0,0,0,0.4)', 
              padding: '2rem', 
              borderRadius: '16px', 
              color: 'rgba(255,255,255,0.5)', 
              fontSize: '0.9rem', 
              lineHeight: '1.8', 
              whiteSpace: 'pre-wrap', 
              overflowY: 'auto',
              border: '1px solid rgba(255,255,255,0.02)',
              boxShadow: 'inset 0 0 40px rgba(0,0,0,0.8)',
              fontFamily: 'monospace'
            }}>
              {meeting.transcript || "Telemetry link severed. No raw data available."}
            </div>
            <div style={{ marginTop: '1.5rem', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', textTransform: 'uppercase', letterSpacing: '2px' }}>
              SECURE STREAM // END OF DATA
            </div>
        </section>

      </div>
    </div>
  );
}
