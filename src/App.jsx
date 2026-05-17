import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';

export default function App() {
  const { currentUser, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [installPrompt, setInstallPrompt] = useState(null);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  if (!currentUser) {
    return <Login onLogin={login} />;
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentView={currentView} 
        onChangeView={setCurrentView} 
        onLogout={logout} 
        isAdmin={currentUser.role === 'admin'} 
        installPrompt={installPrompt}
        onInstall={handleInstallApp}
      />
      
      <main className="main-content">
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Dashboard userId={currentUser.id} />
            </motion.div>
          )}
          {currentView === 'admin' && currentUser.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%', height: '100%' }}
            >
              <Admin />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <MobileNav 
        currentView={currentView}
        onChangeView={setCurrentView}
        onLogout={logout}
        isAdmin={currentUser.role === 'admin'}
        installPrompt={installPrompt}
        onInstall={handleInstallApp}
      />
    </div>
  );
}
