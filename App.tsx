
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { mockFirebase } from './services/mockFirebase';
import { User, SystemSettings } from './types';
import { Login } from './pages/Login';
import { GuestDashboard } from './pages/GuestDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { NotificationToast } from './components/NotificationToast';

const ADMIN_URL = "/management-tide-38SOWE-secure-admin";

const WelcomeScreen: React.FC<{ user: User, hotelName: string, onComplete: () => void }> = ({ user, hotelName, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900">
      <div className="text-center space-y-10 max-w-xl px-8">
        <div className="overflow-hidden">
          <p className="text-brand text-[10px] font-bold uppercase tracking-[0.5em] animate-slide-up" style={{ color: 'var(--brand-color)' }}>
            Experience Perfection
          </p>
        </div>
        <div className="overflow-hidden">
          <h1 className="text-4xl md:text-6xl font-serif text-white animate-slide-up delay-200">
            Welcome, {user.name}
          </h1>
        </div>
        <div className="h-px w-24 bg-slate-800 mx-auto animate-scale-x delay-500 shadow-[0_0_15px_rgba(255,255,255,0.1)]" />
        <div className="overflow-hidden">
          <p className="text-slate-400 text-xs md:text-sm tracking-[0.4em] uppercase font-light animate-slide-up delay-700">
            {hotelName}
          </p>
        </div>
      </div>
    </div>
  );
};

const VerificationScreen: React.FC<{ email: string }> = ({ email }) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--brand-color-light)' }}>
           <svg className="w-10 h-10 text-brand" style={{ color: 'var(--brand-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 00-2 2z" />
           </svg>
        </div>
        <h2 className="text-2xl font-serif text-slate-800 mb-4">Verification Required</h2>
        <p className="text-slate-600 text-sm mb-8 leading-relaxed">
          We have sent you a verification email to <span className="font-bold text-slate-900">{email}</span>. Please verify it and log in.
        </p>
        <button 
          onClick={() => mockFirebase.auth.logout()}
          style={{ backgroundColor: 'var(--brand-color)' }}
          className="w-full text-white font-bold py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all uppercase tracking-widest text-xs"
        >
          Login
        </button>
      </div>
    </div>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode, allowedRoles?: string[] }> = ({ children, allowedRoles }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(mockFirebase.auth.getCurrentUser());
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsub = mockFirebase.auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) return null;

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Block unverified users except for specific flows if needed, but here we block them entirely
  if (!currentUser.emailVerified) {
    return <VerificationScreen email={currentUser.email} />;
  }

  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const DashboardSelector: React.FC<{ user: User }> = ({ user }) => {
  if (user.role === 'admin') return <Navigate to={ADMIN_URL} replace />;
  if (user.role === 'staff') return <StaffDashboard user={user} />;
  return <GuestDashboard user={user} />;
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = mockFirebase.auth.onAuthStateChanged((loggedInUser) => {
      setUser(loggedInUser);
      setInitializing(false);
    });
    
    const unsubscribeSettings = mockFirebase.firestore.settings.onSnapshot((s) => {
      setSettings(s);
      if (s.primaryColor) {
        document.documentElement.style.setProperty('--brand-color', s.primaryColor);
        document.documentElement.style.setProperty('--brand-color-light', `${s.primaryColor}15`);
      }
    });
    
    return () => {
      unsubscribeAuth();
      unsubscribeSettings();
    };
  }, []);

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    // Only show welcome if the email is verified
    if (loggedInUser.emailVerified) {
      setShowWelcome(true);
    }
  };

  if (initializing) {
    const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <h1 className="text-4xl font-serif text-white animate-pulse">{hotelName}</h1>
          <p className="text-slate-400 text-[10px] tracking-[0.5em] mt-6 uppercase font-bold">Refining Details...</p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <NotificationToast />
      <Routes>
        <Route 
          path="/login" 
          element={user && user.emailVerified ? <Navigate to="/" /> : <Login onLoginSuccess={handleLoginSuccess} />} 
        />
        
        <Route path="/" element={
          <PrivateRoute>
            {showWelcome && user ? (
              <WelcomeScreen 
                user={user} 
                hotelName={settings?.hotelName || 'Tidé'} 
                onComplete={() => setShowWelcome(false)} 
              />
            ) : (
              user && <DashboardSelector user={user} />
            )}
          </PrivateRoute>
        } />

        <Route path={ADMIN_URL} element={
          <PrivateRoute allowedRoles={['admin']}>
            {user && <AdminDashboard user={user} />}
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
