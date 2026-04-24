"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SYNTHESIS_STEPS = [
  'Initializing AI Engine...',
  'Running transcription engine...',
  'Generating executive summary...',
  'Analyzing sentiment vectors...',
  'Extracting action items...',
  'Building knowledge base...',
  'Persisting to secure archive...',
];

function StepProgress({ loading, step, message }) {
  if (!loading) return null;

  return (
    <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', border: '1px solid var(--glass-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--text-muted)', fontWeight: 700 }}>Synthesis Pipeline</div>
        {message && <div style={{ fontSize: '0.7rem', color: 'var(--accent-cyan)', animation: 'pulse 2s infinite' }}>{message}</div>}
      </div>
      {SYNTHESIS_STEPS.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', opacity: i > step ? 0.25 : 1, transition: 'opacity 0.5s ease' }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700,
            background: i < step ? 'var(--accent-cyan)' : i === step ? 'rgba(6,182,212,0.2)' : 'rgba(255,255,255,0.05)',
            border: i === step ? '1px solid var(--accent-cyan)' : 'none',
            boxShadow: i === step ? 'var(--shadow-neon-cyan)' : 'none',
            color: i < step ? '#000' : 'var(--accent-cyan)'
          }}>
            {i < step ? '✓' : i === step ? <div className="loader-aurora" style={{ width: '10px', height: '10px', borderWidth: '2px' }}></div> : i + 1}
          </span>
          <span style={{ fontSize: '0.9rem', color: i <= step ? 'var(--text-main)' : 'var(--text-muted)' }}>{s}</span>
        </div>
      ))}
    </div>
  );
}

export default function IngestPage() {
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState(null);
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  
  const worker = useRef(null);

  useEffect(() => {
    if (!worker.current) {
      worker.current = new Worker(new URL('../../lib/worker.js', import.meta.url));
    }

    const onMessageReceived = async (e) => {
      const { status, step, message, data, error } = e.data;

      switch (status) {
        case 'progress':
          setCurrentStep(step);
          setStepMessage(message);
          break;
        case 'download':
          setStepMessage(`Downloading AI Model: ${Math.round(data.loaded / 1048576)}MB / ${Math.round(data.total / 1048576)}MB`);
          break;
        case 'complete':
          setCurrentStep(6);
          setStepMessage('Persisting results to server...');
          await persistResults(data);
          break;
        case 'error':
          setError(`AI Error: ${error}`);
          setLoading(false);
          break;
      }
    };

    worker.current.addEventListener('message', onMessageReceived);
    return () => worker.current?.removeEventListener('message', onMessageReceived);
  }, []);

  const persistResults = async (processedData) => {
    try {
      const res = await fetch('/api/meetings/synthesize', {
        method: 'POST',
        body: JSON.stringify({
          title: file ? file.name : (url ? "External Audio Source" : "Manual Text Import"),
          transcript: processedData.transcript,
          summary: processedData.summary,
          sentiment: processedData.sentiment,
          actionItems: processedData.actionItems,
          chunks: processedData.chunks
        }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) throw new Error('Failed to save to database');
      const savedMeeting = await res.json();
      router.push(`/meetings/${savedMeeting.id}`);
    } catch (err) {
      setError(`Persistence Error: ${err.message}`);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], `Live_Intel_${new Date().getTime()}.webm`, { type: 'audio/webm' });
        setFile(audioFile);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      setRecordingTime(0);
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      recorder.timerInterval = interval;
      
    } catch (err) {
      console.error(err);
      setError("Audio access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      clearInterval(mediaRecorder.timerInterval);
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!text && !file && !url) {
      setError("Please provide a file, text, or URL.");
      return;
    }

    setLoading(true);
    setError(null);
    setCurrentStep(0);
    setStepMessage('Waking up AI engine...');

    try {
      let finalPayload = { text, language };

      if (url) {
        setStepMessage('Extracting YouTube transcript...');
        const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}`);
        if (!res.ok) throw new Error("Could not fetch YouTube transcript");
        const data = await res.json();
        finalPayload.text = data.transcript;
      } else if (file) {
        setStepMessage('Parsing source file...');
        // For audio, we need to convert to PCM Float32Array for the worker
        if (['mp3', 'wav', 'm4a', 'mp4', 'webm', 'mov'].includes(file.name.split('.').pop().toLowerCase())) {
           // We'll use a server helper for complex audio conversion to avoid heavy browser libraries
           const formData = new FormData();
           formData.append("file", file);
           const res = await fetch('/api/meetings/parse-audio', { method: 'POST', body: formData });
           if (!res.ok) throw new Error("Audio parsing failed");
           const data = await res.json();
           finalPayload.audioBuffer = new Float32Array(data.pcm);
        } else {
           // Simple text/pdf/docx parsing can still happen on server or via client libraries
           const formData = new FormData();
           formData.append("file", file);
           const res = await fetch('/api/meetings/parse-text', { method: 'POST', body: formData });
           if (!res.ok) throw new Error("File parsing failed");
           const data = await res.json();
           finalPayload.text = data.text;
        }
      }

      worker.current.postMessage({ action: 'synthesize', payload: finalPayload });
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="header fade-up" style={{ marginBottom: '3.5rem', textAlign: 'center' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '0.5rem', 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}>Ingestion Hub</h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          Upload files, paste YouTube links, or record live audio to synthesize intelligence.
        </p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto' }} className="fade-up">
        <div className="ultra-glass" style={{ padding: '3rem', borderTop: '2px solid rgba(6, 182, 212, 0.4)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', margin: 0, fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: 'var(--accent-cyan)' }}>○</span> Select Source Data
            </h2>
            <div className="loader-aurora" style={{ opacity: loading ? 1 : 0, width: '24px', height: '24px', borderWidth: '3px' }}></div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            
            {/* Language Selection */}
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence Language</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['English', 'Kannada'].map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguage(lang)}
                    className="btn-innovative"
                    style={{
                      flex: 1,
                      background: language === lang ? 'rgba(6, 182, 212, 0.1)' : 'rgba(0,0,0,0.2)',
                      borderColor: language === lang ? 'var(--accent-cyan)' : 'var(--glass-border)',
                      color: language === lang ? 'var(--accent-cyan)' : 'var(--text-dim)',
                      boxShadow: language === lang ? 'var(--shadow-neon-cyan)' : 'none',
                    }}
                    disabled={loading}
                  >
                    {lang === 'Kannada' ? 'ಕನ್ನಡ' : 'English'}
                  </button>
                ))}
              </div>
            </div>

            {/* File Dropzone */}
            <div>
              <label 
                className={`dropzone-innovative ${isRecording ? 'active' : ''}`} 
                htmlFor="file-upload"
                style={{
                  background: isRecording ? 'rgba(225, 29, 72, 0.05)' : (file ? 'rgba(6, 182, 212, 0.05)' : 'rgba(0,0,0,0.3)'),
                  borderColor: isRecording ? 'var(--accent-crimson)' : (file ? 'var(--accent-cyan)' : 'var(--glass-border)'),
                  borderStyle: file || isRecording ? 'solid' : 'dashed',
                  boxShadow: file ? 'inset 0 0 20px rgba(6,182,212,0.1)' : 'none'
                }}
              >
                {isRecording ? (
                  <div>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', animation: 'pulse-border 2s infinite', filter: 'drop-shadow(0 0 10px rgba(225,29,72,0.5))' }}>🎙️</span>
                    <p style={{ color: 'var(--accent-crimson)', fontWeight: 700, margin: 0, fontSize: '1.2rem', letterSpacing: '2px' }}>RECORDING: {recordingTime}s</p>
                  </div>
                ) : file ? (
                  <div>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.3))' }}>📄</span>
                    <p style={{ fontWeight: 600, color: 'var(--accent-cyan)', margin: '0 0 0.25rem 0', fontSize: '1.1rem' }}>{file.name}</p>
                    <small style={{ color: 'var(--text-muted)' }}>{formatFileSize(file.size)} · Click to replace</small>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', opacity: 0.5 }}>📁</span>
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-main)' }}>Upload Audio or PDF/DOCX</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '1rem', margin: 0 }}>Drag and drop or click to browse files</p>
                  </div>
                )}
              </label>
              <input id="file-upload" type="file" onChange={handleFileChange} style={{ display: "none" }} disabled={loading} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>YouTube URL</label>
                <input 
                  className="input-futuristic" 
                  placeholder="https://youtube.com/watch?..." 
                  value={url} 
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Live Audio Capture</label>
                <button 
                  type="button" 
                  onClick={isRecording ? stopRecording : startRecording}
                  className="btn-innovative" 
                  style={{ 
                    width: '100%', 
                    justifyContent: 'center',
                    background: isRecording ? 'rgba(225, 29, 72, 0.1)' : 'rgba(0,0,0,0.3)', 
                    color: isRecording ? 'var(--accent-crimson)' : 'var(--text-main)',
                    borderColor: isRecording ? 'var(--accent-crimson)' : 'var(--glass-border)',
                    boxShadow: isRecording ? 'var(--shadow-neon)' : 'none',
                    padding: '1rem'
                  }}
                  disabled={loading}
                >
                  {isRecording ? '▪ STOP CAPTURE' : '● START CAPTURE'}
                </button>
              </div>
            </div>

            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>Manual Text Entry</label>
                <span style={{ fontSize: '0.75rem', color: text.length > 0 ? 'var(--accent-cyan)' : 'var(--text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                  {text.length.toLocaleString()} chars
                </span>
              </div>
              <textarea 
                className="input-futuristic" 
                placeholder="Paste raw transcripts or notes here..." 
                value={text} 
                onChange={(e) => setText(e.target.value)}
                style={{ minHeight: '150px', resize: 'vertical' }}
                disabled={loading}
              />
            </div>

            {error && <div style={{ color: 'var(--accent-crimson)', fontSize: '0.95rem', padding: '1rem', background: 'rgba(225, 29, 72, 0.1)', borderRadius: '8px', border: '1px solid rgba(225, 29, 72, 0.3)', textAlign: 'center' }}>⚠️ {error}</div>}

            <StepProgress loading={loading} step={currentStep} message={stepMessage} />

            <button type="button" onClick={handleSubmit} className="btn-innovative primary-action" disabled={loading || (!text && !file && !url)} style={{ justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', marginTop: '0.5rem', letterSpacing: '1px' }}>
              {loading ? 'INITIATING SYNTHESIS...' : 'SYNTHESIZE INSIGHTS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
