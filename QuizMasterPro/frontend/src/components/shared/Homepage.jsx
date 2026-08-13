import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { FiBookOpen, FiShield, FiCpu, FiAward, FiBarChart2, FiArrowRight, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

// ── THEME TOKENS: Cream Orange / Cream White ───────────────────
const T = {
  cream: '#FFF8EF',        // page background
  creamAlt: '#FDF1E0',     // section alt background
  card: '#FFFFFF',
  border: '#F0DFC7',
  orange: '#E8730A',       // primary accent
  orangeDark: '#C7590A',
  orangeLight: '#FFE7CC',
  orangeSoft: 'rgba(232, 115, 10, 0.10)',
  text: '#3A2E22',         // warm dark brown for body text
  textMuted: '#8A7A66',
  white: '#FFFFFF',
};

export const Homepage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleStart = () => {
    if (user) {
      navigate(`/${user.role}`);
    } else {
      navigate('/register');
    }
  };

  return (
    <div style={{ background: T.cream, color: T.text, minHeight: '100vh', display: 'flex', flexDirection: 'column', fontFamily: "'Inter', sans-serif" }}>
      {/* Header */}
      <header style={{ height: 72, borderBottom: `1px solid ${T.border}`, backdropFilter: 'blur(12px)', background: 'rgba(255, 248, 239, 0.9)', position: 'sticky', top: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: '1.6rem' }}>🎓</span>
          <h4 style={{ margin: 0, fontWeight: 900, fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: '-0.5px', color: T.text }}>
            Quiz<span style={{ color: T.orange }}>Master</span> Pro
          </h4>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {user ? (
            <button onClick={() => navigate(`/${user.role}`)} style={{ background: T.orangeSoft, border: `1px solid ${T.orange}`, color: T.orangeDark, padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', transition: 'all 0.2s' }}>
              Dashboard
            </button>
          ) : (
            <>
              <button onClick={() => navigate('/login')} style={{ background: 'transparent', border: 'none', color: T.text, padding: '8px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}>
                Sign In
              </button>
              <button onClick={() => navigate('/register')} style={{ background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, border: 'none', color: T.white, padding: '8px 20px', borderRadius: 8, fontWeight: 700, cursor: 'pointer', fontSize: '.875rem', boxShadow: '0 4px 15px rgba(232,115,10,0.28)', transition: 'all 0.2s' }}>
                Get Started
              </button>
            </>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ padding: '80px 24px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
        {/* Glow Effects */}
        <div style={{ position: 'absolute', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '400px', background: 'radial-gradient(circle, rgba(232,115,10,0.14) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(232,115,10,0.10) 0%, transparent 70%)', borderRadius: '50%', pointerEvents: 'none', zIndex: 0 }} />

        <div style={{ maxWidth: 840, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <span style={{ background: T.orangeSoft, border: `1px solid ${T.orange}33`, color: T.orangeDark, padding: '6px 16px', borderRadius: 20, fontSize: '.78rem', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
            ⚡ AI-Powered Assessment Platform
          </span>
          <h1 style={{ fontSize: '3.6rem', fontWeight: 900, marginTop: 24, lineHeight: 1.15, letterSpacing: '-1.5px', fontFamily: "'Plus Jakarta Sans', sans-serif", color: T.text }}>
            Elevate Your Learning and <br />
            <span style={{ background: `linear-gradient(135deg, ${T.orangeDark}, ${T.orange})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Proctoring Experience</span>
          </h1>
          <p style={{ fontSize: '1.15rem', color: T.textMuted, margin: '20px auto 32px', maxWidth: 600, lineHeight: 1.6 }}>
            Create secure, interactive, and AI-generated quizzes in seconds. Track faculty analytics, award customized certificates, and enforce anti-cheat proctoring rules.
          </p>

          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: 8, background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, border: 'none', color: T.white, padding: '14px 28px', borderRadius: 10, fontWeight: 700, cursor: 'pointer', fontSize: '.95rem', boxShadow: '0 6px 20px rgba(232,115,10,0.32)', transition: 'all 0.2s' }}>
              Create a Quiz Now <FiArrowRight />
            </button>
            <button onClick={() => navigate('/login')} style={{ background: T.card, border: `1px solid ${T.border}`, color: T.text, padding: '14px 28px', borderRadius: 10, fontWeight: 600, cursor: 'pointer', fontSize: '.95rem', transition: 'all 0.2s' }}>
              Demo Login
            </button>
          </div>
        </div>
      </section>

      {/* Stats Showcase */}
      <section style={{ padding: '0 40px 60px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Row className="g-4">
            {[
              { num: '5,000+', label: 'Quizzes Completed', desc: 'Secure exams, certifications, and classroom tests.' },
              { num: '99.8%', label: 'Anti-Cheat Accuracy', desc: 'Automatic tab switch monitoring & right-click blocks.' },
              { num: 'Instant', label: 'AI Quiz Generation', desc: 'Powered by Gemini models for seamless question creation.' },
            ].map((s, idx) => (
              <Col md={4} key={idx}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '32px 24px', textAlign: 'center', height: '100%', transition: 'all 0.2s', boxShadow: '0 2px 10px rgba(58,46,34,0.04)' }}>
                  <div style={{ fontSize: '2.5rem', fontWeight: 800, color: T.orange, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{s.num}</div>
                  <div style={{ fontWeight: 700, color: T.text, fontSize: '1rem', marginTop: 6 }}>{s.label}</div>
                  <div style={{ fontSize: '.85rem', color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>{s.desc}</div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '60px 40px 100px', borderTop: `1px solid ${T.border}`, background: T.creamAlt, position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: T.text, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Everything You Need to Assess Smartly</h2>
            <p style={{ color: T.textMuted, fontSize: '1rem', marginTop: 8 }}>Empowering educators and students with cutting-edge tools.</p>
          </div>

          <Row className="g-4">
            {[
              { icon: <FiCpu />, title: 'AI Question Builder', desc: 'Enter any topic, select options, and let Google Gemini generate full quizzes complete with correct answers and explanations instantly.' },
              { icon: <FiShield />, title: 'Intelligent Proctoring', desc: 'Enforce anti-cheat modes including full-screen requirements, right-click disabling, and focus lost notifications with auto-disqualification.' },
              { icon: <FiBarChart2 />, title: 'Real-time Analytics', desc: 'Understand student outcomes immediately with comprehensive visual charts, difficulty ratings, average scores, and student rankings.' },
              { icon: <FiAward />, title: 'Custom Certifications', desc: 'Create and configure custom PDF certificates generated automatically for students passing above the score threshold.' }
            ].map((f, idx) => (
              <Col md={6} key={idx}>
                <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: '28px', height: '100%', display: 'flex', gap: 20, boxShadow: '0 2px 10px rgba(58,46,34,0.04)' }}>
                  <div style={{ width: 56, height: 56, borderRadius: 12, background: T.orangeSoft, border: `1px solid ${T.orange}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', color: T.orange, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <h5 style={{ fontWeight: 700, color: T.text, margin: '0 0 8px' }}>{f.title}</h5>
                    <p style={{ color: T.textMuted, fontSize: '.875rem', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* Who it's for */}
      <section style={{ padding: '60px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <Row className="g-4">
            {[
              { role: 'Students', icon: <FiBookOpen />, points: ['Take secure, timed quizzes', 'Track scores & progress', 'Download certificates'] },
              { role: 'Faculty', icon: <FiCheckCircle />, points: ['Generate quizzes with AI', 'Monitor live analytics', 'Review student attempts'] },
              { role: 'Admins', icon: <FiShield />, points: ['Manage students & faculty', 'Oversee all quizzes', 'Platform-wide insights'] },
            ].map((r, idx) => (
              <Col md={4} key={idx}>
                <div style={{ background: T.orangeLight, border: `1px solid ${T.orange}22`, borderRadius: 16, padding: '28px', height: '100%' }}>
                  <div style={{ color: T.orangeDark, fontSize: '1.4rem', marginBottom: 12 }}>{r.icon}</div>
                  <h5 style={{ fontWeight: 800, color: T.text, margin: '0 0 12px' }}>For {r.role}</h5>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {r.points.map((p, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.textMuted, fontSize: '.875rem', marginBottom: 8 }}>
                        <FiCheckCircle style={{ color: T.orange, flexShrink: 0 }} /> {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      {/* CTA Banner */}
      <section style={{ padding: '0 40px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', background: `linear-gradient(135deg, ${T.orange}, ${T.orangeDark})`, borderRadius: 20, padding: '48px', textAlign: 'center', boxShadow: '0 10px 30px rgba(232,115,10,0.25)' }}>
          <h2 style={{ color: T.white, fontWeight: 800, fontSize: '1.8rem', margin: '0 0 12px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Ready to get started?</h2>
          <p style={{ color: T.orangeLight, margin: '0 0 24px' }}>Join QuizMaster Pro today — it's free to create your account.</p>
          <button onClick={handleStart} style={{ background: T.white, border: 'none', color: T.orangeDark, padding: '14px 32px', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontSize: '.95rem' }}>
            Get Started Free
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ marginTop: 'auto', background: T.cream, padding: '32px 40px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <p style={{ fontSize: '.8rem', color: T.textMuted, margin: 0 }}>
          &copy; {new Date().getFullYear()} QuizMaster Pro. Built with premium proctoring technology.
        </p>
      </footer>
    </div>
  );
};
