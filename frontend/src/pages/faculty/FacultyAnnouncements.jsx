import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { BsMegaphone, BsPlusCircle, BsTrash, BsPencil, BsX, BsCalendar, BsSearch, BsCheckCircle } from 'react-icons/bs';
import Layout from '../../components/Layout';
import { useDialog } from '../../context/DialogContext';

export default function FacultyAnnouncements() {
  const { confirm } = useDialog();
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, mine, admin, urgent

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('Normal');
  const [targetAudience, setTargetAudience] = useState('ALL_STUDENTS'); // ALL_STUDENTS, GROUP
  const [targetGroupId, setTargetGroupId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchGroups();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/faculty');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const res = await api.get('/admin/groups');
      setGroups(res.data.data || []);
    } catch (err) {
      console.error("Failed to load groups", err);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setTitle('');
    setMessage('');
    setPriority('Normal');
    setTargetAudience('ALL_STUDENTS');
    setTargetGroupId('');
    setIsModalOpen(true);
  };

  const openEditModal = (a) => {
    setEditingId(a.id);
    setTitle(a.title);
    setMessage(a.message);
    setPriority(a.priority || 'Normal');
    setTargetAudience(a.targetAudience || 'ALL_STUDENTS');
    setTargetGroupId(a.targetGroup ? String(a.targetGroup.id) : '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error("Title and Message are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: title.trim(),
      message: message.trim(),
      priority,
      targetAudience,
      targetGroupId: targetAudience === 'GROUP' ? targetGroupId || null : null
    };

    try {
      if (editingId) {
        toast.loading("Updating announcement...", { id: "announcement" });
        await api.put(`/announcements/${editingId}`, payload);
        toast.success("Announcement updated successfully!", { id: "announcement" });
      } else {
        toast.loading("Broadcasting announcement...", { id: "announcement" });
        await api.post('/announcements', payload);
        toast.success("Announcement broadcasted successfully!", { id: "announcement" });
      }
      setIsModalOpen(false);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save announcement", { id: "announcement" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, heading) => {
    if (!await confirm(`Are you sure you want to delete "${heading}"?`, "Delete Announcement")) return;
    try {
      toast.loading("Deleting announcement...", { id: "announcement" });
      await api.delete(`/announcements/${id}`);
      toast.success("Announcement deleted successfully", { id: "announcement" });
      fetchAnnouncements();
    } catch (err) {
      toast.error("Failed to delete announcement", { id: "announcement" });
    }
  };

  // Filter & Search Logic
  const filtered = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.message.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'mine') return a.createdBy?.id === user?.id;
    if (filter === 'admin') return a.createdBy?.role === 'admin';
    if (filter === 'group') return a.targetAudience === 'GROUP';
    if (filter === 'urgent') return a.priority?.toLowerCase() === 'urgent';
    return true;
  });

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
      
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BsMegaphone size={24} style={{ color: 'var(--primary)' }} /> Announcements Manager
          </h1>
          <p className="page-subtitle">Broadcasting updates to students and tracking class alerts</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <BsPlusCircle size={16} /> Create Announcement
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search announcements..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        
        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { value: 'all', label: 'All Visible' },
            { value: 'mine', label: 'Posted by you' },
            { value: 'admin', label: 'From Admin' },
            { value: 'group', label: 'Group Announcements' },
            { value: 'urgent', label: 'Urgent Only' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={`btn btn-sm ${filter === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '6px 14px', borderRadius: '20px' }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <BsMegaphone size={36} style={{ opacity: 0.5, marginBottom: '12px', color: 'var(--text-muted)' }} />
          <h3>No Announcements Found</h3>
          <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>Try adjusting your search query or filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(a => {
            const isOwn = a.createdBy?.id === user?.id;
            const isUrgent = a.priority?.toLowerCase() === 'urgent';
            const formattedDate = new Date(a.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Target Audience Badge Text
            let targetText = "All Students";
            if (a.targetAudience === 'ALL_USERS') targetText = "All Users";
            if (a.targetAudience === 'FACULTY_ONLY') targetText = "Faculty Only";
            if (a.targetAudience === 'STUDENTS_ONLY') targetText = "Students Only";
            if (a.targetAudience === 'GROUP' && a.targetGroup) targetText = `Group: ${a.targetGroup.name}`;

            return (
              <div key={a.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                
                {/* Meta details bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Priority Badge */}
                    <span className={`badge ${isUrgent ? 'badge-red' : 'badge-purple'}`}>
                      {isUrgent ? 'Urgent' : 'General'}
                    </span>

                    {/* Author Badge */}
                    <span className="badge badge-gray">
                      {isOwn ? 'Posted by you' : a.createdBy?.role === 'admin' ? 'Posted by Admin' : `Posted by Prof. ${a.createdBy?.name}`}
                    </span>

                    {/* Target Audience Badge */}
                    <span className="badge badge-cyan">
                      🎯 {targetText}
                    </span>

                    {/* Timestamp */}
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                      <BsCalendar size={11} /> {formattedDate}
                    </span>
                  </div>

                  {/* Actions (Only if self-authored) */}
                  {isOwn && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => openEditModal(a)} style={{ padding: '6px 8px', borderRadius: '6px' }} title="Edit">
                        <BsPencil size={12} />
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => handleDelete(a.id, a.title)} style={{ padding: '6px 8px', borderRadius: '6px', color: 'var(--danger)', borderColor: 'rgba(220,38,38,0.2)' }} title="Delete">
                        <BsTrash size={12} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Divider line */}
                <div style={{ borderBottom: '1px solid var(--bg-border)', margin: '4px 0' }} />

                {/* Announcement Title & Message */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  {a.title}
                </h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: 0 }}>
                  {a.message}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
        }} onClick={e => { if (e.target === e.currentTarget) setIsModalOpen(false); }}>
          
          <div className="card" style={{ width: 'min(640px, 100%)', maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'scaleUp 0.2s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
                {editingId ? 'Edit Announcement' : 'Create Announcement'}
              </h2>
              <button className="btn btn-ghost" onClick={() => setIsModalOpen(false)} style={{ padding: '4px', border: 'none' }}>
                <BsX size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={title} 
                  onChange={e => setTitle(e.target.value)} 
                  placeholder="e.g. Midterm Quiz Details"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Message *</label>
                <textarea 
                  className="form-input" 
                  rows={4}
                  value={message} 
                  onChange={e => setMessage(e.target.value)} 
                  placeholder="Type the message body here..."
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: targetAudience === 'GROUP' ? '1fr 1fr 1fr' : '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Audience Target</label>
                  <select 
                    className="form-input" 
                    value={targetAudience} 
                    onChange={e => setTargetAudience(e.target.value)}
                  >
                    <option value="ALL_STUDENTS">All Students</option>
                    <option value="GROUP">Specific Batch / Group</option>
                  </select>
                </div>

                {targetAudience === 'GROUP' && (
                  <div className="form-group">
                    <label className="form-label">Select Group</label>
                    <select 
                      className="form-input" 
                      value={targetGroupId} 
                      onChange={e => setTargetGroupId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose student group --</option>
                      {groups.map(g => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setIsModalOpen(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Broadcasting...' : editingId ? 'Update' : 'Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </Layout>
  );
}
