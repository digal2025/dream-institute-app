import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const studentImgUrl =
  'https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80'; // Unsplash student at computer

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Registration failed');
      setSuccess(true);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'row',
      background: 'linear-gradient(135deg, #e0e7ff 0%, #f1f5f9 100%)',
    }}>
      {/* Left: Image */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #c7d2fe 0%, #f1f5f9 100%)',
        minHeight: '100vh',
        minWidth: 0,
        width: '50vw',
        height: '100vh',
        padding: 0,
      }}>
        <img
          src={studentImgUrl}
          alt="Student at computer"
          style={{
            width: '100%',
            height: '100vh',
            objectFit: 'cover',
            borderRadius: 0,
            boxShadow: '0 8px 32px 0 rgba(99,102,241,0.10)',
            display: 'block',
          }}
        />
      </div>
      {/* Right: Register Form */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        minWidth: 0,
      }}>
        <div style={{
          width: '100%',
          maxWidth: 420,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 20,
          boxShadow: '0 8px 32px 0 rgba(99,102,241,0.15)',
          padding: 36,
          margin: 24,
          backdropFilter: 'blur(4px)',
        }}>
          <h2 style={{ textAlign: 'center', color: '#6366f1', fontWeight: 800, letterSpacing: 1, marginBottom: 32 }}>Create Account</h2>
          <form onSubmit={handleSubmit} autoComplete="off">
            <div style={{ marginBottom: 24, position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '18px 14px 6px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #e0e7ff',
                  outline: 'none',
                  fontSize: 17,
                  background: '#f8fafc',
                  transition: 'border 0.2s',
                  boxSizing: 'border-box',
                  fontWeight: 500,
                  color: '#222',
                  caretColor: '#222', // ensure dark caret
                  zIndex: 2,
                }}
                id="register-name"
              />
              <label htmlFor="register-name" style={{
                position: 'absolute',
                left: 16,
                top: name ? 4 : 18,
                fontSize: name ? 12 : 16,
                color: name ? '#6366f1' : '#64748b',
                background: 'rgba(255,255,255,0.95)',
                padding: '0 4px',
                borderRadius: 4,
                pointerEvents: 'none',
                transition: 'all 0.2s',
                fontWeight: 600,
                zIndex: 3,
              }}>Name</label>
            </div>
            <div style={{ marginBottom: 24, position: 'relative', width: '100%' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '18px 14px 6px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #e0e7ff',
                  outline: 'none',
                  fontSize: 17,
                  background: '#f8fafc',
                  transition: 'border 0.2s',
                  boxSizing: 'border-box',
                  fontWeight: 500,
                  color: '#222',
                  caretColor: '#222', // ensure dark caret
                  zIndex: 2,
                }}
                id="register-email"
              />
              <label htmlFor="register-email" style={{
                position: 'absolute',
                left: 16,
                top: email ? 4 : 18,
                fontSize: email ? 12 : 16,
                color: email ? '#6366f1' : '#64748b',
                background: 'rgba(255,255,255,0.95)',
                padding: '0 4px',
                borderRadius: 4,
                pointerEvents: 'none',
                transition: 'all 0.2s',
                fontWeight: 600,
                zIndex: 3,
              }}>Email</label>
            </div>
            <div style={{ marginBottom: 24, position: 'relative', width: '100%' }}>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '18px 14px 6px 14px',
                  borderRadius: 12,
                  border: '1.5px solid #e0e7ff',
                  outline: 'none',
                  fontSize: 17,
                  background: '#f8fafc',
                  transition: 'border 0.2s',
                  boxSizing: 'border-box',
                  fontWeight: 500,
                  color: '#222',
                  caretColor: '#222', // ensure dark caret
                  zIndex: 2,
                }}
                id="register-password"
              />
              <label htmlFor="register-password" style={{
                position: 'absolute',
                left: 16,
                top: password ? 4 : 18,
                fontSize: password ? 12 : 16,
                color: password ? '#6366f1' : '#64748b',
                background: 'rgba(255,255,255,0.95)',
                padding: '0 4px',
                borderRadius: 4,
                pointerEvents: 'none',
                transition: 'all 0.2s',
                fontWeight: 600,
                zIndex: 3,
              }}>Password</label>
            </div>
            {error && <div style={{ color: 'red', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginBottom: 16, textAlign: 'center', fontWeight: 600 }}>Registration successful! You will be redirected to the login screen in 5 seconds...</div>}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width: '100%',
                padding: '14px 0',
                background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 800,
                fontSize: 18,
                boxShadow: '0 2px 8px #6366f133',
                letterSpacing: 1,
                cursor: loading || success ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s',
              }}
            >
              {loading ? 'Registering...' : 'Register'}
            </button>
          </form>
          <div style={{ marginTop: 24, textAlign: 'center', color: '#64748b', fontWeight: 500 }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#6366f1', textDecoration: 'underline', fontWeight: 700 }}>Login</a>
          </div>
        </div>
      </div>
      {/* Responsive: stack on small screens */}
      <style>{`
        @media (max-width: 900px) {
          div[style*='flex-direction: row'] {
            flex-direction: column !important;
          }
          div[style*='background: linear-gradient(135deg, #c7d2fe 0%, #f1f5f9 100%)'] {
            min-height: 220px !important;
            padding-top: 48px;
            padding-bottom: 24px;
          }
          div[style*='background: rgba(255,255,255,0.95)'] {
            margin-top: 0 !important;
          }
        }
      `}</style>
    </div>
  );
} 