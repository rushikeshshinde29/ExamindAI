import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { usePreferences } from '../../context/PreferencesContext';
import { playClickSound } from '../../utils/sound';
import {
  BsClock, BsFlag, BsExclamationTriangle, BsCheckCircle, BsChevronLeft, BsChevronRight,
  BsSend, BsPatchQuestion, BsJournalText, BsStar, BsArrowRepeat, BsQuestionCircle,
  BsBookmark, BsBookmarkFill
} from 'react-icons/bs';
import styles from './TakeQuiz.module.css';
import CodeBlock from '../../components/CodeBlock';

// Universal Fullscreen Helpers (All Browsers)
const enterFullScreen = (element = document.documentElement) => {
  if (!element) return;

  const requestMethod =
    element.requestFullscreen ||
    element.webkitRequestFullscreen ||   // Safari
    element.mozRequestFullScreen ||      // Firefox (old)
    element.msRequestFullscreen;         // IE/Edge (old)

  if (requestMethod) {
    requestMethod.call(element);
  } else {
    console.warn("Fullscreen API is not supported in this browser.");
  }
};

const exitFullScreen = () => {
  const exitMethod =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||   // Safari
    document.mozCancelFullScreen ||   // Firefox (old)
    document.msExitFullscreen;        // IE/Edge (old)

  if (exitMethod) {
    exitMethod.call(document);
  }
};

const isFullScreen = () => {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
};

export default function TakeQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { prefs } = usePreferences();

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState(new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visited, setVisited] = useState(new Set([0]));
  const [timeLeft, setTimeLeft] = useState(0);
  const [phase, setPhase] = useState('loading');
  const [warnings, setWarnings] = useState(0);
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [warnMsg, setWarnMsg] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showDqModal, setShowDqModal] = useState(false);
  const [dqResultId, setDqResultId] = useState(null);
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const questionRefs = useRef({});
  const attemptRef = useRef(null);
  const lastViolationTimeRef = useRef(0);
  const wasFullScreenRef = useRef(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mergerActiveRef = useRef(false);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);

  useEffect(() => {
    setVisited(prev => {
      const next = new Set(prev);
      next.add(currentIdx);
      return next;
    });
  }, [currentIdx]);

  useEffect(() => {
    api.get('/bookmarks').then(r => {
      const ids = new Set((r.data.data || []).map(b => b.question?.id));
      setBookmarkedIds(ids);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get(`/quizzes/${id}`).then(r => { setQuiz(r.data.data); setTimeLeft(r.data.data.duration * 60); setPhase('intro'); })
      .catch(() => { toast.error('Quiz not found'); navigate('/student/quizzes'); });
  }, [id, navigate]);

  useEffect(() => {
    if (questions && questions.length > 0) {
      setTimeout(() => {
        window.MathJax?.typesetPromise?.();
      }, 50);
    }
  }, [currentIdx, questions]);

  const submitQuiz = useCallback(async (reason = 'manual') => {
    if (!attempt) return;
    setPhase('submitting');
    clearInterval(timerRef.current);
    const timeTaken = Math.round((Date.now() - startRef.current) / 1000);
    const ansArr = questions.map(q => {
      const isShort = q.type === 'short_answer';
      const ansVal = answers[q.id || q.id];
      return {
        questionId: q.id || q.id,
        selectedOption: isShort ? null : (ansVal ?? null),
        textAnswer: isShort ? (ansVal ?? null) : null,
        flagged: flagged.has(q.id || q.id),
        timeTaken: 0
      };
    });

    let res;
    try {
      res = await api.post(`/attempts/${attempt.id || attempt.id}/submit`, { answers: ansArr, timeTaken });
    } catch (err) {
      console.error("Quiz submission post failed:", err);
      toast.error('Submission failed. Try again.');
      setPhase('exam');
      return;
    }

    try {
      exitFullScreen();
      await stopAndUploadRecording(attempt.id || attempt.id);
    } catch (err) {
      console.error("Proctoring recording upload failed but submission is saved:", err);
    }

    if (reason === 'timeout') {
      toast('⏰ Time up! Quiz auto-submitted.', { icon: '⏰' });
      navigate(`/student/result/${res.data.data.id || res.data.data.id}`);
    } else if (reason === 'disqualified') {
      toast.error('You have been disqualified due to violations.');
      navigate(`/student/result/${res.data.data.id || res.data.data.id}`);
    } else {
      toast.success('Quiz submitted successfully!');
      navigate(`/student/result/${res.data.data.id || res.data.data.id}`);
    }
  }, [attempt, answers, questions, flagged, navigate]);


  // Timer
  useEffect(() => {
    if (phase !== 'exam') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => { if (t <= 1) { clearInterval(timerRef.current); submitQuiz('timeout'); return 0; } return t - 1; });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, submitQuiz]);

  const reportViolation = useCallback((event, details) => {
    const now = Date.now();
    if (now - lastViolationTimeRef.current < 1000) {
      return; // prevent duplicate trigger/warnings
    }
    lastViolationTimeRef.current = now;

    const currentAttempt = attemptRef.current;
    if (!currentAttempt?.id) return;

    api.post(`/attempts/${currentAttempt.id}/anticheat`, { event, details })
      .then(r => {
        const w = r.data.warningCount || 0;
        setWarnings(w);
        
        let msg = '';
        if (details.includes('fullscreen') || details.includes('Escape')) {
          msg = 'You have exited fullscreen mode. This action is considered a violation.';
        } else if (event === 'tab_switch') {
          msg = 'Tab switching detected! This action is considered a violation.';
        } else if (event === 'copy_attempt') {
          msg = 'Copy, cut, or paste operations are blocked!';
        } else if (event === 'right_click') {
          msg = 'Right-click context menu is disabled!';
        }
        
        setWarnMsg(`⚠️ ${msg} (Warning ${w}/${quiz?.antiCheat?.maxWarnings || 3})`);
        setShowWarnModal(true);
        
        if (r.data.disqualified || w >= (quiz?.antiCheat?.maxWarnings || 3)) {
          setShowWarnModal(false);
          setShowDqModal(true);
        }
      })
      .catch(console.error);
  }, [quiz, submitQuiz]);

  const closeWarnModal = () => {
    setShowWarnModal(false);
    if (!isFullScreen()) {
      enterFullScreen();
      wasFullScreenRef.current = true;
    }
  };

  const closeDqModal = () => {
    setShowDqModal(false);
    submitQuiz('disqualified');
  };

  const stopAndUploadRecording = (attemptId) => {
    return new Promise((resolve) => {
      mergerActiveRef.current = false;
      
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = async () => {
          // Stop all media tracks
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach(track => track.stop());
          }
          if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
          }

          if (recordedChunksRef.current.length > 0) {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const file = new File([blob], `recording_${attemptId}.webm`, { type: 'video/webm' });

            const formData = new FormData();
            formData.append('file', file);

            try {
              toast.loading("Uploading proctoring video... Please do not close this window.", { id: 'upload-toast' });
              await api.post(`/attempts/${attemptId}/upload-recording`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 600000 // 10 minutes timeout for large proctoring video file transfers
              });
              toast.success("Proctoring recording uploaded successfully!", { id: 'upload-toast' });
            } catch (err) {
              console.error("Failed to upload proctoring video:", err);
              toast.error("Proctoring video upload failed.", { id: 'upload-toast' });
            }
          }
          resolve();
        };

        try {
          recorder.stop();
        } catch (e) {
          console.error("Error stopping MediaRecorder:", e);
          resolve();
        }
      } else {
        // Stop all media tracks if recorder is not active
        if (screenStreamRef.current) {
          screenStreamRef.current.getTracks().forEach(track => track.stop());
        }
        if (cameraStreamRef.current) {
          cameraStreamRef.current.getTracks().forEach(track => track.stop());
        }
        resolve();
      }
    });
  };

  // Anti-cheat: tab switch
  useEffect(() => {
    if (phase !== 'exam') return;
    const handleVisibility = () => {
      if (document.hidden && quiz?.antiCheat?.preventTabSwitch) {
        reportViolation('tab_switch', 'User switched tab');
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [phase, quiz, reportViolation]);

  // Anti-cheat: fullscreen exit
  useEffect(() => {
    if (phase !== 'exam') return;
    const handleFullscreenChange = () => {
      const currentlyFullScreen = isFullScreen();
      if (wasFullScreenRef.current && !currentlyFullScreen) {
        reportViolation('tab_switch', 'User exited fullscreen mode');
      }
      wasFullScreenRef.current = currentlyFullScreen;
    };
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];
    events.forEach((event) => document.addEventListener(event, handleFullscreenChange));
    return () => {
      events.forEach((event) => document.removeEventListener(event, handleFullscreenChange));
    };
  }, [phase, quiz, reportViolation]);

  // Anti-cheat: right-click & copy
  useEffect(() => {
    if (phase !== 'exam') return;
    const prevent = (e) => {
      if (quiz?.antiCheat?.preventRightClick) {
        e.preventDefault();
        reportViolation('right_click', 'Right click blocked');
      }
    };
    const preventCopy = (e) => {
      if (quiz?.antiCheat?.preventCopyPaste) {
        e.preventDefault();
        reportViolation('copy_attempt', `${e.type.toUpperCase()} blocked`);
      }
    };
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('copy', preventCopy);
    document.addEventListener('cut', preventCopy);
    document.addEventListener('paste', preventCopy);
    return () => {
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('copy', preventCopy);
      document.removeEventListener('cut', preventCopy);
      document.removeEventListener('paste', preventCopy);
    };
  }, [phase, quiz, reportViolation]);

  // Anti-cheat: prevent common shortcuts
  useEffect(() => {
    if (phase !== 'exam') return;

    const handleKeyDown = (e) => {
      const key = e.key;
      const isEscape = key === "Escape";
      const isF11 = key === "F11";
      const isNewTab = e.ctrlKey && key.toLowerCase() === "t";
      const isCloseTab = e.ctrlKey && key.toLowerCase() === "w";
      const isAltTab = e.altKey && key === "Tab";

      if (isEscape || isF11 || isNewTab || isCloseTab || isAltTab) {
        e.preventDefault();
        e.stopPropagation();

        if (isEscape) {
          reportViolation('tab_switch', 'User pressed Escape key');
        } else {
          reportViolation('tab_switch', `User tried shortcut: ${key || 'Alt+Tab'}`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [phase, reportViolation]);

  const startExam = async () => {
    let screenStream = null;
    let cameraStream = null;

    try {
      // 1. Request display sharing prioritizing entire screen (monitor)
      screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "monitor" },
        audio: false
      });

      // Enforce entire screen sharing constraint
      const screenTrack = screenStream.getVideoTracks()[0];
      const settings = screenTrack.getSettings();
      if (settings.displaySurface !== 'monitor') {
        screenTrack.stop();
        toast.error("You must share your ENTIRE screen (monitor), not just a single window or tab.");
        return;
      }

      // Request webcam media feeds
      cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    } catch (err) {
      toast.error("Screen sharing and camera access are mandatory to complete this proctored exam.");
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
      return;
    }

    try {
      let startedAttempt;
      if (location.state?.attemptId) {
        const aRes = await api.get(`/attempts/${location.state.attemptId}`);
        startedAttempt = aRes.data.data;
      } else {
        const aRes = await api.post('/attempts/start', { quizId: id, accessCode: accessCode || undefined });
        startedAttempt = aRes.data.data;
      }

      const qRes = await api.get(`/attempts/${startedAttempt.id}/questions`);

      setAttempt(startedAttempt);
      attemptRef.current = startedAttempt;
      setQuestions(qRes.data.data);
      startRef.current = Date.now();

      // 2. Setup streams merging and recording
      screenStreamRef.current = screenStream;
      cameraStreamRef.current = cameraStream;
      recordedChunksRef.current = [];

      const screenVideo = document.createElement('video');
      screenVideo.srcObject = screenStream;
      screenVideo.muted = true;
      screenVideo.playsInline = true;
      screenVideo.setAttribute('playsinline', 'true');
      screenVideo.play().catch(err => console.warn("screenVideo play failed:", err));

      const cameraVideo = document.createElement('video');
      cameraVideo.srcObject = cameraStream;
      cameraVideo.muted = true;
      cameraVideo.playsInline = true;
      cameraVideo.setAttribute('playsinline', 'true');
      cameraVideo.play().catch(err => console.warn("cameraVideo play failed:", err));

      const canvas = document.createElement('canvas');
      canvas.width = 1280;
      canvas.height = 720;
      const ctx = canvas.getContext('2d');

      mergerActiveRef.current = true;
      const drawFrame = () => {
        if (!mergerActiveRef.current) return;

        // Draw screen video if ready, fallback to dark slate screen
        if (screenVideo.readyState >= 2) {
          ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height);
        } else {
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Webcam PiP in bottom-right corner (width: 240, height: 180) if ready
        if (cameraVideo.readyState >= 2) {
          const camW = 240;
          const camH = 180;
          const camX = canvas.width - camW - 20;
          const camY = canvas.height - camH - 20;

          ctx.fillStyle = '#0f172a';
          ctx.fillRect(camX - 2, camY - 2, camW + 4, camH + 4);
          ctx.drawImage(cameraVideo, camX, camY, camW, camH);
        }

        requestAnimationFrame(drawFrame);
      };

      drawFrame();

      const mergedStream = canvas.captureStream(24);
      if (cameraStream.getAudioTracks().length > 0) {
        mergedStream.addTrack(cameraStream.getAudioTracks()[0]);
      }

      const recorder = new MediaRecorder(mergedStream, { mimeType: 'video/webm' });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      recorder.start(1000);
      mediaRecorderRef.current = recorder;

      setPhase('exam');
      enterFullScreen();
      wasFullScreenRef.current = true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start quiz');
      if (screenStream) screenStream.getTracks().forEach(t => t.stop());
      if (cameraStream) cameraStream.getTracks().forEach(t => t.stop());
    }
  };

  const handleAnswer = (optIdx) => {
    if (prefs?.soundEffects) playClickSound();
    setAnswers(prev => ({ ...prev, [questions[currentIdx].id || questions[currentIdx].id]: optIdx }));
  };

  const clearCurrentAnswer = () => {
    setAnswers(prev => {
      const next = { ...prev };
      delete next[questions[currentIdx].id || questions[currentIdx].id];
      return next;
    });
  };

  const toggleFlag = (qId) => setFlagged(prev => { const s = new Set(prev); s.has(qId) ? s.delete(qId) : s.add(qId); return s; });
  const toggleBookmark = async (questionId) => {
    if (!questionId) return;
    const isBookmarked = bookmarkedIds.has(questionId);
    try {
      if (isBookmarked) {
        await api.delete(`/bookmarks/${questionId}`);
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.delete(questionId);
          return next;
        });
        toast.success('Bookmark removed');
      } else {
        await api.post('/bookmarks', { questionId });
        setBookmarkedIds(prev => {
          const next = new Set(prev);
          next.add(questionId);
          return next;
        });
        toast.success('Question bookmarked');
      }
    } catch {
      toast.error('Failed to update bookmark');
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    if (phase !== 'exam' || !prefs?.keyboardShortcuts) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }
      const key = e.key.toLowerCase();
      if (key === 'n') {
        if (currentIdx < questions.length - 1) {
          setCurrentIdx(i => i + 1);
        }
      } else if (key === 'p') {
        if (currentIdx > 0) {
          setCurrentIdx(i => i - 1);
        }
      } else if (key === 'f') {
        const q = questions[currentIdx];
        if (q) {
          toggleFlag(q.id || q.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, prefs?.keyboardShortcuts, currentIdx, questions, toggleFlag]);

  const formatTime = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const answered = Object.values(answers).filter(v => v !== undefined && v !== null && v !== '').length;
  const urgent = timeLeft < 120;
  const progress = questions.length ? (answered / questions.length) * 100 : 0;

  let answeredVal = 0;
  let flaggedVal = 0;
  let visitedUnansweredVal = 0;
  let unvisitedVal = 0;

  questions.forEach((item, i) => {
    const isAns = answers[item.id] !== undefined;
    const isFl = flagged.has(item.id);
    const isVisited = visited.has(i);

    if (isAns) {
      answeredVal++;
    } else if (isFl) {
      flaggedVal++;
    } else if (isVisited) {
      visitedUnansweredVal++;
    } else {
      unvisitedVal++;
    }
  });

  if (phase === 'loading') return <div className={styles.fullCenter}><div className="spinner"/></div>;

  if (phase === 'submitting') return (
    <div className={styles.fullCenter}>
      <div className={styles.submitCard}>
        <div className={styles.submitSpinner}><div className="spinner"/></div>
        <h2>Submitting your quiz…</h2>
        <p>Evaluating your answers. Please wait.</p>
      </div>
    </div>
  );

  if (phase === 'intro') return (
    <div className={styles.introPage}>
      <div className={styles.introCard}>
        <div className={styles.introHeader}>
          <BsPatchQuestion size={28} className={styles.introLogoIcon}/>
          <h1 className={styles.introTitle}>{quiz?.title}</h1>
        </div>
        <div className={styles.introMetaRow}>
          <span className={`${styles.diffPill} ${styles[quiz?.difficulty]}`}>{quiz?.difficulty}</span>
          <span className={styles.metaPill}>{quiz?.subject}</span>
          {quiz?.category && <span className={styles.metaPill}>{quiz?.category}</span>}
        </div>
        {quiz?.description && <p className={styles.introDesc}>{quiz.description}</p>}
        <div className={styles.infoGrid}>
          {[
            { icon: <BsJournalText size={20} color="var(--primary)"/>, val: quiz?.questions?.length||0, label: 'Questions' },
            { icon: <BsClock size={20} color="var(--primary)"/>, val: `${quiz?.duration}m`, label: 'Duration' },
            { icon: <BsStar size={20} color="var(--primary)"/>, val: quiz?.totalMarks, label: 'Total Marks' },
            { icon: <BsCheckCircle size={20} color="var(--primary)"/>, val: quiz?.passingMarks, label: 'Pass Marks' },
            { icon: <BsArrowRepeat size={20} color="var(--primary)"/>, val: quiz?.maxAttempts, label: 'Max Attempts' }
          ].map((item, idx) => (
            <div key={idx} className={styles.infoItem}>
              <div className={styles.infoIconWrapper}>{item.icon}</div>
              <strong>{item.val}</strong>
              <small>{item.label}</small>
            </div>
          ))}
        </div>
        {quiz?.antiCheat?.preventTabSwitch && (
          <div className={styles.antiCheatNote}>
            <BsExclamationTriangle color="#d97706"/> <strong>Anti-cheat enabled:</strong> Tab switching, copy-paste, and right-click are monitored. {quiz.antiCheat.maxWarnings} warnings = disqualification.
          </div>
        )}
        {quiz?.accessCode && (
          <div className={styles.codeField}>
            <label>Access Code Required</label>
            <input type="text" placeholder="Enter quiz access code" value={accessCode} onChange={e => setAccessCode(e.target.value)} className={styles.codeInput}/>
          </div>
        )}
        {quiz?.instructions && <div className={styles.instructions}><strong>📋 Instructions:</strong><p>{quiz.instructions}</p></div>}
        <ul className={styles.rules}>
          <li>✔ Navigate between questions freely using the palette</li>
          <li>✔ Flag questions to revisit before submitting</li>
          <li>✔ Timer auto-submits when time runs out</li>
          <li>✔ Do not refresh the page during the exam</li>
        </ul>
        <button className={styles.startBtn} onClick={startExam}><BsCheckCircle/> Start Exam Now</button>
      </div>
    </div>
  );

  const q = questions[currentIdx];
  const sel = answers[q?.id || q?.id];
  const isFlagged = flagged.has(q?.id || q?.id);

  // Group questions by section dynamically
  const sectionsMap = {};
  questions.forEach((qItem, idx) => {
    const secTitle = qItem.sectionTitle || 'General Questions';
    if (!sectionsMap[secTitle]) {
      sectionsMap[secTitle] = [];
    }
    sectionsMap[secTitle].push({ ...qItem, globalIdx: idx });
  });

  const sectionTitles = Object.keys(sectionsMap);
  const activeSectionTitle = q?.sectionTitle || 'General Questions';


  return (
    <div className={styles.examPage}>
      {/* Warning Modal */}
      {showWarnModal && (
        <div className={styles.warnOverlay}>
          <div className={styles.warnModal}>
            <BsExclamationTriangle size={32} color="#d97706"/>
            <h3>Warning Issued</h3>
            <p>{warnMsg}</p>
            <button className={styles.warnOk} onClick={closeWarnModal}>I Understand</button>
          </div>
        </div>
      )}

      {/* Disqualification Modal */}
      {showDqModal && (
        <div className={styles.warnOverlay}>
          <div className={styles.warnModal}>
            <BsExclamationTriangle size={32} color="#dc2626"/>
            <h3 style={{ color: '#dc2626' }}>Disqualified</h3>
            <p>You have violated the quiz guidelines. As a result, you have been disqualified from this attempt.</p>
            <button className={styles.warnOk} style={{ background: '#dc2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }} onClick={closeDqModal}>Close</button>
          </div>
        </div>
      )}
 
      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className={styles.warnOverlay}>
          <div className={styles.submitModal}>
            <BsSend size={32} color="var(--primary)"/>
            <h3 className={styles.submitModalTitle}>Submit Quiz?</h3>
            <p className={styles.submitModalText}>
              Review your attempt stats below before submitting. Once submitted, you cannot modify your answers.
            </p>
            <div className={styles.submitStats}>
              <div className={styles.submitStatBox}>
                <span className={`${styles.submitStatVal} ${styles.statAns}`}>{answered}</span>
                <span className={styles.submitStatLbl}>Answered</span>
              </div>
              <div className={styles.submitStatBox}>
                <span className={`${styles.submitStatVal} ${styles.statLeft}`}>{questions.length - answered}</span>
                <span className={styles.submitStatLbl}>Left</span>
              </div>
            </div>
            <div className={styles.submitActions}>
              <button className={styles.btnCancel} onClick={() => setShowSubmitModal(false)}>
                Cancel
              </button>
              <button 
                className={styles.btnConfirmSubmit} 
                onClick={() => {
                  setShowSubmitModal(false);
                  submitQuiz();
                }}
              >
                Submit Quiz
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Webcam Preview Overlay */}
      {cameraStreamRef.current && (
        <div className={styles.webcamOverlayContainer}>
          <video
            ref={webcamEl => {
              if (webcamEl && webcamEl.srcObject !== cameraStreamRef.current) {
                webcamEl.srcObject = cameraStreamRef.current;
                webcamEl.play().catch(e => console.warn(e));
              }
            }}
            autoPlay
            muted
            playsInline
            className={styles.webcamOverlayVideo}
          />
          <div className={styles.webcamOverlayStatus}>
            <span className={styles.webcamOverlayIndicator} /> REC
          </div>
        </div>
      )}

      {/* Top Bar */}
      <div className={styles.topBar}>
        <div className={styles.topLeft}>
          <BsPatchQuestion size={20} color="var(--primary)"/>
          <div>
            <div className={styles.quizName}>{quiz?.title}</div>
            <div className={styles.quizSub}>{quiz?.subject}</div>
          </div>
        </div>
        <div className={styles.topMid}>
          <div className={styles.progressWrap}>
            <div className={styles.progressFill} style={{width:`${progress}%`}}/>
          </div>
          <span className={styles.progressTxt}>{answered}/{questions.length} answered</span>
        </div>
        <div className={styles.topRight}>
          {warnings > 0 && <div className={styles.warnCount}><BsExclamationTriangle size={13}/> {warnings} warn</div>}
          <div className={`${styles.timer} ${urgent?styles.timerUrgent:''}`}>
            <BsClock size={15}/> {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* Section Tabs Bar */}
      {sectionTitles.length > 1 && (
        <div className={styles.sectionTabsBar}>
          {sectionTitles.map(title => (
            <button
              key={title}
              className={`${styles.sectionTab} ${activeSectionTitle === title ? styles.sectionTabActive : ''}`}
              onClick={() => {
                const targetIdx = sectionsMap[title][0].globalIdx;
                setCurrentIdx(targetIdx);
              }}
            >
              📋 {title}
            </button>
          ))}
        </div>
      )}

      <div className={styles.body}>
        {/* Question area */}
        <div className={styles.qArea}>
          {/* Section Header Card */}
          <div className={styles.sectionHeaderCard}>
            <span className={styles.sectionLabel}>ACTIVE SECTION</span>
            <h3 className={styles.sectionTitleName}>{q?.sectionTitle || 'General Questions'}</h3>
          </div>

          <div className={styles.qMeta}>
            <span className={styles.qNum}>Question {currentIdx+1} <span className={styles.qOf}>of {questions.length}</span></span>
            <div className={styles.qTags}>
              <span className={styles['q-type-badge']}>
                {q?.type === 'true_false' ? 'True/False' : q?.type === 'multi_select' ? 'Multi-Select' : q?.type === 'short_answer' ? 'Short Answer' : 'MCQ'}
              </span>
              <span className={`${styles.qDiff} ${styles[q?.difficulty]}`}>{q?.difficulty}</span>
              <span className={styles.qMarks}>{q?.marks} mark{q?.marks!==1?'s':''}</span>
              {q?.negativeMark>0 && <span className={styles.qNeg}>-{q?.negativeMark} penalty</span>}
            </div>
            <button className={`${styles.flagBtn} ${isFlagged?styles.flagged:''}`} onClick={() => toggleFlag(q?.id || q?.id)}>
              <BsFlag size={14}/> {isFlagged?'Flagged':'Flag'}
            </button>
            <button className={`${styles.flagBtn} ${bookmarkedIds.has(q?.id) ? styles.flagged : ''}`} onClick={() => toggleBookmark(q?.id)} style={{ marginLeft: '8px' }}>
              {bookmarkedIds.has(q?.id) ? <BsBookmarkFill size={14}/> : <BsBookmark size={14}/>} {bookmarkedIds.has(q?.id) ? 'Bookmarked' : 'Bookmark'}
            </button>

          </div>

          <div className={styles.qText}><CodeBlock text={q?.text} isStudentExamView={true} /></div>
          {q?.imageUrl && (
            <div style={{ margin: '15px 0', textAlign: 'center' }}>
              <img 
                src={q.imageUrl.startsWith('http') ? q.imageUrl : `${(import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api$/, '')}${q.imageUrl}`} 
                alt="Question visual illustration" 
                style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc' }} 
              />
            </div>
          )}

          <div className={styles.options}>
            {q?.type === 'short_answer' ? (
              <div style={{ width: '100%', marginTop: 15 }}>
                <textarea
                  value={sel || ''}
                  onChange={(e) => setAnswers(prev => ({ ...prev, [q.id || q.id]: e.target.value }))}
                  placeholder="Type your answer here..."
                  rows={4}
                  className={styles.qTextarea}
                />
              </div>
            ) : (
              q?.options?.map((opt, i) => {
                const isSelected = q?.type === 'multi_select'
                  ? (typeof sel === 'number' && (sel & (1 << i)) !== 0)
                  : sel === i;
                const handleClick = q?.type === 'multi_select'
                  ? () => {
                      const currentSel = typeof sel === 'number' ? sel : 0;
                      const nextSel = currentSel ^ (1 << i);
                      if (nextSel === 0) {
                        clearCurrentAnswer();
                      } else {
                        handleAnswer(nextSel);
                      }
                    }
                  : () => handleAnswer(i);

                return (
                  <button key={i} className={`${styles.opt} ${isSelected?styles.optSel:''}`} onClick={handleClick}>
                    <div className={`${styles.optLetter} ${isSelected?styles.optLetterSel:''}`}>{String.fromCharCode(65+i)}</div>
                    <span className={styles.optText}>{opt.text}</span>
                    {isSelected && <BsCheckCircle className={styles.optCheck} size={18}/>}
                  </button>
                );
              })
            )}
          </div>

          <div className={styles.navRow}>
            <button className={styles.navBtn} onClick={() => setCurrentIdx(i=>i-1)} disabled={currentIdx===0}><BsChevronLeft/> Previous</button>
            <div className={styles.navCenter}>
              {sel===undefined && <span className={styles.notAnswered}>Not answered</span>}
              {sel!==undefined && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className={styles.isAnswered}><BsCheckCircle size={13}/> Answered</span>
                  <button className={styles.clearBtn} onClick={clearCurrentAnswer}>Clear Answer</button>
                </div>
              )}
            </div>
            {currentIdx < questions.length-1
              ? <button className={`${styles.navBtn} ${styles.navNext}`} onClick={() => setCurrentIdx(i=>i+1)}>Next <BsChevronRight/></button>
              : <button className={`${styles.navBtn} ${styles.navSubmit}`} onClick={() => setShowSubmitModal(true)}><BsSend/> Submit Quiz</button>
            }
          </div>
        </div>

        {/* Palette */}
        <div className={styles.palette}>
          <div className={styles.palHead}>
            Question Palette
            <div style={{ fontSize: '0.78rem', color: 'var(--gray-500, #64748b)', fontWeight: 'normal', marginTop: '4px' }}>
              Answered: {answered} / {questions.length} | Flagged: {flagged.size}
            </div>
          </div>
          <div className={styles.paletteSectionsContainer}>
            {Object.entries(sectionsMap).map(([title, secQs]) => (
              <div key={title} className={styles.paletteSectionGroup}>
                <div className={styles.paletteSectionHeader}>{title}</div>
                <div className={styles.palGrid}>
                  {secQs.map(({ globalIdx }) => {
                    const q = questions[globalIdx];
                    const isAns = answers[q.id || q.id]!==undefined;
                    const isFl = flagged.has(q.id || q.id);
                    const isVisited = visited.has(globalIdx);
                    const isCur = globalIdx===currentIdx;

                    let stateClass = styles.palUnvisited;
                    if (isCur) stateClass = styles.palCur;
                    else if (isAns) stateClass = styles.palAns;
                    else if (isFl) stateClass = styles.palFlag;
                    else if (isVisited) stateClass = styles.palNotAns;

                    return (
                      <button key={globalIdx} className={`${styles.palBtn} ${stateClass}`} onClick={() => setCurrentIdx(globalIdx)}>
                        {isFl && <span className={styles.palFlagDot}/>}{globalIdx+1}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className={styles.palLegend}>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palAns}`}>{answeredVal}</div> Answered</div>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palFlag}`}>{flaggedVal}</div> Flagged</div>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palNotAns}`}>{visitedUnansweredVal}</div> Visited & Unanswered</div>
            <div className={styles.legRow}><div className={`${styles.legBox} ${styles.palUnvisited}`}>{unvisitedVal}</div> Unvisited</div>
          </div>
          <button className={styles.submitFullBtn} onClick={() => setShowSubmitModal(true)}>
            <BsSend/> Submit Quiz ({answered}/{questions.length})
          </button>
        </div>
      </div>
    </div>
  );
}
