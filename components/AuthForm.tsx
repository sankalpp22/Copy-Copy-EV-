import React, { useState } from 'react';
import { User } from '../types';
import { COUNTRIES } from '../constants';
import { auth, googleProvider } from '../services/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';

interface Props {
  onComplete: (user: User) => void;
}

type AuthView = 'LOGIN' | 'SIGNUP' | 'FORGOT';

const AuthForm: React.FC<Props> = ({ onComplete }) => {
  const [view, setView] = useState<AuthView>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [mobile, setMobile] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSuccess = (firebaseUser: any, customName?: string) => {
    onComplete({
      uid: firebaseUser.uid,
      name: customName || firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
      email: firebaseUser.email || '',
      mobile: mobile || 'N/A',
      countryCode: countryCode,
      photoUrl: firebaseUser.photoURL || `https://ui-avatars.com/api/?name=${customName || firebaseUser.email?.split('@')[0]}&background=10b981&color=fff`
    });
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      handleSuccess(result.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Recovery link has been dispatched to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (view === 'SIGNUP') {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: username });
        handleSuccess(result.user, username);
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        handleSuccess(result.user);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'FORGOT') {
    return (
      <div className="max-w-md w-full glass-card rounded-[2rem] overflow-hidden flex flex-col relative z-10 animate-fade-in border border-white/5">
        <div className="bg-slate-900/50 p-12 text-center text-white relative border-b border-white/5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
            <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-100">Reset Access</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Enter registered email for recovery</p>
        </div>

        <div className="p-10 space-y-6">
          {error && <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center">{error}</div>}
          {message && <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/20 text-emerald-400 text-xs font-medium rounded-xl text-center">{message}</div>}

          <form onSubmit={handleResetPassword} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Registered Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium outline-none input-glow transition-all"
                required
                placeholder="name@domain.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest"
            >
              {loading ? 'Sending...' : 'Send Recovery Link'}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setView('LOGIN'); setError(''); setMessage(''); }}
                className="text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-all"
              >
                Back to Log In
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full glass-card rounded-[2rem] overflow-hidden flex flex-col relative z-10 animate-fade-in border border-white/5">
      <div className="bg-slate-900/50 p-12 text-center text-white relative border-b border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="w-12 h-12 bg-emerald-600/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-emerald-500/20 shadow-inner">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-100">Your EV</h2>
        <p className="text-slate-400 text-xs mt-1 font-medium">Smart EV Navigation</p>
      </div>
      
      <div className="p-10 space-y-6">
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white/5 border border-white/10 py-3.5 rounded-xl font-semibold text-slate-200 hover:bg-white/10 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" />
          Log In with Google
        </button>

        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          <div className="flex-1 h-px bg-slate-800/50"></div>
          <span>Secure Credentials</span>
          <div className="flex-1 h-px bg-slate-800/50"></div>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 text-rose-400 text-xs font-medium rounded-xl text-center animate-pulse">
            {error}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {view === 'SIGNUP' && (
            <div className="space-y-1.5 animate-slide-up">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">UserName</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium outline-none input-glow transition-all"
                required={view === 'SIGNUP'}
                placeholder="Full Name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">{view === 'SIGNUP' ? 'Email Address' : 'Username'}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium outline-none input-glow transition-all"
              required
              placeholder="name@domain.com"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium outline-none input-glow transition-all"
              required
              placeholder="••••••••"
            />
          </div>

          {view === 'SIGNUP' && (
            <div className="space-y-1.5 animate-slide-up">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
              <div className="flex gap-2">
                <select className="bg-slate-900 border border-slate-800 rounded-xl px-2 font-bold text-xs outline-none text-slate-300" value={countryCode} onChange={e => setCountryCode(e.target.value)}>
                  {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                </select>
                <input
                  type="tel"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 px-5 py-3.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm font-medium outline-none input-glow transition-all"
                  placeholder="00000 00000"
                  required={view === 'SIGNUP'}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-900/10 active:scale-[0.98] disabled:opacity-50 uppercase tracking-widest mt-2"
          >
            {loading ? 'Processing...' : (view === 'SIGNUP' ? 'Create Account' : 'Log In')}
          </button>

          <div className="flex flex-col items-center gap-3 pt-4">
            <button
              type="button"
              onClick={() => { setView(view === 'SIGNUP' ? 'LOGIN' : 'SIGNUP'); setError(''); }}
              className="text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-all"
            >
              {view === 'SIGNUP' ? 'Already a user? Log In' : 'Sign Up for New User'}
            </button>
            
            {view === 'LOGIN' && (
              <button
                type="button"
                onClick={() => { setView('FORGOT'); setError(''); setMessage(''); }}
                className="text-slate-500 hover:text-slate-300 text-[11px] font-medium transition-all underline underline-offset-4 decoration-slate-800"
              >
                Forgot Password?
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AuthForm;