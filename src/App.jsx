/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PresenterView from './components/PresenterView';
import ViewerView from './components/ViewerView';

const IMG_MAIN   = 'https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/67057a7da0a192dc813c70df_BAZZ8881%20copy.jpg?alt=media&token=a4cb6206-b7b1-4950-8c8f-593f70dfeefc';
const IMG_ACCENT = 'https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/54.jpeg?alt=media&token=baf6040d-e467-414e-a801-430720b83931';

/* ─── Responsive breakpoint hook ─────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, w };
}

/* ─── Splash ──────────────────────────────────────────────────────────────── */
const SplashScreen = ({ onDone }) => {
  const [out, setOut] = useState(false);
  useEffect(() => {
    const f = setTimeout(() => setOut(true), 3600);
    const d = setTimeout(onDone, 4200);
    return () => { clearTimeout(f); clearTimeout(d); };
  }, [onDone]);
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999, background: '#f6f2ef',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.55s ease', opacity: out ? 0 : 1,
      pointerEvents: out ? 'none' : 'auto',
    }}>
      <img
        src="https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/Neutral%20Blue%20Minimalism%20Motivational%20Life%20Quote%20Desktop%20Wallpaper.png?alt=media&token=61d1ca82-a249-4878-9026-debaaff3a5f4"
        alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }}
      />
    </div>
  );
};

/* ─── CSS keyframes injected once ────────────────────────────────────────── */
const STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  @keyframes panelIn   { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
  @keyframes cardIn    { from{opacity:0;transform:translateY(22px) scale(0.96)} to{opacity:1;transform:translateY(0) scale(1)} }
  @keyframes shake     {
    0%,100%{transform:translateX(0)}
    15%{transform:translateX(-11px)} 30%{transform:translateX(11px)}
    45%{transform:translateX(-7px)}  60%{transform:translateX(7px)}
    75%{transform:translateX(-3px)}  90%{transform:translateX(3px)}
  }
  @keyframes floatUp   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
  @keyframes spin      { to{transform:rotate(360deg)} }
  @keyframes checkDraw { from{stroke-dashoffset:32} to{stroke-dashoffset:0} }
  @keyframes greenPing {
    0%  {box-shadow:0 0 0 0 rgba(21,128,61,0.35)}
    70% {box-shadow:0 0 0 16px rgba(21,128,61,0)}
    100%{box-shadow:0 0 0 0 rgba(21,128,61,0)}
  }
`;

/* ─── PIN indicator dots ──────────────────────────────────────────────────── */
function PinDots({ value, max, phase }) {
  const color = phase === 'error' ? '#b91c1c' : phase === 'success' ? '#15803d' : '#1e2d5a';
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', margin: '22px 0 18px' }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value.length;
        const active = i === value.length && phase === 'idle';
        return (
          <div key={i} style={{
            width:  filled ? 14 : 11,
            height: filled ? 14 : 11,
            borderRadius: '50%',
            background: filled ? color : 'transparent',
            border: `2px solid ${filled || active ? color : '#cbd5e1'}`,
            transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: filled && phase !== 'error'
              ? `0 0 0 3px ${phase === 'success' ? 'rgba(21,128,61,0.13)' : 'rgba(30,45,90,0.1)'}`
              : 'none',
          }} />
        );
      })}
    </div>
  );
}

/* ─── Single numpad button ────────────────────────────────────────────────── */
function PadKey({ digit, sub, icon, onPress, disabled, size }) {
  const [down, setDown] = useState(false);

  // Critical: use onPointerDown for reliable cross-device tap detection
  const handlePointerDown = (e) => {
    e.preventDefault();
    if (disabled) return;
    setDown(true);
    onPress();
  };
  const handlePointerUp  = () => setDown(false);

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      disabled={disabled}
      style={{
        width: size, height: size,
        borderRadius: '50%',
        border: icon ? 'none' : '1px solid #e2e8f0',
        background: down ? '#dde5f4' : icon ? 'transparent' : '#ffffff',
        boxShadow: (down || icon) ? 'none' : '0 1px 4px rgba(30,45,90,0.09)',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 1,
        transition: 'background 0.08s ease, transform 0.1s ease',
        transform: down ? 'scale(0.88)' : 'scale(1)',
        outline: 'none',
        userSelect: 'none', WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        fontFamily: 'system-ui, sans-serif',
        flexShrink: 0,
      }}
    >
      {icon
        ? icon
        : <>
            <span style={{ fontSize: size < 68 ? 19 : 22, fontWeight: 400, color: '#1e2d5a', lineHeight: 1 }}>
              {digit}
            </span>
            {sub && (
              <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.2, color: '#94a3b8', textTransform: 'uppercase' }}>
                {sub}
              </span>
            )}
          </>
      }
    </button>
  );
}

/* ─── Status icon (lock / spinner / check / alert) ───────────────────────── */
function StatusIcon({ phase }) {
  const busy = phase === 'checking' || phase === 'success';
  const bg  = phase === 'success' ? '#dcfce7' : phase === 'error' ? '#fee2e2' : '#eff2fa';
  const bdr = phase === 'success' ? '#bbf7d0' : phase === 'error' ? '#fecaca' : '#dce3f7';
  return (
    <div style={{
      width: 66, height: 66, borderRadius: 20,
      background: bg, border: `1.5px solid ${bdr}`,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      marginBottom: 18,
      transition: 'background 0.3s, border-color 0.3s',
      animation: !busy
        ? (phase === 'success' ? 'greenPing 0.6s ease, floatUp 3.5s 0.6s ease-in-out infinite'
                                : 'floatUp 3.5s ease-in-out infinite')
        : 'none',
    }}>
      {phase === 'success' && (
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
          <path d="M4 12l5 5L20 7" stroke="#15803d" strokeWidth="2.3"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="32" style={{ animation: 'checkDraw 0.35s ease forwards' }} />
        </svg>
      )}
      {phase === 'checking' && (
        <div style={{
          width: 26, height: 26, borderRadius: '50%',
          border: '2.5px solid #dce3f7', borderTopColor: '#1e2d5a',
          animation: 'spin 0.65s linear infinite',
        }} />
      )}
      {phase === 'error' && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#b91c1c" strokeWidth="1.8" />
          <path d="M12 8v5" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="15.5" r="1" fill="#b91c1c" />
        </svg>
      )}
      {phase === 'idle' && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2.5" stroke="#1e2d5a" strokeWidth="1.8" />
          <path d="M7 11V7.5a5 5 0 0110 0V11" stroke="#1e2d5a" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.5" r="1.4" fill="#1e2d5a" />
        </svg>
      )}
    </div>
  );
}

/* ─── Delete icon ─────────────────────────────────────────────────────────── */
const DelIcon = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path
      d="M21 4H7.5c-.55 0-1.05.27-1.34.71L2 12l4.16 7.29c.29.44.79.71 1.34.71H21a1 1 0 001-1V5a1 1 0 00-1-1z"
      stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"
    />
    <path d="M14.5 9.5l-3 3m0-3l3 3" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

/* ─── The numpad grid definition ──────────────────────────────────────────── */
const PAD = [
  ['1',''],   ['2','ABC'], ['3','DEF'],
  ['4','GHI'],['5','JKL'], ['6','MNO'],
  ['7','PQRS'],['8','TUV'],['9','WXYZ'],
  null,       ['0',''],    'del',
];

/* ─── Shared form block (PIN dots + pad) ──────────────────────────────────── */
function PinForm({ pin, phase, onPress, keySize }) {
  const busy = phase === 'checking' || phase === 'success';
  const statusText  = {
    idle:     'Enter your access PIN to continue',
    checking: 'Verifying…',
    error:    'Incorrect PIN — please try again',
    success:  'Access granted. Welcome!',
  };
  const statusColor = { idle: '#64748b', checking: '#1e2d5a', error: '#b91c1c', success: '#15803d' };

  return (
    <>
      {/* Icon + heading */}
      <div style={{ textAlign: 'center', marginBottom: 8 }}>
        <StatusIcon phase={phase} />
        <h1 style={{
          margin: '0 0 6px', fontSize: 22, fontWeight: 700,
          color: '#0f172a', letterSpacing: '-0.5px', fontFamily: 'Georgia, serif',
        }}>
          Welcome back
        </h1>
        <p style={{
          margin: 0, fontSize: 13, minHeight: 20,
          color: statusColor[phase],
          fontWeight: phase === 'idle' ? 400 : 600,
          transition: 'color 0.2s',
        }}>
          {statusText[phase]}
        </p>
      </div>

      {/* PIN dots */}
      <PinDots value={pin} max={5} phase={phase} />

      {/* Divider */}
      <div style={{ height: 1, background: '#e8e4de', margin: '0 0 22px' }} />

      {/* Number pad */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${keySize}px)`,
        rowGap: 10, columnGap: 10,
        justifyContent: 'center',
        opacity: busy ? 0.32 : 1,
        transition: 'opacity 0.2s',
        pointerEvents: busy ? 'none' : 'auto',
      }}>
        {PAD.map((cell, i) => {
          if (cell === null) {
            return <div key={i} style={{ width: keySize, height: keySize }} />;
          }
          if (cell === 'del') {
            return (
              <PadKey
                key={i}
                icon={DelIcon}
                onPress={() => onPress('del')}
                disabled={busy}
                size={keySize}
              />
            );
          }
          const [d, s] = cell;
          return (
            <PadKey
              key={i}
              digit={d}
              sub={s}
              onPress={() => onPress(d)}
              disabled={busy}
              size={keySize}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{
        marginTop: 26, display: 'flex',
        alignItems: 'center', justifyContent: 'center', gap: 6,
      }}>
        <div style={{
          width: 6, height: 6, borderRadius: '50%',
          background: '#22c55e', boxShadow: '0 0 0 2px #dcfce7', flexShrink: 0,
        }} />
        <span style={{ fontSize: 11, color: '#94a3b8', letterSpacing: 0.3 }}>
          Secured session · Authorized access only
        </span>
      </div>
    </>
  );
}

/* ─── Image panel (left side on desktop / banner on mobile) ──────────────── */
function ImagePanel({ mode }) {
  // mode: 'side' | 'banner' | 'background'
  if (mode === 'banner') return (
    <div style={{ position: 'relative', height: 230, flexShrink: 0, overflow: 'hidden' }}>
      <img src={IMG_MAIN} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(10,18,50,0.12), rgba(10,18,50,0.72))' }} />
      {/* Logo */}
      <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.92)', fontFamily: 'Georgia, serif' }}>French Classroom</span>
      </div>
      {/* Bottom strip */}
      <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.4)', flexShrink: 0 }}>
          <img src={IMG_ACCENT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 300, color: 'rgba(255,255,255,0.9)', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
            "આ દેહ થી શું ના થાય મહંત જી ને કાજે"
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>MahantSwami Maharaj · France</div>
        </div>
      </div>
    </div>
  );

  if (mode === 'side') return (
    <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: '100vh', display: 'flex', flexDirection: 'column', animation: 'panelIn 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
      <img src={IMG_MAIN} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,25,60,0.06) 0%, rgba(15,25,60,0.18) 45%, rgba(10,18,50,0.84) 100%)' }} />
      {/* Logo */}
      <div style={{ position: 'relative', zIndex: 10, padding: '28px 32px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="" style={{ width: 24, height: 24, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.93)', fontFamily: 'Georgia, serif', letterSpacing: '-0.2px' }}>
          French Classroom
        </span>
      </div>
      {/* Bottom quote */}
      <div style={{ position: 'relative', zIndex: 10, marginTop: 'auto', padding: '0 36px 40px' }}>
        <div style={{ width: 84, height: 84, borderRadius: 16, overflow: 'hidden', border: '2px solid rgba(255,255,255,0.35)', boxShadow: '0 8px 28px rgba(0,0,0,0.28)', marginBottom: 20 }}>
          <img src={IMG_ACCENT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ fontSize: 21, fontWeight: 300, color: 'rgba(255,255,255,0.92)', lineHeight: 1.5, fontFamily: 'Georgia, serif', marginBottom: 10, maxWidth: 380 }}>
          "આ દેહ થી શું ના થાય મહંત જી ને કાજે"
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.48)', letterSpacing: 0.3 }}>MahantSwami Maharaj · France</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 20 }}>
          {[1, 0, 0].map((a, i) => (
            <div key={i} style={{ width: a ? 22 : 6, height: 6, borderRadius: 3, background: `rgba(255,255,255,${a ? 0.85 : 0.28})` }} />
          ))}
        </div>
      </div>
    </div>
  );

  // 'background' for tablet
  return null;
}

/* ─── Login screen ────────────────────────────────────────────────────────── */
function LoginScreen({ onSuccess }) {
  const [pin,    setPin]    = useState('');
  const [phase,  setPhase]  = useState('idle');
  const [shake,  setShake]  = useState(false);
  const [ready,  setReady]  = useState(false);
  const { isMobile, isTablet } = useBreakpoint();
  const MAX = 5;

  useEffect(() => { const t = setTimeout(() => setReady(true), 80); return () => clearTimeout(t); }, []);

  /* Core submit logic */
  const submit = useCallback((next) => {
    setPhase('checking');
    setTimeout(() => {
      if (next === process.env.REACT_APP_ACCESS_PASSWORD) {
        setPhase('success');
        sessionStorage.setItem('oc_auth', '1');
        setTimeout(onSuccess, 950);
      } else {
        setPhase('error');
        setShake(true);
        setTimeout(() => {
          setPin('');
          setPhase('idle');
          setShake(false);
        }, 850);
      }
    }, 400);
  }, [onSuccess]);

  /* Handle digit/del press — called from both pad buttons AND keyboard */
  const press = useCallback((k) => {
    // Block input while transitioning
    if (phase === 'checking' || phase === 'success') return;

    if (k === 'del') {
      setPin(prev => prev.slice(0, -1));
      if (phase === 'error') setPhase('idle');
      return;
    }

    // Only accept single digit characters
    if (!/^\d$/.test(k)) return;

    setPin(prev => {
      if (prev.length >= MAX) return prev;   // guard: don't exceed MAX
      const next = prev + k;
      if (next.length === MAX) {
        // Use setTimeout so state updates complete before submit reads them
        setTimeout(() => submit(next), 0);
      }
      return next;
    });
  }, [phase, submit]);

  /* Keyboard support */
  useEffect(() => {
    const handler = (e) => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace')    press('del');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [press]);

  const keySize = isMobile ? 62 : 72;

  const formWrap = (
    <div style={{
      width: '100%', maxWidth: 308,
      animation: ready
        ? shake
          ? 'shake 0.8s ease'
          : phase === 'success'
            ? 'greenPing 0.6s ease'
            : 'cardIn 0.5s cubic-bezier(0.22,1,0.36,1) both'
        : 'none',
    }}>
      <PinForm pin={pin} phase={phase} onPress={press} keySize={keySize} />
    </div>
  );

  /* ── MOBILE ── */
  if (isMobile) return (
    <div style={{ minHeight: '100vh', background: '#fafaf8', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif' }}>
      <style>{STYLES}</style>
      <ImagePanel mode="banner" />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 20px 48px', overflowY: 'auto' }}>
        {formWrap}
      </div>
    </div>
  );

  /* ── TABLET ── */
  if (isTablet) return (
    <div style={{ minHeight: '100vh', position: 'relative', fontFamily: 'system-ui, sans-serif' }}>
      <style>{STYLES}</style>
      <img src={IMG_MAIN} alt="" style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 25%', zIndex: 0 }} />
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,18,50,0.48)', zIndex: 1 }} />
      {/* Logo */}
      <div style={{ position: 'fixed', top: 20, left: 24, zIndex: 10, display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="" style={{ width: 22, height: 22, objectFit: 'contain' }} onError={e => e.target.style.display = 'none'} />
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontFamily: 'Georgia, serif' }}>French Classroom</span>
      </div>
      {/* Centered card */}
      <div style={{ position: 'relative', zIndex: 10, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 24px 40px' }}>
        <div style={{ background: 'rgba(250,250,248,0.97)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderRadius: 24, border: '1px solid rgba(255,255,255,0.88)', boxShadow: '0 32px 80px rgba(10,18,50,0.28), 0 8px 24px rgba(0,0,0,0.14)', padding: '36px 32px 32px', width: '100%', maxWidth: 380 }}>
          {/* Card top strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid #e8e4de' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #e8e4de', flexShrink: 0 }}>
              <img src={IMG_ACCENT} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div>
              <div style={{ fontSize: 10, color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 600, marginBottom: 2 }}>Secured Access</div>
              <div style={{ fontSize: 12, fontStyle: 'italic', color: '#64748b', fontFamily: 'Georgia, serif', lineHeight: 1.4 }}>
                "આ દેહ થી શું ના થાય મહંત જી ને કાજે"
              </div>
            </div>
          </div>
          {formWrap}
        </div>
      </div>
    </div>
  );

  /* ── DESKTOP ── */
  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: 'system-ui, sans-serif', overflow: 'hidden' }}>
      <style>{STYLES}</style>
      <ImagePanel mode="side" />
      {/* Right form panel */}
      <div style={{ width: 448, flexShrink: 0, background: '#fafaf8', borderLeft: '1px solid #e8e4de', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '52px 44px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -70, right: -70, width: 240, height: 240, borderRadius: '50%', background: '#1e2d5a', opacity: 0.04, pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, borderRadius: '50%', background: '#b91c1c', opacity: 0.03, pointerEvents: 'none' }} />
        {formWrap}
      </div>
    </div>
  );
}

/* ─── Root ────────────────────────────────────────────────────────────────── */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authed,     setAuthed]     = useState(() => sessionStorage.getItem('oc_auth') === '1');

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
  if (!authed)     return <LoginScreen  onSuccess={() => setAuthed(true)} />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<Dashboard />} />
        <Route path="/session/:id" element={<PresenterView />} />
        <Route path="/view/:id"    element={<ViewerView />} />
      </Routes>
    </BrowserRouter>
  );
}