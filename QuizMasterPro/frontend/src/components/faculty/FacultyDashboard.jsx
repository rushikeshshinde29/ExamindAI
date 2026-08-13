import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Modal, Form, Spinner, Tab, Nav } from 'react-bootstrap';
import { FiPlus, FiEdit2, FiTrash2, FiEye, FiToggleLeft, FiToggleRight, FiBarChart2, FiCpu, FiUsers } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { quizApi, analyticsApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

// ── FACULTY DASHBOARD ─────────────────────────────────────────
export const FacultyDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsApi.faculty().then(r => setAnalytics(r.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Faculty Dashboard"><div className="qmp-spinner" /></AppLayout>;

  return (
    <AppLayout title="Faculty Dashboard">
      <div style={{ background: 'linear-gradient(135deg, var(--secondary), var(--primary-dark))', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white' }}>
        <h4 style={{ margin: 0, fontWeight: 800 }}>Welcome, {user?.name?.split(' ')[0]}! 👨‍🏫</h4>
        <p style={{ margin: '6px 0 16px', opacity: .8, fontSize: '.9rem' }}>{user?.designation || 'Faculty'} — {user?.department}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => navigate('/faculty/create-quiz')} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '9px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPlus /> Create Quiz
          </button>
          <button onClick={() => navigate('/faculty/quizzes')} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: 'white', padding: '9px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.875rem' }}>
            My Quizzes
          </button>
        </div>
      </div>

      <Row className="g-3 mb-4">
        {[
          { icon: '📝', val: analytics?.totalQuizzes ?? analytics?.TotalQuizzes ?? 0, label: 'Total Quizzes', color: 'indigo' },
          { icon: '✅', val: analytics?.publishedQuizzes ?? analytics?.PublishedQuizzes ?? 0, label: 'Published', color: 'green' },
          { icon: '👥', val: analytics?.totalAttempts ?? analytics?.TotalAttempts ?? 0, label: 'Total Attempts', color: 'amber' },
          { icon: '📊', val: `${analytics?.overallPassRate ?? analytics?.OverallPassRate ?? 0}%`, label: 'Pass Rate', color: 'rose' },
        ].map(s => (
          <Col xs={6} md={3} key={s.label}>
            <div className={`stat-card ${s.color}`}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Quiz Performance Chart */}
      {(analytics?.quizPerformance?.length > 0 || analytics?.QuizPerformance?.length > 0) && (
        <div className="qmp-card mb-3">
          <div className="qmp-card-header" style={{ paddingBottom: 16 }}>
            <h6 style={{ fontWeight: 700, margin: 0 }}>Quiz Performance</h6>
          </div>
          <div className="qmp-card-body" style={{ paddingTop: 0 }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={analytics.quizPerformance || analytics.QuizPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="averageScore" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </AppLayout>
  );
};

// ── FACULTY QUIZ LIST ─────────────────────────────────────────
export const FacultyQuizList = () => {
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const load = () => quizApi.getAll({ limit: 100 }).then(r => setQuizzes(r.data.data || [])).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const togglePublish = async (id) => {
    try {
      const r = await quizApi.togglePublish(id);
      toast.success(r.data?.message || r.data?.Message || 'Quiz status updated');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.Message || 'Failed to update quiz status');
    }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz and all its data?')) return;
    setDeleting(id);
    try {
      await quizApi.delete(id);
      toast.success('Quiz deleted');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.Message || 'Failed to delete quiz');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <AppLayout title="My Quizzes"><div className="qmp-spinner" /></AppLayout>;

  return (
    <AppLayout title="My Quizzes">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h5 style={{ fontWeight: 700, margin: 0 }}>My Quizzes</h5>
          <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>{quizzes.length} total</p>
        </div>
        <button onClick={() => navigate('/faculty/create-quiz')} className="btn-primary-custom" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiPlus /> Create Quiz
        </button>
      </div>

      {quizzes.length === 0
        ? <div className="qmp-card"><div className="empty-state"><div className="empty-state-icon">📝</div><h5>No quizzes yet</h5><p>Create your first quiz to get started</p><button onClick={() => navigate('/faculty/create-quiz')} className="btn-primary-custom" style={{ marginTop: 12 }}>Create Quiz</button></div></div>
        : <div className="qmp-card">
            <table className="qmp-table">
              <thead>
                <tr><th>Quiz</th><th>Subject</th><th>Questions</th><th>Attempts</th><th>Avg Score</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {quizzes.map(q => (
                  <tr key={q.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{q.title}</div>
                      <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                        <span className={`badge-${q.difficulty}`} style={{ padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600 }}>{q.difficulty}</span>
                        {q.isAIGenerated && <span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600 }}>🤖 AI</span>}
                        {q.certificateEnabled && <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 20, fontSize: '.68rem', fontWeight: 600 }}>🎓 Cert</span>}
                      </div>
                    </td>
                    <td style={{ color: 'var(--gray)', fontSize: '.875rem' }}>{q.subject}</td>
                    <td><strong>{q.questionCount}</strong></td>
                    <td><strong>{q.attemptCount}</strong></td>
                    <td><strong>{q.averageScore?.toFixed(1)}%</strong></td>
                    <td>
                      <span className={q.isPublished ? 'status-active' : 'status-inactive'}>
                        {q.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => navigate(`/faculty/quiz/${q.id}/edit`)} title="Edit"
                          style={{ padding: '6px 8px', border: 'none', borderRadius: 6, background: 'var(--bg)', cursor: 'pointer', color: 'var(--gray)' }}>
                          <FiEdit2 />
                        </button>
                        <button onClick={() => togglePublish(q.id)} title={q.isPublished ? 'Unpublish' : 'Publish'}
                          style={{ padding: '6px 8px', border: 'none', borderRadius: 6, background: q.isPublished ? '#d1fae5' : 'var(--bg)', cursor: 'pointer', color: q.isPublished ? 'var(--success)' : 'var(--gray)' }}>
                          {q.isPublished ? <FiToggleRight /> : <FiToggleLeft />}
                        </button>
                        <button onClick={() => navigate(`/faculty/quiz/${q.id}/results`)} title="Results"
                          style={{ padding: '6px 8px', border: 'none', borderRadius: 6, background: 'var(--bg)', cursor: 'pointer', color: 'var(--gray)' }}>
                          <FiBarChart2 />
                        </button>
                        <button onClick={() => deleteQuiz(q.id)} title="Delete" disabled={deleting === q.id}
                          style={{ padding: '6px 8px', border: 'none', borderRadius: 6, background: '#ffe4e6', cursor: 'pointer', color: 'var(--danger)' }}>
                          {deleting === q.id ? <Spinner size="sm" /> : <FiTrash2 />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </AppLayout>
  );
};
