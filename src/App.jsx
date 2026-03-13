/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import PresenterView from './components/PresenterView';
import ViewerView from './components/ViewerView';

const IMG_MAIN   = 'https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/67057a7da0a192dc813c70df_BAZZ8881%20copy.jpg?alt=media&token=a4cb6206-b7b1-4950-8c8f-593f70dfeefc';
const IMG_ACCENT = 'https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/54.jpeg?alt=media&token=baf6040d-e467-414e-a801-430720b83931';

/* ─── Responsive hook ─────────────────────────────────────────────────────── */
function useBreakpoint() {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { isMobile: w < 640, isTablet: w >= 640 && w < 1024, isDesktop: w >= 1024, w };
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
      position:'fixed', inset:0, zIndex:9999, background:'#f6f2ef',
      display:'flex', alignItems:'center', justifyContent:'center',
      transition:'opacity 0.55s ease', opacity: out ? 0 : 1,
    }}>
      <img
        src="https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/Neutral%20Blue%20Minimalism%20Motivational%20Life%20Quote%20Desktop%20Wallpaper.png?alt=media&token=61d1ca82-a249-4878-9026-debaaff3a5f4"
        alt="" style={{ maxWidth:'80%', maxHeight:'80%', objectFit:'contain' }}
      />
    </div>
  );
};

/* ─── PIN dots ────────────────────────────────────────────────────────────── */
function PinDots({ value, max, error, success }) {
  const color = error ? '#b91c1c' : success ? '#15803d' : '#1e2d5a';
  return (
    <div style={{ display:'flex', gap:12, justifyContent:'center', margin:'20px 0 18px' }}>
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < value.length;
        const active = i === value.length && !error && !success;
        return (
          <div key={i} style={{
            width: filled ? 14 : 12,
            height: filled ? 14 : 12,
            borderRadius:'50%',
            background: filled ? color : 'transparent',
            border: `2px solid ${active ? color : filled ? color : '#cbd5e1'}`,
            transition:'all 0.18s cubic-bezier(0.34,1.56,0.64,1)',
            boxShadow: filled && !error ? `0 0 0 3px ${success ? 'rgba(21,128,61,0.12)' : 'rgba(30,45,90,0.1)'}` : 'none',
          }} />
        );
      })}
    </div>
  );
}

/* ─── Pad key ─────────────────────────────────────────────────────────────── */
function PadKey({ digit, sub, icon, onPress, disabled, size = 72 }) {
  const [down, setDown] = useState(false);
  const fire = () => { if (!disabled) onPress(); };
  return (
    <button
      onMouseDown={() => { setDown(true); fire(); }}
      onMouseUp={() => setDown(false)}
      onMouseLeave={() => setDown(false)}
      onTouchStart={e => { e.preventDefault(); setDown(true); fire(); }}
      onTouchEnd={() => setDown(false)}
      disabled={disabled}
      style={{
        width:size, height:size, borderRadius:'50%',
        border: icon ? 'none' : '1px solid #e2e8f0',
        background: down ? '#e8edf5' : icon ? 'transparent' : '#ffffff',
        boxShadow: down ? 'none' : icon ? 'none' : '0 1px 4px rgba(30,45,90,0.08)',
        cursor: disabled ? 'default' : 'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:1,
        transition:'all 0.1s ease',
        transform: down ? 'scale(0.90)' : 'scale(1)',
        outline:'none', userSelect:'none', WebkitUserSelect:'none',
        fontFamily:'system-ui, sans-serif', flexShrink:0,
      }}
    >
      {icon ? icon : (
        <>
          <span style={{ fontSize: size < 64 ? 18 : 22, fontWeight:400, color:'#1e2d5a', lineHeight:1 }}>{digit}</span>
          {sub && <span style={{ fontSize:7, fontWeight:700, letterSpacing:1.2, color:'#94a3b8', textTransform:'uppercase' }}>{sub}</span>}
        </>
      )}
    </button>
  );
}

/* ─── The status icon box ─────────────────────────────────────────────────── */
function StatusIcon({ phase, busy }) {
  const bg    = phase === 'success' ? '#dcfce7' : phase === 'error' ? '#fee2e2' : '#eff2fa';
  const bdr   = phase === 'success' ? '#bbf7d0' : phase === 'error' ? '#fecaca' : '#dce3f7';
  return (
    <div style={{
      width:64, height:64, borderRadius:18,
      background: bg, border:`1.5px solid ${bdr}`,
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      transition:'all 0.35s ease',
      animation: !busy ? 'float 3.5s ease-in-out infinite' : 'none',
      marginBottom:16,
    }}>
      {phase === 'success' && (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M5 12l4 4.5L19 7" stroke="#15803d" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray="28" style={{ animation:'checkDraw 0.3s ease forwards' }} />
        </svg>
      )}
      {phase === 'checking' && (
        <div style={{ width:24, height:24, borderRadius:'50%', border:'2.5px solid #dce3f7', borderTopColor:'#1e2d5a', animation:'spin 0.65s linear infinite' }} />
      )}
      {phase === 'error' && (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path d="M12 8v5m0 3h.01" stroke="#b91c1c" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="9" stroke="#b91c1c" strokeWidth="1.8"/>
        </svg>
      )}
      {phase === 'idle' && (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="11" width="18" height="11" rx="2.5" stroke="#1e2d5a" strokeWidth="1.8"/>
          <path d="M7 11V7.5a5 5 0 0110 0V11" stroke="#1e2d5a" strokeWidth="1.8" strokeLinecap="round"/>
          <circle cx="12" cy="16.5" r="1.4" fill="#1e2d5a"/>
        </svg>
      )}
    </div>
  );
}

/* ─── Login screen ────────────────────────────────────────────────────────── */
function LoginScreen({ onSuccess }) {
  const [pin, setPin]       = useState('');
  const [phase, setPhase]   = useState('idle');
  const [shake, setShake]   = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const MAX = 5;

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);

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
        setTimeout(() => { setPin(''); setPhase('idle'); setShake(false); }, 800);
      }
    }, 420);
  }, [onSuccess]);

  const press = useCallback((k) => {
    if (phase === 'checking' || phase === 'success') return;
    if (k === 'del') { setPin(p => p.slice(0, -1)); if (phase === 'error') setPhase('idle'); return; }
    if (pin.length >= MAX) return;
    const next = pin + k;
    setPin(next);
    if (next.length === MAX) submit(next);
  }, [pin, phase, submit]);

  useEffect(() => {
    const h = (e) => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [press]);

  const busy = phase === 'checking' || phase === 'success';
  const keySize = isMobile ? 62 : 72;

  const DelIcon = (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M21 4H7.5c-.55 0-1.05.27-1.34.71L2 12l4.16 7.29c.29.44.79.71 1.34.71H21a1 1 0 001-1V5a1 1 0 00-1-1z" stroke="#64748b" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M14.5 9.5l-3 3m0-3l3 3" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );

  const padRows = [
    [['1',''],   ['2','ABC'], ['3','DEF']],
    [['4','GHI'],['5','JKL'], ['6','MNO']],
    [['7','PQRS'],['8','TUV'],['9','WXYZ']],
    [null,        ['0',''],   'del'],
  ];

  const statusText  = { idle:'Enter your access PIN to continue', checking:'Verifying…', error:'Incorrect PIN — please try again', success:'Access granted. Welcome!' };
  const statusColor = { idle:'#64748b', checking:'#1e2d5a', error:'#b91c1c', success:'#15803d' };

  /* shared form content */
  const FormContent = (
    <div style={{
      width:'100%', maxWidth: isMobile ? 300 : 320,
      margin:'0 auto',
      animation: mounted
        ? (shake ? 'shake 0.75s ease' : phase === 'success' ? 'successPulse 0.6s ease' : 'cardIn 0.55s cubic-bezier(0.22,1,0.36,1) both')
        : 'none',
    }}>
      <div style={{ textAlign:'center', marginBottom: isMobile ? 16 : 24 }}>
        <StatusIcon phase={phase} busy={busy} />
        <h1 style={{ margin:'0 0 6px', fontSize: isMobile ? 20 : 22, fontWeight:700, color:'#0f172a', letterSpacing:'-0.5px', fontFamily:'Georgia, serif' }}>
          Welcome back
        </h1>
        <p style={{ margin:0, fontSize:13, color: statusColor[phase], fontWeight: phase === 'idle' ? 400 : 500, transition:'color 0.2s', minHeight:18 }}>
          {statusText[phase]}
        </p>
      </div>

      <PinDots value={pin} max={MAX} error={phase === 'error'} success={phase === 'success'} />
      <div style={{ height:1, background:'#e8e4de', margin:'0 0 20px' }} />

      <div style={{
        display:'grid', gridTemplateColumns:`repeat(3, ${keySize}px)`,
        rowGap: isMobile ? 8 : 10, columnGap: isMobile ? 8 : 10,
        justifyContent:'center',
        opacity: busy ? 0.35 : 1, transition:'opacity 0.2s',
        pointerEvents: busy ? 'none' : 'auto',
      }}>
        {padRows.map((row, ri) =>
          row.map((cell, ci) => {
            const key = `${ri}-${ci}`;
            if (cell === null) return <div key={key} style={{ width:keySize, height:keySize }} />;
            if (cell === 'del') return <PadKey key={key} icon={DelIcon} onPress={() => press('del')} disabled={busy} size={keySize} />;
            const [d, s] = cell;
            return <PadKey key={key} digit={d} sub={s} onPress={() => press(d)} disabled={busy} size={keySize} />;
          })
        )}
      </div>

      <div style={{ marginTop:24, textAlign:'center', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 0 2px #dcfce7', flexShrink:0 }} />
        <span style={{ fontSize:11, color:'#94a3b8', letterSpacing:0.3 }}>Secured session · Authorized access only</span>
      </div>
    </div>
  );

  /* ── MOBILE layout: stacked, image banner on top ── */
  if (isMobile) return (
    <div style={{ minHeight:'100vh', background:'#fafaf8', fontFamily:'system-ui, sans-serif', display:'flex', flexDirection:'column' }}>
      <Styles />

      {/* Hero banner */}
      <div style={{ position:'relative', height:220, overflow:'hidden', flexShrink:0 }}>
        <img src={IMG_MAIN} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(15,25,60,0.15) 0%, rgba(10,18,50,0.7) 100%)' }} />

        {/* Logo row */}
        <div style={{ position:'absolute', top:16, left:16, display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:32, height:32, borderRadius:9, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src="/logo.png" alt="" style={{ width:20, height:20, objectFit:'contain' }} onError={e => e.target.style.display='none'} />
          </div>
          <span style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,0.92)', fontFamily:'Georgia, serif' }}>Online Classroom</span>
        </div>

        {/* Bottom accent strip */}
        <div style={{ position:'absolute', bottom:16, left:16, right:16, display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:44, height:44, borderRadius:10, overflow:'hidden', border:'2px solid rgba(255,255,255,0.4)', flexShrink:0 }}>
            <img src={IMG_ACCENT} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div>
            <div style={{ fontSize:12, fontWeight:300, color:'rgba(255,255,255,0.88)', fontFamily:'Georgia, serif', lineHeight:1.4 }}>"Knowledge shared is knowledge multiplied."</div>
            <div style={{ fontSize:10, color:'rgba(255,255,255,0.5)', marginTop:2 }}>MahantSwami Maharaj · France</div>
          </div>
        </div>
      </div>

      {/* Form area */}
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'32px 20px 40px', overflowY:'auto' }}>
        {FormContent}
      </div>
    </div>
  );

  /* ── TABLET layout: card floating over full-bleed image ── */
  if (isTablet) return (
    <div style={{ minHeight:'100vh', position:'relative', fontFamily:'system-ui, sans-serif' }}>
      <Styles />

      {/* Full-bleed background */}
      <img src={IMG_MAIN} alt="" style={{ position:'fixed', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%', zIndex:0 }} />
      <div style={{ position:'fixed', inset:0, background:'rgba(10,18,50,0.45)', zIndex:1 }} />

      {/* Top logo */}
      <div style={{ position:'fixed', top:20, left:24, zIndex:10, display:'flex', alignItems:'center', gap:9 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
          <img src="/logo.png" alt="" style={{ width:22, height:22, objectFit:'contain' }} onError={e => e.target.style.display='none'} />
        </div>
        <span style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.9)', fontFamily:'Georgia, serif' }}>Online Classroom</span>
      </div>

      {/* Centered floating card */}
      <div style={{ position:'relative', zIndex:10, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'80px 24px 40px' }}>
        <div style={{
          background:'rgba(250,250,248,0.97)',
          backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
          borderRadius:24, border:'1px solid rgba(255,255,255,0.9)',
          boxShadow:'0 32px 80px rgba(10,18,50,0.25), 0 8px 24px rgba(0,0,0,0.12)',
          padding:'40px 36px',
          width:'100%', maxWidth:380,
        }}>
          {/* Accent image inside card */}
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:24, paddingBottom:20, borderBottom:'1px solid #e8e4de' }}>
            <div style={{ width:40, height:40, borderRadius:10, overflow:'hidden', border:'1.5px solid #e8e4de', flexShrink:0 }}>
              <img src={IMG_ACCENT} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </div>
            <div>
              <div style={{ fontSize:11, color:'#94a3b8', letterSpacing:0.4 }}>SECURED ACCESS</div>
              <div style={{ fontSize:13, fontStyle:'italic', color:'#64748b', fontFamily:'Georgia, serif', lineHeight:1.3 }}>"Knowledge shared is knowledge multiplied."</div>
            </div>
          </div>
          {FormContent}
        </div>
      </div>
    </div>
  );

  /* ── DESKTOP layout: two-column split ── */
  return (
    <div style={{ minHeight:'100vh', display:'flex', fontFamily:'system-ui, sans-serif', overflow:'hidden' }}>
      <Styles />

      {/* Left — image panel */}
      <div style={{
        flex:1, position:'relative', overflow:'hidden', minHeight:'100vh',
        display:'flex', flexDirection:'column',
        animation: mounted ? 'panelIn 0.7s cubic-bezier(0.22,1,0.36,1) both' : 'none',
      }}>
        <img src={IMG_MAIN} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center 20%' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(15,25,60,0.06) 0%, rgba(15,25,60,0.2) 40%, rgba(10,18,50,0.82) 100%)' }} />

        {/* Logo */}
        <div style={{ position:'relative', zIndex:10, padding:'28px 32px', display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:38, height:38, borderRadius:10, background:'rgba(255,255,255,0.18)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)', border:'1px solid rgba(255,255,255,0.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <img src="/logo.png" alt="" style={{ width:24, height:24, objectFit:'contain' }} onError={e => e.target.style.display='none'} />
          </div>
          <span style={{ fontSize:15, fontWeight:700, color:'rgba(255,255,255,0.92)', letterSpacing:'-0.2px', fontFamily:'Georgia, serif' }}>Online Classroom</span>
        </div>

        {/* Bottom quote + accent */}
        <div style={{ position:'relative', zIndex:10, marginTop:'auto', padding:'0 36px 40px' }}>
          <div style={{ width:84, height:84, borderRadius:16, overflow:'hidden', border:'2px solid rgba(255,255,255,0.35)', boxShadow:'0 8px 24px rgba(0,0,0,0.3)', marginBottom:20 }}>
            <img src={IMG_ACCENT} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          </div>
          <div style={{ fontSize:22, fontWeight:300, color:'rgba(255,255,255,0.92)', lineHeight:1.5, fontFamily:'Georgia, serif', marginBottom:10, maxWidth:380 }}>
            "Knowledge shared is knowledge multiplied."
          </div>
          <div style={{ fontSize:13, color:'rgba(255,255,255,0.5)', letterSpacing:0.3 }}>MahantSwami Maharaj · France</div>
          <div style={{ display:'flex', gap:6, marginTop:20 }}>
            {[1,0,0].map((a,i) => (
              <div key={i} style={{ width: a ? 22 : 6, height:6, borderRadius:3, background:`rgba(255,255,255,${a ? 0.85 : 0.28})`, transition:'width 0.3s' }} />
            ))}
          </div>
        </div>
      </div>

      {/* Right — form panel */}
      <div style={{
        width:440, flexShrink:0, background:'#fafaf8', borderLeft:'1px solid #e8e4de',
        display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
        padding:'48px 40px', position:'relative', overflow:'hidden',
      }}>
        <div style={{ position:'absolute', top:-60, right:-60, width:220, height:220, borderRadius:'50%', background:'#1e2d5a', opacity:0.04, pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-40, left:-40, width:160, height:160, borderRadius:'50%', background:'#b91c1c', opacity:0.03, pointerEvents:'none' }} />
        {FormContent}
      </div>
    </div>
  );
}

/* ─── Shared keyframe styles ──────────────────────────────────────────────── */
function Styles() {
  return (
    <style>{`
      @keyframes panelIn   { from{opacity:0;transform:translateX(-24px)} to{opacity:1;transform:translateX(0)} }
      @keyframes cardIn    { from{opacity:0;transform:translateY(20px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
      @keyframes shake     { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-10px)} 30%{transform:translateX(10px)} 45%{transform:translateX(-7px)} 60%{transform:translateX(7px)} 75%{transform:translateX(-3px)} 90%{transform:translateX(3px)} }
      @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
      @keyframes spin      { to{transform:rotate(360deg)} }
      @keyframes checkDraw { from{stroke-dashoffset:28} to{stroke-dashoffset:0} }
      @keyframes successPulse { 0%{box-shadow:0 0 0 0 rgba(21,128,61,0.3)} 70%{box-shadow:0 0 0 14px rgba(21,128,61,0)} 100%{box-shadow:0 0 0 0 rgba(21,128,61,0)} }
      * { box-sizing: border-box; }
    `}</style>
  );
}

/* ─── Root App ─────────────────────────────────────────────────────────────── */
export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('oc_auth') === '1');

  if (!splashDone) return <SplashScreen onDone={() => setSplashDone(true)} />;
  if (!authed)     return <LoginScreen onSuccess={() => setAuthed(true)} />;

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