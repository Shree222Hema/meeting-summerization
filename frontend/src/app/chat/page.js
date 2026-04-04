"use client";

import { useState, useRef, useEffect } from 'react';

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMsg.content }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Query Failed");
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.answer, source: data.source_meeting }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: `[SYSTEM ERROR]: ${err.message}` }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <div className="container" style={{ padding: '0', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 65px)' }}>
      <div style={{ flex: 1, padding: '2rem 5%', overflow: 'hidden', display: 'flex', flexDirection: 'column', maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
        
        <div className="fade-up" style={{ textAlign: 'center', margin: '0 0 2rem 0', flexShrink: 0 }}>
          <h1 style={{ 
            fontSize: '2.5rem', 
            margin: 0, 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 20px rgba(139, 92, 246, 0.3)'
           }}>Intel Chat Assistant</h1>
          <p style={{ color: 'var(--text-dim)', fontSize: '1.1rem', marginTop: '0.5rem' }}>Query the neural database across all documented archives.</p>
        </div>

        <div className="ultra-glass chat-container fade-up" style={{ animationDelay: '0.1s', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0, borderTop: '1px solid rgba(139, 92, 246, 0.4)' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '2rem', background: 'rgba(5, 5, 10, 0.4)' }}>
            {messages.length === 0 && (
              <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-muted)' }}>
                <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1.5rem', filter: 'drop-shadow(0 0 20px rgba(139, 92, 246, 0.2))' }}>⚡</span>
                <p style={{ margin: 0, fontSize: '1.2rem', fontWeight: 500 }}>System idle. Awaiting user prompts...</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`fade-up`} style={{ 
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                backgroundColor: msg.role === 'user' ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255,255,255,0.03)',
                color: 'var(--text-main)',
                border: '1px solid',
                borderColor: msg.role === 'user' ? 'rgba(139, 92, 246, 0.4)' : 'var(--glass-border)',
                borderRadius: '16px',
                borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                borderBottomLeftRadius: msg.role === 'user' ? '16px' : '4px',
                padding: '1.25rem 1.5rem',
                maxWidth: '85%',
                boxShadow: msg.role === 'user' ? '0 0 20px rgba(139, 92, 246, 0.1)' : '0 4px 15px rgba(0,0,0,0.2)',
                backdropFilter: 'blur(10px)'
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: msg.role === 'user' ? 'var(--accent-purple)' : 'var(--accent-cyan)', marginBottom: '0.5rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
                  {msg.role === 'user' ? 'OPERATIVE' : 'AI CORE'}
                </div>
                <div style={{ lineHeight: '1.6', fontSize: '1.05rem' }}>{msg.content}</div>
                {msg.source && (
                  <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-dim)', borderTop: msg.role === 'user' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--glass-border)', paddingTop: '0.75rem' }}>
                    <strong style={{color: 'var(--accent-cyan)'}}>SOURCE DIRECTORY:</strong> {msg.source}
                  </div>
                )}
              </div>
            ))}
            
            {isChatLoading && (
              <div style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.03)', padding: '1.25rem 1.5rem', borderRadius: '16px', borderBottomLeftRadius: '4px', border: '1px solid var(--glass-border)' }}>
                <div className="loader-aurora" style={{ width: '24px', height: '24px', borderWidth: '3px' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleChat} style={{ display: 'flex', gap: '1rem', padding: '1.5rem', background: 'rgba(10, 10, 15, 0.8)', borderTop: '1px solid var(--glass-border)' }}>
            <input 
              type="text" 
              className="input-futuristic" 
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              placeholder="Query neural network..."
              style={{ flex: 1, margin: 0, borderRadius: '999px', padding: '1rem 1.5rem', backgroundColor: 'rgba(0,0,0,0.5)', borderColor: 'rgba(139, 92, 246, 0.3)' }}
              disabled={isChatLoading}
            />
            <button type="submit" className="btn-innovative" disabled={isChatLoading || !input.trim()} style={{ borderRadius: '999px', padding: '0 2rem', background: 'linear-gradient(135deg, var(--accent-purple) 0%, #6D28D9 100%)', color: '#fff', border: 'none', boxShadow: '0 0 15px rgba(139, 92, 246, 0.4)' }}>
              TRANSMIT
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
