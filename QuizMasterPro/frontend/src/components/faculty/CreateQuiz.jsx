import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Row, Col, Form, Tab, Nav, Spinner, Accordion } from 'react-bootstrap';
import { FiSave, FiCpu, FiPlus, FiTrash2, FiInfo, FiCheck } from 'react-icons/fi';
import { quizApi, questionApi, aiApi } from '../../services/api';
import { AppLayout } from '../layout/Layout';
import toast from 'react-hot-toast';

const defaultQuiz = {
  title: '', description: '', subject: '', category: 'General', difficulty: 'medium',
  durationMinutes: 30, passingMarks: 0, maxAttempts: 1,
  shuffleQuestions: false, shuffleOptions: false, showResults: true, showAnswersAfter: true,
  instructions: '', tags: [], accessCode: '',
  preventTabSwitch: true, preventCopyPaste: true, preventRightClick: true,
  fullscreenRequired: false, maxWarnings: 3,
  certificateEnabled: false, certificateMinScore: 80,
  leaderboardEnabled: true, feedbackEnabled: true, pointsOnPass: 10,
};

const defaultQ = { text: '', type: 'mcq', marks: 1, negativeMark: 0, difficulty: 'medium', explanation: '', hint: '', options: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }] };

export const CreateQuizPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(defaultQuiz);
  const [questions, setQuestions] = useState([{ ...defaultQ }]);
  const [saving, setSaving] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', difficulty: 'medium', count: 5, questionType: 'mcq' });
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [savedQuizId, setSavedQuizId] = useState(null);
  const [tagInput, setTagInput] = useState('');

  const setQ = (k, v) => setQuiz(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (id) {
      setSavedQuizId(id);
      quizApi.getById(id)
        .then(r => {
          const data = r.data?.data || r.data?.Data;
          if (data) {
            setQuiz({
              title: data.title || '',
              description: data.description || '',
              subject: data.subject || '',
              category: data.category || 'General',
              difficulty: data.difficulty || 'medium',
              durationMinutes: data.durationMinutes || 30,
              passingMarks: data.passingMarks || 0,
              maxAttempts: data.maxAttempts || 1,
              shuffleQuestions: data.shuffleQuestions || false,
              shuffleOptions: data.shuffleOptions || false,
              showResults: data.showResults ?? true,
              showAnswersAfter: data.showAnswersAfter ?? true,
              instructions: data.instructions || '',
              tags: data.tags || [],
              accessCode: data.accessCode || '',
              preventTabSwitch: data.antiCheat?.preventTabSwitch ?? data.preventTabSwitch ?? false,
              preventCopyPaste: data.antiCheat?.preventCopyPaste ?? data.preventCopyPaste ?? false,
              preventRightClick: data.antiCheat?.preventRightClick ?? data.preventRightClick ?? false,
              fullscreenRequired: data.antiCheat?.fullscreenRequired ?? data.fullscreenRequired ?? false,
              maxWarnings: data.antiCheat?.maxWarnings ?? data.maxWarnings ?? 3,
              certificateEnabled: data.certificateEnabled || false,
              certificateMinScore: data.certificateMinScore || 80,
              leaderboardEnabled: data.leaderboardEnabled ?? true,
              feedbackEnabled: data.feedbackEnabled ?? true,
              pointsOnPass: data.pointsOnPass || 10,
            });
          }
        })
        .catch(() => toast.error('Failed to load quiz details'));

      questionApi.getByQuiz(id)
        .then(r => {
          const qList = r.data?.data || r.data?.Data || [];
          if (qList.length > 0) {
            setQuestions(qList.map(q => ({
              text: q.text || '',
              type: q.type || 'mcq',
              marks: q.marks || 1,
              negativeMark: q.negativeMark || 0,
              difficulty: q.difficulty || 'medium',
              explanation: q.explanation || '',
              hint: q.hint || '',
              options: q.options && q.options.length > 0
                ? q.options.map(o => ({ text: o.text || '', isCorrect: o.isCorrect || false }))
                : [{ text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }, { text: '', isCorrect: false }]
            })));
          }
        })
        .catch(() => toast.error('Failed to load quiz questions'));
    }
  }, [id]);

  const saveQuiz = async () => {
    if (!quiz.title || !quiz.subject) { toast.error('Title and subject are required'); return; }
    setSaving(true);
    try {
      if (id) {
        await quizApi.update(id, quiz);
        toast.success('Quiz details updated!');
        setActiveTab('questions');
      } else {
        const r = await quizApi.create(quiz);
        const qid = r.data?.data?.id || r.data?.Data?.id || r.data?.Id;
        setSavedQuizId(qid);
        toast.success('Quiz created! Now add questions.');
        setActiveTab('questions');
      }
    } catch (e) {
      toast.error(id ? 'Failed to update quiz' : 'Failed to create quiz');
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => setQuestions(p => [...p, { ...defaultQ, options: defaultQ.options.map(o => ({ ...o })) }]);
  const removeQuestion = (i) => setQuestions(p => p.filter((_, idx) => idx !== i));
  const setQField = (i, k, v) => setQuestions(p => { const n = [...p]; n[i] = { ...n[i], [k]: v }; return n; });
  const setOption = (qi, oi, k, v) => setQuestions(p => {
    const n = [...p]; const opts = [...n[qi].options]; opts[oi] = { ...opts[oi], [k]: v };
    if (k === 'isCorrect' && v && n[qi].type !== 'multi_select') opts.forEach((o, idx) => { if (idx !== oi) opts[idx] = { ...o, isCorrect: false }; });
    n[qi].options = opts; return n;
  });

  const saveQuestions = async () => {
    if (!savedQuizId) { toast.error('Save quiz details first'); return; }
    const valid = questions.filter(q => q.text.trim() && q.options.some(o => o.text.trim()));
    if (!valid.length) { toast.error('Add at least one question'); return; }
    setSaving(true);
    try {
      await questionApi.bulk(savedQuizId, valid);
      toast.success(`${valid.length} questions saved!`);
      navigate('/faculty/quizzes');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save questions');
    } finally {
      setSaving(false);
    }
  };

  const generateAI = async () => {
    if (!aiForm.topic) { toast.error('Enter a topic'); return; }
    if (!savedQuizId) { toast.error('Save quiz first'); return; }
    setAiLoading(true);
    try {
      const r = await aiApi.generate({ ...aiForm, quizId: savedQuizId });
      if (r.data.success) {
        toast.success(`${r.data.data.length} AI questions added!`);
        navigate('/faculty/quizzes');
      }
    } catch { toast.error('AI generation failed. Check your API key.'); } finally { setAiLoading(false); }
  };

  const addTag = () => { if (tagInput.trim()) { setQ('tags', [...quiz.tags, tagInput.trim()]); setTagInput(''); } };

  return (
    <AppLayout title={id ? "Edit Quiz" : "Create Quiz"}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h5 style={{ fontWeight: 700, margin: 0 }}>{id ? 'Edit Quiz' : 'Create New Quiz'}</h5>
          <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>{id ? 'Modify details and questions' : 'Fill details, add questions manually or via AI'}</p>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 24px' }}>
          {['details', 'questions', 'ai'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ padding: '16px 20px', border: 'none', background: 'none', fontWeight: 600, fontSize: '.875rem', cursor: 'pointer', borderBottom: activeTab === tab ? '2px solid var(--primary)' : '2px solid transparent', color: activeTab === tab ? 'var(--primary)' : 'var(--gray)', marginBottom: -1 }}>
              {tab === 'details' ? '📋 Quiz Details' : tab === 'questions' ? '❓ Add Questions' : '🤖 AI Generate'}
            </button>
          ))}
        </div>

        <div style={{ padding: 28 }}>
          {/* ── DETAILS TAB ── */}
          {activeTab === 'details' && (
            <Row className="g-3">
              <Col md={8}>
                <label className="form-label-custom">Quiz Title *</label>
                <input className="form-control-custom" placeholder="e.g. Data Structures & Algorithms MCQ" value={quiz.title} onChange={e => setQ('title', e.target.value)} />
              </Col>
              <Col md={4}>
                <label className="form-label-custom">Subject *</label>
                <input className="form-control-custom" placeholder="e.g. Computer Science" value={quiz.subject} onChange={e => setQ('subject', e.target.value)} />
              </Col>
              <Col md={12}>
                <label className="form-label-custom">Description</label>
                <textarea className="form-control-custom" rows={2} placeholder="Brief description..." value={quiz.description} onChange={e => setQ('description', e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Category</label>
                <select className="form-control-custom" value={quiz.category} onChange={e => setQ('category', e.target.value)}>
                  {['General', 'Academic', 'Technical', 'Competitive', 'Practice'].map(c => <option key={c}>{c}</option>)}
                </select>
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Difficulty</label>
                <select className="form-control-custom" value={quiz.difficulty} onChange={e => setQ('difficulty', e.target.value)}>
                  <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                </select>
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Duration (minutes)</label>
                <input className="form-control-custom" type="number" min={1} value={quiz.durationMinutes} onChange={e => setQ('durationMinutes', e.target.value === '' ? '' : +e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Max Attempts</label>
                <input className="form-control-custom" type="number" min={1} value={quiz.maxAttempts} onChange={e => setQ('maxAttempts', e.target.value === '' ? '' : +e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Passing Marks</label>
                <input className="form-control-custom" type="number" min={0} value={quiz.passingMarks} onChange={e => setQ('passingMarks', e.target.value === '' ? '' : +e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Access Code (optional)</label>
                <input className="form-control-custom" placeholder="Leave blank for open access" value={quiz.accessCode} onChange={e => setQ('accessCode', e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Points on Pass</label>
                <input className="form-control-custom" type="number" min={0} value={quiz.pointsOnPass} onChange={e => setQ('pointsOnPass', e.target.value === '' ? '' : +e.target.value)} />
              </Col>
              <Col md={3}>
                <label className="form-label-custom">Certificate Min Score</label>
                <input className="form-control-custom" type="number" min={0} max={100} value={quiz.certificateMinScore} onChange={e => setQ('certificateMinScore', e.target.value === '' ? '' : +e.target.value)} disabled={!quiz.certificateEnabled} />
              </Col>

              {/* Tags */}
              <Col md={12}>
                <label className="form-label-custom">Tags</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="form-control-custom" placeholder="Add tag..." value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTag()} style={{ flex: 1 }} />
                  <button onClick={addTag} style={{ padding: '0 16px', background: 'var(--primary-light)', border: 'none', borderRadius: 8, color: 'var(--primary)', fontWeight: 600, cursor: 'pointer' }}>Add</button>
                </div>
                {quiz.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {quiz.tags.map(t => <span key={t} onClick={() => setQ('tags', quiz.tags.filter(x => x !== t))} style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)', padding: '3px 10px', borderRadius: 20, fontSize: '.78rem', cursor: 'pointer', fontWeight: 600 }}>{t} ×</span>)}
                  </div>
                )}
              </Col>

              {/* Toggle Options */}
              <Col md={12}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, background: 'var(--bg)', borderRadius: 10, padding: 16 }}>
                  {[
                    ['shuffleQuestions', 'Shuffle Questions'],
                    ['shuffleOptions', 'Shuffle Options'],
                    ['showResults', 'Show Results'],
                    ['showAnswersAfter', 'Show Answers After'],
                    ['preventTabSwitch', 'Anti-Cheat: Tab Switch'],
                    ['preventCopyPaste', 'Anti-Cheat: Copy-Paste'],
                    ['preventRightClick', 'Anti-Cheat: Right Click'],
                    ['fullscreenRequired', 'Fullscreen Required'],
                    ['certificateEnabled', 'Enable Certificate'],
                    ['leaderboardEnabled', 'Leaderboard'],
                    ['feedbackEnabled', 'Feedback'],
                  ].map(([k, lbl]) => (
                    <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '.875rem', fontWeight: 500 }}>
                      <input type="checkbox" checked={quiz[k]} onChange={e => setQ(k, e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </Col>

              <Col md={12} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button onClick={saveQuiz} className="btn-primary-custom" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving}>
                  {saving ? <Spinner size="sm" /> : <><FiSave /> {savedQuizId ? 'Update Details' : 'Save & Continue'}</>}
                </button>
              </Col>
            </Row>
          )}

          {/* ── QUESTIONS TAB ── */}
          {activeTab === 'questions' && (
            <div>
              {!savedQuizId && <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '.875rem', color: '#92400e' }}>⚠️ Please save quiz details first before adding questions.</div>}
              {questions.map((q, qi) => (
                <div key={qi} style={{ border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16, background: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '.875rem' }}>Question {qi + 1}</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <select value={q.type} onChange={e => setQField(qi, 'type', e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: '.8rem' }}>
                        <option value="mcq">MCQ</option><option value="true_false">True/False</option>
                      </select>
                      <select value={q.difficulty} onChange={e => setQField(qi, 'difficulty', e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontSize: '.8rem' }}>
                        <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                      </select>
                      {questions.length > 1 && <button onClick={() => removeQuestion(qi)} style={{ padding: '4px 8px', border: 'none', background: '#ffe4e6', borderRadius: 6, color: 'var(--danger)', cursor: 'pointer' }}><FiTrash2 /></button>}
                    </div>
                  </div>
                  <textarea className="form-control-custom" rows={2} placeholder="Question text..." value={q.text} onChange={e => setQField(qi, 'text', e.target.value)} style={{ marginBottom: 12 }} />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                    {(q.type === 'true_false' ? q.options.slice(0, 2) : q.options).map((opt, oi) => (
                      <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: `1.5px solid ${opt.isCorrect ? 'var(--success)' : 'var(--border)'}`, borderRadius: 8, background: opt.isCorrect ? '#f0fdf4' : 'white' }}>
                        <input type="checkbox" checked={opt.isCorrect} onChange={e => setOption(qi, oi, 'isCorrect', e.target.checked)} style={{ accentColor: 'var(--success)', width: 16, height: 16, flexShrink: 0 }} />
                        <input style={{ border: 'none', outline: 'none', flex: 1, fontSize: '.875rem', background: 'transparent' }}
                          placeholder={q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : `Option ${String.fromCharCode(65 + oi)}`}
                          value={q.type === 'true_false' ? (oi === 0 ? 'True' : 'False') : opt.text}
                          onChange={e => q.type !== 'true_false' && setOption(qi, oi, 'text', e.target.value)}
                          readOnly={q.type === 'true_false'} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Marks</label>
                      <input type="number" min={0} step={0.5} value={q.marks} onChange={e => setQField(qi, 'marks', e.target.value === '' ? '' : +e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', width: '100%', fontSize: '.875rem' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Negative Mark</label>
                      <input type="number" min={0} step={0.25} value={q.negativeMark} onChange={e => setQField(qi, 'negativeMark', e.target.value === '' ? '' : +e.target.value)} style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', width: '100%', fontSize: '.875rem' }} />
                    </div>
                    <div style={{ flex: 2 }}>
                      <label style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--gray)', display: 'block', marginBottom: 4 }}>Explanation (optional)</label>
                      <input value={q.explanation} onChange={e => setQField(qi, 'explanation', e.target.value)} placeholder="Why is this the answer?" style={{ border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', width: '100%', fontSize: '.875rem' }} />
                    </div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={addQuestion} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', border: '2px dashed var(--border)', borderRadius: 8, background: 'white', cursor: 'pointer', fontWeight: 600, color: 'var(--gray)', fontSize: '.875rem' }}>
                  <FiPlus /> Add Question
                </button>
                <button onClick={saveQuestions} className="btn-primary-custom" style={{ display: 'flex', alignItems: 'center', gap: 6 }} disabled={saving || !savedQuizId}>
                  {saving ? <Spinner size="sm" /> : <><FiCheck /> Save {questions.length} Questions</>}
                </button>
              </div>
            </div>
          )}

          {/* ── AI TAB ── */}
          {activeTab === 'ai' && (
            <div>
              {!savedQuizId && <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: '.875rem', color: '#92400e' }}>⚠️ Save quiz details first before generating AI questions.</div>}
              <div style={{ background: 'linear-gradient(135deg, var(--primary-light), var(--bg-alt))', borderRadius: 12, padding: 24, marginBottom: 20, border: '1px solid rgba(232,115,10,.2)' }}>
                <h6 style={{ fontWeight: 700, color: 'var(--primary-dark)', margin: '0 0 6px' }}>🤖 AI Question Generator</h6>
                <p style={{ color: 'var(--gray)', fontSize: '.875rem', margin: 0 }}>Powered by Google Gemini. Generates high-quality questions instantly.</p>
              </div>
              <Row className="g-3">
                <Col md={8}>
                  <label className="form-label-custom">Topic / Subject *</label>
                  <input className="form-control-custom" placeholder="e.g. Binary Search Trees, Photosynthesis, Indian Constitution" value={aiForm.topic} onChange={e => setAiForm(p => ({ ...p, topic: e.target.value }))} />
                </Col>
                <Col md={4}>
                  <label className="form-label-custom">Question Type</label>
                  <select className="form-control-custom" value={aiForm.questionType} onChange={e => setAiForm(p => ({ ...p, questionType: e.target.value }))}>
                    <option value="mcq">MCQ</option><option value="true_false">True/False</option>
                  </select>
                </Col>
                <Col md={4}>
                  <label className="form-label-custom">Difficulty</label>
                  <select className="form-control-custom" value={aiForm.difficulty} onChange={e => setAiForm(p => ({ ...p, difficulty: e.target.value }))}>
                    <option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option>
                  </select>
                </Col>
                <Col md={4}>
                  <label className="form-label-custom">Number of Questions</label>
                  <select className="form-control-custom" value={aiForm.count} onChange={e => setAiForm(p => ({ ...p, count: +e.target.value }))}>
                    {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Col>
                <Col md={12}>
                  <button onClick={generateAI} className="btn-primary-custom" style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: 8 }} disabled={aiLoading || !savedQuizId}>
                    {aiLoading ? <><Spinner size="sm" /> Generating with Gemini...</> : <><FiCpu /> Generate Questions</>}
                  </button>
                </Col>
              </Row>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};
