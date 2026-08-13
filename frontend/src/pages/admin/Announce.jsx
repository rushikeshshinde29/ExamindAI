import React, { useState, useEffect } from 'react';
import AdminLayout from './Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsBell, BsSend, BsTrash, BsPencil, BsX, BsCalendar, BsPlusCircle } from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import { useDialog } from '../../context/DialogContext';

export default function AdminAnnounce() {
  const { confirm } = useDialog();
  const { t } = usePreferences();
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audienceScope, setAudienceScope] = useState('ALL_STUDENTS'); // ALL_STUDENTS, SPECIFIC_GROUP, FACULTY_ONLY, ALL_USERS
  const [groupAudience, setGroupAudience] = useState('ALL_USERS'); // ALL_USERS, FACULTY_ONLY, STUDENTS_ONLY
  const [targetGroupId, setTargetGroupId] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const res = await api.get('/admin/groups');
      setGroups(res.data.data || []);
    } catch (err) {
      console.error("Failed to load groups", err);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/faculty'); // Returns self-created announcements
      setAnnouncements(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load announcements list");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }

    setSubmitting(true);
    let finalTargetAudience = audienceScope;
    let finalTargetGroupId = null;

    if (audienceScope === 'SPECIFIC_GROUP') {
      finalTargetAudience = groupAudience;
      finalTargetGroupId = targetGroupId || null;
    } else if (audienceScope === 'ALL_STUDENTS') {
      finalTargetAudience = 'STUDENTS_ONLY';
    }

    const payload = {
      title: title.trim(),
      message: message.trim(),
      priority,
      targetAudience: finalTargetAudience,
      targetGroupId: finalTargetGroupId
    };

    try {
      if (editingId) {
        toast.loading("Updating announcement...", { id: "admin-announce" });
        await api.put(`/announcements/${editingId}`, payload);
        toast.success("Announcement updated successfully", { id: "admin-announce" });
      } else {
        toast.loading("Broadcasting announcement...", { id: "admin-announce" });
        await api.post('/announcements', payload);
        toast.success("Announcement broadcasted successfully", { id: "admin-announce" });
      }
      resetForm();
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save announcement', { id: "admin-announce" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, heading) => {
    if (!await confirm(`Are you sure you want to delete "${heading}"?`, "Delete Announcement")) return;
    try {
      toast.loading("Deleting announcement...", { id: "admin-announce" });
      await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted successfully", { id: "admin-announce" });
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement", { id: "admin-announce" });
    }
  };

  const startEdit = (a) => {
    setEditingId(a.id);
    setTitle(a.title);
    setMessage(a.message);
    setPriority(a.priority || 'Normal');
    
    if (a.targetGroup) {
      setAudienceScope('SPECIFIC_GROUP');
      setTargetGroupId(String(a.targetGroup.id));
      setGroupAudience(a.targetAudience);
    } else {
      if (a.targetAudience === 'STUDENTS_ONLY' || a.targetAudience === 'ALL_STUDENTS') {
        setAudienceScope('ALL_STUDENTS');
      } else {
        setAudienceScope(a.targetAudience);
      }
      setTargetGroupId('');
      setGroupAudience('ALL_USERS');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setAudienceScope('ALL_STUDENTS');
    setTargetGroupId('');
    setGroupAudience('ALL_USERS');
    setPriority('Normal');
  };

  return (
    <AdminLayout>
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Page Header */}
        <div className="page-header" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BsBell size={24} style={{ color: 'var(--primary)' }} /> {t('broadcastAnnouncements')}
            </h1>
            <p className="page-subtitle">{t('broadcastAnnouncementsSub')}</p>
          </div>
        </div>

        {/* Action Panel: Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
          
          {/* Create/Edit Form Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {editingId ? '⚙️ Edit Announcement' : '📢 Compose Announcement'}
            </h3>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Scheduled Maintenance, System Upgrade"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message Body *</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Type details of your announcement here..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Audience Scope</label>
                  <select 
                    className="form-input" 
                    value={audienceScope} 
                    onChange={e => setAudienceScope(e.target.value)}
                  >
                    <option value="ALL_STUDENTS">All Students</option>
                    <option value="SPECIFIC_GROUP">Specific Group / Batch</option>
                    <option value="FACULTY_ONLY">Faculty Only (Global)</option>
                    <option value="ALL_USERS">All Users (Global)</option>
                  </select>
                </div>

                {audienceScope === 'SPECIFIC_GROUP' && (
                  <div className="form-group">
                    <label className="form-label">Select Group</label>
                    <select 
                      className="form-input" 
                      value={targetGroupId} 
                      onChange={e => setTargetGroupId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose group --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {audienceScope === 'SPECIFIC_GROUP' && (
                  <div className="form-group">
                    <label className="form-label">Group Audience</label>
                    <select 
                      className="form-input" 
                      value={groupAudience} 
                      onChange={e => setGroupAudience(e.target.value)}
                    >
                      <option value="ALL_USERS">All Users in Group</option>
                      <option value="FACULTY_ONLY">Faculty Only in Group</option>
                      <option value="STUDENTS_ONLY">Students Only in Group</option>
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input" 
                    value={priority} 
                    onChange={e => setPriority(e.target.value)}
                  >
                    <option value="Normal">General</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                {editingId && (
                  <button type="button" className="btn btn-ghost" onClick={resetForm} style={{ flex: 1 }}>
                    Cancel
                  </button>
                )}
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 2 }}>
                  {submitting ? 'Sending...' : editingId ? 'Update Announcement' : <><BsSend size={14} /> Send Announcement</>}
                </button>
              </div>
            </form>
          </div>

          {/* Live Preview Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--accent-dark)' }}>👁️ Live Preview</h3>
            
            <div 
              className="card" 
              style={{ 
                borderLeft: priority === 'Urgent' ? '5px solid var(--danger)' : '1px solid var(--bg-border)',
                background: priority === 'Urgent' ? 'var(--bg-glass)' : 'var(--bg-surface)',
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                padding: '16px',
                flex: 1
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <span className={`badge ${priority === 'Urgent' ? 'badge-red' : 'badge-purple'}`}>
                  {priority === 'Urgent' ? 'Urgent' : 'General'}
                </span>
                <span className="badge badge-gray">Posted by Admin</span>
                <span className="badge badge-cyan">
                  🎯 {
                    audienceScope === 'SPECIFIC_GROUP' ? (
                      `Group: ${groups.find(g => String(g.id) === String(targetGroupId))?.name || 'Selected Group'} (${groupAudience === 'ALL_USERS' ? 'All Users' : groupAudience === 'FACULTY_ONLY' ? 'Faculty Only' : 'Students Only'})`
                    ) : (
                      audienceScope === 'ALL_STUDENTS' ? 'All Students' : audienceScope === 'FACULTY_ONLY' ? 'Faculty Only' : 'All Users'
                    )
                  }
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginLeft: 'auto' }}>
                  Just now
                </span>
              </div>
              <div style={{ borderBottom: '1px solid var(--bg-border)', margin: '4px 0' }} />
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                {title || 'Announcement Title'}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                {message || 'Your broadcast message details will appear here in real-time...'}
              </p>
            </div>
          </div>
        </div>

        {/* History / Created Announcements List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '12px 0 0 0' }}>History of Sent Announcements</h3>
          
          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading history...</p>
          ) : announcements.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>You haven't broadcasted any announcements yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {announcements.map(a => {
                const isUrgent = a.priority?.toLowerCase() === 'urgent';
                const formattedDate = new Date(a.createdAt).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric'
                });
                
                return (
                  <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className={`badge ${isUrgent ? 'badge-red' : 'badge-purple'}`}>
                          {isUrgent ? 'Urgent' : 'General'}
                        </span>
                        <span className="badge badge-cyan">
                          🎯 {
                            a.targetGroup ? (
                              `Group: ${a.targetGroup.name} (${a.targetAudience === 'ALL_USERS' ? 'All Users' : a.targetAudience === 'FACULTY_ONLY' ? 'Faculty Only' : 'Students Only'})`
                            ) : (
                              a.targetAudience === 'ALL_USERS' ? 'All Users' : a.targetAudience === 'FACULTY_ONLY' ? 'Faculty Only' : 'All Students'
                            )
                          }
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <BsCalendar size={11} /> {formattedDate}
                        </span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-sm btn-ghost" onClick={() => startEdit(a)} style={{ padding: '4px 8px', borderRadius: '6px' }}>
                          <BsPencil size={11} /> Edit
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(a.id, a.title)} style={{ padding: '4px 8px', borderRadius: '6px', color: 'var(--danger)', borderColor: 'rgba(220,38,38,0.2)' }}>
                          <BsTrash size={11} /> Delete
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ borderBottom: '1px solid var(--bg-border)', margin: '2px 0' }} />
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>{a.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', margin: 0 }}>{a.message}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
