import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { BsEye, BsEyeSlash } from 'react-icons/bs';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
  switch (score) {
    case 1: return { score: 25, label: 'Weak', color: '#ef4444' };
    case 2: return { score: 50, label: 'Fair', color: '#f97316' };
    case 3: return { score: 75, label: 'Good', color: '#eab308' };
    case 4: return { score: 100, label: 'Strong', color: '#10b981' };
    default: return { score: 10, label: 'Very Weak', color: '#ef4444' };
  }
};

/* ── Focusable input wrapper ── */
function InputField({ label, focused, children }) {
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
        padding: '11px 14px',
        background: focused ? '#faf5ff' : '#fff',
        boxShadow: focused
          ? '0 0 0 4px rgba(124,58,237,0.12), 0 2px 12px rgba(124,58,237,0.08)'
          : '0 1px 4px rgba(139,92,246,0.06)',
        transition: 'all 0.2s ease',
        gap: '8px',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function Register() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', studentId: '', semester: '', division: ''
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const strength = getPasswordStrength(form.password);

  const inputStyle = {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: '14px',
    color: '#1e0a4e',
    background: 'transparent',
    fontFamily: 'inherit',
    minWidth: 0,
  };

  const focus = (name) => () => setFocused(name);
  const blur = () => setFocused(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Passwords do not match');
    if (form.password.length < 6)
      return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name:       form.name,
        email:      form.email,
        password:   form.password,
        role:       'student',
        department: form.department,
        studentId:  form.studentId,
        semester:   form.semester,
        division:   form.division,
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      updateUser(res.data.user);
      toast.success('Registration successful! Please verify your email.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', minHeight: '100vh', width: '100%', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* ── LEFT PANEL ─────────────────────────────────────────── */}
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

        {/* Copy */}
        <div style={{ position: 'relative', zIndex: 2 }}>
          <h2 style={{ fontSize: '34px', fontWeight: '900', lineHeight: 1.2, margin: '0 0 16px 0', color: '#fff' }}>Join thousands of<br />smart learners</h2>
          <p style={{ fontSize: '15px', color: 'rgba(221,214,254,0.85)', lineHeight: 1.6, margin: 0, maxWidth: '270px' }}>Create your free account and start<br />practicing with AI-powered quizzes.</p>
        </div>

        {/* Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0', position: 'relative', zIndex: 2 }}>
          {[
            { n: 1, sub: 'Step one', title: 'Create your account', active: true },
            { n: 2, sub: 'Step two', title: 'Join your institute', active: false },
            { n: 3, sub: 'Step three', title: 'Start giving exams', active: false },
          ].map((step, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative', paddingBottom: i < 2 ? '24px' : '0' }}>
              {i < 2 && <div style={{ position: 'absolute', left: '19px', top: '40px', width: '2px', height: 'calc(100% - 16px)', background: 'rgba(255,255,255,0.2)' }} />}
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%', flexShrink: 0, zIndex: 1,
                background: step.active ? '#fff' : 'rgba(255,255,255,0.12)',
                border: step.active ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                color: step.active ? '#4c1d95' : 'rgba(216,180,254,0.8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: '800', fontSize: '15px',
              }}>{step.n}</div>
              <div style={{ paddingTop: '4px' }}>
                <div style={{ fontSize: '10px', color: step.active ? 'rgba(216,180,254,0.6)' : 'rgba(216,180,254,0.45)', fontWeight: '700', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '2px' }}>{step.sub}</div>
                <div style={{ fontSize: '15px', fontWeight: '800', color: step.active ? '#fff' : 'rgba(216,180,254,0.7)' }}>{step.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────────────────────── */}
      <div className="auth-right" style={{ 
        flex: 1,         background: '#fff', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '40px 60px', 
        overflowY: 'auto',
        position: 'relative'
      }}>
        {/* Back to Login Link on top-left of the register panel */}
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

        <div style={{ width: '100%', maxWidth: '600px' }}>

          <div style={{ marginBottom: '32px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '800', color: '#1e0a4e', margin: '0 0 8px 0' }}>Create Student Account</h1>
            <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>Register as a student to access all institute quizzes</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 24px', marginBottom: '24px' }}>

              {/* Full Name */}
              <InputField label="Full Name" focused={focused === 'name'}>
                <input type="text" placeholder="Your full name" value={form.name} onChange={set('name')} required
                  onFocus={focus('name')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Email */}
              <InputField label="Email" focused={focused === 'email'}>
                <input type="email" placeholder="your@email.com" value={form.email} onChange={set('email')} required
                  onFocus={focus('email')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Password */}
              <div>
                <InputField label="Password" focused={focused === 'password'}>
                  <input type={showPwd ? 'text' : 'password'} placeholder="Min 6 characters" value={form.password}
                    onChange={set('password')} required onFocus={focus('password')} onBlur={blur} style={inputStyle} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, display: 'flex', flexShrink: 0 }}>
                    {showPwd ? <BsEyeSlash size={16} /> : <BsEye size={16} />}
                  </button>
                </InputField>
                {form.password && (
                  <div style={{ marginTop: '6px', paddingLeft: '2px' }}>
                    <div style={{ height: '3px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${strength.score}%`, background: strength.color, transition: 'width 0.3s' }} />
                    </div>
                    <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', display: 'block' }}>
                      Strength: <strong style={{ color: strength.color }}>{strength.label}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <InputField label="Confirm Password" focused={focused === 'confirm'}>
                <input type={showPwd ? 'text' : 'password'} placeholder="Repeat password" value={form.confirmPassword}
                  onChange={set('confirmPassword')} required onFocus={focus('confirm')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Course Name */}
              <InputField label="Course Name" focused={focused === 'dept'}>
                <input type="text" placeholder="e.g. Computer Science" value={form.department} onChange={set('department')}
                  onFocus={focus('dept')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Student ID */}
              <InputField label="Student ID" focused={focused === 'sid'}>
                <input type="text" placeholder="e.g. CS2021001" value={form.studentId} onChange={set('studentId')}
                  onFocus={focus('sid')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Semester */}
              <InputField label="Semester" focused={focused === 'sem'}>
                <input type="text" placeholder="e.g. 5" value={form.semester} onChange={set('semester')}
                  onFocus={focus('sem')} onBlur={blur} style={inputStyle} />
              </InputField>

              {/* Division */}
              <InputField label="Division" focused={focused === 'div'}>
                <input type="text" placeholder="e.g. A" value={form.division} onChange={set('division')}
                  onFocus={focus('div')} onBlur={blur} style={inputStyle} />
              </InputField>

            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#a78bfa' : 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                color: '#fff', border: 'none', borderRadius: '12px',
                fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
                transition: 'all 0.2s', marginBottom: '20px',
              }}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '13px', color: '#94a3b8', margin: '0 0 8px 0' }}>
            Faculty &amp; Admin accounts are created by Admin
          </p>
          <p style={{ textAlign: 'center', fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#7c3aed', fontWeight: '700', textDecoration: 'none' }}>Sign In</Link>
          </p>

        </div>
      </div>
    </div>
  );
}
