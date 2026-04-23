"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("AUTHENTICATION FAILED: Invalid credentials.");
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
      
      {/* Decorative radial glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, rgba(6,182,212,0.08) 0%, transparent 65%)', zIndex: -1, pointerEvents: 'none' }}></div>

      {/* Scan-line decorative overlay */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.02) 2px, rgba(6,182,212,0.02) 4px)', pointerEvents: 'none', zIndex: -1 }}></div>

      <div className="ultra-glass fade-up" style={{ width: '100%', maxWidth: '420px', padding: '3.5rem 2.5rem', borderTop: '2px solid rgba(6,182,212,0.5)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(6,182,212,0.08)' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(6,182,212,0.1)', border: '2px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 30px rgba(6,182,212,0.2)' }}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.5))' }}>⚡</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '2px' }}>SYSTEM ACCESS</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Identify yourself to Intel Hub</p>
          <p style={{ color: 'rgba(6,182,212,0.6)', marginTop: '1rem', fontSize: '0.8rem', fontStyle: 'italic' }}>
            Hint: admin@example.com / any password
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>Operative Email</label>
            <input 
              type="email"
              required
              id="login-email"
              className="input-futuristic" 
              placeholder="agent@intelhub.io"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>Authorization Key</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'}
                required
                id="login-password"
                className="input-futuristic" 
                placeholder="••••••••••••"
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', paddingRight: '3.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}
                tabIndex={-1}
              >
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <div style={{ color: 'var(--accent-crimson)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(225, 29, 72, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(225, 29, 72, 0.3)', letterSpacing: '0.5px' }}>{error}</div>}

          <button type="submit" className="btn-innovative primary-action" disabled={loading} style={{ justifyContent: 'center', padding: '1rem', marginTop: '0.75rem', fontSize: '1rem', letterSpacing: '2px', background: 'linear-gradient(135deg, #0891b2 0%, var(--accent-cyan) 100%)', boxShadow: '0 4px 20px rgba(6,182,212,0.3)' }}>
            {loading ? <div className="loader-aurora" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div> : 'AUTHORIZE'}
          </button>

          <div style={{ position: 'relative', textAlign: 'center', margin: '1.5rem 0' }}>
            <span style={{ background: '#0a0a0a', padding: '0 1rem', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>OR</span>
            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--glass-border)', zIndex: 0 }}></div>
          </div>

          <button 
            type="button" 
            onClick={() => {
              setEmail("admin@example.com");
              setPassword("password");
              setTimeout(() => document.querySelector('form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true })), 100);
            }} 
            className="btn-innovative" 
            style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(139,92,246,0.3)', color: '#A78BFA' }}
          >
            GET STARTED AS GUEST
          </button>
        </form>

        {/* Registration disabled as requested */}
      </div>
    </div>
  );
}
