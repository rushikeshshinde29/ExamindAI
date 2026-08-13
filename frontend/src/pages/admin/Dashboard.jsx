import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AdminLayout from './Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { BsPeople, BsBook, BsBarChart, BsCheckCircle, BsArrowRight, BsPersonCheck, BsLayers } from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AdminDashboard.module.css';

export default function AdminDashboard() {
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = usePreferences();

  useEffect(() => {
    api.get('/admin/stats').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <AdminLayout><div className={styles.center}><div className="spinner"/></div></AdminLayout>;

  const stats = [
    { label: t('totalStudents'), value: data?.totalStudents||0,  icon: BsPeople,     grad:'linear-gradient(135deg,#2563eb,#0ea5e9)', link:'/admin/users?role=student' },
    { label: t('totalFaculty'),  value: data?.totalFaculty||0,   icon: BsPersonCheck, grad:'linear-gradient(135deg,#7c3aed,#a78bfa)', link:'/admin/users?role=faculty' },
    { label: t('totalQuizzes'),  value: data?.totalQuizzes||0,   icon: BsPatchQuestion,      grad:'linear-gradient(135deg,#059669,#34d399)', link:'/admin/quizzes'           },
    { label: t('totalAttempts'), value: data?.totalAttempts||0,  icon: BsBarChart, grad:'linear-gradient(135deg,#d97706,#fbbf24)', link:'/admin/quizzes'           },
    { label: t('published'),      value: data?.publishedQuizzes||0,icon:BsBook,      grad:'linear-gradient(135deg,#dc2626,#f87171)', link:'/admin/quizzes?published=true' },
    { label: t('passRate'),      value: `${data?.passRate||0}%`, icon: BsCheckCircle,grad:'linear-gradient(135deg,#0891b2,#22d3ee)',link:'/admin/quizzes'           },
  ];

  const quickLinks = [
    { to:'/admin/users',    icon:'👤', label: t('addNewUser'),        desc: t('addNewUserDesc') || 'Create student, faculty or admin account' },
    { to:'/admin/groups',   icon:'👥', label: t('manageGroups'),       desc: t('manageGroupsDesc') || 'Create groups and assign students' },
    { to:'/admin/announce', icon:'📢', label: t('sendAnnouncement'),   desc: t('sendAnnouncementDesc') || 'Broadcast message to all users' },
    { to:'/admin/settings', icon:'⚙️', label: t('instituteSettings'),  desc: t('instituteSettingsDesc') || 'Update institute name and branding' },
  ];

  return (
    <AdminLayout>
      <div className={styles.page}>
        {/* Hero */}
        <div className={styles.hero}>
          <div>
            <div className={styles.heroBadge}>👑 {t('adminControlCenter') || 'Admin Control Center'}</div>
            <h1>{t('platformOverview')}</h1>
            <p>{t('platformOverviewSub')}</p>
          </div>
          <div className={styles.heroActions}>
            <Link to="/admin/users" className={styles.heroBtn}><BsPeople size={14}/> {t('manageUsers')}</Link>
            <Link to="/admin/groups" className={styles.heroBtn2}><BsLayers size={14}/> {t('manageGroups')}</Link>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map(s => (
            <Link to={s.link} key={s.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{background:s.grad}}><s.icon size={20} color="white"/></div>
              <div className={styles.statVal}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
              <BsArrowRight size={13} className={styles.statArrow}/>
            </Link>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Weekly chart */}
          <div className={styles.card}>
            <h2>📈 {t('weeklyAttempts')}</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data?.weeklyAttempts||[]} margin={{top:4,right:8,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="_id" tick={{fontSize:11}} tickFormatter={v => v?.slice(5)}/>
                <YAxis tick={{fontSize:11}}/>
                <Tooltip contentStyle={{borderRadius:10,fontSize:12}}/>
                <Bar dataKey="count" fill="url(#ag)" radius={[4,4,0,0]}/>
                <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#2563eb"/><stop offset="100%" stopColor="#0ea5e9"/></linearGradient></defs>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Recent attempts */}
          <div className={styles.card}>
            <div className={styles.cardHead}><h2>🕐 {t('recentAttempts')}</h2><Link to="/admin/quizzes" className={styles.seeAll}>{t('seeAll')} <BsArrowRight size={12}/></Link></div>
            <div className={styles.list}>
              {(data?.recentAttempts||[]).slice(0, 4).map(a => (
                <div key={a.id} className={styles.listRow}>
                  <div className={styles.listAv}>{a.student?.name?.charAt(0)}</div>
                  <div className={styles.listInfo}>
                    <div className={styles.listName}>{a.student?.name || 'Unknown'}</div>
                    <div className={styles.listSub}>{a.quiz?.title || 'Quiz'} · {a.quiz?.subject}</div>
                  </div>
                  <span className={`${styles.scoreBadge} ${a.isPassed ? styles.pass : styles.fail}`}>
                    {Math.round(a.percentage||0)}%
                  </span>
                </div>
              ))}
              {!data?.recentAttempts?.length && <p className={styles.empty}>No attempts yet</p>}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className={styles.quickLinks}>
          {quickLinks.map(q => (
            <Link to={q.to} key={q.to} className={styles.quickCard}>
              <span className={styles.quickIcon}>{q.icon}</span>
              <div>
                <div className={styles.quickLabel}>{q.label}</div>
                <div className={styles.quickDesc}>{q.desc}</div>
              </div>
              <BsArrowRight size={14} className={styles.quickArrow}/>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
