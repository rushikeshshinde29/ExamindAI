import React, { useState } from 'react';
import { Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FiUser, FiMail, FiPhone, FiBook, FiBriefcase, FiLock, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import { authApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});
  const [profile, setProfile] = useState({
    name: user?.name || '',
    department: user?.department || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    designation: user?.designation || '',
    specialization: user?.specialization || '',
    course: user?.course || '',
    enrollmentYear: user?.enrollmentYear || '',
  });

  const saveProfile = async () => {
    if (!profile.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const r = await authApi.updateProfile(profile);
      if (r.data.success) { updateUser(r.data.user); toast.success('Profile updated!'); }
    } catch { toast.error('Update failed'); } finally { setSaving(false); }
  };

  const validatePw = () => {
    const e = {};
    if (!pwForm.currentPassword) e.curr = 'Required';
    if (pwForm.newPassword.length < 6) e.new = 'Min 6 characters';
    if (pwForm.newPassword !== pwForm.confirm) e.confirm = 'Passwords do not match';
    setPwErrors(e);
    return !Object.keys(e).length;
  };

  const savePassword = async () => {
    if (!validatePw()) return;
    setSaving(true);
    try {
      const r = await authApi.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      if (r.data.success) { toast.success('Password changed!'); setPwForm({ currentPassword: '', newPassword: '', confirm: '' }); }
      else toast.error(r.data.message);
    } catch { toast.error('Failed to change password'); } finally { setSaving(false); }
  };

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';

  const field = (label, key, icon, type = 'text', placeholder = '') => (
    <div style={{ marginBottom: 16 }}>
      <label className="form-label-custom">{label}</label>
      <div className="input-icon-wrap">
        {icon && React.createElement(icon, { className: 'input-icon' })}
        <input className="form-control-custom" type={type} placeholder={placeholder}
          value={profile[key]} onChange={e => setProfile(p => ({ ...p, [key]: e.target.value }))}
          style={icon ? {} : { paddingLeft: 14 }} />
      </div>
    </div>
  );

  return (
    <AppLayout title="My Profile">
      <div style={{ maxWidth: 700, margin: '0 auto' }}>
        {/* Avatar Header */}
        <div className="qmp-card" style={{ marginBottom: 20, overflow: 'hidden' }}>
          <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', height: 80 }} />
          <div style={{ padding: '0 24px 20px', position: 'relative' }}>
            <div className="avatar xl" style={{ marginTop: -36, border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,.1)' }}>
              {user?.name?.charAt(0)}
            </div>
            <div style={{ marginTop: 12 }}>
              <h5 style={{ fontWeight: 800, margin: '0 0 4px' }}>{user?.name}</h5>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span className={`role-pill role-${user?.role}`}>{user?.role}</span>
                <span style={{ color: 'var(--gray)', fontSize: '.85rem' }}>{user?.email}</span>
              </div>
              {isStudent && (
                <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                  {[['🏆', user?.totalPoints, 'Points'], ['⚡', user?.level, 'Level'], ['🔥', user?.streak, 'Streak']].map(([ic, val, lbl]) => (
                    <div key={lbl} style={{ textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{ic} {val}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--gray)' }}>{lbl}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'white', borderRadius: 10, padding: 4, border: '1px solid var(--border)' }}>
          {[['profile', '👤 Edit Profile'], ['password', '🔒 Change Password']].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '10px', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: '.875rem', cursor: 'pointer', background: tab === t ? 'var(--primary)' : 'transparent', color: tab === t ? 'white' : 'var(--gray)', transition: 'all .2s' }}>
              {l}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === 'profile' && (
          <div className="qmp-card">
            <div className="qmp-card-body">
              <Row>
                <Col md={6}>{field('Full Name *', 'name', FiUser, 'text', 'Your name')}</Col>
                <Col md={6}>{field('Department', 'department', FiBook, 'text', 'Your department')}</Col>
                <Col md={6}>{field('Phone', 'phone', FiPhone, 'tel', '+91 XXXXXXXXXX')}</Col>
                {isStudent && <Col md={6}>{field('Course', 'course', null, 'text', 'e.g. B.Tech CSE')}</Col>}
                {isStudent && <Col md={6}>{field('Enrollment Year', 'enrollmentYear', null, 'text', 'e.g. 2022')}</Col>}
                {isFaculty && <Col md={6}>{field('Designation', 'designation', FiBriefcase, 'text', 'e.g. Associate Professor')}</Col>}
                {isFaculty && <Col md={12}>{field('Specialization', 'specialization', null, 'text', 'e.g. Machine Learning, Algorithms')}</Col>}
                <Col md={12}>
                  <label className="form-label-custom">Bio</label>
                  <textarea className="form-control-custom" rows={3} placeholder="Tell us about yourself..." value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))} />
                </Col>
              </Row>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button onClick={saveProfile} className="btn-primary-custom" style={{ padding: '11px 24px', display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : <><FiSave /> Save Changes</>}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Password Tab */}
        {tab === 'password' && (
          <div className="qmp-card">
            <div className="qmp-card-body">
              <div style={{ background: 'var(--primary-light)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '.875rem', color: 'var(--primary-dark)' }}>
                🔐 Use a strong password with letters, numbers, and special characters.
              </div>
              {[['currentPassword', 'Current Password', 'curr'], ['newPassword', 'New Password', 'new'], ['confirm', 'Confirm New Password', 'confirm']].map(([k, lbl, ek]) => (
                <div key={k} style={{ marginBottom: 16, position: 'relative' }}>
                  <label className="form-label-custom">{lbl}</label>
                  <div style={{ position: 'relative' }}>
                    <FiLock style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-light)' }} />
                    <input className={`form-control-custom ${pwErrors[ek] ? 'border-danger' : ''}`}
                      type={showPw ? 'text' : 'password'} placeholder="••••••••"
                      value={pwForm[k]} onChange={e => setPwForm(p => ({ ...p, [k]: e.target.value }))}
                      style={{ paddingLeft: 38, paddingRight: 40 }} />
                    <button onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                      {showPw ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                  {pwErrors[ek] && <div style={{ color: 'var(--danger)', fontSize: '.78rem', marginTop: 4 }}>{pwErrors[ek]}</div>}
                </div>
              ))}
              <button onClick={savePassword} className="btn-primary-custom" style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
                {saving ? <Spinner size="sm" /> : <><FiLock /> Change Password</>}
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};
