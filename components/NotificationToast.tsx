
import React, { useEffect, useState } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { Notification } from '../types';

export const NotificationToast: React.FC = () => {
  const [activeNote, setActiveNote] = useState<Notification | null>(null);

  useEffect(() => {
    const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    const unsubscribe = mockFirebase.firestore.notifications.onSnapshot((notes) => {
      const latest = notes[0];
      if (latest && !latest.read && (!activeNote || latest.id !== activeNote.id)) {
        if (Date.now() - latest.createdAt < 10000) {
          setActiveNote(latest);
          audio.play().catch(() => {});
          setTimeout(() => setActiveNote(null), 5000);
        }
      }
    });
    return unsubscribe;
  }, [activeNote]);

  if (!activeNote) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-bounce-in">
      <div 
        className="bg-white border-l-4 shadow-2xl rounded-lg p-4 max-w-sm flex items-start space-x-3 border-brand"
        style={{ borderLeftColor: 'var(--brand-color)' }}
      >
        <div className="p-2 rounded-full bg-brand-light" style={{ backgroundColor: 'var(--brand-color-light)' }}>
          <svg className="w-6 h-6 text-brand" style={{ color: 'var(--brand-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-800">New Alert</p>
          <p className="text-xs text-slate-500 mt-1">{activeNote.message}</p>
        </div>
        <button onClick={() => setActiveNote(null)} className="text-slate-400 hover:text-slate-600">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>
    </div>
  );
};