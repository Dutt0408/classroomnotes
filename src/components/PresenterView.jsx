/* eslint-disable */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { ref, push, remove, onValue, set, get } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

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

export default function PresenterView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, slides, annotations, loading, uploadSlide, setCurrentSlide, deleteSlide } = useSession(id);
  const [view, setView] = useState('ppt');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [showYoutubeBar, setShowYoutubeBar] = useState(false);
  const [ytPanelHeight, setYtPanelHeight] = useState(320);
  const fileInputRef = useRef();
  const currentIdx = session?.currentSlide || 0;

  // Load saved YouTube URL from Firebase on mount
  useEffect(() => {
    if (!id) return;
    get(ref(db, `sessions/${id}/youtubeUrl`)).then(snap => {
      if (snap.exists() && snap.val()) {
        setYoutubeUrl(snap.val());
        setYoutubeInput(snap.val());
      }
    });
  }, [id]);

  const saveYoutubeUrl = async (url) => {
    await set(ref(db, `sessions/${id}/youtubeUrl`), url);
    setYoutubeUrl(url);
  };

  const handleYoutubeSave = () => {
    if (getYouTubeId(youtubeInput)) {
      saveYoutubeUrl(youtubeInput);
    }
  };

  const handleYoutubeClear = () => {
    saveYoutubeUrl('');
    setYoutubeInput('');
    setShowYoutubeBar(false);
  };

  const ytVideoId = getYouTubeId(youtubeUrl);

  const processFiles = useCallback(async (files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    setUploading(true);
    for (let i = 0; i < images.length; i++) {
      setUploadProgress(Math.round((i / images.length) * 100));
      await uploadSlide(images[i], slides.length + i);
    }
    setUploadProgress(100);
    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 800);
  }, [uploadSlide, slides.length]);

  const onDrop = useCallback(async (e) => {
    e.preventDefault(); setDragging(false);
    await processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const exportPDF = async () => {
    if (!slides.length) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [1280, 720] });
      for (let i = 0; i < slides.length; i++) {
        if (i > 0) pdf.addPage();
        await new Promise((res) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => { pdf.addImage(img, 'JPEG', 0, 0, 1280, 720); res(); };
          img.onerror = res;
          img.src = slides[i].url;
        });
      }
      pdf.save(`${session?.name || 'session'}_${id}.pdf`);
    } catch (e) { console.error(e); }
    setExporting(false);
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontFamily: 'system-ui' }}>
      Loading session...
    </div>
  );

  const currentSlide = slides[currentIdx];
  const annotation = currentSlide ? annotations[currentSlide.id] : null;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f7f4', color: '#1a1a2e', fontFamily: "'Georgia', 'Times New Roman', serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ borderBottom: '1px solid #e8e4de', flexShrink: 0, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div style={{ height: 58, display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16 }}>
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 20, fontFamily: 'system-ui' }}>←</button>
          <div style={{ fontFamily: 'monospace', fontWeight: 900, color: '#2d2d5e', fontSize: 18 }}>#{id}</div>
          <div style={{ fontWeight: 600, fontSize: 15, color: '#1a1a2e' }}>{session?.name}</div>
          <div style={{ flex: 1 }} />
          <div style={{ background: '#f4f2ee', borderRadius: 8, padding: '4px 14px', display: 'flex', alignItems: 'center', gap: 8, border: '1px solid #e0dbd3' }}>
            <span style={{ fontSize: 11, color: '#888', fontFamily: 'system-ui' }}>iPad ID:</span>
            <span style={{ fontFamily: 'monospace', fontSize: 20, fontWeight: 900, color: '#c0392b', letterSpacing: 6 }}>{id}</span>
          </div>
          {['ppt', 'grid', 'notes'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '6px 14px', borderRadius: 7, border: '1px solid #ddd', background: view === v ? '#2d2d5e' : '#fff', color: view === v ? '#fff' : '#555', cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui', fontWeight: view === v ? 600 : 400 }}>
              {v === 'ppt' ? '▶ Present' : v === 'grid' ? '⊞ Grid' : '📝 Notes'}
            </button>
          ))}
          <button onClick={exportPDF} disabled={exporting || !slides.length} style={{ padding: '6px 14px', borderRadius: 7, border: 'none', background: '#16a085', color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui', opacity: (!slides.length || exporting) ? 0.4 : 1 }}>{exporting ? '⏳' : '↓ PDF'}</button>

          {/* YouTube button */}
          <button onClick={() => setShowYoutubeBar(v => !v)} style={{
            padding: '6px 14px', borderRadius: 7, border: '1px solid #ddd',
            background: ytVideoId ? '#ff0000' : (showYoutubeBar ? '#fff0f0' : '#fff'),
            color: ytVideoId ? '#fff' : '#c00',
            cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <span>▶</span>
            <span>{ytVideoId ? 'Live Stream' : 'YouTube'}</span>
            {ytVideoId && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff', display: 'inline-block' }} />}
          </button>
        </div>

        {/* YouTube URL bar — slides down when open */}
        {showYoutubeBar && (
          <div style={{ padding: '10px 20px 14px', borderTop: '1px solid #f0ebe4', background: '#fdfcfa', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 13, color: '#888', fontFamily: 'system-ui', whiteSpace: 'nowrap' }}>🔴 YouTube Live URL:</span>
            <input
              value={youtubeInput}
              onChange={e => setYoutubeInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleYoutubeSave()}
              placeholder="https://youtube.com/watch?v=... or youtu.be/..."
              style={{ flex: 1, padding: '8px 12px', borderRadius: 7, border: '1px solid #d8d4ce', background: '#fff', color: '#1a1a2e', fontSize: 13, outline: 'none', fontFamily: 'system-ui' }}
            />
            <button onClick={handleYoutubeSave} disabled={!getYouTubeId(youtubeInput)} style={{ padding: '8px 16px', borderRadius: 7, border: 'none', background: '#c0392b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui', opacity: getYouTubeId(youtubeInput) ? 1 : 0.4 }}>Set Live</button>
            {ytVideoId && <button onClick={handleYoutubeClear} style={{ padding: '8px 12px', borderRadius: 7, border: '1px solid #ddd', background: '#fff', color: '#888', fontWeight: 500, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui' }}>Clear</button>}
          </div>
        )}
      </div>

      {/* ── FLOATING DRAGGABLE YOUTUBE PLAYER ── */}
      {ytVideoId && <DraggableYouTubePlayer videoId={ytVideoId} url={youtubeUrl} onClose={() => { handleYoutubeClear(); }} />}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view === 'ppt' && (
          <div style={{ flex: 1, display: 'flex' }}>
            {/* Slide thumbnails sidebar */}
            <div style={{ width: 160, borderRight: '1px solid #e8e4de', overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 8, background: '#fff' }}>
              {slides.map((s, i) => (
                <div key={s.id} onClick={() => setCurrentSlide(i)} style={{ position: 'relative', borderRadius: 6, overflow: 'hidden', cursor: 'pointer', border: i === currentIdx ? '2px solid #2d2d5e' : '2px solid #e8e4de', flexShrink: 0, boxShadow: i === currentIdx ? '0 2px 8px rgba(45,45,94,0.2)' : 'none' }}>
                  <img src={s.url} alt={`Slide ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                  <div style={{ position: 'absolute', bottom: 3, right: 5, fontFamily: 'monospace', fontSize: 10, fontWeight: 700, color: '#fff', textShadow: '0 1px 3px #000' }}>{i + 1}</div>
                </div>
              ))}
              <div onClick={() => fileInputRef.current?.click()} onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
                style={{ width: '100%', aspectRatio: '4/3', borderRadius: 6, border: `2px dashed ${dragging ? '#2d2d5e' : '#d8d4ce'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#999', fontSize: 22, flexShrink: 0, background: '#f8f7f4' }}>
                {uploading ? `${uploadProgress}%` : '+'}
              </div>
            </div>

            {/* Main slide area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, background: '#f8f7f4' }}>
              {currentSlide ? (
                <>
                  <div style={{ position: 'relative', width: '100%', maxWidth: 960, aspectRatio: '16/9', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 40px rgba(0,0,0,0.12)', border: '1px solid #e8e4de' }}>
                    <img src={currentSlide.url} alt={`Slide ${currentIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                    {annotation?.dataUrl && <img src={annotation.dataUrl} alt="annotation" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} />}
                    <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', borderRadius: 20, padding: '4px 12px', display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #e0dbd3', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#27ae60', display: 'inline-block', boxShadow: '0 0 6px #27ae60' }} />
                      <span style={{ fontSize: 11, color: '#27ae60', fontWeight: 700, fontFamily: 'system-ui' }}>LIVE</span>
                    </div>
                  </div>
                  <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <button onClick={() => setCurrentSlide(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #d8d4ce', background: '#fff', color: '#333', cursor: 'pointer', fontSize: 18, opacity: currentIdx === 0 ? 0.3 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>&#8249;</button>
                    <span style={{ fontSize: 14, color: '#888', fontFamily: 'system-ui' }}>{currentIdx + 1} / {slides.length}</span>
                    <button onClick={() => setCurrentSlide(Math.min(slides.length - 1, currentIdx + 1))} disabled={currentIdx >= slides.length - 1} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid #d8d4ce', background: '#fff', color: '#333', cursor: 'pointer', fontSize: 18, opacity: currentIdx >= slides.length - 1 ? 0.3 : 1, boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>&#8250;</button>
                  </div>
                </>
              ) : (
                <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%', maxWidth: 560, aspectRatio: '16/9', borderRadius: 16, border: '2px dashed #d8d4ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 48, marginBottom: 12 }}>🖼</div>
                  <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 6, color: '#1a1a2e' }}>Drop screenshots here</div>
                  <div style={{ fontSize: 13, color: '#999', fontFamily: 'system-ui' }}>or click to upload</div>
                </div>
              )}
            </div>
          </div>
        )}

        {view === 'grid' && (
          <div style={{ flex: 1, padding: 28, overflowY: 'auto', background: '#f8f7f4' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
              {slides.map((s, i) => (
                <div key={s.id} onClick={() => { setCurrentSlide(i); setView('ppt'); }} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', border: i === currentIdx ? '3px solid #2d2d5e' : '3px solid #e8e4de', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <img src={s.url} alt={`Slide ${i + 1}`} style={{ width: '100%', display: 'block' }} />
                  {annotations[s.id]?.dataUrl && <img src={annotations[s.id].dataUrl} alt="ann" style={{ position: 'absolute', inset: 0, width: '100%', objectFit: 'cover' }} />}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.6))', padding: '20px 10px 8px', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#fff' }}>Slide {i + 1}</span>
                    {annotations[s.id] && <span style={{ fontSize: 10, color: '#f8c471', fontWeight: 600 }}>annotated</span>}
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteSlide(s.id); }} style={{ position: 'absolute', top: 8, right: 8, width: 24, height: 24, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.9)', color: '#333', cursor: 'pointer', fontSize: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>x</button>
                </div>
              ))}
              <div onDrop={onDrop} onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onClick={() => fileInputRef.current?.click()}
                style={{ aspectRatio: '4/3', borderRadius: 10, border: '2px dashed #d8d4ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#999', fontSize: 13, background: '#fff', fontFamily: 'system-ui' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>+</div>Add Slides
              </div>
            </div>
          </div>
        )}

        {view === 'notes' && <NotesPanel sessionId={id} />}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => processFiles(e.target.files)} />
    </div>
  );
}

function NotesPanel({ sessionId }) {
  const [notes, setNotes] = useState([]);
  const [newPoint, setNewPoint] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef();

  useEffect(() => {
    const unsub = onValue(ref(db, `sessions/${sessionId}/notes`), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setNotes(Object.entries(data).map(([k, v]) => ({ id: k, ...v })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)));
      } else { setNotes([]); }
    });
    return () => unsub();
  }, [sessionId]);

  const addPoint = async () => {
    if (!newPoint.trim()) return;
    await push(ref(db, `sessions/${sessionId}/notes`), { type: 'text', content: newPoint.trim(), createdAt: Date.now() });
    setNewPoint('');
  };

  const uploadNoteImage = async (files) => {
    const images = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (!images.length) return;
    setUploading(true);
    for (const file of images) {
      const path = `sessions/${sessionId}/notes/${Date.now()}_${file.name}`;
      const sRef = storageRef(storage, path);
      await uploadBytes(sRef, file);
      const url = await getDownloadURL(sRef);
      await push(ref(db, `sessions/${sessionId}/notes`), { type: 'image', url, name: file.name, createdAt: Date.now() });
    }
    setUploading(false);
  };

  const deleteNote = async (noteId) => {
    await remove(ref(db, `sessions/${sessionId}/notes/${noteId}`));
  };

  const textNotes = notes.filter(n => n.type === 'text');
  const imageNotes = notes.filter(n => n.type === 'image');

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#f8f7f4' }}>
      <div style={{ width: '40%', borderRight: '1px solid #e8e4de', display: 'flex', flexDirection: 'column', background: '#fff' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e4de' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>📌 Points to Remember</div>
          <div style={{ fontSize: 12, color: '#999', marginTop: 2, fontFamily: 'system-ui' }}>Live synced to iPad</div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {textNotes.length === 0 && <div style={{ textAlign: 'center', color: '#bbb', fontSize: 13, paddingTop: 40, fontFamily: 'system-ui' }}>No points yet</div>}
          {textNotes.map((n, i) => (
            <div key={n.id} style={{ background: '#f8f7f4', border: '1px solid #e8e4de', borderRadius: 10, padding: '10px 14px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#ede9ff', border: '1px solid #c9c3f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#2d2d5e', flexShrink: 0, fontFamily: 'monospace' }}>{i + 1}</div>
              <div style={{ flex: 1, fontSize: 14, lineHeight: 1.5, color: '#1a1a2e', fontFamily: 'system-ui' }}>{n.content}</div>
              <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: '#ccc', cursor: 'pointer', fontSize: 14 }}>x</button>
            </div>
          ))}
        </div>
        <div style={{ padding: 14, borderTop: '1px solid #e8e4de', display: 'flex', gap: 8 }}>
          <input value={newPoint} onChange={e => setNewPoint(e.target.value)} onKeyDown={e => e.key === 'Enter' && addPoint()} placeholder="Add a point to remember..." style={{ flex: 1, padding: '9px 12px', borderRadius: 8, border: '1px solid #d8d4ce', background: '#f8f7f4', color: '#1a1a2e', fontSize: 13, outline: 'none', fontFamily: 'system-ui' }} />
          <button onClick={addPoint} disabled={!newPoint.trim()} style={{ padding: '9px 14px', borderRadius: 8, border: 'none', background: '#2d2d5e', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, opacity: !newPoint.trim() ? 0.4 : 1, fontFamily: 'system-ui' }}>+</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e8e4de', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fff' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e' }}>🖼 Note Images</div>
            <div style={{ fontSize: 12, color: '#999', marginTop: 2, fontFamily: 'system-ui' }}>Photos, diagrams, handwritten notes</div>
          </div>
          <button onClick={() => fileInputRef.current?.click()} style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#c0392b', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'system-ui' }}>
            {uploading ? '⏳ Uploading...' : '+ Upload'}
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f8f7f4' }}
          onDrop={e => { e.preventDefault(); setDragging(false); uploadNoteImage(e.dataTransfer.files); }}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}>
          {imageNotes.length === 0 ? (
            <div onClick={() => fileInputRef.current?.click()} style={{ minHeight: 200, borderRadius: 14, border: `2px dashed ${dragging ? '#c0392b' : '#d8d4ce'}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#aaa', cursor: 'pointer', background: '#fff' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📸</div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#888' }}>Drop note images here</div>
              <div style={{ fontSize: 12, fontFamily: 'system-ui' }}>photos, diagrams, handwritten notes</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
              {imageNotes.map(n => (
                <div key={n.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: '1px solid #e8e4de', background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <img src={n.url} alt={n.name} style={{ width: '100%', display: 'block', aspectRatio: '4/3', objectFit: 'cover' }} />
                  <div style={{ padding: '6px 10px', fontSize: 11, color: '#888', display: 'flex', justifyContent: 'space-between', fontFamily: 'system-ui' }}>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 120 }}>{n.name}</span>
                    <button onClick={() => deleteNote(n.id)} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 13 }}>x</button>
                  </div>
                </div>
              ))}
              <div onClick={() => fileInputRef.current?.click()} style={{ aspectRatio: '4/3', borderRadius: 10, border: '2px dashed #d8d4ce', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#aaa', fontSize: 13, gap: 6, background: '#fff', fontFamily: 'system-ui' }}>
                <div style={{ fontSize: 24 }}>+</div>Add more
              </div>
            </div>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={e => uploadNoteImage(e.target.files)} />
      </div>
    </div>
  );
}

// ─── Draggable floating YouTube player ────────────────────────────────────────
function DraggableYouTubePlayer({ videoId, url, onClose }) {
  const [pos, setPos] = React.useState({ x: window.innerWidth - 460, y: 80 });
  const [size, setSize] = React.useState({ w: 440, h: 260 });
  const [minimized, setMinimized] = React.useState(false);
  const [resizing, setResizing] = React.useState(false);
  const dragging = React.useRef(false);
  const resizingRef = React.useRef(false);
  const dragOffset = React.useRef({ x: 0, y: 0 });
  const resizeStart = React.useRef({ x: 0, y: 0, w: 0, h: 0 });
  const containerRef = React.useRef();

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
    setResizing(true);
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
    setResizing(false);
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
      ref={containerRef}
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
        {/* Drag grip dots */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.4, marginRight: 2 }}>
          {[0,1,2].map(i => <div key={i} style={{ display: 'flex', gap: 2 }}>{[0,1].map(j => <div key={j} style={{ width: 2.5, height: 2.5, borderRadius: '50%', background: '#fff' }} />)}</div>)}
        </div>

        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff0000', display: 'inline-block', boxShadow: '0 0 8px #ff0000', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: '#ff4444', fontWeight: 700, fontFamily: 'system-ui', letterSpacing: 0.5 }}>LIVE STREAM</span>
        <span style={{ fontSize: 10, color: '#555', fontFamily: 'system-ui', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>

        {/* Size presets */}
        <div style={{ display: 'flex', gap: 3 }}>
          {sizes.map(s => (
            <button key={s.label} onMouseDown={e => e.stopPropagation()} onClick={() => setSize({ w: s.w, h: s.h })} style={{ width: 20, height: 20, borderRadius: 4, border: 'none', background: size.w === s.w ? '#444' : 'transparent', color: size.w === s.w ? '#fff' : '#555', cursor: 'pointer', fontSize: 10, fontFamily: 'system-ui', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{s.label}</button>
          ))}
        </div>

        <a href={url} target="_blank" rel="noreferrer" onMouseDown={e => e.stopPropagation()} style={{ fontSize: 10, color: '#666', fontFamily: 'system-ui', textDecoration: 'none', padding: '2px 7px', border: '1px solid #333', borderRadius: 4 }}>↗</a>

        <button onMouseDown={e => e.stopPropagation()} onClick={() => setMinimized(v => !v)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 14, lineHeight: 1, padding: '0 2px' }}>{minimized ? '▲' : '▼'}</button>
        <button onMouseDown={e => e.stopPropagation()} onClick={onClose} style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
      </div>

      {/* Player iframe */}
      {!minimized && (
        <div style={{ position: 'relative', height: size.h, background: '#000' }}>
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1`}
            title="YouTube Live Stream"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
          />
          {/* Resize handle — bottom-right corner */}
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