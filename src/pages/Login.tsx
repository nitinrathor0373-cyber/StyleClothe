import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion } from 'motion/react';
import { LogIn, UserPlus, Mail, Lock, Chrome } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate(redirect);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password provider is not enabled in Firebase. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(redirect);
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError('Google provider is not enabled in Firebase. Please enable it in the Firebase Console (Authentication > Sign-in method).');
      } else {
        setError(err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-editorial-bg p-10">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-md w-full bg-editorial-text text-editorial-bg p-12 border border-editorial-text shadow-[20px_20px_0px_0px_rgba(26,26,26,0.1)]"
      >
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif italic leading-none mb-4 uppercase tracking-tighter">StyleClothes</h2>
          <div className="editorial-uppercase opacity-40 text-[9px] tracking-[0.4em]">
            {isLogin ? 'Member / Authentication' : 'New Archive / Registry'}
          </div>
        </div>

        <form onSubmit={handleAuth} className="space-y-10">
          <div className="space-y-6">
            <div className="relative">
              <input 
                type="email" 
                placeholder="Email Identity"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-6 py-5 bg-transparent border border-editorial-bg/20 focus:border-editorial-bg outline-none transition-all font-sans text-xs uppercase tracking-widest placeholder:opacity-20"
                required
              />
            </div>
            <div className="relative">
              <input 
                type="password" 
                placeholder="Secure Token"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-6 py-5 bg-transparent border border-editorial-bg/20 focus:border-editorial-bg outline-none transition-all font-sans text-xs uppercase tracking-widest placeholder:opacity-20"
                required
              />
            </div>
          </div>

          {error && <div className="editorial-uppercase text-red-400 text-[8px] animate-pulse">{error}</div>}

          <button 
            type="submit"
            disabled={loading}
            className="w-full h-16 bg-editorial-bg text-editorial-text font-serif italic text-2xl hover:opacity-90 disabled:opacity-20 transition-all"
          >
            {loading ? 'Working...' : isLogin ? 'Access Portal' : 'Register Member'}
          </button>
        </form>

        <div className="mt-12 flex items-center gap-6">
          <div className="flex-grow h-[1px] bg-editorial-bg/10" />
          <span className="editorial-uppercase opacity-30 text-[8px]">External Providers</span>
          <div className="flex-grow h-[1px] bg-editorial-bg/10" />
        </div>

        <button 
          onClick={handleGoogleSignIn}
          className="mt-12 w-full py-5 border border-editorial-bg/20 editorial-uppercase text-[10px] flex items-center justify-center gap-4 hover:border-editorial-bg hover:bg-editorial-bg/5 transition-all"
        >
          <Chrome size={16} strokeWidth={1} />
          GOOGLE ACCOUNT
        </button>

        <button 
          onClick={() => setIsLogin(!isLogin)}
          className="mt-12 w-full text-center editorial-uppercase opacity-40 hover:opacity-100 transition-opacity underline underline-offset-4"
        >
          {isLogin ? "Join the Style Registry" : "Return to Access Portal"}
        </button>
      </motion.div>
    </div>
  );
}
