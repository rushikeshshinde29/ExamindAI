import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import Skeleton from '../../components/Skeleton';
import {
  BsSearch, BsClock, BsBook, BsArrowRight, BsLock, BsPeople,
  BsBarChart, BsX, BsCheckCircle, BsXCircle, BsPatchQuestion, BsArrowRepeat
} from 'react-icons/bs';
import styles from './Quizzes.module.css';

const DIFF = {
  easy:   { color:'#15803d', bg:'#dcfce7' },
  medium: { color:'#854d0e', bg:'#fef9c3' },
  hard:   { color:'#dc2626', bg:'#fee2e2' },
};

export default function StudentQuizzes() {
  const navigate = useNavigate();
  const [quizzes,    setQuizzes]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [subject,    setSubject]    = useState('');
  const [subjects,   setSubjects]   = useState([]);
  const [myAttempts, setMyAttempts] = useState({});
  const [allAttemptsGrouped, setAllAttemptsGrouped] = useState({});
  const [selectedQuizAttempts, setSelectedQuizAttempts] = useState(null);
  const [showSelectorModal, setShowSelectorModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = { limit: 100 };
    if (search)     params.search     = search;
    if (difficulty) params.difficulty = difficulty;
    if (subject)    params.subject    = subject;

    Promise.all([
      api.get('/quizzes', { params }),
      api.get('/attempts/my'),
    ]).then(([qRes, aRes]) => {
      const qs = qRes.data.data || [];
      setQuizzes(qs);
      setSubjects([...new Set(qs.map(q => q.subject).filter(Boolean))]);
      const map = {};
      const grouped = {};
      (aRes.data.data || []).forEach(a => {
        if (a.quiz?.id) {
          if (!map[a.quiz.id]) {
            map[a.quiz.id] = a;
          }
          if (!grouped[a.quiz.id]) {
            grouped[a.quiz.id] = [];
          }
          grouped[a.quiz.id].push(a);
        }
      });
      setMyAttempts(map);
      setAllAttemptsGrouped(grouped);
    }).catch(console.error).finally(() => setLoading(false));
  }, [search, difficulty, subject]);
 
  const handleViewResultClick = (quizId) => {
    const attempts = allAttemptsGrouped[quizId] || [];
    if (attempts.length <= 1) {
      if (attempts.length === 1) {
        navigate(`/student/result/${attempts[0].id}`);
      } else {
        toast.error("No results found for this quiz");
      }
    } else {
      setSelectedQuizAttempts(attempts);
      setShowSelectorModal(true);
    }
  };

  const clearFilters = () => { setSearch(''); setDifficulty(''); setSubject(''); };
  const hasFilters   = search || difficulty || subject;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1>Browse Quizzes</h1>
            <p>{quizzes.length} quiz{quizzes.length !== 1 ? 'zes' : ''} available</p>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <BsSearch className={styles.searchIcon}/>
            <input type="text" placeholder="Search by title or subject..."
              value={search} onChange={e => setSearch(e.target.value)} className={styles.searchInput}/>
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}><BsX size={14}/></button>}
          </div>
          <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={styles.filterSelect}>
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <select value={subject} onChange={e => setSubject(e.target.value)} className={styles.filterSelect}>
            <option value="">All Subjects</option>
            {subjects.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button className={styles.clearBtn} onClick={clearFilters}>Clear Filters</button>
          )}
        </div>

        {loading ? (
          <Skeleton type="card" count={6} />
        ) : quizzes.length === 0 ? (
          <div className={styles.empty}>
            <BsPatchQuestion size={56} color="var(--gray-300)"/>
            <h2>No quizzes found</h2>
            <p>{hasFilters ? 'Try adjusting your filters.' : 'No quizzes published yet. Check back soon!'}</p>
            {hasFilters && <button className={styles.clearBtn2} onClick={clearFilters}>Clear Filters</button>}
          </div>
        ) : (
          <div className={styles.grid}>
            {quizzes.map(quiz => {
              const attempt = myAttempts[quiz.id];
              const dc      = DIFF[quiz.difficulty] || DIFF.medium;
              return (
                <div key={quiz.id} className={styles.card}>
                  <div className={styles.cardTop}>
                    <span className={styles.subjectTag}>{quiz.subject}</span>
                    <span className={`${styles.diffTag} ${styles[quiz.difficulty]}`}>{quiz.difficulty}</span>
                    {quiz.accessCode && <BsLock size={12} color="var(--gray-400)" title="Access code required"/>}
                    {quiz.targetGroup && (
                      <span className={styles.groupTag}><BsPeople size={11}/> {quiz.targetGroup?.name||'Group'}</span>
                    )}
                  </div>

                  <h3 className={styles.cardTitle}>{quiz.title}</h3>
                  {quiz.description && <p className={styles.cardDesc}>{quiz.description}</p>}

                  <div className={styles.cardMeta}>
                    <span><BsBook size={13}/> {quiz.questions?.length||0} Q's</span>
                    <span><BsClock size={13}/> {quiz.duration} min</span>
                    <span><BsPeople size={13}/> {quiz.attemptCount||0} taken</span>
                    {quiz.averageScore > 0 && <span><BsBarChart size={13}/> {parseFloat(quiz.averageScore).toFixed(0)}% avg</span>}
                    <span>
                      <BsArrowRepeat size={13}/>{' '}
                      {quiz.maxAttempts 
                        ? `${allAttemptsGrouped[quiz.id]?.length || 0} / ${quiz.maxAttempts} attempts` 
                        : `${allAttemptsGrouped[quiz.id]?.length || 0} attempts (unlimited)`
                      }
                    </span>
                  </div>

                  <div className={styles.cardFooter}>
                    {attempt && (
                      <div className={`${styles.attemptBanner} ${attempt.isPassed ? styles.bannerPass : styles.bannerFail}`}>
                        {attempt.isPassed ? (
                          <BsCheckCircle size={15} style={{ flexShrink: 0 }} />
                        ) : (
                          <BsXCircle size={15} style={{ flexShrink: 0 }} />
                        )}
                        <span>
                          Your score: <strong>{attempt.percentage?.toFixed(0)}%</strong>
                          {attempt.isPassed ? ' · Passed' : ' · Failed'}
                        </span>
                      </div>
                    )}

                    <div className={styles.cardActions}>
                      {attempt ? (
                        <>
                          <button onClick={() => handleViewResultClick(quiz.id)} className={styles.btnOutline}>View Result</button>
                          {(quiz.maxAttempts > 1) && (
                            <Link to={`/student/quiz/${quiz.id}`} className={styles.btnPrimary}>
                              Retake <BsArrowRight size={13}/>
                            </Link>
                          )}
                        </>
                      ) : (
                        <Link to={`/student/quiz/${quiz.id}`} className={styles.btnPrimary}>
                          Start Quiz <BsArrowRight size={13}/>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
 
        {showSelectorModal && selectedQuizAttempts && (
          <div className={styles.modalOverlay}>
            <div className={styles.selectorModal}>
              <div className={styles.modalHeader}>
                <h3>Select Quiz Attempt</h3>
                <button className={styles.closeModal} onClick={() => setShowSelectorModal(false)}>&times;</button>
              </div>
              <p className={styles.modalSub}>You have taken this quiz multiple times. Please select which attempt you would like to view:</p>
              <div className={styles.attemptsList}>
                {selectedQuizAttempts.map((att, idx) => {
                  const dateStr = att.createdAt ? new Date(att.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown Date';
                  const attemptNum = selectedQuizAttempts.length - idx;
                  return (
                    <button 
                      key={att.id} 
                      className={styles.attemptRow} 
                      onClick={() => {
                        setShowSelectorModal(false);
                        navigate(`/student/result/${att.id}`);
                      }}
                    >
                      <div className={styles.attemptInfo}>
                        <span className={styles.attemptNumber}>Attempt #{attemptNum}</span>
                        <span className={styles.attemptDate}>{dateStr}</span>
                      </div>
                      <div className={styles.attemptBadgeRow}>
                        <span className={`${styles.attemptPct} ${att.isPassed ? styles.pctPass : styles.pctFail}`}>
                          {att.percentage?.toFixed(0)}%
                        </span>
                        <span className={`${styles.statusLabel} ${att.isPassed ? styles.statusPass : styles.statusFail}`}>
                          {att.isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
