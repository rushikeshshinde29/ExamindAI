import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { BsCheckCircle, BsXCircle, BsDownload } from 'react-icons/bs';
import { BsPatchQuestion } from 'react-icons/bs';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';
import styles from './CertVerify.module.css';

export default function CertVerify() {
  const { certId } = useParams();
  const navigate = useNavigate();

  const [searchId, setSearchId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [valid, setValid] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (certId && certId !== 'lookup' && certId !== 'demo') {
      setSearchId(certId);
      setLoading(true);
      setSearched(true);
      api.get(`/certificates/verify/${certId}`)
        .then(r => {
          setData(r.data.data);
          setValid(true);
        })
        .catch(() => {
          setValid(false);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setSearchId('');
      setData(null);
      setValid(false);
      setSearched(false);
      setLoading(false);
    }
  }, [certId]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchId.trim()) {
      toast.error('Please enter a certificate ID');
      return;
    }
    navigate(`/verify-certificate/${searchId.trim()}`);
  };

  const handleDownload = async () => {
    if (!data) return;
    setDownloading(true);
    
    // Create an off-screen container for the certificate
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '1000px';
    container.style.height = '700px';
    document.body.appendChild(container);

    const formattedDate = format(new Date(data.issuedAt), 'MMMM-dd-yyyy').toUpperCase();
    const quizName = data.quizTitle || 'Assessment';
    const finalScore = `${data.score?.toFixed(1)}%`;

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
      ${data.studentName}
    </div>

    <!-- DATE BADGE -->
    <div style="display: inline-block; background-color: #0f172a; color: #ffffff; font-size: 9pt; font-weight: bold; padding: 6px 20px; border-radius: 50px; margin-bottom: 25px; letter-spacing: 1px;">
      ${formattedDate}
    </div>

    <!-- DESCRIPTION -->
    <div style="font-size: 9pt; color: #334155; line-height: 1.6; max-width: 600px; margin-bottom: 30px;">
      Is hereby awarded this certificate for successfully demonstrating proficiency in the assessment<br/>
      <strong style="color: #0f172a; font-size: 11pt;">"${quizName}"</strong> with a passing score of <strong>${finalScore}</strong>.
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
      <div style="font-size: 6pt; color: #94a3b8; margin-top: 2px;">ID: ${certId?.toUpperCase()}</div>
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
      pdf.save(`Certificate_${quizName.replace(/\s+/g, '_')}.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error('Client-side PDF rendering error:', err);
      toast.error('Failed to download certificate.');
    } finally {
      document.body.removeChild(container);
      setDownloading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <BsPatchQuestion size={32} color="var(--primary)"/>
          <div><h1>Examind AI</h1><p>Certificate Verification</p></div>
        </div>

        {(!valid || certId === 'lookup') && (
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g., CERT-...)"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              style={{
                flexGrow: 1,
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid var(--bg-border)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '10px 20px', fontSize: '0.9rem', borderRadius: '8px' }}>
              Verify
            </button>
          </form>
        )}

        {loading ? (
          <div className={styles.center}><div className="spinner"/></div>
        ) : valid && data ? (
          <div className={styles.cert}>
            <div className={styles.certBadge}><BsCheckCircle size={40} color="#10b981"/></div>
            <h2>Certificate Verified ✅</h2>
            <p className={styles.certSub}>This certificate is authentic and issued by Examind AI</p>
            <div className={styles.certBody}>
              <div className={styles.certSeal}>🎓</div>
              <p className={styles.certTitle}>Certificate of Achievement</p>
              <p className={styles.certRecipient}>This certifies that</p>
              <h3 className={styles.certName}>{data.studentName}</h3>
              <p className={styles.certText}>has successfully completed</p>
              <h4 className={styles.certQuiz}>{data.quizTitle}</h4>
              <p className={styles.certSubject}>{data.subject}</p>
              <div className={styles.certScore}>
                <div><strong>{data.score?.toFixed(1)}%</strong><small>Score</small></div>
                <div><strong>{data.obtainedMarks}/{data.totalMarks}</strong><small>Marks</small></div>
                <div><strong>{format(new Date(data.issuedAt),'MMM d, yyyy')}</strong><small>Issued On</small></div>
              </div>
              <p className={styles.certId}>Certificate ID: <code>{certId}</code></p>
            </div>
            <button
              onClick={handleDownload}
              className={styles.downloadBtn}
              disabled={downloading}
            >
              <BsDownload size={14} style={{ marginRight: '6px' }}/> {downloading ? 'Downloading...' : 'Download Certificate (PDF)'}
            </button>
          </div>
        ) : searched ? (
          <div className={styles.invalid}>
            <BsXCircle size={48} color="#ef4444"/>
            <h2>Invalid Certificate</h2>
            <p>This certificate ID does not exist or has been revoked.</p>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-secondary)' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>🔍</span>
            <p style={{ fontSize: '0.95rem' }}>
              Please enter a certificate ID in the box above to verify its authenticity.
            </p>
          </div>
        )}
        <Link to="/" className={styles.homeBtn}>← Back to Examind AI</Link>
      </div>
    </div>
  );
}
