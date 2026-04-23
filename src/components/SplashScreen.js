"use client";

import { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [visible, setVisible] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFade(true);
      setTimeout(() => {
        setVisible(false);
        onFinish();
      }, 800);
    }, 2000);
    return () => clearTimeout(timer);
  }, [onFinish]);

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#0a0a0a',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: fade ? 0 : 1,
      transition: 'opacity 0.8s ease-in-out',
      pointerEvents: 'none'
    }}>
      <div style={{
        position: 'relative',
        width: '120px',
        height: '120px',
        marginBottom: '2rem'
      }}>
        {/* Outer rotating ring */}
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(6, 182, 212, 0.2)',
          borderTopColor: 'var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 2s linear infinite'
        }}></div>
        
        {/* Inner pulsing core */}
        <div style={{
          position: 'absolute',
          inset: '20px',
          background: 'radial-gradient(circle, var(--accent-cyan) 0%, transparent 70%)',
          borderRadius: '50%',
          boxShadow: '0 0 40px var(--accent-cyan)',
          animation: 'pulse-border 2s infinite'
        }}></div>
        
        <span style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          filter: 'drop-shadow(0 0 10px var(--accent-cyan))'
        }}>⚡</span>
      </div>

      <h1 style={{
        fontSize: '1.5rem',
        fontWeight: 800,
        letterSpacing: '8px',
        color: '#fff',
        margin: 0,
        textTransform: 'uppercase',
        opacity: 0.8,
        animation: 'tracking-in-expand 1.5s cubic-bezier(0.215, 0.610, 0.355, 1.000) both'
      }}>
        INTEL HUB
      </h1>
      
      <div style={{
        marginTop: '1rem',
        width: '200px',
        height: '2px',
        background: 'rgba(255,255,255,0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--accent-cyan)',
          animation: 'shimmer 2s infinite'
        }}></div>
      </div>
    </div>
  );
}
