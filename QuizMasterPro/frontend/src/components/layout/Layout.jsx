import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FiHome, FiBookOpen, FiBarChart2, FiAward, FiUser, FiLogOut, FiUsers, FiPlusCircle, FiGrid, FiMenu, FiX } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const STUDENT_NAV = [
  { section: 'Main', items: [
    { to: '/student', icon: FiHome, label: 'Dashboard' },
    { to: '/student/quizzes', icon: FiBookOpen, label: 'Browse Quizzes' },
    { to: '/student/my-attempts', icon: FiBarChart2, label: 'My Attempts' },
    { to: '/student/analytics', icon: FiGrid, label: 'Analytics' },
    { to: '/student/certificates', icon: FiAward, label: 'Certificates' },
  ]},
  { section: 'Account', items: [
    { to: '/student/profile', icon: FiUser, label: 'My Profile' },
  ]}
];

const FACULTY_NAV = [
  { section: 'Main', items: [
    { to: '/faculty', icon: FiHome, label: 'Dashboard' },
    { to: '/faculty/quizzes', icon: FiBookOpen, label: 'My Quizzes' },
    { to: '/faculty/create-quiz', icon: FiPlusCircle, label: 'Create Quiz' },
    { to: '/faculty/analytics', icon: FiBarChart2, label: 'Analytics' },
  ]},
  { section: 'Account', items: [
    { to: '/faculty/profile', icon: FiUser, label: 'Profile' },
  ]}
];

const ADMIN_NAV = [
  { section: 'Overview', items: [
    { to: '/admin', icon: FiHome, label: 'Dashboard' },
    { to: '/admin/quizzes', icon: FiBookOpen, label: 'All Quizzes' },
  ]},
  { section: 'Users', items: [
    { to: '/admin/students', icon: FiUsers, label: 'Students' },
    { to: '/admin/faculty', icon: FiUsers, label: 'Faculty' },
    { to: '/admin/add-user', icon: FiPlusCircle, label: 'Add User' },
  ]},
];

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user, logout, isStudent, isFaculty } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navGroups = isStudent ? STUDENT_NAV : isFaculty ? FACULTY_NAV : ADMIN_NAV;
  const roleColor = isStudent ? 'role-student' : isFaculty ? 'role-faculty' : 'role-admin';
  const roleLabel = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-brand">
        <h4>Quiz<span>Master</span> Pro</h4>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="avatar">{user?.name?.charAt(0)}</div>
          <div>
            <div style={{ color: '#fff', fontWeight: 600, fontSize: '.85rem', lineHeight: 1.3 }}>{user?.name}</div>
            <span className={`role-pill ${roleColor}`} style={{ marginTop: 3 }}>{roleLabel}</span>
          </div>
        </div>
      </div>

      <div className="sidebar-menu">
        {navGroups.map(group => (
          <div key={group.section}>
            <div className="sidebar-section">
              <div className="sidebar-section-label">{group.section}</div>
            </div>
            {group.items.map(item => {
              const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to) && item.to.split('/').length > 2);
              return (
                <Link key={item.to} to={item.to} className={`sidebar-item ${active ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}>
                  <item.icon className="icon" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 'auto', position: 'absolute', bottom: 0, left: 0, right: 0 }}>
        <button onClick={handleLogout} className="sidebar-item" style={{ width: '100%', border: 'none', background: 'none', color: 'rgba(255,100,100,.8)' }}>
          <FiLogOut className="icon" /> Logout
        </button>
      </div>
    </div>
  );
};

export const Topbar = ({ sidebarOpen, setSidebarOpen, title }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)', fontSize: '1.2rem', padding: 4, display: 'flex' }}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <h5 style={{ margin: 0, fontWeight: 700, color: 'var(--dark)', fontSize: '1.05rem' }}>{title}</h5>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Avatar */}
        <div className="avatar" style={{ cursor: 'pointer' }} onClick={() => navigate(`/${user?.role}/profile`)}>
          {user?.name?.charAt(0)}
        </div>
      </div>
    </div>
  );
};

export const AppLayout = ({ children, title = 'QuizMaster Pro' }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="main-content">
        <Topbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title={title} />
        <div className="page-content">{children}</div>
      </div>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 99 }} />
      )}
    </div>
  );
};
