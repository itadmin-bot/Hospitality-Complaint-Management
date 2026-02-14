
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
const ADMIN_SECRET = "TIDE-ADMIN-KEY-2026";

const AdminAuthWrapper: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [authProcessing, setAuthProcessing] = useState(false);

  useEffect(() => {
    const unsub = mockFirebase.auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleAdminAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAuthProcessing(true);

    try {
      if (isForgotPassword) {
        try {
          await mockFirebase.auth.resetPassword(email);
          setSuccess('If this email is registered, a password reset link has been sent to your inbox.');
        } catch (err: any) {
          setError(err.message || 'Failed to send reset email.');
        }
        return;
      }

      if (isRegistering) {
        if (secretKey !== ADMIN_SECRET) {
          throw new Error('Invalid Admin Secret Key.');
        }
        await mockFirebase.auth.createUser({
          email,
          password,
          name,
          role: 'admin'
        });
        alert('Admin account created! Please verify your email and then log in.');
        setIsRegistering(false);
      } else {
        const user = await mockFirebase.auth.login(email, password);
        if (user.role !== 'admin') {
          await mockFirebase.auth.logout();
          throw new Error('Access denied. You do not have administrative privileges.');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed.');
    } finally {
      setAuthProcessing(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-white animate-pulse font-serif text-xl">Authenticating Secure Link...</div>
    </div>
  );

  if (currentUser && currentUser.role === 'admin') {
    if (!currentUser.emailVerified) {
      return <VerificationScreen email={currentUser.email} />;
    }
    return <AdminDashboard user={currentUser} />;
  }

  if (currentUser && currentUser.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 border border-slate-200 animate-fade-in">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h2 className="text-2xl font-serif text-slate-900">Admin Secure Access</h2>
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-slate-400 mt-2">
            {isRegistering ? 'New Administrator Enrollment' : isForgotPassword ? 'Recover Credentials' : 'Management Portal Login'}
          </p>
        </div>

        <form onSubmit={handleAdminAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
              <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
          )}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Admin Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" />
          </div>
          {!isForgotPassword && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
          )}
          {isRegistering && (
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Master Secret Key</label>
              <input type="password" required value={secretKey} onChange={e => setSecretKey(e.target.value)} placeholder="TIDE-XXXX-XXXX" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-slate-900" />
            </div>
          )}

          {!isRegistering && !isForgotPassword && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          )}

          {error && <div className="text-red-500 text-[10px] font-bold uppercase text-center p-2 bg-red-50 rounded-lg">{error}</div>}
          {success && <div className="text-green-500 text-[10px] font-bold uppercase text-center p-2 bg-green-50 rounded-lg">{success}</div>}

          <button 
            type="submit" 
            disabled={authProcessing}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl hover:bg-black transition-all shadow-xl uppercase tracking-widest text-xs disabled:opacity-50"
          >
            {authProcessing ? 'Verifying...' : (isRegistering ? 'Register Admin' : isForgotPassword ? 'Send Reset Link' : 'Enter Management')}
          </button>
        </form>

        <div className="mt-8 text-center pt-8 border-t border-slate-50">
          {isForgotPassword ? (
            <button 
              onClick={() => {
                setIsForgotPassword(false);
                setError('');
                setSuccess('');
              }}
              className="text-slate-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              Back to Login
            </button>
          ) : (
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError('');
                setSuccess('');
              }}
              className="text-slate-400 hover:text-slate-900 text-[10px] font-bold uppercase tracking-widest transition-colors"
            >
              {isRegistering ? 'Back to Admin Login' : 'First time? Initialize Administrator'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await mockFirebase.auth.resendVerification();
      setResendCooldown(60);
      alert('Verification email resent. Please check your spam folder.');
    } catch (err: any) {
      alert('Failed to resend. Please try again later.');
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center animate-fade-in">
        <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--brand-color-light)' }}>
           <svg className="w-10 h-10 text-brand" style={{ color: 'var(--brand-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
        </div>
        <h2 className="text-2xl font-serif text-slate-800 mb-4">Verification Required</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          We have sent a verification email to <span className="font-bold text-slate-900">{email}</span>.
        </p>

        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-8 flex items-start space-x-3 text-left">
          <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <p className="text-[11px] text-amber-700 font-medium leading-normal">
            <span className="font-bold block mb-0.5 uppercase tracking-wider">Email not arriving?</span>
            Please check your <span className="underline decoration-amber-300">Junk or Spam folder</span> as your mail provider may have filtered our message.
          </p>
        </div>

        <div className="space-y-4">
          <button 
            onClick={() => mockFirebase.auth.logout()}
            style={{ backgroundColor: 'var(--brand-color)' }}
            className="w-full text-white font-bold py-4 rounded-2xl shadow-xl hover:brightness-110 transition-all uppercase tracking-widest text-xs"
          >
            Return to Login
          </button>
          <button 
            onClick={handleResend}
            disabled={resendCooldown > 0}
            className="w-full text-slate-400 hover:text-slate-600 font-bold uppercase tracking-widest text-[10px] py-2 transition-all disabled:opacity-50"
          >
            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend verification email'}
          </button>
        </div>
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

        <Route path={ADMIN_URL} element={<AdminAuthWrapper />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
