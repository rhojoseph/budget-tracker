import React from 'react';
import { LayoutDashboard, Users, LogOut, Download } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MobileNav({ currentView, onChangeView, onLogout, isAdmin, installPrompt, onInstall }) {
  return (
    <nav className="mobile-nav" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, height: '72px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-around', zIndex: 1000, paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <button 
        onClick={() => onChangeView('dashboard')}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: currentView === 'dashboard' ? 'var(--accent)' : 'var(--text-muted)' }}
      >
        <LayoutDashboard size={22} />
        <span style={{ fontSize: '11px', fontWeight: '700' }}>대시보드</span>
      </button>

      {isAdmin && (
        <button 
          onClick={() => onChangeView('admin')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: currentView === 'admin' ? 'var(--accent)' : 'var(--text-muted)' }}
        >
          <Users size={22} />
          <span style={{ fontSize: '11px', fontWeight: '700' }}>관리자</span>
        </button>
      )}

      {installPrompt && (
        <button 
          onClick={onInstall}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--income)' }}
        >
          <Download size={22} />
          <span style={{ fontSize: '11px', fontWeight: '700' }}>앱 설치</span>
        </button>
      )}

      <button 
        onClick={onLogout}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--danger)' }}
      >
        <LogOut size={22} />
        <span style={{ fontSize: '11px', fontWeight: '700' }}>로그아웃</span>
      </button>
    </nav>
  );
}
