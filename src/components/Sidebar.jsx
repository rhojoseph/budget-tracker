import React from 'react';
import { LayoutDashboard, Users, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ currentView, onChangeView, onLogout, isAdmin }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">💼</div>
          <span>내 가계부</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        <button 
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onChangeView('dashboard')}
        >
          <LayoutDashboard size={18} /> 대시보드
        </button>
        {isAdmin && (
          <button 
            className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => onChangeView('admin')}
          >
            <Users size={18} /> 관리자 패널
          </button>
        )}
      </nav>
      <div style={{ padding: '10px 20px', marginTop: 'auto' }}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="export-btn" 
          onClick={onLogout}
          style={{ width: '100%', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
        >
          <LogOut size={16} /> 로그아웃
        </motion.button>
      </div>
    </aside>
  );
}
