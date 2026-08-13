import React, { useState, useEffect } from 'react';
import AdminLayout from './Layout';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { BsSave, BsInfoCircle } from 'react-icons/bs';
import { FiSettings } from 'react-icons/fi';
import { usePreferences } from '../../context/PreferencesContext';
import styles from './AdminSettings.module.css';

export default function AdminSettings() {
  const [brandingForm, setBrandingForm] = useState({
    institutionName: 'Examind AI',
    logoUrl: '/favicon.svg',
    primaryColor: '#7c3aed',
    secondaryColor: '#0f172a',
    customDomain: ''
  });
  const [saving, setSaving] = useState(false);
  const { t } = usePreferences();

  useEffect(() => {
    api.get('/settings/branding')
      .then(r => {
        if (r.data.data) {
          setBrandingForm(r.data.data);
        }
      })
      .catch(console.error);
  }, []);

  const saveBranding = async () => {
    setSaving(true);
    try {
      await api.put('/settings/branding', brandingForm);
      toast.success('Branding settings saved successfully!');
      // Apply color styles immediately
      document.documentElement.style.setProperty('--primary', brandingForm.primaryColor);
      document.documentElement.style.setProperty('--primary-dark', brandingForm.secondaryColor);
      localStorage.setItem('branding_logo', brandingForm.logoUrl || '');
      localStorage.setItem('branding_name', brandingForm.institutionName || '');
      // Dispatch storage event to notify other layout tabs
      window.dispatchEvent(new Event('storage'));
    } catch (err) {
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1><FiSettings size={20}/> {t('instituteSettings')}</h1>
          <p>{t('instituteSettingsSub')}</p>
        </div>

        <div className={styles.sections}>
          {/* Dynamic White-Labeling */}
          <div className={styles.card}>
            <div className={styles.cardTitle}><BsInfoCircle size={15}/> 🎨 White-Labeling & Branding</div>
            <div className={styles.grid2}>
              <div className={styles.field}>
                <label>Institution Name</label>
                <input 
                  value={brandingForm.institutionName} 
                  onChange={e => setBrandingForm({ ...brandingForm, institutionName: e.target.value })} 
                  placeholder="e.g. ABC Institute of Technology"
                />
              </div>
              <div className={styles.field}>
                <label>Logo Image URL</label>
                <input 
                  value={brandingForm.logoUrl} 
                  onChange={e => setBrandingForm({ ...brandingForm, logoUrl: e.target.value })} 
                  placeholder="e.g. https://domain.com/logo.png"
                />
              </div>

              <div className={styles.field}>
                <label>Custom Institution Domain</label>
                <input 
                  value={brandingForm.customDomain} 
                  onChange={e => setBrandingForm({ ...brandingForm, customDomain: e.target.value })} 
                  placeholder="e.g. exam.institute.edu"
                />
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className={styles.infoBox}>
            <span>ℹ️</span>
            <div>
              <strong>White-Labeling Mode Active</strong>
              <p>Custom colors and logo will immediately apply across both Student and Faculty dashboards upon saving.</p>
            </div>
          </div>

          <div className={styles.actions}>
            <button onClick={saveBranding} className={styles.saveBtn} disabled={saving}>
              {saving ? <span className={styles.spin}/> : <><BsSave size={15}/> Save Branding Settings</>}
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
