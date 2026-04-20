import React, { useState, useEffect } from 'react';

type PinMode = 'enter' | 'setup' | 'confirm' | 'forgot' | 'forgot-newpin' | 'forgot-confirm';

interface PinModalProps {
  isOpen: boolean;
  mode: 'enter' | 'setup';
  username?: string;
  onSuccess: (pin: string) => void;
  onClose?: () => void;
  onForgotPin?: (username: string, newPin: string) => Promise<boolean>;
}

const PinDots: React.FC<{ filled: number; error?: boolean }> = ({ filled, error }) => (
  <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '16px 0' }}>
    {[0,1,2,3].map(i => (
      <div key={i} style={{
        width: 48, height: 48, borderRadius: '50%',
        border: error ? '2px solid #E24B4A' : filled > i ? '2px solid #F97316' : '1px solid var(--color-border-secondary)',
        background: filled > i ? (error ? '#FCEBEB' : '#FFF7ED') : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
      }}>
        {filled > i && (
          <div style={{ width: 14, height: 14, borderRadius: '50%', background: error ? '#E24B4A' : '#F97316' }} />
        )}
      </div>
    ))}
  </div>
);

const Numpad: React.FC<{ onPress: (v: string) => void }> = ({ onPress }) => {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
      {keys.map((k, i) => k === '' ? <div key={i} /> : (
        <button key={i} onClick={() => onPress(k)} style={{
          height: 52, background: 'var(--color-background-secondary)',
          border: '0.5px solid var(--color-border-tertiary)',
          borderRadius: 12, fontSize: k === '⌫' ? 18 : 20, fontWeight: 500,
          color: 'var(--color-text-primary)', cursor: 'pointer',
          transition: 'background 0.1s',
        }}>
          {k}
        </button>
      ))}
    </div>
  );
};

export const PinModal: React.FC<PinModalProps> = ({
  isOpen, mode, username = '', onSuccess, onClose, onForgotPin,
}) => {
  const [internalMode, setInternalMode] = useState<PinMode>(mode);
  const [pin, setPin] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInternalMode(mode);
      setPin(''); setFirstPin(''); setError(''); setShake(false);
      setForgotUsername(''); setForgotNewPin('');
    }
  }, [isOpen, mode]);

  const triggerError = (msg: string) => {
    setError(msg); setShake(true); setPin('');
    setTimeout(() => setShake(false), 500);
  };

  const handlePress = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); setError(''); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError('');

    if (next.length === 4) {
      setTimeout(() => {
        if (internalMode === 'enter') {
          onSuccess(next);
          // parent will close or show error
        } else if (internalMode === 'setup') {
          setFirstPin(next);
          setPin('');
          setInternalMode('confirm');
        } else if (internalMode === 'confirm') {
          if (next === firstPin) {
            onSuccess(next);
          } else {
            triggerError("PINs don't match. Try again.");
            setFirstPin('');
            setInternalMode('setup');
          }
        } else if (internalMode === 'forgot-newpin') {
          setForgotNewPin(next);
          setPin('');
          setInternalMode('forgot-confirm');
        } else if (internalMode === 'forgot-confirm') {
          if (next === forgotNewPin) {
            handleForgotReset(next);
          } else {
            triggerError("PINs don't match. Try again.");
            setForgotNewPin('');
            setInternalMode('forgot-newpin');
            setPin('');
          }
        }
      }, 100);
    }
  };

  const handleForgotReset = async (confirmedPin: string) => {
    if (!onForgotPin) return;
    setForgotLoading(true);
    const ok = await onForgotPin(forgotUsername.trim(), confirmedPin);
    setForgotLoading(false);
    if (ok) {
      onSuccess(confirmedPin);
    } else {
      setError('Username not found. Check and try again.');
      setInternalMode('forgot');
      setPin('');
    }
  };

  if (!isOpen) return null;

  const titles: Record<PinMode, { title: string; sub: string }> = {
    enter:          { title: 'Enter your PIN', sub: 'Enter your 4-digit PIN to continue' },
    setup:          { title: 'Create a PIN', sub: 'Choose a 4-digit PIN to secure your account' },
    confirm:        { title: 'Confirm PIN', sub: 'Enter the same PIN again to confirm' },
    forgot:         { title: 'Reset your PIN', sub: 'Enter your username to verify your identity' },
    'forgot-newpin': { title: 'New PIN', sub: 'Choose a new 4-digit PIN' },
    'forgot-confirm':{ title: 'Confirm new PIN', sub: 'Enter the same PIN again' },
  };

  const { title, sub } = titles[internalMode];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div style={{
        background: 'var(--color-background-primary)',
        borderRadius: 20, width: '100%', maxWidth: 360,
        border: '0.5px solid var(--color-border-tertiary)',
        padding: '1.5rem',
        animation: shake ? 'shake 0.4s ease' : undefined,
      }}>
        <style>{`
          @keyframes shake {
            0%,100%{transform:translateX(0)}
            20%,60%{transform:translateX(-8px)}
            40%,80%{transform:translateX(8px)}
          }
        `}</style>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#F97316,#FBBF24)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          {onClose && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4 }}>
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        <h2 style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)', margin: '12px 0 4px' }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '0 0 4px' }}>{sub}</p>

        {/* Forgot PIN flow — username form */}
        {internalMode === 'forgot' ? (
          <div style={{ marginTop: 16 }}>
            <input
              type="text"
              value={forgotUsername}
              onChange={e => { setForgotUsername(e.target.value); setError(''); }}
              placeholder="Enter your username"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 12,
                border: error ? '1.5px solid #E24B4A' : '1px solid var(--color-border-secondary)',
                background: 'var(--color-background-secondary)',
                color: 'var(--color-text-primary)', fontSize: 15, boxSizing: 'border-box',
                outline: 'none',
              }}
            />
            {error && <p style={{ color: '#E24B4A', fontSize: 12, margin: '6px 0 0' }}>{error}</p>}
            <button
              onClick={() => { if (forgotUsername.trim()) { setError(''); setPin(''); setInternalMode('forgot-newpin'); } else setError('Please enter your username.'); }}
              style={{
                width: '100%', marginTop: 12, padding: '12px', borderRadius: 12,
                background: '#F97316', border: 'none', color: 'white',
                fontSize: 15, fontWeight: 500, cursor: 'pointer',
              }}
            >
              Continue
            </button>
            <button
              onClick={() => { setInternalMode('enter'); setError(''); setPin(''); }}
              style={{ width: '100%', marginTop: 8, padding: '10px', borderRadius: 12, background: 'none', border: '0.5px solid var(--color-border-secondary)', color: 'var(--color-text-secondary)', fontSize: 14, cursor: 'pointer' }}
            >
              Back
            </button>
          </div>
        ) : (
          <>
            <PinDots filled={pin.length} error={!!error} />
            {error && (
              <p style={{ color: '#E24B4A', fontSize: 12, textAlign: 'center', margin: '-8px 0 8px' }}>{error}</p>
            )}
            <Numpad onPress={handlePress} />
            {internalMode === 'enter' && (
              <button
                onClick={() => { setInternalMode('forgot'); setPin(''); setError(''); }}
                style={{ width: '100%', marginTop: 12, background: 'none', border: 'none', color: '#185FA5', fontSize: 13, cursor: 'pointer', padding: '4px 0' }}
              >
                Forgot PIN?
              </button>
            )}
            {forgotLoading && (
              <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 8 }}>Verifying…</p>
            )}
          </>
        )}
      </div>
    </div>
  );
};
