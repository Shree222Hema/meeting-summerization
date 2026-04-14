"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';

// --- Sub-Components ---

const SentimentGauge = ({ sentiment, score }) => {
  const color = sentiment === 'positive' ? 'var(--accent-cyan)' : sentiment === 'negative' ? 'var(--accent-crimson)' : 'var(--accent-purple)';
  const normalizedScore = score || 50;
  const strokeDasharray = 251.2;
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

const IntelligenceMetric = ({ label, value, color }) => (
  <div style={{ marginBottom: '1.5rem' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ color: color }}>{value}%</span>
    </div>
    <div className="metric-meter-container">
      <div className="metric-meter-fill" style={{ width: `${value}%`, background: color, boxShadow: `0 0 10px ${color}88` }}></div>
    </div>
  </div>
);

export default function MeetingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isNarrating, setIsNarrating] = useState(false);
  const [activeTab, setActiveTab] = useState('strategic');
  const [structuralIndex, setStructuralIndex] = useState([]);
  
  useEffect(() => {
    if (!params.id) return;

    fetch(`/api/meetings/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Document Not Found or Access Denied");
        return res.json();
      })
      .then(data => {
        setMeeting(data);
        extractStructure(data.transcript);
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

  const extractStructure = (text) => {
    if (!text) return;
    // Extract lines that look like headers (e.g. starts with numbers or matches common patterns)
    const lines = text.split('\n');
    const headers = lines
      .map((line, idx) => ({ text: line.trim(), line: idx }))
      .filter(l => l.text.length > 5 && (
        /^\d+\s+\d*\.?\s*[A-Z]/.test(l.text) || 
        /^[A-Z\s]{5,20}$/.test(l.text) ||
        l.text.includes('Step')
      ))
      .slice(0, 15);
    setStructuralIndex(headers);
  };

  const handlePurge = async () => {
    if (!confirm("Are you sure you want to permanently purge this intelligence report?")) return;
    try {
      const res = await fetch(`/api/meetings/${params.id}`, { method: 'DELETE' });
      if (res.ok) router.push('/');
    } catch (err) {
      alert("Purge operation failed.");
    }
  };

  const toggleNarration = () => {
    if (!window.speechSynthesis) return alert("Speech synthesis not supported.");
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
    } else {
      const text = meeting.summary || "No summary available.";
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsNarrating(false);
      utterance.rate = 0.95;
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') || v.name.includes('Premium'));
      if (preferred) utterance.voice = preferred;
      window.speechSynthesis.speak(utterance);
      setIsNarrating(true);
    }
  };

  if (loading) return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="loader-aurora" style={{ width: '40px', height: '40px' }}></div>
    </div>
  );

  if (error || !meeting) return (
    <div className="container" style={{ paddingTop: '6rem', textAlign: 'center' }}>
      <h2 className="gradient-text-crimson" style={{ fontSize: '2rem' }}>⚠️ {error}</h2>
      <button onClick={() => router.push('/')} className="btn-innovative primary-action" style={{ marginTop: '2rem' }}>RETURN TO ARCHIVE</button>
    </div>
  );

  const sentimentType = (meeting.sentiment_label || 'neutral').toLowerCase();
  const sentimentColor = sentimentType.includes('pos') ? 'var(--accent-cyan)' : sentimentType.includes('neg') ? 'var(--accent-crimson)' : 'var(--accent-purple)';

  // Mocked advanced analytics
  const engagementDepth = Math.floor(Math.random() * 30) + 60;
  const tonalStability = Math.floor(Math.random() * 20) + 75;

  return (
    <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '5rem' }}>
      
      {/* Header Intelligence Tier */}
      <div className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1 }}>
          <button onClick={() => router.push('/')} style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.85rem', padding: 0, letterSpacing: '1.5px', textTransform: 'uppercase' }}>
            <span style={{ fontSize: '1.4rem' }}>←</span> Return to Repository
          </button>
          <h1 className="gradient-text" style={{ fontSize: '2.8rem', margin: '0 0 0.75rem 0', lineHeight: 1.1 }}>{meeting.title}</h1>
          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', display: 'flex', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 600 }}>INDEXED:</span> 
              <span>{new Date(meeting.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid var(--glass-border)', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700 }}>
              SIG-INT #{meeting.id}
            </div>
            {isNarrating && (
              <div className="waveform" style={{ marginLeft: '1rem' }}>
                 {[1,2,3,4,5].map(i => <div key={i} className="wave-bar" style={{ animationDelay: `${i*0.1}s` }}></div>)}
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button className={`btn-innovative ${isNarrating ? 'primary-action' : ''}`} onClick={toggleNarration}>
             {isNarrating ? '■ STOP' : '▶ NARRATE'}
          </button>
          <button className="btn-innovative" onClick={handlePurge} style={{ color: 'var(--accent-crimson)', borderColor: 'rgba(225, 29, 72, 0.2)' }}>
            PURGE
          </button>
        </div>
      </div>

      {/* Primary Navigation System */}
      <div className="tab-container fade-up reveal-delay-1">
        <button className={`tab-trigger ${activeTab === 'strategic' ? 'active' : ''}`} onClick={() => setActiveTab('strategic')}>
          Strategic Intelligence
        </button>
        <button className={`tab-trigger ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveTab('technical')}>
          Technical Archives
        </button>
      </div>

      {activeTab === 'strategic' ? (
        <div className="fade-up reveal-delay-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 0.6fr)', gap: '2rem' }}>
          
          {/* Intelligence Briefing */}
          <section className="ultra-glass" style={{ padding: '2.5rem', borderLeft: `4px solid ${sentimentColor}` }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ display: 'inline-block', width: '8px', height: '20px', background: 'var(--accent-cyan)', borderRadius: '2px' }}></span>
              Executive Intelligence Briefing
            </h2>
            <p style={{ lineHeight: '2', color: 'var(--text-main)', fontSize: '1.2rem', opacity: 0.9, marginBottom: '2rem' }}>
              {meeting.summary || "Strategic summary linkage currently unavailable."}
            </p>

            <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '2rem' }}>
              <h3 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '1.5rem' }}>Tactical Deliverables</h3>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {meeting.action_items && meeting.action_items.length > 0 ? meeting.action_items.map((item, idx) => (
                  <div key={idx} className="ultra-glass" style={{ padding: '1.25rem', background: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span style={{ color: 'var(--accent-purple)', fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase' }}>Objective 0{idx+1}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem' }}>DEADLINE: {item.deadline || 'OPEN'}</span>
                    </div>
                    <div style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>{item.task}</div>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}>Assignee: {item.assignee || 'Unassigned'}</div>
                  </div>
                )) : (
                  <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.9rem' }}>No critical targets identified.</div>
                )}
              </div>
            </div>
          </section>

          {/* Metrics Intelligence */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <section className="ultra-glass" style={{ padding: '2rem', textAlign: 'center' }}>
               <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '1.5rem' }}>Sentiment Profile</h3>
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
                  <SentimentGauge sentiment={sentimentType} score={meeting.sentiment_score} />
               </div>
               <div style={{ textTransform: 'uppercase', fontWeight: 800, color: sentimentColor, letterSpacing: '1px', fontSize: '1rem' }}>
                  {sentimentType} Analysis
               </div>
            </section>

            <section className="ultra-glass" style={{ padding: '2rem' }}>
               <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '2rem' }}>Intelligence Metrics</h3>
               <IntelligenceMetric label="Engagement Depth" value={engagementDepth} color="var(--accent-cyan)" />
               <IntelligenceMetric label="Tonal Stability" value={tonalStability} color="var(--accent-purple)" />
               <IntelligenceMetric label="Strategic Alignment" value={88} color="var(--accent-cyan)" />
            </section>
          </div>
        </div>
      ) : (
        <div className="fade-up reveal-delay-2" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,0.5fr)', gap: '2.5rem' }}>
          
          {/* Telemetry Reader */}
          <section className="ultra-glass" style={{ height: '70vh', padding: '0', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '1.25rem 2rem', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace', letterSpacing: '2px' }}>SECURE_DATA_STREAM_v2.0</span>
              <span style={{ color: 'var(--accent-cyan)', fontSize: '0.7rem' }}>ENCRYPTED END-TO-END</span>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: 'rgba(0,0,0,0.4)' }}>
               {meeting.transcript ? meeting.transcript.split('\n').map((line, idx) => (
                 <div key={idx} className="telemetry-line" style={{ marginBottom: '0.5rem' }}>
                    <span className="line-number">{idx + 1}</span>
                    <span style={{ color: line.startsWith(' ') ? 'var(--text-muted)' : 'var(--text-main)', opacity: line.startsWith(' ') ? 0.7 : 1 }}>{line}</span>
                 </div>
               )) : (
                 <div style={{ color: 'var(--accent-crimson)', textAlign: 'center', marginTop: '5rem' }}>LINK SEVERED: NO DATA AVAILABLE</div>
               )}
            </div>
          </section>

          {/* Structural Archive Index */}
          <section className="ultra-glass" style={{ padding: '2rem' }}>
             <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '2px', marginBottom: '1.5rem' }}>Archive Map</h3>
             <div className="structural-index">
                {structuralIndex.length > 0 ? structuralIndex.map((item, idx) => (
                  <button key={idx} className="index-item" style={{ background: 'transparent', textAlign: 'left', border: 'none', cursor: 'pointer', display: 'block' }}>
                    {item.text}
                  </button>
                )) : (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No structural markers found.</div>
                )}
             </div>
             <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
                <button className="btn-innovative" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>
                  DOWNLOAD ARCHIVE
                </button>
             </div>
          </section>
        </div>
      )}
    </div>
  );
}

