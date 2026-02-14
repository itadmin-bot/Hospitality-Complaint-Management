
import React, { useState, useEffect, useRef } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { Complaint, User, SystemSettings, Priority } from '../types';

export const GuestDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [media, setMedia] = useState<{ url?: string; type?: 'audio' | 'video' | 'image' | 'file' }>({});
  
  const [form, setForm] = useState({
    roomNumber: user.roomNumber || '',
    guestName: '', 
    message: '',
    priority: 'medium' as Priority,
  });

  useEffect(() => {
    const unsubComplaints = mockFirebase.firestore.complaints.onSnapshot((all) => {
      setComplaints(all.filter(c => c.createdBy === user.id));
    });
    const unsubSettings = mockFirebase.firestore.settings.onSnapshot(setSettings);
    return () => {
      unsubComplaints();
      unsubSettings();
    };
  }, [user.id]);

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSubmitting(true);
    try {
      const url = await mockFirebase.storage.upload(file);
      setMedia({ url, type });
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const submissionData = {
        ...form,
        guestName: form.guestName.trim() || undefined,
        mediaUrl: media.url,
        mediaType: media.type,
        createdBy: user.id
      };
      await mockFirebase.firestore.complaints.add(submissionData);
      setForm({ ...form, message: '' }); 
      setMedia({});
      setShowForm(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col min-h-screen">
      <header className="flex justify-between items-start mb-10">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400">Guest Experience</p>
          <h1 className="text-4xl font-serif text-slate-800">Welcome to {hotelName}</h1>
          <div className="pt-4 animate-fade-in">
            <div className="inline-block px-4 py-2 rounded-lg bg-white border border-slate-100 shadow-sm">
              <span className="text-slate-600 font-medium">
                {getGreeting()}, <span className="text-slate-900 font-bold">{user.name}</span>. 
                <span className="ml-2 text-slate-400 text-sm">Room {user.roomNumber || 'Not Assigned'}</span>
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => mockFirebase.auth.logout()}
          className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
        >
          Sign Out
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8 flex-1">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-serif text-slate-800">Support Tickets</h2>
                <p className="text-slate-400 text-xs">Track your active requests and feedback</p>
              </div>
              <button 
                onClick={() => setShowForm(true)}
                style={{ backgroundColor: 'var(--brand-color)' }}
                className="text-white px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center shadow-lg hover:brightness-110 active:scale-95"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                New Request
              </button>
            </div>

            {complaints.length === 0 ? (
              <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <p className="font-medium">No complaints reported.</p>
                <p className="text-xs mt-1">We hope your stay is perfect!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {complaints.map(c => (
                  <div key={c.id} className="group border border-slate-50 rounded-xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300 cursor-pointer border-l-4" style={{ borderLeftColor: c.status === 'resolved' ? '#10b981' : c.status === 'in-progress' ? '#f59e0b' : 'var(--brand-color)' }}>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[10px] font-mono font-bold text-slate-400">{c.id}</span>
                      <span className={`px-3 py-1 rounded-full text-[9px] uppercase font-bold tracking-widest 
                        ${c.status === 'resolved' ? 'bg-green-100 text-green-700' : 
                          c.status === 'in-progress' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {c.status}
                      </span>
                    </div>
                    <p className="text-slate-800 font-medium mb-3 line-clamp-2">{c.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                        {c.responses.length} Messages
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 text-white rounded-2xl p-8 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
              <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" /></svg>
            </div>
            <h3 className="text-xl font-serif mb-6 relative z-10">Hotel Services</h3>
            <ul className="space-y-4 text-sm text-slate-300 relative z-10">
              <li className="flex items-center group/item cursor-pointer hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full mr-4 transition-all group-hover/item:scale-150" style={{ backgroundColor: 'var(--brand-color)' }}></span> 
                In-Room Dining
              </li>
              <li className="flex items-center group/item cursor-pointer hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full mr-4 transition-all group-hover/item:scale-150" style={{ backgroundColor: 'var(--brand-color)' }}></span> 
                Housekeeping
              </li>
              <li className="flex items-center group/item cursor-pointer hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full mr-4 transition-all group-hover/item:scale-150" style={{ backgroundColor: 'var(--brand-color)' }}></span> 
                Valet & Parking
              </li>
              <li className="flex items-center group/item cursor-pointer hover:text-white transition-colors">
                <span className="w-1.5 h-1.5 rounded-full mr-4 transition-all group-hover/item:scale-150" style={{ backgroundColor: 'var(--brand-color)' }}></span> 
                Spa & Wellness
              </li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="mt-12 py-8 border-t border-slate-100 text-center">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">
          &copy; {new Date().getFullYear()} {hotelName}
        </div>
        <div className="text-slate-300 text-[10px] uppercase tracking-[0.4em]">
          Elegance in Every Detail
        </div>
      </footer>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl animate-scale-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-2xl font-serif text-slate-800">New Service Report</h2>
                <p className="text-slate-400 text-xs mt-1">Please provide details so we can assist you promptly.</p>
              </div>
              <button onClick={() => setShowForm(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Room Number</label>
                  <input 
                    type="text" 
                    readOnly 
                    value={form.roomNumber}
                    className="w-full px-5 py-3 rounded-xl bg-slate-50 border border-slate-100 text-slate-400 font-bold outline-none cursor-default" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Guest Name</label>
                  <input 
                    type="text" 
                    value={form.guestName}
                    onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                    className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-all font-medium text-slate-700"
                    style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                    placeholder="Enter your name"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Details</label>
                <textarea 
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:outline-none focus:border-slate-400 transition-all font-medium text-slate-700 leading-relaxed"
                  style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                  placeholder="How can we help you today?"
                ></textarea>
              </div>

              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Attachments</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex-1 min-w-[120px] cursor-pointer bg-white border border-slate-100 rounded-xl p-3 text-center hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1">
                    <input type="file" accept="audio/*" capture="user" className="hidden" onChange={(e) => handleMediaUpload(e, 'audio')} />
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"/></svg>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Audio Note</span>
                  </label>
                  <label className="flex-1 min-w-[120px] cursor-pointer bg-white border border-slate-100 rounded-xl p-3 text-center hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1">
                    <input type="file" accept="video/*" capture="user" className="hidden" onChange={(e) => handleMediaUpload(e, 'video')} />
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Video Note</span>
                  </label>
                  <label className="flex-1 min-w-[120px] cursor-pointer bg-white border border-slate-100 rounded-xl p-3 text-center hover:shadow-md transition-all flex flex-col items-center justify-center space-y-1">
                    <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => handleMediaUpload(e, 'file')} />
                    <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Media/Files</span>
                  </label>
                </div>
                {media.url && (
                  <div className="flex items-center space-x-2 text-[10px] uppercase font-bold text-green-600 bg-green-50 p-3 rounded-lg border border-green-100">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                    <span>{media.type} attachment ready</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Priority Level</label>
                <div className="flex space-x-2">
                  {(['low', 'medium', 'high', 'urgent'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setForm({ ...form, priority: p })}
                      className={`flex-1 py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${form.priority === p ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                      style={form.priority === p ? { backgroundColor: 'var(--brand-color)' } : {}}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ backgroundColor: 'var(--brand-color)' }}
                  className="w-full text-white font-bold py-4 rounded-2xl hover:brightness-110 disabled:opacity-50 transition-all shadow-xl active:scale-95 uppercase tracking-widest text-sm"
                >
                  {isSubmitting ? 'Sending Request...' : 'Submit to Concierge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
