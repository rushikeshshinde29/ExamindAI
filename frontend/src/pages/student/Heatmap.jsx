import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { usePreferences } from '../../context/PreferencesContext';

export default function Heatmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { prefs } = usePreferences();

  useEffect(() => {
    api.get('/student/heatmap').then(r => setData(r.data.data)).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  // Theme-adaptive colors (using high-contrast light shades uniformly):
  const COLORS = ['#f1f5f9', '#f5f4fd', '#dcd7fa', '#b0a3f5', '#6850DB'];

  // Month names for rendering
  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  // Process data to group by month
  let monthsGroup = [];
  if (data?.calendar) {
    // Create lookup map: date string -> calendar day object
    const dayMap = {};
    data.calendar.forEach(d => {
      dayMap[d.date] = d;
    });

    const months = {};
    data.calendar.forEach(d => {
      const parts = d.date.split('-');
      const year = parts[0];
      const monthStr = parts[1];
      const monthIdx = parseInt(monthStr, 10) - 1;
      const monthKey = `${year}-${monthStr}`;

      if (!months[monthKey]) {
        months[monthKey] = {
          key: monthKey,
          year: parseInt(year, 10),
          monthIndex: monthIdx,
          monthName: MONTH_NAMES[monthIdx]
        };
      }
    });

    // Sort month keys descending (recent month first)
    const sortedKeys = Object.keys(months).sort().reverse();

    monthsGroup = sortedKeys.map(key => {
      const monthObj = months[key];
      const { year, monthIndex } = monthObj;

      // Get number of days in this month
      const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
      // Get starting weekday index (0 = Sunday, 1 = Monday...)
      const startWeekday = new Date(year, monthIndex, 1).getDay();

      const days = [];
      // Push placeholders for weekdays before the 1st
      for (let i = 0; i < startWeekday; i++) {
        days.push({ placeholder: true });
      }

      // Push day data
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dayData = dayMap[dateStr] || { date: dateStr, count: 0, intensity: 0 };
        days.push({
          placeholder: false,
          dayNum: d,
          ...dayData
        });
      }

      return {
        ...monthObj,
        days
      };
    });
  }

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header">
          <div>
            <h1 className="page-title">📅 Activity Heatmap</h1>
            <p className="page-subtitle">Your quiz attempt frequency structured month-wise</p>
          </div>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div className="spinner"/></div>
        ) : (
          <>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'16px',marginBottom:'28px'}}>
              {[
                {label:'Total Attempts',value:data?.totalAttempts||0,icon:'📝',color:'teal'},
                {label:'Active Days',value:data?.activeDays||0,icon:'📅',color:'violet'},
                {label:'Best Day',value:data?.maxInDay||0,icon:'🏆',color:'gold'},
                {label:'Current Streak',value:`${data?.currentStreak||0} days`,icon:'🔥',color:'rose'},
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className={`stat-icon stat-icon-${s.color}`}>{s.icon}</div>
                  <div>
                    <div style={{fontSize:'1.5rem',fontWeight:800,color:'var(--text-primary)'}}>{s.value}</div>
                    <div style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Quiz Activity Calendar</h3>
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'0.72rem',color:'var(--text-muted)'}}>
                  <span>Less</span>
                  {COLORS.map((c,i) => <div key={i} style={{width:'12px',height:'12px',borderRadius:'2px',background:c}}/>)}
                  <span>More</span>
                </div>
              </div>

              {/* Month Cards Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '20px'
              }}>
                {monthsGroup.map(m => (
                  <div key={m.key} style={{
                    background: 'var(--bg-raised)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <div style={{
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: '12px',
                      borderBottom: '1px solid var(--bg-border)',
                      paddingBottom: '6px'
                    }}>
                      {m.monthName} {m.year}
                    </div>
                    
                    {/* Weekday headers */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '4px',
                      textAlign: 'center',
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      marginBottom: '8px'
                    }}>
                      {WEEKDAYS.map((w, idx) => (
                        <div key={idx}>{w}</div>
                      ))}
                    </div>

                    {/* Days Grid */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      gap: '4px'
                    }}>
                      {m.days.map((day, idx) => {
                        if (day.placeholder) {
                          return <div key={`ph-${idx}`} style={{ aspectRatio: '1/1' }} />;
                        }

                        const hasActivity = day.intensity > 0;
                        return (
                          <div
                            key={`day-${day.dayNum}`}
                            title={`${day.date}: ${day.count} attempt${day.count !== 1 ? 's' : ''}`}
                            style={{
                              aspectRatio: '1/1',
                              borderRadius: '4px',
                              background: COLORS[day.intensity] || COLORS[0],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              color: day.intensity >= 3 ? '#ffffff' : '#475569',
                              cursor: 'default',
                              transition: 'all 0.1s ease-in-out'
                            }}
                            onMouseEnter={e => {
                              e.target.style.transform = 'scale(1.2)';
                              e.target.style.boxShadow = '0 0 6px rgba(104, 80, 219, 0.4)';
                              e.target.style.zIndex = '10';
                            }}
                            onMouseLeave={e => {
                              e.target.style.transform = 'scale(1)';
                              e.target.style.boxShadow = 'none';
                              e.target.style.zIndex = 'auto';
                            }}
                          >
                            {day.dayNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
