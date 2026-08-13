import React, { useEffect, useState } from 'react';
import AdminLayout from './Layout';
import { usePreferences } from '../../context/PreferencesContext';
import toast from 'react-hot-toast';

export default function AdminPreferences() {
  const { prefs, updatePrefs, t } = usePreferences();
  const [localPrefs, setLocalPrefs] = useState(prefs);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prefs) {
      setLocalPrefs(prefs);
    }
  }, [prefs]);

  const save = async () => {
    setSaving(true);
    try {
      await updatePrefs(localPrefs);
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key) => setLocalPrefs(p => ({ ...p, [key]: !p[key] }));

  if (!localPrefs) return <AdminLayout><div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div className="spinner"/></div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="fade-in" style={{maxWidth:'640px'}}>
        <div className="page-header">
          <div>
            <h1 className="page-title">⚙️ {t('preferences')}</h1>
            <p className="page-subtitle">{t('preferencesSubtitle')}</p>
          </div>
        </div>

        <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
          {/* Appearance */}
          <div className="card">
            <h3 style={{marginBottom:'20px',fontSize:'1rem',color:'var(--primary)'}}>🎨 {t('appearance')}</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <Row label={t('colorBlindMode')} sub={t('colorBlindModeSub')}>
                <Toggle checked={localPrefs.colorBlindMode} onChange={()=>toggle('colorBlindMode')}/>
              </Row>
              <Row label={t('fontSize')} sub={t('fontSizeSub')}>
                <select className="form-input" style={{width:'120px',padding:'6px 10px'}}
                  value={localPrefs.fontSize||'medium'} onChange={e=>setLocalPrefs(p=>({...p,fontSize:e.target.value}))}>
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </Row>
              <Row label={t('language')} sub={t('languageSub')}>
                <select className="form-input" style={{width:'140px',padding:'6px 10px'}}
                  value={localPrefs.language||'en'} onChange={e=>setLocalPrefs(p=>({...p,language:e.target.value}))}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="ta">Tamil</option>
                  <option value="te">Telugu</option>
                </select>
              </Row>
            </div>
          </div>

          {/* Interaction */}
          <div className="card">
            <h3 style={{marginBottom:'20px',fontSize:'1rem',color:'var(--secondary)'}}>🖱️ {t('interaction')}</h3>
            <div style={{display:'flex',flexDirection:'column',gap:'16px'}}>
              <Row label={t('soundEffects')} sub={t('soundEffectsSub')}>
                <Toggle checked={localPrefs.soundEffects} onChange={()=>toggle('soundEffects')}/>
              </Row>
              <Row label={t('keyboardShortcuts')} sub={t('keyboardShortcutsSub')}>
                <Toggle checked={localPrefs.keyboardShortcuts} onChange={()=>toggle('keyboardShortcuts')}/>
              </Row>
              <Row label={t('emailNotifications')} sub={t('emailNotificationsSub')}>
                <Toggle checked={localPrefs.emailNotifications} onChange={()=>toggle('emailNotifications')}/>
              </Row>
            </div>
          </div>

          <button className="btn btn-primary btn-lg" onClick={save} disabled={saving} style={{alignSelf:'flex-start'}}>
            {saving ? `⏳ ${t('saving')}` : `💾 ${t('savePreferences')}`}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}

function Row({ label, sub, children }) {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'16px'}}>
      <div>
        <div style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-primary)'}}>{label}</div>
        {sub && <div style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'2px'}}>{sub}</div>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={onChange} style={{
      width:'44px',height:'24px',borderRadius:'999px',border:'none',cursor:'pointer',
      background: checked ? 'var(--primary)' : 'var(--bg-border)',
      position:'relative',transition:'background 0.2s',flexShrink:0
    }}>
      <div style={{
        position:'absolute',top:'3px',
        left: checked ? '23px' : '3px',
        width:'18px',height:'18px',borderRadius:'50%',
        background:'white',transition:'left 0.2s',
        boxShadow:'0 1px 3px rgba(0,0,0,0.3)'
      }}/>
    </button>
  );
}
