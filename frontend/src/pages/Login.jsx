import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { BsEye, BsEyeSlash } from 'react-icons/bs';
import { FcGoogle } from 'react-icons/fc';

/* ── Focusable input wrapper with purple border + glow ── */
function InputField({ label, children, focused }) {
  return (
    <div>
      <label style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '2px',
        textTransform: 'uppercase',
        color: focused ? '#7c3aed' : '#8b5cf6',
        marginBottom: '8px',
        transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        border: focused ? '2px solid #7c3aed' : '1.5px solid #e9d5ff',
        borderRadius: '12px',
        padding: '12px 16px',
        background: focused ? '#faf5ff' : '#fff',
        boxShadow: focused
          ? '0 0 0 4px rgba(124,58,237,0.12), 0 2px 12px rgba(124,58,237,0.08)'
          : '0 1px 4px rgba(139,92,246,0.06)',
        transition: 'all 0.2s ease',
        gap: '10px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function Login() {
  const { login, updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '15px',
    color: '#1e0a4e',
    background: 'transparent',
    fontFamily: 'inherit',
    minWidth: 0,
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const err = params.get('error');

    if (err) {
      if (err === 'deactivated') toast.error('Account deactivated. Contact admin.');
      else if (err === 'banned') toast.error('Account has been banned.');
      else if (err === 'no_email') toast.error('Google account email could not be retrieved.');
      else toast.error('OAuth login failed.');
      navigate('/login', { replace: true });
    } else if (token) {
      localStorage.setItem('token', token);
      setLoading(true);
      import('../utils/api').then(m => m.default.get('/auth/me'))
        .then(r => {
          if (r.data.success) {
            localStorage.setItem('user', JSON.stringify(r.data.user));
            updateUser(r.data.user);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
          } else {
            toast.error('Failed to get user details');
          }
        })
        .catch(() => toast.error('Login validation error'))
        .finally(() => setLoading(false));
    }
  }, [navigate, updateUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return;
    setLoading(true);
    try {
      const data = await login(form.email, form.password);
      if (data && data.user) {
        toast.success('Sign in successful!');
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('not verified') || msg.toLowerCase().includes('otp')) {
        toast.error('Email not verified. Redirecting to OTP verification...');
        navigate('/verify-otp', { state: { email: form.email } });
      } else {
        toast.error(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
      <div className="auth-left" style={{
        width: '420px',
        minWidth: '380px',
        background: 'linear-gradient(160deg, #5b21b6 0%, #4c1d95 40%, #3b0764 100%)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '40px 44px',
        position: 'relative',
        overflow: 'hidden',
        color: '#fff',
        flexShrink: 0,
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-80px', width: '300px', height: '300px', borderRadius: '50%', background: 'rgba(139,92,246,0.45)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '20px', right: '-20px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(109,40,217,0.5)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 2 }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4c1d95', fontSize: '22px', fontWeight: '700', fontFamily: 'serif', flexShrink: 0 }}>欄</div>
          <div>
            <div style={{ fontWeight: '800', fontSize: '18px', color: '#fff' }}>Examind AI</div>
            <div style={{ fontSize: '10px', fontWeight: '700', letterSpacing: '3px', color: 'rgba(216,180,254,0.85)', marginTop: '4px', textTransform: 'uppercase' }}>SMART EXAMS</div>
          </div>
        </div>

        {/* Copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '36px', fontWeight: '900', lineHeight: 1.15, margin: '0 0 16px 0', color: '#fff' }}>Smarter Exams,<br />Sharper Minds</h2>
          <p style={{ fontSize: '15px', color: 'rgba(221,214,254,0.85)', lineHeight: 1.6, margin: 0, maxWidth: '270px' }}>AI-powered quizzes designed<br />for every learner's journey.</p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', zIndex: 2 }}>
          {[
            { label: 'AI Generated', value: '10,000+ Questions', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(216,180,254,0.9)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg> },
            { label: 'Average Score', value: '87% Pass Rate', icon: <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="rgba(216,180,254,0.9)" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
          ].map((card, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backdropFilter: 'blur(10px)' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{card.icon}</div>
              <div>
                <div style={{ fontSize: '12px', color: 'rgba(216,180,254,0.7)', fontWeight: '600', marginBottom: '2px' }}>{card.label}</div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#fff' }}>{card.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="auth-right" style={{ 
        flex: 1, 
        background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '60px 80px', 
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Back to Home Link on top-left of the login panel */}
        <Link to="/" style={{ 
          position: 'absolute',
          top: '24px',
          left: '32px',
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '6px',
          fontSize: '13px', 
          color: '#ffffff',
          fontWeight: '700',
          background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
          padding: '8px 16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(124,58,237,0.25)',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          cursor: 'pointer'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.boxShadow = '0 6px 16px rgba(124,58,237,0.35)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #6d28d9 0%, #5b21b6 100%)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(124,58,237,0.25)';
          e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)';
        }}
        >
          ← Back to Home
        </Link>

        <div style={{ width: '100%', maxWidth: '460px' }}>

          <div style={{ marginBottom: '40px' }}>
            <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1e0a4e', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
              Welcome back <span>👋</span>
            </h1>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>Sign in to continue your learning journey</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Email */}
            <InputField label="Email Address" focused={focused === 'email'}>
              <input
                id="login-email"
                type="email"
                placeholder="your@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                onFocus={() => setFocused('email')}
                onBlur={() => setFocused(null)}
                style={inputStyle}
              />
            </InputField>

            {/* Password */}
            <InputField label="Password" focused={focused === 'password'}>
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                onFocus={() => setFocused('password')}
                onBlur={() => setFocused(null)}
                style={inputStyle}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', flexShrink: 0 }}>
                {showPwd ? <BsEyeSlash size={18} /> : <BsEye size={18} />}
              </button>
            </InputField>

            {/* Remember + Forgot */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: '16px', height: '16px', accentColor: '#7c3aed', cursor: 'pointer' }} />
                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: '500' }}>Remember me</span>
              </label>
              <Link to="/forgot-password" style={{ fontSize: '14px', fontWeight: '700', color: '#7c3aed', textDecoration: 'none' }}>Forgot password?</Link>
            </div>

            {/* Sign In Button */}
            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                transition: 'all 0.2s', marginTop: '4px',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '24px 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#f1f0ff' }} />
            <span style={{ fontSize: '11px', fontWeight: '700', letterSpacing: '2px', color: '#c4b5fd', textTransform: 'uppercase' }}>OR CONTINUE WITH</span>
            <div style={{ flex: 1, height: '1px', background: '#f1f0ff' }} />
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => (window.location.href = 'http://localhost:5000/api/oauth2/authorization/google')}
            disabled={loading}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.1), 0 2px 8px rgba(124,58,237,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e9d5ff'; e.currentTarget.style.boxShadow = '0 1px 4px rgba(139,92,246,0.07)'; }}
            style={{
              width: '100%', padding: '13px 20px', borderRadius: '12px',
              border: '1.5px solid #e9d5ff', background: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px',
              cursor: 'pointer', boxShadow: '0 1px 4px rgba(139,92,246,0.07)',
              transition: 'all 0.2s', fontFamily: 'inherit',
              fontSize: '15px', fontWeight: '600', color: '#374151',
              marginBottom: '24px',
            }}
          >
            <FcGoogle size={22} />
            <span>Sign in with Google</span>
          </button>

          {/* Switch */}
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            New student?{' '}
            <Link to="/register" style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>Create an account</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
