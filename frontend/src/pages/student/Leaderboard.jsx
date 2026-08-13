import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import Skeleton from '../../components/Skeleton';
import { useAuth } from '../../context/AuthContext';
import { BsSearch, BsTrophy, BsStar, BsLightning, BsAward } from 'react-icons/bs';
import styles from './Leaderboard.module.css';

const BADGE_LABELS = {
  perfect_score: 'Perfect',
  streak_7: 'Streak 7',
  streak_3: 'Streak 3',
  quiz_10: '10 Quizzes',
  first_quiz: 'First Quiz'
};

export default function Leaderboard() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/leaderboard/global').then(r => { setData(r.data.data); setMyRank(r.data.myRank); }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = data.filter(u => u.name?.toLowerCase().includes(search.toLowerCase()) || u.department?.toLowerCase().includes(search.toLowerCase()));
  const me = data.find(u => String(u.id) === String(user?.id));

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <BsTrophy size={36} color="white"/>
          <div>
            <h1>Global Leaderboard</h1>
            <p>Top performers across all quizzes — keep pushing to climb the ranks!</p>
          </div>
          {myRank && <div className={styles.myRankCard}><span>Your Rank</span><strong>#{myRank}</strong></div>}
        </div>

        {me && (
          <div className={styles.myCard}>
            <div className={styles.myRankBig}>#{myRank}</div>
            <div className={styles.myAvatar}>{me.name?.charAt(0)}</div>
            <div className={styles.myInfo}>
              <div className={styles.myName}>{me.name} <span className={styles.youTag}>You</span></div>
              <div className={styles.myDept}>{me.department || 'No department'}</div>
            </div>
            <div className={styles.myStats}>
              <div><strong><BsStar size={13} style={{marginRight: 4}}/> {me.totalPoints||0}</strong><small>XP</small></div>
              <div><strong>Lv.{me.level||1}</strong><small>Level</small></div>
              <div><strong><BsLightning size={13} style={{marginRight: 4}}/> {me.streak||0}</strong><small>Streak</small></div>
            </div>
          </div>
        )}

        <div className={styles.controls}>
          <div className={styles.searchWrap}><BsSearch className={styles.searchIcon}/><input placeholder="Search by name or department..." value={search} onChange={e => setSearch(e.target.value)}/></div>
        </div>

        {loading ? <Skeleton type="table" count={8} /> : (
          <div className={styles.table}>
            <div className={styles.tableHead}>
              <span>Rank</span><span>Student</span><span>Department</span><span>Level</span><span>XP</span><span>Streak</span><span>Badges</span>
            </div>
            {filtered.map((u, i) => {
              const rank = data.indexOf(u) + 1;
              const isMe = String(u.id) === String(user?.id);
              return (
                <div key={u.id} className={`${styles.tableRow} ${isMe ? styles.myRow : ''} ${rank <= 3 ? styles.topRow : ''}`}>
                  <span className={styles.rankCell}>
                    {rank === 1 ? <BsAward size={18} color="#d97706" title="Gold Medal"/> :
                     rank === 2 ? <BsAward size={18} color="#94a3b8" title="Silver Medal"/> :
                     rank === 3 ? <BsAward size={18} color="#b45309" title="Bronze Medal"/> :
                     <span className={styles.rankNum}>{rank}</span>}
                  </span>
                  <span className={styles.userCell}>
                    <div className={styles.avatar} style={{background: rank===1?'linear-gradient(135deg,#f59e0b,#fbbf24)': rank===2?'linear-gradient(135deg,#94a3b8,#cbd5e1)': rank===3?'linear-gradient(135deg,#b45309,#d97706)':'linear-gradient(135deg,var(--primary),#0ea5e9)'}}>
                      {u.name?.charAt(0)}
                    </div>
                    <div>
                      <div className={styles.userName}>{u.name} {isMe && <span className={styles.youTag}>You</span>}</div>
                      <div className={styles.studentId}>{u.studentId || ''}</div>
                    </div>
                  </span>
                  <span className={styles.dept}>{u.department || '—'}</span>
                  <span className={styles.levelCell}><div className={styles.levelPill}>Lv.{u.level||1}</div></span>
                  <span className={styles.xpCell}><BsStar size={13} color="var(--primary)"/> {u.totalPoints||0}</span>
                  <span className={styles.streakCell}><BsLightning size={12} color="var(--warning)"/> {u.streak||0}</span>
                  <span className={styles.badgesCell}>{(u.badges||[]).slice(0,3).map((b, idx) => <span key={`${b}-${idx}`} className={styles.badgePill}>{BADGE_LABELS[b] || b}</span>)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
