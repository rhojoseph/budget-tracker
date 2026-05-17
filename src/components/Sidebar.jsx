import React from 'react';
import { LayoutDashboard, Users, LogOut, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Sidebar({ currentView, onChangeView, onLogout, isAdmin }) {
  return (
    <aside className="sidebar" style={{ width: '280px', minWidth: '280px', background: 'var(--bg-sidebar)', borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', height: '100vh', zIndex: 100 }}>
      <div className="sidebar-header" style={{ padding: '28px 24px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="logo-icon" style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 20px var(--accent-glow)' }}>
            <Wallet size={24} />
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>내 가계부</span>
        </div>
      </div>

      <nav className="sidebar-nav" style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <button 
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onChangeView('dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', borderRadius: '16px', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', border: 'none', cursor: 'pointer', background: currentView === 'dashboard' ? 'linear-gradient(135deg, var(--accent), #818cf8)' : 'transparent', color: currentView === 'dashboard' ? '#fff' : 'var(--text-secondary)', boxShadow: currentView === 'dashboard' ? '0 8px 20px var(--accent-glow)' : 'none' }}
        >
          <LayoutDashboard size={20} /> 대시보드
        </button>
        {isAdmin && (
          <button 
            className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
            onClick={() => onChangeView('admin')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '16px 20px', borderRadius: '16px', fontSize: '15px', fontWeight: '700', transition: 'all 0.2s', border: 'none', cursor: 'pointer', background: currentView === 'admin' ? 'linear-gradient(135deg, var(--accent), #818cf8)' : 'transparent', color: currentView === 'admin' ? '#fff' : 'var(--text-secondary)', boxShadow: currentView === 'admin' ? '0 8px 20px var(--accent-glow)' : 'none' }}
          >
            <Users size={20} /> 관리자 패널
          </button>
        )}
      </nav>

      <div style={{ padding: '24px 20px', marginTop: 'auto', borderTop: '1px solid var(--border-color)' }}>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          style={{ width: '100%', padding: '16px', borderRadius: '16px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
        >
          <LogOut size={18} /> 로그아웃
        </motion.button>
      </div>
    </aside>
  );
}
