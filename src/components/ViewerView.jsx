/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { ref, set, get, serverTimestamp } from 'firebase/database';
import { db } from '../firebase';

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
      </div>

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