/* eslint-disable */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';

export default function ViewerView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, slides, annotations, loading, saveAnnotation } = useSession(id);
  const [localIdx, setLocalIdx] = useState(null); // null = follow presenter
  const [tool, setTool] = useState('pen'); // pen | highlight | eraser
  const [color, setColor] = useState('#ff6584');
  const [size, setSize] = useState(3);
  const [drawing, setDrawing] = useState(false);
  const [saved, setSaved] = useState(false);
  const canvasRef = useRef();
  const imgRef = useRef();
  const lastPoint = useRef(null);
  const prevAnnotation = useRef(null);

  const currentIdx = localIdx !== null ? localIdx : (session?.currentSlide || 0);
  const currentSlide = slides[currentIdx];
  const annotation = currentSlide ? annotations[currentSlide.id] : null;

  // Load annotation onto canvas when slide changes
  useEffect(() => {
    if (!canvasRef.current || !currentSlide) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const drawAnnotation = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const annKey = currentSlide.id;
      const ann = annotations[annKey];
      if (ann?.dataUrl && ann.dataUrl !== prevAnnotation.current) {
        prevAnnotation.current = ann.dataUrl;
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        img.src = ann.dataUrl;
      } else if (!ann) {
        prevAnnotation.current = null;
      }
    };

    drawAnnotation();
  }, [currentIdx, currentSlide, annotations]);

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
    setDrawing(true);
    const pos = getPos(e, canvasRef.current);
    lastPoint.current = pos;
  }, [getPos]);

  const draw = useCallback((e) => {
    e.preventDefault();
    if (!drawing || !canvasRef.current || !lastPoint.current) return;
    // eslint-disable-next-line
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getPos(e, canvas);

    ctx.beginPath();
    ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
    ctx.lineTo(pos.x, pos.y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
      ctx.lineWidth = size * 6;
    } else if (tool === 'highlight') {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color + '66';
      ctx.lineWidth = size * 8;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    lastPoint.current = pos;
  }, [drawing, tool, color, size, getPos]);

  const endDraw = useCallback(async (e) => {
    e?.preventDefault();
    if (!drawing) return;
    setDrawing(false);
    lastPoint.current = null;
    // Save to Firebase
    if (canvasRef.current && currentSlide) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      await saveAnnotation(currentSlide.id, dataUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  }, [drawing, currentSlide, saveAnnotation]);

  const clearCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    if (currentSlide) await saveAnnotation(currentSlide.id, '');
  }, [currentSlide, saveAnnotation]);

  const onImgLoad = () => {
    if (!canvasRef.current || !imgRef.current) return;
    const img = imgRef.current;
    canvasRef.current.width = img.naturalWidth || img.offsetWidth;
    canvasRef.current.height = img.naturalHeight || img.offsetHeight;
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', fontFamily: 'monospace' }}>Connecting to session #{id}...</div>;

  if (!session) return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#f0f0f0', fontFamily: "'DM Sans', sans-serif", gap: 12 }}>
      <div style={{ fontSize: 48 }}>🔍</div>
      <div style={{ fontSize: 20, fontWeight: 700 }}>Session #{id} not found</div>
      <div style={{ fontSize: 14, color: '#888' }}>Check the session ID and try again</div>
      <button onClick={() => navigate('/')} style={{ marginTop: 16, padding: '10px 24px', borderRadius: 8, border: 'none', background: '#6c63ff', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
    </div>
  );

  const colors = ['#ff6584', '#6c63ff', '#43c6ac', '#f7971e', '#fff', '#f8f8a0'];
  const isFollowing = localIdx === null;

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0f', color: '#f0f0f0', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column', userSelect: 'none' }}>
      {/* Top bar */}
      <div style={{ height: 52, background: '#0d0d1a', borderBottom: '1px solid #1e1e2e', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 12, flexShrink: 0 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, padding: 2 }}>←</button>
        <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#ff6584', fontSize: 18 }}>#{id}</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{session.name}</div>
        {saved && <div style={{ marginLeft: 4, fontSize: 12, color: '#43c6ac', fontWeight: 600 }}>✓ Saved</div>}
        <div style={{ flex: 1 }} />
        <button onClick={() => setLocalIdx(null)} style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: isFollowing ? '#6c63ff' : '#1e1e2e', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: isFollowing ? 700 : 400 }}>
          {isFollowing ? '● Following' : 'Follow'}
        </button>
      </div>

      {/* Main canvas area */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: 12 }}>
        {currentSlide ? (
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: 'calc(100vh - 180px)', aspectRatio: '16/9' }}>
            <img ref={imgRef} src={currentSlide.url} alt={`Slide ${currentIdx + 1}`} onLoad={onImgLoad}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', borderRadius: 8, pointerEvents: 'none' }} />
            <canvas ref={canvasRef}
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: 8, touchAction: 'none', cursor: tool === 'eraser' ? 'crosshair' : 'default' }}
              onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
              onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#555' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
            <div>Waiting for presenter to upload slides...</div>
          </div>
        )}
      </div>

      {/* Bottom toolbar */}
      <div style={{ background: '#0d0d1a', borderTop: '1px solid #1e1e2e', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, overflowX: 'auto' }}>
        {/* Tools */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['pen', '✏️'], ['highlight', '🖊'], ['eraser', '⬜']].map(([t, icon]) => (
            <button key={t} onClick={() => setTool(t)} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: tool === t ? '#6c63ff' : '#1e1e2e', cursor: 'pointer', fontSize: 16 }}>{icon}</button>
          ))}
          <button onClick={clearCanvas} style={{ width: 36, height: 36, borderRadius: 8, border: 'none', background: '#1e1e2e', cursor: 'pointer', fontSize: 16 }} title="Clear all">🗑</button>
        </div>

        <div style={{ width: 1, height: 30, background: '#2d2d4e' }} />

        {/* Colors */}
        <div style={{ display: 'flex', gap: 6 }}>
          {colors.map(c => (
            <button key={c} onClick={() => { setColor(c); setTool(t => t === 'eraser' ? 'pen' : t); }}
              style={{ width: 26, height: 26, borderRadius: '50%', border: color === c ? '3px solid #6c63ff' : '2px solid transparent', background: c, cursor: 'pointer', flexShrink: 0 }} />
          ))}
        </div>

        <div style={{ width: 1, height: 30, background: '#2d2d4e' }} />

        {/* Size */}
        <input type="range" min={1} max={12} value={size} onChange={e => setSize(+e.target.value)} style={{ width: 70, accentColor: '#6c63ff' }} />

        <div style={{ flex: 1 }} />

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setLocalIdx(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #2d2d4e', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: currentIdx === 0 ? 0.3 : 1 }}>‹</button>
          <span style={{ fontFamily: 'monospace', fontSize: 13, color: '#888', minWidth: 50, textAlign: 'center' }}>{currentIdx + 1}/{slides.length}</span>
          <button onClick={() => setLocalIdx(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx >= slides.length - 1} style={{ width: 34, height: 34, borderRadius: '50%', border: '1px solid #2d2d4e', background: '#111', color: '#fff', cursor: 'pointer', fontSize: 16, opacity: currentIdx >= slides.length - 1 ? 0.3 : 1 }}>›</button>
        </div>
      </div>
    </div>
  );
}