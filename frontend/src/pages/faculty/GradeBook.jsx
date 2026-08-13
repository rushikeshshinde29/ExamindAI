import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function GradeBook() {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const load = () => {
    api.get('/gradebook/faculty').then(r => setData(r.data.data||{})).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const sync = async () => {
    setSyncing(true);
    try {
      const r = await api.post('/gradebook/sync');
      toast.success(r.data.message);
      load();
    } catch { toast.error('Sync failed'); }
    finally { setSyncing(false); }
  };

  const gradeColor = (g) => ({
    'A+':'var(--success)','A':'var(--success)','B':'var(--info)',
    'C':'var(--warning)','D':'var(--accent)','F':'var(--danger)'
  }[g] || 'var(--text-muted)');

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📊 Grade Book</h1>
            <p className="page-subtitle">All student grades across your quizzes</p>
          </div>
          <button className="btn btn-primary" onClick={sync} disabled={syncing}>
            {syncing ? '⏳ Syncing...' : '🔄 Sync Grades'}
          </button>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div className="spinner"/></div>
        ) : Object.keys(data).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No grade data yet</h3>
            <p>Click "Sync Grades" to calculate grades from attempt history</p>
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'24px'}}>
            {Object.entries(data).map(([quizTitle, entries]) => (
              <div key={quizTitle} className="card">
                <h3 style={{marginBottom:'16px',fontSize:'1rem',color:'var(--primary)'}}>{quizTitle}</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Student</th><th>Email</th><th>Department</th>
                        <th>Best Score</th><th>Grade</th><th>Attempts</th><th>Last Attempt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.map((e,i) => (
                        <tr key={i}>
                          <td style={{fontWeight:600}}>{e.studentName}</td>
                          <td style={{color:'var(--text-muted)',fontSize:'0.82rem'}}>{e.studentEmail}</td>
                          <td><span className="badge badge-gray">{e.department||'—'}</span></td>
                          <td style={{fontWeight:700,color:'var(--primary)'}}>{e.bestScore}%</td>
                          <td><span style={{fontWeight:800,color:gradeColor(e.grade),fontSize:'1.1rem'}}>{e.grade}</span></td>
                          <td style={{color:'var(--text-secondary)'}}>{e.attempts}</td>
                          <td style={{color:'var(--text-muted)',fontSize:'0.8rem'}}>{e.lastAttempt ? new Date(e.lastAttempt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
