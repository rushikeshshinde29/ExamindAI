import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { BsExclamationTriangle, BsChatLeftText } from 'react-icons/bs';

const DialogContext = createContext(null);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useDialog must be used within a DialogProvider');
  }
  return context;
};

export function DialogProvider({ children }) {
  const [activeDialog, setActiveDialog] = useState(null);
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef(null);

  const confirm = (message, title = 'Confirm Action') => {
    return new Promise((resolve) => {
      setActiveDialog({
        type: 'confirm',
        title,
        message,
        resolve
      });
    });
  };

  const prompt = (message, defaultValue = '', title = 'Input Required') => {
    setPromptValue(defaultValue);
    return new Promise((resolve) => {
      setActiveDialog({
        type: 'prompt',
        title,
        message,
        defaultValue,
        resolve
      });
    });
  };

  const handleResolve = (value) => {
    if (activeDialog) {
      activeDialog.resolve(value);
      setActiveDialog(null);
    }
  };

  useEffect(() => {
    if (activeDialog?.type === 'prompt' && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [activeDialog]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!activeDialog) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        handleResolve(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (activeDialog.type === 'prompt') {
          handleResolve(promptValue);
        } else {
          handleResolve(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeDialog, promptValue]);

  return (
    <DialogContext.Provider value={{ confirm, prompt }}>
      {children}

      {activeDialog && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(9, 11, 20, 0.75)',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.3s'
          }}
          onClick={() => handleResolve(null)}
        >
          <div 
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-surface)',
              border: '1.5px solid var(--bg-border)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              overflow: 'hidden',
              animation: 'dialogFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '16px 20px',
              backgroundColor: 'var(--bg-raised)',
              borderBottom: '1px solid var(--bg-border)'
            }}>
              {activeDialog.type === 'confirm' ? (
                <BsExclamationTriangle size={18} color="var(--warning)" />
              ) : (
                <BsChatLeftText size={16} color="var(--primary)" />
              )}
              <h3 style={{
                margin: 0,
                fontSize: '0.95rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                fontFamily: 'inherit'
              }}>
                {activeDialog.title}
              </h3>
            </div>

            {/* Body */}
            <div style={{ padding: '20px' }}>
              <p style={{
                margin: '0 0 16px 0',
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: 'var(--text-secondary)',
                fontFamily: 'inherit'
              }}>
                {activeDialog.message}
              </p>

              {activeDialog.type === 'prompt' && (
                <input
                  ref={inputRef}
                  type="text"
                  value={promptValue}
                  onChange={e => setPromptValue(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1.5px solid var(--bg-border)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-primary)',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={e => {
                    e.target.style.borderColor = 'var(--primary)';
                    e.target.style.boxShadow = '0 0 0 3px var(--primary-glow)';
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = 'var(--bg-border)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              )}
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '10px',
              padding: '12px 20px',
              backgroundColor: 'var(--bg-raised)',
              borderTop: '1px solid var(--bg-border)'
            }}>
              <button
                type="button"
                onClick={() => handleResolve(null)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1.5px solid var(--bg-border)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = 'var(--gray-100)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleResolve(activeDialog.type === 'prompt' ? promptValue : true)}
                style={{
                  padding: '8px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: activeDialog.type === 'confirm' ? 'var(--danger)' : 'var(--primary)',
                  color: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontFamily: 'inherit',
                  boxShadow: activeDialog.type === 'confirm' 
                    ? '0 4px 12px rgba(220, 38, 38, 0.2)' 
                    : '0 4px 12px rgba(104, 80, 219, 0.2)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = activeDialog.type === 'confirm' ? '#b91c1c' : 'var(--primary-dark)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = activeDialog.type === 'confirm' ? 'var(--danger)' : 'var(--primary)';
                }}
              >
                {activeDialog.type === 'confirm' ? 'Confirm' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
