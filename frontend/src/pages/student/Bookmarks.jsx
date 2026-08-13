import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function Bookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeExplanations, setActiveExplanations] = useState({});

  const handleFetchAIExplanation = async (idx, questionText, correctOption, options) => {
    if (activeExplanations[idx]) {
      setActiveExplanations(prev => ({ ...prev, [idx]: null }));
      return;
    }
    try {
      toast.loading('AI is generating explanation...', { id: `ai-exp-${idx}` });
      const r = await api.post('/ai/explain', {
        questionText,
        selectedOption: null,
        correctOption,
        options
      });
      setActiveExplanations(prev => ({ ...prev, [idx]: r.data.explanation }));
      toast.success('Explanation generated!', { id: `ai-exp-${idx}` });
    } catch {
      toast.error('Could not generate AI explanation', { id: `ai-exp-${idx}` });
    }
  };

  useEffect(() => {
    api.get('/bookmarks').then(r => {
      setBookmarks(r.data.data || []);
    }).catch(() => toast.error('Failed to load bookmarks'))
    .finally(() => setLoading(false));
  }, []);

  const remove = async (questionId) => {
    await api.delete(`/bookmarks/${questionId}`).catch(() => {});
    setBookmarks(b => b.filter(x => x.question?.id !== questionId));
    toast.success('Bookmark removed');
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">🔖 My Bookmarks</h1>
            <p className="page-subtitle">{bookmarks.length} questions saved for revision</p>
          </div>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px'}}>
            <div className="spinner"/>
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔖</div>
            <h3>No bookmarks yet</h3>
            <p>Bookmark questions during quizzes to review them later</p>
          </div>
        ) : (
          <div style={{display:'grid',gap:'16px'}}>
            {bookmarks.map((b, i) => {
              const q = b.question;
              return (
                <div key={b.id || i} className="card" style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '16px',
                  background: 'var(--bg-raised)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: '12px',
                  padding: '20px',
                  boxShadow: 'var(--shadow-sm)'
                }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                    fontSize: '0.95rem'
                  }}>{i + 1}</div>
                  
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '1rem', marginBottom: '12px', lineHeight: 1.5 }}>
                      {q?.text || 'Question text not available'}
                    </p>

                    {/* Options list */}
                    {q?.options && q.options.length > 0 && (
                      <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                        {q.options.map((opt, optIdx) => (
                          <div key={opt.id || optIdx} style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            border: opt.isCorrect ? '1.5px solid #059669' : '1px solid var(--bg-border)',
                            background: opt.isCorrect ? 'rgba(5, 150, 105, 0.08)' : 'rgba(255,255,255,0.02)',
                            color: opt.isCorrect ? '#34d399' : 'var(--text-secondary)',
                            fontSize: '0.88rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <strong style={{ opacity: 0.6 }}>{String.fromCharCode(65 + optIdx)}.</strong>
                            <span>{opt.text}</span>
                            {opt.isCorrect && (
                              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', fontWeight: 700, color: '#34d399', background: 'rgba(5, 150, 105, 0.2)', padding: '2px 8px', borderRadius: '4px' }}>
                                Correct Option
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* AI Explanation / Hint */}
                    {(q?.explanation || q?.hint || b.note) && (
                      <div style={{ display: 'grid', gap: '10px', marginBottom: '16px' }}>
                        {b.note && (
                          <div style={{
                            fontSize: '0.8rem', color: 'var(--text-muted)',
                            background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: '8px',
                            borderLeft: '3px solid var(--primary)'
                          }}>
                            📝 <strong>My Revision Note:</strong> {b.note}
                          </div>
                        )}
                        {q.explanation && (
                          <div style={{
                            fontSize: '0.85rem', color: 'var(--text-secondary)',
                            background: 'rgba(99, 102, 241, 0.05)', padding: '10px 14px', borderRadius: '8px',
                            borderLeft: '3.5px solid var(--primary)', lineHeight: 1.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.5px' }}>💡 AI EXPLANATION</div>
                            {q.explanation}
                          </div>
                        )}
                        {q.hint && (
                          <div style={{
                            fontSize: '0.85rem', color: 'var(--text-secondary)',
                            background: 'rgba(234, 179, 8, 0.05)', padding: '10px 14px', borderRadius: '8px',
                            borderLeft: '3.5px solid #eab308', lineHeight: 1.5
                          }}>
                            <div style={{ fontSize: '0.7rem', color: '#eab308', fontWeight: 800, marginBottom: '4px', letterSpacing: '0.5px' }}>🔑 HINT</div>
                            {q.hint}
                          </div>
                        )}
                      </div>
                    )}

                    {/* On-demand Dynamic AI Explanation */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12, marginBottom: 16 }}>
                      <button
                        onClick={() => handleFetchAIExplanation(i, q?.text, q?.options?.find(o => o.isCorrect)?.text || '', q?.options?.map(o => o.text))}
                        style={{
                          alignSelf: 'flex-start',
                          padding: '6px 14px',
                          fontSize: '0.75rem',
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          cursor: 'pointer',
                          background: 'rgba(99, 102, 241, 0.1)',
                          border: '1px solid rgba(99, 102, 241, 0.2)',
                          color: 'var(--primary)',
                          fontWeight: 700
                        }}
                      >
                        🤖 Dynamic AI Explanation
                      </button>
                      {activeExplanations[i] && (
                        <div style={{
                          background: 'rgba(168, 85, 247, 0.08)',
                          borderLeft: '3.5px solid #a855f7',
                          padding: '12px 14px',
                          borderRadius: 6,
                          fontSize: '0.88rem',
                          color: 'var(--text-secondary)',
                          marginTop: 4,
                          lineHeight: 1.55
                        }}>
                          {activeExplanations[i]}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-teal" style={{ background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{q?.difficulty || 'medium'}</span>
                      <span className="badge badge-gray" style={{ background: 'rgba(100,116,139,0.15)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{q?.type || 'mcq'}</span>
                      
                      <button onClick={() => remove(q?.id)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          color: '#f87171',
                          border: '1px solid rgba(239,68,68,0.2)',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 600,
                          marginLeft: 'auto'
                        }}>
                        ✕ Remove Bookmark
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
