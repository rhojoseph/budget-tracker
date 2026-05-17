import React, { useState, useEffect } from 'react';
import { getAllUsers, createUser, updateUserPassword, deleteUserAccount } from '../hooks/useData';
import { UserPlus, KeyRound, Trash2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [newId, setNewId] = useState('');
  const [newPw, setNewPw] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
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
    setLoading(true);
    try {
      await createUser(newId, newPw);
      setNewId('');
      setNewPw('');
      setError('');
      loadUsers();
      alert('성공적으로 가입/생성되었습니다.');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (id) => {
    const pw = prompt(`${id} 계정의 새 비밀번호를 입력하세요:`);
    if(pw) {
      await updateUserPassword(id, pw);
      alert('비밀번호가 변경되었습니다.');
    }
  };

  const handleDelete = async (id) => {
    if(confirm(`정말 ${id} 계정을 영구 삭제하시겠습니까?`)) {
      await deleteUserAccount(id);
      loadUsers();
    }
  };

  return (
    <div style={{ padding: '32px', overflowY: 'auto', height: '100%', background: 'var(--bg-primary)' }}>
      <header style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>관리자 패널</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>가입된 모든 계정의 정보 조회 및 관리</p>
      </header>
      
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '28px', marginBottom: '28px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={20} color="var(--accent)" /> 새 사용자 계정 강제 등록
        </div>
        <div style={{ display: 'flex', gap: '14px' }}>
          <input className="tx-input" placeholder="아이디" value={newId} onChange={e=>setNewId(e.target.value.trim())} style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: '15px' }} />
          <input className="tx-input" type="password" placeholder="비밀번호" value={newPw} onChange={e=>setNewPw(e.target.value)} style={{ flex: 1, padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', fontSize: '15px' }} />
          <motion.button whileHover={{scale:1.02}} whileTap={{scale:0.98}} disabled={loading} onClick={handleCreate} style={{ padding: '0 28px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', borderRadius: '14px', border: 'none', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 8px 20px var(--accent-glow)' }}>
            {loading ? '생성 중...' : '계정 생성'}
          </motion.button>
        </div>
        {error && <div style={{ color: 'var(--danger)', marginTop: '12px', fontSize: '13px', fontWeight: '600' }}>{error}</div>}
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '28px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={20} color="var(--income)" /> 등록된 전체 사용자 목록 ({users.length}명)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {users.map(u => (
            <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', background: 'var(--bg-tertiary)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: u.role === 'admin' ? 'rgba(99,102,241,0.1)' : 'rgba(5,150,105,0.1)', color: u.role === 'admin' ? 'var(--accent)' : 'var(--income)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>
                  {u.role === 'admin' ? '👑' : '👤'}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{u.id}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px', fontWeight: '500' }}>권한: {u.role === 'admin' ? '최고 관리자' : '일반 사용자'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button onClick={() => handleReset(u.id)} style={{ padding: '10px 16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <KeyRound size={15} /> 비밀번호 변경
                </button>
                {u.id !== 'admin' && (
                  <button onClick={() => handleDelete(u.id)} style={{ padding: '10px 16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', color: 'var(--danger)', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                    <Trash2 size={15} /> 계정 삭제
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
