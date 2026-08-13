import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { BsCheckCircle, BsArrowRepeat, BsArrowLeft } from 'react-icons/bs';

export default function OtpVerify() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    const targetEmail = location.state?.email || user?.email;
    if (!targetEmail) {
      toast.error('No session found. Please login.');
      navigate('/login');
    } else {
      setEmail(targetEmail);
    }
  }, [location, user, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (value, idx) => {
    const cleanVal = value.replace(/\D/g, '');
    const newOtp = [...otp];
    if (!cleanVal) {
      newOtp[idx] = '';
      setOtp(newOtp);
      return;
    }
    newOtp[idx] = cleanVal[cleanVal.length - 1];
    setOtp(newOtp);
    if (idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace') {
      if (otp[idx] === '') {
        if (idx > 0) {
          const newOtp = [...otp];
          newOtp[idx - 1] = '';
          setOtp(newOtp);
          document.getElementById(`otp-${idx - 1}`)?.focus();
        }
      } else {
        const newOtp = [...otp];
        newOtp[idx] = '';
        setOtp(newOtp);
      }
    } else if (e.key === 'ArrowLeft' && idx > 0) {
      document.getElementById(`otp-${idx - 1}`)?.focus();
    } else if (e.key === 'ArrowRight' && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = Array(6).fill('');
      for (let i = 0; i < pastedData.length; i++) newOtp[i] = pastedData[i] || '';
      setOtp(newOtp);
      document.getElementById(`otp-${Math.min(pastedData.length, 5)}`)?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    if (otpCode.length !== 6) return toast.error('OTP code must be 6 digits');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: otpCode });
      toast.success('Email verified successfully! 🎉');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      updateUser(res.data.user);
      const role = res.data.user?.role || 'student';
      if (role === 'admin') navigate('/admin/dashboard');
      else if (role === 'faculty') navigate('/faculty/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    try {
      await api.post('/auth/resend-otp', { email });
      toast.success('New verification code sent! 📬');
      setOtp(Array(6).fill(''));
      setCountdown(30);
      setTimeout(() => document.getElementById('otp-0')?.focus(), 50);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resend code');
    } finally { setResending(false); }
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
            <svg width="30" height="30" fill="none" viewBox="0 0 24 24" stroke="rgba(216,180,254,0.9)" strokeWidth="1.8"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          </div>
          <h2 style={{ fontSize: '34px', fontWeight: '900', lineHeight: 1.2, margin: '0 0 16px 0', color: '#fff' }}>
            Verify your<br />Email Address
          </h2>
          <p style={{ fontSize: '15px', color: 'rgba(221,214,254,0.85)', lineHeight: 1.6, margin: 0, maxWidth: '270px' }}>
            We sent a 6-digit code to your inbox. Enter it to verify your account.
          </p>
        </div>

        {/* Bottom info card */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px', padding: '16px 20px', backdropFilter: 'blur(10px)' }}>
            <div style={{ fontSize: '12px', color: 'rgba(216,180,254,0.7)', fontWeight: '600', marginBottom: '4px' }}>📧 Sending to</div>
            <div style={{ fontSize: '15px', color: '#fff', fontWeight: '700', wordBreak: 'break-all' }}>{email}</div>
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
        {/* Back to Login Link on top-left of the otp panel */}
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

          <div style={{ marginBottom: '36px' }}>
            <h1 style={{ fontSize: '30px', fontWeight: '800', color: '#1e0a4e', margin: '0 0 8px 0' }}>
              Enter OTP Code ✉️
            </h1>
            <p style={{ fontSize: '15px', color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>
              Enter the 6-digit code sent to <strong style={{ color: '#7c3aed' }}>{email}</strong>
            </p>
          </div>

          <form onSubmit={handleVerify}>
            {/* OTP boxes */}
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '28px' }}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  id={`otp-${idx}`}
                  type="text"
                  inputMode="numeric"
                  value={digit}
                  onChange={e => handleChange(e.target.value, idx)}
                  onKeyDown={e => handleKeyDown(e, idx)}
                  onPaste={handlePaste}
                  maxLength={1}
                  style={{
                    width: '54px', height: '62px',
                    textAlign: 'center',
                    fontSize: '22px', fontWeight: '800', color: '#1e0a4e',
                    border: digit ? '2px solid #7c3aed' : '1.5px solid #e9d5ff',
                    borderRadius: '14px',
                    background: digit ? '#faf5ff' : '#fff',
                    outline: 'none',
                    boxShadow: digit
                      ? '0 0 0 4px rgba(124,58,237,0.1)'
                      : '0 1px 4px rgba(139,92,246,0.06)',
                    transition: 'all 0.15s ease',
                    fontFamily: 'inherit',
                    caretColor: '#7c3aed',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#7c3aed'; e.target.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)'; e.target.style.background = '#faf5ff'; }}
                  onBlur={e => { if (!digit) { e.target.style.borderColor = '#e9d5ff'; e.target.style.boxShadow = '0 1px 4px rgba(139,92,246,0.06)'; e.target.style.background = '#fff'; } }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              style={{
                width: '100%', padding: '14px',
                background: (loading || otp.join('').length !== 6) ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700',
                cursor: (loading || otp.join('').length !== 6) ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                transition: 'all 0.2s', marginBottom: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              }}
            >
              {loading ? 'Verifying...' : (<><BsCheckCircle size={17} /><span>Verify Code</span></>)}
            </button>
          </form>

          {/* Resend Button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || countdown > 0}
            style={{
              width: '100%', padding: '13px',
              background: 'transparent',
              color: '#7c3aed', border: '1.5px solid #e9d5ff',
              borderRadius: '12px', fontSize: '15px', fontWeight: '700',
              cursor: (resending || countdown > 0) ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'all 0.2s',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '28px',
              opacity: (resending || countdown > 0) ? 0.6 : 1,
            }}
          >
            {resending ? 'Sending...' : (<><BsArrowRepeat size={16} /><span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}</span></>)}
          </button>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', margin: 0 }}>
            Make sure to check your spam folder if you don't see it.
          </p>
        </div>
      </div>
    </div>
  );
}
