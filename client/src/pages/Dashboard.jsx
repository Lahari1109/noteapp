import React, { useEffect, useState, useRef } from 'react';
import api from '../api';
import { AnimatePresence, motion } from 'framer-motion';

const DarkModeToggle = ({ checked, onChange }) => (
  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 16 }}>
    <span style={{ color: checked ? '#f6d365' : '#a770ef', fontWeight: 600 }}>
      {checked ? '🌙' : '☀️'}
    </span>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      style={{ display: 'none' }}
    />
    <span style={{
      width: 40,
      height: 22,
      background: checked ? '#232336' : '#eee',
      borderRadius: 12,
      position: 'relative',
      transition: 'background 0.2s',
      display: 'inline-block',
    }}>
      <span style={{
        position: 'absolute',
        left: checked ? 22 : 2,
        top: 2,
        width: 18,
        height: 18,
        background: checked ? '#f6d365' : '#a770ef',
        borderRadius: '50%',
        transition: 'left 0.2s, background 0.2s',
        boxShadow: '0 1px 4px #0002',
      }} />
    </span>
  </label>
);

const Dashboard = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [search, setSearch] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [showColorPalette, setShowColorPalette] = useState(false);

  // Color palette for notes
  const colorPalette = [
    '#f6d365', // yellow
    '#a770ef', // purple
    '#fd6e6a', // red
    '#42e695', // green
    '#43cea2', // teal
    '#f7971e', // orange
    '#2b86c5', // blue
    '#ffb6b9', // pink
    '#6a89cc', // indigo
    '#f8ffae'  // light yellow
  ];

  useEffect(() => {
    fetchNotes();
    // Initialize SpeechRecognition only once
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setEditContent(prev => prev + (prev && !prev.endsWith(' ') ? ' ' : '') + transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchNotes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/notes');
      setNotes(res.data);
      // If a note is selected, update it from the new list
      if (selectedNote) {
        const updated = res.data.find(n => n._id === selectedNote._id);
        setSelectedNote(updated || null);
        if (updated) {
          setEditTitle(updated.title || '');
          setEditContent(updated.content || '');
        }
      }
    } catch (err) {
      setError('Failed to fetch notes');
    } finally {
      setLoading(false);
    }
  };

  const handleNewNote = async () => {
    setSaving(true);
    try {
      const res = await api.post('/notes', { title: 'Untitled Note', content: '' });
      setNotes([res.data, ...notes]);
      setSelectedNote(res.data);
      setEditTitle('Untitled Note');
      setEditContent('');
    } catch (err) {
      setError('Failed to create note');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectNote = (note) => {
    setSelectedNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
  };

  const handleSave = async () => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await api.put(`/notes/${selectedNote._id}`, {
        title: editTitle,
        content: editContent,
        color: selectedNote.color,
        pinned: selectedNote.pinned,
      });
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
      setSelectedNote(res.data);
    } catch (err) {
      setError('Failed to save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedNote) return;
    setDeleting(true);
    try {
      await api.delete(`/notes/${selectedNote._id}`);
      setNotes(notes.filter(n => n._id !== selectedNote._id));
      setSelectedNote(null);
      setEditTitle('');
      setEditContent('');
    } catch (err) {
      setError('Failed to delete note');
    } finally {
      setDeleting(false);
    }
  };

  const handleMicClick = () => {
    if (!recognitionRef.current) return alert('Speech recognition not supported in this browser.');
    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      recognitionRef.current.start();
      setListening(true);
    }
  };

  const handleToggleDarkMode = () => setDarkMode(dm => !dm);

  const handleColorChange = async (color) => {
    if (!selectedNote) return;
    setSaving(true);
    try {
      const res = await api.put(`/notes/${selectedNote._id}`, {
        title: editTitle,
        content: editContent,
        color,
        pinned: selectedNote.pinned,
      });
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
      setSelectedNote(res.data);
    } catch (err) {
      setError('Failed to update color');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePin = async (note) => {
    setSaving(true);
    try {
      const res = await api.put(`/notes/${note._id}`, {
        ...note,
        pinned: !note.pinned,
      });
      setNotes(notes.map(n => n._id === res.data._id ? res.data : n));
      if (selectedNote?._id === note._id) setSelectedNote(res.data);
    } catch (err) {
      setError('Failed to pin/unpin note');
    } finally {
      setSaving(false);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title?.toLowerCase().includes(search.toLowerCase())
  );

  // Split notes into pinned and others
  const pinnedNotes = filteredNotes.filter(n => n.pinned);
  const otherNotes = filteredNotes.filter(n => !n.pinned);

  // Helper to highlight search matches in a string
  function highlightMatches(text, search) {
    if (!search) return text;
    const regex = new RegExp(`(${search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part)
        ? <span key={i} style={{ background: '#ffe066', color: '#222', borderRadius: 3, padding: '0 2px' }}>{part}</span>
        : part
    );
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', display: 'flex', background: darkMode ? '#181824' : '#f7f7fa', margin: 0, padding: 0, zIndex: 0, color: darkMode ? '#fff' : '#111' }}>
      {/* Sidebar */}
      <div style={{ width: 300, height: '100%', background: darkMode ? '#232336' : '#fff', borderRight: '1px solid #eee', padding: 24, display: 'flex', flexDirection: 'column', color: darkMode ? '#fff' : '#111' }}>
        <h2 style={{ marginBottom: 16, color: darkMode ? '#f6d365' : '#a770ef' }}>Notes</h2>
        <DarkModeToggle checked={darkMode} onChange={handleToggleDarkMode} />
        <input
          type="text"
          placeholder="Search notes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 16, padding: 8, borderRadius: 6, border: '1px solid #eee' }}
        />
        <button
          style={{ marginBottom: 16, background: 'linear-gradient(90deg, #a770ef 0%, #f6d365 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer' }}
          onClick={handleNewNote}
          disabled={saving}
        >
          {saving ? 'Creating...' : '+ New Note'}
        </button>
        <button
          style={{ marginBottom: 16, background: '#eee', color: '#a770ef', border: 'none', borderRadius: 8, padding: '10px 0', fontWeight: 600, cursor: 'pointer' }}
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
        >
          Logout
        </button>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div>Loading...</div>
          ) : error ? (
            <div style={{ color: 'red' }}>{error}</div>
          ) : filteredNotes.length === 0 ? (
            <div>No notes yet</div>
          ) : (
            <AnimatePresence initial={false}>
              {/* Pinned notes */}
              {pinnedNotes.length > 0 && <div style={{ fontSize: 13, color: darkMode ? '#f6d365' : '#a770ef', margin: '8px 0 2px 2px', fontWeight: 600 }}>Pinned</div>}
              {pinnedNotes.map(note => {
                // Utility to determine if a color is light or dark
                function isColorLight(hex) {
                  if (!hex) return false;
                  const c = hex.substring(1); // strip #
                  const rgb = parseInt(c, 16);
                  const r = (rgb >> 16) & 0xff;
                  const g = (rgb >> 8) & 0xff;
                  const b = (rgb >> 0) & 0xff;
                  // Perceived brightness
                  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
                }
                const bgColor = note.color || (darkMode ? '#232336' : '#fff');
                const textColor = isColorLight(bgColor) ? '#222' : '#fff';
                return (
                  <motion.div
                    key={note._id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => handleSelectNote(note)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 8px',
                      borderRadius: 6,
                      marginBottom: 8,
                      background: bgColor,
                      cursor: 'pointer',
                      fontWeight: selectedNote?._id === note._id ? 700 : 500,
                      color: selectedNote?._id === note._id ? (isColorLight(bgColor) ? '#a770ef' : '#f6d365') : textColor,
                      boxShadow: selectedNote?._id === note._id ? '0 0 0 2px #a770ef' : 'none',
                      border: selectedNote?._id === note._id ? '2px solid #a770ef' : 'none',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      position: 'relative',
                    }}
                  >
                    {/* Pin icon */}
                    <span
                      onClick={e => { e.stopPropagation(); handleTogglePin(note); }}
                      style={{ cursor: 'pointer', fontSize: 18, marginRight: 4, color: note.pinned ? '#f6d365' : textColor, filter: note.pinned ? 'drop-shadow(0 0 2px #a770ef)' : 'none' }}
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >📌</span>
                    {/* Highlight search match in title */}
                    {(() => {
                      const title = note.title || 'Untitled Note';
                      if (!search) return title;
                      const idx = title.toLowerCase().indexOf(search.toLowerCase());
                      if (idx === -1) return title;
                      return <>
                        {title.slice(0, idx)}
                        {highlightMatches(title.slice(idx, idx + search.length), search)}
                        {title.slice(idx + search.length)}
                      </>;
                    })()}
                  </motion.div>
                );
              })}
              {/* Other notes */}
              {pinnedNotes.length > 0 && otherNotes.length > 0 && <div style={{ fontSize: 13, color: darkMode ? '#aaa' : '#888', margin: '8px 0 2px 2px', fontWeight: 600 }}>Others</div>}
              {otherNotes.map(note => {
                // Utility to determine if a color is light or dark
                function isColorLight(hex) {
                  if (!hex) return false;
                  const c = hex.substring(1); // strip #
                  const rgb = parseInt(c, 16);
                  const r = (rgb >> 16) & 0xff;
                  const g = (rgb >> 8) & 0xff;
                  const b = (rgb >> 0) & 0xff;
                  // Perceived brightness
                  return (r * 0.299 + g * 0.587 + b * 0.114) > 186;
                }
                const bgColor = note.color || (darkMode ? '#232336' : '#fff');
                const textColor = isColorLight(bgColor) ? '#222' : '#fff';
                return (
                  <motion.div
                    key={note._id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 30 }}
                    transition={{ duration: 0.25 }}
                    onClick={() => handleSelectNote(note)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 8px',
                      borderRadius: 6,
                      marginBottom: 8,
                      background: bgColor,
                      cursor: 'pointer',
                      fontWeight: selectedNote?._id === note._id ? 700 : 500,
                      color: selectedNote?._id === note._id ? (isColorLight(bgColor) ? '#a770ef' : '#f6d365') : textColor,
                      boxShadow: selectedNote?._id === note._id ? '0 0 0 2px #a770ef' : 'none',
                      border: selectedNote?._id === note._id ? '2px solid #a770ef' : 'none',
                      transition: 'background 0.2s, color 0.2s, box-shadow 0.2s',
                      position: 'relative',
                    }}
                  >
                    {/* Pin icon */}
                    <span
                      onClick={e => { e.stopPropagation(); handleTogglePin(note); }}
                      style={{ cursor: 'pointer', fontSize: 18, marginRight: 4, color: note.pinned ? '#f6d365' : textColor, filter: note.pinned ? 'drop-shadow(0 0 2px #a770ef)' : 'none' }}
                      title={note.pinned ? 'Unpin' : 'Pin'}
                    >📌</span>
                    {/* Highlight search match in title */}
                    {(() => {
                      const title = note.title || 'Untitled Note';
                      if (!search) return title;
                      const idx = title.toLowerCase().indexOf(search.toLowerCase());
                      if (idx === -1) return title;
                      return <>
                        {title.slice(0, idx)}
                        {highlightMatches(title.slice(idx, idx + search.length), search)}
                        {title.slice(idx + search.length)}
                      </>;
                    })()}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
      {/* Main area */}
      <div style={{ flex: 1, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: darkMode ? '#181824' : '#f7f7fa', color: darkMode ? '#fff' : '#111' }}>
        {!selectedNote ? (
          <div style={{ color: '#aaa', fontSize: 24, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
            Welcome to Notes<br />Select a note from the sidebar or create a new one.
          </div>
        ) : (
          <div style={{ width: '100%', maxWidth: 700, background: darkMode ? '#232336' : '#fff', borderRadius: 12, boxShadow: '0 2px 16px #0001', padding: 32, color: darkMode ? '#fff' : '#111' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <input
                type="text"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                placeholder="Title"
                style={{
                  width: '100%',
                  fontSize: 28,
                  fontWeight: 700,
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: darkMode ? '#fff' : '#222',
                }}
              />
              <button
                type="button"
                onClick={() => setShowColorPalette(v => !v)}
                style={{
                  marginLeft: 8,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 22,
                  color: darkMode ? '#f6d365' : '#a770ef',
                  outline: 'none',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                }}
                title="Change note color"
              >
                🎨
              </button>
              {/* Pin icon in editor */}
              {selectedNote && (
                <button
                  type="button"
                  onClick={() => handleTogglePin(selectedNote)}
                  style={{
                    marginLeft: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 22,
                    color: selectedNote.pinned ? '#f6d365' : (darkMode ? '#fff' : '#a770ef'),
                    outline: 'none',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    filter: selectedNote.pinned ? 'drop-shadow(0 0 2px #a770ef)' : 'none',
                  }}
                  title={selectedNote.pinned ? 'Unpin' : 'Pin'}
                  disabled={saving}
                >
                  📌
                </button>
              )}
            </div>
            {/* Color palette (shown only when showColorPalette is true) */}
            {showColorPalette && (
              <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center', animation: 'fadeIn 0.2s' }}>
                {colorPalette.map(color => (
                  <button
                    key={color}
                    onClick={async () => {
                      await handleColorChange(color);
                      setShowColorPalette(false);
                    }}
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      border: selectedNote?.color === color ? '2.5px solid #222' : '2px solid #fff',
                      background: color,
                      cursor: 'pointer',
                      outline: selectedNote?.color === color ? '2px solid #a770ef' : 'none',
                      boxShadow: '0 1px 4px #0002',
                      transition: 'border 0.2s, outline 0.2s',
                    }}
                    title={color}
                    type="button"
                    disabled={saving}
                  />
                ))}
                <span style={{ fontSize: 13, color: darkMode ? '#aaa' : '#888', marginLeft: 8 }}>
                  Note color
                </span>
              </div>
            )}
            <div style={{ color: darkMode ? '#aaa' : '#888', fontSize: 14, marginBottom: 16 }}>
              Created {new Date(selectedNote.createdAt).toLocaleString()}<br />
              Last updated {new Date(selectedNote.updatedAt).toLocaleString()}
            </div>
            {/* Highlighted title */}
            <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, display: 'none' }}>
              {highlightMatches(editTitle, search)}
            </div>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              placeholder="Start writing your note..."
              style={{
                width: '100%',
                minHeight: 180,
                fontSize: 18,
                border: 'none',
                outline: 'none',
                resize: 'vertical',
                background: 'transparent',
                marginBottom: 16,
                color: darkMode ? '#fff' : '#222',
                display: 'none',
              }}
            />
            {/* Highlighted content */}
            <div style={{
              width: '100%',
              minHeight: 180,
              fontSize: 18,
              background: 'transparent',
              marginBottom: 16,
              color: darkMode ? '#fff' : '#222',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {highlightMatches(editContent, search)}
            </div>
            <button
              onClick={handleMicClick}
              style={{
                marginLeft: 8,
                background: listening ? '#a770ef' : '#eee',
                color: listening ? '#fff' : '#a770ef',
                border: 'none',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                cursor: 'pointer',
                boxShadow: listening ? '0 0 0 2px #a770ef55' : 'none',
                transition: 'background 0.2s, color 0.2s',
                position: 'relative',
                top: -52,
                left: 'calc(100% - 48px)',
                zIndex: 2,
              }}
              title={listening ? 'Stop Listening' : 'Voice to Text'}
              type="button"
            >
              {listening ? '🎤' : '🎙️'}
            </button>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ background: 'linear-gradient(90deg, #a770ef 0%, #f6d365 100%)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 600, cursor: 'pointer' }}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ background: '#ffd6d6', color: '#a770ef', border: 'none', borderRadius: 8, padding: '10px 32px', fontWeight: 600, cursor: 'pointer' }}
              >
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 