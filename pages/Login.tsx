
import React, { useState, useEffect } from 'react';
import { mockFirebase } from '../services/mockFirebase';
import { SystemSettings, User } from '../types';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const unsub = mockFirebase.firestore.settings.onSnapshot(setSettings);
    const savedEmail = localStorage.getItem('remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    return unsub;
  }, []);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isSignUp) {
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setIsLoading(false);
          return;
        }
        try {
          await mockFirebase.auth.createUser({ 
            name, 
            email, 
            password,
            roomNumber,
            role: 'guest'
          });
          setVerificationEmail(email);
        } catch (err: any) {
          if (err.code === 'auth/email-already-in-use') {
            setError('User already exists. Please sign in');
          } else {
            setError(err.message || 'Registration failed.');
          }
        }
      } else {
        try {
          const user = await mockFirebase.auth.login(email, password);
          if (rememberMe) {
            localStorage.setItem('remembered_email', email);
          } else {
            localStorage.removeItem('remembered_email');
          }
          onLoginSuccess(user);
        } catch (err: any) {
          if (
            err.code === 'auth/invalid-credential' || 
            err.code === 'auth/user-not-found' || 
            err.code === 'auth/wrong-password'
          ) {
            setError('Email or password is incorrect');
          } else {
            setError(err.message || 'Login failed.');
          }
        }
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    try {
      await mockFirebase.auth.resendVerification();
      setResendCooldown(60);
      alert('A new verification email has been sent. Please check your spam folder.');
    } catch (err: any) {
      setError('Failed to resend. Please try again later.');
    }
  };

  const hotelName = settings?.hotelName || 'Tidé Hotels and Resorts';

  if (verificationEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 text-center animate-fade-in">
          <div className="w-20 h-20 bg-brand-light rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--brand-color-light)' }}>
            <svg className="w-10 h-10 text-brand" style={{ color: 'var(--brand-color)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-slate-800 mb-4">Verify Your Identity</h2>
          <p className="text-slate-600 text-sm mb-6 leading-relaxed">
            We have sent a verification email to <span className="font-bold text-slate-900">{verificationEmail}</span>.
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
              onClick={() => setVerificationEmail(null)}
              style={{ backgroundColor: 'var(--brand-color)' }}
              className="w-full text-white font-bold py-4 rounded-2xl transition-all shadow-xl hover:brightness-110 uppercase tracking-widest text-xs"
            >
              Back to Login
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
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20">
        <img 
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=2000" 
          className="w-full h-full object-cover" 
          alt="background" 
        />
      </div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white rounded-3xl shadow-2xl p-10 border border-slate-100 animate-fade-in">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-serif text-slate-800 mb-2">{hotelName}</h1>
            <p className="text-slate-400 text-[10px] uppercase tracking-[0.3em] font-bold">
              {isSignUp ? 'Establish Membership' : 'Guest Access Portal'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-5">
            {isSignUp && (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alexander Tidé"
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all font-medium text-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Room Number</label>
                  <input 
                    type="text" 
                    required 
                    value={roomNumber}
                    onChange={(e) => setRoomNumber(e.target.value)}
                    placeholder="e.g. 402"
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all font-medium text-slate-700"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
              <input 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@domain.com"
                className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all font-medium text-slate-700"
              />
            </div>

            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Password</label>
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all font-medium text-slate-700"
                />
              </div>
              
              {isSignUp && (
                <div className="animate-fade-in">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Confirm Password</label>
                  <input 
                    type="password" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-5 py-3.5 rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--brand-color)] transition-all font-medium text-slate-700"
                  />
                </div>
              )}
            </div>

            {!isSignUp && (
              <div className="flex items-center space-x-2 animate-fade-in">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-brand focus:ring-brand accent-brand cursor-pointer"
                  style={{ '--tw-ring-color': 'var(--brand-color)' } as any}
                />
                <label htmlFor="rememberMe" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none">
                  Remember me
                </label>
              </div>
            )}

            {error && (
              <div className="bg-red-50 text-red-600 text-[11px] font-bold p-4 rounded-xl border border-red-100 uppercase tracking-wider text-center">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              style={{ backgroundColor: 'var(--brand-color)' }}
              className="w-full text-white font-bold py-4 rounded-2xl transition-all transform active:scale-[0.98] disabled:opacity-50 shadow-xl hover:brightness-110 uppercase tracking-[0.2em] text-xs mt-4"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (isSignUp ? 'Create Membership' : 'Request Access')}
            </button>
          </form>

          {settings?.emailSignupEnabled && (
            <div className="mt-8 pt-8 border-t border-slate-50 text-center">
              <button 
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-widest transition-colors"
              >
                {isSignUp ? 'Already a member? Sign In' : 'New to our residence? Sign Up'}
              </button>
            </div>
          )}

          <div className="mt-8 text-center">
            <div className="text-slate-300 text-[9px] uppercase tracking-[0.4em]">
              &copy; {new Date().getFullYear()} {hotelName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
