import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from 'react-bootstrap';

// Auth pages
import { LoginPage, RegisterPage, ForgotPasswordPage, ResetPasswordPage } from './components/auth/AuthPages';

// Student pages
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentQuizList, QuizPlayer } from './components/student/QuizPlayer';
import { ResultPage, CertificatesPage } from './components/student/ResultPage';

// Faculty pages
import { FacultyDashboard, FacultyQuizList } from './components/faculty/FacultyDashboard';
import { CreateQuizPage } from './components/faculty/CreateQuiz';

// Admin pages
import { AdminDashboard, UserManagement, AddUserPage } from './components/admin/AdminDashboard';

// Shared
import { ProfilePage } from './components/shared/ProfilePage';
import { Homepage } from './components/shared/Homepage';

// ── PRIVATE ROUTE ─────────────────────────────────────────────
const PrivateRoute = ({ children, roles }) => {
  const { user, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="qmp-spinner" />
    </div>
  );

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

// ── PUBLIC ROUTE ──────────────────────────────────────────────
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return children;
};

// ── ROUTER ─────────────────────────────────────────────────────
const AppRouter = () => (
  <Routes>
    {/* Public */}
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
    <Route path="/reset-password" element={<ResetPasswordPage />} />

    {/* Student */}
    <Route path="/student" element={<PrivateRoute roles={['student']}><StudentDashboard /></PrivateRoute>} />
    <Route path="/student/quizzes" element={<PrivateRoute roles={['student']}><StudentQuizList /></PrivateRoute>} />
    <Route path="/student/quiz/:quizId" element={<PrivateRoute roles={['student']}><QuizPlayer /></PrivateRoute>} />
    <Route path="/student/result/:attemptId" element={<PrivateRoute roles={['student']}><ResultPage /></PrivateRoute>} />
    <Route path="/student/my-attempts" element={<PrivateRoute roles={['student']}><ResultListPage /></PrivateRoute>} />
    <Route path="/student/certificates" element={<PrivateRoute roles={['student']}><CertificatesPage /></PrivateRoute>} />
    <Route path="/student/profile" element={<PrivateRoute roles={['student']}><ProfilePage /></PrivateRoute>} />
    <Route path="/student/analytics" element={<PrivateRoute roles={['student']}><StudentAnalyticsPage /></PrivateRoute>} />

    {/* Faculty */}
    <Route path="/faculty" element={<PrivateRoute roles={['faculty']}><FacultyDashboard /></PrivateRoute>} />
    <Route path="/faculty/quizzes" element={<PrivateRoute roles={['faculty']}><FacultyQuizList /></PrivateRoute>} />
    <Route path="/faculty/create-quiz" element={<PrivateRoute roles={['faculty']}><CreateQuizPage /></PrivateRoute>} />
    <Route path="/faculty/quiz/:id/edit" element={<PrivateRoute roles={['faculty']}><CreateQuizPage /></PrivateRoute>} />
    <Route path="/faculty/quiz/:id/results" element={<PrivateRoute roles={['faculty']}><QuizResultsPage /></PrivateRoute>} />
    <Route path="/faculty/profile" element={<PrivateRoute roles={['faculty']}><ProfilePage /></PrivateRoute>} />
    <Route path="/faculty/analytics" element={<PrivateRoute roles={['faculty']}><FacultyAnalyticsPage /></PrivateRoute>} />

    {/* Admin */}
    <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminDashboard /></PrivateRoute>} />
    <Route path="/admin/students" element={<PrivateRoute roles={['admin']}><UserManagement roleType="student" /></PrivateRoute>} />
    <Route path="/admin/faculty" element={<PrivateRoute roles={['admin']}><UserManagement roleType="faculty" /></PrivateRoute>} />
    <Route path="/admin/add-user" element={<PrivateRoute roles={['admin']}><AddUserPage /></PrivateRoute>} />
    <Route path="/admin/quizzes" element={<PrivateRoute roles={['admin']}><AdminQuizListPage /></PrivateRoute>} />

    {/* Home */}
    <Route path="/" element={<HomeRoute />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

// ── SMALL INLINE PAGES ────────────────────────────────────────
import { AppLayout } from './components/layout/Layout';
import { attemptApi, analyticsApi, adminApi, quizApi } from './services/api';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { Row, Col } from 'react-bootstrap';

const HomeRoute = () => {
  const { user, authLoading } = useAuth();
  if (authLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="qmp-spinner" />
    </div>
  );
  if (user) return <Navigate to={`/${user.role}`} replace />;
  return <Homepage />;
};

const ResultListPage = () => {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  useEffect(() => { attemptApi.my().then(r => setAttempts(r.data.data || [])).finally(() => setLoading(false)); }, []);
  return (
    <AppLayout title="My Attempts">
      {loading ? <div className="qmp-spinner" /> : (
        <div className="qmp-card">
          <table className="qmp-table">
            <thead><tr><th>Quiz</th><th>Score</th><th>Result</th><th>Points</th><th>Date</th><th>Review</th></tr></thead>
            <tbody>
              {attempts.map(a => (
                <tr key={a.id}>
                  <td><div style={{ fontWeight: 600 }}>{a.quizTitle}</div><div style={{ fontSize: '.75rem', color: 'var(--gray)' }}>{a.quizSubject}</div></td>
                  <td><strong>{a.percentage?.toFixed(0)}%</strong> <span style={{ color: 'var(--gray)', fontSize: '.8rem' }}>({a.obtainedMarks}/{a.totalMarks})</span></td>
                  <td>{a.isPassed ? <span className="status-active">✅ Passed</span> : <span className="status-banned">❌ Failed</span>}</td>
                  <td><span style={{ color: 'var(--primary)', fontWeight: 700 }}>+{a.pointsEarned}</span></td>
                  <td style={{ color: 'var(--gray)', fontSize: '.8rem' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td><button onClick={() => navigate(`/student/result/${a.id}`)} style={{ background: 'var(--primary-light)', border: 'none', color: 'var(--primary-dark)', padding: '5px 12px', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontSize: '.78rem' }}>Review</button></td>
                </tr>
              ))}
              {attempts.length === 0 && <tr><td colSpan={6}><div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">📊</div><p>No attempts yet. Start a quiz!</p></div></td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
};

const StudentAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { analyticsApi.student().then(r => setData(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <AppLayout title="Analytics"><div className="qmp-spinner" /></AppLayout>;
  return (
    <AppLayout title="My Analytics">
      <Row className="g-3 mb-4">
        {[['📝', data?.totalAttempts, 'Attempts'], ['✅', data?.passCount, 'Passed'], ['📊', `${data?.averageScore}%`, 'Avg Score'], ['🎓', data?.certificates, 'Certificates']].map(([ic, val, lbl]) => (
          <Col xs={6} md={3} key={lbl}><div className="stat-card indigo"><div className="stat-icon indigo">{ic}</div><div className="stat-value">{val}</div><div className="stat-label">{lbl}</div></div></Col>
        ))}
      </Row>
      <div className="qmp-card">
        <div className="qmp-card-header" style={{ paddingBottom: 16 }}><h6 style={{ fontWeight: 700, margin: 0 }}>Score History</h6></div>
        <div className="qmp-card-body" style={{ paddingTop: 0 }}>
          {data?.scoreTrend?.length > 1
            ? <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data.scoreTrend}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip formatter={v => [`${v}%`]} /><Line type="monotone" dataKey="percentage" stroke="var(--primary)" strokeWidth={2} /></LineChart>
              </ResponsiveContainer>
            : <div className="empty-state"><div className="empty-state-icon">📈</div><p>Attempt more quizzes to see trends</p></div>
          }
        </div>
      </div>
    </AppLayout>
  );
};

const FacultyAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { analyticsApi.faculty().then(r => setData(r.data)).finally(() => setLoading(false)); }, []);
  if (loading) return <AppLayout title="Analytics"><div className="qmp-spinner" /></AppLayout>;
  return (
    <AppLayout title="Faculty Analytics">
      <Row className="g-3 mb-4">
        {[['📝', data?.totalQuizzes, 'Total Quizzes'], ['✅', data?.publishedQuizzes, 'Published'], ['👥', data?.totalAttempts, 'Attempts'], [`${data?.overallPassRate}%`, null, 'Pass Rate']].map(([val, _, lbl]) => (
          <Col xs={6} md={3} key={lbl}><div className="stat-card green"><div className="stat-icon green">📊</div><div className="stat-value">{val}</div><div className="stat-label">{lbl}</div></div></Col>
        ))}
      </Row>
      <div className="qmp-card">
        <div className="qmp-card-header" style={{ paddingBottom: 16 }}><h6 style={{ fontWeight: 700, margin: 0 }}>Quiz Performance</h6></div>
        <div className="qmp-card-body" style={{ paddingTop: 0 }}>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data?.quizPerformance || []}><XAxis dataKey="title" tick={{ fontSize: 10 }} /><YAxis /><Tooltip /><Bar dataKey="averageScore" fill="var(--primary)" radius={[4, 4, 0, 0]} /></BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
};

const QuizResultsPage = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { quizApi.getResults(id).then(r => setData(r.data)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <AppLayout title="Quiz Results"><div className="qmp-spinner" /></AppLayout>;
  return (
    <AppLayout title="Quiz Results">
      {data?.stats && (
        <Row className="g-3 mb-4">
          {[['Total', data.stats.totalAttempts], ['Passed', data.stats.passCount], ['Failed', data.stats.failCount], ['Avg', `${data.stats.averageScore}%`]].map(([l, v]) => (
            <Col xs={6} md={3} key={l}><div className="stat-card indigo"><div className="stat-value">{v}</div><div className="stat-label">{l}</div></div></Col>
          ))}
        </Row>
      )}
      <div className="qmp-card">
        <table className="qmp-table">
          <thead><tr><th>Student</th><th>Dept</th><th>Score</th><th>Result</th><th>Time</th><th>Date</th></tr></thead>
          <tbody>
            {(data?.data || []).map(a => (
              <tr key={a.id}>
                <td><div style={{ fontWeight: 600 }}>{a.student?.name}</div><div style={{ fontSize: '.75rem', color: 'var(--gray)' }}>{a.student?.email}</div></td>
                <td style={{ fontSize: '.875rem', color: 'var(--gray)' }}>{a.student?.department || '—'}</td>
                <td><strong>{a.percentage?.toFixed(1)}%</strong></td>
                <td>{a.isPassed ? <span className="status-active">Passed</span> : <span className="status-banned">Failed</span>}</td>
                <td style={{ fontSize: '.8rem' }}>{Math.floor(a.timeTaken / 60)}m</td>
                <td style={{ fontSize: '.8rem', color: 'var(--gray)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppLayout>
  );
};

const AdminQuizListPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { adminApi.quizzes().then(r => setQuizzes(r.data.data || [])).finally(() => setLoading(false)); }, []);
  return (
    <AppLayout title="All Quizzes">
      {loading ? <div className="qmp-spinner" /> : (
        <div className="qmp-card">
          <table className="qmp-table">
            <thead><tr><th>Quiz</th><th>Faculty</th><th>Attempts</th><th>Avg Score</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              {quizzes.map(q => (
                <tr key={q.id}>
                  <td><div style={{ fontWeight: 600 }}>{q.title}</div><div style={{ fontSize: '.75rem', color: 'var(--gray)' }}>{q.subject} · {q.difficulty}</div></td>
                  <td style={{ fontSize: '.875rem' }}>{q.faculty}</td>
                  <td><strong>{q.attemptCount}</strong></td>
                  <td><strong>{q.averageScore?.toFixed(1)}%</strong></td>
                  <td>{q.isPublished ? <span className="status-active">Published</span> : <span className="status-inactive">Draft</span>}</td>
                  <td style={{ fontSize: '.8rem', color: 'var(--gray)' }}>{new Date(q.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
};

// ── MAIN APP ──────────────────────────────────────────────────
const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#3A2E22', color: '#fff', borderRadius: '10px', fontSize: '.875rem', fontWeight: 500 } }} />
      <AppRouter />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
