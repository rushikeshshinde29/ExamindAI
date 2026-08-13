import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from './Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BsPlus, BsSearch, BsPencil, BsTrash, BsX, BsSave,
  BsPersonCheck, BsPersonX, BsLock, BsFunnel, BsEnvelope, BsEye, BsSlashCircle
} from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AdminUsers.module.css';
import { useDialog } from '../../context/DialogContext';

const ROLES = ['student', 'faculty', 'admin'];
const ROLE_STYLE = {
  admin: { bg: '#fef9c3', color: '#854d0e', label: '👑 Admin' },
  faculty: { bg: '#eff6ff', color: '#2563eb', label: '👨‍🏫 Faculty' },
  student: { bg: '#dcfce7', color: '#15803d', label: '🎓 Student' },
};

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', department: '', studentId: '', employeeId: '', phone: '', semester: '', division: '' };

export default function AdminUsers() {
  const { confirm } = useDialog();
  const { t } = usePreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    return (roleParam && ['student', 'faculty', 'admin'].includes(roleParam)) ? roleParam : '';
  });
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [resetPwd, setResetPwd] = useState('');
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [userDetails, setUserDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const handleImportCsv = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return toast.error('CSV data is empty');
    setImporting(true);
    try {
      const res = await api.post('/admin/users/import-csv', { csvData: csvText });
      toast.success(res.data.message);
      setShowCsvModal(false);
      setCsvText('');
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to import CSV');
    } finally {
      setImporting(false);
    }
  };

  const LIMIT = 15;

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: LIMIT };
    if (search) params.search = search;
    if (roleFilter) params.role = roleFilter;
    api.get('/admin/users', { params })
      .then(r => { setUsers(r.data.data); setTotal(r.data.total); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, search, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [search, roleFilter]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const roleParam = params.get('role');
    if (roleParam && ['student', 'faculty', 'admin'].includes(roleParam)) {
      setRoleFilter(roleParam);
    } else {
      setRoleFilter('');
    }
  }, [location.search]);

  const openCreate = () => { setForm(EMPTY_FORM); setEditId(null); setModal('create'); };
  const openEdit = (u) => {
    setForm({
      name: u.name, email: u.email, password: '', role: u.role,
      department: u.department || '', studentId: u.studentId || '',
      employeeId: u.employeeId || '', phone: u.phone || '',
      semester: u.semester || '', division: u.division || ''
    });
    setEditId(u.id);
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setEditId(null); setForm(EMPTY_FORM); setResetPwd(''); setUserDetails(null); };

  const openDetails = async (u) => {
    setModal('details');
    setUserDetails(null);
    setLoadingDetails(true);
    try {
      const res = await api.get(`/admin/users/${u.id}`);
      setUserDetails(res.data.data);
    } catch (err) {
      toast.error('Failed to load user details');
      closeModal();
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) return toast.error('Name, email and password required');
    setSaving(true);
    try {
      const res = await api.post('/admin/users', form);
      toast.success('User created!');
      setUsers(u => [res.data.data, ...u]);
      setTotal(t => t + 1);
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/admin/users/${editId}`, form);
      toast.success('User updated!');
      setUsers(u => u.map(x => x.id === editId ? res.data.data : x));
      closeModal();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleBan = async (u) => {
    if (!await confirm(`${u.isBanned ? 'Unban' : 'Ban'} ${u.name}?`, `${u.isBanned ? 'Unban' : 'Ban'} User`)) return;
    try {
      const res = await api.patch(`/admin/users/${u.id}/ban`, { reason: 'Banned by admin' });
      setUsers(us => us.map(x => x.id === u.id ? res.data.data : x));
      toast.success(res.data.message);
    } catch (err) { toast.error('Failed'); }
  };

  const handleToggleActive = async (u) => {
    try {
      const res = await api.patch(`/admin/users/${u.id}/toggle-active`);
      setUsers(us => us.map(x => x.id === u.id ? res.data.data : x));
      toast.success(res.data.message);
    } catch (err) { toast.error('Failed'); }
  };

  const handleDelete = async (u) => {
    if (!await confirm(`Permanently delete ${u.name}? This cannot be undone.`, "Delete User")) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      setUsers(us => us.filter(x => x.id !== u.id));
      setTotal(t => t - 1);
      toast.success('User deleted');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleResetPwd = async () => {
    if (!resetPwd || resetPwd.length < 6) return toast.error('Password must be at least 6 chars');
    setSaving(true);
    try {
      await api.patch(`/admin/users/${editId}/reset-password`, { newPassword: resetPwd });
      toast.success('Password reset!');
      closeModal();
    } catch (err) { toast.error('Failed'); }
    finally { setSaving(false); }
  };

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const pages = Math.ceil(total / LIMIT);

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <div><h1>{t('manageUsers')}</h1><p>{total} {t('manageUsersSub')}</p></div>
          <button className={styles.addBtn} onClick={openCreate}><BsPlus size={15} /> {t('addNewUser')}</button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchWrap}>
            <BsSearch className={styles.si} />
            <input placeholder="Search name, email, ID..." value={search} onChange={e => setSearch(e.target.value)} />
            {search && <button className={styles.clearSearch} onClick={() => setSearch('')}>✕</button>}
          </div>
          <div className={styles.roleFilter}>
            <BsFunnel size={14} />
            {['', 'student', 'faculty', 'admin'].map(r => (
              <button key={r} className={`${styles.rBtn} ${roleFilter === r ? styles.rBtnActive : ''}`}
                onClick={() => {
                  if (r) {
                    navigate(`/admin/users?role=${r}`);
                  } else {
                    navigate('/admin/users');
                  }
                }}>
                {r ? ROLE_STYLE[r].label : 'All Roles'}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? <div className={styles.center}><div className="spinner" /></div> : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.colNum}>#</th>
                  <th className={styles.colName}>Name</th>
                  <th className={styles.colEmail}>Email</th>
                  <th className={styles.colRole}>Role</th>
                  <th className={styles.colStatus}>Status</th>
                  <th className={styles.colJoined}>Joined</th>
                  <th className={styles.colActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => {
                  const rs = ROLE_STYLE[u.role] || ROLE_STYLE.student;
                  return (
                    <tr key={u.id}>
                      <td className={styles.num}>{(page - 1) * LIMIT + i + 1}</td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.av} style={{
                            background:
                              u.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                                u.role === 'faculty' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' :
                                  'linear-gradient(135deg,#2563eb,#0ea5e9)'
                          }}>
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span>{u.name}</span>
                        </div>
                      </td>
                      <td className={styles.email}>{u.email}</td>
                      <td>
                        <span className={styles.roleBadge} data-role={u.role} style={{ background: rs.bg, color: rs.color }}>
                          {rs.label}
                        </span>
                      </td>

                      <td>
                        {u.isBanned ? <span className={styles.banned}>Banned</span>
                          : u.isActive ? <span className={styles.active}>Active</span>
                            : <span className={styles.inactive}>Inactive</span>}
                      </td>
                      <td className={styles.date}>
                        {new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className={styles.colActions}>
                        <div className={styles.actions}>
                          <button onClick={() => openDetails(u)} className={styles.aBtn} title="View Details">
                            <BsEye size={13} />
                          </button>
                          <button onClick={() => openEdit(u)} className={styles.aBtn} title="Edit">
                            <BsPencil size={13} />
                          </button>
                          <button onClick={() => { setEditId(u.id); setModal('reset'); }} className={styles.aBtn} title="Reset Password">
                            <BsLock size={13} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(u)}
                            className={`${styles.aBtn} ${!u.isActive ? styles.aBtnGreen : ''}`}
                            title={u.role === 'admin' ? 'Cannot deactivate administrator' : u.isActive ? 'Deactivate' : 'Activate'}
                            disabled={u.role === 'admin'}
                          >
                            {u.isActive ? <BsPersonX size={13} /> : <BsPersonCheck size={13} />}
                          </button>
                          <button
                            onClick={() => handleBan(u)}
                            className={`${styles.aBtn} ${u.isBanned ? styles.aBtnGreen : styles.aBtnAmber}`}
                            title={u.role === 'admin' ? 'Cannot ban administrator' : u.isBanned ? 'Unban' : 'Ban'}
                            disabled={u.role === 'admin'}
                          >
                            <BsSlashCircle size={13} />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            className={`${styles.aBtn} ${styles.aBtnRed}`}
                            title={u.role === 'admin' ? 'Cannot delete administrator' : 'Delete'}
                            disabled={u.role === 'admin'}
                          >
                            <BsTrash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {!users.length && <tr><td colSpan="8" className={styles.noData}>No users found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className={styles.pagination}>
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className={styles.pgBtn}>← Prev</button>
            <span>Page {page} of {pages}</span>
            <button disabled={page === pages} onClick={() => setPage(p => p + 1)} className={styles.pgBtn}>Next →</button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {(modal === 'create' || modal === 'edit') && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal}>
            <div className={styles.modalHead}>
              <h2>{modal === 'create' ? 'Add New User' : 'Edit User'}</h2>
              <button onClick={closeModal}><BsX size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.grid2}>
                <div className={styles.field}><label>Full Name *</label><input value={form.name} onChange={set('name')} placeholder="Full name" /></div>
                <div className={styles.field}><label>Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="email@example.com" disabled={modal === 'edit'} /></div>
                {modal === 'create' && <div className={styles.field}><label>Password *</label><input type="password" value={form.password} onChange={set('password')} placeholder="Min 6 characters" /></div>}
                <div className={styles.field}>
                  <label>Role *</label>
                  <select value={form.role} onChange={set('role')}>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_STYLE[r]?.label || r}</option>)}
                  </select>
                </div>
                <div className={styles.field}><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+91 9999999999" /></div>
                <div className={styles.field}><label>Department</label><input value={form.department} onChange={set('department')} placeholder="e.g. Computer Science" /></div>
                
                {/* Student specific fields */}
                {form.role === 'student' && (
                  <>
                    <div className={styles.field}><label>Student ID *</label><input value={form.studentId} onChange={set('studentId')} placeholder="Roll number" /></div>
                    <div className={styles.field}><label>Semester</label><input value={form.semester} onChange={set('semester')} placeholder="e.g. 5" /></div>
                    <div className={styles.field}><label>Division</label><input value={form.division} onChange={set('division')} placeholder="e.g. A" /></div>
                  </>
                )}

                {/* Faculty specific fields */}
                {form.role === 'faculty' && (
                  <div className={styles.field}><label>Employee ID *</label><input value={form.employeeId} onChange={set('employeeId')} placeholder="Employee ID" /></div>
                )}
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button onClick={closeModal} className={styles.cancelBtn}>Cancel</button>
              <button onClick={modal === 'create' ? handleCreate : handleEdit} className={styles.saveBtn} disabled={saving}>
                {saving ? <span className={styles.spin} /> : <><BsSave size={14} /> {modal === 'create' ? 'Create User' : 'Save Changes'}</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {modal === 'reset' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} style={{ maxWidth: 400 }}>
            <div className={styles.modalHead}>
              <h2><BsLock size={15} /> Reset Password</h2>
              <button onClick={closeModal}><BsX size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.field}>
                <label>New Password</label>
                <input type="password" value={resetPwd} onChange={e => setResetPwd(e.target.value)} placeholder="Min 6 characters" />
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button onClick={closeModal} className={styles.cancelBtn}>Cancel</button>
              <button onClick={handleResetPwd} className={styles.saveBtn} disabled={saving}>
                {saving ? <span className={styles.spin} /> : <><BsLock size={14} /> Reset Password</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {modal === 'details' && (
        <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) closeModal() }}>
          <div className={styles.modal} style={{ maxWidth: 650 }}>
            <div className={styles.modalHead}>
              <h2>👤 User Details</h2>
              <button onClick={closeModal}><BsX size={18} /></button>
            </div>
            <div className={styles.modalBody}>
              {loadingDetails ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
                  <div className="spinner" />
                </div>
              ) : userDetails ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {/* Profile Section */}
                  <div style={{ display: 'flex', gap: 15, alignItems: 'center', borderBottom: '1px solid var(--bg-border)', paddingBottom: 15 }}>
                    <div className={styles.av} style={{
                      width: 56, height: 56, fontSize: '1.5rem',
                      background:
                        userDetails.user.role === 'admin' ? 'linear-gradient(135deg,#f59e0b,#ef4444)' :
                          userDetails.user.role === 'faculty' ? 'linear-gradient(135deg,#7c3aed,#a78bfa)' :
                            'linear-gradient(135deg,#2563eb,#0ea5e9)'
                    }}>
                      {userDetails.user.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{userDetails.user.name}</h3>
                      <p style={{ margin: '2px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{userDetails.user.email}</p>
                    </div>
                  </div>

                  {/* Profile Details Grid */}
                  <div className={styles.grid2} style={{ fontSize: '0.9rem', rowGap: 12 }}>
                    <div><strong>Role:</strong> <span style={{ textTransform: 'capitalize' }}>{userDetails.user.role}</span></div>
                    <div><strong>Status:</strong> {userDetails.user.isBanned ? 'Banned' : userDetails.user.isActive ? 'Active' : 'Inactive'}</div>
                    {userDetails.user.department && <div><strong>Department:</strong> {userDetails.user.department}</div>}
                    {userDetails.user.studentId && <div><strong>Student ID:</strong> {userDetails.user.studentId}</div>}
                    {userDetails.user.employeeId && <div><strong>Employee ID:</strong> {userDetails.user.employeeId}</div>}
                    {userDetails.user.phone && <div><strong>Phone:</strong> {userDetails.user.phone}</div>}
                    {userDetails.user.semester && <div><strong>Semester:</strong> {userDetails.user.semester}</div>}
                    {userDetails.user.division && <div><strong>Division:</strong> {userDetails.user.division}</div>}
                    <div><strong>Email Verified:</strong> {userDetails.user.emailVerified ? 'Yes' : 'No'}</div>
                    <div><strong>Total Points:</strong> {userDetails.user.totalPoints || 0}</div>
                  </div>

                  {/* Quiz Attempts Section */}
                  {userDetails.user.role === 'student' && (
                    <div style={{ marginTop: 15, borderTop: '1px solid var(--bg-border)', paddingTop: 15 }}>
                      <h4 style={{ marginBottom: 10 }}>Recent Quiz Attempts</h4>
                      {!userDetails.attempts?.length ? (
                        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic', fontSize: '0.9rem' }}>No quiz attempts recorded yet.</p>
                      ) : (
                        <div style={{ overflowX: 'auto', maxHeight: 220 }}>
                          <table style={{ minWidth: '100%', fontSize: '0.85rem' }}>
                            <thead>
                              <tr>
                                <th style={{ padding: '6px 8px' }}>Quiz Title</th>
                                <th style={{ padding: '6px 8px' }}>Marks</th>
                                <th style={{ padding: '6px 8px' }}>Percentage</th>
                                <th style={{ padding: '6px 8px' }}>Result</th>
                                <th style={{ padding: '6px 8px' }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {userDetails.attempts.map((att, i) => (
                                <tr key={i}>
                                  <td style={{ padding: '8px' }}>
                                    <strong>{att.quiz?.title || 'Unknown Quiz'}</strong>
                                    {att.quiz?.subject && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{att.quiz.subject}</div>}
                                  </td>
                                  <td style={{ padding: '8px' }}>{att.obtainedMarks}/{att.totalMarks}</td>
                                  <td style={{ padding: '8px' }}>{att.percentage?.toFixed(1)}%</td>
                                  <td style={{ padding: '8px' }}>
                                    <span style={{
                                      padding: '2px 6px', borderRadius: 4, fontWeight: 600, fontSize: '0.75rem',
                                      background: att.isPassed ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                      color: att.isPassed ? '#166534' : '#991b1b'
                                    }}>
                                      {att.isPassed ? 'Pass' : 'Fail'}
                                    </span>
                                  </td>
                                  <td style={{ padding: '8px', color: 'var(--text-secondary)' }}>
                                    {new Date(att.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <p>No details found.</p>
              )}
            </div>
            <div className={styles.modalFoot}>
              <button onClick={closeModal} className={styles.cancelBtn}>Close</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}