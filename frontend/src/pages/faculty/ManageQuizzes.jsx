import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BsPlusCircle, BsPencil, BsTrash, BsToggleOff, BsToggleOn,
  BsBarChart, BsSearch, BsClock, BsPeople, BsLock, BsEye, BsX,
  BsSave, BsBook, BsAward, BsHash, BsCalendar3, BsKey, BsCheckCircle, BsGlobe,
  BsExclamationTriangle, BsInfoCircle, BsChevronRight, BsClipboard, BsEnvelope,
  BsArrowRepeat
} from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import styles from './ManageQuizzes.module.css';
import { useDialog } from '../../context/DialogContext';

const DIFF = {
  easy:   { color:'#15803d', bg:'#dcfce7' },
  medium: { color:'#854d0e', bg:'#fef9c3' },
  hard:   { color:'#dc2626', bg:'#fee2e2' },
};

/* ── Quick-edit form inside the drawer ── */
function QuizEditForm({ quiz, onSave, onCancel }) {
  const [form, setForm] = useState({
    title:               quiz.title        || '',
    description:         quiz.description  || '',
    subject:             quiz.subject      || '',
    category:            quiz.category     || '',
    difficulty:          quiz.difficulty   || 'medium',
    duration:            quiz.duration     || 30,
    maxAttempts:         quiz.maxAttempts  || 1,
    passingMarks:        quiz.passingMarks || 0,
    pointsOnPass:        quiz.pointsOnPass || 10,
    accessCode:          quiz.accessCode   || '',
    instructions:        quiz.instructions || '',
    shuffleQuestions:    !!quiz.shuffleQuestions,
    shuffleOptions:      !!quiz.shuffleOptions,
    showResults:         quiz.showResults  !== false,
    showAnswersAfter:    quiz.showAnswersAfter !== false,
    leaderboardEnabled:  quiz.leaderboardEnabled !== false,
    feedbackEnabled:     quiz.feedbackEnabled    !== false,
    certificateEnabled:  !!quiz.certificateEnabled,
    certificateMinScore: quiz.certificateMinScore || 80,
    antiCheat: {
      preventTabSwitch:   quiz.antiCheat?.preventTabSwitch   !== false,
      preventCopyPaste:   quiz.antiCheat?.preventCopyPaste   !== false,
      preventRightClick:  quiz.antiCheat?.preventRightClick  !== false,
      fullscreenRequired: !!quiz.antiCheat?.fullscreenRequired,
      maxWarnings:        quiz.antiCheat?.maxWarnings        || 3,
    },
  });
  const [saving, setSaving] = useState(false);

  const set  = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setAC = (k, v) => setForm(f => ({ ...f, antiCheat: { ...f.antiCheat, [k]: v } }));

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.subject.trim()) return toast.error('Subject is required');
    setSaving(true);
    try {
      const res = await api.put(`/quizzes/${quiz.id || quiz.id}`, form);
      toast.success('Quiz updated successfully!');
      onSave(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const Toggle = ({ label, k, desc }) => (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <span>{label}</span>
        {desc && <small>{desc}</small>}
      </div>
      <div
        className={`${styles.toggleSwitch} ${form[k] ? styles.toggleOn : ''}`}
        onClick={() => set(k, !form[k])}
      />
    </div>
  );

  const ACToggle = ({ label, k, desc }) => (
    <div className={styles.toggleRow}>
      <div className={styles.toggleInfo}>
        <span>{label}</span>
        {desc && <small>{desc}</small>}
      </div>
      <div
        className={`${styles.toggleSwitch} ${form.antiCheat[k] ? styles.toggleOn : ''}`}
        onClick={() => setAC(k, !form.antiCheat[k])}
      />
    </div>
  );

  return (
    <div className={styles.editForm}>
      <div className={styles.editSection}>
        <div className={styles.editSectionTitle}><BsInfoCircle size={14}/> Basic Info</div>
        <div className={styles.editGrid2}>
          <div className={styles.editField}>
            <label>Quiz Title *</label>
            <input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Quiz title"/>
          </div>
          <div className={styles.editField}>
            <label>Subject *</label>
            <input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="Subject"/>
          </div>
          <div className={styles.editField}>
            <label>Category</label>
            <select value={form.category} onChange={e => set('category', e.target.value)}>
              <option value="General">General</option>
              <option value="Technical">Technical</option>
              <option value="Programming">Programming</option>
            </select>
          </div>
          <div className={styles.editField}>
            <label>Difficulty</label>
            <select value={form.difficulty} onChange={e => set('difficulty', e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
        <div className={styles.editField}>
          <label>Description</label>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={2} placeholder="Brief description"/>
        </div>
        <div className={styles.editField}>
          <label>Instructions for Students</label>
          <textarea value={form.instructions} onChange={e => set('instructions', e.target.value)} rows={2} placeholder="Shown before exam starts"/>
        </div>
      </div>

      <div className={styles.editSection}>
        <div className={styles.editSectionTitle}><BsClock size={14}/> Settings</div>
        <div className={styles.editGrid3}>

          <div className={styles.editField}>
            <label>Duration (min)</label>
            <input 
              type="number" 
              min={1} 
              max={300} 
              value={form.duration} 
              onChange={e => set('duration', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.duration === '' || form.duration < 1) set('duration', 30);
              }}
            />
          </div>
          <div className={styles.editField}>
            <label>Max Attempts</label>
            <input 
              type="number" 
              min={1} 
              max={10} 
              value={form.maxAttempts} 
              onChange={e => set('maxAttempts', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.maxAttempts === '' || form.maxAttempts < 1) set('maxAttempts', 1);
              }}
            />
          </div>
          <div className={styles.editField}>
            <label>Passing Marks</label>
            <input 
              type="number" 
              min={0} 
              value={form.passingMarks} 
              onChange={e => set('passingMarks', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.passingMarks === '') set('passingMarks', 0);
              }}
            />
          </div>
          <div className={styles.editField}>
            <label>XP on Pass</label>
            <input 
              type="number" 
              min={0} 
              value={form.pointsOnPass} 
              onChange={e => set('pointsOnPass', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.pointsOnPass === '') set('pointsOnPass', 10);
              }}
            />
          </div>
          <div className={`${styles.editField} ${styles.span2}`}>
            <label><BsKey size={12}/> Access Code (leave blank for public)</label>
            <input value={form.accessCode} onChange={e => set('accessCode', e.target.value)} placeholder="Optional quiz password"/>
          </div>
        </div>
        <div className={styles.togglesGrid}>
          <Toggle label="Shuffle Questions" k="shuffleQuestions" desc="Randomise order per student"/>
          <Toggle label="Shuffle Options"   k="shuffleOptions"   desc="Randomise answer choices"/>
          <Toggle label="Show Results"       k="showResults"      desc="Students see score immediately"/>
          <Toggle label="Show Answers"       k="showAnswersAfter" desc="Show correct answers after submission"/>
          <Toggle label="Leaderboard"        k="leaderboardEnabled" desc="Show on quiz leaderboard"/>
          <Toggle label="Feedback"           k="feedbackEnabled"   desc="Students can rate quiz"/>
        </div>
      </div>

      <div className={styles.editSection}>
        <div className={styles.editSectionTitle}><BsExclamationTriangle size={14}/> Anti-Cheat</div>
        <div className={styles.editGrid2} style={{marginBottom:10}}>
          <div className={styles.editField}>
            <label>Max Warnings (before disqualify)</label>
            <input 
              type="number" 
              min={1} 
              max={20} 
              value={form.antiCheat.maxWarnings} 
              onChange={e => setAC('maxWarnings', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.antiCheat.maxWarnings === '' || form.antiCheat.maxWarnings < 1) setAC('maxWarnings', 3);
              }}
            />
          </div>
        </div>
        <div className={styles.togglesGrid}>
          <ACToggle label="Detect Tab Switch"   k="preventTabSwitch"   desc="Log warning on tab change"/>
          <ACToggle label="Block Copy/Paste"    k="preventCopyPaste"   desc="Prevent copying content"/>
          <ACToggle label="Disable Right-Click" k="preventRightClick"  desc="Block context menu"/>
          <ACToggle label="Require Fullscreen"  k="fullscreenRequired" desc="Student must stay fullscreen"/>
        </div>
      </div>

      <div className={styles.editSection}>
        <div className={styles.editSectionTitle}><BsAward size={14}/> Certificates</div>
        <div className={styles.togglesGrid} style={{marginBottom:10}}>
          <Toggle label="Issue Certificates" k="certificateEnabled" desc="Auto-issue on qualifying score"/>
        </div>
        {form.certificateEnabled && (
          <div className={styles.editField} style={{maxWidth:220}}>
            <label>Min Score for Certificate (%)</label>
            <input 
              type="number" 
              min={1} 
              max={100} 
              value={form.certificateMinScore} 
              onChange={e => set('certificateMinScore', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              onBlur={() => {
                if (form.certificateMinScore === '' || form.certificateMinScore < 1 || form.certificateMinScore > 100) set('certificateMinScore', 80);
              }}
            />
          </div>
        )}
      </div>

      <div className={styles.editActions}>
        <button onClick={onCancel} className={styles.cancelEditBtn}>Cancel</button>
        <button onClick={handleSave} className={styles.saveEditBtn} disabled={saving}>
          {saving ? <span className={styles.spin}/> : <><BsSave size={14}/> Save Changes</>}
        </button>
      </div>
    </div>
  );
}

/* ── Quiz Detail Drawer ── */
function QuizDrawer({ quiz, onClose, onUpdate, onDelete, onTogglePublish, onClone, onShare }) {
  const [editMode, setEditMode] = useState(false);
  const dc = DIFF[quiz.difficulty] || DIFF.medium;

  const handleSaved = (updated) => {
    onUpdate(updated);
    setEditMode(false);
  };

  const InfoRow = ({ icon: Icon, label, value, mono }) => (
    <div className={styles.infoRow}>
      <span className={styles.infoIcon}><Icon size={14}/></span>
      <span className={styles.infoLabel}>{label}</span>
      <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
    </div>
  );

  const YesNo = ({ val }) => (
    <span className={val ? styles.yes : styles.no}>{val ? '✅ Yes' : '❌ No'}</span>
  );

  return (
    <div className={styles.drawerOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.drawer}>
        {/* Drawer Header */}
        <div className={styles.drawerHeader}>
          <div className={styles.drawerHeaderLeft}>
            <BsPatchQuestion size={20} color="var(--primary)"/>
            <div>
              <div className={styles.drawerTitle}>{quiz.title}</div>
              <div className={styles.drawerSub}>{quiz.subject}</div>
            </div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}><BsX size={20}/></button>
        </div>

        {/* Status bar */}
        <div className={styles.drawerStatus}>
          <span className={`${styles.diffBadge} ${quiz.difficulty}`}>{quiz.difficulty}</span>
          <span className={`${styles.pubBadge} ${quiz.isPublished ? styles.pubOn : styles.pubOff}`}>
            {quiz.isPublished ? '🟢 Published' : '⚪ Draft'}
          </span>
          {quiz.accessCode && (
            <span className={styles.accessBadge}><BsLock size={11}/> Access Code Protected</span>
          )}
          <span className={styles.subjectBadge}>{quiz.subject}</span>
        </div>

        {/* Tab switcher */}
        <div className={styles.drawerTabs}>
          <button className={`${styles.drawerTab} ${!editMode ? styles.drawerTabActive : ''}`} onClick={() => setEditMode(false)}>
            <BsEye size={14}/> View Details
          </button>
          <button className={`${styles.drawerTab} ${editMode ? styles.drawerTabActive : ''}`} onClick={() => setEditMode(true)}>
            <BsPencil size={14}/> Edit Quiz
          </button>
        </div>

        <div className={styles.drawerBody}>
          {!editMode ? (
            /* ── VIEW MODE ── */
            <div className={styles.viewMode}>
              {quiz.description && (
                <div className={styles.descBlock}>
                  <p>{quiz.description}</p>
                </div>
              )}

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>📋 Quiz Details</div>
                <InfoRow icon={BsPatchQuestion}      label="Total Questions"  value={quiz.questions?.length || 0}/>
                <InfoRow icon={BsClock}     label="Duration"         value={`${quiz.duration} minutes`}/>
                <InfoRow icon={BsAward}     label="Total Marks"      value={quiz.totalMarks || 0}/>
                <InfoRow icon={BsCheckCircle} label="Passing Marks"  value={quiz.passingMarks || 0}/>
                <InfoRow icon={BsHash}      label="Max Attempts"     value={quiz.maxAttempts}/>
                <InfoRow icon={BsBarChart} label="Total Attempts"   value={quiz.attemptCount || 0}/>
                <InfoRow icon={BsBarChart} label="Average Score"    value={`${parseFloat(quiz.averageScore||0).toFixed(1)}%`}/>
                <InfoRow icon={BsAward}     label="XP on Pass"       value={quiz.pointsOnPass || 10}/>
                <InfoRow icon={BsKey}       label="Access Code"      value={quiz.accessCode || '(none — public access)'} mono={!!quiz.accessCode}/>
                <InfoRow icon={BsGlobe}    label="Scope"             value={quiz.scope === 'global' ? '🌐 Global' : quiz.scope === 'institution' ? '🏫 Institution' : `👥 Group: ${quiz.group?.name || '—'}`}/>
                <InfoRow icon={BsCalendar3}  label="Created"          value={new Date(quiz.createdAt).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}/>
              </div>

              {quiz.instructions && (
                <div className={styles.infoSection}>
                  <div className={styles.infoSectionTitle}>📌 Instructions</div>
                  <p className={styles.instructionsText}>{quiz.instructions}</p>
                </div>
              )}

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>⚙️ Settings</div>
                <div className={styles.settingsGrid}>
                  {[
                    ['Shuffle Questions',  quiz.shuffleQuestions],
                    ['Shuffle Options',    quiz.shuffleOptions],
                    ['Show Results',       quiz.showResults !== false],
                    ['Show Answers',       quiz.showAnswersAfter !== false],
                    ['Leaderboard',        quiz.leaderboardEnabled !== false],
                    ['Student Feedback',   quiz.feedbackEnabled !== false],
                  ].map(([l, v]) => (
                    <div key={l} className={styles.settingItem}>
                      <span className={styles.settingLabel}>{l}</span>
                      <YesNo val={v}/>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>🛡️ Anti-Cheat</div>
                <div className={styles.settingsGrid}>
                  {[
                    ['Tab Switch Detection',  quiz.antiCheat?.preventTabSwitch !== false],
                    ['Copy/Paste Blocked',    quiz.antiCheat?.preventCopyPaste !== false],
                    ['Right-Click Disabled',  quiz.antiCheat?.preventRightClick !== false],
                    ['Fullscreen Required',   !!quiz.antiCheat?.fullscreenRequired],
                  ].map(([l, v]) => (
                    <div key={l} className={styles.settingItem}>
                      <span className={styles.settingLabel}>{l}</span>
                      <YesNo val={v}/>
                    </div>
                  ))}
                  <div className={styles.settingItem} style={{gridColumn:'1/-1'}}>
                    <span className={styles.settingLabel}>Max Warnings before Disqualify</span>
                    <span className={styles.warnBadge}>{quiz.antiCheat?.maxWarnings || 3} warnings</span>
                  </div>
                </div>
              </div>

              <div className={styles.infoSection}>
                <div className={styles.infoSectionTitle}>📜 Certificates</div>
                <div className={styles.settingsGrid}>
                  <div className={styles.settingItem}>
                    <span className={styles.settingLabel}>Certificates Enabled</span>
                    <YesNo val={!!quiz.certificateEnabled}/>
                  </div>
                  {quiz.certificateEnabled && (
                    <div className={styles.settingItem}>
                      <span className={styles.settingLabel}>Minimum Score</span>
                      <span className={styles.certScore}>{quiz.certificateMinScore || 80}%</span>
                    </div>
                  )}
                </div>
              </div>

              {quiz.tags?.length > 0 && (
                <div className={styles.infoSection}>
                  <div className={styles.infoSectionTitle}>🏷️ Tags</div>
                  <div className={styles.tagsWrap}>
                    {quiz.tags.map(t => <span key={t} className={styles.tag}>{t}</span>)}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── EDIT MODE ── */
            <QuizEditForm quiz={quiz} onSave={handleSaved} onCancel={() => setEditMode(false)}/>
          )}
        </div>

        {/* Drawer Footer actions */}
        {!editMode && (
          <div className={styles.drawerFooter}>
            <Link to={`/faculty/quiz/${quiz.id || quiz.id}/edit`} className={styles.dfBtn}>
              <BsBook size={14}/> Manage Questions
            </Link>
            <Link to={`/faculty/quiz/${quiz.id || quiz.id}/results`} className={styles.dfBtn}>
              <BsBarChart size={14}/> View Results
            </Link>
            <button
              onClick={() => onTogglePublish(quiz.id || quiz.id)}
              className={`${styles.dfBtn} ${quiz.isPublished ? styles.dfUnpublish : styles.dfPublish}`}
            >
              {quiz.isPublished ? <><BsToggleOn size={14}/> Unpublish</> : <><BsToggleOff size={14}/> Publish</>}
            </button>
            <button onClick={() => onClone(quiz.id || quiz.id)} className={styles.dfBtn}>
              <BsClipboard size={14}/> Clone
            </button>
            <button onClick={() => onShare(quiz.id || quiz.id)} className={styles.dfBtn} style={{ background: '#7c3aed', color: 'white' }}>
              <BsGlobe size={14}/> Share Quiz
            </button>

            <button onClick={() => onDelete(quiz.id || quiz.id, quiz.title)} className={`${styles.dfBtn} ${styles.dfDelete}`}>
              <BsTrash size={14}/>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Share Modal Component ── */
function ShareModal({ quizId, quizTitle, onClose }) {
  const [shareMode, setShareMode] = useState('email'); // 'email' or 'group'
  const [email, setEmail] = useState('');
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    // Fetch faculty groups
    api.get('/admin/groups')
      .then(res => {
        setGroups(res.data.data || []);
        if (res.data.data && res.data.data.length > 0) {
          setSelectedGroupId(res.data.data[0].id);
        }
      })
      .catch(err => {
        console.error("Failed to load groups:", err);
      });
  }, []);

  const handleShare = async () => {
    setSending(true);
    try {
      if (shareMode === 'email') {
        const emails = email.split(/[\n,;]+/).map(em => em.trim()).filter(Boolean);
        if (emails.length === 0) {
          toast.error("Please enter at least one valid email address");
          setSending(false);
          return;
        }
        toast.loading(`Sending invitations to ${emails.length} students...`, { id: "share-quiz" });
        const promises = emails.map(em => api.post(`/quizzes/${quizId}/share`, { email: em }));
        await Promise.all(promises);
        toast.success(`Successfully shared with all ${emails.length} students!`, { id: "share-quiz" });
      } else {
        if (!selectedGroupId) {
          toast.error("Please select a faculty group");
          setSending(false);
          return;
        }
        const group = groups.find(g => String(g.id) === String(selectedGroupId));
        if (!group) {
          toast.error("Selected group not found");
          setSending(false);
          return;
        }
        const activeStudents = (group.students || []).filter(s => s.email);
        if (activeStudents.length === 0) {
          toast.error("Selected group has no student members");
          setSending(false);
          return;
        }
        toast.loading(`Sharing quiz with ${activeStudents.length} students...`, { id: "share-quiz" });
        const promises = activeStudents.map(s => api.post(`/quizzes/${quizId}/share`, { email: s.email }));
        await Promise.all(promises);
        toast.success(`Successfully shared with all ${activeStudents.length} students in the group!`, { id: "share-quiz" });
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to share quiz", { id: "share-quiz" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={styles.modalContent}>
        {/* Header */}
        <div className={styles.modalHeader}>
          <div>
            <h2 className={styles.modalTitle}>Share Quiz</h2>
            <div className={styles.modalSubtitle}>{quizTitle}</div>
          </div>
          <button className={styles.drawerClose} onClick={onClose}><BsX size={22}/></button>
        </div>

        {/* Option Cards */}
        <div className={styles.shareOptions}>
          <div 
            className={`${styles.optionCard} ${shareMode === 'email' ? styles.activeOption : ''}`}
            onClick={() => setShareMode('email')}
          >
            <BsEnvelope size={20}/>
            <span style={{ marginTop: '4px' }}>Send via Email</span>
          </div>
          <div 
            className={`${styles.optionCard} ${shareMode === 'group' ? styles.activeOption : ''}`}
            onClick={() => setShareMode('group')}
          >
            <BsPeople size={20}/>
            <span style={{ marginTop: '4px' }}>Send via Faculty Group</span>
          </div>
        </div>

        {/* Form Body */}
        <div style={{ marginTop: '8px' }}>
          {shareMode === 'email' ? (
            <div className={styles.editField}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Student Email Addresses</label>
              <textarea 
                className={styles.inputField} 
                rows={4}
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="Enter email addresses (separated by commas, semicolons, or new lines)&#10;student1@example.com&#10;student2@example.com"
                required
                style={{ resize: 'vertical', minHeight: '80px', fontFamily: 'inherit', padding: '10px' }}
              />
            </div>
          ) : (
            <div className={styles.editField}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '6px', display: 'block' }}>Select Student Group</label>
              {groups.length === 0 ? (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No faculty groups found. Create one in the admin section first.</p>
              ) : (
                <select 
                  className={styles.selectField} 
                  value={selectedGroupId} 
                  onChange={e => setSelectedGroupId(e.target.value)}
                >
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.students?.length || 0} students)</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={sending}>Cancel</button>
          <button 
            className={styles.sendBtn} 
            onClick={handleShare} 
            disabled={sending || (shareMode === 'group' && groups.length === 0)}
          >
            {sending ? 'Sending...' : 'Send / Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ManageQuizzes Page ── */
export default function ManageQuizzes() {
  const { confirm } = useDialog();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [viewQuiz, setViewQuiz] = useState(null);   // quiz object shown in drawer
  const [shareModalData, setShareModalData] = useState(null); // quiz to share

  useEffect(() => {
    api.get('/quizzes', { params: { limit: 100 } })
      .then(r => {
        const normalized = (r.data.data || []).map(q => ({
          ...q,
          isPublished: q.isPublished !== undefined ? q.isPublished : q.published,
          isActive: q.isActive !== undefined ? q.isActive : q.active
        }));
        setQuizzes(normalized);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteQuiz = async (id, title) => {
    if (!await confirm(`Delete "${title}"? This removes all questions and results permanently.`, "Delete Quiz")) return;
    try {
      await api.delete(`/quizzes/${id}`);
      setQuizzes(q => q.filter(x => (x.id || x.id) !== id));
      setViewQuiz(null);
      toast.success('Quiz deleted');
    } catch(err) { toast.error(err.response?.data?.message || 'Delete failed'); }
  };

  const togglePublish = async (id) => {
    try {
      const res = await api.patch(`/quizzes/${id}/publish`);
      const updated = res.data.data;
      setQuizzes(q => q.map(x => (x.id || x.id) === id ? { ...x, isPublished: updated.isPublished } : x));
      if ((viewQuiz?.id || viewQuiz?.id) === id) setViewQuiz(v => ({ ...v, isPublished: updated.isPublished }));
      toast.success(res.data.message);
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const cloneQuiz = async (id) => {
    try {
      const res = await api.post(`/quizzes/${id}/clone`);
      setQuizzes(q => [res.data.data, ...q]);
      toast.success('Quiz cloned successfully!');
    } catch(err) {
      toast.error(err.response?.data?.message || 'Failed to clone quiz');
    }
  };

  const shareQuiz = (id) => {
    const q = quizzes.find(x => (x.id || x.id) === id);
    setShareModalData({ id, title: q ? q.title : '' });
  };

  const handleUpdate = (updatedQuiz) => {
    const uId = updatedQuiz.id || updatedQuiz.id;
    setQuizzes(q => q.map(x => (x.id || x.id) === uId ? { ...x, ...updatedQuiz } : x));
    setViewQuiz(v => ({ ...v, ...updatedQuiz }));
  };

  const filtered = quizzes.filter(q => {
    const mf = filter === 'all' || (filter === 'published' && q.isPublished) || (filter === 'draft' && !q.isPublished);
    const ms = !search || q.title?.toLowerCase().includes(search.toLowerCase()) || q.subject?.toLowerCase().includes(search.toLowerCase());
    return mf && ms;
  });

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1>My Quizzes</h1>
            <p>{quizzes.length} total · {quizzes.filter(q => q.isPublished).length} published</p>
          </div>
          <Link to="/faculty/quiz/create" className={styles.createBtn}>
            <BsPlusCircle size={16}/> Create Quiz
          </Link>
        </div>

        {/* Controls */}
        <div className={styles.controls}>
          <div className={styles.searchWrap}>
            <BsSearch className={styles.si}/>
            <input placeholder="Search quizzes..." value={search} onChange={e => setSearch(e.target.value)}/>
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className={styles.tabs}>
            {[['all','All'],['published','Published'],['draft','Drafts']].map(([v,l]) => (
              <button key={v} className={`${styles.tab} ${filter===v?styles.active:''}`} onClick={() => setFilter(v)}>{l}</button>
            ))}
          </div>
        </div>

        {/* Quiz Grid */}
        {filtered.length === 0 ? (
          <div className={styles.empty}>
            <BsPatchQuestion size={56} color="var(--gray-300)"/>
            <h2>{quizzes.length === 0 ? 'No quizzes yet' : 'No results found'}</h2>
            <p>{quizzes.length === 0 ? 'Create your first quiz to get started!' : 'Try adjusting your search or filter.'}</p>
            {quizzes.length === 0 && (
              <Link to="/faculty/quiz/create" className={styles.createBtn}><BsPlusCircle size={15}/> Create Quiz</Link>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(quiz => {
              const dc = DIFF[quiz.difficulty] || DIFF.medium;
              const qId = quiz.id || quiz.id;
              return (
                <div key={qId} className={`${styles.card} ${quiz.isPublished ? styles.publishedCard : styles.draftCard}`}>
                  <div className={styles.cardBadges}>
                    <span className={styles.subjectBadge}>{quiz.subject}</span>
                    <span className={`${styles.diffBadge} ${quiz.difficulty}`}>{quiz.difficulty}</span>
                    {quiz.accessCode && <BsLock size={12} color="var(--gray-400)" title="Access code required"/>}
                    <span className={`${styles.pubBadge} ${quiz.isPublished ? styles.pubOn : styles.pubOff}`}>
                      <span className={styles.badgeIndicator}></span>
                      {quiz.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  <h3 className={styles.cardTitle}>{quiz.title}</h3>
                  {quiz.description && <p className={styles.cardDesc}>{quiz.description}</p>}

                  <div className={styles.cardMeta}>
                    <span><BsPatchQuestion size={13}/> {quiz.questions?.length||0} Q's</span>
                    <span><BsClock size={13}/> {quiz.duration}m</span>
                    <span><BsArrowRepeat size={13}/> {quiz.maxAttempts || 1} allowed</span>
                    <span><BsPeople size={13}/> {quiz.attemptCount||0} attempts</span>
                    <span><BsBarChart size={13}/> {parseFloat(quiz.averageScore||0).toFixed(0)}% avg</span>
                  </div>

                  <div className={styles.actions}>
                    <button
                      onClick={() => setViewQuiz(quiz)}
                      className={styles.viewBtn}
                      title="View all details & edit"
                    >
                      <BsEye size={14}/> View
                    </button>

                    <Link to={`/faculty/quiz/${qId}/edit`} className={styles.questionsBtn} title="Manage Questions">
                      <BsPencil size={14}/> Questions
                    </Link>

                    <Link to={`/faculty/quiz/${qId}/results`} className={`${styles.actionBtn} ${styles.resultsBtn}`} title="Results">
                      <BsBarChart size={14}/>
                    </Link>

                    <button
                      onClick={() => togglePublish(qId)}
                      className={`${styles.actionBtn} ${quiz.isPublished ? styles.unpublishBtn : styles.publishBtn}`}
                      title={quiz.isPublished ? 'Unpublish' : 'Publish'}
                    >
                      {quiz.isPublished ? <BsToggleOn size={14}/> : <BsToggleOff size={14}/>}
                    </button>

                    <button
                      onClick={() => cloneQuiz(qId)}
                      className={`${styles.actionBtn} ${styles.cloneBtn}`}
                      title="Clone Quiz"
                    >
                      <BsClipboard size={14}/>
                    </button>

                    <button
                      onClick={() => deleteQuiz(qId, quiz.title)}
                      className={`${styles.actionBtn} ${styles.deleteBtn}`}
                      title="Delete"
                    >
                      <BsTrash size={14}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail / Edit Drawer */}
      {viewQuiz && (
        <QuizDrawer
          quiz={viewQuiz}
          onClose={() => setViewQuiz(null)}
          onUpdate={handleUpdate}
          onDelete={deleteQuiz}
          onTogglePublish={togglePublish}
          onClone={cloneQuiz}
          onShare={shareQuiz}
        />
      )}

      {/* Share Quiz Popup Modal */}
      {shareModalData && (
        <ShareModal
          quizId={shareModalData.id}
          quizTitle={shareModalData.title}
          onClose={() => setShareModalData(null)}
        />
      )}
    </Layout>
  );
}
