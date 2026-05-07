import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './AuthProvider.jsx';

function withBase(path) {
  const base = import.meta.env.BASE_URL || '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function LoginFormInner() {
  const { user, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If the user is already signed in, bounce them to the dashboard (or to
  // the `next` URL passed in the query string, when present).
  useEffect(() => {
    if (loading || !user || typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const next = params.get('next');
    const target = next ? decodeURIComponent(next) : withBase('/dashboard');
    window.location.replace(target);
  }, [loading, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    setError('');
    try {
      await signIn(email.trim(), password);
      // The effect above handles the redirect once `user` flips.
    } catch (err) {
      setError(translateAuthError(err));
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6" dir="rtl">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-2xl shadow-md border border-gray-200"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#c0392b] rounded-lg flex items-center justify-center font-bold text-xl text-white shadow">
            B
          </div>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">تسجيل الدخول إلى Brandzo ERP</h1>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-700 border border-red-200 font-bold text-sm">
            {error}
          </div>
        )}

        <label className="block mb-4">
          <span className="text-sm font-bold text-gray-700">البريد الإلكتروني</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
            placeholder="you@example.com"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm font-bold text-gray-700">كلمة المرور</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-[#c0392b]"
            placeholder="••••••••"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-[#c0392b] text-white py-3 font-bold shadow hover:bg-[#8b1a1a] active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting ? 'جاري الدخول…' : 'دخول'}
        </button>

        <p className="mt-6 text-xs text-gray-500 text-center leading-relaxed">
          هذا النظام مخصص لموظفي Brandzo فقط. للحصول على حساب جديد يرجى التواصل مع المسؤول.
        </p>
      </form>
    </div>
  );
}

/**
 * Map the most common Firebase Auth error codes into readable Arabic text.
 * Falls back to the raw message for anything we have not seen before.
 */
function translateAuthError(err) {
  const code = err && err.code ? String(err.code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return 'البريد الإلكتروني غير صحيح.';
    case 'auth/user-disabled':
      return 'هذا الحساب موقوف. تواصل مع المسؤول.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'بيانات الدخول غير صحيحة.';
    case 'auth/too-many-requests':
      return 'محاولات كثيرة. حاول مرة أخرى بعد قليل.';
    case 'auth/network-request-failed':
      return 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
    default:
      return err && err.message ? err.message : 'حدث خطأ غير متوقع.';
  }
}

export default function LoginForm() {
  return (
    <AuthProvider>
      <LoginFormInner />
    </AuthProvider>
  );
}
