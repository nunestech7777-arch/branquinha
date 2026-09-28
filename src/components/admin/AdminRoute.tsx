import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured, isCurrentUserAdmin } from '../../lib/supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export const AdminRoute: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;

    async function checkAuth() {
      if (!isSupabaseConfigured) {
        // Fallback demo check
        const isDemoLoggedIn = localStorage.getItem('admin_demo_session') === 'true';
        if (mounted) setIsAuthenticated(isDemoLoggedIn);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          if (mounted) setIsAuthenticated(false);
          return;
        }
        const isAdmin = await isCurrentUserAdmin();
        if (!isAdmin) {
          await supabase.auth.signOut();
        }
        if (mounted) setIsAuthenticated(isAdmin);
      } catch (err) {
        console.error('Session check failed:', err);
        if (mounted) setIsAuthenticated(false);
      }
    }

    checkAuth();

    if (isSupabaseConfigured) {
      // Only reacts to sign-out; sign-in is granted after the admin check in
      // AdminLogin / checkAuth, never just because a session exists.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (mounted && !session) {
          setIsAuthenticated(false);
        }
      });

      return () => {
        mounted = false;
        subscription.unsubscribe();
      };
    }

    return () => {
      mounted = false;
    };
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="admin-layout" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
          <div className="spinner" style={{ width: '32px', height: '32px' }} />
          <p style={{ color: '#9ca3af', fontSize: '0.9rem' }}>Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {isAuthenticated ? (
        <AdminDashboard onLogout={() => setIsAuthenticated(false)} />
      ) : (
        <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />
      )}
    </div>
  );
};

export default AdminRoute;
