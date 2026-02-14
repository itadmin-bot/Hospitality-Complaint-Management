
import React, { useState, useEffect } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { Complaint, User, SystemSettings } from '../types';

const LUXURY_PRESETS = [
  { name: 'Heritage Amber', color: '#b45309' },
  { name: 'Royal Sapphire', color: '#1e40af' },
  { name: 'Emerald Peak', color: '#065f46' },
  { name: 'Deep Burgundy', color: '#881337' },
  { name: 'Midnight Slate', color: '#334155' },
];

export const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'settings'>('overview');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [userTypeFilter, setUserTypeFilter] = useState<'staff' | 'guest'>('staff');

  useEffect(() => {
    const unsubC = mockFirebase.firestore.complaints.onSnapshot(setComplaints);
    const unsubU = mockFirebase.firestore.users.onSnapshot(setUsers);
    const unsubS = mockFirebase.firestore.settings.onSnapshot(setSettings);
    return () => { unsubC(); unsubU(); unsubS(); };
  }, []);

  const handleDeleteComplaint = async (id: string) => {
    if (confirm('Are you sure you want to delete this record?')) {
      await mockFirebase.firestore.complaints.delete(id);
    }
  };

  const handleCreateUser = async () => {
    const name = prompt('Enter staff name:');
    const email = prompt('Enter staff email:');
    if (name && email) {
      await mockFirebase.auth.createUser({ name, email, role: 'staff' });
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
    link.setAttribute("download", `${(settings?.hotelName || 'hotel').toLowerCase().replace(/\s+/g, '_')}_complaints_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';
  const filteredUsers = users.filter(u => u.role === userTypeFilter);

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden">
      {/* Admin Nav */}
      <div className="w-64 bg-slate-900 text-white flex flex-col p-6 hidden md:flex">
        <h1 className="text-xl font-serif mb-12 border-b border-slate-800 pb-4 truncate">{hotelName}</h1>
        
        <nav className="flex-1 space-y-4">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'overview' ? 'shadow-lg' : 'hover:bg-slate-800'}`}
            style={activeTab === 'overview' ? { backgroundColor: 'var(--brand-color)' } : {}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-sm font-bold uppercase tracking-widest">Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'users' ? 'shadow-lg' : 'hover:bg-slate-800'}`}
            style={activeTab === 'users' ? { backgroundColor: 'var(--brand-color)' } : {}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <span className="text-sm font-bold uppercase tracking-widest">Directory</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${activeTab === 'settings' ? 'shadow-lg' : 'hover:bg-slate-800'}`}
            style={activeTab === 'settings' ? { backgroundColor: 'var(--brand-color)' } : {}}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            <span className="text-sm font-bold uppercase tracking-widest">Settings</span>
          </button>
        </nav>

        <div className="mt-auto pt-6 border-t border-slate-800">
           <div className="mb-1 text-[10px] text-slate-500 uppercase tracking-widest font-bold">
             &copy; {new Date().getFullYear()} {hotelName}
           </div>
           <button onClick={() => mockFirebase.auth.logout()} className="flex items-center space-x-3 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span className="text-[10px] font-bold uppercase tracking-widest">Logout</span>
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 h-screen overflow-y-auto p-8 custom-scrollbar">
        <header className="flex justify-between items-center mb-12">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
              <span>Management Console</span>
              <span>/</span>
              <span className="text-slate-900">{activeTab}</span>
            </div>
            <h2 className="text-3xl font-serif text-slate-900">Welcome Back, {user.name}</h2>
            <p className="text-slate-500 text-sm italic">Overseeing operations at {hotelName}</p>
          </div>
          <div className="flex space-x-3">
            {activeTab === 'users' && userTypeFilter === 'staff' && (
              <button 
                onClick={handleCreateUser} 
                style={{ backgroundColor: 'var(--brand-color)' }}
                className="text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg transition-all hover:brightness-110 active:scale-95"
              >
                Create Staff Account
              </button>
            )}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="flex justify-between items-end">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 flex-1">
                {[
                  { label: 'Total Tickets', val: complaints.length, color: 'blue' },
                  { label: 'Pending', val: complaints.filter(c => c.status === 'submitted').length, color: 'red' },
                  { label: 'In Progress', val: complaints.filter(c => c.status === 'in-progress').length, color: 'amber' },
                  { label: 'Resolved', val: complaints.filter(c => c.status === 'resolved').length, color: 'green' }
                ].map(stat => (
                  <div key={stat.label} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                    <p className={`text-4xl font-serif font-bold text-${stat.color}-600`}>{stat.val}</p>
                  </div>
                ))}
              </div>
              <div className="ml-6 mb-1">
                <button 
                  onClick={exportCSV} 
                  className="bg-white border border-slate-100 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:bg-slate-900 hover:text-white transition-all shadow-sm flex items-center group"
                >
                  <svg className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Export System Data
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-serif text-lg text-slate-800">Master Ticket Registry</h3>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{complaints.length} Total Logs</span>
              </div>
              <table className="w-full text-left">
                <thead className="bg-white border-b border-slate-100 text-[10px] uppercase font-bold text-slate-400 tracking-[0.2em]">
                  <tr>
                    <th className="px-8 py-5">Identifier</th>
                    <th className="px-8 py-5">Suite/Room</th>
                    <th className="px-8 py-5">Guest Name</th>
                    <th className="px-8 py-5">Priority</th>
                    <th className="px-8 py-5">Status</th>
                    <th className="px-8 py-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-8 py-16 text-center text-slate-400 italic">The system registry is currently empty.</td>
                    </tr>
                  ) : complaints.map(c => (
                    <tr key={c.id} className="text-sm hover:bg-slate-50/50 transition-colors">
                      <td className="px-8 py-5 font-mono text-xs text-slate-400">{c.id}</td>
                      <td className="px-8 py-5 font-bold text-slate-900">{c.roomNumber}</td>
                      <td className="px-8 py-5 text-slate-700 font-medium">{c.guestName || 'Undisclosed'}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded ${c.priority === 'urgent' ? 'bg-red-50 text-red-600' : c.priority === 'high' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${c.status === 'resolved' ? 'text-green-600 bg-green-50' : c.status === 'in-progress' ? 'text-amber-600 bg-amber-50' : 'text-blue-600 bg-blue-50'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleDeleteComplaint(c.id)}
                          className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Permanent Deletion"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-fade-in">
             <div className="flex space-x-4 border-b border-slate-100 pb-4">
               <button 
                 onClick={() => setUserTypeFilter('staff')}
                 className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${userTypeFilter === 'staff' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
               >
                 Staff Directory
               </button>
               <button 
                 onClick={() => setUserTypeFilter('guest')}
                 className={`text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-lg transition-all ${userTypeFilter === 'guest' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
               >
                 Guest List
               </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredUsers.length === 0 ? (
                <div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-3xl border border-dashed border-slate-200">
                   <p className="font-serif text-xl">No {userTypeFilter} entries found.</p>
                   <p className="text-xs uppercase tracking-widest mt-2">The registry is currently clear.</p>
                </div>
              ) : filteredUsers.map(u => (
                <div key={u.id} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                  <div className="flex items-start space-x-5 mb-6">
                    <div className="bg-slate-50 w-16 h-16 rounded-2xl flex items-center justify-center text-slate-200 group-hover:bg-white group-hover:scale-110 transition-all border border-transparent group-hover:border-slate-100 shrink-0">
                       <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-slate-800 truncate text-lg">{u.name}</h4>
                      <p className="text-xs text-slate-400 mb-2 truncate font-medium">{u.email}</p>
                      <div className="flex items-center space-x-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${u.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{u.status}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div>
                      <p className="text-[9px] uppercase font-bold text-slate-300 tracking-widest mb-1">Room Assignment</p>
                      <p className="text-sm font-bold text-slate-700">{u.role === 'guest' ? (u.roomNumber || 'Not Assigned') : 'N/A'}</p>
                    </div>
                    {u.role === 'guest' && (
                      <button 
                        onClick={() => handleUpdateRoom(u.id, u.roomNumber || '')}
                        style={{ color: 'var(--brand-color)' }}
                        className="text-[10px] font-bold uppercase tracking-widest hover:underline"
                      >
                        Assign Room
                      </button>
                    )}
                  </div>
                  
                  {/* Decorative corner tag */}
                  <div className="absolute top-0 right-0 p-2">
                    <span className="text-[8px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-bl-lg text-white" style={{ backgroundColor: 'var(--brand-color)' }}>
                      {u.role}
                    </span>
                  </div>
                </div>
              ))}
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800 text-sm uppercase tracking-wide">Multimedia Support</p>
                    <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">Enable guests to attach audio/visual evidence to reports.</p>
                  </div>
                  <button 
                    onClick={() => mockFirebase.firestore.settings.update({ allowAudioUploads: !settings?.allowAudioUploads })}
                    className={`w-14 h-7 rounded-full transition-all relative ${settings?.allowAudioUploads ? 'shadow-lg' : 'bg-slate-200'}`}
                    style={{ backgroundColor: settings?.allowAudioUploads ? 'var(--brand-color)' : '' }}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings?.allowAudioUploads ? 'left-8' : 'left-1'}`} />
                  </button>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-serif mb-8 pb-4 border-b border-slate-50 text-slate-800">Authentication Controls</h3>
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="max-w-sm">
                    <p className="font-bold text-slate-800 text-sm uppercase tracking-wide">Email/Password Registration</p>
                    <p className="text-xs text-slate-400 mt-1 italic leading-relaxed">Allow new users to sign up using an email address and password.</p>
                  </div>
                  <button 
                    onClick={() => mockFirebase.firestore.settings.update({ emailSignupEnabled: !settings?.emailSignupEnabled })}
                    className={`w-14 h-7 rounded-full transition-all relative ${settings?.emailSignupEnabled ? 'shadow-lg' : 'bg-slate-200'}`}
                    style={{ backgroundColor: settings?.emailSignupEnabled ? 'var(--brand-color)' : '' }}
                  >
                    <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${settings?.emailSignupEnabled ? 'left-8' : 'left-1'}`} />
                  </button>
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

                <div className="pt-4 border-t border-slate-50">
                  <p className="text-[10px] font-bold text-slate-400 mb-5 uppercase tracking-[0.2em]">Custom Master Tone</p>
                  <div className="flex items-center space-x-6">
                    <div className="relative group">
                      <input 
                        type="color" 
                        value={settings?.primaryColor || '#000000'}
                        onChange={(e) => mockFirebase.firestore.settings.update({ primaryColor: e.target.value })}
                        className="w-16 h-16 rounded-2xl cursor-pointer border-none p-0 shadow-lg appearance-none bg-transparent"
                      />
                      <div className="absolute inset-0 rounded-2xl border-2 border-white pointer-events-none group-hover:border-slate-200 transition-colors"></div>
                    </div>
                    <div className="space-y-2">
                      <input 
                        type="text" 
                        value={settings?.primaryColor || ''}
                        onChange={(e) => mockFirebase.firestore.settings.update({ primaryColor: e.target.value })}
                        className="bg-slate-50 border border-slate-100 rounded-xl px-5 py-3 text-sm font-mono font-bold text-slate-700 outline-none focus:ring-2 w-40"
                        style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                      />
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Hex Code Reference</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};
