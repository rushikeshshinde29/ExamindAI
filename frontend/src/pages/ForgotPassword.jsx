import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { BsEye, BsEyeSlash, BsArrowLeft, BsCheckCircleFill } from 'react-icons/bs';

function InputField({ label, focused, children }) {
  return (
    <div>
      <label style={{
        display: 'block', fontSize: '11px', fontWeight: '700',
        letterSpacing: '2px', textTransform: 'uppercase',
        color: focused ? '#7c3aed' : '#8b5cf6',
        marginBottom: '8px', transition: 'color 0.2s',
      }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: focused ? '2px solid #7c3aed' : '1.5px solid #e9d5ff',
        borderRadius: '12px', padding: '12px 16px',
        background: focused ? '#faf5ff' : '#fff',
        boxShadow: focused
          ? '0 0 0 4px rgba(124,58,237,0.12), 0 2px 12px rgba(124,58,237,0.08)'
          : '0 1px 4px rgba(139,92,246,0.06)',
        transition: 'all 0.2s ease', gap: '10px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    flex: 1, border: 'none', outline: 'none', fontSize: '15px',
    color: '#1e0a4e', background: 'transparent', fontFamily: 'inherit', minWidth: 0,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Password reset email sent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reset link');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('Password reset email resent!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend reset link');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── LEFT PANEL ── */}
      <div className="auth-left" style={{
        width: '420px', minWidth: '380px',
        background: 'linear-gradient(160deg, #5b21b6 0%, #4c1d95 40%, #3b0764 100%)',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '40px 44px', position: 'relative', overflow: 'hidden',
        color: '#fff', flexShrink: 0,
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

        {/* Center copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '1.5px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(216,180,254,0.9)" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '900', lineHeight: 1.2, margin: '0 0 16px 0', color: '#fff' }}>
            Forgot your<br />password?
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(221,214,254,0.85)', lineHeight: 1.6, margin: 0, maxWidth: '270px' }}>
            No worries! Enter your email and we'll send you a reset link instantly.
          </p>
        </div>

        {/* Bottom tip */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(216,180,254,0.7)', fontWeight: '600', marginBottom: '4px' }}>💡 Quick tip</div>
            <div style={{ fontSize: '14px', color: '#fff', fontWeight: '600', lineHeight: 1.5 }}>Check your spam folder if you don't see the email in a few minutes.</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
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
        {/* Back to Login Link on top-left of the forgot panel */}
        <Link to="/login" style={{ 
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
          ← Back to Login
        </Link>

        <div style={{ width: '100%', maxWidth: '460px' }}>

          {!submitted ? (
            <>
              <div style={{ marginBottom: '36px' }}>
                <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#1e0a4e', margin: '0 0 8px 0' }}>
                  Reset Password 🔑
                </h1>
                <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0 }}>
                  Enter your email address and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <InputField label="Email Address" focused={focused}>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    style={inputStyle}
                  />
                </InputField>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px',
                    background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                    color: '#fff', border: 'none', borderRadius: '12px',
                    fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: '#f0fdf4', border: '2px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                <BsCheckCircleFill size={34} color="#10b981" />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e0a4e', margin: '0 0 12px 0' }}>Check your Email!</h1>
              <p style={{ fontSize: '15px', color: '#64748b', marginBottom: '8px', lineHeight: 1.6 }}>
                We sent a password reset link to
              </p>
              <p style={{ fontSize: '15px', fontWeight: '700', color: '#7c3aed', marginBottom: '32px' }}>{email}</p>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                Didn't receive it? Check spam or
              </p>
              <button
                onClick={handleResend}
                disabled={loading}
                style={{
                  width: '100%', padding: '14px',
                  background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                  color: '#fff', border: 'none', borderRadius: '12px',
                  fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                  transition: 'all 0.2s',
                }}
              >
                {loading ? 'Resending...' : 'Resend Link'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
