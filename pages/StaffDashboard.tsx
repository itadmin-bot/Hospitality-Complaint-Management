
import React, { useState, useEffect, useRef } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { Complaint, User, ComplaintStatus, SystemSettings } from '../types';

export const StaffDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedTicket = complaints.find(c => c.id === selectedTicketId);

  useEffect(() => {
    const unsubComplaints = mockFirebase.firestore.complaints.onSnapshot(setComplaints);
    const unsubSettings = mockFirebase.firestore.settings.onSnapshot(setSettings);
    return () => {
      unsubComplaints();
      unsubSettings();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedTicket?.responses]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicketId || !replyText.trim()) return;
    
    await mockFirebase.firestore.complaints.addResponse(selectedTicketId, {
      senderId: user.id,
      senderName: user.name,
      senderRole: user.role,
      text: replyText
    });
    
    if (selectedTicket?.status === 'submitted') {
      await mockFirebase.firestore.complaints.updateStatus(selectedTicketId, 'in-progress');
    }

    setReplyText('');
  };

  const handleStatusChange = async (id: string, status: ComplaintStatus) => {
    await mockFirebase.firestore.complaints.updateStatus(id, status);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-100 overflow-hidden">
      {/* Sidebar List */}
      <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col h-2/5 md:h-full">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="overflow-hidden">
            <h1 className="text-xl font-serif text-slate-800 truncate leading-none">{hotelName}</h1>
            <p className="text-[9px] uppercase tracking-widest text-slate-400 font-bold mt-1">Reception Center</p>
          </div>
          <button onClick={() => mockFirebase.auth.logout()} className="flex-shrink-0 text-slate-300 hover:text-slate-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          </button>
        </div>
        
        {/* Personalized Welcome in Sidebar Header */}
        <div className="px-4 py-3 bg-white border-b border-slate-50">
           <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{getGreeting()}</div>
           <div className="text-sm font-bold text-slate-800">{user.name}</div>
        </div>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          {complaints.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm space-y-4">
              <div className="w-12 h-12 bg-slate-50 rounded-full mx-auto flex items-center justify-center">
                <svg className="w-6 h-6 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p>Inbox is clear.</p>
            </div>
          ) : (
            complaints.map(c => (
              <button 
                key={c.id} 
                onClick={() => setSelectedTicketId(c.id)}
                className={`w-full text-left p-4 border-b border-slate-50 transition-all hover:bg-slate-50 flex items-start space-x-3
                  ${selectedTicketId === c.id ? 'border-l-4 shadow-inner' : ''}`}
                style={selectedTicketId === c.id ? { backgroundColor: 'var(--brand-color-light)', borderLeftColor: 'var(--brand-color)' } : {}}
              >
                <div className="w-2 h-2 mt-2 rounded-full flex-shrink-0" style={c.status === 'submitted' ? { backgroundColor: 'var(--brand-color)', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' } : c.status === 'in-progress' ? { backgroundColor: '#f59e0b' } : { backgroundColor: '#10b981' }} />
                <div className="flex-1 overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-900">Room {c.roomNumber}</span>
                    <span className="text-[10px] text-slate-400 font-medium">{new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-slate-600 truncate font-medium">{c.message}</p>
                  <div className="mt-2">
                    <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${c.priority === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-400'}`}>
                      {c.priority}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main Chat/Details Area */}
      <div className="flex-1 flex flex-col h-3/5 md:h-full bg-slate-50 overflow-hidden">
        {selectedTicket ? (
          <>
            <div className="bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between z-10 border-b border-slate-100">
              <div>
                <div className="flex items-center space-x-3">
                  <h2 className="text-xl font-serif text-slate-800">Room {selectedTicket.roomNumber}</h2>
                  <div className="h-4 w-px bg-slate-200" />
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-bold">Ticket {selectedTicket.id}</span>
                </div>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-1">Guest: <span className="text-slate-600">{selectedTicket.guestName || 'Undisclosed'}</span></p>
              </div>
              <div className="flex items-center space-x-3 mt-4 md:mt-0">
                <select 
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(selectedTicket.id, e.target.value as ComplaintStatus)}
                  className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 border-none rounded-lg px-3 py-2 outline-none cursor-pointer transition-all"
                  style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                >
                  <option value="submitted">Submitted</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
                <button 
                  onClick={() => mockFirebase.firestore.complaints.delete(selectedTicket.id)}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                >
                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              <div className="flex justify-center">
                <div className="max-w-2xl w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Initial Request</span>
                    <span className="text-[10px] text-slate-300 font-bold">{new Date(selectedTicket.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-slate-800 leading-relaxed font-medium italic text-lg">&quot;{selectedTicket.message}&quot;</p>
                  
                  {selectedTicket.mediaUrl && (
                    <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <p className="text-[9px] uppercase font-bold text-slate-400 mb-3 tracking-widest">Guest Attachment ({selectedTicket.mediaType})</p>
                      {selectedTicket.mediaType === 'audio' && (
                        <audio controls className="w-full h-10">
                          <source src={selectedTicket.mediaUrl} />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {selectedTicket.mediaType === 'video' && (
                        <video controls className="w-full rounded-lg shadow-xl max-h-80 bg-black">
                          <source src={selectedTicket.mediaUrl} />
                          Your browser does not support the video element.
                        </video>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                {selectedTicket.responses.map(res => (
                  <div key={res.id} className={`flex ${res.senderRole === 'staff' || res.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm ${res.senderRole === 'staff' || res.senderRole === 'admin' ? 'text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}
                         style={res.senderRole === 'staff' || res.senderRole === 'admin' ? { backgroundColor: 'var(--brand-color)' } : {}}>
                      <div className="flex items-center justify-between space-x-4 mb-2 opacity-70">
                         <span className="text-[9px] font-bold uppercase tracking-widest">{res.senderName}</span>
                         <span className="text-[9px] font-bold">{new Date(res.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm font-medium leading-relaxed">{res.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-100">
              <form onSubmit={handleSendReply} className="flex items-center space-x-3 bg-slate-50 p-2 rounded-2xl">
                <input 
                  type="text"
                  placeholder="Draft your reply to the guest..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-3 bg-transparent border-none focus:outline-none text-sm font-medium transition-all"
                  style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                />
                <button 
                  type="submit"
                  disabled={!replyText.trim()}
                  style={{ backgroundColor: 'var(--brand-color)' }}
                  className="hover:brightness-110 disabled:opacity-30 text-white p-3 rounded-xl shadow-lg transition-all active:scale-95 flex items-center justify-center"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-slate-50/50">
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                <svg className="w-10 h-10 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
             </div>
             <h3 className="text-2xl font-serif text-slate-800 mb-2">Welcome Back, {user.name}</h3>
             <p className="max-w-xs text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Select an active ticket to begin</p>
          </div>
        )}
      </div>
    </div>
  );
};
