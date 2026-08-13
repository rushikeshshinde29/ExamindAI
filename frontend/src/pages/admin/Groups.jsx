import React, { useState, useEffect } from 'react';
import AdminLayout from './Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsPlus, BsX, BsPencil, BsTrash, BsChevronDown, BsChevronUp, BsPersonDash, BsPersonPlus } from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AdminGroups.module.css';
import { useDialog } from '../../context/DialogContext';

export default function AdminGroups() {
  const { confirm } = useDialog();
  const { t } = usePreferences();
  const [groups,  setGroups]  = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [modal,   setModal]   = useState(null); // null|'create'|'edit'|'addStudents'|'addFaculty'
  const [editGrp, setEditGrp] = useState(null);
  const [form,    setForm]    = useState({ name:'', description:'', batch:'', subject:'', semester:'', division:'' });
  const [emailsInput, setEmailsInput] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [saving,  setSaving]  = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  useEffect(() => {
    if (!studentSearch || studentSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api.get('/admin/users', {
        params: {
          role: 'student',
          search: studentSearch.trim(),
          limit: 10
        }
      })
      .then(res => {
        const results = res.data.data || [];
        const existingEmails = new Set((editGrp?.students || []).map(s => s.email?.toLowerCase()));
        const filtered = results.filter(s => !existingEmails.has(s.email?.toLowerCase()));
        setSearchResults(filtered);
      })
      .catch(err => {
        console.error('Error searching students:', err);
      });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [studentSearch, editGrp]);

  const handleAddEmail = (email) => {
    const currentEmails = emailsInput.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!currentEmails.includes(email)) {
      currentEmails.push(email);
      setEmailsInput(currentEmails.join('\n') + '\n');
      toast.success(`Added ${email}`);
    } else {
      toast.error('Email already added');
    }
  };

  const fetchAll = () => {
    Promise.all([api.get('/admin/groups'), api.get('/admin/users', { params:{ role:'faculty', limit:100 } })])
      .then(([gr, fr]) => { setGroups(gr.data.data); setFaculty(fr.data.data); })
      .catch(console.error).finally(() => setLoading(false));
  };
  useEffect(fetchAll, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const createGroup = async () => {
    if (!form.name.trim()) return toast.error('Group name required');
    setSaving(true);
    try {
      const res = await api.post('/admin/groups', form);
      setGroups(g => [res.data.data, ...g]);
      setModal(null); setForm({ name:'', description:'', batch:'', subject:'', semester:'', division:'' });
      toast.success('Group created!');
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setSaving(false); }
  };

  const updateGroup = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/groups/${editGrp.id}`, form);
      setGroups(g => g.map(x => x.id===editGrp.id ? { ...x, ...res.data.data } : x));
      setModal(null); toast.success('Group updated!');
    } catch(err) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const deleteGroup = async (id, name) => {
    if (!await confirm(`Delete group "${name}"?`, "Delete Group")) return;
    try {
      await api.delete(`/admin/groups/${id}`);
      setGroups(g => g.filter(x => x.id !== id));
      toast.success('Deleted');
    } catch(err) { toast.error('Failed'); }
  };

  const addStudents = async (groupId) => {
    const emails = emailsInput.split(/[\n,;]+/).map(e => e.trim()).filter(Boolean);
    if (!emails.length) return toast.error('Enter at least one email');
    setSaving(true);
    try {
      const res = await api.post(`/admin/groups/${groupId}/students`, { emails });
      const r   = res.data.results;
      toast.success(`Added: ${r.added.length} · Pending: ${r.pending.length} · Already in: ${r.alreadyIn.length}`);
      setEmailsInput(''); setModal(null); fetchAll();
    } catch(err) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const removeStudent = async (groupId, userId) => {
    try {
      await api.delete(`/admin/groups/${groupId}/students/${userId}`);
      setGroups(g => g.map(x => x.id===groupId ? {...x, students: x.students.filter(s => s.user?.id!==userId)} : x));
      toast.success('Student removed');
    } catch(err) { toast.error('Failed'); }
  };

  const addFaculty = async (groupId) => {
    if (!selectedFacultyId) return toast.error('Select a faculty member');
    try {
      await api.post(`/admin/groups/${groupId}/faculty`, { facultyId: selectedFacultyId });
      toast.success('Faculty assigned'); setModal(null); fetchAll();
    } catch(err) { toast.error('Failed'); }
  };

  const removeFaculty = async (groupId, facultyId) => {
    try {
      await api.delete(`/admin/groups/${groupId}/faculty/${facultyId}`);
      setGroups(g => g.map(x => x.id===groupId ? {...x, faculty: x.faculty?.filter(f => (f.id||f)!==facultyId)} : x));
      toast.success('Faculty removed');
    } catch(err) { toast.error('Failed'); }
  };

  if (loading) return <AdminLayout><div style={{display:'flex',justifyContent:'center',padding:60}}><div className="spinner"/></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div><h1>{t('manageGroups')}</h1><p>{groups.length} {t('manageGroupsSub')}</p></div>
          <button className={styles.addBtn} onClick={() => { setForm({ name:'', description:'', batch:'', subject:'', semester:'', division:'' }); setModal('create'); }}><BsPlus size={14}/> {t('createGroup')}</button>
        </div>

        {groups.length === 0 ? (
          <div className={styles.empty}><span>👥</span><p>No groups yet. Create your first group!</p></div>
        ) : (
          <div className={styles.list}>
            {groups.map(g => {
              const activeStudents  = g.students?.filter(s => s.status==='active').length  || 0;
              const pendingStudents = g.students?.filter(s => s.status==='pending').length || 0;
              const isOpen = expanded === g.id;
              return (
                <div key={g.id} className={styles.groupCard}>
                  <div className={styles.groupHead}>
                    <div className={styles.groupLeft}>
                      <div className={styles.groupAv}>{g.name.charAt(0)}</div>
                      <div>
                        <div className={styles.groupName}>{g.name}</div>
                        <div className={styles.groupMeta}>
                          {g.batch    && <span>📅 {g.batch}</span>}
                          {g.subject  && <span>📚 {g.subject}</span>}
                          {g.semester && <span>📖 Sem {g.semester}</span>}
                          {g.division && <span>🔤 Div {g.division}</span>}
                          <span>👥 {activeStudents} active{pendingStudents>0?` · ${pendingStudents} pending`:''}</span>
                          <span>👨‍🏫 {g.faculty?.length||0} faculty</span>
                        </div>
                      </div>
                    </div>
                    <div className={styles.groupActions}>
                      <button onClick={() => { setModal('addStudents'); setEditGrp(g); setEmailsInput(''); setStudentSearch(''); setSearchResults([]); }} className={styles.actionBtn}><BsPersonPlus size={13}/> Add Students</button>
                      <button onClick={() => { setModal('addFaculty'); setEditGrp(g); setSelectedFacultyId(''); }} className={styles.actionBtn}><BsPersonPlus size={13}/> Add Faculty</button>
                      <button onClick={() => { setForm({ name:g.name, description:g.description||'', batch:g.batch||'', subject:g.subject||'', semester:g.semester||'', division:g.division||'' }); setEditGrp(g); setModal('edit'); }} className={styles.iconBtn}><BsPencil size={13}/></button>
                      <button onClick={() => deleteGroup(g.id, g.name)} className={`${styles.iconBtn} ${styles.iconBtnRed}`}><BsTrash size={13}/></button>
                      <button onClick={() => setExpanded(isOpen?null:g.id)} className={styles.iconBtn}>{isOpen?<BsChevronUp size={15}/>:<BsChevronDown size={15}/>}</button>
                    </div>
                  </div>
                  {isOpen && (
                    <div className={styles.groupBody}>
                      <div className={styles.section}>
                        <div className={styles.sectionTitle}>👨‍🏫 Faculty</div>
                        {!g.faculty?.length ? <p className={styles.noItem}>No faculty assigned</p> : (
                          <div className={styles.memberList}>
                            {g.faculty.map(f => (
                              <div key={f.id||f} className={styles.memberRow}>
                                <div className={styles.memberAv} style={{background:'linear-gradient(135deg,#7c3aed,#a78bfa)'}}>{f.name?.charAt(0)||'F'}</div>
                                <div><div className={styles.memberName}>{f.name}</div><small>{f.email}</small></div>
                                <button onClick={() => removeFaculty(g.id, f.id||f)} className={styles.removeBtn}><BsPersonDash size={12}/></button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className={styles.section}>
                        <div className={styles.sectionTitle}>🎓 Students ({g.students?.length||0})</div>
                        {!g.students?.length ? <p className={styles.noItem}>No students added</p> : (
                          <div className={styles.studentTable}>
                            <div className={styles.studentHead}><span>Name</span><span>Email</span><span>Status</span><span></span></div>
                            {g.students.map((s,i) => (
                              <div key={i} className={styles.studentRow}>
                                <span className={styles.sName}>{s.user?.name||'—'}</span>
                                <span className={styles.sEmail}>{s.email}</span>
                                <span className={`${styles.sBadge} ${s.status==='active'?styles.sActive:styles.sPending}`}>{s.status==='active'?'✅ Active':'⏳ Pending'}</span>
                                <span>{s.user && <button onClick={()=>removeStudent(g.id,s.user.id)} className={styles.removeBtn}><BsPersonDash size={12}/></button>}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Group Modal */}
      {(modal==='create'||modal==='edit') && (
        <div className={styles.overlay} onClick={e=>{if(e.target===e.currentTarget){setModal(null)}}}>
          <div className={styles.modal}>
            <div className={styles.modalHead}><h2>{modal==='create'?'Create Group':'Edit Group'}</h2><button onClick={()=>setModal(null)}><BsX size={18}/></button></div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.field}><label>Group Name *</label><input value={form.name} onChange={set('name')} placeholder="e.g. SE Computer A"/></div>
                <div className={styles.field}><label>Batch</label><input value={form.batch} onChange={set('batch')} placeholder="e.g. 2024-25"/></div>
                <div className={styles.field}><label>Subject</label><input value={form.subject} onChange={set('subject')} placeholder="e.g. Data Structures"/></div>
                <div className={styles.field}><label>Semester</label><input value={form.semester} onChange={set('semester')} placeholder="e.g. 5"/></div>
                <div className={styles.field}><label>Division</label><input value={form.division} onChange={set('division')} placeholder="e.g. A"/></div>
                <div className={styles.field}><label>Description</label><input value={form.description} onChange={set('description')} placeholder="Optional description"/></div>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button onClick={()=>setModal(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={modal==='create'?createGroup:updateGroup} className={styles.saveBtn} disabled={saving}>
                {saving?<span className={styles.spin}/>:<><BsPlus size={14}/> {modal==='create'?'Create':'Save'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {modal==='addStudents' && editGrp && (
        <div className={styles.overlay} onClick={e=>{if(e.target===e.currentTarget){setModal(null)}}}>
          <div className={styles.modal}>
            <div className={styles.modalHead}><h2>Add Students — {editGrp.name}</h2><button onClick={()=>setModal(null)}><BsX size={18}/></button></div>
            <div className={styles.modalBody}>
              {/* Student Search Bar */}
              <div className={styles.field} style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', display: 'block' }}>
                  Search Registered Students
                </label>
                <input 
                  type="text" 
                  value={studentSearch} 
                  onChange={e => setStudentSearch(e.target.value)} 
                  placeholder="Type name or email to search..."
                  className={styles.searchInput}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1.5px solid var(--gray-200)',
                    borderRadius: '9px',
                    fontSize: '0.875rem',
                    outline: 'none',
                    background: 'white',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Search Results Dropdown/Box */}
              {searchResults.length > 0 && (
                <div style={{
                  maxHeight: '125px',
                  overflowY: 'auto',
                  border: '1.5px solid var(--gray-200)',
                  borderRadius: '9px',
                  padding: '4px',
                  background: 'var(--gray-50)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  marginBottom: '12px'
                }}>
                  {searchResults.map(s => (
                    <div key={s.id} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '6px 10px',
                      background: 'white',
                      borderRadius: '6px',
                      border: '1px solid var(--gray-100)',
                      fontSize: '0.8rem'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--gray-800)' }}>{s.name}</strong>{' '}
                        <span style={{ color: 'var(--gray-500)' }}>({s.email})</span>
                      </div>
                      <button 
                        type="button"
                        onClick={() => handleAddEmail(s.email)}
                        style={{
                          padding: '3px 8px',
                          background: '#eff6ff',
                          border: '1px solid #bfdbfe',
                          color: 'var(--primary)',
                          borderRadius: '5px',
                          fontWeight: 800,
                          fontSize: '0.75rem',
                          cursor: 'pointer'
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <p className={styles.hint}>Enter student emails (one per line, or comma/semicolon separated). Students not yet registered will be marked <strong>Pending</strong>.</p>
              <textarea className={styles.emailArea} value={emailsInput} onChange={e=>setEmailsInput(e.target.value)} rows={6} placeholder={"student1@email.com\nstudent2@email.com\nstudent3@email.com"}/>
            </div>
            <div className={styles.modalFoot}>
              <button onClick={()=>setModal(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={()=>addStudents(editGrp.id)} className={styles.saveBtn} disabled={saving}>{saving?<span className={styles.spin}/>:<><BsPersonPlus size={14}/> Add Students</>}</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Faculty Modal */}
      {modal==='addFaculty' && editGrp && (
        <div className={styles.overlay} onClick={e=>{if(e.target===e.currentTarget){setModal(null)}}}>
          <div className={styles.modal} style={{maxWidth:420}}>
            <div className={styles.modalHead}><h2>Assign Faculty — {editGrp.name}</h2><button onClick={()=>setModal(null)}><BsX size={18}/></button></div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>Select Faculty</label>
                <select value={selectedFacultyId} onChange={e=>setSelectedFacultyId(e.target.value)}>
                  <option value="">— Choose faculty member —</option>
                  {faculty.map(f => <option key={f.id} value={f.id}>{f.name} ({f.email})</option>)}
                </select>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button onClick={()=>setModal(null)} className={styles.cancelBtn}>Cancel</button>
              <button onClick={()=>addFaculty(editGrp.id)} className={styles.saveBtn}><BsPersonPlus size={14}/> Assign</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
