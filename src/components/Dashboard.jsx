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
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif' }}>
    {/* Header */}
    <div style={{ borderBottom: '1px solid #1e1e2e', padding: '0 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <img src="/logo.png" style={{ width: 32, height: 32, objectFit: 'contain' }} alt="Logo" />
        <span style={{ fontWeight: 700, fontSize: 18 }}>Online Classroom</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setView('grid')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: view === 'grid' ? '#6c63ff' : '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: 13 }}>⊞ Grid</button>
        <button onClick={() => setView('list')} style={{ padding: '6px 12px', borderRadius: 6, border: 'none', background: view === 'list' ? '#6c63ff' : '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: 13 }}>☰ List</button>
      </div>
    </div>

    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 40px 40px 40px' }}>
  
  {/* Inspiration Image with Aesthetic Overlay */}
  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', marginBottom: 32, border: '1px solid #1e1e2e' }}>
    <img 
      src="https://firebasestorage.googleapis.com/v0/b/french-d9d47.firebasestorage.app/o/61.jpeg?alt=media&token=2c242267-bebd-4735-9072-4511ed4e178c" 
      alt="Inspiration" 
      style={{ 
        width: '100%', 
        maxHeight: '720px', 
        objectFit: 'cover',
        display: 'block'
      }}
    />
    <div style={{
      position: 'absolute',
      bottom: '20px',
      right: '25px',
      color: '#ffffff',
      fontSize: '18px',
      fontWeight: '300',
      letterSpacing: '1px',
      fontStyle: 'italic',
      textShadow: '0px 2px 10px rgba(0,0,0,0.5)',
      pointerEvents: 'none'
    }}>
      MahantSwami Maharaj vicharan in France 🇫🇷
    </div>
  </div>
  </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 40 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 48 }}>
          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #2d2d4e', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>New Session</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Start Presenting</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Upload slides, get a 3-digit ID, go live</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreate()} placeholder="Session name..." style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #2d2d4e', background: '#0d0d1a', color: '#f0f0f0', fontSize: 14, outline: 'none' }} />
              <button onClick={handleCreate} disabled={creating || !newName.trim()} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#6c63ff', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: (!newName.trim() || creating) ? 0.5 : 1 }}>{creating ? '...' : 'Create →'}</button>
            </div>
          </div>

          <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #16213e)', border: '1px solid #2d2d4e', borderRadius: 16, padding: 28 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#ff6584', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Join Session</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Viewer Mode</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Enter 3-digit ID to annotate on iPad</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input value={joiningId} onChange={e => setJoiningId(e.target.value.replace(/\D/g, '').slice(0, 3))} onKeyDown={e => e.key === 'Enter' && handleJoin()} placeholder="___" maxLength={3} style={{ flex: 1, padding: '10px 14px', borderRadius: 8, border: '1px solid #2d2d4e', background: '#0d0d1a', color: '#f0f0f0', fontSize: 24, fontWeight: 700, outline: 'none', textAlign: 'center', letterSpacing: 8 }} />
              <button onClick={handleJoin} disabled={joiningId.length !== 3} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: '#ff6584', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 14, opacity: joiningId.length !== 3 ? 0.5 : 1 }}>Join →</button>
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>Archive</div>
          <div style={{ fontSize: 13, color: '#666' }}>{sessions.length} sessions</div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>Loading...</div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666', background: '#111', borderRadius: 16, border: '1px dashed #2d2d4e' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
            <div style={{ fontSize: 16 }}>No sessions yet — create one above</div>
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
  const colors = ['#6c63ff', '#ff6584', '#43c6ac', '#f7971e', '#4facfe'];
  const color = colors[parseInt(session.id) % colors.length];
  const [hover, setHover] = useState(false);
  return (
    <div style={{ background: '#111', border: `1px solid ${hover ? color : '#1e1e2e'}`, borderRadius: 14, overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onOpen}>
      <div style={{ height: 6, background: color }} />
      <div style={{ padding: '18px 18px 14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontFamily: 'monospace', fontSize: 28, fontWeight: 900, color, lineHeight: 1, marginBottom: 8 }}>#{session.id}</div>
          <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 16, padding: 4 }}>✕</button>
        </div>
        <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{session.name}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{fmt(session.createdAt)}</div>
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <span style={{ background: '#1e1e2e', padding: '3px 8px', borderRadius: 4, fontSize: 12, color: '#aaa' }}>🖼 {session.slideCount} slides</span>
          <span style={{ background: '#1e1e2e', padding: '3px 8px', borderRadius: 4, fontSize: 12, color: '#aaa' }}>📍 Slide {session.currentSlide + 1}</span>
        </div>
      </div>
    </div>
  );
}

function SessionRow({ session, onOpen, onDelete }) {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e2e', borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer' }} onClick={onOpen}>
      <div style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#6c63ff', minWidth: 50 }}>#{session.id}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{session.name}</div>
        <div style={{ fontSize: 12, color: '#666' }}>{fmt(session.createdAt)}</div>
      </div>
      <div style={{ fontSize: 12, color: '#888' }}>{session.slideCount} slides</div>
      <button onClick={e => { e.stopPropagation(); onDelete(); }} style={{ background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: 14, padding: '4px 8px' }}>✕</button>
    </div>
  );
}
