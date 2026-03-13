/* eslint-disable */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSession } from '../hooks/useSession';
import { ref, push, remove, onValue } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export default function PresenterView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session, slides, annotations, loading, uploadSlide, setCurrentSlide, deleteSlide } = useSession(id);
  const [view, setView] = useState('ppt');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [exporting, setExporting] = useState(false);
  const fileInputRef = useRef();
  const currentIdx = session?.currentSlide || 0;

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
      <div style={{ height: 58, borderBottom: '1px solid #e8e4de', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
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
      </div>

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