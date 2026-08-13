import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BsCpu, BsBarChart, BsShieldCheck, BsTrophy, BsGraphUp,
  BsJournalText, BsBell, BsCheck, BsArrowRight,
  BsLightningCharge, BsMortarboard, BsPatchQuestion, BsPerson,
  BsSun, BsMoon, BsCameraVideo, BsFileEarmarkArrowUp, BsStar,
  BsAward, BsChevronLeft, BsChevronRight, BsList, BsX
} from 'react-icons/bs';

/* ── DATA ─────────────────────────────────────────────── */
const FEATURES = [
  { icon: <BsCpu size={22}/>, color: '#7c3aed', bg: '#f5f3ff', title: 'AI Question Generation', desc: 'Generate exam-ready MCQs instantly from any topic using Gemini AI.' },
  { icon: <BsFileEarmarkArrowUp size={22}/>, color: '#0ea5e9', bg: '#eff6ff', title: 'Import Questions', desc: 'Bulk-upload via Excel / CSV or import with a single click.' },
  { icon: <BsShieldCheck size={22}/>, color: '#10b981', bg: '#ecfdf5', title: 'Advanced Anti-Cheat', desc: 'AI proctoring, tab-switch detection, copy-paste blocking & more.' },
  { icon: <BsCameraVideo size={22}/>, color: '#f59e0b', bg: '#fffbeb', title: 'Live Proctoring', desc: 'AI-powered live monitoring with real-time session recordings.' },
  { icon: <BsTrophy size={22}/>, color: '#ef4444', bg: '#fff1f2', title: 'Leaderboards & XP', desc: 'Gamified learning with XP scores, streaks, and global leaderboards.' },
  { icon: <BsGraphUp size={22}/>, color: '#8b5cf6', bg: '#f5f3ff', title: 'Deep Analytics', desc: 'Per-question accuracy, time analysis, trends, and student performance.' },
  { icon: <BsAward size={22}/>, color: '#0d9488', bg: '#f0fdf4', title: 'Certificates', desc: 'Auto-issue verifiable digital certificates for learners who qualify.' },
  { icon: <BsBell size={22}/>, color: '#f97316', bg: '#fff7ed', title: 'Smart Notifications', desc: 'Real-time alerts for results, deadlines, achievements, and announcements.' },
];

const STATS = [
  { val: '500K+', label: 'Quizzes Created', icon: <BsJournalText size={22}/> },
  { val: '2M+', label: 'Students Impacted', icon: <BsPerson size={22}/> },
  { val: '98.6%', label: 'Satisfaction Rate', icon: <BsStar size={22}/> },
  { val: '200+', label: 'Institutions Trust Us', icon: <BsMortarboard size={22}/> },
];

const TESTIMONIALS = [
  { name: 'Dr. Ramesh Sharma', role: 'Professor, IIT Hyderabad', text: '"Examind AI has completely transformed how we conduct exams. Secure, simple, and powerful!"' },
  { name: 'Prof. Neha Kapoor', role: 'Dean, Amity University', text: '"The analytics help us understand student performance like never before. Highly recommended!"' },
  { name: 'Aryan Mehta', role: 'B.Tech Student', text: '"As a student, I love the real-time feedback, badges, and certificates. It keeps me motivated!"' },
];

const INSTITUTIONS = ['IIT HYDERABAD', 'NIT SURAT', 'AMITY', 'CHRISTUNIVERSITY', 'LPU'];

/* ── COMPONENT ─────────────────────────────────────────── */
export default function Landing() {
  const isDark = false;
  const [tIdx, setTIdx] = useState(0);
  const [activeSection, setActiveSection] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const isTablet = windowWidth < 1024;

  React.useEffect(() => {
    const handleScroll = () => {
      const sections = ['features', 'roles', 'stats', 'pricing'];
      let currentSection = '';
      
      if (window.scrollY < 150) {
        setActiveSection('');
        return;
      }

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            currentSection = sectionId;
            break;
          }
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const C = {
    bg: '#ffffff',
    bgAlt: '#f8f5ff',
    text: '#1e0a4e',
    muted: '#64748b',
    border: '#e9d5ff',
    card: '#ffffff',
  };

  return (
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", background: C.bg, color: C.text, overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: isMobile ? '0 20px' : '0 60px', height: '64px',
        background: isDark ? 'rgba(15,10,30,0.95)' : 'rgba(255,255,255,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BsPatchQuestion size={18} color="#fff"/>
          </div>
          <span style={{ fontWeight: '800', fontSize: '16px' }}>Examind AI</span>
        </div>

        {/* Nav Links */}
        <div style={{ display: isMobile ? 'none' : 'flex', gap: '32px' }}>
          {[['Features','#features'],['Solutions','#roles'],['Resources','#stats'],['Pricing','#pricing']].map(([label, href]) => {
            const isActive = href === `#${activeSection}`;
            return (
              <a key={label} href={href} style={{ 
                fontSize: '14px', 
                fontWeight: isActive ? '700' : '500', 
                color: isActive ? '#7c3aed' : C.muted, 
                textDecoration: 'none', 
                transition: 'color 0.2s',
                position: 'relative'
              }}
              onMouseEnter={e => { if (!isActive) e.target.style.color='#7c3aed'; }} 
              onMouseLeave={e => { if (!isActive) e.target.style.color=C.muted; }}>
                {label}
                {isActive && (
                  <span style={{
                    position: 'absolute',
                    bottom: '-6px',
                    left: '0',
                    right: '0',
                    height: '2px',
                    background: '#7c3aed',
                    borderRadius: '2px'
                  }} />
                )}
              </a>
            );
          })}
        </div>

        {/* Actions */}
        <div style={{ display: isMobile ? 'none' : 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/login" style={{ fontSize: '14px', fontWeight: '600', color: C.text, textDecoration: 'none', padding: '8px 16px' }}>Sign In</Link>
          <Link to="/register" style={{ fontSize: '14px', fontWeight: '700', color: '#fff', textDecoration: 'none', padding: '9px 20px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', borderRadius: '8px', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(124,58,237,0.35)' }}>
            Get Started <BsArrowRight size={14}/>
          </Link>
        </div>

        {/* Hamburger Menu (Mobile Only) */}
        <button 
          className="landing-menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: isMobile ? 'block' : 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: C.text,
            padding: '4px',
            outline: 'none'
          }}
        >
          {menuOpen ? <BsX size={26} /> : <BsList size={26} />}
        </button>
      </nav>

      {/* Mobile Drawer Menu */}
      {menuOpen && (
        <div className="landing-mobile-menu" style={{
          position: 'fixed',
          top: '64px',
          left: 0,
          right: 0,
          background: isDark ? 'rgba(15,10,30,0.98)' : 'rgba(255,255,255,0.98)',
          borderBottom: `1px solid ${C.border}`,
          zIndex: 99,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px 24px',
          gap: '16px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(12px)'
        }}>
          {[['Features','#features'],['Solutions','#roles'],['Resources','#stats'],['Pricing','#pricing']].map(([label, href]) => (
            <a 
              key={label} 
              href={href} 
              onClick={() => setMenuOpen(false)}
              style={{
                fontSize: '16px',
                fontWeight: '600',
                color: C.text,
                textDecoration: 'none',
                padding: '8px 0'
              }}
            >
              {label}
            </a>
          ))}
          <div style={{ height: '1px', background: C.border, margin: '8px 0' }} />
          <Link 
            to="/login" 
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: '16px',
              fontWeight: '600',
              color: C.text,
              textDecoration: 'none',
              textAlign: 'center',
              padding: '10px',
              borderRadius: '8px',
              border: `1.5px solid ${C.border}`
            }}
          >
            Sign In
          </Link>
          <Link 
            to="/register" 
            onClick={() => setMenuOpen(false)}
            style={{
              fontSize: '16px',
              fontWeight: '700',
              color: '#fff',
              textDecoration: 'none',
              textAlign: 'center',
              padding: '12px',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(124,58,237,0.25)'
            }}
          >
            Get Started
          </Link>
        </div>
      )}

      {/* ── HERO ───────────────────────────────────────────── */}
      <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', padding: isMobile ? '100px 20px 40px' : '120px 60px 80px', position: 'relative', overflow: 'hidden', background: isDark ? 'linear-gradient(135deg,#0f0a1e 0%,#1a0a3e 50%,#0f0a1e 100%)' : 'linear-gradient(135deg,#ffffff 0%,#faf5ff 50%,#f3e8ff 100%)' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,58,237,0.12) 0%,transparent 70%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: '-80px', left: '30%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(109,40,217,0.08) 0%,transparent 70%)', pointerEvents: 'none' }}/>

        {/* Center Container wrapper */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center', 
          justifyContent: 'space-between', 
          width: '100%', 
          maxWidth: '1100px', 
          margin: '0 auto', 
          zIndex: 1, 
          gap: isMobile ? '30px' : '40px',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          
          {/* Left Content */}
          <div style={{ 
            flex: 1, 
            maxWidth: isMobile ? '100%' : '520px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMobile ? 'center' : 'flex-start'
          }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: isDark ? 'rgba(124,58,237,0.15)' : '#f5f3ff', border: `1px solid ${isDark ? 'rgba(124,58,237,0.3)' : '#e9d5ff'}`, borderRadius: '999px', padding: '6px 14px', fontSize: '12px', fontWeight: '600', color: '#7c3aed', marginBottom: '28px' }}>
              <BsLightningCharge size={12}/> Powered by Examind AI
            </div>
            <h1 style={{ fontSize: isMobile ? '36px' : isTablet ? '44px' : '56px', fontWeight: '900', lineHeight: 1.1, margin: '0 0 24px 0', color: C.text }}>
              The <span style={{ color: '#7c3aed' }}>Smarter</span> Way<br/>to Create &amp; Take<br/>Exams
            </h1>
            <p style={{ fontSize: '17px', color: C.muted, lineHeight: 1.7, margin: '0 0 36px 0', maxWidth: '480px', textAlign: isMobile ? 'center' : 'left' }}>
              AI-powered quizzes, secure exams, deep analytics, and certificates — all in one platform built for modern education.
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginBottom: '28px', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              <Link to="/register?role=student" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(124,58,237,0.4)' }}>
                Start as Student <BsArrowRight size={16}/>
              </Link>
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
              {['Free to use', 'No credit card', 'Deploy anywhere'].map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '13px', color: C.muted, fontWeight: '500' }}>
                  <BsCheck size={15} color="#10b981"/> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Dashboard Preview Card */}
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            justifyContent: isMobile ? 'center' : 'flex-end',
            width: '100%',
            maxWidth: isMobile ? '100%' : 'none'
          }}>
            <div style={{ 
              width: '100%',
              maxWidth: '420px', 
              background: isDark ? '#1a1035' : '#fff', 
              borderRadius: '20px', 
              boxShadow: '0 24px 80px rgba(124,58,237,0.18)', 
              border: `1px solid ${C.border}`, 
              overflow: 'hidden' 
            }}>
              {/* Top bar */}
              <div style={{ background: 'linear-gradient(135deg,#7c3aed,#4c1d95)', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '2px' }}>Welcome back, Alex 👋</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>Student Dashboard</div>
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsBell size={16} color="#fff"/>
                </div>
              </div>
              {/* Stats row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: C.border }}>
                {[['Quizzes Taken','24'],['Questions','12'],['Certificates','1']].map(([l,v]) => (
                  <div key={l} style={{ background: C.card, padding: '14px', textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: '800', color: '#7c3aed' }}>{v}</div>
                    <div style={{ fontSize: '11px', color: C.muted }}>{l}</div>
                  </div>
                ))}
              </div>
              {/* Score ring */}
              <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '6px solid #e9d5ff', borderTopColor: '#7c3aed', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '18px', fontWeight: '800', color: '#7c3aed' }}>87%</span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: C.text, marginBottom: '4px' }}>Performance Overview</div>
                  <div style={{ height: '6px', background: '#e9d5ff', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '87%', background: 'linear-gradient(90deg,#7c3aed,#a855f7)', borderRadius: '99px' }}/>
                  </div>
                  <div style={{ fontSize: '11px', color: C.muted, marginTop: '4px' }}>Average score across all quizzes</div>
                </div>
              </div>
              {/* Recent Activity */}
              <div style={{ padding: '0 20px 16px', borderTop: `1px solid ${C.border}` }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.muted, padding: '12px 0 8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Activity</div>
                {[['Data Structures Quiz', '#10b981'],['OS Mid-term Exam', '#f59e0b'],['Operating Systems', '#ef4444']].map(([title, col]) => (
                  <div key={title} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: col, flexShrink: 0 }}/>
                    <div style={{ fontSize: '13px', color: C.text, fontWeight: '500' }}>{title}</div>
                  </div>
                ))}
              </div>
              {/* Certificate badge */}
              <div style={{ margin: '12px 20px', background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BsAward size={18} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#059669', fontWeight: '600' }}>Certificate Earned!</div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#065f46' }}>Web Development</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* ── FEATURES ────────────────────────────────────────── */}
      <section id="features" style={{ padding: isMobile ? '60px 20px' : '100px 60px', background: C.bg }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>EVERYTHING YOU NEED</div>
          <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', margin: '0 0 16px 0', color: C.text }}>Powerful features for <span style={{ color: '#7c3aed' }}>modern education</span></h2>
          <p style={{ fontSize: '16px', color: C.muted, maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>Built with security, analytics, and engagement at the core.</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '24px', maxWidth: '1100px', margin: '0 auto' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: C.card, borderRadius: '16px', padding: '28px 24px',
              border: `1px solid ${C.border}`,
              boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(124,58,237,0.06)',
              transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(124,58,237,0.14)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(124,58,237,0.06)'; }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', color: f.color }}>
                {f.icon}
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 8px 0', color: C.text }}>{f.title}</h3>
              <p style={{ fontSize: '13px', color: C.muted, lineHeight: 1.6, margin: '0 0 16px 0' }}>{f.desc}</p>
              <span style={{ fontSize: '13px', fontWeight: '600', color: f.color, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                Learn more <BsArrowRight size={12}/>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ROLES ───────────────────────────────────────────── */}
      <section id="roles" style={{ padding: isMobile ? '60px 20px' : '100px 60px', background: C.bgAlt }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>TWO ROLES, ONE PLATFORM</div>
          <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', margin: '0', color: C.text }}>Built for both <span style={{ color: '#7c3aed' }}>educators</span> &amp; <span style={{ color: '#0d9488' }}>learners</span></h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '32px', maxWidth: '1000px', margin: '0 auto', alignItems: 'stretch' }}>
          {/* Faculty card */}
          <div style={{ background: C.card, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(124,58,237,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#4c1d95,#7c3aed)', padding: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BsPerson size={24} color="#fff"/></div>
              <div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Role</div><div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>For Educators</div></div>
            </div>
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {['Create quizzes with full settings','Generate questions with Gemini AI','Import via Excel or CSV','Anti-cheat configuration','View analytics & reports','Export results & issue certificates'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}><BsCheck size={12} color="#7c3aed"/></div>
                    <span style={{ fontSize: '14px', color: C.text }}>{item}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '24px', padding: '12px 16px', background: isDark ? 'rgba(255,255,255,0.04)' : '#fafafe', borderRadius: '8px', border: `1px dashed ${C.border}`, textAlign: 'center', fontSize: '13px', color: C.muted, fontWeight: '700' }}>
                Explore Educator Tools →
              </div>
            </div>
          </div>

          {/* Student card */}
          <div style={{ background: C.card, borderRadius: '20px', overflow: 'hidden', border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(13,148,136,0.08)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: 'linear-gradient(135deg,#0d9488,#0f766e)', padding: '28px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BsMortarboard size={24} color="#fff"/></div>
              <div><div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', fontWeight: '600' }}>Role</div><div style={{ fontSize: '20px', fontWeight: '800', color: '#fff' }}>For Students</div></div>
            </div>
            <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                {['Browse and take quizzes','Secure timed exam environment','Real-time question navigator','Detailed answers & explanations','Earn XP, badges & certificates','Compete on leaderboards'].map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '8px 0', borderBottom: `1px solid ${C.border}` }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}><BsCheck size={12} color="#0d9488"/></div>
                    <span style={{ fontSize: '14px', color: C.text }}>{item}</span>
                  </div>
                ))}
              </div>
              <Link to="/register?role=student" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '24px', padding: '12px', background: 'linear-gradient(135deg,#0d9488,#0f766e)', color: '#fff', borderRadius: '8px', fontWeight: '700', fontSize: '14px', textDecoration: 'none', boxShadow: '0 4px 12px rgba(13,148,136,0.35)' }}>
                Join as Student <BsArrowRight size={14}/>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS ───────────────────────────────────────────── */}
      <section id="stats" style={{ padding: isMobile ? '40px 20px' : '80px 60px', background: 'linear-gradient(135deg,#4c1d95 0%,#7c3aed 50%,#6d28d9 100%)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? (windowWidth < 480 ? '1fr' : '1fr 1fr') : 'repeat(4,1fr)', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', color: '#fff' }}>{s.icon}</div>
              <div style={{ fontSize: '32px', fontWeight: '900', color: '#fff', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontWeight: '600', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── TESTIMONIALS ────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '100px 60px', background: C.bg }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '900', color: C.text, margin: '0 0 10px 0' }}>Loved by <span style={{ color: '#7c3aed' }}>educators</span> &amp; <span style={{ color: '#0d9488' }}>learners</span></h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : 'repeat(3,1fr)', gap: '24px', maxWidth: '1000px', margin: '0 auto' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: C.card, borderRadius: '16px', padding: '28px', border: `1px solid ${C.border}`, boxShadow: isDark ? '0 4px 16px rgba(0,0,0,0.3)' : '0 2px 12px rgba(124,58,237,0.06)' }}>
              <div style={{ display: 'flex', gap: '2px', marginBottom: '16px' }}>
                {[1,2,3,4,5].map(i => <BsStar key={i} size={14} color="#f59e0b"/>)}
              </div>
              <p style={{ fontSize: '14px', color: C.muted, lineHeight: 1.7, margin: '0 0 20px 0', fontStyle: 'italic' }}>{t.text}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsPerson size={18} color="#fff"/>
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: C.text }}>{t.name}</div>
                  <div style={{ fontSize: '12px', color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────── */}
      <section id="pricing" style={{ padding: isMobile ? '60px 20px' : '100px 60px', background: C.bgAlt, borderTop: `1px solid ${C.border}` }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ display: 'inline-block', fontSize: '12px', fontWeight: '700', color: '#7c3aed', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '12px' }}>PRICING PLANS</div>
          <h2 style={{ fontSize: isMobile ? '28px' : '40px', fontWeight: '900', margin: '0 0 16px 0', color: C.text }}>
            Simple, <span style={{ color: '#7c3aed' }}>transparent</span> pricing
          </h2>
          <p style={{ fontSize: '16px', color: C.muted, maxWidth: '520px', margin: '0 auto', lineHeight: 1.6 }}>
            Choose the plan that fits your study needs. Upgrade to Pro to unlock advanced AI-powered coaching tools.
          </p>
        </div>

        <div style={{ display: 'flex', gap: isMobile ? '24px' : '48px', maxWidth: '1000px', margin: '0 auto', alignItems: 'stretch', justifyContent: 'center', flexWrap: 'wrap' }}>
          {/* Free Plan */}
          <div style={{
            background: C.card,
            borderRadius: '20px',
            border: `1px solid ${C.border}`,
            padding: '40px 32px',
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : '0 4px 20px rgba(124,58,237,0.04)'
          }}>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: C.text }}>Free Plan</h3>
              <p style={{ fontSize: '14px', color: C.muted, marginBottom: '28px' }}>Essential features for basic test-taking.</p>
              <div style={{ fontSize: '36px', fontWeight: '900', color: C.text, marginBottom: '28px' }}>
                ₹0 <span style={{ fontSize: '16px', color: C.muted, fontWeight: '500' }}>/ month</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Access to assigned quizzes',
                  'Basic performance analysis',
                  'Limited AI explanations'
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: C.text }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/register" style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '40px',
              padding: '12px',
              background: 'transparent',
              color: '#7c3aed',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              border: '2px solid #e9d5ff',
              transition: 'background 0.2s'
            }} onMouseEnter={e => e.target.style.background = isDark ? 'rgba(124,58,237,0.1)' : '#f5f3ff'} onMouseLeave={e => e.target.style.background = 'transparent'}>
              Get Started
            </Link>
          </div>

          {/* Pro Plan */}
          <div style={{
            background: C.card,
            borderRadius: '20px',
            border: '2px solid #7c3aed',
            padding: '40px 32px',
            width: '100%',
            maxWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
            boxShadow: '0 8px 32px rgba(124,58,237,0.15)'
          }}>
            <div style={{
              position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: 'white', padding: '4px 16px', borderRadius: '999px',
              fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap'
            }}>⭐ RECOMMENDED</div>
            <div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px', color: C.text }}>Pro Plan</h3>
              <p style={{ fontSize: '14px', color: C.muted, marginBottom: '28px' }}>Unlock full AI capability and learning tools.</p>
              <div style={{ fontSize: '36px', fontWeight: '900', color: '#7c3aed', marginBottom: '28px' }}>
                ₹999 <span style={{ fontSize: '16px', color: C.muted, fontWeight: '500' }}>/ month</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {[
                  'Everything in Free Plan',
                  '🤖 AI Study Coach & study plan',
                  '📝 Custom Study Notes & Flashcards',
                  '🔖 Personal Question Bookmarks',
                  '📊 AI Diagnostic Performance reports',
                  '💬 Unlimited AI doubt-solving & explanations',
                  '🎓 Verifiable Certificate downloads'
                ].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: C.text }}>
                    <span style={{ color: '#10b981', fontWeight: 'bold' }}>✓</span>
                    <span style={{ fontWeight: f.startsWith('🤖') || f.startsWith('📝') || f.startsWith('🔖') ? '600' : 'normal' }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link to="/register" style={{
              display: 'block',
              textAlign: 'center',
              marginTop: '40px',
              padding: '12px',
              background: 'linear-gradient(135deg,#7c3aed,#6d28d9)',
              color: '#fff',
              borderRadius: '10px',
              fontWeight: '700',
              fontSize: '14px',
              textDecoration: 'none',
              boxShadow: '0 4px 12px rgba(124,58,237,0.35)'
            }}>
              Get Pro Plan
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ──────────────────────────────────────── */}
      <section style={{ padding: isMobile ? '60px 20px' : '80px 60px', background: isDark ? '#150d2e' : '#faf5ff', borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', boxShadow: '0 8px 24px rgba(124,58,237,0.4)' }}>
            <BsLightningCharge size={28} color="#fff"/>
          </div>
          <h2 style={{ fontSize: isMobile ? '26px' : '36px', fontWeight: '900', color: C.text, margin: '0 0 14px 0' }}>Ready to transform your exam experience?</h2>
          <p style={{ fontSize: '16px', color: C.muted, margin: '0 0 32px 0', lineHeight: 1.6 }}>Join thousands of educators and learners using Examind AI today.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '15px 32px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', borderRadius: '10px', fontWeight: '700', fontSize: '15px', textDecoration: 'none', boxShadow: '0 6px 20px rgba(124,58,237,0.4)' }}>
            Create Free Account <BsArrowRight size={16}/>
          </Link>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer style={{ background: isDark ? '#0a0618' : '#6850DB', color: '#ffffff', fontWeight: '700', padding: isMobile ? '40px 20px' : '60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : '1.5fr 1fr 1fr 1fr 1fr', gap: '40px', maxWidth: '1100px', margin: '0 auto 40px' }}>
          {/* Brand */}
          <div style={{ gridColumn: '1' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><BsPatchQuestion size={16} color="#fff"/></div>
              <span style={{ fontWeight: '800', fontSize: '15px', color: '#fff' }}>Examind AI</span>
            </div>
            <p style={{ fontSize: '13px', lineHeight: 1.6, fontWeight: '700', color: '#ffffff', margin: '0 0 14px 0' }}>AI-powered exam platform for modern education.</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['tw','fb','li','yt'].map(i => (
                <div key={i} style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BsStar size={12} color="rgba(255,255,255,0.5)"/>
                </div>
              ))}
            </div>
          </div>
          {/* Links */}
          {[
            { heading: 'Product', links: ['Features','Pricing','Changelog','Roadmap'] },
            { heading: 'Solutions', links: ['For Students','For Faculty','For Admins','Institutions'] },
            { heading: 'Resources', links: ['Help Center','API Docs','Blog','Status'] },
            { heading: 'Company', links: ['About','Careers','Privacy','Terms'] },
          ].map(col => (
            <div key={col.heading}>
              <div style={{ fontSize: '12px', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#ffffff', marginBottom: '16px' }}>{col.heading}</div>
              {col.links.map(l => (
                <div key={l} style={{ fontSize: '14px', color: '#ffffff', fontWeight: '700', marginBottom: '10px', cursor: 'pointer' }}>{l}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ 
          borderTop: '1px solid rgba(255,255,255,0.2)', 
          paddingTop: '24px', 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: 'center', 
          maxWidth: '1100px', 
          margin: '0 auto',
          gap: isMobile ? '12px' : '0',
          textAlign: isMobile ? 'center' : 'left'
        }}>
          <span style={{ fontSize: '13px', color: '#ffffff', fontWeight: '700' }}>© 2026 Examind AI · Spring Boot + React + Gemini AI</span>
          <Link to="/verify-certificate/lookup" style={{ fontSize: '13px', color: '#ffffff', textDecoration: 'underline', fontWeight: '800' }}>Verify Certificate</Link>
        </div>
      </footer>
    </div>
  );
}
