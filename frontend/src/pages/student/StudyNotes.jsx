import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { usePreferences } from '../../context/PreferencesContext';

const CARD_GRADIENTS = [
  { id: 'indigo', name: 'Cosmic Indigo', class: 'bg-gradient-to-br from-indigo-600 to-purple-700' },
  { id: 'ocean', name: 'Ocean Sunset', class: 'bg-gradient-to-br from-blue-600 to-teal-500' },
  { id: 'pink', name: 'Cyber Pink', class: 'bg-gradient-to-br from-purple-600 to-pink-500' },
  { id: 'emerald', name: 'Emerald Focus', class: 'bg-gradient-to-br from-emerald-600 to-teal-700' },
  { id: 'amber', name: 'Amber Glow', class: 'bg-gradient-to-br from-amber-500 to-rose-600' }
];

const getGradientClass = (colorId) => {
  const grad = CARD_GRADIENTS.find(g => g.id === colorId);
  return grad ? grad.class : 'bg-gradient-to-br from-indigo-600 to-purple-700';
};

export default function StudyNotes() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewNote, setViewNote] = useState(null);
  const [tab, setTab] = useState('notes'); // notes | flashcards
  const [form, setForm] = useState({ title:'', content:'', subject:'', color:'indigo', flashcard:false, flashcardFront:'', flashcardBack:'' });
  const { prefs } = usePreferences();

  const load = () => {
    const url = tab === 'flashcards' ? '/study-notes/flashcards' : '/study-notes';
    api.get(url).then(r => setNotes(r.data.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  };

  useEffect(() => { setLoading(true); load(); }, [tab]);

  const save = async () => {
    const payload = { ...form };
    if (!payload.content || !payload.content.trim()) {
      if (payload.flashcard) {
        payload.content = payload.flashcardFront || payload.title || 'Flashcard Content';
      } else {
        payload.content = payload.title || 'Note Content';
      }
    }
    if (!payload.title || !payload.title.trim()) {
      payload.title = payload.flashcard ? 'New Flashcard' : 'New Note';
    }

    try {
      await api.post('/study-notes', payload);
      if (payload.flashcard) {
        toast.success('Flashcard saved! View it in the Flashcards tab.');
      } else {
        toast.success('Note saved! View it in the Notes tab.');
      }
      setShowModal(false);
      setForm({ title:'', content:'', subject:'', color:'indigo', flashcard:false, flashcardFront:'', flashcardBack:'' });
      load();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save note');
    }
  };

  const del = async (id) => {
    await api.delete(`/study-notes/${id}`).catch(()=>{});
    setNotes(n => n.filter(x => x.id !== id));
    toast.success('Note deleted');
  };

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📝 Study Notes</h1>
            <p className="page-subtitle">Personal notes and flashcards for revision</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Note</button>
        </div>

        <div className="tabs" style={{marginBottom:'24px',maxWidth:'300px'}}>
          <button className={`tab ${tab==='notes'?'active':''}`} onClick={()=>setTab('notes')}>📝 Notes</button>
          <button className={`tab ${tab==='flashcards'?'active':''}`} onClick={()=>setTab('flashcards')}>🃏 Flashcards</button>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div className="spinner"/></div>
        ) : notes.filter(n => tab === 'flashcards' ? (n.flashcard || n.isFlashcard) : !(n.flashcard || n.isFlashcard)).length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No {tab === 'flashcards' ? 'flashcards' : 'notes'} yet</h3>
            <p>Create your first {tab === 'flashcards' ? 'flashcard' : 'note'} to start revising</p>
          </div>
        ) : (
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
            {notes
              .filter(n => tab === 'flashcards' ? (n.flashcard || n.isFlashcard) : !(n.flashcard || n.isFlashcard))
              .map(n => {
                const gradClass = getGradientClass(n.color);

                return (
                  <div key={n.id} className={gradClass} style={{
                    borderRadius: 'var(--radius)',
                    padding: '20px',
                    position: 'relative',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
                    transition: 'all 0.2s',
                    height: '280px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxSizing: 'border-box',
                    border: '1px solid rgba(255,255,255,0.12)'
                  }}>
                    <div style={{ overflow: 'hidden' }}>
                      {n.subject && (
                        <span className="badge" style={{
                          marginBottom: '10px',
                          display: 'inline-block',
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: '1px solid rgba(255,255,255,0.3)',
                          fontWeight: 700
                        }}>{n.subject}</span>
                      )}
                      <h4 style={{color: '#ffffff', marginBottom: '8px', fontSize: '1.05rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{n.title || 'Untitled'}</h4>
                      <p style={{
                        color: 'rgba(255, 255, 255, 0.85)', 
                        fontSize: '0.88rem', 
                        lineHeight: 1.5,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        marginBottom: '8px',
                        whiteSpace: 'pre-wrap'
                      }}>{n.content}</p>
                      
                      {(n.flashcard || n.isFlashcard) && (
                        <div style={{
                          padding: '8px 10px',
                          background: 'rgba(255,255,255,0.15)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,255,255,0.15)',
                          overflow: 'hidden'
                        }}>
                          <div style={{fontSize: '0.65rem', color: '#ffffff', fontWeight: 800, marginBottom: '2px', letterSpacing: '0.5px'}}>FLASHCARD FRONT</div>
                          <div style={{fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{n.flashcardFront}</div>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', alignItems: 'center' }}>
                      <button onClick={() => setViewNote(n)}
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          fontWeight: 700
                        }}>
                        👁 View Details
                      </button>
                    </div>

                    <button onClick={() => del(n.id)}
                      style={{
                        position: 'absolute', top: '12px', right: '12px',
                        background: 'rgba(255,255,255,0.15)', color: '#ffe4e6', border: 'none',
                        borderRadius: '6px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer',
                        fontWeight: 700
                      }}>✕</button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3 style={{marginBottom:'20px'}}>Create Note</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'14px'}}>
              <input className="form-input" placeholder="Title" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/>
              <textarea className="form-input" placeholder="Content..." rows={4} value={form.content} onChange={e=>setForm(f=>({...f,content:e.target.value}))} style={{resize:'vertical'}}/>
              <input className="form-input" placeholder="Subject (optional)" value={form.subject} onChange={e=>setForm(f=>({...f,subject:e.target.value}))}/>
              <div>
                <label style={{fontSize:'0.82rem',color:'var(--text-secondary)',marginBottom:'6px',display:'block'}}>Card Color</label>
                <div style={{display:'flex',gap:'12px'}}>
                  {CARD_GRADIENTS.map(g => {
                    const isSelected = form.color === g.id;
                    const gradClass = g.class;
                    return (
                      <button 
                        key={g.id} 
                        type="button"
                        onClick={()=>setForm(f=>({...f,color:g.id}))}
                        className={`${gradClass}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          border: 'none',
                          outline: 'none',
                          boxShadow: isSelected ? '0 0 0 2px var(--bg-base), 0 0 0 4px var(--primary)' : '0 1px 3px rgba(0,0,0,0.2)',
                          transition: 'all 0.2s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        title={g.name}
                      >
                        {isSelected && (
                          <span style={{ color: 'white', fontSize: '0.8rem', fontWeight: 'bold' }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:'8px',cursor:'pointer',marginTop:'4px'}}>
                <input type="checkbox" checked={form.flashcard} onChange={e=>setForm(f=>({...f,flashcard:e.target.checked}))}/>
                <span style={{fontSize:'0.875rem'}}>Make Flashcard</span>
              </label>
              {form.flashcard && <>
                <input className="form-input" placeholder="Flashcard Front (question)" value={form.flashcardFront} onChange={e=>setForm(f=>({...f,flashcardFront:e.target.value}))}/>
                <input className="form-input" placeholder="Flashcard Back (answer)" value={form.flashcardBack} onChange={e=>setForm(f=>({...f,flashcardBack:e.target.value}))}/>
              </>}
              <div style={{display:'flex',gap:'10px',justifyContent:'flex-end',marginTop:'8px'}}>
                <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={save}>Save Note</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {viewNote && (
        <div className="modal-backdrop" onClick={() => setViewNote(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '560px', width: '90%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--bg-border)', paddingBottom: '12px' }}>
              <div>
                {viewNote.subject && (
                  <span className="badge" style={{
                    background: 'var(--primary-lighter)',
                    color: 'var(--primary)',
                    fontWeight: 700,
                    marginRight: '8px',
                    fontSize: '0.75rem',
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>{viewNote.subject}</span>
                )}
                <span className="badge" style={{
                  background: (viewNote.flashcard || viewNote.isFlashcard) ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                  color: (viewNote.flashcard || viewNote.isFlashcard) ? '#d97706' : '#059669',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: '4px'
                }}>
                  {(viewNote.flashcard || viewNote.isFlashcard) ? 'Flashcard' : 'Study Note'}
                </span>
              </div>
              <button onClick={() => setViewNote(null)} style={{ background: 'transparent', fontSize: '1.2rem', color: 'var(--text-muted)', cursor: 'pointer', border: 'none' }}>✕</button>
            </div>
            
            <h2 style={{ marginBottom: '14px', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>{viewNote.title || 'Untitled Note'}</h2>
            
            <div style={{ maxHeight: '200px', overflowY: 'auto', padding: '12px', background: 'var(--bg-raised)', borderRadius: '8px', border: '1px solid var(--bg-border)', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>CONTENT</div>
              <p style={{ color: 'var(--text-primary)', fontSize: '0.92rem', whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: 0 }}>{viewNote.content}</p>
            </div>
            
            {(viewNote.flashcard || viewNote.isFlashcard) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>FLASHCARD FRONT (QUESTION)</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{viewNote.flashcardFront}</div>
                </div>
                <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 800, marginBottom: '6px', letterSpacing: '0.5px' }}>FLASHCARD BACK (ANSWER)</div>
                  <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{viewNote.flashcardBack}</div>
                </div>
              </div>
            )}
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid var(--bg-border)', paddingTop: '12px', marginTop: '16px' }}>
              <button className="btn btn-ghost" onClick={() => setViewNote(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
