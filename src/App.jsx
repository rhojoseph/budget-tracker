import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './hooks/useData';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Admin from './components/Admin';
import Sidebar from './components/Sidebar';

export default function App() {
  const { currentUser, login, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

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
    </div>
  );
}
