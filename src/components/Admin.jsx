import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUserPassword, deleteUserAccount } from '../hooks/useData';
import { UserPlus, KeyRound, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [newId, setNewId] = useState('');
  const [newPw, setNewPw] = useState('');
  const [error, setError] = useState('');
  
  const loadUsers = async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch(e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    if(!newId || !newPw) return setError('아이디와 비밀번호를 입력하세요.');
    try {
      await createUser(newId, newPw);
      setNewId('');
      setNewPw('');
      setError('');
      loadUsers();
      alert('생성되었습니다.');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleReset = async (id) => {
    const pw = prompt(`${id}의 새 비밀번호:`);
    if(pw) {
      await updateUserPassword(id, pw);
      alert('변경 완료');
    }
  };

  const handleDelete = async (id) => {
    if(confirm(`정말 ${id} 계정을 삭제할까요?`)) {
      await deleteUserAccount(id);
      loadUsers();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <header className="header">
        <h1 id="page-title">관리자 패널</h1>
      </header>
      
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-title"><UserPlus size={18} /> 새 사용자 등록</div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <input className="tx-input" placeholder="아이디" value={newId} onChange={e=>setNewId(e.target.value)} />
          <input className="tx-input" type="password" placeholder="비밀번호" value={newPw} onChange={e=>setNewPw(e.target.value)} />
          <motion.button whileHover={{scale:1.05}} whileTap={{scale:0.95}} className="tx-submit" onClick={handleCreate} style={{ margin: 0, width: '120px' }}>계정 생성</motion.button>
        </div>
        {error && <div style={{ color: 'var(--expense)', marginTop: '10px' }}>{error}</div>}
      </div>

      <div className="card">
        <div className="card-title">등록된 사용자 목록</div>
        <div className="tx-list" style={{ marginTop: '15px' }}>
          {users.map(u => (
            <motion.div initial={{opacity:0, x:-20}} animate={{opacity:1, x:0}} key={u.id} className="tx-item" style={{ cursor: 'default' }}>
              <div className="tx-icon expense-icon">👤</div>
              <div className="tx-info">
                <div className="tx-memo">{u.id}</div>
                <div className="tx-category">권한: {u.role === 'admin' ? '관리자' : '일반 사용자'}</div>
              </div>
              <div className="tx-right" style={{ gap: '8px', alignItems: 'center' }}>
                <button className="tx-submit" style={{ padding: '6px 12px', margin: 0, display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => handleReset(u.id)}>
                  <KeyRound size={14} /> 변경
                </button>
                {u.id !== 'admin' && (
                  <button className="reset-btn" style={{ padding: '6px 12px', margin: 0, background: 'rgba(225,112,85,0.15)', color: 'var(--expense)', border: 'none', borderRadius: '8px', display: 'flex', gap: '5px', alignItems: 'center' }} onClick={() => handleDelete(u.id)}>
                    <Trash2 size={14} /> 삭제
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
