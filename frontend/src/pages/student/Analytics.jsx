import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Legend } from 'recharts';
import { BsGraphUp, BsBullseye, BsAward, BsBook, BsLightning } from 'react-icons/bs';
import styles from './Analytics.module.css';

export default function StudentAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/student/me').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;
  if (!data) return <Layout><div className={styles.center}><p>Could not load analytics.</p></div></Layout>;

  const radarData = (data.subjectStats||[]).slice(0,6).map(s => ({ subject:s.subject.length>12?s.subject.slice(0,12)+'…':s.subject, score:parseFloat(s.avgScore), passRate:parseFloat(s.passRate) }));

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}><h1>📊 My Analytics</h1><p>Your personal performance insights across all quizzes.</p></div>

        <div className={styles.kpiRow}>
          {[
            { label:'Total Attempts', value: data.totalAttempts, icon: BsBook, grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)', sub: 'Attempts taken' },
            { label:'Pass Rate',      value: `${data.passRate}%`, icon: BsAward, grad: 'linear-gradient(135deg,#d97706,#fbbf24)', sub: 'Completion rate' },
            { label:'Avg Score',      value: `${data.avgScore}%`, icon: BsGraphUp, grad: 'linear-gradient(135deg,#059669,#34d399)', sub: 'Overall performance' },
            { label:'XP Earned',      value: data.totalPoints, icon: BsLightning, grad: 'linear-gradient(135deg,#6366f1,#0ea5e9)', sub: 'Experience points' },
            { label:'Streak',         value: `${data.streak}d`, icon: BsBullseye, grad: 'linear-gradient(135deg,#ef4444,#f87171)', sub: 'Active days streak' },
          ].map(k => (
            <div key={k.label} className={styles.kpi}>
              <div className={styles.kpiIcon} style={{background:k.grad}}><k.icon size={20} color="white"/></div>
              <div className={styles.kpiBody}>
                <div className={styles.kpiVal}>{k.value}</div>
                <div className={styles.kpiLabel}>{k.label}</div>
                <div className={styles.kpiSub}>{k.sub}</div>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <h2><BsGraphUp size={16}/> Score Trend (Recent 10)</h2>
            {data.recentTrend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.recentTrend} margin={{top:8,right:8,left:-20,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="index" tick={{fontSize:11}} label={{value:'Attempt',position:'insideBottom',offset:-2,fontSize:11}}/>
                  <YAxis domain={[0,100]} tick={{fontSize:11}}/>
                  <Tooltip formatter={v=>`${v.toFixed(1)}%`} contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                  <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2.5} dot={{r:4,fill:'#2563eb'}} activeDot={{r:6}} name="Score %"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <div className={styles.noData}>Take more quizzes to see your trend!</div>}
          </div>

          <div className={styles.card}>
            <h2><BsBullseye size={16}/> Subject Performance</h2>
            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#e2e8f0"/>
                  <PolarAngleAxis dataKey="subject" tick={{fontSize:11}}/>
                  <Radar name="Avg Score" dataKey="score" stroke="#2563eb" fill="#2563eb" fillOpacity={0.2}/>
                  <Radar name="Pass Rate" dataKey="passRate" stroke="#10b981" fill="#10b981" fillOpacity={0.15}/>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                  <Legend/>
                </RadarChart>
              </ResponsiveContainer>
            ) : <div className={styles.noData}>No subject data yet.</div>}
          </div>
        </div>

        <div className={styles.card}>
          <h2><BsAward size={16}/> Subject Breakdown</h2>
          {data.subjectStats?.length > 0 ? (
            <div className={styles.subTable}>
              <div className={styles.subHead}><span>Subject</span><span>Attempts</span><span>Avg Score</span><span>Pass Rate</span><span>Performance</span></div>
              {data.subjectStats.map(s => (
                <div key={s.subject} className={styles.subRow}>
                  <span className={styles.subName}>{s.subject}</span>
                  <span className={styles.subVal}>{s.attempts}</span>
                  <span className={styles.subVal} style={{color: parseFloat(s.avgScore)>=60?'#10b981':'#ef4444', fontWeight:700}}>{s.avgScore}%</span>
                  <span className={styles.subVal}>{s.passRate}%</span>
                  <span>
                    <div className={styles.perfBar}><div className={styles.perfFill} style={{width:`${s.avgScore}%`, background: parseFloat(s.avgScore)>=60?'#10b981':'#ef4444'}}/></div>
                  </span>
                </div>
              ))}
            </div>
          ) : <div className={styles.noData}>Complete more quizzes to see subject breakdowns.</div>}
        </div>
      </div>
    </Layout>
  );
}
