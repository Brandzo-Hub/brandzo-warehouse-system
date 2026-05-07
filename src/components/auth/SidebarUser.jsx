import React from 'react';
import { AuthProvider } from './AuthProvider.jsx';
import UserBadge from './UserBadge.jsx';

/**
 * Astro entry point for the sidebar's "currently signed in as ..." badge.
 * Wraps the badge in its own AuthProvider so it can live in the
 * server-rendered layout as a single React island.
 */
export default function SidebarUser() {
  return (
    <AuthProvider>
      <UserBadge />
    </AuthProvider>
  );
}
