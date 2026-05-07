import React from 'react';
import { useAuth } from './AuthProvider.jsx';

function withBase(path) {
  const base = import.meta.env.BASE_URL || '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

/**
 * Small "currently signed in as <user>" pill with a sign-out button.
 * Renders nothing while auth state is still resolving so the sidebar stays
 * stable during the first paint.
 */
export default function UserBadge() {
  const { user, loading, signOut } = useAuth();

  if (loading || !user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      if (typeof window !== 'undefined') {
        window.location.replace(withBase('/login'));
      }
    }
  };

  const label = user.email || user.displayName || 'مستخدم';

  return (
    <div className="px-4 py-3 mx-2 mb-3 rounded-lg bg-gray-800/50 border border-gray-700">
      <div className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">مسجّل دخول كـ</div>
      <div className="text-sm font-bold text-white truncate" title={label}>
        {label}
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        className="mt-2 w-full text-xs font-bold text-[#c0392b] hover:text-white hover:bg-[#c0392b] border border-[#c0392b] rounded-md py-1.5 transition-colors"
      >
        تسجيل الخروج
      </button>
    </div>
  );
}
