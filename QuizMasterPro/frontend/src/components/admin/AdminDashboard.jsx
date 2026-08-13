import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Spinner, Modal, Form } from 'react-bootstrap';
import { FiUsers, FiBookOpen, FiAward, FiActivity, FiPlus, FiTrash2, FiToggleRight, FiToggleLeft, FiSearch } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { adminApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import toast from 'react-hot-toast';

// ── ADMIN DASHBOARD ───────────────────────────────────────────
export const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    adminApi.stats().then(r => setStats(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout title="Admin Dashboard"><div className="qmp-spinner" /></AppLayout>;

  const pieData = [
    { name: 'Students', value: stats?.totalStudents || 0, color: '#E8730A' },
    { name: 'Faculty', value: stats?.totalFaculty || 0, color: '#F2994A' },
  ];

  return (
    <AppLayout title="Admin Dashboard">
      {/* Header Banner */}
      <div style={{ background: 'linear-gradient(135deg, var(--dark), var(--dark-2))', borderRadius: 16, padding: '24px 28px', marginBottom: 24, color: 'white' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, fontSize: '1.35rem' }}>🛡️ Admin Control Panel</h4>
            <p style={{ margin: '6px 0 0', opacity: .7, fontSize: '.9rem' }}>Full system overview — QuizMaster Pro</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => navigate('/admin/add-user')} style={{ background: 'var(--primary)', border: 'none', color: 'white', padding: '9px 18px', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiPlus /> Add User
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <Row className="g-3 mb-4">
        {[
          { icon: '🎓', val: stats?.totalStudents ?? 0, label: 'Total Students', color: 'indigo', link: '/admin/students' },
          { icon: '👨‍🏫', val: stats?.totalFaculty ?? 0, label: 'Faculty Members', color: 'amber', link: '/admin/faculty' },
          { icon: '📝', val: stats?.totalQuizzes ?? 0, label: 'Total Quizzes', color: 'green', link: '/admin/quizzes' },
          { icon: '✅', val: stats?.publishedQuizzes ?? 0, label: 'Published Quizzes', color: 'cyan', link: '/admin/quizzes' },
          { icon: '📊', val: stats?.totalAttempts ?? 0, label: 'Total Attempts', color: 'rose', link: null },
          { icon: '🎓', val: stats?.totalCertificates ?? 0, label: 'Certificates Issued', color: 'indigo', link: null },
          { icon: '✅', val: `${stats?.overallPassRate ?? 0}%`, label: 'Pass Rate', color: 'green', link: null },
          { icon: '⭐', val: `${stats?.averageScore ?? 0}%`, label: 'Avg Score', color: 'amber', link: null },
        ].map(s => (
          <Col xs={6} md={3} key={s.label}>
            <div className={`stat-card ${s.color}`} style={{ cursor: s.link ? 'pointer' : 'default' }} onClick={() => s.link && navigate(s.link)}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-value">{s.val}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Row className="g-3 mb-3">
        {/* Top Quizzes */}
        <Col lg={7}>
          <div className="qmp-card">
            <div className="qmp-card-header" style={{ paddingBottom: 16 }}>
              <h6 style={{ fontWeight: 700, margin: 0 }}>Top Performing Quizzes</h6>
            </div>
            <div className="qmp-card-body" style={{ paddingTop: 0 }}>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats?.topQuizzes || []}>
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={v => [v, 'Attempts']} />
                  <Bar dataKey="attemptCount" fill="var(--primary)" radius={[4, 4, 0, 0]} name="Attempts" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>

        {/* User Distribution */}
        <Col lg={5}>
          <div className="qmp-card">
            <div className="qmp-card-header" style={{ paddingBottom: 16 }}>
              <h6 style={{ fontWeight: 700, margin: 0 }}>User Distribution</h6>
            </div>
            <div className="qmp-card-body" style={{ paddingTop: 0 }}>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value">
                    {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Col>
      </Row>

      {/* Top Students */}
      <div className="qmp-card">
        <div className="qmp-card-header" style={{ paddingBottom: 12 }}>
          <h6 style={{ fontWeight: 700, margin: 0 }}>🏆 Top Students (by Points)</h6>
        </div>
        <div className="qmp-card-body" style={{ paddingTop: 0 }}>
          <table className="qmp-table">
            <thead><tr><th>Rank</th><th>Student</th><th>Department</th><th>Points</th><th>Level</th></tr></thead>
            <tbody>
              {(stats?.topStudents || []).map((s, i) => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 700, color: i < 3 ? 'var(--warning)' : 'var(--gray)' }}>#{i + 1}</td>
                  <td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar">{s.name.charAt(0)}</div><span style={{ fontWeight: 600 }}>{s.name}</span></div></td>
                  <td style={{ color: 'var(--gray)', fontSize: '.875rem' }}>{s.department || '—'}</td>
                  <td><strong style={{ color: 'var(--primary)' }}>{s.totalPoints}</strong></td>
                  <td><span style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '3px 10px', borderRadius: 20, fontSize: '.75rem', fontWeight: 700 }}>L{s.level}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppLayout>
  );
};

// ── USER MANAGEMENT ───────────────────────────────────────────
export const UserManagement = ({ roleType }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = () => {
    adminApi.users(roleType, { search, limit: 100 }).then(r => setUsers(r.data.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [roleType]);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  const toggleBan = async (user) => {
    await adminApi.updateStatus(user.id, { isBanned: !user.isBanned, banReason: !user.isBanned ? 'Banned by admin' : '' });
    toast.success(user.isBanned ? 'User unbanned' : 'User banned');
    load();
  };

  const toggleActive = async (user) => {
    await adminApi.updateStatus(user.id, { isActive: !user.isActive });
    toast.success(user.isActive ? 'Account deactivated' : 'Account activated');
    load();
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user permanently?')) return;
    await adminApi.deleteUser(id);
    toast.success('User deleted');
    load();
  };

  const title = roleType === 'student' ? 'Students' : 'Faculty';

  return (
    <AppLayout title={`Manage ${title}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{title} Management</h5>
          <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>{users.length} total</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ position: 'relative' }}>
            <FiSearch style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
            <input className="form-control-custom" placeholder="Search name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 34, width: 220 }} />
          </div>
          <button onClick={() => navigate('/admin/add-user')} className="btn-primary-custom" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <FiPlus /> Add {roleType === 'student' ? 'Student' : 'Faculty'}
          </button>
        </div>
      </div>

      {loading ? <div className="qmp-spinner" /> : (
        <div className="qmp-card">
          <table className="qmp-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>{roleType === 'student' ? 'Department / Course' : 'Designation'}</th>
                <th>Status</th>
                <th>{roleType === 'student' ? 'Points' : 'Joined'}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{u.name.charAt(0)}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '.875rem' }}>{u.name}</div>
                        {u.lastLogin && <div style={{ fontSize: '.72rem', color: 'var(--gray)' }}>Last login: {new Date(u.lastLogin).toLocaleDateString()}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '.875rem', color: 'var(--gray)' }}>{u.email}</td>
                  <td style={{ fontSize: '.875rem' }}>{u.department || '—'}</td>
                  <td>
                    {u.isBanned ? <span className="status-banned">Banned</span>
                      : u.isActive ? <span className="status-active">Active</span>
                      : <span className="status-inactive">Inactive</span>}
                  </td>
                  <td>
                    {roleType === 'student'
                      ? <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{u.totalPoints} pts</span>
                      : <span style={{ fontSize: '.8rem', color: 'var(--gray)' }}>{new Date(u.createdAt).toLocaleDateString()}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button onClick={() => toggleActive(u)} title={u.isActive ? 'Deactivate' : 'Activate'}
                        style={{ padding: '5px 8px', border: 'none', borderRadius: 6, background: u.isActive ? '#d1fae5' : 'var(--bg)', cursor: 'pointer', color: u.isActive ? 'var(--success)' : 'var(--gray)', fontSize: '.9rem' }}>
                        {u.isActive ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                      <button onClick={() => toggleBan(u)} title={u.isBanned ? 'Unban' : 'Ban'}
                        style={{ padding: '5px 8px', border: 'none', borderRadius: 6, background: u.isBanned ? '#ffe4e6' : 'var(--bg)', cursor: 'pointer', color: u.isBanned ? 'var(--danger)' : 'var(--gray)', fontSize: '.75rem', fontWeight: 600 }}>
                        {u.isBanned ? 'Unban' : 'Ban'}
                      </button>
                      <button onClick={() => deleteUser(u.id)} title="Delete"
                        style={{ padding: '5px 8px', border: 'none', borderRadius: 6, background: '#ffe4e6', cursor: 'pointer', color: 'var(--danger)' }}>
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={6}><div className="empty-state" style={{ padding: 40 }}><div className="empty-state-icon">👥</div><p>No {title.toLowerCase()} found</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </AppLayout>
  );
};

// ── ADD USER ──────────────────────────────────────────────────
export const AddUserPage = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '', department: '', studentId: '', employeeId: '', designation: '', course: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Required';
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'Invalid email';
    if (form.password.length < 6) e.password = 'Min 6 chars';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async e => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await adminApi.createUser({ ...form, role });
      toast.success(`${role} created!`);
      navigate(role === 'student' ? '/admin/students' : '/admin/faculty');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create user');
    } finally { setLoading(false); }
  };

  const field = (label, name, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 14 }}>
      <label className="form-label-custom">{label}</label>
      <input className={`form-control-custom ${errors[name] ? 'border-danger' : ''}`}
        type={type} placeholder={placeholder} value={form[name]} onChange={e => set(name, e.target.value)} />
      {errors[name] && <div style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>{errors[name]}</div>}
    </div>
  );

  return (
    <AppLayout title="Add User">
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div style={{ marginBottom: 20 }}>
          <h5 style={{ fontWeight: 700, margin: 0 }}>Add New User</h5>
          <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>Create student or faculty account</p>
        </div>

        <div className="qmp-card">
          <div className="qmp-card-body">
            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {['student', 'faculty'].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  style={{ flex: 1, padding: '10px', border: `2px solid ${role === r ? 'var(--primary)' : 'var(--border)'}`, borderRadius: 10, fontWeight: 600, fontSize: '.875rem', background: role === r ? 'var(--primary-light)' : 'white', color: role === r ? 'var(--primary-dark)' : 'var(--gray)', cursor: 'pointer', transition: 'all .2s' }}>
                  {r === 'student' ? '🎓 Student' : '👨‍🏫 Faculty'}
                </button>
              ))}
            </div>

            <form onSubmit={submit}>
              {field('Full Name *', 'name', 'text', 'Full name')}
              {field('Email Address *', 'email', 'email', 'email@example.com')}
              {field('Password *', 'password', 'password', 'Min. 6 characters')}
              {field('Department', 'department', 'text', 'e.g. Computer Science')}
              {field('Phone', 'phone', 'tel', '+91 XXXXXXXXXX')}
              {role === 'student' && field('Student ID', 'studentId', 'text', 'e.g. CS2024001')}
              {role === 'student' && field('Course', 'course', 'text', 'e.g. B.Tech CSE')}
              {role === 'faculty' && field('Employee ID', 'employeeId', 'text', 'e.g. FAC001')}
              {role === 'faculty' && field('Designation', 'designation', 'text', 'e.g. Assistant Professor')}

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button type="button" onClick={() => navigate(-1)} style={{ flex: 1, padding: 12, border: '1.5px solid var(--border)', borderRadius: 8, background: 'white', fontWeight: 600, cursor: 'pointer', color: 'var(--gray)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary-custom" style={{ flex: 2, padding: 12 }} disabled={loading}>
                  {loading ? <Spinner size="sm" /> : `Create ${role.charAt(0).toUpperCase() + role.slice(1)}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
