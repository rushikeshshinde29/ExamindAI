import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { usePreferences } from '../../context/PreferencesContext';
import { useAuth } from '../../context/AuthContext';
import { playCorrectSound, playWrongSound, playSuccessSound, playFailureSound } from '../../utils/sound';
import {
  BsCheckCircle, BsXCircle, BsSkipEndCircle, BsFlag, BsClock, BsTrophy,
  BsAward, BsStar, BsDownload, BsArrowLeft, BsEmojiSmile, BsEmojiFrown,
  BsBookmark, BsBookmarkFill
} from 'react-icons/bs';
import { format } from 'date-fns';
import styles from './QuizResult.module.css';
import CodeBlock from '../../components/CodeBlock';
import ReactMarkdown from 'react-markdown';
import { useDialog } from '../../context/DialogContext';

export default function QuizResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [certData, setCertData] = useState(null);
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const { prefs } = usePreferences();
  const { user } = useAuth();
  const { prompt } = useDialog();
  const soundPlayedRef = useRef(false);
  const [backHover, setBackHover] = useState(false);


  useEffect(() => {
    if (attempt && prefs?.soundEffects && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      if (attempt.isPassed) {
        playSuccessSound();
      } else {
        playFailureSound();
      }
    }
  }, [attempt, prefs?.soundEffects]);

  useEffect(() => {
    api.get('/bookmarks').then(r => {
      const ids = new Set((r.data.data || []).map(b => b.question?.id));
      setBookmarkedIds(ids);
    }).catch(() => { });
  }, []);

  const toggleBookmark = async (questionId) => {
    if (!questionId) return;
    const isBookmarked = bookmarkedIds.has(questionId);
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${questionId}`);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
        toast.success('Bookmark removed');
      } else {
        await api.post('/bookmarks', { questionId });
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.add(questionId);
          return next;
        });
        toast.success('Question bookmarked');
      }
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  const startRevision = async () => {
    try {
      toast.loading('Starting revision mode...', { id: 'rev-start' });
      const r = await api.post('/attempts/revision', {
        quizId: attempt.quiz.id || attempt.quiz.id,
        previousAttemptId: attempt.id || attempt.id
      });
      toast.success('Revision attempt started!', { id: 'rev-start' });
      navigate(`/student/quiz/${attempt.quiz.id || attempt.quiz.id}/take`, { state: { attemptId: r.data.data.id || r.data.data.id } });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start revision', { id: 'rev-start' });
    }
  };

  const [activeExplanations, setActiveExplanations] = useState({});
  const [activePanels, setActivePanels] = useState({}); // idx -> 'hint' | 'explanation' | 'aiExplanation' | null
  const [aiLoading, setAiLoading] = useState({}); // idx -> boolean

  const toggleExplanation = (idx) => {
    setActivePanels(prev => ({
      ...prev,
      [idx]: prev[idx] === 'explanation' ? null : 'explanation'
    }));
  };

  const toggleHint = (idx) => {
    setActivePanels(prev => ({
      ...prev,
      [idx]: prev[idx] === 'hint' ? null : 'hint'
    }));
  };
  const [report, setReport] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);

  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const handleShareResult = async () => {
    const email = await prompt("Enter recipient email address(es) (separated by commas, semicolons, or spaces):", "", "Share Quiz Result");
    if (!email) return;
    try {
      toast.loading("Sharing results...", { id: "share-res" });
      await api.post(`/attempts/${id}/share`, { email });
      toast.success("Results shared via email successfully!", { id: "share-res" });
    } catch {
      toast.error("Failed to share result", { id: "share-res" });
    }
  };

  const handleAddToCalendar = () => {
    const summary = `Review Quiz: ${quiz?.title || 'Attempt'}`;
    const desc = `You completed "${quiz?.title || 'Quiz'}" with ${obtainedMarks}/${totalMarks} (${percentage.toFixed(0)}%). Review your wrong answers!`;
    const dtstart = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtend = new Date(Date.now() + 3600000).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const icsText = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Examind AI//NONSGML v1.0//EN
BEGIN:VEVENT
UID:${id}@examindai.com
DTSTAMP:${dtstart}
DTSTART:${dtstart}
DTEND:${dtend}
SUMMARY:${summary}
DESCRIPTION:${desc}
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `Quiz_Review_${id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Calendar invitation downloaded!');
  };

  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    try {
      const r = await api.post(`/quizzes/${attempt.quiz.id || attempt.quiz.id}/discussions`, { message: newMessage });
      setMessages(prev => [...prev, r.data.data]);
      setNewMessage('');
    } catch {
      toast.error('Failed to post comment');
    }
  };

  const fetchDiagnosticReport = async () => {
    setShowReportModal(true);
    if (report) return;
    setReportLoading(true);
    try {
      const r = await api.get(`/attempts/${id}/report`);
      setReport(r.data.report);
    } catch {
      toast.error('Failed to load diagnostic report');
      setShowReportModal(false);
    } finally {
      setReportLoading(false);
    }
  };


  const handleFetchAIExplanation = async (idx, questionText, selected, correct, options) => {
    if (activePanels[idx] === 'aiExplanation') {
      setActivePanels(prev => ({ ...prev, [idx]: null }));
      return;
    }

    // Switch to AI explanation immediately, hiding other panels
    setActivePanels(prev => ({ ...prev, [idx]: 'aiExplanation' }));

    if (activeExplanations[idx]) {
      return; // Already cached
    }

    setAiLoading(prev => ({ ...prev, [idx]: true }));
    try {
      toast.loading('AI is generating explanation...', { id: `ai-exp-${idx}` });
      const r = await api.post('/ai/explain', {
        questionText,
        selectedOption: selected,
        correctOption: correct,
        options
      });
      setActiveExplanations(prev => ({ ...prev, [idx]: r.data.explanation }));
      toast.success('Explanation generated!', { id: `ai-exp-${idx}` });
    } catch {
      toast.error('Could not generate AI explanation', { id: `ai-exp-${idx}` });
      setActivePanels(prev => ({ ...prev, [idx]: null }));
    } finally {
      setAiLoading(prev => ({ ...prev, [idx]: false }));
    }
  };


  useEffect(() => {
    api.get(`/attempts/${id}`).then(r => {
      setAttempt(r.data.data);
      if (r.data.data.rating) { setRating(r.data.data.rating); setFeedbackSent(true); }
      if (r.data.data.certificateIssued) {
        api.get(`/certificates/${id}`).then(cr => setCertData(cr.data.data)).catch(() => { });
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (attempt?.quiz?.id || attempt?.quiz?.id) {
      api.get(`/quizzes/${attempt.quiz.id || attempt.quiz.id}/discussions`)
        .then(r => setMessages(r.data.data))
        .catch(console.error);
    }
  }, [attempt]);


  const submitFeedback = async () => {
    if (!rating) return;
    try {
      await api.post(`/attempts/${id}/feedback`, { rating, comment: feedbackComment });
      setFeedbackSent(true);
    } catch { /* silent */ }
  };

  if (loading) return <Layout><div className={styles.center}><div className="spinner" /></div></Layout>;
  if (!attempt) return <Layout><div className={styles.center}><p>Result not found.</p></div></Layout>;

  const { quiz, answers, obtainedMarks, totalMarks, percentage, isPassed, timeTaken, rankPosition, pointsEarned } = attempt;
  const rank = rankPosition;
  const normalizedAnswers = (answers || []).map(a => ({
    ...a,
    selectedOption: a.selectedOptionIndex !== undefined && a.selectedOptionIndex !== null ? a.selectedOptionIndex : a.selectedOption,
    isCorrect: a.isCorrect !== undefined ? a.isCorrect : a.correct
  }));
  const correct = normalizedAnswers.filter(a => a.isCorrect).length;
  const wrong = normalizedAnswers.filter(a => !a.isCorrect && a.selectedOption !== null && a.selectedOption !== undefined).length;
  const skipped = normalizedAnswers.filter(a => a.selectedOption === null || a.selectedOption === undefined).length;
  const flagged = normalizedAnswers.filter(a => a.flagged).length;
  const fmtTime = s => s ? `${Math.floor(s / 60)}m ${s % 60}s` : '—';
  const circumference = 2 * Math.PI * 52;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.topActions}>
          <Link
            to="/student/quizzes"
            onMouseEnter={() => setBackHover(true)}
            onMouseLeave={() => setBackHover(false)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: backHover
                ? 'rgba(99, 102, 241, 0.15)'
                : 'rgba(99, 102, 241, 0.08)',
              border: backHover
                ? '1px solid rgba(99, 102, 241, 0.3)'
                : '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '999px',
              color: '#4F46E5',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              transform: backHover ? 'translateX(-2px)' : 'none',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <BsArrowLeft size={16} />
            <span>Back to Quizzes</span>
          </Link>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handleShareResult} className={styles.certBtn} style={{ background: '#0284c7', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              ✉️ Share Result
            </button>
            {!user?.isPro ? (
              <button onClick={() => navigate('/plans')} className={styles.certBtn} style={{ background: '#475569', color: '#94a3b8', border: '1px dashed #64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#fbbf24' }}>👑</span> AI Diagnostic Report (Pro)
              </button>
            ) : (
              <button onClick={fetchDiagnosticReport} className={styles.certBtn} style={{ background: '#7c3aed', color: 'white', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                ✨ AI Diagnostic Report
              </button>
            )}
            {certData && (
              <a href={`/verify-certificate/${certData.certificateId}`} target="_blank" rel="noreferrer" className={styles.certBtn}><BsDownload size={14} /> Download Certificate</a>
            )}
          </div>

        </div>


        {/* Result hero */}
        <div className={`${styles.hero} ${isPassed ? styles.heroPass : styles.heroFail}`}>
          <div className={styles.heroContent}>
            <div className={styles.heroEmoji}>
              {isPassed ? <BsEmojiSmile size={56} color="white" /> : <BsEmojiFrown size={56} color="white" />}
            </div>
            <h1>{isPassed ? 'Excellent Work!' : 'Keep Practicing!'}</h1>
            <p className={styles.heroQuiz}>{quiz?.title}</p>
            {rank && <div className={styles.rankBadge}><BsTrophy size={12} style={{ marginRight: 4 }} /> Rank #{rank} on this quiz</div>}
            {pointsEarned > 0 && <div className={styles.xpBadge}><BsStar size={12} style={{ marginRight: 4 }} /> +{pointsEarned} XP earned</div>}
          </div>
          <div className={styles.heroScore}>
            <svg width="140" height="140" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="8" />
              <circle cx="70" cy="70" r="52" fill="none" stroke="white" strokeWidth="8"
                strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
                strokeLinecap="round" transform="rotate(-90 70 70)" style={{ transition: 'stroke-dasharray 1.2s ease' }} />
            </svg>
            <div className={styles.scoreOverlay}>
              <span className={styles.scorePct}>{percentage?.toFixed(0)}%</span>
              <span className={styles.scoreRaw}>{obtainedMarks}/{totalMarks}</span>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className={styles.statsRow}>
          {[
            { icon: <BsCheckCircle size={20} color="#10b981" />, val: correct, label: 'Correct', color: '#10b981', bg: '#dcfce7' },
            { icon: <BsXCircle size={20} color="#ef4444" />, val: wrong, label: 'Wrong', color: '#ef4444', bg: '#fee2e2' },
            { icon: <BsSkipEndCircle size={20} color="#f59e0b" />, val: skipped, label: 'Skipped', color: '#f59e0b', bg: '#fef9c3' },
            { icon: <BsFlag size={20} color="#8b5cf6" />, val: flagged, label: 'Flagged', color: '#8b5cf6', bg: '#ede9fe' },
            { icon: <BsClock size={20} color="#0ea5e9" />, val: fmtTime(timeTaken), label: 'Time Taken', color: '#0ea5e9', bg: '#e0f2fe' },
            { icon: <BsTrophy size={20} color="#d97706" />, val: rank ? `#${rank}` : '—', label: 'Quiz Rank', color: '#d97706', bg: '#fef3c7' },
          ].map(s => (
            <div key={s.label} className={styles.statCard} style={{ borderTopColor: s.color }}>
              <div className={styles.statEmoji}>{s.icon}</div>
              <div className={styles.statVal} style={{ color: s.color }}>{s.val}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Certificate */}
        {certData && (
          <div className={styles.certBannerBox}>
            <BsAward size={32} color="#d97706" />
            <div><strong>Certificate Earned!</strong><p>You've qualified for a certificate on "{quiz?.title}". Score: {percentage?.toFixed(0)}%</p></div>
            <a href={`/verify-certificate/${certData.certificateId}`} target="_blank" rel="noreferrer" className={styles.certBannerLink}>View Certificate →</a>
          </div>
        )}

        {/* Feedback */}
        {quiz?.feedbackEnabled && (
          <div className={styles.feedbackCard}>
            <h3><BsStar /> Rate this Quiz</h3>
            {feedbackSent ? (
              <div className={styles.feedbackDone}><BsCheckCircle color="#10b981" /> Thanks for your feedback!</div>
            ) : (
              <>
                <div className={styles.stars}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} className={`${styles.star} ${rating >= n ? styles.starOn : ''}`} onClick={() => setRating(n)}>★</button>
                  ))}
                </div>
                <textarea className={styles.feedbackInput} placeholder="Any comments about this quiz? (optional)" value={feedbackComment} onChange={e => setFeedbackComment(e.target.value)} rows={2} />
                <button className={styles.feedbackBtn} onClick={submitFeedback} disabled={!rating}>Submit Feedback</button>
              </>
            )}
          </div>
        )}

        {/* Answer Review */}
        {quiz?.showResults && (
          <div className={styles.reviewSection}>
            <div className={styles.reviewHead}><h2>📋 Answer Review</h2><span>{correct}/{normalizedAnswers.length} correct</span></div>
            <div className={styles.reviewList}>
              {normalizedAnswers.map((ans, idx) => {
                const q = ans.question;
                const isShort = q?.type === 'short_answer';
                const notAns = isShort ? (!ans.textAnswer || ans.textAnswer.trim() === '') : (ans.selectedOption === null || ans.selectedOption === undefined);
                return (
                  <div
                    key={idx}
                    className={`${styles.reviewCard} ${ans.isCorrect ? styles.rcCorrect : notAns ? styles.rcSkip : styles.rcWrong}`}
                    onClick={() => {
                      if (prefs?.soundEffects) {
                        if (ans.isCorrect) playCorrectSound();
                        else playWrongSound();
                      }
                    }}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={styles.rcTop}>
                      <span className={styles.rcIdx}>Q{idx + 1}</span>
                      {ans.flagged && <span className={styles.rcFlagged}><BsFlag size={12} style={{ marginRight: 4 }} /> Flagged</span>}
                      <span className={`${styles.rcStatus} ${ans.isCorrect ? styles.rcStatusPass : notAns ? styles.rcStatusSkip : styles.rcStatusFail}`}>
                        {ans.isCorrect ? 'Correct' : notAns ? 'Skipped' : 'Wrong'}
                      </span>
                      <span className={styles.rcMarks}>
                        {ans.marksAwarded > 0 ? `+${ans.marksAwarded}` : ans.marksAwarded} marks
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleBookmark(q?.id); }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: bookmarkedIds.has(q?.id) ? '#4f46e5' : '#94a3b8',
                            display: 'inline-flex',
                            alignItems: 'center',
                            marginLeft: '12px',
                            padding: '2px 4px',
                            borderRadius: '4px',
                            verticalAlign: 'middle',
                            outline: 'none'
                          }}
                          title={bookmarkedIds.has(q?.id) ? "Remove Bookmark" : "Bookmark Question"}
                        >
                          {bookmarkedIds.has(q?.id) ? <BsBookmarkFill size={14} /> : <BsBookmark size={14} />}
                        </button>
                      </span>
                    </div>
                    <div className={styles.rcQ}><CodeBlock text={q?.text} /></div>
                    {isShort ? (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Your Answer:</strong> <span style={{ color: ans.isCorrect ? '#10b981' : '#ef4444' }}>{ans.textAnswer || '—'}</span>
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <strong>Reference Answer:</strong> <span>{q?.options?.[0]?.text || '—'}</span>
                        </div>
                        {ans.aiFeedback && (
                          <div className={styles.aiFeedbackBox}>
                            🤖 <strong>AI Grading Feedback:</strong> {ans.aiFeedback}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className={styles.rcOptions}>
                        {q?.options?.map((opt, i) => {
                          const isSel = ans.selectedOption === i;
                          const isCorr = opt.isCorrect;
                          return (
                            <div key={i} className={`${styles.rcOpt} ${isCorr ? styles.rcOptCorr : ''} ${isSel && !isCorr ? styles.rcOptWrong : ''}`}>
                              <span className={styles.rcLetter}>{String.fromCharCode(65 + i)}</span>
                              <span>{opt.text}</span>
                              {isCorr && <BsCheckCircle className={styles.rcIcon} color="#10b981" />}
                              {isSel && !isCorr && <BsXCircle className={styles.rcIcon} color="#ef4444" />}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {/* Unified Actions & Toggles Container */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                      {/* Hint Toggle Button */}
                      {q?.hint && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleHint(idx); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: '1.5px solid #d97706',
                            background: activePanels[idx] === 'hint' ? 'rgba(217, 119, 6, 0.16)' : 'rgba(217, 119, 6, 0.04)',
                            color: '#d97706',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(217, 119, 6, 0.16)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = activePanels[idx] === 'hint' ? 'rgba(217, 119, 6, 0.12)' : 'rgba(217, 119, 6, 0.04)';
                          }}
                        >
                          🔑 {activePanels[idx] === 'hint' ? 'Hide Hint' : 'View Hint'}
                        </button>
                      )}

                      {/* Explanation Toggle Button */}
                      {q?.explanation && (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); toggleExplanation(idx); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: '1.5px solid #8b5cf6',
                            background: activePanels[idx] === 'explanation' ? 'rgba(139, 92, 246, 0.16)' : 'rgba(139, 92, 246, 0.04)',
                            color: '#8b5cf6',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(139, 92, 246, 0.16)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = activePanels[idx] === 'explanation' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(139, 92, 246, 0.04)';
                          }}
                        >
                          💡 {activePanels[idx] === 'explanation' ? 'Hide Explanation' : 'View Explanation'}
                        </button>
                      )}

                      {/* Dynamic AI Explanation Button */}
                      {!user?.isPro ? (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate('/plans'); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: '1.5px dashed #06b6d4',
                            background: 'rgba(6, 182, 212, 0.04)',
                            color: '#06b6d4',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.16)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.04)';
                          }}
                        >
                          <span style={{ color: '#fbbf24' }}>👑</span> Dynamic AI Explanation (Pro)
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); handleFetchAIExplanation(idx, q?.text, isShort ? (ans.textAnswer || '') : (q?.options?.[ans.selectedOption]?.text || ''), q?.options?.find(o => o.isCorrect)?.text || '', q?.options?.map(o => o.text)); }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            fontSize: '0.78rem',
                            fontWeight: '600',
                            borderRadius: '8px',
                            border: '1.5px solid #06b6d4',
                            background: activePanels[idx] === 'aiExplanation' ? 'rgba(6, 182, 212, 0.16)' : 'rgba(6, 182, 212, 0.04)',
                            color: '#06b6d4',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(6, 182, 212, 0.16)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = activePanels[idx] === 'aiExplanation' ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.04)';
                          }}
                        >
                          ✨ {activePanels[idx] === 'aiExplanation' ? 'Hide AI Explanation' : 'Ask AI For more Explanation'}
                        </button>
                      )}
                    </div>

                    {/* Render Hint Content */}
                    {q?.hint && activePanels[idx] === 'hint' && (
                      <div
                        style={{
                          marginTop: '8px',
                          padding: '10px 13px',
                          background: '#fffbeb',
                          borderRadius: '8px',
                          fontSize: '0.8rem',
                          color: '#b45309',
                          lineHeight: '1.55',
                          borderLeft: '3px solid #f59e0b'
                        }}
                      >
                        <strong>Hint:</strong> {q.hint}
                      </div>
                    )}

                    {/* Render Explanation Content */}
                    {q?.explanation && activePanels[idx] === 'explanation' && (
                      <div className={styles.rcExpl}>
                        💡 Explanation <CodeBlock text={q.explanation} />
                      </div>
                    )}

                    {/* Render AI Dynamic Explanation Content */}
                    {activePanels[idx] === 'aiExplanation' && (
                      <div className={styles.aiExplBox} style={{ marginTop: '8px' }}>
                        {aiLoading[idx] ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#581c87' }}>
                            <div className="spinner" style={{ width: '16px', height: '16px' }} />
                            <span>AI is generating explanation...</span>
                          </div>
                        ) : (
                          <CodeBlock text={activeExplanations[idx]} />
                        )}
                      </div>
                    )}
                  </div>

                );
              })}
            </div>
          </div>
        )}

        {/* Discussion / Q&A per Quiz */}
        <div className={styles.discBoard}>
          <h3 className={styles.discTitle}>💬 Quiz Discussion & Q&A Board</h3>
          <p className={styles.discDesc}>Ask questions, clear doubts, and collaborate with classmates and faculty about this quiz.</p>

          <div className={styles.discMsgList}>
            {messages.length === 0 ? (
              <div className={styles.discEmpty}>
                No messages posted yet. Be the first to start the discussion!
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} className={`${styles.discMsg} ${m.userRole === 'faculty' ? styles.discMsgFaculty : styles.discMsgStudent}`}>
                  <div className={styles.discMsgMeta}>
                    <span className={styles.discMsgUser}>
                      {m.userName} <span className={`${styles.discMsgRole} ${m.userRole === 'faculty' ? styles.discRoleFaculty : styles.discRoleStudent}`}>{m.userRole}</span>
                    </span>
                    <span className={styles.discMsgTime}>{m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div className={styles.discMsgText}>{m.message}</div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handlePostMessage} className={styles.discForm}>
            <input
              type="text"
              placeholder="Ask a question or share a study tip..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              className={styles.discInput}
            />
            <button type="submit" className={styles.discSendBtn}>
              Send
            </button>
          </form>
        </div>

        <div className={styles.bottomActions}>
          <Link to="/student/quizzes" className={styles.btnOutline}><BsArrowLeft /> Browse Quizzes</Link>
          {normalizedAnswers.length - correct > 0 && (
            <button onClick={startRevision} className={styles.btnRevision}>
              🔄 Revision Mode ({normalizedAnswers.length - correct})
            </button>
          )}
          <Link to="/student/dashboard" className={styles.btnPrimary}>Dashboard</Link>
        </div>

        {showReportModal && (
          <div className={styles.reportOverlay}>
            <div className={styles.reportBox}>
              <div className={styles.reportHeader}>
                <h2 className={styles.reportTitle}>✨ AI Diagnostics & Performance Report</h2>
                <button onClick={() => setShowReportModal(false)} className={styles.reportClose}>&times;</button>
              </div>
              <div className={styles.reportContent}>
                {reportLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: 10 }}>
                    <div className="spinner" />
                    <span>Analyzing your performance and generating insights...</span>
                  </div>
                ) : (
                  <ReactMarkdown>{report}</ReactMarkdown>
                )}
              </div>
              <div className={styles.reportFooter}>
                <button onClick={() => setShowReportModal(false)} className={styles.btnPrimary} style={{ padding: '8px 16px', borderRadius: 6, cursor: 'pointer' }}>Close Report</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
