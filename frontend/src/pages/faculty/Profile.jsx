import React, { useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import {
  BsPerson, BsEnvelope, BsBook, BsSave, BsLock, BsCheckCircle
} from 'react-icons/bs';
import styles from './Profile.module.css';

const getPasswordStrength = (pwd) => {
  if (!pwd) return { score: 0, label: '', color: 'transparent' };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd) || /[^A-Za-z0-9]/.test(pwd)) score++;
  
  switch(score) {
    case 1: return { score: 25, label: 'Weak', color: '#ef4444' };
    case 2: return { score: 50, label: 'Fair', color: '#f97316' };
    case 3: return { score: 75, label: 'Good', color: '#eab308' };
    case 4: return { score: 100, label: 'Strong', color: '#10b981' };
    default: return { score: 10, label: 'Very Weak', color: '#ef4444' };
  }
};

export default function FacultyProfile() {
  const { user, updateUser } = useAuth();
  const [form, setForm]   = useState({ name: user?.name || '', department: user?.department || '' });
  const [pwd, setPwd]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving]         = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.put('/auth/profile', form);
      updateUser(res.data.user);
      toast.success('Profile updated!');
    } catch(err) { toast.error(err.response?.data?.message || 'Update failed'); }
    finally { setSaving(false); }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirmPassword) return toast.error('Passwords do not match');
    if (pwd.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setChangingPwd(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwd.currentPassword, newPassword: pwd.newPassword });
      toast.success('Password changed successfully!');
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch(err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setChangingPwd(false); }
  };

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.hero}>
          <div className={styles.heroAvatar}>{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div className={styles.heroInfo}>
            <h1>{user?.name}</h1>
            <p>{user?.email} · <span className={styles.roleBadge}>Faculty</span></p>
            {user?.department && <p className={styles.deptTag}>{user.department}</p>}
          </div>
        </div>

        <div className={styles.grid2}>
          <div className={styles.card}>
            <h2><BsPerson size={16}/> Edit Profile</h2>
            <form onSubmit={saveProfile} className={styles.form}>
              <div className={styles.field}>
                <label>Full Name</label>
                <div className={styles.inputWrap}>
                  <BsPerson className={styles.inputIcon} size={15}/>
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="Your full name"/>
                </div>
              </div>
              <div className={styles.field}>
                <label>Email (read-only)</label>
                <div className={styles.inputWrap}>
                  <BsEnvelope className={styles.inputIcon} size={15}/>
                  <input value={user?.email} disabled/>
                </div>
              </div>
              <div className={styles.field}>
                <label>Department</label>
                <div className={styles.inputWrap}>
                  <BsBook className={styles.inputIcon} size={15}/>
                  <input value={form.department} onChange={e => setForm({...form, department: e.target.value})} placeholder="e.g. Computer Science"/>
                </div>
              </div>
              <button type="submit" className={styles.saveBtn} disabled={saving}>
                {saving ? <span className={styles.spin}/> : <><BsSave size={15}/> Save Changes</>}
              </button>
            </form>
          </div>

          <div className={styles.card}>
            <h2><BsLock size={16}/> Change Password</h2>
            <form onSubmit={changePwd} className={styles.form}>
              {[
                ['currentPassword', 'Current Password'],
                ['newPassword',     'New Password'],
                ['confirmPassword', 'Confirm New Password'],
              ].map(([k, l]) => (
                <div key={k} className={styles.field}>
                  <label>{l}</label>
                  <div className={styles.inputWrap}>
                    <BsLock className={styles.inputIcon} size={15}/>
                    <input type="password" value={pwd[k]} onChange={e => setPwd({...pwd, [k]: e.target.value})} placeholder={l} required/>
                  </div>
                  {k === 'newPassword' && pwd.newPassword && (
                    <div className={styles.strengthMeter}>
                      <div className={styles.strengthTrack}>
                        <div className={styles.strengthBar} style={{ width: `${getPasswordStrength(pwd.newPassword).score}%`, backgroundColor: getPasswordStrength(pwd.newPassword).color }} />
                      </div>
                      <span className={styles.strengthLabel}>
                        Strength: <strong style={{ color: getPasswordStrength(pwd.newPassword).color }}>{getPasswordStrength(pwd.newPassword).label}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
              <button type="submit" className={styles.saveBtn} disabled={changingPwd}>
                {changingPwd ? <span className={styles.spin}/> : <><BsCheckCircle size={15}/> Update Password</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
