import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { ref, onValue } from 'firebase/database';
import { db } from '../firebase';

export default function ViewerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, slides, annotations, loading, saveAnnotation } = useSession(id);
  const [localIdx, setLocalIdx] = useState(null);
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#ff6584');
  const [size, setSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('slides');
  const [notes, setNotes] = useState([]);
  const canvasRef = useRef();
  const imgRef = useRef();
  const lastPoint = useRef(null);
  const loadedAnn = useRef(null);

  const currentIdx = localIdx !== null ? localIdx : (session?.currentSlide || 0);
  const currentSlide = slides[currentIdx];

  useEffect(() => {
    if (!id) return;
    const unsub = onValue(ref(db, `sessions/${id}/notes`), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNotes(Object.entries(data).map(([k, v]) => ({ id: k, ...v })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
      } else { setNotes([]); }
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!canvasRef.current || !currentSlide) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const ann = annotations[currentSlide.id];
    if (ann?.dataUrl && ann.dataUrl !== loadedAnn.current) {
      loadedAnn.current = ann.dataUrl;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = ann.dataUrl;
    } else if (!ann) {
      loadedAnn.current = null;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, [currentIdx, annotations, currentSlide]);

  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - rect.left) * (canvas.width / rect.width), y: (src.clientY - rect.top) * (canvas.height / rect.height) };
  }, []);

  const startDraw = useCallback((e) => { e.preventDefault(); setDrawing(true); lastPoint.current = getPos(e, canvasRef.current); }, [getPos]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing || !lastPoint.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);
    if (tool === 'eraser') { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,1)'; ctx.lineWidth = size * 6; }
    else if (tool === 'highlight') { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color + '55'; ctx.lineWidth = size * 8; }
    else { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = color; ctx.lineWidth = size; }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke();
    lastPoint.current = pos;
  }, [drawing, tool, color, size, getPos]);

  const endDraw = useCallback(async (e) => {
    if (e) e.preventDefault();
    if (!drawing) return;
    setDrawing(false); lastPoint.current = null;
    if (canvasRef.current && currentSlide) {
      await saveAnnotation(currentSlide.id, canvasRef.current.toDataURL('image/png'));
      setSaved(true); setTimeout(() => setSaved(false), 1500);
    }
  }, [drawing, currentSlide, saveAnnotation]);

  const clearCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    canvasRef.current.getContext('2d').clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (currentSlide) await saveAnnotation(currentSlide.id, '');
  }, [currentSlide, saveAnnotation]);

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'monospace' }}>Connecting to #{id}...</div>;

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f0f0f0', fontFamily: 'system-ui', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Session #{id} not found</div>
      <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6c63ff', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
    </div>
  );

  const COLORS = ['#ff6584', '#6c63ff', '#43c6ac', '#f7971e', '#ffffff', '#ffff88'];
  const textNotes = notes.filter(n => n.type === 'text');
  const imageNotes = notes.filter(n => n.type === 'image');

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Top bar */}
      <div style={{ height: 52, background: '#0d0d1a', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 22 }}>←</button>
        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#ff6584', fontSize: 18 }}>#{id}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{session.name}</div>
        {saved && <div style={{ fontSize: 12, color: '#43c6ac', fontWeight: 600 }}>✓ Saved</div>}
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['slides','🖥 Slides'], ['notes','📌 Notes']].map(([t, label]) => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: activeTab === t ? '#6c63ff' : '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: activeTab === t ? 700 : 400 }}>{label}</button>
          ))}
        </div>
        <button onClick={() => setLocalIdx(null)} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: localIdx === null ? '#43c6ac22' : '#1e1e2e', color: localIdx === null ? '#43c6ac' : '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, border: localIdx === null ? '1px solid #43c6ac44' : '1px solid transparent' }}>
          {localIdx === null ? '● Live' : 'Follow'}
        </button>
      </div>

      {/* Slides tab */}
      {activeTab === 'slides' && (
        <>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, overflow: 'hidden' }}>
            {currentSlide ? (
              <div style={{ position: 'relative', maxWidth: '100%', maxHeight: 'calc(100vh - 180px)', aspectRatio: '16/9' }}>
                <img ref={imgRef} src={currentSlide.url} alt={`Slide ${currentIdx + 1}`}
                  onLoad={() => { if (canvasRef.current && imgRef.current) { canvasRef.current.width = imgRef.current.naturalWidth || 1280; canvasRef.current.height = imgRef.current.naturalHeight || 720; } }}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: 8, pointerEvents: 'none' }} />
                <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 8, touchAction: 'none' }}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
                  onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#555' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
                <div>Waiting for presenter to upload slides...</div>
              </div>
            )}
          </div>

          <div style={{ background: '#0d0d1a', borderTop: '1px solid #1e1e2e', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['pen', '✏️'], ['highlight', '🖊'], ['eraser', '⬜']].map(([t, icon]) => (
                <button key={t} onClick={() => setTool(t)} style={{ width: 38, height: 38, borderRadius: 8, border: 'none', background: tool === t ? '#6c63ff' : '#1e1e2e', cursor: 'pointer', fontSize: 16 }}>{icon}</button>
              ))}
              <button onClick={clearCanvas} style={{ width: 38, height: 38, borderRadius: 8, border: 'none', background: '#1e1e2e', cursor: 'pointer', fontSize: 16 }}>🗑</button>
            </div>
            <div style={{ width: 1, height: 30, background: '#2d2d4e' }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => { setColor(c); if (tool === 'eraser') setTool('pen'); }} style={{ width: 26, height: 26, borderRadius: '50%', border: color === c ? '3px solid #6c63ff' : '2px solid #333', background: c, cursor: 'pointer' }} />
              ))}
            </div>
            <div style={{ width: 1, height: 30, background: '#2d2d4e' }} />
            <input type="range" min={1} max={12} value={size} onChange={e => setSize(+e.target.value)} style={{ width: 80, accentColor: '#6c63ff' }} />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => setLocalIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #2d2d4e', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: currentIdx === 0 ? 0.3 : 1 }}>‹</button>
              <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#888', minWidth: 50, textAlign: 'center' }}>{currentIdx + 1}/{slides.length}</span>
              <button onClick={() => setLocalIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx >= slides.length - 1} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid #2d2d4e', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: currentIdx >= slides.length - 1 ? 0.3 : 1 }}>›</button>
            </div>
          </div>
        </>
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {textNotes.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6c63ff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📌 Points to Remember</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {textNotes.map((n, i) => (
                  <div key={n.id} style={{ background: '#111', border: '1px solid #1e1e2e', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#6c63ff22', border: '1px solid #6c63ff44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#6c63ff', flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 14, lineHeight: 1.5, color: '#e0e0e0' }}>{n.content}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {imageNotes.length > 0 && (
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#ff6584', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🖼 Note Images</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
                {imageNotes.map(n => (
                  <div key={n.id} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1e1e2e' }}>
                    <img src={n.url} alt={n.name} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />
                    <div style={{ padding: '4px 8px', fontSize: 10, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {notes.length === 0 && (
            <div style={{ textAlign: 'center', color: '#555', paddingTop: 60 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <div>No notes yet — presenter will add them</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
