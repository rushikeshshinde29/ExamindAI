import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Spinner } from 'react-bootstrap';
import { FiBookOpen, FiAward, FiStar, FiZap, FiArrowRight, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { analyticsApi, quizApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import { useAuth } from '../../context/AuthContext';

const StatCard = ({ icon, value, label, color, sub }) => (
  <div className={`stat-card ${color}`}>
    <div className={`stat-icon ${color}`}>{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {sub && <div className="stat-change up">{sub}</div>}
  </div>
);

export const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([analyticsApi.student(), quizApi.getAll({ limit: 6 })])
      .then(([a, q]) => { setAnalytics(a.data); setQuizzes(q.data.data || []); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Dashboard"><div className="qmp-spinner" /></AppLayout>;

  const passCount = analytics?.passCount ?? analytics?.PassCount ?? 0;
  const totalAttempts = analytics?.totalAttempts ?? analytics?.TotalAttempts ?? 0;
  const averageScore = analytics?.averageScore ?? analytics?.AverageScore ?? 0;
  const totalPoints = analytics?.totalPoints ?? analytics?.TotalPoints ?? 0;
  const level = analytics?.level ?? analytics?.Level ?? 1;
  const streak = analytics?.streak ?? analytics?.Streak ?? 0;

  const passRate = totalAttempts > 0
    ? Math.round((passCount / totalAttempts) * 100) : 0;

  return (
    <AppLayout title="Student Dashboard">
      {/* Welcome Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: -20, top: -20, width: 200, height: 200, background: 'rgba(255,255,255,.07)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', right: 40, bottom: -60, width: 160, height: 160, background: 'rgba(255,255,255,.05)', borderRadius: '50%' }} />
        <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem' }}>Good day, {user?.name?.split(' ')[0]}! 🎉</h4>
        <p style={{ margin: '6px 0 16px', opacity: .85, fontSize: '.9rem' }}>
          You're on a <strong>{streak}-day streak</strong>. Keep it up! 🔥
        </p>
        <button onClick={() => navigate('/student/quizzes')} style={{ background: 'rgba(255,255,255,.2)', border: '1px solid rgba(255,255,255,.3)', color: 'white', padding: '8px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          Browse Quizzes <FiArrowRight />
        </button>
      </div>

      {/* Stats Row */}
      <Row className="g-3 mb-4">
        <Col xs={6} md={3}><StatCard icon="📝" value={totalAttempts} label="Total Attempts" color="indigo" /></Col>
        <Col xs={6} md={3}><StatCard icon="✅" value={`${passRate}%`} label="Pass Rate" color="green" sub={passCount ? `${passCount} passed` : null} /></Col>
        <Col xs={6} md={3}><StatCard icon="⭐" value={averageScore ? `${averageScore}%` : '0%'} label="Avg Score" color="amber" /></Col>
        <Col xs={6} md={3}><StatCard icon="🏆" value={totalPoints} label="Total Points" color="rose" sub={`Level ${level}`} /></Col>
      </Row>

      <Row className="g-3">
        {/* Score Trend */}
        <Col lg={12}>
          <div className="qmp-card">
            <div className="qmp-card-header" style={{ paddingBottom: 16 }}>
              <h6 style={{ fontWeight: 700, margin: 0 }}>Score Trend</h6>
              <span style={{ fontSize: '.8rem', color: 'var(--gray)' }}>Last 20 attempts</span>
            </div>
            <div className="qmp-card-body" style={{ paddingTop: 0 }}>
              {analytics?.ScoreTrend?.length > 1
                ? <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={analytics.ScoreTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={v => [`${v}%`, 'Score']} />
                      <Line type="monotone" dataKey="percentage" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                : <div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">📈</div><p style={{ color: 'var(--gray)', fontSize: '.875rem' }}>Attempt more quizzes to see your trend</p></div>
              }
            </div>
          </div>
        </Col>
      </Row>

      {/* Available Quizzes */}
      <div style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h6 style={{ fontWeight: 700, margin: 0 }}>Available Quizzes</h6>
          <button onClick={() => navigate('/student/quizzes')} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            View all <FiArrowRight />
          </button>
        </div>
        <Row className="g-3">
          {quizzes.slice(0, 3).map(q => (
            <Col md={4} key={q.id}>
              <div className="quiz-card" onClick={() => navigate(`/student/quiz/${q.id}`)}>
                <div className={`quiz-card-cover ${q.difficulty}`} />
                <div className="quiz-card-body">
                  <span className={`quiz-card-tag badge-${q.difficulty}`}>{q.difficulty}</span>
                  <div className="quiz-card-title">{q.title}</div>
                  <div className="quiz-card-meta">
                    <span>📚 {q.subject}</span>
                    <span><FiClock style={{ marginBottom: 1 }} /> {q.durationMinutes}m</span>
                    <span>❓ {q.questionCount} Qs</span>
                  </div>
                </div>
                <div className="quiz-card-footer">
                  <span style={{ fontSize: '.78rem', color: 'var(--gray)' }}>⭐ {q.averageScore?.toFixed(0) ?? 0}% avg</span>
                  <span style={{ color: 'var(--primary)', fontSize: '.8rem', fontWeight: 600 }}>Start →</span>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </div>

      {/* Recent Attempts */}
      {analytics?.RecentAttempts?.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h6 style={{ fontWeight: 700, marginBottom: 16 }}>Recent Attempts</h6>
          <div className="qmp-card">
            <table className="qmp-table">
              <thead>
                <tr><th>Quiz</th><th>Score</th><th>Result</th><th>Date</th></tr>
              </thead>
              <tbody>
                {analytics.RecentAttempts.map(a => (
                  <tr key={a.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/student/result/${a.id}`)}>
                    <td style={{ fontWeight: 600 }}>{a.quiz}</td>
                    <td><strong>{a.percentage}%</strong> <span style={{ color: 'var(--gray)', fontSize: '.8rem' }}>({a.obtainedMarks}/{a.totalMarks})</span></td>
                    <td>{a.isPassed ? <span className="status-active">✅ Passed</span> : <span className="status-banned">❌ Failed</span>}</td>
                    <td style={{ color: 'var(--gray)', fontSize: '.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </AppLayout>
  );
};
