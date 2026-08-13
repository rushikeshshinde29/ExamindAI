import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { BsPlusCircle, BsArrowRight, BsPeople, BsBook, BsBarChart, BsCheckCircle, BsList } from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format } from 'date-fns';
import styles from './FacultyDashboard.module.css';

export default function FacultyDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/faculty').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  const stats = [
    { label:'Total Quizzes',    value:data?.totalQuizzes||0,    icon:BsPatchQuestion,      grad:'linear-gradient(135deg,#2563eb,#0ea5e9)' },
    { label:'Published',        value:data?.publishedQuizzes||0, icon:BsCheckCircle,grad:'linear-gradient(135deg,#059669,#34d399)' },
    { label:'Total Questions',  value:data?.totalQuestions||0,   icon:BsBook,      grad:'linear-gradient(135deg,#7c3aed,#a78bfa)' },
    { label:'Total Students',   value:data?.totalStudents||0,    icon:BsPeople,     grad:'linear-gradient(135deg,#d97706,#fbbf24)' },
    { label:'Total Attempts',   value:data?.totalAttempts||0,    icon:BsBarChart, grad:'linear-gradient(135deg,#dc2626,#f87171)' },
    { label:'Pass Rate',        value:`${data?.passRate||0}%`,   icon:BsCheckCircle,grad:'linear-gradient(135deg,#0891b2,#22d3ee)' },
  ];

  const chartData = (data?.topQuizzes||[]).map(q => ({
    name: q.title?.length>15 ? q.title.slice(0,15)+'…' : q.title,
    Attempts: q.attemptCount||0,
    AvgScore: parseFloat(q.averageScore||0).toFixed(1)
  }));

  return (
    <Layout>
      <div className={styles.page}>
        {/* Hero */}
        <div className={styles.hero}>
          <div className={styles.heroLeft}>
            <h1>Welcome, <span>{user?.name?.split(' ')[0]}</span>! 👨‍🏫</h1>
            <p>Here's an overview of your quizzes and student performance.</p>
          </div>
          <div className={styles.heroActions}>
            <Link to="/faculty/quiz/create" className={styles.heroBtn}><BsPlusCircle size={16}/> Create Quiz</Link>
            <Link to="/faculty/quizzes" className={styles.heroBtn2}><BsList size={16}/> My Quizzes</Link>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          {stats.map(s => (
            <div key={s.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{background:s.grad}}><s.icon size={19} color="white"/></div>
              <div className={styles.statVal}>{s.value}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          {/* Recent Submissions */}
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h2><BsPeople size={15}/> Recent Submissions</h2>
              <Link to="/faculty/submissions" className={styles.seeAll}>View All <BsArrowRight size={13}/></Link>
            </div>
            {!data?.recentAttempts?.length ? (
              <div className={styles.empty}><p>No submissions yet. Publish a quiz to get started!</p></div>
            ) : (
              <div className={styles.actList}>
                {data.recentAttempts.slice(0, 4).map((a, i) => (
                  <div key={a.id || i} className={styles.actRow}>
                    <div className={styles.actAvatar}>{a.student?.name?.charAt(0)}</div>
                    <div className={styles.actInfo}>
                      <div className={styles.actName}>{a.student?.name}</div>
                      <div className={styles.actQuiz}>{a.quiz?.title}</div>
                    </div>
                    <div className={styles.actRight}>
                      <span className={`${styles.scorePill} ${a.isPassed?styles.pillPass:styles.pillFail}`}>{a.percentage?.toFixed(0)}%</span>
                      <span className={styles.actDate}>{format(new Date(a.createdAt),'MMM d')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chart */}
          <div className={styles.card}>
            <div className={styles.cardHead}><h2><BsBarChart size={15}/> Quiz Performance</h2></div>
            {chartData.length === 0 ? (
              <div className={styles.empty}><p>Create and publish quizzes to see analytics here.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={230}>
                <BarChart data={chartData} margin={{top:4,right:4,left:-24,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="name" tick={{fontSize:10}}/>
                  <YAxis tick={{fontSize:10}}/>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px',border:'1px solid #e2e8f0'}}/>
                  <Bar dataKey="Attempts" fill="#2563eb" radius={[5,5,0,0]}/>
                  <Bar dataKey="AvgScore" fill="#0ea5e9" radius={[5,5,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top quizzes quick list */}
        {data?.topQuizzes?.length > 0 && (
          <div className={styles.card}>
            <div className={styles.cardHead}><h2><BsPatchQuestion size={15}/> Top Quizzes by Attempts</h2><Link to="/faculty/quizzes" className={styles.seeAll}>View All <BsArrowRight size={13}/></Link></div>
            <div className={styles.quizList}>
              {data.topQuizzes.map((q,i) => (
                <div key={q.id || i} className={styles.quizRow}>
                  <span className={styles.qRank}>#{i+1}</span>
                  <div className={styles.qInfo}><strong>{q.title}</strong><span>{q.subject}</span></div>
                  <div className={styles.qStats}>
                    <span className={`${styles.pubBadge} ${q.isPublished?styles.pubOn:styles.pubOff}`}>{q.isPublished?'Published':'Draft'}</span>
                    <span className={styles.qAttempts}>{q.attemptCount||0} attempts</span>
                    <span className={styles.qAvg}>{parseFloat(q.averageScore||0).toFixed(0)}% avg</span>
                  </div>
                  <Link to={`/faculty/quiz/${q.id}/results`} className={styles.qLink}>Results <BsArrowRight size={13}/></Link>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
