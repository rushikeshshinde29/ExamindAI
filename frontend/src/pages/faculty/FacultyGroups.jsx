import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { 
  BsPeople, BsPlusCircle, BsMegaphone, BsChevronDown, BsChevronUp, 
  BsX, BsTrash, BsPersonPlus, BsBriefcase, BsEnvelope, BsSearch
} from 'react-icons/bs';
import { useDialog } from '../../context/DialogContext';

export default function FacultyGroups() {
  const { confirm } = useDialog();
  const [groups, setGroups] = useState([]);
  const [allFaculty, setAllFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded sections state: { [groupId]: { faculty: boolean, students: boolean } }
  const [expanded, setExpanded] = useState({});

  // Search filter
  const [search, setSearch] = useState('');

  // Modal states
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [modalType, setModalType] = useState(null); // 'addStudents' | 'addFaculty' | 'announce'
  
  // Form states
  const [emailsInput, setEmailsInput] = useState('');
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  
  // Announcement states
  const [annTitle, setAnnTitle] = useState('');
  const [annMessage, setAnnMessage] = useState('');
  const [annPriority, setAnnPriority] = useState('Normal');
  const [submitting, setSubmitting] = useState(false);

  // Search registered students inside Add Students Modal
  const [studentSearch, setStudentSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Debounced student search
  useEffect(() => {
    if (!studentSearch || studentSearch.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      api.get('/faculty/groups/users/students', {
        params: {
          search: studentSearch.trim(),
          limit: 10
        }
      })
      .then(res => {
        const results = res.data.data || [];
        const groupObj = groups.find(g => g.id === activeGroupId);
        const enrolledStudents = groupObj?.students?.filter(s => s.status !== 'removed') || [];
        const existingEmails = new Set(enrolledStudents.map(s => {
          const std = s.user || s.student;
          return std?.email?.toLowerCase() || s.email?.toLowerCase();
        }).filter(Boolean));
        const filtered = results.filter(s => !existingEmails.has(s.email?.toLowerCase()));
        setSearchResults(filtered);
      })
      .catch(err => {
        console.error('Error searching students:', err);
      });
    }, 300);
    return () => clearTimeout(delayDebounce);
  }, [studentSearch, activeGroupId, groups]);

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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gr, fr] = await Promise.all([
        api.get('/faculty/groups'),
        api.get('/faculty/groups/users/faculty')
      ]);
      setGroups(gr.data.data || []);
      setAllFaculty(fr.data.data || []);
    } catch (err) {
      toast.error("Failed to load groups data");
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (groupId, section) => {
    setExpanded(prev => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [section]: !prev[groupId]?.[section]
      }
    }));
  };

  const openModal = (groupId, type) => {
    setActiveGroupId(groupId);
    setModalType(type);
    
    // Reset forms
    setEmailsInput('');
    setSelectedFacultyId('');
    setAnnTitle('');
    setAnnMessage('');
    setAnnPriority('Normal');
    setStudentSearch('');
    setSearchResults([]);
  };

  const handleAddStudents = async (e) => {
    e.preventDefault();
    const emails = emailsInput.split(/[\n,;]+/).map(em => em.trim()).filter(Boolean);
    if (emails.length === 0) {
      toast.error("Please enter at least one valid email address");
      return;
    }

    setSubmitting(true);
    try {
      toast.loading("Processing students enrollment...", { id: "groups-action" });
      const res = await api.post(`/faculty/groups/${activeGroupId}/students`, { emails });
      const r = res.data.results;
      toast.success(
        `Enrolled: ${r.added?.length || 0} · Pending: ${r.pending?.length || 0} · Already in: ${r.alreadyIn?.length || 0}`,
        { id: "groups-action", duration: 5000 }
      );
      setModalType(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add students", { id: "groups-action" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveStudent = async (groupId, userId, name) => {
    if (!await confirm(`Are you sure you want to remove "${name}" from this group?`, "Remove Student")) return;
    try {
      toast.loading("Removing student...", { id: "groups-action" });
      await api.delete(`/faculty/groups/${groupId}/students/${userId}`);
      toast.success("Student removed successfully", { id: "groups-action" });
      fetchData();
    } catch (err) {
      toast.error("Failed to remove student", { id: "groups-action" });
    }
  };

  const handleAddFaculty = async (e) => {
    e.preventDefault();
    if (!selectedFacultyId) {
      toast.error("Please select a faculty member");
      return;
    }

    setSubmitting(true);
    try {
      toast.loading("Assigning co-faculty...", { id: "groups-action" });
      await api.post(`/faculty/groups/${activeGroupId}/faculty`, { facultyId: Number(selectedFacultyId) });
      toast.success("Co-faculty assigned successfully", { id: "groups-action" });
      setModalType(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to assign co-faculty", { id: "groups-action" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveFaculty = async (groupId, facultyId, name) => {
    if (!await confirm(`Are you sure you want to remove Prof. "${name}" from this group?`, "Remove Faculty")) return;
    try {
      toast.loading("Removing faculty member...", { id: "groups-action" });
      await api.delete(`/faculty/groups/${groupId}/faculty/${facultyId}`);
      toast.success("Faculty member removed from group", { id: "groups-action" });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove faculty member", { id: "groups-action" });
    }
  };

  const handleSendAnnouncement = async (e) => {
    e.preventDefault();
    if (!annTitle.trim() || !annMessage.trim()) {
      toast.error("Title and Message are required");
      return;
    }

    setSubmitting(true);
    const payload = {
      title: annTitle.trim(),
      message: annMessage.trim(),
      priority: annPriority,
      targetAudience: 'GROUP',
      targetGroupId: activeGroupId
    };

    try {
      toast.loading("Broadcasting group announcement...", { id: "groups-action" });
      await api.post('/announcements', payload);
      toast.success("Announcement broadcasted successfully", { id: "groups-action" });
      setModalType(null);
    } catch (err) {
      toast.error("Failed to broadcast announcement", { id: "groups-action" });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter groups by search query
  const filteredGroups = groups.filter(g => 
    g.name.toLowerCase().includes(search.toLowerCase()) ||
    (g.description && g.description.toLowerCase().includes(search.toLowerCase())) ||
    (g.division && g.division.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <Layout>
      <div className="fade-in" style={{ maxWidth: '960px', margin: '0 auto' }}>
        
        {/* Page Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BsPeople size={24} style={{ color: 'var(--primary)' }} /> Class Groups
            </h1>
            <p className="page-subtitle">Manage enrolled students, co-faculty coordinators, and group announcements</p>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '24px' }}>
          <BsSearch style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search groups by name, description, or division..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Groups Cards List */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
            <div className="spinner" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
            <BsPeople size={36} style={{ opacity: 0.5, marginBottom: '12px', color: 'var(--text-muted)' }} />
            <h3>No Assigned Groups Found</h3>
            <p style={{ fontSize: '0.875rem', margin: '4px 0 0 0' }}>If you are a new faculty, contact Admin to assign groups to your profile.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredGroups.map(g => {
              const showFaculty = !!expanded[g.id]?.faculty;
              const showStudents = !!expanded[g.id]?.students;
              
              // Get details of active/pending students in the group
              const enrolledStudents = g.students?.filter(s => s.status !== 'removed') || [];

              return (
                <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Group Main Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                        {g.name}
                      </h2>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                        {g.division && <span className="badge badge-purple">Div: {g.division}</span>}
                        {g.subject && <span className="badge badge-cyan">{g.subject}</span>}
                        <span className="badge badge-gray">{enrolledStudents.length} Students enrolled</span>
                      </div>
                      {g.description && (
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: '8px 0 0 0', lineHeight: 1.5 }}>
                          {g.description}
                        </p>
                      )}
                    </div>

                    {/* Actions row */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button className="btn btn-sm btn-ghost" onClick={() => openModal(g.id, 'announce')}>
                        <BsMegaphone size={12} /> Send Announcement
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => openModal(g.id, 'addStudents')}>
                        <BsPlusCircle size={12} /> + Add Students
                      </button>
                      <button className="btn btn-sm btn-ghost" onClick={() => openModal(g.id, 'addFaculty')}>
                        <BsPlusCircle size={12} /> + Add Faculty
                      </button>
                    </div>
                  </div>

                  <div style={{ borderBottom: '1px solid var(--bg-border)' }} />

                  {/* Expandable Section: FACULTY */}
                  <div>
                    <button 
                      onClick={() => toggleSection(g.id, 'faculty')}
                      style={{ 
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                        fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BsBriefcase size={14} style={{ color: 'var(--primary)' }} /> 
                        Managing Faculty Members ({g.faculty?.length || 0})
                      </span>
                      {showFaculty ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
                    </button>

                    {showFaculty && (
                      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px', paddingLeft: '8px' }}>
                        {(!g.faculty || g.faculty.length === 0) ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>No faculty assigned.</p>
                        ) : (
                          g.faculty.map(f => (
                            <div key={f.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', borderRadius: '8px', background: 'var(--bg-raised)', border: '1px solid var(--bg-border)' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ 
                                  width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-glow)', 
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem'
                                }}>
                                  {f.avatar || (f.name?.charAt(0).toUpperCase())}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{f.name}</div>
                                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <BsEnvelope size={10} /> {f.email}
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => handleRemoveFaculty(g.id, f.id, f.name)}
                                className="btn btn-sm btn-ghost" 
                                style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'transparent' }}
                                title="Remove Faculty"
                              >
                                <BsTrash size={12} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Expandable Section: STUDENTS */}
                  <div>
                    <button 
                      onClick={() => toggleSection(g.id, 'students')}
                      style={{ 
                        width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'none', border: 'none', padding: '6px 0', cursor: 'pointer',
                        fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)'
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <BsPeople size={14} style={{ color: 'var(--accent-dark)' }} /> 
                        Enrolled Students ({enrolledStudents.length})
                      </span>
                      {showStudents ? <BsChevronUp size={14} /> : <BsChevronDown size={14} />}
                    </button>

                    {showStudents && (
                      <div className="fade-in" style={{ marginTop: '12px' }}>
                        {enrolledStudents.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, paddingLeft: '8px' }}>No students enrolled in this group.</p>
                        ) : (
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Student Details</th>
                                  <th>Email</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: 'right' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {enrolledStudents.map(s => {
                                  const std = s.user || s.student;
                                  const isPending = s.status === 'pending' || !std;
                                  const displayName = std ? std.name : "Pending Invitation";
                                  const displayEmail = std ? std.email : s.email;
                                  const avatarLetter = std ? (std.avatar || std.name?.charAt(0).toUpperCase()) : "?";
                                  
                                  return (
                                    <tr key={s.id}>
                                      <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                          <div style={{ 
                                            width: '28px', height: '28px', borderRadius: '50%', 
                                            background: isPending ? 'var(--bg-border)' : 'var(--accent-glow)', 
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.75rem'
                                          }}>
                                            {avatarLetter}
                                          </div>
                                          <span style={{ fontWeight: 500, color: isPending ? 'var(--text-muted)' : 'var(--text-primary)' }}>{displayName}</span>
                                        </div>
                                      </td>
                                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{displayEmail}</td>
                                      <td>
                                        <span className={`badge ${isPending ? 'badge-orange' : 'badge-green'}`} style={{ textTransform: 'capitalize' }}>
                                          {s.status}
                                        </span>
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        {!isPending && (
                                          <button 
                                            className="btn btn-sm btn-ghost"
                                            onClick={() => handleRemoveStudent(g.id, std.id, std.name)}
                                            style={{ padding: '4px 8px', color: 'var(--danger)', borderColor: 'transparent' }}
                                            title="Remove student from group"
                                          >
                                            <BsTrash size={12} />
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* MODAL: Add Students */}
        {modalType === 'addStudents' && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }} onClick={e => { if (e.target === e.currentTarget) setModalType(null); }}>
            
            <div className="card" style={{ width: 'min(480px, 100%)', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'scaleUp 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Enroll Students</h2>
                <button className="btn btn-ghost" onClick={() => setModalType(null)} style={{ padding: '4px', border: 'none' }}>
                  <BsX size={20} />
                </button>
              </div>

              <form onSubmit={handleAddStudents} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Search Registered Students */}
                <div className="form-group">
                  <label className="form-label">Search Registered Students</label>
                  <div style={{ position: 'relative' }}>
                    <input 
                      type="text" 
                      className="form-input"
                      value={studentSearch} 
                      onChange={e => setStudentSearch(e.target.value)} 
                      placeholder="Type name or email to search..."
                      style={{ boxSizing: 'border-box', width: '100%', paddingRight: '36px' }}
                    />
                    <BsSearch style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={14} />
                  </div>
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
                    marginTop: '-6px'
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
                        <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingRight: '8px' }}>
                          <strong style={{ color: 'var(--gray-800)' }}>{s.name}</strong>{' '}
                          <span style={{ color: 'var(--gray-500)' }}>({s.email})</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleAddEmail(s.email)}
                          style={{
                            padding: '4px 10px',
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            color: 'var(--primary)',
                            borderRadius: '6px',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            cursor: 'pointer',
                            flexShrink: 0
                          }}
                        >
                          + Add
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Student Email Addresses</label>
                  <textarea 
                    className="form-input" 
                    rows={5}
                    value={emailsInput} 
                    onChange={e => setEmailsInput(e.target.value)} 
                    placeholder="Enter email addresses (separated by commas or new lines)&#10;student1@examind.ai&#10;student2@examind.ai"
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>
                    Note: Only registered student accounts with verified emails will be added.
                  </small>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Adding...' : 'Enroll Students'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Add Co-Faculty */}
        {modalType === 'addFaculty' && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }} onClick={e => { if (e.target === e.currentTarget) setModalType(null); }}>
            
            <div className="card" style={{ width: 'min(450px, 100%)', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'scaleUp 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Assign Co-Faculty Coordinator</h2>
                <button className="btn btn-ghost" onClick={() => setModalType(null)} style={{ padding: '4px', border: 'none' }}>
                  <BsX size={20} />
                </button>
              </div>

              <form onSubmit={handleAddFaculty} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Select Faculty Member</label>
                  <select 
                    className="form-input" 
                    value={selectedFacultyId} 
                    onChange={e => setSelectedFacultyId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose faculty coordinator --</option>
                    {allFaculty.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.email})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Assigning...' : 'Assign Faculty'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: Send Announcement */}
        {modalType === 'announce' && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
          }} onClick={e => { if (e.target === e.currentTarget) setModalType(null); }}>
            
            <div className="card" style={{ width: 'min(480px, 100%)', display: 'flex', flexDirection: 'column', gap: '18px', animation: 'scaleUp 0.2s ease' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Send Group Announcement</h2>
                <button className="btn btn-ghost" onClick={() => setModalType(null)} style={{ padding: '4px', border: 'none' }}>
                  <BsX size={20} />
                </button>
              </div>

              <form onSubmit={handleSendAnnouncement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Announcement Title *</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={annTitle} 
                    onChange={e => setAnnTitle(e.target.value)} 
                    placeholder="e.g. Schedule for Lab Submission"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Message *</label>
                  <textarea 
                    className="form-input" 
                    rows={4}
                    value={annMessage} 
                    onChange={e => setAnnMessage(e.target.value)} 
                    placeholder="Type details of your announcement to this group..."
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select 
                    className="form-input" 
                    value={annPriority} 
                    onChange={e => setAnnPriority(e.target.value)}
                  >
                    <option value="Normal">General</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                  <button type="button" className="btn btn-ghost" onClick={() => setModalType(null)} disabled={submitting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? 'Broadcasting...' : 'Broadcast'}
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
