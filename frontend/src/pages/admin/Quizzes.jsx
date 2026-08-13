import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from './Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsSearch, BsTrash, BsToggleOff, BsToggleOn, BsBarChart, BsEye } from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AdminQuizzes.module.css';
import { useDialog } from '../../context/DialogContext';

const DIFF = { easy:{color:'#15803d',bg:'#dcfce7'}, medium:{color:'#854d0e',bg:'#fef9c3'}, hard:{color:'#dc2626',bg:'#fee2e2'} };

export default function AdminQuizzes() {
  const { confirm } = useDialog();
  const { t } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [pub,     setPub]     = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const pubParam = params.get('published');
    return pubParam === 'true' ? 'true' : (pubParam === 'false' ? 'false' : '');
  });
  const [page,    setPage]    = useState(1);
  const LIMIT = 15;

  const fetchQuizzes = () => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search)     params.search    = search;
    if (pub !== '') params.published = pub;
    api.get('/admin/quizzes', { params })
      .then(r => { setQuizzes(r.data.data); setTotal(r.data.total); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetchQuizzes, [page, search, pub]);
  useEffect(() => setPage(1), [search, pub]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const pubParam = params.get('published');
    if (pubParam === 'true') {
      setPub('true');
    } else if (pubParam === 'false') {
      setPub('false');
    } else {
      setPub('');
    }
  }, [location.search]);

  const togglePublish = async (id) => {
    try {
      const res = await api.patch(`/quizzes/${id}/publish`);
      setQuizzes(q => q.map(x => x.id===id ? { ...x, isPublished: res.data.data.isPublished } : x));
      toast.success(res.data.message);
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
  };

  const deleteQuiz = async (id, title) => {
    if (!await confirm(`Delete quiz "${title}"?`, "Delete Quiz")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(q => q.filter(x => x.id!==id));
      setTotal(t => t-1);
      toast.success('Quiz deleted');
    } catch(err) { toast.error('Failed'); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div><h1>{t('manageQuizzes')}</h1><p>{total} {t('manageQuizzesSub')}</p></div>
        </div>

        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <BsSearch className={styles.si}/>
            <input placeholder="Search quizzes..." value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div className={styles.tabs}>
            {[['','All'],['true','Published'],['false','Drafts']].map(([v,l]) => (
              <button key={v} className={`${styles.tab} ${pub===v?styles.tabActive:''}`} onClick={() => {
                if (v) {
                  navigate(`/admin/quizzes?published=${v}`);
                } else {
                  navigate('/admin/quizzes');
                }
              }}>{l}</button>
            ))}
          </div>
        </div>

        {loading ? <div className={styles.center}><div className="spinner"/></div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead><tr><th>#</th><th>Quiz</th><th>Subject</th><th>Faculty</th><th>Questions</th><th>Attempts</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {quizzes.map((q, i) => {
                  const dc = DIFF[q.difficulty] || DIFF.medium;
                  return (
                    <tr key={q.id}>
                      <td className={styles.num}>{(page-1)*LIMIT+i+1}</td>
                      <td>
                        <div className={styles.quizCell}>
                          <div className={styles.quizIcon}><BsPatchQuestion size={16} style={{ color: 'white', fill: 'white' }}/></div>
                          <div>
                            <div className={styles.quizTitle}>{q.title}</div>
                            <div className={styles.quizCategory}>{q.category}</div>
                          </div>
                        </div>
                      </td>
                      <td className={styles.subject}>{q.subject}</td>
                      <td className={styles.faculty}>{q.createdBy?.name||'—'}</td>
                      <td className={styles.center2}>{q.questions?.length||0}</td>
                      <td className={styles.center2}>{q.attemptCount||0}</td>
                      <td>
                        <span className={`${styles.pubBadge} ${q.isPublished?styles.pubOn:styles.pubOff}`}>
                          {q.isPublished?'🟢 Published':'⚪ Draft'}
                        </span>
                      </td>
                      <td>
                        <div className={styles.actions}>
                          <Link to={`/admin/quiz/${q.id}/results`} className={styles.aBtn} title="Results"><BsBarChart size={13}/></Link>
                          <button onClick={()=>togglePublish(q.id)} className={styles.aBtn} title={q.isPublished?'Unpublish':'Publish'}>
                            {q.isPublished?<BsToggleOn size={13}/>:<BsToggleOff size={13}/>}
                          </button>
                          <button onClick={()=>deleteQuiz(q.id,q.title)} className={`${styles.aBtn} ${styles.aBtnRed}`} title="Delete"><BsTrash size={13}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!quizzes.length && <tr><td colSpan="9" className={styles.noData}>No quizzes found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className={styles.pgBtn}>← Prev</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page===pages} onClick={()=>setPage(p=>p+1)} className={styles.pgBtn}>Next →</button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
