import React, { useState } from 'react';
import { useApp } from '../store';
import { LogIn, FileText, ShieldCheck, Zap, AlertCircle } from 'lucide-react';
import { loginWithGoogle } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export function Login() {
  const { login } = useApp();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const result = await loginWithGoogle();
      const user = result.user;
      
      // Auto-register user in firestore if not exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
         await setDoc(doc(db, 'users', user.uid), {
           username: user.email || user.uid,
           name: user.displayName || 'Unknown User',
           role: 'admin',
           id: user.uid
         });
      }
      
      // The store will pick up the user from users collection and currentUser will be set 
      // but to force the state, we can use a custom sync or just let store handle it
      login(user.email || user.uid); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Gagal masuk dengan Google.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl flex overflow-hidden border border-slate-200 dark:border-slate-800">
        
        {/* Left Side - Hero / Branding */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-900 p-12 text-white relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 translate-y-12 -translate-x-12 w-48 h-48 bg-blue-400 opacity-10 rounded-full blur-2xl"></div>

          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">Manajemen Faktur</span>
            </div>
            
            <h1 className="text-4xl font-extrabold leading-tight mb-4">
              Kelola Faktur <br/>Lebih Mudah & Cepat
            </h1>
            <p className="text-indigo-100 text-lg mb-8 max-w-md">
              Platform terbaik untuk memantau jatuh tempo, pembayaran, dan manajemen tagihan supplier Anda dalam satu tempat.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-indigo-100">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Aman dan tersinkronisasi di cloud</span>
              </div>
              <div className="flex items-center space-x-3 text-indigo-100">
                <Zap className="w-5 h-5 text-amber-400" />
                <span>Otomatisasi pengelompokan tagihan</span>
              </div>
            </div>
          </div>
          
          <div className="relative z-10 text-sm text-indigo-200/60 font-medium">
            &copy; {new Date().getFullYear()} Manajemen Faktur. All rights reserved.
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center bg-white dark:bg-slate-900 relative">
          <div className="max-w-sm mx-auto w-full">
            <div className="md:hidden flex justify-center mb-6">
              <div className="p-4 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl text-indigo-600 dark:text-indigo-400">
                <FileText className="w-10 h-10" />
              </div>
            </div>
            
            <div className="text-center md:text-left mb-10">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Selamat Datang</h2>
              <p className="text-slate-500 dark:text-slate-400">Silakan masuk menggunakan akun Google Anda untuk melanjutkan.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50/50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-sm rounded-xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-6">
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold shadow-sm hover:shadow transition-all active:scale-[0.98] flex items-center justify-center space-x-3 disabled:opacity-50 disabled:pointer-events-none group"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span>{loading ? 'Memproses...' : 'Lanjutkan dengan Google'}</span>
              </button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 text-center">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Dengan masuk, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi kami.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
