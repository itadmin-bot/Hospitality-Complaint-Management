
import React, { useState, useEffect, useRef } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { Complaint, User, SystemSettings, ActivityLog } from '../types';

const LUXURY_PRESETS = [
  { name: 'Heritage Amber', color: '#b45309' },
  { name: 'Royal Sapphire', color: '#1e40af' },
  { name: 'Emerald Peak', color: '#065f46' },
  { name: 'Deep Burgundy', color: '#881337' },
  { name: 'Midnight Slate', color: '#334155' },
];

export const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'activity' | 'settings'>('overview');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'staff' | 'guest'>('staff');
  
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', password: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubC = mockFirebase.firestore.complaints.onSnapshot(setComplaints);
    const unsubU = mockFirebase.firestore.users.onSnapshot(setUsers);
    const unsubS = mockFirebase.firestore.settings.onSnapshot(setSettings);
    const unsubL = mockFirebase.firestore.activityLogs.onSnapshot(setLogs);
    return () => { unsubC(); unsubU(); unsubS(); unsubL(); };
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      await mockFirebase.auth.createUser({ 
        name: newStaff.name, 
        email: newStaff.email, 
        password: newStaff.password, 
        role: 'staff' 
      });
      setShowAddStaff(false);
      setNewStaff({ name: '', email: '', password: '' });
      alert('Staff account created successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to create staff account.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateRoom = async (userId: string, currentRoom: string) => {
    const room = prompt('Enter new room number:', currentRoom);
    if (room !== null) {
      await mockFirebase.firestore.users.update(userId, { roomNumber: room });
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Room', 'Guest Name', 'Message', 'Status', 'Priority', 'Date'];
    const rows = complaints.map(c => [
      c.id,
      c.roomNumber,
      `"${(c.guestName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${c.message.replace(/"/g, '""')}"`,
      c.status,
      c.priority,
      new Date(c.createdAt).toLocaleString().replace(/,/g, '')
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `tide_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';
  const filteredUsers = users.filter(u => u.role === userTypeFilter);
  const onlineCount = users.filter(u => u.isOnline).length;
  const staffCount = users.filter(u => u.role === 'staff').length;
  const guestCount = users.filter(u => u.role === 'guest').length;

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Admin Nav */}
      <div className="w-64 bg-slate-900 text-white flex flex-col p-6 hidden md:flex">
        <h1 className="text-xl font-serif mb-12 border-b border-slate-800 pb-4 truncate">{hotelName}</h1>
        
        <nav className="flex-1 space-y-2">
          {[
            { id: 'overview', label: 'Overview', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
            { id: 'users', label: 'Directory', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
            { id: 'activity', label: 'Activity Log', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
            { id: 'settings', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          ].map(item => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'shadow-lg bg-brand' : 'hover:bg-slate-800 text-slate-400'}`}
              style={activeTab === item.id ? { backgroundColor: 'var(--brand-color)', color: 'white' } : {}}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} /></svg>
              <span className="text-xs font-bold uppercase tracking-widest">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <button onClick={() => mockFirebase.auth.logout()} className="w-full flex items-center space-x-3 text-slate-400 hover:text-white transition-colors group">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center group-hover:bg-red-500/10 group-hover:text-red-500 transition-all">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Sign Out</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto p-8 custom-scrollbar bg-slate-50">
        <header className="flex justify-between items-start mb-10">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Admin Console</span>
              <span>/</span>
              <span className="text-brand" style={{ color: 'var(--brand-color)' }}>{activeTab}</span>
            </div>
            <h2 className="text-3xl font-serif text-slate-900">Operations Control</h2>
            <p className="text-slate-500 text-sm font-medium mt-1">Logged in as <span className="text-slate-900 font-bold">{user.name}</span></p>
          </div>
          <div className="flex space-x-3">
             <button 
                onClick={exportCSV} 
                className="bg-white border border-slate-200 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                Export
              </button>
            {activeTab === 'users' && userTypeFilter === 'staff' && (
              <button 
                onClick={() => setShowAddStaff(true)} 
                className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95"
              >
                Enroll Staff
              </button>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Active Guests', val: guestCount, sub: 'In-house residents', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z', color: 'blue' },
                { label: 'On-Duty Staff', val: staffCount, sub: 'Service personnel', icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', color: 'amber' },
                { label: 'Live Sessions', val: onlineCount, sub: 'Currently active', icon: 'M13 10V3L4 14h7v7l9-11h-7z', color: 'emerald' },
                { label: 'Pending Tickets', val: complaints.filter(c => c.status === 'submitted').length, sub: 'Action required', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', color: 'red' }
              ].map(stat => (
                <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col group hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={stat.icon} /></svg>
                    </div>
                    <span className="text-2xl font-serif font-bold text-slate-900">{stat.val}</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                  <p className="text-[10px] text-slate-400 mt-1 italic">{stat.sub}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                  <h3 className="font-serif text-lg text-slate-800">Master Ticket Registry</h3>
                  <button onClick={exportCSV} className="text-[9px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-colors">Download Ledger</button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                      <tr>
                        <th className="px-6 py-4">Ref</th>
                        <th className="px-6 py-4">Suite</th>
                        <th className="px-6 py-4">Guest</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {complaints.length === 0 ? (
                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic text-sm">No active tickets found.</td></tr>
                      ) : complaints.map(c => (
                        <tr key={c.id} className="text-xs hover:bg-slate-50/50 transition-colors cursor-default">
                          <td className="px-6 py-4 font-mono text-slate-400">{c.id}</td>
                          <td className="px-6 py-4 font-bold text-slate-900">{c.roomNumber}</td>
                          <td className="px-6 py-4 text-slate-600 font-medium">{c.guestName || 'Undisclosed'}</td>
                          <td className="px-6 py-4">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest ${c.status === 'resolved' ? 'text-green-600 bg-green-50' : c.status === 'in-progress' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                             <div className={`w-2 h-2 rounded-full ${c.priority === 'urgent' ? 'bg-red-500 animate-pulse' : c.priority === 'high' ? 'bg-orange-500' : 'bg-slate-300'}`} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-slate-900 text-white rounded-2xl shadow-xl flex flex-col h-[500px]">
                <div className="p-6 border-b border-white/5 flex justify-between items-center">
                  <h3 className="font-serif text-lg">System Feed</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Live</span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {logs.length === 0 ? (
                    <p className="text-center text-slate-500 text-xs py-10 italic">Awaiting events...</p>
                  ) : logs.map(log => (
                    <div key={log.id} className="bg-white/5 p-4 rounded-xl border border-white/5 hover:border-white/10 transition-colors animate-fade-in">
                      <div className="flex justify-between items-start mb-2">
                        <span className={`text-[8px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded ${log.action === 'login' ? 'bg-blue-500/20 text-blue-400' : log.action === 'complaint_submitted' ? 'bg-amber-500/20 text-amber-400' : 'bg-white/10 text-white/50'}`}>
                          {log.action.replace('_', ' ')}
                        </span>
                        <span className="text-[8px] text-white/20 font-bold">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                      <p className="text-xs text-white/80 leading-relaxed"><span className="text-white font-bold">{log.userName}</span> {log.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6 animate-fade-in">
             <div className="flex space-x-2 bg-white p-1 rounded-xl shadow-sm border border-slate-200 w-fit">
               <button 
                 onClick={() => setUserTypeFilter('staff')}
                 className={`text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-lg transition-all ${userTypeFilter === 'staff' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Service Personnel
               </button>
               <button 
                 onClick={() => setUserTypeFilter('guest')}
                 className={`text-[10px] font-bold uppercase tracking-widest px-6 py-2 rounded-lg transition-all ${userTypeFilter === 'guest' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 In-House Guests
               </button>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100 text-[9px] uppercase font-bold text-slate-400 tracking-widest">
                    <tr>
                      <th className="px-8 py-5">Full Identity</th>
                      <th className="px-8 py-5">Assignment</th>
                      <th className="px-8 py-5">Status</th>
                      <th className="px-8 py-5">Last Activity</th>
                      <th className="px-8 py-5">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-20 text-center text-slate-400 italic font-serif text-lg">No {userTypeFilter} accounts registered in the database.</td></tr>
                    ) : filteredUsers.map(u => (
                      <tr key={u.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 border border-slate-200">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/></svg>
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{u.name}</p>
                              <p className="text-[10px] text-slate-400 font-medium">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          {u.role === 'guest' ? (
                            <button onClick={() => handleUpdateRoom(u.id, u.roomNumber || '')} className="text-xs font-bold text-slate-800 hover:text-brand transition-colors">
                              Room {u.roomNumber || 'None'}
                            </button>
                          ) : (
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Global Support</span>
                          )}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center space-x-2">
                            <div className={`w-2 h-2 rounded-full ${u.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            <span className={`text-[10px] font-bold uppercase tracking-widest ${u.isOnline ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {u.isOnline ? 'Online' : 'Offline'}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-xs text-slate-600 font-medium">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Never'}
                          </p>
                          <p className="text-[9px] text-slate-300 uppercase font-bold tracking-widest mt-0.5">Last Access</p>
                        </td>
                        <td className="px-8 py-5">
                          <span className="text-xs text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="animate-fade-in space-y-6">
            <div className="bg-slate-900 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-5">
                  <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
               </div>
               <h3 className="text-white text-2xl font-serif mb-2 relative z-10">Operational Log</h3>
               <p className="text-slate-400 text-sm max-w-lg mb-10 relative z-10 font-medium">Comprehensive audit trail of all system interactions and background services.</p>
               
               <div className="space-y-4 relative z-10">
                 {logs.length === 0 ? (
                   <div className="py-20 text-center border border-dashed border-white/10 rounded-2xl">
                     <p className="text-slate-500 font-medium">System idle. No activity recorded.</p>
                   </div>
                 ) : logs.map(log => (
                   <div key={log.id} className="bg-white/5 border border-white/5 rounded-2xl p-6 flex items-start space-x-5 hover:bg-white/[0.07] transition-all group">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${log.action === 'login' ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                     </div>
                     <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                           <span className="text-xs font-bold text-white uppercase tracking-widest">{log.userName}</span>
                           <span className="text-[10px] text-white/20 font-bold tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-400 font-medium leading-relaxed">{log.details}</p>
                        <div className="mt-3 flex items-center space-x-2">
                           <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/30">{log.userRole}</span>
                           <div className="w-1 h-1 bg-white/10 rounded-full" />
                           <span className="text-[9px] uppercase font-bold tracking-[0.2em] text-white/30">{log.action.replace('_', ' ')}</span>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-3xl bg-white p-10 rounded-3xl border border-slate-100 shadow-sm space-y-16 animate-fade-in">
            <section>
              <h3 className="text-xl font-serif mb-8 pb-4 border-b border-slate-50 text-slate-800">Operational Policy</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="max-w-sm">
                    <p className="font-bold text-slate-800 text-sm uppercase tracking-wide">Establishment Brand Name</p>
                    <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">The primary identifier used across guest and staff interfaces.</p>
                  </div>
                  <input 
                    type="text" 
                    value={settings?.hotelName || ''} 
                    onChange={(e) => mockFirebase.firestore.settings.update({ hotelName: e.target.value })}
                    className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-semibold text-slate-800 outline-none transition-all w-72 focus:ring-2 focus:ring-[var(--brand-color)] focus:border-transparent"
                    placeholder="Luxury Hotel Name"
                  />
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-serif mb-8 pb-4 border-b border-slate-50 text-slate-800">Visual Identity</h3>
              <div className="space-y-10">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 mb-5 uppercase tracking-[0.2em]">Signature Presets</p>
                  <div className="flex flex-wrap gap-5">
                    {LUXURY_PRESETS.map((preset) => (
                      <button
                        key={preset.color}
                        onClick={() => mockFirebase.firestore.settings.update({ primaryColor: preset.color })}
                        title={preset.name}
                        className={`group relative w-14 h-14 rounded-2xl border-4 transition-all hover:scale-110 active:scale-90 ${settings?.primaryColor === preset.color ? 'border-slate-900 shadow-xl' : 'border-white shadow-sm'}`}
                        style={{ backgroundColor: preset.color }}
                      >
                        {settings?.primaryColor === preset.color && (
                          <span className="absolute inset-0 flex items-center justify-center text-white">
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Enroll Staff Modal */}
      {showAddStaff && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl animate-scale-up">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-serif text-slate-800">Enroll Personnel</h2>
                <p className="text-slate-400 text-xs mt-1">Create a new global service account.</p>
              </div>
              <button onClick={() => setShowAddStaff(false)} className="bg-slate-50 p-2 rounded-full text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleCreateStaff} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Legal Name</label>
                <input required type="text" value={newStaff.name} onChange={e => setNewStaff({ ...newStaff, name: e.target.value })} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Work Email</label>
                <input required type="email" value={newStaff.email} onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none font-medium" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Temporary Password</label>
                <input required type="password" value={newStaff.password} onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} className="w-full px-5 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none font-medium" />
              </div>
              <button 
                type="submit" 
                disabled={isProcessing}
                className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-50"
              >
                {isProcessing ? 'Enrolling...' : 'Establish Service Profile'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
