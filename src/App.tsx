import React, { useState, useEffect } from 'react';
import DateInvitation from './components/DateInvitation';
import AdminRoute from './components/admin/AdminRoute';

export const App: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    // Check path or search/hash for spa redirects
    const path = window.location.pathname.toLowerCase();
    return path;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname.toLowerCase());
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Admin route check
  if (currentPath.startsWith('/admin')) {
    return <AdminRoute />;
  }

  // Public Invitation route
  return <DateInvitation />;
};

export default App;
