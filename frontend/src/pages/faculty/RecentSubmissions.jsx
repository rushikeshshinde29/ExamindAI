import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { format } from 'date-fns';
import { BsClockHistory, BsSearch, BsArrowLeft, BsArrowRight } from 'react-icons/bs';

export default function RecentSubmissions() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    api.get('/dashboard/faculty/recent-attempts')
      .then(r => {
        if (r.data.success) {
          setAttempts(r.data.data || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = attempts.filter(a => 
    a.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
    a.quiz?.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.student?.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BsClockHistory size={22} style={{ color: 'var(--primary)' }}/>
              Recent Submissions
            </h1>
            <p className="page-subtitle">Track real-time student quiz completion history</p>
          </div>
          
          <div style={{ position: 'relative', width: '280px' }}>
            <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14}/>
            <input 
              type="text" 
              placeholder="Search student or quiz..." 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-glass)',
                color: 'var(--text-main)',
                fontSize: '0.85rem'
              }}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}><div className="spinner"/></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--bg-border)' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📝</div>
            <h3 style={{ color: 'var(--text-main)', marginBottom: '8px' }}>No submissions found</h3>
            <p style={{ color: 'var(--text-muted)' }}>Students have not completed any matching quizzes yet.</p>
          </div>
        ) : (
          <div>
            <div className="card" style={{ padding: '0', overflow: 'hidden', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--bg-border)' }}>
              <div className="table-wrap" style={{ margin: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--bg-border)', background: 'rgba(255,255,255,0.02)' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Student</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Quiz</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Percentage</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Score</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Submitted</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((a, idx) => (
                      <tr key={a.id || idx} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '50%',
                              background: 'var(--primary-dark)', color: 'white',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                            }}>
                              {a.student?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{a.student?.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.student?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>{a.quiz?.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.quiz?.subject || 'General'}</div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700,
                            background: a.isPassed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                            color: a.isPassed ? '#10b981' : '#ef4444',
                            border: a.isPassed ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(239,68,68,0.2)'
                          }}>
                            {a.percentage?.toFixed(0)}%
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--text-main)', fontSize: '0.875rem' }}>
                          {a.obtainedMarks !== undefined ? `${a.obtainedMarks} / ${a.totalMarks}` : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700,
                            color: a.isPassed ? 'var(--success)' : 'var(--danger)'
                          }}>
                            {a.isPassed ? 'PASSED' : 'FAILED'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                          {a.createdAt ? format(new Date(a.createdAt), 'MMM d, yyyy h:mm a') : '—'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                          <Link to={`/faculty/quiz/${a.quiz?.id || ''}/results`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                            View Quiz
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '20px' }}>
                <button 
                  className="btn btn-outline" 
                  disabled={page === 1} 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  <BsArrowLeft size={14}/> Previous
                </button>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Page {page} of {totalPages}
                </span>
                <button 
                  className="btn btn-outline" 
                  disabled={page === totalPages} 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
                >
                  Next <BsArrowRight size={14}/>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
