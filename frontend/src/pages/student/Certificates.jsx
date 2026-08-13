import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { BsDownload, BsBoxArrowUpRight, BsAward, BsCheckCircle, BsClock } from 'react-icons/bs';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useAuth } from '../../context/AuthContext';
import styles from './Certificates.module.css';

export default function StudentCertificates() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading]   = useState(true);

  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    api.get('/attempts/my')
      .then(r => setAttempts(r.data.data.filter(a => a.certificateIssued && a.certificateId)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = async (attempt, quizTitle) => {
    const attemptId = attempt.id;
    setDownloading(prev => ({ ...prev, [attemptId]: true }));
    
    // Create an off-screen container for the certificate
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1000px';
    container.style.height = '700px';
    document.body.appendChild(container);

    const studentName = user?.name || attempt.student?.name || 'Student Name';
    const dateText = attempt.endTime ? 
      format(new Date(attempt.endTime), 'MMMM-dd-yyyy').toUpperCase() : 
      format(new Date(attempt.createdAt), 'MMMM-dd-yyyy').toUpperCase();
    const finalScore = `${attempt.percentage?.toFixed(1)}%`;

    container.innerHTML = `
<div style="width: 1000px; height: 700px; background-color: #f8fafc; position: relative; font-family: Arial, sans-serif; box-sizing: border-box; padding: 40px; text-align: center; color: #334155; overflow: hidden; display: flex; flex-direction: column; justify-content: space-between;">
  <!-- Background Waves -->
  <svg style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0.15; z-index: 1;" viewBox="0 0 1000 700">
    <path d="M 0 50 Q 250 100 500 50 T 1000 50 M 0 150 Q 250 200 500 150 T 1000 150 M 0 250 Q 250 300 500 250 T 1000 250 M 0 350 Q 250 400 500 350 T 1000 350" fill="none" stroke="#64748b" stroke-width="2"/>
  </svg>

  <!-- Left Accent Box -->
  <div style="position: absolute; top: 220px; left: 0; width: 60px; height: 220px; background-color: #d97706; z-index: 5;"></div>

  <!-- Top Left Brand -->
  <div style="text-align: left; margin-bottom: 20px; position: relative; z-index: 10;">
    <div style="font-size: 18px; font-weight: 900; color: #0f172a; letter-spacing: 2px;">EXAMIND AI</div>
    <div style="font-size: 11px; color: #64748b; letter-spacing: 1px;">www.examindai.com</div>
  </div>

  <!-- Main Body Content -->
  <div style="position: relative; z-index: 10; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-grow: 1;">
    <!-- MAIN TITLE (FORCED VISIBLE) -->
    <div style="font-size: 34pt; font-weight: 900; color: #d97706; letter-spacing: 6px; margin-top: 10px; margin-bottom: 10px; text-transform: uppercase;">
      CERTIFICATE
    </div>
    
    <!-- SUBTITLE -->
    <div style="font-size: 9pt; color: #334155; font-weight: bold; margin-bottom: 25px; letter-spacing: 1px;">
      STUDYING FOR A CERTIFIED PLATFORM ACHIEVEMENT AND SUCCESSFUL ASSESSMENT COMPLETION
    </div>

    <div style="font-size: 9pt; color: #64748b; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px;">
      This certifies that
    </div>

    <!-- CANDIDATE NAME -->
    <div style="font-family: 'Georgia', 'Times New Roman', serif; font-style: italic; font-weight: bold; font-size: 36pt; color: #b45309; margin-bottom: 20px;">
      ${studentName}
    </div>

    <!-- DATE BADGE -->
    <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 9pt; font-weight: bold; padding: 6px 20px; border-radius: 50px; margin-bottom: 25px; letter-spacing: 1px;">
      ${dateText}
    </div>

    <!-- DESCRIPTION -->
    <div style="font-size: 9pt; color: #334155; line-height: 1.6; max-width: 600px; margin-bottom: 30px;">
      Is hereby awarded this certificate for successfully demonstrating proficiency in the assessment<br/>
      <strong style="color: #0f172a; font-size: 11pt;">"${quizTitle}"</strong> with a passing score of <strong>${finalScore}</strong>.
    </div>
  </div>

  <!-- FOOTER TABLE -->
  <div style="position: relative; z-index: 10; display: flex; justify-content: space-between; align-items: flex-end; width: 100%; padding-top: 10px; border-top: 1px solid #e2e8f0;">
    <!-- Left: Director By -->
    <div style="text-align: center; width: 30%;">
      <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 16px; color: #0f172a; margin-bottom: 5px;">ExamindAI Director</div>
      <div style="border-top: 1px solid #94a3b8; width: 120px; margin: 0 auto 5px auto;"></div>
      <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Director By</div>
    </div>

    <!-- Center: Laurel Wreath SVG / Award Badge -->
    <div style="text-align: center; width: 30%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <svg style="width: 45px; height: 45px; fill: #d97706; margin-bottom: 5px;" viewBox="0 0 24 24">
        <path d="M12 2A10 10 0 0 0 2 12a10 10 0 0 0 10 10 10 10 0 0 0 10-10A10 10 0 0 0 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
      <div style="font-size: 7pt; font-weight: 800; color: #d97706; letter-spacing: 1px;">EXAMIND AI CERTIFIED</div>
      <div style="font-size: 6pt; color: #94a3b8; margin-top: 2px;">ID: ${attempt.certificateId?.toUpperCase()}</div>
    </div>

    <!-- Right: Awarded By -->
    <div style="text-align: center; width: 30%;">
      <div style="font-family: 'Georgia', serif; font-style: italic; font-size: 16px; color: #0f172a; margin-bottom: 5px;">ExamindAI Platform</div>
      <div style="border-top: 1px solid #94a3b8; width: 120px; margin: 0 auto 5px auto;"></div>
      <div style="font-size: 8pt; font-weight: bold; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Awarded By</div>
    </div>
  </div>
</div>
    `;

    try {
      const canvas = await html2canvas(container, {
        useCORS: true,
        scale: 2
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 297, 210);
      pdf.save(`Certificate_${quizTitle.replace(/\s+/g, '_')}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (error) {
      console.error('Error downloading certificate:', error);
      toast.error('Failed to download certificate.');
    } finally {
      document.body.removeChild(container);
      setDownloading(prev => ({ ...prev, [attemptId]: false }));
    }
  };

  if (loading) return <Layout><div className={styles.center}><div className="spinner"/></div></Layout>;

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1><BsAward size={22}/> My Certificates</h1>
          <p>{attempts.length} certificate{attempts.length !== 1 ? 's' : ''} earned</p>
        </div>

        {attempts.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🎓</div>
            <h2>No certificates yet</h2>
            <p>Pass quizzes that have certificates enabled to earn your first certificate!</p>
            <Link to="/student/quizzes" className={styles.browseBtn}>Browse Quizzes</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {attempts.map(a => (
              <div key={a.id} className={styles.certCard}>
                {/* Certificate visual */}
                <div className={styles.certHeader}>
                  <div className={styles.certSeal}>🎓</div>
                  <div className={styles.certBadge}><BsCheckCircle size={13}/> Verified</div>
                </div>

                <div className={styles.certBody}>
                  <div className={styles.certLabel}>CERTIFICATE OF ACHIEVEMENT</div>
                  <h3 className={styles.certQuiz}>{a.quiz?.title || 'Quiz Completed'}</h3>
                  <div className={styles.certSubject}>{a.quiz?.subject}</div>

                  <div className={styles.certStats}>
                    <div className={styles.certStat}>
                      <span className={styles.certStatVal} style={{color: a.isPassed ? '#10b981' : '#ef4444'}}>
                        {a.percentage?.toFixed(0)}%
                      </span>
                      <span className={styles.certStatLabel}>Score</span>
                    </div>
                    <div className={styles.certStatDivider}/>
                    <div className={styles.certStat}>
                      <span className={styles.certStatVal}>{a.obtainedMarks}/{a.totalMarks}</span>
                      <span className={styles.certStatLabel}>Marks</span>
                    </div>
                    <div className={styles.certStatDivider}/>
                    <div className={styles.certStat}>
                      <span className={styles.certStatVal}>{a.rankPosition ? `#${a.rankPosition}` : '—'}</span>
                      <span className={styles.certStatLabel}>Rank</span>
                    </div>
                  </div>

                  <div className={styles.certDate}>
                    <BsClock size={12}/> {format(new Date(a.createdAt), 'MMMM d, yyyy')}
                  </div>

                  <div className={styles.certId}>
                    ID: <code>{a.certificateId?.slice(0,18)}…</code>
                  </div>
                </div>

                <div className={styles.certActions}>
                  <a
                    href={`/verify-certificate/${a.certificateId}`}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.viewBtn}
                  >
                    <BsBoxArrowUpRight size={13}/> View
                  </a>
                  <button
                    onClick={() => handleDownload(a, a.quiz?.title || 'Quiz')}
                    className={styles.downloadBtn}
                    disabled={downloading[a.id]}
                  >
                    <BsDownload size={13}/> {downloading[a.id] ? 'Downloading...' : 'Download'}
                  </button>
                  <Link to={`/student/result/${a.id}`} className={styles.resultBtn}>
                    Result
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {attempts.length > 0 && (
          <div className={styles.verifyInfo}>
            <BsCheckCircle size={14} color="#059669" style={{ flexShrink: 0 }}/>
            <span>
              All certificates are publicly verifiable at <strong>{`${window.location.origin}/verify-certificate/[ID]`}</strong>. Share the link to prove your achievement.
            </span>
          </div>
        )}
      </div>
    </Layout>
  );
}
