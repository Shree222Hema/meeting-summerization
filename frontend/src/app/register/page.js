"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

function PasswordStrengthBar({ password }) {
  const getStrength = (p) => {
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^a-zA-Z0-9]/.test(p)) score++;
    return score;
  };

  if (!password) return null;

  const strength = getStrength(password);
  const label = ['Weak', 'Fair', 'Good', 'Strong'][strength - 1] || 'Weak';
  const colors = ['var(--accent-crimson)', '#f59e0b', '#84cc16', 'var(--accent-cyan)'];
  const color = colors[strength - 1] || colors[0];

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div style={{ display: 'flex', gap: '4px', marginBottom: '0.3rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: i <= strength ? color : 'rgba(255,255,255,0.08)', transition: 'background 0.3s ease' }} />
        ))}
      </div>
      <span style={{ fontSize: '0.7rem', color: color, fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Registration failed");
      }

      const signInRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError(`REGISTRATION FAILED: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', position: 'relative' }}>
      
      {/* Decorative glow */}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '100vw', height: '100vh', background: 'radial-gradient(circle at center, rgba(139,92,246,0.08) 0%, transparent 65%)', zIndex: -1, pointerEvents: 'none' }}></div>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139,92,246,0.02) 2px, rgba(139,92,246,0.02) 4px)', pointerEvents: 'none', zIndex: -1 }}></div>

      <div className="ultra-glass fade-up" style={{ width: '100%', maxWidth: '420px', padding: '3.5rem 2.5rem', borderTop: '2px solid rgba(139,92,246,0.5)', boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 60px rgba(139,92,246,0.08)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.1)', border: '2px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', boxShadow: '0 0 30px rgba(139,92,246,0.2)' }}>
            <span style={{ fontSize: '2rem', filter: 'drop-shadow(0 0 10px rgba(139,92,246,0.5))' }}>⚡</span>
          </div>
          <h2 style={{ fontSize: '1.8rem', margin: 0, fontWeight: 700, color: 'var(--text-main)', letterSpacing: '2px' }}>INITIALIZE PROFILE</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>Create your operative credentials</p>
        </div>

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>Designation</label>
            <input 
              type="text" required id="reg-name"
              className="input-futuristic" placeholder="Agent Name"
              value={name} onChange={(e) => setName(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>Operative Email</label>
            <input 
              type="email" required id="reg-email"
              className="input-futuristic" placeholder="agent@intelhub.io"
              value={email} onChange={(e) => setEmail(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.5)' }}
            />
          </div>

          <div className="input-group">
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem', letterSpacing: '1.5px', textTransform: 'uppercase', display: 'block' }}>Authorization Key</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? 'text' : 'password'} required id="reg-password"
                className="input-futuristic" placeholder="Min. 8 characters"
                value={password} onChange={(e) => setPassword(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.5)', paddingRight: '3.5rem' }}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)}
                style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: 0 }}
                tabIndex={-1}>{showPassword ? '🙈' : '👁'}</button>
            </div>
            <PasswordStrengthBar password={password} />
          </div>

          {error && <div style={{ color: 'var(--accent-crimson)', fontSize: '0.85rem', textAlign: 'center', background: 'rgba(225, 29, 72, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(225, 29, 72, 0.3)', letterSpacing: '0.5px' }}>{error}</div>}

          <button type="submit" className="btn-innovative primary-action" disabled={loading} style={{ justifyContent: 'center', padding: '1rem', marginTop: '0.75rem', fontSize: '1rem', letterSpacing: '2px', background: 'linear-gradient(135deg, #6d28d9 0%, var(--accent-purple) 100%)', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
            {loading ? <div className="loader-aurora" style={{ width: '20px', height: '20px', borderWidth: '2px', borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}></div> : 'ESTABLISH UPLINK'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have credentials? <Link href="/login" style={{ color: '#A78BFA', textDecoration: 'none', fontWeight: 600 }}>Authorize here →</Link>
        </div>
      </div>
    </div>
  );
}
