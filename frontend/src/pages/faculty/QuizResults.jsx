import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { BsArrowLeft, BsDownload, BsSearch, BsFunnel, BsEnvelope, BsFileText, BsCheckCircle, BsXCircle, BsBarChart, BsTrophy, BsBullseye, BsCameraVideo } from 'react-icons/bs';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './QuizResults.module.css';
import { useAuth } from '../../context/AuthContext';

const PIE_COLORS = ['#10b981','#ef4444'];

export default function QuizResults() {
  const { user } = useAuth();
  const { id } = useParams();
  const [attempts, setAttempts] = useState([]);
  const [stats, setStats] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [includeReport, setIncludeReport] = useState(true);
  const [includeCertificate, setIncludeCertificate] = useState(true);
  const [sendingEmails, setSendingEmails] = useState(false);

  const [videoUrl, setVideoUrl] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingVideo, setLoadingVideo] = useState(false);
  const [fetchingVideoId, setFetchingVideoId] = useState(null);

  const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
  const [activeFeedback, setActiveFeedback] = useState(null);

  const handleOpenFeedbackModal = (rating, comment, studentName) => {
    setActiveFeedback({ rating, comment, studentName });
    setFeedbackModalOpen(true);
  };

  const fetchVideoAndOpenModal = async (attemptId) => {
    setLoadingVideo(true);
    setFetchingVideoId(attemptId);
    try {
      const response = await api.get(`/attempts/${attemptId}/video`);
      if (response.data && response.data.videoUrl) {
        setVideoUrl(response.data.videoUrl);
        setShowModal(true);
      } else {
        toast.error("No proctoring video available for this attempt.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to fetch proctoring video. Please try again.");
    } finally {
      setLoadingVideo(false);
      setFetchingVideoId(null);
    }
  };

  const handleSendEmails = async () => {
    setSendingEmails(true);
    try {
      await api.post(`/quizzes/${id}/email-results`, {
        includeReport,
        includeCertificate
      });
      toast.success("Results successfully emailed to students!");
      setIsEmailModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send emails. Please try again.");
    } finally {
      setSendingEmails(false);
    }
  };

  useEffect(() => {
    Promise.all([api.get(`/quizzes/${id}/results`), api.get(`/quizzes/${id}`)])
      .then(([rr, qr]) => { setAttempts(rr.data.data); setStats(rr.data.stats); setQuiz(qr.data.data); })
      .catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const exportCSV = () => {
    const rows = [
      ['#','Student Name','Email','Student ID','Department','Score','Percentage','Status','Time Taken','Date','Proctoring Video URL','Feedback Rating','Feedback Comment'],
      ...attempts.map((a,i) => [i+1, a.student?.name, a.student?.email, a.student?.studentId||'—', a.student?.department||'—',
        `${a.obtainedMarks}/${a.totalMarks}`, `${a.percentage?.toFixed(1)}%`, a.isPassed?'Passed':'Failed',
        a.timeTaken ? `${Math.floor(a.timeTaken/60)}m ${a.timeTaken%60}s` : '—',
        format(new Date(a.createdAt),'yyyy-MM-dd HH:mm'),
        a.proctoringVideoUrl || '—',
        a.rating ? `${a.rating} Star(s)` : '—', a.feedbackComment || '—'])
    ];
    const csv = rows.map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    const a = document.createElement('a'); a.href=url; a.download=`${quiz?.title||'results'}.csv`; a.click();
  };

  const filtered = attempts.filter(a => {
    const mf = filter==='all' || (filter==='passed'&&a.isPassed) || (filter==='failed'&&!a.isPassed);
    const ms = !search || a.student?.name?.toLowerCase().includes(search.toLowerCase()) || a.student?.email?.toLowerCase().includes(search.toLowerCase()) || a.student?.studentId?.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  const scoreDistribution = [
    {range:'0–20',count:attempts.filter(a=>a.percentage<=20).length},
    {range:'21–40',count:attempts.filter(a=>a.percentage>20&&a.percentage<=40).length},
    {range:'41–60',count:attempts.filter(a=>a.percentage>40&&a.percentage<=60).length},
    {range:'61–80',count:attempts.filter(a=>a.percentage>60&&a.percentage<=80).length},
    {range:'81–100',count:attempts.filter(a=>a.percentage>80).length},
  ];

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.topBar}>
          <Link to={user?.role === 'admin' ? '/admin/quizzes' : '/faculty/quizzes'} className={styles.back}><BsArrowLeft size={15}/> Quizzes</Link>
          <div className={styles.topCenter}><h1>{quiz?.title}</h1><p>{quiz?.subject} · {attempts.length} submissions</p></div>
          <button onClick={() => setIsEmailModalOpen(true)} className={styles.emailBtn}><BsEnvelope size={14}/> Send Results via Email</button>
          <button onClick={exportCSV} className={styles.exportBtn}><BsDownload size={14}/> Export CSV</button>
        </div>

        {/* KPIs */}
        <div className={styles.kpiRow}>
          {[
            { label: 'Submissions', val: stats?.totalAttempts || 0, icon: BsFileText, grad: 'linear-gradient(135deg,#2563eb,#0ea5e9)' },
            { label: 'Passed', val: stats?.passCount || 0, icon: BsCheckCircle, grad: 'linear-gradient(135deg,#059669,#34d399)' },
            { label: 'Failed', val: stats?.failCount || 0, icon: BsXCircle, grad: 'linear-gradient(135deg,#dc2626,#f87171)' },
            { label: 'Avg Score', val: `${stats?.averageScore || 0}%`, icon: BsBarChart, grad: 'linear-gradient(135deg,#7c3aed,#a78bfa)' },
            { label: 'Highest', val: `${stats?.highestScore || 0}%`, icon: BsTrophy, grad: 'linear-gradient(135deg,#d97706,#fbbf24)' },
            { label: 'Pass Rate', val: stats?.totalAttempts ? `${((stats.passCount / stats.totalAttempts) * 100).toFixed(0)}%` : '0%', icon: BsBullseye, grad: 'linear-gradient(135deg,#0891b2,#22d3ee)' }
          ].map(k => (
            <div key={k.label} className={styles.statCard}>
              <div className={styles.statIcon} style={{ background: k.grad }}>
                <k.icon size={19} color="white" />
              </div>
              <div className={styles.statVal}>{k.val}</div>
              <div className={styles.statLabel}>{k.label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {attempts.length > 0 && (
          <div className={styles.chartsRow}>
            <div className={styles.chartCard}>
              <h2>Score Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={scoreDistribution} margin={{top:4,right:4,left:-24,bottom:4}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                  <XAxis dataKey="range" tick={{fontSize:11}}/>
                  <YAxis tick={{fontSize:11}} allowDecimals={false}/>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                  <Bar dataKey="count" radius={[6,6,0,0]} name="Students">
                    {scoreDistribution.map((e,i) => <Cell key={i} fill={['#ef4444','#f97316','#f59e0b','#22c55e','#10b981'][i]}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className={styles.chartCard}>
              <h2>Pass / Fail Breakdown</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={[{name:'Passed',value:stats?.passCount||0},{name:'Failed',value:stats?.failCount||0}]}
                    cx="50%" cy="50%" innerRadius={52} outerRadius={80} dataKey="value"
                    label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {PIE_COLORS.map((c,i)=><Cell key={i} fill={c}/>)}
                  </Pie>
                  <Tooltip contentStyle={{borderRadius:'10px',fontSize:'12px'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Table */}
        <div className={styles.tableCard}>
          <div className={styles.tableHead}>
            <h2>Individual Results ({filtered.length})</h2>
            <div className={styles.tableControls}>
              <div className={styles.searchWrap}><BsSearch className={styles.si}/><input placeholder="Search name, email, ID..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
              <div className={styles.tabs}>
                {[['all','All'],['passed','Passed'],['failed','Failed']].map(([v,l])=>(
                  <button key={v} className={`${styles.tab} ${filter===v?styles.activeTab:''}`} onClick={()=>setFilter(v)}>{l}</button>
                ))}
              </div>
            </div>
          </div>
          {filtered.length === 0 ? <div className={styles.emptyTable}><p>No results match your filters.</p></div> : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                   <tr><th>#</th><th>Student</th><th>ID</th><th>Score</th><th>%</th><th>Status</th><th>Rank</th><th>Time</th><th>Date</th><th>Proctoring</th><th>Feedback</th></tr>
                </thead>
                <tbody>
                  {filtered.map((a,i)=>(
                    <tr key={a.id || a._id || i}>
                      <td className={styles.tdNum}>{i+1}</td>
                      <td>
                        <div className={styles.studentCell}>
                          <div className={styles.sAvatar}>{a.student?.name?.charAt(0)}</div>
                          <div><div className={styles.sName}>{a.student?.name}</div><div className={styles.sEmail}>{a.student?.email}</div></div>
                        </div>
                      </td>
                      <td className={styles.tdGray}>{a.student?.studentId||'—'}</td>
                      <td><strong>{a.obtainedMarks}/{a.totalMarks}</strong></td>
                      <td>
                        <div className={styles.scoreBar}>
                          <div className={styles.scoreBarFill} style={{width:`${a.percentage}%`,background:a.isPassed?'#10b981':'#ef4444'}}/>
                          <span>{a.percentage?.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td><span className={`${styles.statusBadge} ${a.isPassed?styles.sPass:styles.sFail}`}>{a.isPassed?'✅ Passed':'❌ Failed'}</span></td>
                      <td className={styles.tdGray}>{a.rank?`#${a.rank}`:'—'}</td>
                      <td className={styles.tdGray}>{a.timeTaken?`${Math.floor(a.timeTaken/60)}m ${a.timeTaken%60}s`:'—'}</td>
                      <td className={styles.tdDate}>{format(new Date(a.createdAt),'MMM d, yy · h:mm a')}</td>
                       <td>
                         {a.proctoringVideoUrl ? (
                           <button 
                             className={styles.watchVideoBtn} 
                             onClick={() => fetchVideoAndOpenModal(a.id || a._id)}
                             disabled={loadingVideo}
                           >
                             <BsCameraVideo size={13}/> {fetchingVideoId === (a.id || a._id) ? 'Loading...' : 'View Video'}
                           </button>
                         ) : (
                           <span className={styles.tdGray}>N/A</span>
                         )}
                       </td>
                       <td>
                        {a.rating || a.feedbackComment ? (
                          <button 
                            className={styles.feedbackBtn} 
                            onClick={() => handleOpenFeedbackModal(a.rating, a.feedbackComment, a.student?.name)}
                          >
                            💬 View Feedback
                          </button>
                        ) : (
                          <span className={styles.tdGray}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {isEmailModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsEmailModalOpen(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Send Quiz Results & Certificates</h2>
            <p className={styles.modalText}>
              Are you sure you want to send quiz scores, performance reports, and certificates via email to all participating students?
            </p>
            
            <div className={styles.recipientBadge}>
              Recipients: {(() => {
                const count = new Set(attempts.map(a => a.student?.email || a.student?.id).filter(Boolean)).size;
                return `${count} ${count === 1 ? 'Student' : 'Students'}`;
              })()}
            </div>
            
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={includeReport} 
                  onChange={e => setIncludeReport(e.target.checked)} 
                />
                Include Performance Report (PDF)
              </label>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={includeCertificate} 
                  onChange={e => setIncludeCertificate(e.target.checked)} 
                />
                Include Certificate of Completion for passing students (PDF)
              </label>
            </div>

            <div className={styles.modalActions}>
              <button 
                onClick={() => setIsEmailModalOpen(false)} 
                className={styles.cancelBtn}
                disabled={sendingEmails}
              >
                Cancel
              </button>
              <button 
                onClick={handleSendEmails} 
                className={styles.confirmBtn}
                disabled={sendingEmails}
              >
                {sendingEmails ? (
                  <>
                    <div className="spinner-sm" style={{ marginRight: '6px', borderTopColor: '#fff', borderLeftColor: 'rgba(255,255,255,0.3)', borderRightColor: 'rgba(255,255,255,0.3)', borderBottomColor: 'rgba(255,255,255,0.3)' }} />
                    Sending...
                  </>
                ) : (
                  'Confirm & Send Email'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && videoUrl && (
        <div className={styles.modalOverlay} onClick={() => { setShowModal(false); setVideoUrl(null); }}>
          <div className={styles.videoModalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>📹 Proctoring Video</h2>
            <p className={styles.modalText}>Reviewing student screen and camera recording feed.</p>
            <div className={styles.videoPlayerContainer}>
              <video 
                src={videoUrl} 
                controls 
                autoPlay 
                style={{ width: '100%', height: '100%' }}
              />
            </div>
            <div className={styles.modalActions}>
              <button 
                onClick={() => { setShowModal(false); setVideoUrl(null); }} 
                className={styles.cancelBtn}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackModalOpen && activeFeedback && (
        <div className={styles.modalOverlay} onClick={() => { setFeedbackModalOpen(false); setActiveFeedback(null); }}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              💬 Student Feedback
            </h2>
            <div style={{ borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px', marginBottom: '8px' }}>
              <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600 }}>
                Student
              </div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeFeedback.studentName}
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', margin: '8px 0' }}>
              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  Rating
                </div>
                {activeFeedback.rating ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#eab308', fontSize: '1.25rem' }}>
                      {'⭐'.repeat(activeFeedback.rating)}
                    </span>
                    <strong style={{ fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      ({activeFeedback.rating} / 5)
                    </strong>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No rating provided
                  </span>
                )}
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '4px' }}>
                  Comment / Review
                </div>
                {activeFeedback.comment ? (
                  <div style={{
                    padding: '12px 14px',
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '8px',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    "{activeFeedback.comment}"
                  </div>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No comments provided
                  </span>
                )}
              </div>
            </div>

            <div className={styles.modalActions} style={{ marginTop: '12px' }}>
              <button 
                onClick={() => { setFeedbackModalOpen(false); setActiveFeedback(null); }} 
                className={styles.cancelBtn}
                style={{ width: '100%', textAlign: 'center', justifyContent: 'center' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
