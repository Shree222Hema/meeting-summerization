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
  const [reportTitle, setReportTitle] = useState('');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingBlob, setIsProcessingBlob] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepMessage, setStepMessage] = useState('');
  
  const worker = useRef(null);
  const workerResponsive = useRef(false);

  useEffect(() => {
    if (!worker.current) {
      const workerPath = new URL('/worker.js', window.location.origin).href;
      worker.current = new Worker(workerPath, { type: 'module' });
      console.log("[Ingest] Worker initialized from:", workerPath);
      worker.current.postMessage({ action: 'ping' });
      
      // Connection timeout: If no pong in 5s, the worker likely failed to load
      const connTimeout = setTimeout(() => {
        if (!workerResponsive.current) {
          setError("AI Engine failed to start. This usually happens if your browser blocks Web Workers or if there's a network issue. Try refreshing or using a different browser (Chrome/Edge recommended).");
          setLoading(false);
        }
      }, 5000);
      window.workerConnTimeout = connTimeout;
    }

    const onMessageReceived = async (e) => {
      const { status, step, message, data, error } = e.data;

      switch (status) {
        case 'pong':
          console.log("[Ingest] Worker is alive and responsive.");
          workerResponsive.current = true;
          if (window.workerConnTimeout) clearTimeout(window.workerConnTimeout);
          break;
        case 'progress':
          setCurrentStep(step);
          setStepMessage(message);
          break;
        case 'download':
          setStepMessage(`Downloading AI Model: ${Math.round(data.loaded / 1048576)}MB / ${Math.round(data.total / 1048576)}MB`);
          break;
        case 'complete':
          if (window.synthesisWatchdog) clearTimeout(window.synthesisWatchdog);
          setCurrentStep(6);
          setStepMessage('Persisting results to server...');
          await persistResults(data);
          break;
        case 'error':
          if (window.synthesisWatchdog) clearTimeout(window.synthesisWatchdog);
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
          title: reportTitle.trim() || (file ? file.name : (url ? "YouTube Source" : (text ? (text.slice(0, 45) + (text.length > 45 ? '...' : '')) : "Untitled Intel"))),
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
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone access is only available on secure (HTTPS) connections. Please ensure your site is using SSL.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') 
        ? 'audio/webm;codecs=opus' 
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
        
      const recorder = new MediaRecorder(stream, { mimeType });
      const chunks = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        setIsProcessingBlob(true);
        const audioBlob = new Blob(chunks, { type: mimeType });
        const audioFile = new File([audioBlob], `Live_Intel_${new Date().getTime()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`, { type: mimeType });
        setFile(audioFile);
        setIsProcessingBlob(false);
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
    e.preventDefault();
    setError('');
    
    if (!workerResponsive.current) {
      setError("AI Engine is still initializing. Please wait a few seconds and try again. If this message persists, refresh the page.");
      return;
    }

    setLoading(true);
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
        const res = await fetch(`/api/youtube?url=${encodeURIComponent(url)}&lang=${language}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Could not fetch YouTube transcript");
        finalPayload.text = data.transcript;
      } else if (file) {
        const fileExt = file.name.split('.').pop().toLowerCase();
        
        // 1. Audio Processing (Client-Side)
        if (['mp3', 'wav', 'm4a', 'mp4', 'webm', 'mov', 'aac', 'ogg', 'oga', 'flac'].includes(fileExt)) {
           setStepMessage('Decoding audio in browser...');
           try {
             const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
             const arrayBuffer = await file.arrayBuffer();
             const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
             finalPayload.audioBuffer = audioBuffer.getChannelData(0);
             await audioContext.close();
           } catch (audioErr) {
             console.error("Audio Decoding Error:", audioErr);
             throw new Error(`Browser failed to decode this audio format. Try a standard MP3 or WAV file.`);
           }
        } 
        // 2. DOCX Processing (Client-Side)
        else if (fileExt === 'docx') {
           setStepMessage('Parsing document locally...');
           const mammoth = await import('mammoth');
           const arrayBuffer = await file.arrayBuffer();
           const result = await mammoth.extractRawText({ arrayBuffer });
           finalPayload.text = result.value;
        }
        // 3. PDF Processing (Client-Side)
        else if (fileExt === 'pdf') {
           setStepMessage('Extracting PDF text locally...');
           try {
             const pdfjs = await import('pdfjs-dist');
             pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
             
             const arrayBuffer = await file.arrayBuffer();
             const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
             const pdf = await loadingTask.promise;
             let fullText = "";
             for (let i = 1; i <= pdf.numPages; i++) {
               setStepMessage(`Extracting PDF text: Page ${i} / ${pdf.numPages}...`);
               const page = await pdf.getPage(i);
               const content = await page.getTextContent();
               const pageText = content.items.map(item => item.str).join(" ");
               fullText += pageText + "\n";
             }
             finalPayload.text = fullText;
             console.log(`[Ingest] PDF Extraction complete. Total characters: ${fullText.length}`);
             await pdf.destroy();

             if (fullText.trim().length === 0) {
               throw new Error("This PDF appears to be empty or contains only images (scanned). Please upload a text-based PDF or copy the text manually.");
             }
           } catch (pdfErr) {
             console.error("PDF Parsing Error:", pdfErr);
             setError(`PDF Parsing Error: ${pdfErr.message || "Failed to extract text from this PDF."}`);
             setLoading(false);
             return;
           }
        }
        // 4. TXT Processing (Client-Side)
        else if (fileExt === 'txt') {
           setStepMessage('Reading text file...');
           finalPayload.text = await file.text();
        }
        else {
           throw new Error(`Unsupported file format: .${fileExt}`);
        }
      }

      console.log("[Ingest] Sending payload to worker...", { 
        hasAudio: !!finalPayload.audioBuffer, 
        textLength: finalPayload.text?.length || 0 
      });
      
      // Watchdog timer: If no response in 5 minutes, something is wrong
      const watchdog = setTimeout(() => {
        if (loading) {
          setError("Synthesis timed out. The file might be too large or the AI engine is unresponsive. Please try a smaller file.");
          setLoading(false);
        }
      }, 300000); // 5 minutes

      worker.current.postMessage({ action: 'synthesize', payload: finalPayload });
      
      // We'll clear this watchdog in the complete/error cases (handled in useEffect)
      window.synthesisWatchdog = watchdog;
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
            
            {/* Report Title */}
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Report Title (Optional)</label>
              <input 
                className="input-futuristic" 
                placeholder="e.g. Q3 Planning Session, Project Alpha Sync..." 
                value={reportTitle} 
                onChange={(e) => setReportTitle(e.target.value)}
                disabled={loading}
                style={{ borderBottomColor: reportTitle ? 'var(--accent-cyan)' : 'var(--glass-border)' }}
              />
            </div>

            {/* Language Selection */}
            <div className="input-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-dim)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Intelligence Language</label>
              <div style={{ display: 'flex', gap: '1rem' }}>
                {['English', 'Kannada', 'Hindi'].map((lang) => (
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
                    {lang === 'Kannada' ? 'ಕನ್ನಡ' : lang === 'Hindi' ? 'हिंदी' : 'English'}
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

            <button type="button" onClick={handleSubmit} className="btn-innovative primary-action" disabled={loading || isRecording || isProcessingBlob || (!text && !file && !url)} style={{ justifyContent: 'center', padding: '1.25rem', fontSize: '1.1rem', marginTop: '0.5rem', letterSpacing: '1px' }}>
              {loading ? 'INITIATING SYNTHESIS...' : isProcessingBlob ? 'FINALIZING RECORDING...' : 'SYNTHESIZE INSIGHTS'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
