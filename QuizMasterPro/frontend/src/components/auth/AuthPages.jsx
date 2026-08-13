import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Form, Alert, Spinner, Tab, Nav } from 'react-bootstrap';
import { FiMail, FiLock, FiUser, FiBriefcase, FiArrowRight, FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/api';

// ── SHARED AUTH LAYOUT ────────────────────────────────────────
export const AuthLayout = ({ children, title, subtitle }) => (
  <div className="auth-wrapper">
    <div className="auth-left">
      <div className="auth-brand">Quiz<span>Master</span> Pro</div>
      <div className="auth-headline">Master Every Subject with Smart Quizzes</div>
      <p className="auth-sub">AI-powered quizzes, real-time analytics, and gamified learning for modern education.</p>
      {[
        { icon: '🎯', text: 'AI-Generated Questions with Gemini' },
        { icon: '📊', text: 'Real-time Analytics & Insights' },
        { icon: '🏆', text: 'Points, Levels & Leaderboards' },
        { icon: '🎓', text: 'Digital Certificates on Completion' },
        { icon: '🛡️', text: 'Advanced Anti-Cheat Protection' },
      ].map(f => (
        <div key={f.icon} className="auth-feature">
          <div className="auth-feature-icon">{f.icon}</div>
          <span className="auth-feature-text">{f.text}</span>
        </div>
      ))}
    </div>
    <div className="auth-right">
      <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
        <div className="auth-title">{title}</div>
        <div className="auth-subtitle">{subtitle}</div>
        <div style={{ marginTop: 28 }}>{children}</div>
      </div>
    </div>
  </div>
);

// ── LOGIN ─────────────────────────────────────────────────────
export const LoginPage = () => {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault(); setError('');
    const r = await login(form.email, form.password);
    if (r.success) {
      navigate(r.role === 'admin' ? '/admin' : r.role === 'faculty' ? '/faculty' : '/student');
    } else setError('Invalid email or password');
  };

  const demoFill = (role) => {
    const demos = {
      admin: { email: 'admin@quizmaster.com', password: 'Admin@123' },
      faculty: { email: 'faculty@demo.com', password: 'Demo@123' },
      student: { email: 'student@demo.com', password: 'Demo@123' },
    };
    setForm(demos[role]);
  };

  return (
    <AuthLayout title="Welcome back 👋" subtitle="Sign in to your QuizMaster Pro account">
      {error && <Alert variant="danger" className="py-2 mb-3" style={{ borderRadius: 8, fontSize: '.875rem' }}>{error}</Alert>}

      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {['admin', 'faculty', 'student'].map(r => (
          <button key={r} onClick={() => demoFill(r)} style={{ flex: 1, padding: '6px 0', border: '1px solid var(--border)', borderRadius: 6, fontSize: '.72rem', fontWeight: 600, background: 'white', cursor: 'pointer', color: 'var(--gray)', textTransform: 'capitalize' }}>
            Demo {r}
          </button>
        ))}
      </div>

      <form onSubmit={handle}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label-custom">Email Address</label>
          <div className="input-icon-wrap">
            <FiMail className="input-icon" />
            <input className="form-control-custom" type="email" placeholder="you@example.com"
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label className="form-label-custom" style={{ marginBottom: 0 }}>Password</label>
            <Link to="/forgot-password" style={{ fontSize: '.8rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Forgot password?</Link>
          </div>
          <div className="input-icon-wrap" style={{ position: 'relative' }}>
            <FiLock className="input-icon" />
            <input className="form-control-custom" type={showPass ? 'text' : 'password'} placeholder="••••••••"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}>
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
        <button type="submit" className="btn-primary-custom" style={{ width: '100%', padding: '13px', fontSize: '1rem' }} disabled={loading}>
          {loading ? <Spinner size="sm" /> : <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>Sign In <FiArrowRight /></span>}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.875rem', color: 'var(--gray)' }}>
        Don't have an account? <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign up</Link>
      </p>
    </AuthLayout>
  );
};

// ── REGISTER ──────────────────────────────────────────────────
export const RegisterPage = () => {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', studentId: '', employeeId: '', designation: '', course: '', phone: '' });
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) errs.email = 'Invalid email';
    if (form.password.length < 6) errs.password = 'Minimum 6 characters';
    setErrors(errs);
    return !Object.keys(errs).length;
  };

  const handle = async e => {
    e.preventDefault();
    if (!validate()) return;
    const r = await register({ ...form, role });
    if (r.success) navigate(role === 'faculty' ? '/faculty' : '/student');
  };

  const field = (label, name, type = 'text', icon, placeholder) => (
    <div style={{ marginBottom: 14 }}>
      <label className="form-label-custom">{label}</label>
      <div className="input-icon-wrap">
        {icon && React.createElement(icon, { className: 'input-icon' })}
        <input className={`form-control-custom ${errors[name] ? 'border-danger' : ''}`}
          type={type === 'password' ? (showPass ? 'text' : 'password') : type}
          placeholder={placeholder}
          value={form[name]} onChange={e => setForm({ ...form, [name]: e.target.value })}
          style={icon ? {} : { paddingLeft: 14 }}
        />
      </div>
      {errors[name] && <div style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>{errors[name]}</div>}
    </div>
  );

  return (
    <AuthLayout title="Create account ✨" subtitle="Join thousands of students and educators">
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['student', 'faculty'].map(r => (
          <button key={r} onClick={() => setRole(r)}
            style={{ flex: 1, padding: '10px', border: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, fontWeight: 600, fontSize: '.875rem', background: role === r ? 'var(--primary-light)' : 'white', color: role === r ? 'var(--primary-dark)' : 'var(--gray)', cursor: 'pointer', transition: 'all .2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            {r === 'student' ? '🎓' : '👨‍🏫'} {r.charAt(0).toUpperCase() + r.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handle}>
        {field('Full Name', 'name', 'text', FiUser, 'Your full name')}
        {field('Email Address', 'email', 'email', FiMail, 'you@example.com')}
        <div style={{ marginBottom: 14 }}>
          <label className="form-label-custom">Password</label>
          <div className="input-icon-wrap" style={{ position: 'relative' }}>
            <FiLock className="input-icon" />
            <input className={`form-control-custom ${errors.password ? 'border-danger' : ''}`}
              type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
              value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} style={{ paddingRight: 40 }} />
            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
              {showPass ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          {errors.password && <div style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>{errors.password}</div>}
        </div>
        {field('Department', 'department', 'text', null, role === 'student' ? 'e.g. Computer Science' : 'e.g. Engineering')}
        {role === 'student' && field('Student ID', 'studentId', 'text', null, 'e.g. CS2021001')}
        {role === 'student' && field('Course', 'course', 'text', null, 'e.g. B.Tech CSE')}
        {role === 'faculty' && field('Employee ID', 'employeeId', 'text', FiBriefcase, 'e.g. FAC001')}
        {role === 'faculty' && field('Designation', 'designation', 'text', null, 'e.g. Assistant Professor')}

        <button type="submit" className="btn-primary-custom" style={{ width: '100%', padding: 13, marginTop: 6 }} disabled={loading}>
          {loading ? <Spinner size="sm" /> : 'Create Account'}
        </button>
      </form>
      <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.875rem', color: 'var(--gray)' }}>
        Already have an account? <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>Sign in</Link>
      </p>
    </AuthLayout>
  );
};

// ── RESET PASSWORD ────────────────────────────────────────────
export const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [form, setForm] = useState({ newPassword: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async e => {
    e.preventDefault(); setError('');
    if (form.newPassword.length < 6) return setError('Password must be at least 6 characters');
    if (form.newPassword !== form.confirm) return setError('Passwords do not match');
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ token, newPassword: form.newPassword });
      if (data.success) setDone(true);
      else setError(data.message || 'Reset link is invalid or expired');
    } catch (err) {
      setError(err.response?.data?.message || 'Reset link is invalid or expired');
    } finally { setLoading(false); }
  };

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This password reset link is missing a token">
        <Alert variant="danger" style={{ borderRadius: 10 }}>
          This reset link looks broken. Please request a new one.
          <br /><Link to="/forgot-password" style={{ color: 'var(--primary)', fontWeight: 600 }}>Request new link</Link>
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set New Password 🔑" subtitle="Choose a new password for your account">
      {done
        ? <Alert variant="success" style={{ borderRadius: 10 }}>
            ✅ Password reset successfully. You can now sign in.
            <br /><Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
          </Alert>
        : <form onSubmit={handle}>
            {error && <Alert variant="danger" className="py-2 mb-3" style={{ borderRadius: 8, fontSize: '.875rem' }}>{error}</Alert>}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label-custom">New Password</label>
              <div className="input-icon-wrap" style={{ position: 'relative' }}>
                <FiLock className="input-icon" />
                <input className="form-control-custom" type={showPass ? 'text' : 'password'} placeholder="Min. 6 characters"
                  value={form.newPassword} onChange={e => setForm({ ...form, newPassword: e.target.value })} required style={{ paddingRight: 40 }} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gray)', cursor: 'pointer' }}>
                  {showPass ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label-custom">Confirm New Password</label>
              <div className="input-icon-wrap">
                <FiLock className="input-icon" />
                <input className="form-control-custom" type={showPass ? 'text' : 'password'} placeholder="Re-enter password"
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              </div>
            </div>
            <button type="submit" className="btn-primary-custom" style={{ width: '100%', padding: 13 }} disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Reset Password'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.875rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>← Back to login</Link>
            </p>
          </form>
      }
    </AuthLayout>
  );
};

// ── FORGOT PASSWORD ───────────────────────────────────────────
export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handle = async e => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not send the reset email. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <AuthLayout title="Reset Password 🔑" subtitle="Enter your email and we'll send a reset link">
      {sent
        ? <Alert variant="success" style={{ borderRadius: 10 }}>
            ✅ Check your email for password reset instructions.
            <br /><Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600 }}>Back to login</Link>
          </Alert>
        : <form onSubmit={handle}>
            {error && <Alert variant="danger" className="py-2 mb-3" style={{ borderRadius: 8, fontSize: '.875rem' }}>{error}</Alert>}
            <div style={{ marginBottom: 16 }}>
              <label className="form-label-custom">Email Address</label>
              <div className="input-icon-wrap">
                <FiMail className="input-icon" />
                <input className="form-control-custom" type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <button type="submit" className="btn-primary-custom" style={{ width: '100%', padding: 13 }} disabled={loading}>
              {loading ? <Spinner size="sm" /> : 'Send Reset Link'}
            </button>
            <p style={{ textAlign: 'center', marginTop: 16, fontSize: '.875rem' }}>
              <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>← Back to login</Link>
            </p>
          </form>
      }
    </AuthLayout>
  );
};
