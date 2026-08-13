import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePreferences } from '../context/PreferencesContext';
import {
  BsGrid, BsPerson, BsBoxArrowRight, BsList, BsX, BsPlusCircle,
  BsCardList, BsClockHistory, BsBell, BsBarChart, BsChevronRight,
  BsAward, BsTrophy, BsPatchQuestion, BsBookmark, BsJournalText,
  BsCalendar3, BsLightning, BsMap, BsGear, BsCreditCard,
  BsBook, BsClipboardData, BsPeople, BsPersonCheck, BsShield,
  BsMegaphone, BsFileText, BsFunnel, BsSearch, BsRobot
} from 'react-icons/bs';
import api from '../utils/api';
import styles from './Layout.module.css';

const studentNav = [
  { to:'/student/dashboard',    icon:BsGrid,          label:'Dashboard'       },
  { to:'/student/announcements', icon:BsMegaphone,     label:'Announcements'   },
  { to:'/student/quizzes',      icon:BsPatchQuestion, label:'Browse Quizzes'  },
  { to:'/student/history',      icon:BsClockHistory,  label:'My Results'      },
  { to:'/student/analytics',    icon:BsBarChart,      label:'Analytics'       },
  { to:'/student/heatmap',      icon:BsCalendar3,     label:'Activity Map'    },
  { to:'/student/bookmarks',    icon:BsBookmark,      label:'Bookmarks'       },
  { to:'/student/notes',        icon:BsJournalText,   label:'Study Notes'     },
  { to:'/student/ai-coach',     icon:BsRobot,         label:'Ai Coach'        },
  { to:'/student/groups',       icon:BsPeople,        label:'My Groups'       },
  { to:'/student/leaderboard',  icon:BsTrophy,        label:'Leaderboard'     },
  { to:'/student/certificates', icon:BsAward,         label:'Certificates'    },
  { to:'/student/profile',      icon:BsPerson,        label:'Profile'         },
];

const facultyNav = [
  { to:'/faculty/dashboard',    icon:BsGrid,          label:'Dashboard'       },
  { to:'/faculty/announcements', icon:BsMegaphone,     label:'Announcements'   },
  { to:'/faculty/groups',       icon:BsPeople,        label:'Groups'          },
  { to:'/faculty/quizzes',      icon:BsCardList,      label:'My Quizzes'      },
  { to:'/faculty/quiz/create',  icon:BsPlusCircle,    label:'Create Quiz'     },
  { to:'/faculty/submissions',  icon:BsClockHistory,  label:'Recent Submissions'},
  { to:'/faculty/gradebook',    icon:BsClipboardData, label:'Grade Book'      },
  { to:'/faculty/analytics',    icon:BsBarChart,      label:'Analytics'       },
  { to:'/faculty/profile',      icon:BsPerson,        label:'Profile'         },
];

const adminNav = [
  { to:'/admin/dashboard',  icon:BsGrid,          label:'Overview'        },
  { to:'/admin/users',      icon:BsPeople,        label:'Users'           },
  { to:'/admin/groups',     icon:BsFunnel,        label:'Groups'          },
  { to:'/admin/quizzes',    icon:BsPatchQuestion, label:'Quizzes'         },
  { to:'/admin/announce',   icon:BsMegaphone,     label:'Announcements'   },
  { to:'/admin/audit-logs', icon:BsShield,        label:'Audit Logs'      },
  { to:'/admin/settings',   icon:BsGear,          label:'Settings'        },
];

const ROLE_GRAD = {
  admin:   'linear-gradient(135deg,#4c1d95,#7c3aed)',
  faculty: 'linear-gradient(135deg,#3b0764,#6d28d9)',
  student: 'linear-gradient(135deg,#1e1b4b,#4c1d95)',
};
const ROLE_LABEL = { admin:'Admin', faculty:'Faculty', student:'Student' };

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { t } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const notifRef = useRef(null);
  const navSectionRef = useRef(null);

  useEffect(() => {
    const saved = sessionStorage.getItem('sidebar-scroll-top');
    if (saved && navSectionRef.current) {
      navSectionRef.current.scrollTop = parseInt(saved, 10);
    }
  }, []);

  const handleSidebarScroll = (e) => {
    sessionStorage.setItem('sidebar-scroll-top', e.target.scrollTop);
  };

  const [brandLogo, setBrandLogo] = useState(localStorage.getItem('branding_logo') || '');
  const [brandName, setBrandName] = useState(localStorage.getItem('branding_name') || 'ExamindAI');

  useEffect(() => {
    const handleStorage = () => {
      setBrandLogo(localStorage.getItem('branding_logo') || '');
      setBrandName(localStorage.getItem('branding_name') || 'ExamindAI');
    };
    window.addEventListener('storage', handleStorage);
    // Trigger local updates when components mount
    handleStorage();
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const rawNav = user?.role === 'admin' ? adminNav : user?.role === 'faculty' ? facultyNav : studentNav;
  const nav = rawNav.map(item => ({
    ...item,
    label: t(item.label.charAt(0).toLowerCase() + item.label.slice(1).replace(/\s+/g, ''))
  }));

  useEffect(() => {
    api.get('/notifications').then(r => {
      setNotifications(r.data.data || []);
      setUnread(r.data.unread || 0);
    }).catch(() => {});
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(n => n.map(x => ({ ...x, isRead: true })));
    setUnread(0);
  };

  const handleLogout = () => { logout(); navigate('/login'); };
  const levelPct = (user?.totalPoints || 0) % 100;

  const getNotifIcon = (type) => {
    const icons = { QUIZ_RESULT:'📊', BADGE_EARNED:'🏅', CERTIFICATE_ISSUED:'🎓', NEW_QUIZ:'📚', ANNOUNCEMENT:'📢', LEADERBOARD_UPDATE:'🏆', SYSTEM:'🔔' };
    return icons[type?.toUpperCase()] || '🔔';
  };

  const matchedNav = [...studentNav, ...facultyNav, ...adminNav].find(n =>
    location.pathname === n.to || location.pathname.startsWith(n.to + '/'));
  let currentLabel = matchedNav
    ? t(matchedNav.label.charAt(0).toLowerCase() + matchedNav.label.slice(1).replace(/\s+/g, ''))
    : 'ExamindAI';

  if (location.pathname.endsWith('/profile')) {
    currentLabel = t('profile') || 'Profile';
  }

  return (
    <div className={styles.layout}>
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : ''}`}>
        {/* Brand */}
        <div className={styles.brand}>
          <div className={styles.brandIcon}>
            <img src="/favicon.svg" alt="Examind AI Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <div>
            <div className={styles.brandText}>Examind AI</div>
            <div className={styles.brandSub}>SMART LEARNING PLATFORM</div>
          </div>
          <button className={styles.closeBtn} onClick={() => setSidebarOpen(false)}><BsX/></button>
        </div>

        {/* Institution Branding Card */}
        <div className={styles.userCard}>
          <div className={styles.userAvatar}>
            {brandLogo ? (
              <img src={brandLogo} alt="Institution Logo" className={styles.userLogoImg} />
            ) : (
              <BsShield size={22} className={styles.userShieldIcon} />
            )}
          </div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>{brandName}</div>
            <div className={styles.userRole}>OFFICIAL PORTAL</div>
          </div>
        </div>



        {/* Nav */}
        <div className={styles.navSection} ref={navSectionRef} onScroll={handleSidebarScroll}>
          {nav.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to || 
              (to !== '/' && location.pathname.startsWith(to + '/')) ||
              (to === '/admin/quizzes' && location.pathname.startsWith('/admin/quiz/')) ||
              (to === '/faculty/quizzes' && location.pathname.startsWith('/faculty/quiz/') && location.pathname !== '/faculty/quiz/create');
            const isPremium = ['/student/paths', '/student/notes', '/student/bookmarks', '/student/ai-coach'].includes(to);
            const isBlocked = isPremium && user?.role === 'student' && !user?.isPro;

            if (isBlocked) {
              return (
                <button key={to} onClick={() => { setShowUpgradeModal(true); setSidebarOpen(false); }}
                  className={styles.navItem} style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}>
                  <Icon size={16}/>
                  <span style={{ flexGrow: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {label} <span style={{ fontSize: '0.8rem', color: '#fbbf24' }} title="Premium Feature">👑</span>
                  </span>
                </button>
              );
            }
            return (
              <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}>
                <Icon size={16}/>
                <span>{label}</span>
                {isActive && <BsChevronRight className={styles.navArrow} size={11}/>}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className={styles.sideFooter}>
          <Link to={user?.role === 'admin' ? '/admin/preferences' : '/preferences'} 
            className={`${styles.navItem} ${location.pathname === (user?.role === 'admin' ? '/admin/preferences' : '/preferences') ? styles.active : ''}`} 
            onClick={() => setSidebarOpen(false)}>
            <BsGear size={16}/><span>{t('preferences')}</span>
            {location.pathname === (user?.role === 'admin' ? '/admin/preferences' : '/preferences') && <BsChevronRight className={styles.navArrow} size={11}/>}
          </Link>
          {user?.role === 'student' && (
            <Link to="/plans" 
              id="nav-plans"
              className={`${styles.navItem} ${location.pathname === '/plans' ? styles.active : ''}`} 
              onClick={() => setSidebarOpen(false)}>
              <BsCreditCard size={16}/><span>{t('upgradePlan')}</span>
              {location.pathname === '/plans' && <BsChevronRight className={styles.navArrow} size={11}/>}
            </Link>
          )}
          <button id="logout-btn" className={styles.logoutBtn} onClick={handleLogout}>
            <BsBoxArrowRight size={16}/> {t('signOut')}
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className={styles.overlay} onClick={() => setSidebarOpen(false)}/>}

      <div className={styles.main}>
        <header className={styles.header}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}><BsList size={20}/></button>
          <div className={styles.pageTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentLabel}
            {user?.role === 'admin' && (
              <span style={{
                fontSize: '0.72rem', fontWeight: 800, color: '#fbbf24',
                background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)',
                padding: '2px 8px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px',
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                <BsShield size={11}/> Admin
              </span>
            )}
          </div>

          <div className={styles.headerRight}>
            {user?.role === 'student' && (
              <div className={styles.headerStats}>
                <span>🔥 {user?.streak || 0}</span>
                <span>⭐ {user?.totalPoints || 0}</span>
              </div>
            )}

            {/* Notifications */}
            <div className={styles.notifWrap} ref={notifRef}>
              <button className={styles.notifBtn} onClick={() => { setNotifOpen(o => !o); if (unread) markAllRead(); }}>
                <BsBell size={17}/>
                {unread > 0 && <span className={styles.notifBadge}>{unread > 9 ? '9+' : unread}</span>}
              </button>
              {notifOpen && (
                <div className={styles.notifDropdown}>
                  <div className={styles.notifHeader}>
                    <span>Notifications</span>
                    <button onClick={() => setNotifOpen(false)} style={{background:'none',color:'var(--text-muted)',padding:'3px',cursor:'pointer'}}><BsX size={14}/></button>
                  </div>
                  {notifications.length === 0
                    ? <div className={styles.notifEmpty}>No notifications 🔔</div>
                    : <div className={styles.notifList}>
                        {notifications.slice(0, 8).map((n, i) => (
                          <div key={n.id || i} className={`${styles.notifItem} ${!n.isRead ? styles.notifUnread : ''}`}>
                            <span className={styles.notifIcon}>{getNotifIcon(n.type)}</span>
                            <div>
                              <div className={styles.notifTitle}>{n.type?.replace(/_/g, ' ')}</div>
                              <div className={styles.notifMsg}>{n.message}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                  <div className={styles.notifFooter}>
                    <Link to={user?.role === 'student' ? '/student/announcements' : '/faculty/announcements'} onClick={() => setNotifOpen(false)}>
                      View All Announcements
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Header User Profile Info */}
            <Link to={user?.role === 'admin' ? '/admin/preferences' : `/${user?.role}/profile`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                marginLeft: '6px',
                borderLeft: '1px solid var(--bg-border)',
                paddingLeft: '14px',
                color: 'inherit'
              }}
            >
              <div style={{ 
                background: ROLE_GRAD[user?.role],
                borderRadius: user?.isPro ? '50%' : '8px',
                border: user?.isPro ? '2px solid #fbbf24' : 'none',
                boxShadow: user?.isPro ? '0 0 8px #fbbf24' : 'none',
                width: '32px', height: '32px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '0.85rem', color: 'white', flexShrink: 0
              }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', lineHeight: 1.2 }}>
                  {user?.name}
                  {user?.isPro && <span style={{ color: '#fbbf24', fontSize: '0.8rem' }} title="Pro User">👑</span>}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginTop: '1px', fontWeight: 600 }}>
                  {ROLE_LABEL[user?.role] || user?.role}
                </div>
              </div>
            </Link>
          </div>
        </header>
        <main className={styles.content}>{children}</main>
      </div>

      {showUpgradeModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999
        }}>
          <div className="card" style={{
            maxWidth: '450px', width: '90%', padding: '32px', textAlign: 'center',
            border: '2px solid var(--primary)', boxShadow: 'var(--glow-purple)',
            position: 'relative'
          }}>
            <div style={{ fontSize: '4.5rem', marginBottom: '16px', animation: 'pulse 2s infinite', color: '#fbbf24' }}>👑</div>
            <h2 className="grad-text" style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '12px' }}>
              Upgrade to Pro Plan
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.5' }}>
              Unlock custom study notes, personal bookmarks, AI study coach, AI-powered diagnostic reports, and instant explanation analysis tools!
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button className="btn btn-ghost" onClick={() => setShowUpgradeModal(false)}>
                Maybe Later
              </button>
              <Link to="/plans" className="btn btn-primary" onClick={() => setShowUpgradeModal(false)}>
                Upgrade Now
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
