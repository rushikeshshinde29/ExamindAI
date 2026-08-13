import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsMegaphone, BsCalendar, BsSearch, BsBell, BsPerson, BsExclamationTriangle } from 'react-icons/bs';
import Layout from '../../components/Layout';

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, admin, faculty, urgent

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get('/announcements/student');
      setAnnouncements(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Search Logic
  const filtered = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) || 
                          a.message.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'admin') return a.createdBy?.role === 'admin';
    if (filter === 'faculty') return a.createdBy?.role === 'faculty';
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
            <BsMegaphone size={24} style={{ color: 'var(--primary)' }} /> Announcements
          </h1>
          <p className="page-subtitle">Stay updated with instructions and notifications from your instructors</p>
        </div>
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
            { value: 'all', label: 'All Announcements' },
            { value: 'admin', label: 'From Admin' },
            { value: 'faculty', label: 'From Faculty' },
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

      {/* Announcements List */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
          <BsBell size={36} style={{ opacity: 0.5, marginBottom: '12px', color: 'var(--text-muted)' }} />
          <h3>No Announcements Active</h3>
          <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>No announcements fit your current filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(a => {
            const isUrgent = a.priority?.toLowerCase() === 'urgent';
            const formattedDate = new Date(a.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            });

            // Target Audience Badge Text
            let targetText = "All Students";
            if (a.targetAudience === 'ALL_USERS') targetText = "All Users";
            if (a.targetAudience === 'STUDENTS_ONLY') targetText = "Students Only";
            if (a.targetAudience === 'GROUP' && a.targetGroup) targetText = `Group: ${a.targetGroup.name}`;

            return (
              <div 
                key={a.id} 
                className="card" 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderLeft: isUrgent ? '5px solid var(--danger)' : '1px solid var(--bg-border)',
                  background: isUrgent ? 'var(--bg-glass)' : 'var(--bg-surface)'
                }}
              >
                
                {/* Meta details bar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Priority Badge */}
                    <span className={`badge ${isUrgent ? 'badge-red' : 'badge-purple'}`}>
                      {isUrgent ? 'Urgent' : 'General'}
                    </span>

                    {/* Author Badge */}
                    <span className="badge badge-gray">
                      {a.createdBy?.role === 'admin' ? 'Posted by Admin' : `Posted by Prof. ${a.createdBy?.name}`}
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
                </div>

                {/* Divider line */}
                <div style={{ borderBottom: '1px solid var(--bg-border)', margin: '4px 0' }} />

                {/* Announcement Title & Message */}
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {isUrgent && <BsExclamationTriangle style={{ color: 'var(--danger)' }} size={16} />}
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
      </div>
    </Layout>
  );
}
