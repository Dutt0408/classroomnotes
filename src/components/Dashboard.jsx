/* eslint-disable */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSessions } from '../hooks/useSession';

const fmt = (ts) => ts ? new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function Dashboard() {
  const { sessions, loading, createSession, deleteSession } = useSessions();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [joiningId, setJoiningId] = useState('');
  const [view, setView] = useState('grid');
  const navigate = useNavigate();

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    const id = await createSession(newName.trim());
    setCreating(false);
    setNewName('');
    navigate(`/session/${id}`);
  };

  const handleJoin = () => { if (joiningId.length === 3) navigate(`/view/${joiningId}`); };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', color: '#1a1a2e', fontFamily: "'Georgia', 'Times New Roman', serif" }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8e4de', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, background: '#2d2d5e', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" style={{ width: 22, height: 22, objectFit: 'contain' }} alt="Logo" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 17, color: '#1a1a2e', letterSpacing: '-0.3px' }}>Online Classroom</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['grid', '⊞ Grid'], ['list', '☰ List']].map(([v, label]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #ddd', background: view === v ? '#2d2d5e' : '#fff', color: view === v ? '#fff' : '#555', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: view === v ? 600 : 400 }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 40px 60px' }}>
        {/* Inspiration image */}
        <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 40, boxShadow: '0 4px 24px rgba(0,0,0,0.1)', border: '1px solid #e8e4de' }}>
          <img
            src="https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/61.jpeg?alt=media&token=2c242267-bebd-4735-9072-4511ed4e178c"
            alt="Inspiration"
            style={{ width: '100%', maxHeight: '480px', objectFit: 'cover', display: 'block' }}
          />
          <div style={{ position: 'absolute', bottom: 20, right: 24, color: '#fff', fontSize: 15, fontWeight: 400, letterSpacing: '0.5px', fontStyle: 'italic', textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>
            MahantSwami Maharaj vicharan in France 🇫🇷
          </div>
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>
          <div style={{ background: '#fff', border: '1px solid #e8e4de', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#2d2d5e', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: 'system-ui' }}>New Session</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' }}>Start Presenting</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'system-ui' }}>Upload slides, get a 3-digit ID, go live</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="Session name..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #d8d4ce', background: '#f8f7f4', color: '#1a1a2e', fontSize: 14, outline: 'none', fontFamily: 'system-ui' }} />
              <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#2d2d5e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: (!newName.trim() || creating) ? 0.5 : 1, fontFamily: 'system-ui' }}>{creating ? '...' : 'Create →'}</button>
            </div>
          </div>

          <div style={{ background: '#fff', border: '1px solid #e8e4de', borderRadius: 16, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0392b', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8, fontFamily: 'system-ui' }}>Join Session</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#1a1a2e' }}>Viewer Mode</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20, fontFamily: 'system-ui' }}>Enter 3-digit ID to annotate on iPad</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={joiningId} onChange={e => setJoiningId(e.target.value.replace(/\D/g, '').slice(0, 3))} onKeyDown={e => e.key === 'Enter' && handleJoin()} placeholder="___" maxLength={3} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #d8d4ce', background: '#f8f7f4', color: '#1a1a2e', fontSize: 24, fontWeight: 700, outline: 'none', textAlign: 'center', letterSpacing: 8, fontFamily: 'monospace' }} />
              <button onClick={handleJoin} disabled={joiningId.length !== 3} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#c0392b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: joiningId.length !== 3 ? 0.5 : 1, fontFamily: 'system-ui' }}>Join →</button>
            </div>
          </div>
        </div>

        {/* Archive */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a2e' }}>Archive</div>
          <div style={{ fontSize: 13, color: '#999', fontFamily: 'system-ui' }}>{sessions.length} sessions</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999', fontFamily: 'system-ui' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#aaa', background: '#fff', borderRadius: 16, border: '1px dashed #d8d4ce' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16, fontFamily: 'system-ui' }}>No sessions yet — create one above</div>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {sessions.map(s => <SessionCard key={s.id} session={s} onOpen={() => navigate(`/session/${s.id}`)} onDelete={() => deleteSession(s.id)} />)}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sessions.map(s => <SessionRow key={s.id} session={s} onOpen={() => navigate(`/session/${s.id}`)} onDelete={() => deleteSession(s.id)} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session, onOpen, onDelete }) {
  const colors = ['#2d2d5e', '#c0392b', '#16a085', '#d35400', '#2980b9'];
  const color = colors[parseInt(session.id) % colors.length];
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: '#fff', border: `1px solid ${hover ? color : '#e8e4de'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s, box-shadow 0.2s', boxShadow: hover ? `0 4px 16px ${color}22` : '0 2px 8px rgba(0,0,0,0.05)' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}>
      <div style={{ height: 5, background: color }} />
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 26, fontWeight: 900, color, lineHeight: 1, marginBottom: 8 }}>#{session.id}</div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4, color: '#1a1a2e' }}>{session.name}</div>
        <div style={{ fontSize: 12, color: '#999', fontFamily: 'system-ui' }}>{fmt(session.createdAt)}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <span style={{ background: '#f4f2ee', padding: '3px 8px', borderRadius: 4, fontSize: 12, color: '#666', fontFamily: 'system-ui' }}>🖼 {session.slideCount} slides</span>
          <span style={{ background: '#f4f2ee', padding: '3px 8px', borderRadius: 4, fontSize: 12, color: '#666', fontFamily: 'system-ui' }}>📍 Slide {session.currentSlide + 1}</span>
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session, onOpen, onDelete }) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e8e4de', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }} onClick={onOpen}>
      <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#2d2d5e', minWidth: 50 }}>#{session.id}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a2e' }}>{session.name}</div>
        <div style={{ fontSize: 12, color: '#999', fontFamily: 'system-ui' }}>{fmt(session.createdAt)}</div>
      </div>
      <div style={{ fontSize: 12, color: '#888', fontFamily: 'system-ui' }}>{session.slideCount} slides</div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}>✕</button>
    </div>
  );
}