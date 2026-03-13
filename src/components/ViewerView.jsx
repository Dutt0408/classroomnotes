/* eslint-disable */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { ref, set, get, onValue } from 'firebase/database';
import { db } from '../firebase';

// Extract YouTube video ID from any YouTube URL format
function getYouTubeId(url) {
  if (!url) return null;
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

/**
 * ViewerView — PDF-editor style
 * 
 * Each slide is shown as a "page" with:
 *   1. Annotation canvas overlaid on top of the slide image (draw/highlight/erase)
 *   2. A lined notes area below the slide for typed notes
 *   3. Toolbar is ALWAYS visible at the top (sticky) — it does NOT re-mount or reset
 *
 * Navigation: arrows + follow-presenter mode.
 * All annotations and notes are saved per-slide to Firebase.
 */
export default function ViewerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, slides, annotations, loading, saveAnnotation } = useSession(id);

  const [localIdx, setLocalIdx] = useState(null); // null = follow presenter
  const [tool, setTool] = useState('pen');
  const [color, setColor] = useState('#c0392b');
  const [size, setSize] = useState(3);
  const [saved, setSaved] = useState(false);
  const [slideNotes, setSlideNotes] = useState({}); // { slideId: text }
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [showYoutubePlayer, setShowYoutubePlayer] = useState(false);
  const [ytPanelHeight, setYtPanelHeight] = useState(300);

  // Canvas ref is stable — we manage drawing state via refs to avoid re-renders erasing the canvas
  const canvasRef = useRef();
  const imgRef = useRef();
  const drawing = useRef(false);
  const lastPoint = useRef(null);
  const toolRef = useRef(tool);
  const colorRef = useRef(color);
  const sizeRef = useRef(size);

  // Keep tool refs in sync with state (so event handlers always use latest values)
  useEffect(() => { toolRef.current = tool; }, [tool]);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { sizeRef.current = size; }, [size]);

  const currentIdx = localIdx !== null ? localIdx : (session?.currentSlide || 0);
  const currentSlide = slides[currentIdx];

  // ─── Load annotation onto canvas when slide changes ───────────────────────
  useEffect(() => {
    if (!canvasRef.current || !currentSlide) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ann = annotations[currentSlide.id];
    if (ann?.dataUrl) {
      const img = new Image();
      img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      img.src = ann.dataUrl;
    }
  }, [currentIdx, currentSlide?.id, annotations]);

  // ─── Load + live-sync YouTube URL from Firebase ───────────────────────────
  useEffect(() => {
    if (!id) return;
    const unsub = onValue(ref(db, `sessions/${id}/youtubeUrl`), (snap) => {
      const url = snap.exists() ? snap.val() : '';
      setYoutubeUrl(url || '');
      if (url && getYouTubeId(url)) setShowYoutubePlayer(true);
    });
    return () => unsub();
  }, [id]);

  // ─── Load notes for current slide ─────────────────────────────────────────
  useEffect(() => {
    if (!currentSlide) return;
    const fetchNote = async () => {
      const snap = await get(ref(db, `sessions/${id}/slideNotes/${currentSlide.id}`));
      if (snap.exists()) {
        setSlideNotes(prev => ({ ...prev, [currentSlide.id]: snap.val().text || '' }));
      }
    };
    fetchNote();
  }, [currentSlide?.id, id]);

  // ─── Save typed note ───────────────────────────────────────────────────────
  const saveNote = useCallback(async (slideId, text) => {
    await set(ref(db, `sessions/${id}/slideNotes/${slideId}`), { text, updatedAt: Date.now() });
  }, [id]);

  const handleNoteChange = useCallback((e) => {
    if (!currentSlide) return;
    const text = e.target.value;
    setSlideNotes(prev => ({ ...prev, [currentSlide.id]: text }));
    saveNote(currentSlide.id, text);
  }, [currentSlide?.id, saveNote]);

  // ─── Canvas sizing ─────────────────────────────────────────────────────────
  const onImgLoad = useCallback(() => {
    if (!canvasRef.current || !imgRef.current) return;
    const img = imgRef.current;
    canvasRef.current.width = img.naturalWidth || img.offsetWidth;
    canvasRef.current.height = img.naturalHeight || img.offsetHeight;

    // Re-draw any existing annotation at new size
    const ann = annotations[currentSlide?.id];
    if (ann?.dataUrl) {
      const ctx = canvasRef.current.getContext('2d');
      const annotImg = new Image();
      annotImg.onload = () => ctx.drawImage(annotImg, 0, 0, canvasRef.current.width, canvasRef.current.height);
      annotImg.src = ann.dataUrl;
    }
  }, [annotations, currentSlide?.id]);

  // ─── Drawing helpers ───────────────────────────────────────────────────────
  const getPos = useCallback((e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDraw = useCallback((e) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    drawing.current = true;
    lastPoint.current = getPos(e, canvasRef.current);
  }, [getPos]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing.current || !canvasRef.current || !lastPoint.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (toolRef.current === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = sizeRef.current * 6;
    } else if (toolRef.current === 'highlight') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorRef.current + '55';
      ctx.lineWidth = sizeRef.current * 8;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = colorRef.current;
      ctx.lineWidth = sizeRef.current;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPoint.current = pos;
  }, [getPos]);

  const endDraw = useCallback(async (e) => {
    e?.preventDefault();
    if (!drawing.current) return;
    drawing.current = false;
    lastPoint.current = null;
    if (canvasRef.current && currentSlide) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await saveAnnotation(currentSlide.id, dataUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }, [currentSlide, saveAnnotation]);

  const clearCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (currentSlide) await saveAnnotation(currentSlide.id, '');
  }, [currentSlide, saveAnnotation]);

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontFamily: 'system-ui' }}>
      Connecting to session #{id}...
    </div>
  );

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#1a1a2e', fontFamily: 'system-ui', gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Session #{id} not found</div>
      <div style={{ fontSize: 14, color: '#888' }}>Check the session ID and try again</div>
      <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#2d2d5e', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
    </div>
  );

  const colors = ['#c0392b', '#2d2d5e', '#16a085', '#d35400', '#1a1a1a', '#f39c12'];
  const isFollowing = localIdx === null;
  const currentNote = currentSlide ? (slideNotes[currentSlide.id] ?? '') : '';

  const toolCursor = tool === 'eraser' ? 'cell' : tool === 'highlight' ? 'crosshair' : 'default';

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', color: '#1a1a2e', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>

      {/* ── STICKY TOOLBAR ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: '#fff',
        borderBottom: '1px solid #e8e4de',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        padding: '0 14px',
        display: 'flex', alignItems: 'center', gap: 10,
        flexWrap: 'wrap',
        minHeight: 54,
        userSelect: 'none',
      }}>
        {/* Back + session info */}
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, padding: '0 4px 0 0' }}>←</button>
        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#c0392b', fontSize: 17 }}>#{id}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a2e' }}>{session.name}</div>
        {saved && <div style={{ fontSize: 12, color: '#16a085', fontWeight: 700 }}>✓ Saved</div>}

        <div style={{ flex: 1 }} />

        {/* Drawing tools */}
        <div style={{ display: 'flex', gap: 4 }}>
          {[['pen', '✏️', 'Pen'], ['highlight', '🖊', 'Highlight'], ['eraser', '⬜', 'Eraser']].map(([t, icon, label]) => (
            <button key={t} onClick={() => setTool(t)} title={label} style={{
              height: 34, padding: '0 10px', borderRadius: 7,
              border: tool === t ? '2px solid #2d2d5e' : '1px solid #ddd',
              background: tool === t ? '#ede9ff' : '#fff',
              cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', gap: 4,
              fontWeight: tool === t ? 700 : 400, color: '#333'
            }}>
              <span>{icon}</span>
              <span style={{ fontSize: 11 }}>{label}</span>
            </button>
          ))}
          <button onClick={clearCanvas} title="Clear annotations" style={{ height: 34, padding: '0 10px', borderRadius: 7, border: '1px solid #ddd', background: '#fff', cursor: 'pointer', fontSize: 15 }}>🗑</button>
        </div>

        <div style={{ width: 1, height: 28, background: '#e8e4de', margin: '0 4px' }} />

        {/* Color swatches */}
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {colors.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool(t => t === 'eraser' ? 'pen' : t); }}
              style={{ width: 24, height: 24, borderRadius: '50%', border: color === c ? '3px solid #2d2d5e' : '2px solid #ddd', background: c, cursor: 'pointer', flexShrink: 0, transition: 'border 0.15s' }} />
          ))}
        </div>

        <div style={{ width: 1, height: 28, background: '#e8e4de', margin: '0 4px' }} />

        {/* Size slider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, color: '#888' }}>Size</span>
          <input type="range" min={1} max={14} value={size} onChange={e => setSize(+e.target.value)} style={{ width: 72, accentColor: '#2d2d5e' }} />
          <span style={{ fontSize: 11, color: '#888', minWidth: 18 }}>{size}</span>
        </div>

        <div style={{ width: 1, height: 28, background: '#e8e4de', margin: '0 4px' }} />

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={() => setLocalIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #d8d4ce', background: '#fff', color: '#333', cursor: 'pointer', fontSize: 16, opacity: currentIdx === 0 ? 0.3 : 1 }}>‹</button>
          <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#888', minWidth: 46, textAlign: 'center' }}>{currentIdx + 1}/{slides.length}</span>
          <button onClick={() => setLocalIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx >= slides.length - 1}
            style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid #d8d4ce', background: '#fff', color: '#333', cursor: 'pointer', fontSize: 16, opacity: currentIdx >= slides.length - 1 ? 0.3 : 1 }}>›</button>
        </div>

        {/* Follow mode */}
        <button onClick={() => setLocalIdx(null)} style={{
          padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd',
          background: isFollowing ? '#2d2d5e' : '#fff',
          color: isFollowing ? '#fff' : '#555',
          cursor: 'pointer', fontSize: 12, fontWeight: isFollowing ? 700 : 400
        }}>
          {isFollowing ? '● Following' : 'Follow'}
        </button>

        {/* YouTube toggle — only show if there's a live stream set */}
        {getYouTubeId(youtubeUrl) && (
          <button onClick={() => setShowYoutubePlayer(v => !v)} style={{
            padding: '6px 12px', borderRadius: 6, border: '1px solid #ddd',
            background: showYoutubePlayer ? '#ff0000' : '#fff',
            color: showYoutubePlayer ? '#fff' : '#c00',
            cursor: 'pointer', fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            {showYoutubePlayer ? (
              <><span>▼</span><span>Hide Stream</span></>
            ) : (
              <><span>▶</span><span>Watch Live</span><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff0000', display: 'inline-block', boxShadow: '0 0 5px #ff0000' }} /></>
            )}
          </button>
        )}
      </div>

      {/* ── FLOATING DRAGGABLE YOUTUBE PLAYER ── */}
      {getYouTubeId(youtubeUrl) && showYoutubePlayer && (
        <DraggableYouTubePlayer
          videoId={getYouTubeId(youtubeUrl)}
          url={youtubeUrl}
          onClose={() => setShowYoutubePlayer(false)}
        />
      )}

      {/* ── MAIN SCROLLABLE CONTENT ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 0 60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {currentSlide ? (
          <div style={{ width: '100%', maxWidth: 900, padding: '0 20px' }}>

            {/* ── SLIDE LABEL ── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, color: '#2d2d5e', background: '#ede9ff', border: '1px solid #c9c3f0', borderRadius: 6, padding: '3px 10px' }}>
                Slide {currentIdx + 1}
              </div>
              <div style={{ flex: 1, height: 1, background: '#e8e4de' }} />
            </div>

            {/* ── SLIDE + CANVAS (PDF-editor image area) ── */}
            <div style={{
              position: 'relative',
              width: '100%',
              borderRadius: 12,
              overflow: 'hidden',
              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
              border: '1px solid #d8d4ce',
              background: '#fff',
              lineHeight: 0,
            }}>
              <img
                ref={imgRef}
                src={currentSlide.url}
                alt={`Slide ${currentIdx + 1}`}
                onLoad={onImgLoad}
                style={{ width: '100%', display: 'block', borderRadius: 0 }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  touchAction: 'none',
                  cursor: toolCursor,
                  borderRadius: 0,
                }}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={endDraw}
                onMouseLeave={endDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={endDraw}
              />
            </div>

            {/* ── NOTES SECTION BELOW SLIDE ── */}
            <div style={{
              marginTop: 0,
              background: '#fff',
              border: '1px solid #d8d4ce',
              borderTop: '2px solid #e8e4de',
              borderRadius: '0 0 12px 12px',
              padding: '0 0 0 0',
              overflow: 'hidden',
            }}>
              {/* Notes header */}
              <div style={{
                padding: '10px 20px',
                borderBottom: '1px solid #ede9e4',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#fdfcfa',
              }}>
                <span style={{ fontSize: 14 }}>📝</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#555', fontFamily: 'system-ui' }}>Notes for Slide {currentIdx + 1}</span>
                <span style={{ fontSize: 11, color: '#bbb', marginLeft: 'auto', fontFamily: 'system-ui' }}>Auto-saved</span>
              </div>

              {/* Lined notes textarea — styled like lined paper */}
              <div style={{
                position: 'relative',
                background: `
                  repeating-linear-gradient(
                    transparent,
                    transparent 31px,
                    #e8e4de 31px,
                    #e8e4de 32px
                  )
                `,
                backgroundPositionY: '40px',
              }}>
                {/* Red margin line */}
                <div style={{
                  position: 'absolute',
                  left: 56,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: '#f5c6c6',
                  pointerEvents: 'none',
                }} />
                <textarea
                  value={currentNote}
                  onChange={handleNoteChange}
                  placeholder="Write your notes here... (auto-saved)"
                  style={{
                    width: '100%',
                    minHeight: 200,
                    padding: '12px 20px 20px 72px',
                    border: 'none',
                    outline: 'none',
                    resize: 'vertical',
                    background: 'transparent',
                    fontFamily: "'Georgia', serif",
                    fontSize: 15,
                    lineHeight: '32px',
                    color: '#1a1a2e',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#aaa', paddingTop: 100, fontFamily: 'system-ui' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⏳</div>
            <div style={{ fontSize: 16 }}>Waiting for presenter to upload slides...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Draggable floating YouTube player ────────────────────────────────────────
function DraggableYouTubePlayer({ videoId, url, onClose }) {
  const [pos, setPos] = React.useState({ x: window.innerWidth - 460, y: 80 });
  const [size, setSize] = React.useState({ w: 440, h: 260 });
  const [minimized, setMinimized] = React.useState(false);
  const dragging = React.useRef(false);
  const resizingRef = React.useRef(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const resizeStart = React.useRef({ x: 0, y: 0, w: 0, h: 0 });

  // Drag
  const onDragStart = (e) => {
    e.preventDefault();
    dragging.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragOffset.current = { x: clientX - pos.x, y: clientY - pos.y };
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup', onDragEnd);
    window.addEventListener('touchmove', onDragMove, { passive: false });
    window.addEventListener('touchend', onDragEnd);
  };
  const onDragMove = (e) => {
    if (!dragging.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.max(0, Math.min(window.innerWidth - size.w, clientX - dragOffset.current.x));
    const y = Math.max(0, Math.min(window.innerHeight - 40, clientY - dragOffset.current.y));
    setPos({ x, y });
  };
  const onDragEnd = () => {
    dragging.current = false;
    window.removeEventListener('mousemove', onDragMove);
    window.removeEventListener('mouseup', onDragEnd);
    window.removeEventListener('touchmove', onDragMove);
    window.removeEventListener('touchend', onDragEnd);
  };

  // Resize from bottom-right corner
  const onResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    resizeStart.current = { x: clientX, y: clientY, w: size.w, h: size.h };
    window.addEventListener('mousemove', onResizeMove);
    window.addEventListener('mouseup', onResizeEnd);
    window.addEventListener('touchmove', onResizeMove, { passive: false });
    window.addEventListener('touchend', onResizeEnd);
  };
  const onResizeMove = (e) => {
    if (!resizingRef.current) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const w = Math.max(280, resizeStart.current.w + (clientX - resizeStart.current.x));
    const h = Math.max(160, resizeStart.current.h + (clientY - resizeStart.current.y));
    setSize({ w, h });
  };
  const onResizeEnd = () => {
    resizingRef.current = false;
    window.removeEventListener('mousemove', onResizeMove);
    window.removeEventListener('mouseup', onResizeEnd);
    window.removeEventListener('touchmove', onResizeMove);
    window.removeEventListener('touchend', onResizeEnd);
  };

  const sizes = [
    { label: 'S', w: 320, h: 190 },
    { label: 'M', w: 440, h: 260 },
    { label: 'L', w: 640, h: 380 },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        left: pos.x, top: pos.y,
        width: size.w,
        zIndex: 9999,
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 12px 48px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        border: '1px solid #1e1e1e',
        background: '#111',
        userSelect: 'none',
      }}
    >
      {/* Title bar — drag handle */}
      <div
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        style={{
          height: 36,
          background: 'linear-gradient(90deg, #1a0000, #1e1e1e)',
          borderBottom: '1px solid #2a2a2a',
          display: 'flex', alignItems: 'center', padding: '0 10px', gap: 8,
          cursor: 'grab',
          flexShrink: 0,
        }}
      >
        {/* Drag grip */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.4, marginRight: 2 }}>
          {[0,1,2].map(i => <div key={i} style={{ display: 'flex', gap: 2 }}>{[0,1].map(j => <div key={j} style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#fff' }} />)}</div>)}
        </div>

        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0000', display: 'inline-block', boxShadow: '0 0 8px #ff0000', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#ff4444', fontWeight: 700, fontFamily: 'system-ui', letterSpacing: 0.5 }}>LIVE STREAM</span>
        <span style={{ fontSize: 10, color: '#555', fontFamily: 'system-ui', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>

        {/* Size presets */}
        <div style={{ display: 'flex', gap: 3 }}>
          {sizes.map(s => (
            <button key={s.label} onMouseDown={e => e.stopPropagation()} onClick={() => setSize({ w: s.w, h: s.h })}
              style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: size.w === s.w ? '#444' : 'transparent', color: size.w === s.w ? '#fff' : '#555', cursor: 'pointer', fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.label}</button>
          ))}
        </div>

        <a href={url} target="_blank" rel="noreferrer" onMouseDown={e => e.stopPropagation()}
          style={{ fontSize: 10, color: '#666', fontFamily: 'system-ui', textDecoration: 'none', padding: '2px 7px', border: '1px solid #333', borderRadius: 4 }}>↗</a>

        <button onMouseDown={e => e.stopPropagation()} onClick={() => setMinimized(v => !v)}
          style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>{minimized ? '▲' : '▼'}</button>
        <button onMouseDown={e => e.stopPropagation()} onClick={onClose}
          style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      {/* Player */}
      {!minimized && (
        <div style={{ position: 'relative', height: size.h, background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
            title="YouTube Live Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
          {/* Resize handle */}
          <div
            onMouseDown={onResizeStart}
            onTouchStart={onResizeStart}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 18, height: 18,
              cursor: 'nwse-resize',
              display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-end',
              padding: 3,
            }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M9 1L1 9M9 5L5 9M9 9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}