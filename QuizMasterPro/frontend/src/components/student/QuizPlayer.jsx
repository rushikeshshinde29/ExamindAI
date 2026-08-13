import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Spinner } from 'react-bootstrap';
import { FiClock, FiSearch, FiBookOpen, FiLock, FiShield, FiAward, FiChevronLeft, FiChevronRight, FiFlag, FiAlertTriangle } from 'react-icons/fi';
import { quizApi, questionApi, attemptApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import toast from 'react-hot-toast';

// ── STUDENT QUIZ LIST ─────────────────────────────────────────
export const StudentQuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', difficulty: '', subject: '' });
  const [page, setPage] = useState(1);

  const load = useCallback(() => {
    setLoading(true);
    quizApi.getAll({ page, limit: 12, ...filters }).then(r => {
      setQuizzes(r.data.data || []);
      setTotal(r.data.total || 0);
    }).finally(() => setLoading(false));
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  return (
    <AppLayout title="Browse Quizzes">
      {/* Filters */}
      <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
          <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
          <input className="form-control-custom" placeholder="Search quizzes..." value={filters.search}
            onChange={e => setFilters(f => ({ ...f, search: e.target.value }))} style={{ paddingLeft: 34 }} />
        </div>
        <select className="form-control-custom" value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))} style={{ width: 140 }}>
          <option value="">All Levels</option>
          <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
        </select>
        <input className="form-control-custom" placeholder="Subject..." value={filters.subject}
          onChange={e => setFilters(f => ({ ...f, subject: e.target.value }))} style={{ width: 160 }} />
        <span style={{ color: 'var(--gray)', fontSize: '.85rem', whiteSpace: 'nowrap' }}>{total} quizzes</span>
      </div>

      {loading ? <div className="qmp-spinner" /> : (
        <>
          <Row className="g-3">
            {quizzes.map(q => (
              <Col md={6} lg={4} key={q.id}>
                <div className="quiz-card" onClick={() => navigate(`/student/quiz/${q.id}`)}>
                  <div className={`quiz-card-cover ${q.difficulty}`} />
                  <div className="quiz-card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <span className={`quiz-card-tag badge-${q.difficulty}`}>{q.difficulty}</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {q.certificateEnabled && <span title="Certificate Available" style={{ fontSize: '1rem' }}>🎓</span>}
                        {q.antiCheat?.preventTabSwitch && <span title="Anti-Cheat Active" style={{ fontSize: '.9rem' }}>🛡️</span>}
                        {q.accessCode && <FiLock size={14} color="var(--gray)" title="Requires access code" />}
                      </div>
                    </div>
                    <div className="quiz-card-title">{q.title}</div>
                    {q.description && <div style={{ fontSize: '.8rem', color: 'var(--gray)', marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</div>}
                    <div className="quiz-card-meta">
                      <span>📚 {q.subject}</span>
                      <span><FiClock size={12} /> {q.durationMinutes}m</span>
                      <span>❓ {q.questionCount} Qs</span>
                      <span>🏅 {q.totalMarks} marks</span>
                    </div>
                  </div>
                  <div className="quiz-card-footer">
                    <div style={{ fontSize: '.78rem', color: 'var(--gray)' }}>
                      <span>👤 {q.createdByName}</span>
                      <span style={{ marginLeft: 8 }}>📈 {q.averageScore?.toFixed(0)}% avg</span>
                    </div>
                    <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '.875rem' }}>Start →</span>
                  </div>
                </div>
              </Col>
            ))}
          </Row>

          {quizzes.length === 0 && (
            <div className="empty-state"><div className="empty-state-icon">🔍</div><h5>No quizzes found</h5><p>Try adjusting your filters</p></div>
          )}
        </>
      )}
    </AppLayout>
  );
};

// ── QUIZ PLAYER ───────────────────────────────────────────────
export const QuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [started, setStarted] = useState(false);
  const timerRef = useRef(null);
  const warningCount = useRef(0);

  useEffect(() => {
    quizApi.getById(quizId).then(r => {
      const q = r.data.data;
      setQuiz(q);
      setTimeLeft(q.durationMinutes * 60);
      if (q.accessCode) setShowCodeModal(true);
      else startAttempt(q);
    }).catch(() => navigate('/student/quizzes'));
  }, [quizId]);

  const startAttempt = async (q, code = '') => {
    try {
      const r = await attemptApi.start({ quizId: parseInt(quizId), accessCode: code });
      const att = r.data.data;
      setAttempt(att);
      warningCount.current = att?.WarningCount ?? att?.warningCount ?? 0;
      const qs = await questionApi.getByQuiz(quizId);
      setQuestions(qs.data.data || []);
      setStarted(true);
      setLoading(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start quiz');
      navigate('/student/quizzes');
    }
  };

  // Timer
  useEffect(() => {
    if (!started || timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(timerRef.current); handleSubmit(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [started]);

  // Anti-cheat
  useEffect(() => {
    if (!attempt || !quiz?.antiCheat?.preventTabSwitch) return;
    const onVisibilityChange = async () => {
      if (document.hidden) {
        warningCount.current++;
        try {
          const r = await attemptApi.antiCheat(attempt.id, { event: 'tab_switch', details: 'Tab switch detected' });
          const isDisqualified = r.data?.data?.Disqualified ?? r.data?.data?.disqualified ?? r.data?.Data?.Disqualified ?? r.data?.Data?.disqualified;
          
          if (isDisqualified) {
            toast.error('❌ You have been disqualified for exceeding tab switch limits.');
            clearInterval(timerRef.current);
            navigate(`/student/result/${attempt.id}`);
          } else {
            toast.error(`⚠️ Warning ${warningCount.current}/${quiz.antiCheat.maxWarnings}: Tab switch detected!`);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            toast.error('❌ Quiz attempt is no longer active.');
            clearInterval(timerRef.current);
            navigate(`/student/result/${attempt.id}`);
          } else {
            console.error('Failed to log anti-cheat event:', err);
          }
        }
      }
    };
    const onContextMenu = quiz.antiCheat.preventRightClick ? (e) => { e.preventDefault(); } : null;
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (onContextMenu) window.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (onContextMenu) window.removeEventListener('contextmenu', onContextMenu);
    };
  }, [attempt, quiz, navigate]);

  const selectAnswer = (optIdx) => {
    if (!questions[current]) return;
    setAnswers(a => ({ ...a, [questions[current].id]: optIdx }));
  };

  const toggleFlag = () => {
    if (!questions[current]) return;
    setFlagged(f => ({ ...f, [questions[current].id]: !f[questions[current].id] }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!autoSubmit && !window.confirm(`Submit quiz? ${Object.keys(answers).length}/${questions.length} questions answered.`)) return;
    clearInterval(timerRef.current);
    setSubmitting(true);
    try {
      const ansArr = questions.map(q => ({
        questionId: q.id,
        selectedOption: answers[q.id] ?? null,
        flagged: !!flagged[q.id],
        timeTaken: 0
      }));
      const r = await attemptApi.submit(attempt.id, { answers: ansArr, timeTaken: quiz.durationMinutes * 60 - timeLeft });
      navigate(`/student/result/${r.data.data?.id || attempt.id}`);
    } catch { toast.error('Submission failed'); setSubmitting(false); }
  };

  const fmt = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const timerClass = timeLeft < 120 ? 'danger' : timeLeft < 300 ? 'warning' : '';

  if (showCodeModal) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <div className="qmp-card" style={{ maxWidth: 380, width: '100%', margin: 24 }}>
        <div className="qmp-card-body" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔐</div>
          <h5 style={{ fontWeight: 700 }}>Access Code Required</h5>
          <p style={{ color: 'var(--gray)', fontSize: '.875rem' }}>Enter the access code to unlock this quiz</p>
          <input className="form-control-custom" placeholder="Enter access code" value={accessCode}
            onChange={e => setAccessCode(e.target.value)} style={{ textAlign: 'center', fontSize: '1.1rem', letterSpacing: 3, marginBottom: 12 }} />
          <button className="btn-primary-custom" style={{ width: '100%', padding: 12 }}
            onClick={() => { setShowCodeModal(false); startAttempt(quiz, accessCode); }}>
            Unlock Quiz
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}><div className="qmp-spinner" /></div>;

  const q = questions[current];
  const answered = Object.keys(answers).length;
  const progress = questions.length > 0 ? (answered / questions.length) * 100 : 0;
  const LETTERS = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '24px 16px' }}>
      <div className="quiz-player">
        {/* Header */}
        <div style={{ background: 'white', borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h6 style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{quiz?.title}</h6>
            <div style={{ fontSize: '.8rem', color: 'var(--gray)', marginTop: 3 }}>
              {answered}/{questions.length} answered · Q{current + 1} of {questions.length}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div className={`quiz-timer ${timerClass}`}><FiClock />{fmt(timeLeft)}</div>
            <button onClick={() => handleSubmit(false)} className="btn-primary-custom" style={{ padding: '8px 16px', fontSize: '.875rem' }} disabled={submitting}>
              {submitting ? <Spinner size="sm" /> : 'Submit'}
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="qmp-progress" style={{ marginBottom: 20 }}>
          <div className="qmp-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        {/* Question */}
        {q && (
          <div className="question-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span className="question-number">Question {current + 1}</span>
              <div style={{ display: 'flex', align: 'center', gap: 8 }}>
                <span style={{ fontSize: '.8rem', color: 'var(--gray)' }}>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                <button onClick={toggleFlag} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '.9rem', color: flagged[q.id] ? 'var(--warning)' : 'var(--gray)' }}>
                  <FiFlag />
                </button>
              </div>
            </div>
            <div className="question-text">{q.text}</div>
            <div>
              {q.options.map((opt, oi) => (
                <button key={oi} className={`option-btn ${answers[q.id] === oi ? 'selected' : ''}`} onClick={() => selectAnswer(oi)}>
                  <span className="option-letter">{LETTERS[oi]}</span>
                  {opt.text}
                </button>
              ))}
            </div>
            {q.hint && <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff7ed', borderRadius: 8, fontSize: '.8rem', color: '#92400e' }}>💡 {q.hint}</div>}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
          <button onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0}
            style={{ padding: '10px 18px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6, opacity: current === 0 ? .4 : 1 }}>
            <FiChevronLeft /> Previous
          </button>

          {/* Question dots */}
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', flex: 1, margin: '0 12px' }}>
            {questions.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)}
                style={{ width: 28, height: 28, borderRadius: 6, border: 'none', fontWeight: 700, fontSize: '.72rem', cursor: 'pointer', background: i === current ? 'var(--primary)' : answers[questions[i]?.id] !== undefined ? '#d1fae5' : flagged[questions[i]?.id] ? '#fef3c7' : 'var(--border)', color: i === current ? 'white' : answers[questions[i]?.id] !== undefined ? 'var(--success)' : 'var(--gray)' }}>
                {i + 1}
              </button>
            ))}
          </div>

          <button onClick={() => current === questions.length - 1 ? handleSubmit(false) : setCurrent(c => Math.min(questions.length - 1, c + 1))}
            className={current === questions.length - 1 ? 'btn-primary-custom' : ''}
            style={current !== questions.length - 1 ? { padding: '10px 18px', border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--gray)', display: 'flex', alignItems: 'center', gap: 6 } : { padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {current === questions.length - 1 ? (submitting ? <Spinner size="sm" /> : 'Submit Quiz') : <><span>Next</span><FiChevronRight /></>}
          </button>
        </div>
      </div>
    </div>
  );
};
