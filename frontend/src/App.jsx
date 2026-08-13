import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { DialogProvider } from './context/DialogContext';
import api from './utils/api';
import './index.css';

// Public
const Landing       = lazy(() => import('./pages/Landing'));
const Login         = lazy(() => import('./pages/Login'));
const Register      = lazy(() => import('./pages/Register'));
const CertVerify    = lazy(() => import('./pages/CertVerify'));
const OtpVerify     = lazy(() => import('./pages/OtpVerify'));
const ForgotPwd     = lazy(() => import('./pages/ForgotPassword'));
const ResetPwd      = lazy(() => import('./pages/ResetPassword'));
const Preferences   = lazy(() => import('./pages/Preferences'));
const Plans         = lazy(() => import('./pages/Plans'));

// Student
const StudentDashboard  = lazy(() => import('./pages/student/Dashboard'));
const StudentQuizzes    = lazy(() => import('./pages/student/Quizzes'));
const TakeQuiz          = lazy(() => import('./pages/student/TakeQuiz'));
const QuizResult        = lazy(() => import('./pages/student/QuizResult'));
const StudentHistory    = lazy(() => import('./pages/student/History'));
const StudentProfile    = lazy(() => import('./pages/student/Profile'));
const StudentAnalytics  = lazy(() => import('./pages/student/Analytics'));
const Leaderboard       = lazy(() => import('./pages/student/Leaderboard'));
const StudentCerts      = lazy(() => import('./pages/student/Certificates'));
const Bookmarks         = lazy(() => import('./pages/student/Bookmarks'));
const StudyNotes        = lazy(() => import('./pages/student/StudyNotes'));
const Heatmap           = lazy(() => import('./pages/student/Heatmap'));
const StudentAnnouncements = lazy(() => import('./pages/student/StudentAnnouncements'));
const StudentGroups        = lazy(() => import('./pages/student/StudentGroups'));
const AICoach              = lazy(() => import('./pages/student/AICoach'));

// Faculty
const FacultyDashboard  = lazy(() => import('./pages/faculty/Dashboard'));
const ManageQuizzes     = lazy(() => import('./pages/faculty/ManageQuizzes'));
const CreateQuiz        = lazy(() => import('./pages/faculty/CreateQuiz'));
const EditQuiz          = lazy(() => import('./pages/faculty/EditQuiz'));
const QuizResults       = lazy(() => import('./pages/faculty/QuizResults'));
const FacultyProfile    = lazy(() => import('./pages/faculty/Profile'));
const FacultyAnalytics  = lazy(() => import('./pages/faculty/Analytics'));
const GradeBook         = lazy(() => import('./pages/faculty/GradeBook'));
const RecentSubmissions  = lazy(() => import('./pages/faculty/RecentSubmissions'));
const FacultyAnnouncements = lazy(() => import('./pages/faculty/FacultyAnnouncements'));
const FacultyGroups        = lazy(() => import('./pages/faculty/FacultyGroups'));

// Admin
const AdminDashboard    = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers        = lazy(() => import('./pages/admin/Users'));
const AdminGroups       = lazy(() => import('./pages/admin/Groups'));
const AdminQuizzes      = lazy(() => import('./pages/admin/Quizzes'));
const AdminAnnounce     = lazy(() => import('./pages/admin/Announce'));
const AdminSettings     = lazy(() => import('./pages/admin/Settings'));
const AdminAuditLogs    = lazy(() => import('./pages/admin/AuditLogs'));
const AdminPreferences  = lazy(() => import('./pages/admin/Preferences'));

const Loader = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'var(--bg-base)'}}>
    <div className="spinner"/>
  </div>
);

const ProtectedRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (!user.emailVerified) return <Navigate to="/verify-otp" replace/>;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={
      user.role==='admin' ? '/admin/dashboard' :
      user.role==='faculty' ? '/faculty/dashboard' : '/student/dashboard'
    } replace/>;
  }
  return children;
};

const PremiumRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader/>;
  if (!user) return <Navigate to="/login" replace/>;
  if (user.role === 'student' && !user.isPro) {
    return <Navigate to="/student/dashboard" replace/>;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={
      user.role==='admin' ? '/admin/dashboard' :
      user.role==='faculty' ? '/faculty/dashboard' : '/student/dashboard'
    } replace/>;
  }
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader/>;
  if (user?.emailVerified) return <Navigate to={
    user.role==='admin' ? '/admin/dashboard' :
    user.role==='faculty' ? '/faculty/dashboard' : '/student/dashboard'
  } replace/>;
  return children;
};

const OtpRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <Loader/>;
  if (!user && !location.state?.email) return <Navigate to="/login" replace/>;
  if (user?.emailVerified) return <Navigate to={
    user.role==='admin' ? '/admin/dashboard' :
    user.role==='faculty' ? '/faculty/dashboard' : '/student/dashboard'
  } replace/>;
  return children;
};

export default function App() {
  useEffect(() => {
    api.get('/settings/branding')
      .then(r => {
        if (r.data.data) {
          const { primaryColor, secondaryColor, logoUrl, institutionName } = r.data.data;
          if (primaryColor) {
            document.documentElement.style.setProperty('--primary', primaryColor);
          }
          if (secondaryColor) {
            document.documentElement.style.setProperty('--primary-dark', secondaryColor);
          }
          localStorage.setItem('branding_logo', logoUrl || '');
          localStorage.setItem('branding_name', institutionName || '');
        }
      })
      .catch(console.error);
  }, []);

  return (
    <AuthProvider>
      <PreferencesProvider>
        <DialogProvider>
          <Router>
            <Toaster position="top-right" toastOptions={{
              duration: 3500,
              style: {
                background: '#0d1117',
                color: '#f8fafc',
                border: '1px solid #21293d',
                borderRadius: '12px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '0.875rem'
              },
              success: { iconTheme: { primary: '#8b5cf6', secondary: '#fff' } },
              error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}/>
            <Suspense fallback={<Loader/>}>
              <Routes>
                {/* Public */}
                <Route path="/"                 element={<PublicRoute><Landing/></PublicRoute>}/>
                <Route path="/login"            element={<PublicRoute><Login/></PublicRoute>}/>
                <Route path="/register"         element={<PublicRoute><Register/></PublicRoute>}/>
                <Route path="/verify-otp"       element={<OtpRoute><OtpVerify/></OtpRoute>}/>
                <Route path="/forgot-password"  element={<PublicRoute><ForgotPwd/></PublicRoute>}/>
                <Route path="/reset-password/:token"   element={<PublicRoute><ResetPwd/></PublicRoute>}/>
                <Route path="/verify-certificate/:certId" element={<CertVerify/>}/>

                {/* Shared Protected */}
                <Route path="/preferences"      element={<ProtectedRoute><Preferences/></ProtectedRoute>}/>
                <Route path="/plans"            element={<ProtectedRoute><Plans/></ProtectedRoute>}/>

                {/* Student */}
                <Route path="/student/dashboard"   element={<ProtectedRoute roles={['student']}><StudentDashboard/></ProtectedRoute>}/>
                <Route path="/student/quizzes"     element={<ProtectedRoute roles={['student']}><StudentQuizzes/></ProtectedRoute>}/>
                <Route path="/student/quiz/:id"    element={<ProtectedRoute roles={['student']}><TakeQuiz/></ProtectedRoute>}/>
                <Route path="/student/result/:id"  element={<ProtectedRoute roles={['student']}><QuizResult/></ProtectedRoute>}/>
                <Route path="/student/history"     element={<ProtectedRoute roles={['student']}><StudentHistory/></ProtectedRoute>}/>
                <Route path="/student/profile"     element={<ProtectedRoute roles={['student']}><StudentProfile/></ProtectedRoute>}/>
                <Route path="/student/analytics"   element={<ProtectedRoute roles={['student']}><StudentAnalytics/></ProtectedRoute>}/>
                <Route path="/student/leaderboard" element={<ProtectedRoute roles={['student']}><Leaderboard/></ProtectedRoute>}/>
                <Route path="/student/certificates" element={<ProtectedRoute roles={['student']}><StudentCerts/></ProtectedRoute>}/>
                <Route path="/student/bookmarks"   element={<PremiumRoute roles={['student']}><Bookmarks/></PremiumRoute>}/>
                <Route path="/student/notes"       element={<PremiumRoute roles={['student']}><StudyNotes/></PremiumRoute>}/>
                <Route path="/student/heatmap"     element={<ProtectedRoute roles={['student']}><Heatmap/></ProtectedRoute>}/>
                <Route path="/student/announcements" element={<ProtectedRoute roles={['student']}><StudentAnnouncements/></ProtectedRoute>}/>
                <Route path="/student/groups"       element={<ProtectedRoute roles={['student']}><StudentGroups/></ProtectedRoute>}/>
                <Route path="/student/ai-coach"     element={<PremiumRoute roles={['student']}><AICoach/></PremiumRoute>}/>

                {/* Faculty */}
                <Route path="/faculty/dashboard"    element={<ProtectedRoute roles={['faculty']}><FacultyDashboard/></ProtectedRoute>}/>
                <Route path="/faculty/quizzes"      element={<ProtectedRoute roles={['faculty']}><ManageQuizzes/></ProtectedRoute>}/>
                <Route path="/faculty/quiz/create"  element={<ProtectedRoute roles={['faculty']}><CreateQuiz/></ProtectedRoute>}/>
                <Route path="/faculty/quiz/:id/edit"    element={<ProtectedRoute roles={['faculty']}><EditQuiz/></ProtectedRoute>}/>
                <Route path="/faculty/quiz/:id/results" element={<ProtectedRoute roles={['faculty','admin']}><QuizResults/></ProtectedRoute>}/>
                <Route path="/faculty/analytics"        element={<ProtectedRoute roles={['faculty']}><FacultyAnalytics/></ProtectedRoute>}/>
                <Route path="/faculty/profile"          element={<ProtectedRoute roles={['faculty']}><FacultyProfile/></ProtectedRoute>}/>
                <Route path="/faculty/submissions"      element={<ProtectedRoute roles={['faculty']}><RecentSubmissions/></ProtectedRoute>}/>
                <Route path="/faculty/gradebook"        element={<ProtectedRoute roles={['faculty']}><GradeBook/></ProtectedRoute>}/>
                <Route path="/faculty/announcements" element={<ProtectedRoute roles={['faculty']}><FacultyAnnouncements/></ProtectedRoute>}/>
                <Route path="/faculty/groups"        element={<ProtectedRoute roles={['faculty']}><FacultyGroups/></ProtectedRoute>}/>

                {/* Admin */}
                <Route path="/admin/dashboard"  element={<ProtectedRoute roles={['admin']}><AdminDashboard/></ProtectedRoute>}/>
                <Route path="/admin/users"      element={<ProtectedRoute roles={['admin']}><AdminUsers/></ProtectedRoute>}/>
                <Route path="/admin/groups"     element={<ProtectedRoute roles={['admin']}><AdminGroups/></ProtectedRoute>}/>
                <Route path="/admin/quizzes"    element={<ProtectedRoute roles={['admin']}><AdminQuizzes/></ProtectedRoute>}/>
                <Route path="/admin/quiz/:id/results" element={<ProtectedRoute roles={['admin']}><QuizResults/></ProtectedRoute>}/>
                <Route path="/admin/announce"   element={<ProtectedRoute roles={['admin']}><AdminAnnounce/></ProtectedRoute>}/>
                <Route path="/admin/settings"   element={<ProtectedRoute roles={['admin']}><AdminSettings/></ProtectedRoute>}/>
                <Route path="/admin/audit-logs" element={<ProtectedRoute roles={['admin']}><AdminAuditLogs/></ProtectedRoute>}/>
                <Route path="/admin/preferences" element={<ProtectedRoute roles={['admin']}><AdminPreferences/></ProtectedRoute>}/>

                <Route path="*" element={<Navigate to="/" replace/>}/>
              </Routes>
            </Suspense>
          </Router>
        </DialogProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
