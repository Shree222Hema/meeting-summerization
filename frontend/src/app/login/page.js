"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      
      {/* Decorative background glow for Auth page */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, rgba(6,182,212,0.1) 0%, transparent 60%)', zIndex: -1, pointerEvents: 'none' }}></div>

      <div className="ultra-glass fade-up" style={{ width: '100%', maxWidth: '420px', padding: '3.5rem 2.5rem', borderTop: '1px solid rgba(6,182,212,0.4)', boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 40px rgba(6,182,212,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.5))' }}>⚡</span>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 600, color: 'var(--text-main)', letterSpacing: '1px' }}>SYSTEM ACCESS</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem' }}>Identify yourself to Intel Hub</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="input-group">
            <input 
              type="email"
              required
              className="input-futuristic" 
              placeholder="Operative Email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          <div className="input-group">
            <input 
              type="password"
              required
              className="input-futuristic" 
              placeholder="Authorization Key (Password)" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          {error && <div style={{ color: 'var(--accent-crimson)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(225, 29, 72, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(225, 29, 72, 0.3)', letterSpacing: '0.5px' }}>{error}</div>}

          <button type="submit" className="btn-innovative primary-action" disabled={loading} style={{ justifyContent: 'center', padding: '1rem', marginTop: '1rem', fontSize: '1.05rem', letterSpacing: '2px', background: 'linear-gradient(135deg, #0891b2 0%, var(--accent-cyan) 100%)', boxShadow: '0 4px 15px var(--shadow-neon-cyan)' }}>
            {loading ? <div className="loader-aurora" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div> : 'AUTHORIZE'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2.5rem', fontSize: '0.95rem', color: 'var(--text-muted)' }}>
          No operative profile? <Link href="/register" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 600, textShadow: 'var(--shadow-neon-cyan)' }}>Register credentials</Link>
        </div>
      </div>
    </div>
  );
}
