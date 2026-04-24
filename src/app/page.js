"use client";

import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SplashScreen from '@/components/SplashScreen';

export default function Home() {
  const { data: session, status } = useSession();
  const [authLoading, setAuthLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const router = useRouter();

  const handleQuickStart = async () => {
    if (status === 'authenticated') {
      router.push('/dashboard');
      return;
    }
    
    setAuthLoading(true);
    console.log("🚀 AUTH: Initiating quick start sign-in...");
    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: "admin@example.com",
        password: "password",
      });
      
      console.log("🚀 AUTH: signIn response:", res);
      
      if (res?.ok) {
        console.log("✅ AUTH: Sign-in successful, redirecting to dashboard...");
        router.push('/dashboard');
      } else {
        console.error("❌ AUTH: Sign-in failed:", res?.error);
        alert(`Authentication failed: ${res?.error || 'Unknown error'}. Please check if DATABASE_URL and NEXTAUTH_SECRET are configured in your deployment.`);
        setAuthLoading(false);
      }
    } catch (err) {
      console.error("🚨 AUTH: Unexpected error during sign-in:", err);
      alert("An unexpected error occurred. Please check the browser console.");
      setAuthLoading(false);
    }
  };

  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  return (
    <div className="container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '2rem', position: 'relative' }}>
      
      {/* Animated Background Elements */}
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, animation: 'float 6s infinite ease-in-out' }}></div>
      <div style={{ position: 'absolute', bottom: '15%', left: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)', filter: 'blur(40px)', zIndex: -1, animation: 'float 8s infinite ease-in-out reverse' }}></div>

      <div className="fade-up" style={{ maxWidth: '800px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(6, 182, 212, 0.1)', padding: '0.5rem 1.25rem', borderRadius: '999px', border: '1px solid rgba(6, 182, 212, 0.2)', marginBottom: '2rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>
          <span style={{ width: '8px', height: '8px', background: 'var(--accent-cyan)', borderRadius: '50%', boxShadow: '0 0 10px var(--accent-cyan)' }}></span>
          Multilingual Neural Intelligence
        </div>

        <h1 style={{ 
          fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
          fontWeight: 800, 
          lineHeight: 1.1, 
          marginBottom: '1.5rem',
          background: 'linear-gradient(135deg, #FFFFFF 0%, #06B6D4 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '-1px'
        }}>
          Synthesize Meeting Insights Instantly.
        </h1>

        <p style={{ color: 'var(--text-dim)', fontSize: '1.25rem', marginBottom: '3rem', maxWidth: '650px', margin: '0 auto 3rem', lineHeight: 1.6 }}>
          Automated transcription, summarization, and action item extraction for <strong>English and Kannada</strong> meetings. Powered by localized Transformers.js.
        </p>

        <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center' }}>
          <button 
            onClick={handleQuickStart} 
            className="btn-innovative primary-action" 
            disabled={authLoading}
            style={{ padding: '1.25rem 2.5rem', fontSize: '1.1rem', background: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)', boxShadow: '0 10px 40px rgba(6,182,212,0.3)' }}
          >
            {authLoading ? 'INITIATING SESSION...' : 'GET STARTED FREE'}
          </button>
        </div>

        <div style={{ marginTop: '5rem', display: 'flex', gap: '4rem', justifyContent: 'center', opacity: 0.6 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>99%</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Accuracy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>LOCAL</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Privacy</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff' }}>100+</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Integrations</div>
          </div>
        </div>
      </div>
    </div>
  );
}
