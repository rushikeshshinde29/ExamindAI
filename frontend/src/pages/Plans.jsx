import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Plans() {
  const { user, updateUser } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [activating, setActivating] = useState(false);
  const pollUserProfile = () => {
    setActivating(true);
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const check = await api.get('/auth/me');
        if (check.data.success && check.data.user.isPro) {
          clearInterval(interval);
          updateUser(check.data.user);
          setActivating(false);
          toast.success('Your Pro plan is now active! Thank you.');
        }
      } catch (err) {
        console.error('Error checking user profile sync:', err);
      }

      if (attempts >= 20) {
        clearInterval(interval);
        setActivating(false);
        toast.error('Activation is taking longer than expected. Please refresh the page or contact support if it does not activate shortly.');
      }
    }, 3000);
  };

  useEffect(() => {
    api.get('/payments/plans')
      .then(r => setPlans(r.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));

    if (user?.role === 'student') {
      api.get('/payments/my').then(r => {
        const myPayments = r.data.data || [];
        setPayments(myPayments);
        
        // If the user is not Pro locally, but has a successful payment that is pending/failed upgrade
        if (!user.isPro) {
          const hasPendingUpgrade = myPayments.some(
            p => p.status === 'paid' && (p.upgradeStatus === 'PENDING' || p.upgradeStatus === 'FAILED')
          );
          if (hasPendingUpgrade) {
            pollUserProfile();
          }
        }
      }).catch(() => {});
    }
  }, [user]);

  const purchase = async (plan) => {
    if (plan.price === 0) { toast.success('You are on the Free plan!'); return; }
    try {
      const r = await api.post('/payments/create-order', { plan: plan.id });
      const { 
        orderId, order_id, 
        amount, 
        keyId, key_id, razorpay_key_id, 
        userName, userEmail, 
        description 
      } = r.data;

      const activeKeyId = razorpay_key_id || key_id || keyId;
      const activeOrderId = order_id || orderId;

      const options = {
        key: activeKeyId,
        amount,
        currency: 'INR',
        name: 'Examind AI',
        description,
        ...(activeOrderId.startsWith('order_mock_') ? {} : { order_id: activeOrderId }),
        prefill: { name: userName, email: userEmail },
        theme: { color: '#0d9488' },
        handler: async (response) => {
          setActivating(true);
          try {
            const vr = await api.post('/payments/verify', {
              ...response,
              razorpay_order_id: response.razorpay_order_id || activeOrderId
            });
            toast.success(vr.data.message);
            
            if (vr.data.isUpgradeComplete) {
              updateUser({ isPro: true });
              setActivating(false);
            } else {
              pollUserProfile();
            }
          } catch (err) {
            setActivating(false);
            toast.error('Payment verification failed');
          }
        }
      };
      if (window.Razorpay) {
        new window.Razorpay(options).open();
      } else {
        toast.error('Razorpay not loaded. Add script to index.html');
      }
    } catch(e) { toast.error(e.response?.data?.message || 'Failed to create order'); }
  };

  if (activating) {
    return (
      <Layout>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '20px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #e2e8f0',
            borderTopColor: '#0d9488',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>Activating your Pro plan...</h2>
          <p style={{ color: 'var(--text-muted)' }}>We are verifying your transaction and setting up your premium workspace.</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="fade-in">
        <div className="page-header" style={{textAlign:'center',display:'block',marginBottom:'40px'}}>
          <h1 className="page-title" style={{fontSize:'2rem'}}>
            {user?.isPro ? (
              <>
                <span className="grad-text">Welcome to Premium Experience</span> <span style={{ color: '#fbbf24' }}>👑</span>
              </>
            ) : (
              <span className="grad-text">Choose Your Plan</span>
            )}
          </h1>
          <p className="page-subtitle" style={{marginTop:'8px',fontSize:'1rem'}}>
            {user?.isPro ? 'Manage your active plan features and receipts' : 'Unlock the full power of Examind AI'}
          </p>
        </div>

        {user?.isPro && (
          <div className="card" style={{
            maxWidth: '800px',
            margin: '0 auto 40px auto',
            border: '2px solid #fbbf24',
            boxShadow: '0 0 15px rgba(251, 191, 36, 0.4)',
            background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(139, 92, 246, 0.05))',
            padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <span style={{ fontSize: '3rem' }}>👑</span>
              <div>
                <h2 className="grad-text" style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>
                  Premium Subscription Active
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0 0' }}>
                  You are enjoying full access to all Examind AI premium tools and features.
                </p>
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                ✨ Unlocked Premium Features
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {[
                  { name: 'Study Notes', desc: 'Create and organize custom bookmarks and revision notes' },
                  { name: 'Bookmarks', desc: 'Bookmark questions directly for subsequent revision and review' },
                  { name: 'AI Study Coach', desc: 'Personalized study strategies and real-time weakness diagnostics generated by AI' },
                  { name: 'AI Diagnostic Report', desc: 'Detailed, AI-driven performance diagnostics' },
                  { name: 'Dynamic AI Explanation', desc: 'Instant breakdown and query answers for quiz results' }
                ].map((feat, idx) => (
                  <div key={idx} style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '8px',
                    padding: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'flex-start'
                  }}>
                    <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>✦</span>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{feat.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{feat.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {payments.length > 0 && (
              <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '20px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
                  💳 Payment Details & Receipt
                </h4>
                <div style={{
                  background: 'rgba(0, 0, 0, 0.2)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: '8px',
                  padding: '16px',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  {payments.filter(p => p.status === 'paid').slice(0, 1).map(pay => (
                    <div key={pay.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Transaction ID:</span>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {pay.razorpayPaymentId || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Amount Paid:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {pay.currency} {pay.amount.toFixed(2)}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Transaction Time:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {new Date(pay.createdAt).toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <span style={{ color: 'var(--text-muted)' }}>Payment Plan:</span>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>
                          {pay.plan ? pay.plan.toUpperCase() : 'PRO'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:'60px'}}><div className="spinner"/></div>
        ) : !user?.isPro && (
          <div style={{
            display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
            gap:'24px',
            maxWidth:'1000px',
            margin:'0 auto',
            paddingTop: isFaculty ? '20px' : '0px'
          }}>
            {plans.map(plan => (
              <div key={plan.id} className="card" style={{
                border: plan.recommended ? '2px solid var(--primary)' : '1px solid var(--bg-border)',
                position:'relative',
                boxShadow: plan.recommended ? 'var(--glow-teal)' : 'var(--shadow)',
                overflow: 'visible',
                display: 'flex',
                flexDirection: 'column'
              }}>
                {plan.recommended && (
                  <div style={{
                    position:'absolute',top:'-14px',left:'50%',transform:'translateX(-50%)',
                    background:'linear-gradient(135deg,var(--primary),var(--accent))',
                    color:'white',padding:'4px 16px',borderRadius:'999px',
                    fontSize:'0.72rem',fontWeight:700,whiteSpace:'nowrap',
                    zIndex: 10
                  }}>⭐ MOST POPULAR</div>
                )}
                <div style={{textAlign:'center',marginBottom:'24px'}}>
                  <h3 style={{fontSize:'1.2rem',marginBottom:'8px'}}>{plan.name}</h3>
                  <div style={{fontSize:'2.5rem',fontWeight:800,color: 'var(--primary)'}}>
                    {plan.price === 0 ? 'Free' : plan.priceDisplay}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',gap:'10px',marginBottom:'24px',flexGrow:1}}>
                  {plan.features.map((f,i) => (
                    <div key={i} style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'0.875rem'}}>
                      <span style={{color:'var(--success)',flexShrink:0}}>✓</span>
                      <span style={{color:'var(--text-secondary)'}}>{f}</span>
                    </div>
                  ))}
                </div>
                <button
                  className={plan.price === 0 ? "btn" : "btn btn-primary"}
                  style={{
                    width:'100%',
                    justifyContent:'center',
                    ...(plan.price === 0 ? {
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      cursor: 'default'
                    } : {})
                  }}
                  disabled={plan.price === 0}
                  onClick={() => purchase(plan)}>
                  {plan.price === 0 ? 'Current Plan' : `Get ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
