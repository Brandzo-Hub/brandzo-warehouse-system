import React, { useEffect } from 'react';
import { AuthProvider, useAuth } from './AuthProvider.jsx';

function withBase(path) {
  const base = import.meta.env.BASE_URL || '/';
  const trimmedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const trimmedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

function GuardInner() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading || user || typeof window === 'undefined') return;
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.replace(`${withBase('/login')}?next=${next}`);
  }, [loading, user]);

  return null;
}

/**
 * Invisible client-side guard. Renders nothing, but redirects the browser to
 * `/login?next=<current path>` if Firebase Auth resolves to a signed-out
 * state.
 *
 * Drop this once into a layout that hosts protected content. While the auth
 * state is still resolving the underlying page chrome stays visible — but
 * Firestore security rules block any data fetches, so no protected content
 * actually leaks.
 */
export default function AuthGuard() {
  return (
    <AuthProvider>
      <GuardInner />
    </AuthProvider>
  );
}
