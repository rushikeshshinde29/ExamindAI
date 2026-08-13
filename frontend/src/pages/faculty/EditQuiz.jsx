import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsPlus, BsTrash, BsPencil, BsLightning, BsUpload, BsDownload, BsSave, BsCheckCircle, BsX, BsArrowLeft, BsLightbulb, BsQuestionCircle } from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import styles from './EditQuiz.module.css';
import { useDialog } from '../../context/DialogContext';

const blankQ = () => ({
  text: '', type: 'mcq', difficulty: 'medium', marks: 1, negativeMark: 0, explanation: '', hint: '',
  imageUrl: '', sectionId: '', tags: '',
  options: [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
});

export default function EditQuiz() {
  const { confirm } = useDialog();
  const { id } = useParams();
  const navigate = useNavigate();
  const fileRef = useRef();
  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('manual');
  const [saving, setSaving] = useState(false);
  const [manualQ, setManualQ] = useState(blankQ());
  const [editingId, setEditingId] = useState(null);
  const [aiForm, setAiForm] = useState({
    topic: '',
    difficulty: 'medium',
    additionalContext: '',
    marks: 1.0,
    targetSectionId: '',
    newSectionTitle: '',
    distribution: {
      MCQ: 5,
      MULTI_SELECT: 0,
      TRUE_FALSE: 0,
      SHORT_ANSWER: 0
    }
  });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiQuestions, setAiQuestions] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [parsedQs, setParsedQs] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [collapsedQs, setCollapsedQs] = useState(new Set());
  const [sections, setSections] = useState([]);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const toggleQExpanded = (qId) => {
    setCollapsedQs(prev => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  useEffect(() => {
    Promise.all([
      api.get(`/quizzes/${id}`),
      api.get(`/questions/quiz/${id}`),
      api.get(`/quizzes/${id}/sections`)
    ])
      .then(([qr, qsr, sr]) => {
        setQuiz(qr.data.data);
        setQuestions(qsr.data.data);
        setSections(sr.data.data);
      })
      .catch(() => { toast.error('Quiz not found'); navigate('/faculty/quizzes'); })
      .finally(() => setLoading(false));
  }, [id, navigate]);

  useEffect(() => {
    if (quiz && questions) {
      const sum = questions.reduce((acc, q) => acc + (parseFloat(q.marks) || 0), 0);
      const rounded = Math.round(sum);
      if (quiz.totalMarks !== rounded) {
        setQuiz(prev => ({ ...prev, totalMarks: rounded }));
      }
    }
  }, [questions, quiz?.id]);

  const setOpt = (idx, field, val) => {
    const opts = [...manualQ.options];
    if (field === 'isCorrect') {
      if (manualQ.type === 'mcq' || manualQ.type === 'true_false') {
        opts.forEach((o, i) => o.isCorrect = i === idx);
      } else {
        opts[idx].isCorrect = val;
      }
    } else {
      opts[idx] = { ...opts[idx], [field]: val };
    }
    setManualQ({ ...manualQ, options: opts });
  };

  const changeType = (newType) => {
    let opts = [];
    if (newType === 'true_false') {
      opts = [{ text: 'True', isCorrect: true }, { text: 'False', isCorrect: false }];
    } else if (newType === 'short_answer') {
      opts = [{ text: '', isCorrect: true }];
    } else {
      opts = [{ text: '', isCorrect: true }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }];
    }
    setManualQ({ ...manualQ, type: newType, options: opts });
  };

  const saveManual = async () => {
    if (!manualQ.text.trim()) return toast.error('Question text is required');
    if (manualQ.type !== 'short_answer') {
      if (manualQ.options.filter(o => o.text.trim()).length < 2) return toast.error('At least 2 options required');
      if (!manualQ.options.some(o => o.isCorrect)) return toast.error('Select a correct answer');
    } else {
      if (!manualQ.options[0]?.text.trim()) return toast.error('Correct answer text is required');
    }

    const parsedTags = typeof manualQ.tags === 'string'
      ? manualQ.tags.split(',').map(t => t.trim()).filter(Boolean)
      : (manualQ.tags || []);

    const payload = {
      ...manualQ,
      marks: parseFloat(manualQ.marks) || 1,
      negativeMark: parseFloat(manualQ.negativeMark) || 0,
      quizId: id,
      tags: parsedTags
    };

    setSaving(true);
    try {
      if (editingId) {
        const r = await api.put(`/questions/${editingId}`, payload);
        setQuestions(qs => qs.map(q => (q.id === editingId || q.id === editingId) ? r.data.data : q));
        toast.success('Question updated'); setEditingId(null);
      } else {
        const r = await api.post('/questions', payload);
        setQuestions(qs => [...qs, r.data.data]);
        toast.success('Question added');
      }
      setManualQ(blankQ());
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };


  const editQ = (q) => {
    setManualQ({
      text: q.text, type: q.type, difficulty: q.difficulty, marks: q.marks, negativeMark: q.negativeMark, explanation: q.explanation || '', hint: q.hint || '',
      imageUrl: q.imageUrl || '', sectionId: q.sectionId || q.section?.id || '', tags: q.tags ? q.tags.join(', ') : '',
      options: (() => {
        const normalized = q.options.map(o => ({
          ...o,
          isCorrect: o.isCorrect !== undefined ? o.isCorrect : o.correct
        }));
        return normalized.length >= 4
          ? normalized
          : [...normalized, ...Array(4 - normalized.length).fill({ text: '', isCorrect: false })];
      })()
    });

    setEditingId(q.id || q.id); setActiveTab('manual');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };


  const deleteQ = async (qId) => {
    if (!await confirm('Delete this question?', 'Delete Question')) return;
    try { await api.delete(`/questions/${qId}`); setQuestions(qs => qs.filter(q => q.id !== qId)); toast.success('Deleted'); }
    catch (err) { toast.error('Delete failed'); }
  };

  const generateAI = async () => {
    if (!aiForm.topic.trim()) return toast.error('Enter a topic');
    
    const hasSections = sections && sections.length > 0;
    if (hasSections) {
      if (!aiForm.targetSectionId) return toast.error('Select a target section');
    }

    const totalQ = Object.values(aiForm.distribution).reduce((a, b) => a + b, 0);
    if (totalQ === 0) return toast.error('Select at least 1 question to generate');

    setAiLoading(true); setAiQuestions([]);
    try {
      const finalSectionId = hasSections ? aiForm.targetSectionId : null;

      const r = await api.post('/ai/generate', { ...aiForm, marks: parseFloat(aiForm.marks) || 1.0, subject: quiz?.subject });

      const generated = r.data.data.map(q => ({
        ...q,
        sectionId: finalSectionId
      }));

      setAiQuestions(generated);
      toast.success(`${r.data.data.length} questions generated!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setAiLoading(false);
    }
  };

  const addAiQ = async (q) => {
    setSaving(true);
    try { const r = await api.post('/questions', { ...q, quizId: id }); setQuestions(qs => [...qs, r.data.data]); setAiQuestions(aqs => aqs.filter(x => x !== q)); toast.success('Added'); }
    catch { toast.error('Failed'); } finally { setSaving(false); }
  };

  const addAllAI = async () => {
    if (!aiQuestions.length) return;
    setSaving(true);
    try { const r = await api.post('/questions/bulk', { quizId: id, questions: aiQuestions }); setQuestions(qs => [...qs, ...r.data.data]); setAiQuestions([]); toast.success(`${r.data.data.length} questions added!`); }
    catch { toast.error('Bulk add failed'); } finally { setSaving(false); }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Question,Type,Option A,Option B,Option C,Option D,Correct Answer,Marks\n"
      + "What is Java?,MCQ,Programming Language,Database,OS,Hardware,Option A,1\n"
      + "HTML is a programming language,True/False,True,False,,,False,1";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "ExamindAI_Quiz_Bulk_Upload_Template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseFile = async () => {
    if (!uploadFile) return toast.error('Select a file first');
    setUploading(true); setParsedQs([]); setUploadErrors([]);
    const fd = new FormData(); fd.append('file', uploadFile);
    const isWord = uploadFile.name.endsWith('.docx');
    try {
      if (isWord) {
        const r = await api.post(`/quizzes/${id}/import-word`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        if (r.data.success) {
          toast.success(`Successfully imported ${r.data.importedCount} questions from Word!`);
          const qRes = await api.get(`/questions/quiz/${id}`);
          setQuestions(qRes.data.data);
          setUploadFile(null);
        }
        setUploadErrors(r.data.errors || []);
      } else {
        const r = await api.post('/upload/questions', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setParsedQs(r.data.data);
        setUploadErrors(r.data.errors || []);
        toast.success(`${r.data.data.length} questions parsed!`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally { setUploading(false); }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!newSectionTitle.trim()) return;
    try {
      const r = await api.post(`/quizzes/${id}/sections`, { title: newSectionTitle });
      setSections([...sections, r.data.data]);
      setNewSectionTitle('');
      toast.success('Section created');
    } catch {
      toast.error('Failed to create section');
    }
  };

  const handleDeleteSection = async (secId) => {
    if (!await confirm('Delete this section? Questions in it will be unassigned.', 'Delete Section')) return;
    try {
      await api.delete(`/quizzes/${id}/sections/${secId}`);
      setSections(sections.filter(s => s.id !== secId));
      const qRes = await api.get(`/questions/quiz/${id}`);
      setQuestions(qRes.data.data);
      toast.success('Section deleted');
    } catch {
      toast.error('Failed to delete section');
    }
  };

  const getGroupedQuestions = () => {
    const grouped = {};
    const general = questions.filter(q => !q.sectionId && !q.section?.id);
    if (general.length > 0) {
      grouped['General Questions'] = general;
    }
    sections.forEach(sec => {
      const qs = questions.filter(q => q.sectionId === sec.id || q.section?.id === sec.id);
      if (qs.length > 0) {
        grouped[sec.title] = qs;
      }
    });
    return grouped;
  };

  const renderQuestionCard = (q, i) => (
    <div key={q.id || q.id} className={styles.qCard}>
      <div className={styles.qCardTop}>
        <span className={styles.qCardNum}>Q{i + 1}</span>
        <span className={styles.qDiff} style={{ color: DIFF_COLOR[q.difficulty] || '#854d0e', background: DIFF_COLOR[q.difficulty] + '18' }}>{q.difficulty}</span>
        {q.isAIGenerated && <span className={styles.aiBadge}>🤖 AI</span>}
        <span className={styles.qMarks}>{q.marks}m</span>
        {q.negativeMark > 0 && <span className={styles.negMark}>-{q.negativeMark}</span>}
        <div className={styles.qCardActions}>
          <button onClick={() => editQ(q)} className={styles.editQBtn} title="Edit"><BsPencil size={12} /></button>
          <button onClick={() => deleteQ(q.id || q.id)} className={styles.delQBtn} title="Delete"><BsTrash size={12} /></button>
        </div>
      </div>
      <p className={styles.qCardText}>{q.text}</p>
      {q.imageUrl && (
        <div style={{ margin: '8px 0' }}>
          <img
            src={q.imageUrl.startsWith('/') ? `http://localhost:5000${q.imageUrl}` : q.imageUrl}
            alt="Question Visual"
            style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, objectFit: 'contain', background: '#f8fafc' }}
          />
        </div>
      )}
      {!collapsedQs.has(q.id || q.id) && (
        <div className={styles.qExpanded}>
          {q.options.map((o, j) => {
            const isCorrect = o.isCorrect !== undefined ? o.isCorrect : o.correct;
            return (
              <div
                key={j}
                className={`${styles.qOpt} ${isCorrect ? styles.qOptCorrect : ''}`}
              >
                <span className="badge-option-text">
                  <strong style={{ marginRight: '6px' }}>
                    {String.fromCharCode(65 + j)}
                  </strong>
                  {o.text}
                </span>
                {isCorrect && (
                  <span className="text-[11px] font-bold bg-emerald-500/20 text-emerald-600 border border-emerald-500/30 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                    ✓ Correct Answer
                  </span>
                )}
              </div>
            );
          })}
          {q.hint && (
            <div
              className="mt-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BsQuestionCircle className="text-indigo-600 shrink-0" size={16} />
              <span className="font-bold text-indigo-700" style={{ fontSize: '0.85rem' }}>Hint:</span>
              <span className="text-slate-700" style={{ fontSize: '0.85rem' }}>{q.hint}</span>
            </div>
          )}
          {q.explanation && (
            <div
              className="mt-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <BsLightbulb className="text-amber-600 shrink-0" size={16} />
              <span className="font-bold text-amber-700" style={{ fontSize: '0.85rem' }}>Explanation:</span>
              <span className="text-slate-700" style={{ fontSize: '0.85rem' }}>{q.explanation}</span>
            </div>
          )}
        </div>
      )}
      <button onClick={() => toggleQExpanded(q.id || q.id)} className={styles.expandBtn}>
        {!collapsedQs.has(q.id || q.id) ? '▲ Hide options' : '▼ Show options'}
      </button>
    </div>
  );

  const handleImageUpload = async (e) => {


    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      toast.loading('Uploading image...', { id: 'img-up' });
      const r = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setManualQ(prev => ({ ...prev, imageUrl: r.data.url }));
      toast.success('Image uploaded successfully!', { id: 'img-up' });
    } catch (err) {
      toast.error('Failed to upload image', { id: 'img-up' });
    }
  };

  const addParsed = async () => {

    if (!parsedQs.length) return;
    setSaving(true);
    try { const r = await api.post('/questions/bulk', { quizId: id, questions: parsedQs }); setQuestions(qs => [...qs, ...r.data.data]); setParsedQs([]); setUploadFile(null); toast.success(`${r.data.data.length} questions added!`); }
    catch { toast.error('Import failed'); } finally { setSaving(false); }
  };

  const togglePublish = async () => {
    try { const r = await api.patch(`/quizzes/${id}/publish`); setQuiz(q => ({ ...q, isPublished: r.data.data.isPublished })); toast.success(r.data.message); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleAutoTag = async () => {
    if (!manualQ.text.trim()) return toast.error('Enter question text first');
    try {
      toast.loading('Analyzing question...', { id: 'auto-tag' });
      const r = await api.post('/ai/autotag', {
        text: manualQ.text,
        options: manualQ.options.map(o => o.text).filter(Boolean)
      });
      const { difficulty, tags } = r.data.data;
      setManualQ(prev => ({
        ...prev,
        difficulty: difficulty || prev.difficulty,
        tags: tags ? tags.join(', ') : prev.tags
      }));
      toast.success('Question tagged successfully!', { id: 'auto-tag' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Auto-tag failed', { id: 'auto-tag' });
    }
  };


  if (loading) return <Layout><div className={styles.center}><div className="spinner" /></div></Layout>;

  const DIFF_COLOR = { easy: '#15803d', medium: '#854d0e', hard: '#dc2626' };

  return (
    <Layout>
      <div className={styles.page}>
        {/* Quiz bar */}
        <div className={styles.quizBar}>
          <Link to="/faculty/quizzes" className={styles.backLink}><BsArrowLeft size={14} /></Link>
          <div className={styles.quizBarInfo}>
            <h1>{quiz?.title}</h1>
            <span>{quiz?.subject} · <strong>{questions.length}</strong> questions · <strong>{quiz?.totalMarks}</strong> marks</span>
          </div>
          <div className={styles.quizBarActions}>
            <Link to={`/faculty/quiz/${id}/results`} className={styles.resultsBtn}>📊 Results</Link>
            <button onClick={togglePublish} className={`${styles.publishBtn} ${quiz?.isPublished ? styles.pubOn : styles.pubOff}`}>
              {quiz?.isPublished ? '⚪ Unpublish' : '🟢 Publish'}
            </button>
          </div>

        </div>

        <div className={styles.layout}>
          {/* Left panel — Add questions */}
          <div className={styles.addPanel}>
            <div className={styles.tabs}>
              {[{ k: 'manual', l: '✏️ Manual' }, { k: 'sections', l: '📁 Sections' }, { k: 'ai', l: '🤖 AI Generate' }, { k: 'upload', l: '📊 Excel/CSV' }].map(t => (
                <button key={t.k} className={`${styles.tab} ${activeTab === t.k ? styles.activeTab : ''}`} onClick={() => setActiveTab(t.k)}>{t.l}</button>
              ))}
            </div>


            <div className={styles.tabBody}>
              {/* SECTIONS */}
              {activeTab === 'sections' && (
                <div className={styles.sectionsContainer} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
                  <div className={styles.sectionsHeader}>📁 Manage Quiz Sections</div>
                  <form onSubmit={handleCreateSection} className="flex items-center gap-4 mt-3 w-full">
                    <input
                      type="text"
                      placeholder="Enter section name (e.g. Physics)"
                      value={newSectionTitle}
                      onChange={e => setNewSectionTitle(e.target.value)}
                      className={`w-full rounded-xl px-4 py-2.5 text-sm bg-slate-900 border border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 ${styles.sectionInput}`}
                      style={{ flex: '1 1 auto' }}
                    />
                    <button
                      type="submit"
                      disabled={saving}
                      className={`bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-2.5 text-sm font-semibold shadow-md transition-all shrink-0 border-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 ${styles.addSectionBtn}`}
                    >
                      <span className="btn-text">Add Section</span>
                    </button>
                  </form>
                  <div className={styles.sectionList}>
                    {sections.length === 0 ? (
                      <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem', textAlign: 'center', padding: '15px 0' }}>No sections created yet.</p>
                    ) : (
                      sections.map(s => (
                        <div key={s.id} className={`flex items-center justify-between bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 shadow-sm transition-colors w-full ${styles.sectionCard}`}>
                          <span className={`text-sm font-bold text-slate-100 tracking-wide badge-section-name ${styles.sectionText}`}>{s.title}</span>
                          <button
                            onClick={() => handleDeleteSection(s.id)}
                            className={`text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors ml-auto border-none bg-transparent cursor-pointer flex items-center justify-center ${styles.deleteSectionBtn}`}
                            title="Delete Section"
                          >
                            <BsTrash size={13} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* MANUAL */}
              {activeTab === 'manual' && (

                <div className={styles.manualForm}>
                  {editingId && (
                    <div className={styles.editBanner}><BsPencil size={13} /> Editing question <button onClick={() => { setManualQ(blankQ()); setEditingId(null); }} className={styles.cancelEdit}><BsX size={13} /> Cancel</button></div>
                  )}
                  <div className={styles.field}>
                    <label>Question Text *</label>
                    <textarea value={manualQ.text} onChange={e => setManualQ({ ...manualQ, text: e.target.value })} placeholder="Enter your question here..." rows={3} />
                  </div>

                  <div className={styles.field}>
                    <label>Question Image (Optional)</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        id="q-image-file"
                      />
                      <label htmlFor="q-image-file" className={styles.resultsBtn} style={{ cursor: 'pointer', margin: 0, padding: '8px 12px', display: 'inline-flex', fontSize: '0.8rem' }}>
                        Choose Image
                      </label>
                      {manualQ.imageUrl && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <img src={manualQ.imageUrl.startsWith('/') ? `http://localhost:5000${manualQ.imageUrl}` : manualQ.imageUrl} alt="preview" style={{ height: 40, width: 40, objectFit: 'contain', borderRadius: 4, background: '#f1f5f9' }} />
                          <button type="button" onClick={() => setManualQ({ ...manualQ, imageUrl: '' })} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.8rem' }}>Remove</button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={styles.field}>
                    <label>Question Type</label>
                    <select value={manualQ.type} onChange={e => changeType(e.target.value)}>
                      <option value="mcq">MCQ (Single Choice)</option>
                      <option value="multi_select">Multi-Select (Multiple Choice)</option>
                      <option value="true_false">True / False</option>
                      <option value="short_answer">Short Answer</option>
                    </select>
                  </div>
                  {sections.length > 0 && (
                    <div className={styles.field}>
                      <label>Quiz Section</label>
                      <select value={manualQ.sectionId || ''} onChange={e => setManualQ({ ...manualQ, sectionId: e.target.value ? parseInt(e.target.value) : '' })}>
                        <option value="">-- No Section (General) --</option>
                        {sections.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className={styles.row3}>
                    <div className={styles.field}>
                      <label>Difficulty</label>
                      <select value={manualQ.difficulty} onChange={e => setManualQ({ ...manualQ, difficulty: e.target.value })}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className={styles.field}><label>Marks</label><input type="number" min={0.5} step={0.5} value={manualQ.marks} onChange={e => setManualQ({ ...manualQ, marks: e.target.value })} /></div>
                    <div className={styles.field}><label>Negative Mark</label><input type="number" min={0} step={0.5} value={manualQ.negativeMark} onChange={e => setManualQ({ ...manualQ, negativeMark: e.target.value })} /></div>
                  </div>
                  <div className={styles.field}>
                    <label>
                      {manualQ.type === 'short_answer' ? 'Correct Answer' : 'Options '}
                      <small>
                        {manualQ.type === 'mcq' && '(select correct option)'}
                        {manualQ.type === 'multi_select' && '(select all correct options)'}
                        {manualQ.type === 'true_false' && '(select correct status)'}
                        {manualQ.type === 'short_answer' && '(type the correct text phrase)'}
                      </small>
                    </label>

                    {manualQ.type === 'short_answer' && (
                      <div className={styles.optRow}>
                        <input type="text" value={manualQ.options[0]?.text || ''} onChange={e => setOpt(0, 'text', e.target.value)} placeholder="Type the correct text answer keyphrase..." className={styles.optInput} />
                      </div>
                    )}

                    {manualQ.type === 'true_false' && manualQ.options.map((opt, i) => (
                      <div key={i} className={`${styles.optRow} ${opt.isCorrect ? styles.optCorrect : ''}`}>
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setOpt(i, 'isCorrect', true)} className={styles.radio} />
                        <span className={styles.optLetter} style={{ width: 80 }}>{opt.text}</span>
                        {opt.isCorrect && <BsCheckCircle size={15} color="#10b981" />}
                      </div>
                    ))}

                    {manualQ.type === 'mcq' && manualQ.options.map((opt, i) => (
                      <div key={i} className={`${styles.optRow} ${opt.isCorrect ? styles.optCorrect : ''}`}>
                        <input type="radio" name="correct" checked={opt.isCorrect} onChange={() => setOpt(i, 'isCorrect', true)} className={styles.radio} />
                        <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                        <input type="text" value={opt.text} onChange={e => setOpt(i, 'text', e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className={styles.optInput} />
                        {opt.isCorrect && <BsCheckCircle size={15} color="#10b981" />}
                      </div>
                    ))}

                    {manualQ.type === 'multi_select' && manualQ.options.map((opt, i) => (
                      <div key={i} className={`${styles.optRow} ${opt.isCorrect ? styles.optCorrect : ''}`}>
                        <input type="checkbox" checked={opt.isCorrect} onChange={e => setOpt(i, 'isCorrect', e.target.checked)} style={{ marginRight: 10 }} />
                        <span className={styles.optLetter}>{String.fromCharCode(65 + i)}</span>
                        <input type="text" value={opt.text} onChange={e => setOpt(i, 'text', e.target.value)} placeholder={`Option ${String.fromCharCode(65 + i)}`} className={styles.optInput} />
                        {opt.isCorrect && <BsCheckCircle size={15} color="#10b981" />}
                      </div>
                    ))}
                  </div>
                  <div className={styles.field}><label>Hint (optional)</label><input type="text" value={manualQ.hint} onChange={e => setManualQ({ ...manualQ, hint: e.target.value })} placeholder="Optional hint for students" /></div>
                  <div className={styles.field}><label>Tags (comma-separated)</label><input type="text" value={manualQ.tags || ''} onChange={e => setManualQ({ ...manualQ, tags: e.target.value })} placeholder="e.g. Java, OOP, Arrays" /></div>
                  <div className={styles.field}><label>Explanation (optional)</label><textarea value={manualQ.explanation} onChange={e => setManualQ({ ...manualQ, explanation: e.target.value })} placeholder="Explanation shown after submission..." rows={2} /></div>

                  <button onClick={saveManual} className={styles.addBtn} disabled={saving}>
                    {saving ? <span className={styles.spin} /> : editingId ? <><BsSave size={14} /> Update Question</> : <><BsPlus size={14} /> Add Question</>}
                  </button>
                </div>
              )}

              {/* AI */}
              {activeTab === 'ai' && (
                <div className={styles.aiForm}>
                  <div className={styles.aiBanner}>🤖 <strong>Gemini AI</strong> — Generate exam-ready questions instantly from any topic</div>
                  <div className={styles.field}><label>Topic *</label><input type="text" value={aiForm.topic} onChange={e => setAiForm({ ...aiForm, topic: e.target.value })} placeholder="e.g. Binary Trees, French Revolution, Photosynthesis..." /></div>

                  {sections && sections.length > 0 && (
                    <div className={styles.field}>
                      <label>Select Target Section *</label>
                      <select
                        value={aiForm.targetSectionId || ''}
                        onChange={e => {
                          setAiForm({
                            ...aiForm,
                            targetSectionId: e.target.value
                          });
                        }}
                        required
                      >
                        <option value="">-- Select Section --</option>
                        {sections.map(sec => (
                          <option key={sec.id} value={sec.id}>{sec.title}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Mixed Question Type Distribution Builder */}
                  <div className={styles.field}>
                    <label>Mixed Question Type Distribution *</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      {[
                        { key: 'MCQ', name: 'Multiple Choice (MCQ)' },
                        { key: 'MULTI_SELECT', name: 'Multi-Select (Multiple response)' },
                        { key: 'TRUE_FALSE', name: 'True / False' },
                        { key: 'SHORT_ANSWER', name: 'Short Answer' }
                      ].map(item => (
                        <div key={item.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-100)' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gray-800)' }}>{item.name}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = aiForm.distribution[item.key] || 0;
                                if (currentVal > 0) {
                                  setAiForm({
                                    ...aiForm,
                                    distribution: { ...aiForm.distribution, [item.key]: currentVal - 1 }
                                  });
                                }
                              }}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--gray-200)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="0"
                              max="30"
                              value={aiForm.distribution[item.key] || 0}
                              onChange={e => {
                                const val = Math.max(0, parseInt(e.target.value) || 0);
                                setAiForm({
                                  ...aiForm,
                                  distribution: { ...aiForm.distribution, [item.key]: val }
                                });
                              }}
                              style={{ width: '45px', textAlign: 'center', border: '1px solid var(--gray-200)', borderRadius: '6px', padding: '4px 0', fontWeight: 'bold', fontSize: '0.85rem' }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const currentVal = aiForm.distribution[item.key] || 0;
                                setAiForm({
                                  ...aiForm,
                                  distribution: { ...aiForm.distribution, [item.key]: currentVal + 1 }
                                });
                              }}
                              style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid var(--gray-200)', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Summary Badge */}
                  {(() => {
                    const totalQ = Object.values(aiForm.distribution).reduce((a, b) => a + b, 0);
                    return (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '10px', marginTop: '10px' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--primary)' }}>
                          Total Questions to Generate:
                        </span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, background: 'var(--primary)', color: 'white', padding: '4px 10px', borderRadius: '20px' }}>
                          {totalQ} Questions
                        </span>
                      </div>
                    );
                  })()}

                  <div className={styles.row2} style={{ marginTop: '15px' }}>
                    <div className={styles.field}><label>Marks for each question</label>
                      <input type="number" min="0.5" step="0.5" value={aiForm.marks} onChange={e => setAiForm({ ...aiForm, marks: e.target.value })} />
                    </div>
                    <div className={styles.field}><label>Difficulty</label>
                      <select value={aiForm.difficulty} onChange={e => setAiForm({ ...aiForm, difficulty: e.target.value })}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                    </div>
                  </div>
                  <div className={styles.field}><label>Additional Context</label><textarea value={aiForm.additionalContext} onChange={e => setAiForm({ ...aiForm, additionalContext: e.target.value })} placeholder="Subtopics, context, level of detail..." rows={2} /></div>
                  <button onClick={generateAI} className={styles.aiBtn} disabled={aiLoading}>
                    {aiLoading ? <><span className={styles.spin} /> Generating…</> : <><BsLightning size={14} /> Generate with  AI</>}
                  </button>
                  {aiLoading && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      padding: '30px 20px',
                      background: 'rgba(124, 58, 237, 0.05)',
                      border: '1px dashed var(--primary)',
                      borderRadius: '12px',
                      marginTop: '15px',
                      animation: 'pulse 2s infinite ease-in-out'
                    }}>
                      <div className="spinner" style={{ borderColor: 'var(--primary-glow)', borderTopColor: 'var(--primary)' }} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>Gemini AI is crafting your questions...</span>
                    </div>
                  )}
                  {aiQuestions.length > 0 && (
                    <div className={styles.aiResults}>
                      <div className={styles.aiResultsHead}>
                        <span>{aiQuestions.length} questions ready</span>
                        <button onClick={addAllAI} className={styles.addAllBtn} disabled={saving}><BsPlus size={13} /> Add All</button>
                      </div>
                      {aiQuestions.map((q, i) => (
                        <div key={i} className={styles.aiCard}>
                          <div className={styles.aiCardHead}>
                            <span className={styles.aiQNum}>Q{i + 1}</span>
                            <span className={styles.aiDiff} style={{ color: DIFF_COLOR[q.difficulty] || '#854d0e' }}>{q.difficulty} ({q.marks} {q.marks === 1 ? 'Mark' : 'Marks'})</span>
                            <button onClick={() => addAiQ(q)} className={styles.addOneBtn} disabled={saving}><BsPlus size={12} /> Add</button>
                          </div>
                          <p className={styles.aiQText}>{q.text}</p>
                          <div className={styles.aiOpts}>
                            {q.type === 'short_answer' ? (
                              <div className={`${styles.aiOpt} ${styles.aiCorrect}`}>
                                Correct Answer: <strong>{q.options[0]?.text}</strong>
                              </div>
                            ) : (
                              q.options.map((o, j) => (
                                <div key={j} className={`${styles.aiOpt} ${o.isCorrect ? styles.aiCorrect : ''}`}>
                                  {q.type === 'true_false' ? '' : `${String.fromCharCode(65 + j)}. `}{o.text}{o.isCorrect ? ' ✅' : ''}
                                </div>
                              ))
                            )}
                          </div>
                          {q.hint && <div className={styles.aiExpl} style={{ marginTop: '4px' }}>💡 <strong>Hint:</strong> {q.hint}</div>}
                          {q.explanation && <div className={styles.aiExpl} style={{ marginTop: '4px' }}>📖 <strong>Explanation:</strong> {q.explanation}</div>}
                          {q.tags && q.tags.length > 0 && (
                            <div className={styles.aiExpl} style={{ marginTop: '4px' }}>
                              🏷️ <strong>Tags:</strong> {q.tags.join(', ')}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* UPLOAD */}
              {activeTab === 'upload' && (
                <div className={styles.uploadForm}>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-3.5 flex items-center gap-3">
                    <span className="text-indigo-900 text-xs font-semibold leading-relaxed badge-banner-text">
                      📊 Import questions from Excel, CSV, or Word Document (.docx)
                    </span>
                  </div>
                  <button onClick={handleDownloadTemplate} className={styles.templateBtn}><BsDownload size={13} /> Download Template</button>
                  <div className={styles.dropZone} onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) setUploadFile(f); }}>
                    <BsUpload size={28} color="var(--gray-300)" />
                    <p>{uploadFile ? uploadFile.name : 'Click or drag & drop your file here'}</p>
                    <small>.xlsx · .xls · .csv · .docx (max 5MB)</small>
                    <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.docx" hidden onChange={e => setUploadFile(e.target.files[0])} />
                  </div>
                  {uploadFile && <button onClick={parseFile} className={styles.parseBtn} disabled={uploading}>{uploading ? <><span className={styles.spin} /> Parsing…</> : <><BsUpload size={13} /> Parse File</>}</button>}
                  {uploadErrors.length > 0 && <div className={styles.errorBox}>⚠️ {uploadErrors.length} warning(s):{uploadErrors.map((e, i) => <div key={i} className={styles.errRow}>· {e}</div>)}</div>}
                  {parsedQs.length > 0 && (
                    <div className={styles.parsedBox}>
                      <div className={styles.parsedHead}><span>✅ {parsedQs.length} questions ready</span><button onClick={addParsed} className={styles.addAllBtn} disabled={saving}><BsPlus size={13} /> Add All</button></div>
                      {parsedQs.slice(0, 3).map((q, i) => (
                        <div key={i} className={styles.parsedRow}><strong>Q{i + 1}:</strong> {q.text}<div className={styles.parsedOpts}>{q.options.map((o, j) => <span key={j} className={o.isCorrect ? styles.parsedCorrect : ''}>{String.fromCharCode(65 + j)}. {o.text}</span>)}</div></div>
                      ))}
                      {parsedQs.length > 3 && <p className={styles.moreText}>…and {parsedQs.length - 3} more</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right panel — Question list */}
          <div className={styles.qPanel}>
            <div className={styles.qPanelHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <h2>Questions ({questions.length})</h2>
                {questions.length > 0 && (
                  <button
                    onClick={() => {
                      if (collapsedQs.size === 0) {
                        setCollapsedQs(new Set(questions.map(q => q.id || q.id)));
                      } else {
                        setCollapsedQs(new Set());
                      }
                    }}
                    style={{ fontSize: '0.72rem', background: 'var(--primary-lighter)', color: 'var(--primary)', border: 'none', borderRadius: '6px', padding: '5px 10px', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    {collapsedQs.size === 0 ? 'Collapse All Options' : 'Expand All Options'}
                  </button>
                )}
              </div>
              <span className={styles.totalMarks}>{quiz?.totalMarks} total marks</span>
            </div>
            {questions.length === 0 ? (
              <div className={styles.emptyQList}><BsPatchQuestion size={40} color="var(--gray-300)" /><p>No questions yet. Use the panel on the left to add questions.</p></div>
            ) : (
              <div className={styles.qList}>
                {sections.length === 0 || questions.every(q => !q.sectionId && !q.section?.id) ? (
                  questions.map((q, i) => renderQuestionCard(q, i))
                ) : (
                  Object.entries(getGroupedQuestions()).map(([sectionTitle, secQuestions]) => (
                    <div key={sectionTitle} style={{ marginBottom: 20 }}>
                      <h3 style={{ borderBottom: '2px solid var(--primary)', paddingBottom: 6, marginBottom: 12, color: 'var(--primary)', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>📁 {sectionTitle}</span>
                        <span style={{ fontSize: '0.8rem', background: 'var(--gray-100)', color: 'var(--gray-600)', padding: '2px 8px', borderRadius: 10, fontWeight: 'normal' }}>
                          {secQuestions.length} {secQuestions.length === 1 ? 'question' : 'questions'}
                        </span>
                      </h3>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {secQuestions.map((q, i) => renderQuestionCard(q, questions.indexOf(q)))}
                      </div>
                    </div>
                  ))
                )}
              </div>

            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
