import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function Login({ onLogin }) {
  const [id, setId] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onLogin(id, pw);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-overlay">
      <motion.div 
        className="login-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="login-header">
          <motion.div 
            initial={{ rotate: -180 }}
            animate={{ rotate: 0 }}
            transition={{ duration: 0.8, type: 'spring' }}
            style={{ fontSize: '48px', marginBottom: '10px' }}
          >
            💎
          </motion.div>
          <h2 style={{ background: 'linear-gradient(135deg, #fff, #a29bfe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            내 가계부 로그인
          </h2>
        </div>
        <form className="login-body" onSubmit={handleSubmit}>
          {error && <div style={{ color: 'var(--expense)', fontSize: '14px', textAlign: 'center' }}>{error}</div>}
          <input 
            type="text" 
            className="tx-input" 
            placeholder="아이디" 
            value={id}
            onChange={(e) => setId(e.target.value)}
            required
          />
          <input 
            type="password" 
            className="tx-input" 
            placeholder="비밀번호" 
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            required
          />
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit" 
            className="tx-submit" 
            style={{ marginTop: '20px', width: '100%', height: '48px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? '로그인 중...' : '로그인'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
