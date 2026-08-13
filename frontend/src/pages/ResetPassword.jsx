import React, { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { BsLock, BsEye, BsEyeSlash, BsArrowRight, BsPatchQuestion, BsCheckCircle, BsArrowLeft } from 'react-icons/bs';
import styles from './Auth.module.css';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
  
  switch(score) {
    case 1: return { score: 25, label: 'Weak', color: '#ef4444' };
    case 2: return { score: 50, label: 'Fair', color: '#f97316' };
    case 3: return { score: 75, label: 'Good', color: '#eab308' };
    case 4: return { score: 100, label: 'Strong', color: '#10b981' };
    default: return { score: 10, label: 'Very Weak', color: '#ef4444' };
  }
};

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    if (password.length < 6) {
      return toast.error('Password must be at least 6 characters');
    }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success('Password reset successfully! You can now log in.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reset password. Token may be invalid or expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left Column: Hero Graphic Area */}
      <div className={styles.graphicColumn}>
        <div className={styles.graphicWrapper}>
          <div className={styles.ambientGlow} />
          <div className={styles.graphicElement}>
            {/* Isometric Glassmorphic 3D Dashboard SVG Graphic */}
            <svg viewBox="0 0 500 500" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="cardGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="cardGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EC4899" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="glowPurple" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="borderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                  <stop offset="30%" stopColor="#3B82F6" stopOpacity="0.1" />
                  <stop offset="70%" stopColor="#10B981" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#EC4899" stopOpacity="0.6" />
                </linearGradient>
                <filter id="glassShadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="15" stdDeviation="25" floodColor="#000000" floodOpacity="0.5" />
                </filter>
                <filter id="glowFilter">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              {/* Background Network Connecting Nodes */}
              <g opacity="0.3" stroke="#8B5CF6" strokeWidth="1.5">
                <line x1="80" y1="120" x2="220" y2="80" strokeDasharray="5,5" />
                <line x1="220" y1="80" x2="420" y2="180" />
                <line x1="420" y1="180" x2="350" y2="380" strokeDasharray="3,3" />
                <line x1="350" y1="380" x2="120" y2="350" />
                <line x1="120" y1="350" x2="80" y2="120" />
                <line x1="220" y1="80" x2="280" y2="240" />
                <line x1="280" y1="240" x2="120" y2="350" />
                <line x1="280" y1="240" x2="350" y2="380" />
              </g>
              <g fill="#A78BFA">
                <circle cx="80" cy="120" r="4" filter="url(#glowFilter)" />
                <circle cx="220" cy="80" r="6" filter="url(#glowFilter)" />
                <circle cx="420" cy="180" r="5" filter="url(#glowFilter)" />
                <circle cx="350" cy="380" r="6" filter="url(#glowFilter)" />
                <circle cx="120" cy="350" r="4" filter="url(#glowFilter)" />
                <circle cx="280" cy="240" r="7" fill="#60A5FA" filter="url(#glowFilter)" />
              </g>

              {/* Isometric Platform (Shadow Card base) */}
              <rect x="75" y="165" width="340" height="230" rx="24" fill="url(#cardGrad1)" stroke="url(#borderGrad)" strokeWidth="1.5" filter="url(#glassShadow)" />

              {/* Tilted Floating Glassmorphic Main Card */}
              <g transform="translate(110, 130)">
                <rect x="0" y="0" width="280" height="190" rx="20" fill="url(#cardGrad2)" stroke="url(#borderGrad)" strokeWidth="2" filter="url(#glassShadow)" />
                
                {/* Header */}
                <text x="25" y="35" fill="#FFFFFF" fontSize="15" fontWeight="700" fontFamily="Plus Jakarta Sans">Reset Password</text>
                <rect x="25" y="48" width="80" height="4" rx="2" fill="#8B5CF6" />
                
                {/* Circle Stats */}
                <circle cx="75" cy="115" r="40" stroke="#1E293B" strokeWidth="8" fill="none" />
                <circle cx="75" cy="115" r="40" stroke="url(#glowPurple)" strokeWidth="8" fill="none" strokeDasharray="251" strokeDashoffset="45" strokeLinecap="round" filter="url(#glowFilter)" />
                <text x="75" y="121" fill="#FFFFFF" fontSize="18" fontWeight="800" textAnchor="middle" fontFamily="Plus Jakarta Sans">100%</text>

                {/* Vertical Bar Chart Mini */}
                <g transform="translate(150, 75)">
                  <rect x="0" y="50" width="12" height="30" rx="4" fill="#1E293B" />
                  <rect x="0" y="50" width="12" height="30" rx="4" fill="#3B82F6" />
                  
                  <rect x="20" y="30" width="12" height="50" rx="4" fill="#1E293B" />
                  <rect x="20" y="30" width="12" height="50" rx="4" fill="#8B5CF6" />

                  <rect x="40" y="10" width="12" height="70" rx="4" fill="#1E293B" />
                  <rect x="40" y="10" width="12" height="70" rx="4" fill="#10B981" filter="url(#glowFilter)" />

                  <rect x="60" y="40" width="12" height="40" rx="4" fill="#1E293B" />
                  <rect x="60" y="40" width="12" height="40" rx="4" fill="#F59E0B" />
                </g>

                {/* Status Badges */}
                <rect x="150" y="25" width="105" height="22" rx="11" fill="rgba(16, 185, 129, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
                <circle cx="162" cy="36" r="4" fill="#10B981" filter="url(#glowFilter)" />
                <text x="174" y="40" fill="#34D399" fontSize="10" fontWeight="700" fontFamily="Plus Jakarta Sans">SECURE LINK</text>

                {/* Small floating card inside SVG */}
                <g transform="translate(-40, 110)">
                  <rect x="0" y="0" width="100" height="60" rx="12" fill="rgba(15, 23, 42, 0.85)" stroke="url(#borderGrad)" strokeWidth="1.5" filter="url(#glassShadow)" />
                  <circle cx="25" cy="30" r="12" fill="rgba(16, 185, 129, 0.2)" />
                  <path d="M21,30 L24,33 L29,27" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <text x="45" y="28" fill="#FFFFFF" fontSize="10" fontWeight="800" fontFamily="Plus Jakarta Sans">Secure</text>
                  <text x="45" y="40" fill="#94A3B8" fontSize="8" fontWeight="600" fontFamily="Plus Jakarta Sans">Encrypted</text>
                </g>
              </g>

              {/* Top Sparkles / Glow points */}
              <path d="M420,100 L425,105 L420,110 L415,105 Z" fill="#FBBF24" filter="url(#glowFilter)" />
              <path d="M120,60 L123,63 L120,66 L117,63 Z" fill="#60A5FA" />
              <path d="M340,320 L345,325 L340,330 L335,325 Z" fill="#EC4899" filter="url(#glowFilter)" />
            </svg>
          </div>
        </div>
      </div>

      {/* Right Column: Form Area */}
      <div className={styles.formColumn}>
        <div className={styles.formContainer}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <BsPatchQuestion size={22} />
            </div>
            <span className={styles.logoText}>Examind AI</span>
            <span className={styles.tagline}>Reset</span>
          </div>

          <h1 className={styles.title}>Reset Password</h1>
          <p className={styles.subtitle}>Enter your new password to regain access to your account.</p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.field}>
              <label>New Password *</label>
              <div className={styles.inputWrap}>
                <BsLock className={styles.inputIcon} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className={styles.eyeBtn} onClick={() => setShowPwd(!showPwd)}>
                  {showPwd ? <BsEyeSlash size={15} /> : <BsEye size={15} />}
                </button>
              </div>
              {password && (
                <div className={styles.strengthMeter}>
                  <div className={styles.strengthTrack}>
                    <div
                      className={styles.strengthBar}
                      style={{
                        width: `${getPasswordStrength(password).score}%`,
                        backgroundColor: getPasswordStrength(password).color,
                      }}
                    />
                  </div>
                  <span className={styles.strengthLabel}>
                    Strength: <strong style={{ color: getPasswordStrength(password).color }}>{getPasswordStrength(password).label}</strong>
                  </span>
                </div>
              )}
            </div>

            <div className={styles.field}>
              <label>Confirm Password *</label>
              <div className={styles.inputWrap}>
                <BsLock className={styles.inputIcon} />
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Repeat password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (
                <span className={styles.spin} />
              ) : (
                <>
                  <span>Reset Password</span>
                  <BsArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <p className={styles.switchText} style={{ marginTop: 24 }}>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
              <BsArrowLeft size={16} /> Back to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
