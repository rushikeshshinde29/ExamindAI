import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  BsPeople, BsBriefcase, BsEnvelope, BsBell, BsCalendar, BsChevronRight 
} from 'react-icons/bs';

export default function StudentGroups() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentGroups();
  }, []);

  const fetchStudentGroups = async () => {
    try {
      const res = await api.get('/student/groups');
      setGroups(res.data.data || []);
    } catch (err) {
      toast.error("Failed to load your class groups");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BsPeople size={24} style={{ color: 'var(--primary)' }} /> My Groups
            </h1>
            <p className="page-subtitle">View your enrolled batches, coordinators, classmates, and active group feeds</p>
          </div>
        </div>

        {/* Group Cards List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : groups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <BsPeople size={36} style={{ opacity: 0.5, marginBottom: '12px', color: 'var(--text-muted)' }} />
            <h3>Not Enrolled in Any Groups</h3>
            <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>Please contact Admin or your Professor to enroll you into a class group.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {groups.map(g => (
              <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Group Details Header */}
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    {g.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '6px', alignItems: 'center' }}>
                    {g.division && <span className="badge badge-purple">Division {g.division}</span>}
                    <span className="badge badge-cyan">Active Batch</span>
                  </div>
                  {g.description && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                      {g.description}
                    </p>
                  )}
                </div>

                <div style={{ borderBottom: '1px solid var(--bg-border)' }} />

                {/* Grid Layout for Professors and Peer Classmates */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                  
                  {/* Left Column: Professors & Peer Classmates */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    
                    {/* Section: My Professors */}
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BsBriefcase size={14} style={{ color: 'var(--primary)' }} /> My Professors
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(!g.professors || g.professors.length === 0) ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No professors assigned.</p>
                        ) : (
                          g.professors.map(p => (
                            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', background: 'var(--bg-raised)', border: '1px solid var(--bg-border)' }}>
                              <div style={{ 
                                width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem'
                              }}>
                                {p.avatar || p.name?.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.name}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <BsEnvelope size={10} /> {p.email}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Section: Classmates */}
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BsPeople size={14} style={{ color: 'var(--accent-dark)' }} /> Classmates ({g.classmates?.length || 0})
                      </h3>
                      {(!g.classmates || g.classmates.length === 0) ? (
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No classmates enrolled.</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
                          {g.classmates.map(c => (
                            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', borderRadius: '6px', background: 'var(--bg-raised)', border: '1px solid var(--bg-border)' }}>
                              <div style={{ 
                                width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-glow)', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.7rem'
                              }}>
                                {c.avatar || c.name?.charAt(0).toUpperCase()}
                              </div>
                              <span style={{ fontSize: '0.8rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {c.name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Right Column: Group Announcements Feed */}
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <BsBell size={14} style={{ color: 'var(--warning)' }} /> Group Announcements Feed
                    </h3>
                    
                    {(!g.announcements || g.announcements.length === 0) ? (
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', borderStyle: 'dashed', background: 'none' }}>
                        <BsBell size={24} style={{ opacity: 0.4, marginBottom: '6px' }} />
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No active announcements for this group.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {g.announcements.slice(0, 2).map(a => {
                          const isUrgent = a.priority?.toLowerCase() === 'urgent';
                          const formattedDate = new Date(a.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          });

                          return (
                            <div 
                              key={a.id} 
                              style={{ 
                                padding: '12px', 
                                borderRadius: '8px', 
                                border: '1px solid var(--bg-border)',
                                borderLeft: isUrgent ? '4px solid var(--danger)' : '1px solid var(--bg-border)',
                                background: isUrgent ? 'rgba(220,38,38,0.02)' : 'var(--bg-raised)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '6px'
                              }}
                            >
                              <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                <span className={`badge ${isUrgent ? 'badge-red' : 'badge-purple'}`} style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                  {isUrgent ? 'Urgent' : 'General'}
                                </span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <BsCalendar size={10} /> {formattedDate}
                                </span>
                              </div>
                              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                                {a.title}
                              </h4>
                              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4, margin: 0, whiteSpace: 'pre-wrap' }}>
                                {a.message}
                              </p>
                              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: '6px', marginTop: '4px', textAlign: 'right' }}>
                                Posted by: <strong>{a.authorName}</strong> ({a.authorRole === 'admin' ? 'Admin' : 'Faculty'})
                              </div>
                            </div>
                          );
                        })}

                        {g.announcements.length > 2 && (
                          <Link 
                            to="/student/announcements" 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              gap: '6px',
                              padding: '9px 12px',
                              fontSize: '0.8rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              color: 'var(--primary)',
                              border: '1.5px solid var(--primary)',
                              borderRadius: '8px',
                              textAlign: 'center',
                              marginTop: '4px',
                              background: 'transparent',
                              transition: 'all 0.2s',
                              cursor: 'pointer'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'var(--primary)';
                              e.currentTarget.style.color = '#ffffff';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent';
                              e.currentTarget.style.color = 'var(--primary)';
                            }}
                          >
                            View All Announcements <BsChevronRight size={10} />
                          </Link>
                        )}
                      </div>
                    )}
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}
