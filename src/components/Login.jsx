import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createUser } from '../hooks/useData';

export default function Login({ onLogin }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    if (isLoginTab) {
      try {
        await onLogin(id, pw);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    } else {
      if (pw !== pwConfirm) {
        setError('비밀번호가 일치하지 않습니다.');
        setLoading(false);
        return;
      }
      if (pw.length < 4) {
        setError('비밀번호는 4자리 이상 입력해주세요.');
        setLoading(false);
        return;
      }
      try {
        await createUser(id, pw, 'user');
        setSuccessMsg('계정이 성공적으로 생성되었습니다! 자동 로그인 중...');
        setTimeout(() => {
          onLogin(id, pw).catch(err => {
            setError(err.message);
            setLoading(false);
          });
        }, 1000);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }
  };

  return (
    <div className="login-overlay" style={{ background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100vw' }}>
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '24px', padding: '40px', width: '90%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)' }}
      >
        <div className="login-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            style={{ fontSize: '48px', marginBottom: '16px' }}
          >
            💎
          </motion.div>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            {isLoginTab ? '내 가계부 시작하기' : '새 계정 만들기'}
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '6px' }}>
            {isLoginTab ? '자산 관리를 시작하세요' : '간편하게 가계부 계정을 만드세요'}
          </p>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '12px', marginBottom: '24px' }}>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', background: isLoginTab ? 'var(--bg-card)' : 'transparent', color: isLoginTab ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: isLoginTab ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => { setIsLoginTab(true); setError(''); setSuccessMsg(''); }}
            type="button"
          >
            로그인
          </button>
          <button 
            style={{ flex: 1, padding: '10px', borderRadius: '10px', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s', background: !isLoginTab ? 'var(--bg-card)' : 'transparent', color: !isLoginTab ? 'var(--accent)' : 'var(--text-secondary)', boxShadow: !isLoginTab ? 'var(--shadow-sm)' : 'none' }}
            onClick={() => { setIsLoginTab(false); setError(''); setSuccessMsg(''); }}
            type="button"
          >
            회원가입
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {error && <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>{error}</div>}
          {successMsg && <div style={{ padding: '12px', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', borderRadius: '10px', fontSize: '13px', fontWeight: '600', textAlign: 'center' }}>{successMsg}</div>}
          
          <input 
            type="text" 
            className="tx-input" 
            placeholder="아이디 (한글, 영문, 숫자 모두 가능)" 
            value={id}
            onChange={(e) => setId(e.target.value.trim())}
            required
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '15px' }}
          />
          <input 
            type="password" 
            className="tx-input" 
            placeholder="비밀번호" 
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
            style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '15px' }}
          />

          <AnimatePresence>
            {!isLoginTab && (
              <motion.input 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                type="password" 
                className="tx-input" 
                placeholder="비밀번호 확인" 
                value={pwConfirm}
                onChange={(e) => setPwConfirm(e.target.value)}
                required
                style={{ padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '15px' }}
              />
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="tx-submit" 
            style={{ marginTop: '10px', width: '100%', height: '52px', fontSize: '16px', fontWeight: '700', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', borderRadius: '14px', border: 'none', boxShadow: '0 8px 20px var(--accent-glow)' }}
            disabled={loading}
          >
            {loading ? '처리 중...' : (isLoginTab ? '로그인' : '계정 생성')}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
