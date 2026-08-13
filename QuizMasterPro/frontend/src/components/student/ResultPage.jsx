import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Spinner } from 'react-bootstrap';
import { FiAward, FiCheckCircle, FiXCircle, FiClock, FiStar, FiHome, FiRefreshCw, FiDownload, FiShield } from 'react-icons/fi';
import { attemptApi, certApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';

// ── RESULT PAGE ───────────────────────────────────────────────
export const ResultPage = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAnswers, setShowAnswers] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  useEffect(() => {
    attemptApi.get(attemptId).then(r => setAttempt(r.data.data)).finally(() => setLoading(false));
  }, [attemptId]);

  const submitFeedback = async (rating) => {
    setFeedbackRating(rating);
    await attemptApi.feedback(attemptId, { rating, comment: '' });
    setFeedbackSubmitted(true);
  };

  if (loading) return <AppLayout title="Result"><div className="qmp-spinner" /></AppLayout>;
  if (!attempt) return <AppLayout title="Result"><div className="empty-state"><h5>Result not found</h5></div></AppLayout>;

  const pct = attempt.percentage;
  const passed = attempt.isPassed;
  const disqualified = attempt.isDisqualified;
  const conicGrad = `conic-gradient(${disqualified ? 'var(--danger)' : passed ? 'var(--success)' : 'var(--danger)'} ${pct * 3.6}deg, var(--border) 0deg)`;

  return (
    <AppLayout title="Quiz Result">
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Result Card */}
        <div className="qmp-card" style={{ overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ background: disqualified ? 'linear-gradient(135deg,#374151,#1f2937)' : passed ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', padding: '32px 28px', textAlign: 'center', color: 'white', position: 'relative' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>{disqualified ? '🛑' : passed ? '🎉' : '😔'}</div>
            <h3 style={{ fontWeight: 800, margin: 0 }}>{disqualified ? 'Disqualified!' : passed ? 'Congratulations!' : 'Keep Going!'}</h3>
            <p style={{ margin: '8px 0 0', opacity: .85 }}>{attempt.quizTitle}</p>
          </div>

          <div className="qmp-card-body">
            {disqualified ? (
              <div style={{ textAlign: 'center', padding: '28px 24px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 12, marginBottom: 28 }}>
                <h5 style={{ color: 'var(--danger)', fontWeight: 700, margin: '0 0 10px' }}>⚠️ Tab Switch Limit Exceeded</h5>
                <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>
                  This attempt was automatically submitted and disqualified because you lost focus / switched tabs too many times ({attempt.warningCount} warnings logged).
                </p>
              </div>
            ) : (
              /* Score ring */
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ width: 160, height: 160, background: conicGrad, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', position: 'relative' }}>
                  <div style={{ width: 120, height: 120, background: 'white', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1, color: passed ? 'var(--success)' : 'var(--danger)' }}>{pct.toFixed(0)}%</div>
                    <div style={{ fontSize: '.72rem', color: 'var(--gray)', fontWeight: 500 }}>{passed ? 'PASSED' : 'FAILED'}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Grid */}
            <Row className="g-3 mb-4">
              {[
                { icon: '📊', label: 'Score', val: `${attempt.obtainedMarks} / ${attempt.totalMarks}` },
                { icon: <FiClock />, label: 'Time Taken', val: `${Math.floor(attempt.timeTaken / 60)}m ${attempt.timeTaken % 60}s` },
                { icon: '🏆', label: 'Rank', val: `#${attempt.rank}` },
                { icon: '⭐', label: 'Points Earned', val: `+${attempt.pointsEarned}` },
              ].map(s => (
                <Col xs={6} md={3} key={s.label}>
                  <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{s.val}</div>
                    <div style={{ fontSize: '.78rem', color: 'var(--gray)' }}>{s.label}</div>
                  </div>
                </Col>
              ))}
            </Row>

            {/* Certificate */}
            {attempt.certificateIssued && (
              <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '2rem' }}>🎓</span>
                  <div>
                    <div style={{ fontWeight: 700, color: '#92400e' }}>Certificate Earned!</div>
                    <div style={{ fontSize: '.8rem', color: '#b45309' }}>ID: {attempt.certificateId?.slice(0, 16)}...</div>
                  </div>
                </div>
                <button onClick={() => navigate('/student/certificates')}
                  style={{ background: '#92400e', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FiDownload /> View
                </button>
              </div>
            )}

            {/* Feedback */}
            {!feedbackSubmitted && (
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '16px', marginBottom: 20, textAlign: 'center' }}>
                <p style={{ fontWeight: 600, margin: '0 0 10px', fontSize: '.9rem' }}>How was this quiz?</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => submitFeedback(r)}
                      style={{ background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', transition: 'transform .1s' }}>
                      {r <= feedbackRating ? '⭐' : '☆'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/student')} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', fontWeight: 600, cursor: 'pointer', color: 'var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FiHome /> Dashboard
              </button>
              <button onClick={() => navigate('/student/quizzes')} style={{ flex: 1, padding: '11px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', fontWeight: 600, cursor: 'pointer', color: 'var(--gray)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <FiRefreshCw /> More Quizzes
              </button>
              <button onClick={() => setShowAnswers(!showAnswers)} className="btn-primary-custom" style={{ flex: 1, padding: '11px' }}>
                {showAnswers ? 'Hide Answers' : 'Review Answers'}
              </button>
            </div>
          </div>
        </div>

        {/* Answer Review */}
        {showAnswers && attempt.answers?.map((a, i) => (
          <div key={i} className="qmp-card" style={{ marginBottom: 12 }}>
            <div className="qmp-card-body">
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{a.isCorrect ? '✅' : '❌'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8, fontSize: '.9rem' }}>Q{i + 1}. {a.questionText}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {a.options?.map((opt, oi) => (
                      <div key={oi} style={{ padding: '8px 12px', borderRadius: 8, border: `1.5px solid ${opt.isCorrect ? 'var(--success)' : oi === a.selectedOption ? 'var(--danger)' : 'var(--border)'}`, background: opt.isCorrect ? '#f0fdf4' : oi === a.selectedOption && !opt.isCorrect ? '#fff1f2' : 'white', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                        {opt.isCorrect ? '✓' : oi === a.selectedOption ? '✗' : '○'} {opt.text}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 6, fontSize: '.78rem', color: 'var(--gray)' }}>
                    Marks: <strong>{a.marksAwarded >= 0 ? '+' : ''}{a.marksAwarded}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppLayout>
  );
};

// ── CERTIFICATES PAGE ─────────────────────────────────────────
export const CertificatesPage = () => {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyId, setVerifyId] = useState('');

  useEffect(() => {
    certApi.my().then(r => setCerts(r.data.data || [])).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Certificates"><div className="qmp-spinner" /></AppLayout>;

  return (
    <AppLayout title="My Certificates">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, margin: 0 }}>My Certificates 🎓</h5>
          <p style={{ color: 'var(--gray)', margin: 0, fontSize: '.875rem' }}>{certs.length} certificate{certs.length !== 1 ? 's' : ''} earned</p>
        </div>
      </div>

      {certs.length === 0
        ? <div className="empty-state"><div className="empty-state-icon">🎓</div><h5>No certificates yet</h5><p>Attempt quizzes that have certificates enabled and score above the minimum.</p></div>
        : <Row className="g-3">
            {certs.map(c => (
              <Col md={6} lg={4} key={c.id}>
                <div className="qmp-card" style={{ overflow: 'hidden' }}>
                  <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem' }}>🏆</div>
                    <div style={{ fontWeight: 800, color: '#92400e', fontSize: '1rem', marginTop: 8 }}>Certificate of Achievement</div>
                  </div>
                  <div style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, marginBottom: 4, fontSize: '.95rem' }}>{c.quizTitle}</div>
                    <div style={{ fontSize: '.8rem', color: 'var(--gray)', marginBottom: 12 }}>{c.subject}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.8rem' }}>
                      <span>Score: <strong style={{ color: 'var(--success)' }}>{c.score?.toFixed(0)}%</strong></span>
                      <span style={{ color: 'var(--gray)' }}>{new Date(c.issuedAt).toLocaleDateString()}</span>
                    </div>
                    <div style={{ marginTop: 12, padding: '8px', background: 'var(--bg)', borderRadius: 6, fontSize: '.7rem', color: 'var(--gray)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                      ID: {c.certificateId}
                    </div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
      }
    </AppLayout>
  );
};
