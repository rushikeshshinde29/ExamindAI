import React, { useState, useEffect } from 'react';
import AdminLayout from './Layout';
import api from '../../utils/api';
import { BsActivity } from 'react-icons/bs';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AuditLogs.module.css';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t } = usePreferences();

  useEffect(() => {
    api.get('/admin/audit-logs')
      .then(r => setLogs(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1><BsActivity size={20}/> {t('securityAuditLogs')}</h1>
          <p>{t('securityAuditLogsSub')}</p>
        </div>

        <div className={styles.card}>
          {loading ? (
            <div className={styles.center}><div className="spinner"/></div>
          ) : logs.length === 0 ? (
            <div className={styles.empty}>No audit log activities found.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performed By</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => {
                  const initials = log.performedBy ? log.performedBy.charAt(0).toUpperCase() : '?';
                  const dateObj = new Date(log.createdAt);
                  const formattedDate = dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                  const formattedTime = dateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

                  let actionColor = 'var(--primary)';
                  let actionBg = 'rgba(124,58,237,0.1)';
                  if (log.action?.includes('UPDATE') || log.action?.includes('EDIT') || log.action?.includes('CHANGE')) {
                    actionColor = '#0ea5e9';
                    actionBg = 'rgba(14,165,233,0.1)';
                  } else if (log.action?.includes('DELETE') || log.action?.includes('BAN') || log.action?.includes('REMOVE')) {
                    actionColor = '#ef4444';
                    actionBg = 'rgba(239,68,68,0.1)';
                  } else if (log.action?.includes('CREATE') || log.action?.includes('ADD') || log.action?.includes('PUBLISH')) {
                    actionColor = '#10b981';
                    actionBg = 'rgba(16,185,129,0.1)';
                  }

                  return (
                    <tr key={log.id} className={styles.row}>
                      <td className={styles.timeCol}>
                        <div className={styles.timeWrap}>
                          <span className={styles.dateVal}>{formattedDate}</span>
                          <span className={styles.timeVal}>{formattedTime}</span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.actionBadge} style={{ color: actionColor, background: actionBg, borderColor: actionColor + '25', borderWidth: '1px', borderStyle: 'solid' }}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        <div className={styles.userCell}>
                          <div className={styles.av} style={{ background: `linear-gradient(135deg, var(--primary), var(--accent))` }}>
                            {initials}
                          </div>
                          <span className={styles.emailText}>{log.performedBy}</span>
                        </div>
                      </td>
                      <td className={styles.detailsCol}>
                        <div className={styles.detailsText}>{log.details}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
