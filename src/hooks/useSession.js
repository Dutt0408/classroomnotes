/* eslint-disable */
import { useState, useEffect, useCallback } from 'react';
import { ref, onValue, set, push, update, remove, serverTimestamp } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

export function useSession(sessionId) {
  const [session, setSession] = useState(null);
  const [slides, setSlides] = useState([]);
  const [annotations, setAnnotations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }
    const sessionRef = ref(db, `sessions/${sessionId}`);
    const unsub = onValue(sessionRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSession(data);
        setSlides(data.slides ? Object.entries(data.slides).map(([k, v]) => ({ id: k, ...v })).sort((a, b) => (a.order || 0) - (b.order || 0)) : []);
        setAnnotations(data.annotations || {});
      } else {
        setSession(null); setSlides([]); setAnnotations({});
      }
      setLoading(false);
    });
    return () => unsub();
  }, [sessionId]);

  const uploadSlide = useCallback(async (file, order) => {
    const path = `sessions/${sessionId}/slides/${Date.now()}_${file.name}`;
    const sRef = storageRef(storage, path);
    await uploadBytes(sRef, file);
    const url = await getDownloadURL(sRef);
    await push(ref(db, `sessions/${sessionId}/slides`), { url, name: file.name, order, uploadedAt: serverTimestamp() });
    return url;
  }, [sessionId]);

  const saveAnnotation = useCallback(async (slideId, dataUrl) => {
    await set(ref(db, `sessions/${sessionId}/annotations/${slideId}`), { dataUrl, updatedAt: serverTimestamp() });
  }, [sessionId]);

  const setCurrentSlide = useCallback(async (index) => {
    await update(ref(db, `sessions/${sessionId}`), { currentSlide: index });
  }, [sessionId]);

  const deleteSlide = useCallback(async (slideId) => {
    await remove(ref(db, `sessions/${sessionId}/slides/${slideId}`));
  }, [sessionId]);

  return { session, slides, annotations, loading, uploadSlide, saveAnnotation, setCurrentSlide, deleteSlide };
}

export function useSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onValue(ref(db, 'sessions'), (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setSessions(Object.entries(data).map(([id, s]) => ({
          id, name: s.name || 'Untitled', createdAt: s.createdAt || 0,
          slideCount: s.slides ? Object.keys(s.slides).length : 0,
          currentSlide: s.currentSlide || 0,
        })).sort((a, b) => b.createdAt - a.createdAt));
      } else { setSessions([]); }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const createSession = useCallback(async (name) => {
    const id = Math.floor(100 + Math.random() * 900).toString();
    await set(ref(db, `sessions/${id}`), { name, createdAt: Date.now(), currentSlide: 0 });
    return id;
  }, []);

  const deleteSession = useCallback(async (id) => {
    await remove(ref(db, `sessions/${id}`));
  }, []);

  return { sessions, loading, createSession, deleteSession };
}
