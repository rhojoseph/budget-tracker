import React, { useState } from 'react';
import { useTransactions, formatMoneyFull, getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard({ userId }) {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions(userId);
  const [modalOpen, setModalOpen] = useState(false);

  if (loading) return <div style={{ padding: '40px', color: '#fff' }}>데이터를 불러오는 중...</div>;

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;

  // Chart data
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    name: `${i + 1}일`,
    income: 0,
    expense: 0
  }));
  
  transactions.forEach(t => {
    const day = new Date(t.date).getDate() - 1;
    if (t.type === 'income') dailyData[day].income += t.amount;
    else dailyData[day].expense += t.amount;
  });

  const catTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(catTotals).map(([name, value]) => ({
    name, value,
    color: getCategoryInfo('expense', name).color
  })).sort((a,b) => b.value - a.value);

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <header className="header">
        <h1 id="page-title">대시보드</h1>
        <div style={{ flex: 1 }}></div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="add-btn" 
          onClick={() => setModalOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          내역 추가
        </motion.button>
      </header>

      <div className="summary-cards" style={{ marginTop: '20px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="summary-card income-card">
          <div className="label">총 수입</div>
          <div className="amount">{formatMoneyFull(income)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="summary-card expense-card">
          <div className="label">총 지출</div>
          <div className="amount">{formatMoneyFull(expense)}</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="summary-card balance-card">
          <div className="label">잔액</div>
          <div className="amount">{formatMoneyFull(balance)}</div>
        </motion.div>
      </div>

      <div className="dashboard-grid" style={{ marginTop: '20px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="card">
          <div className="card-title">일별 흐름</div>
          <div style={{ height: '250px', marginTop: '20px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="name" stroke="#636e72" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px' }} />
                <Bar dataKey="income" fill="var(--income)" radius={[4,4,0,0]} />
                <Bar dataKey="expense" fill="var(--expense)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="card">
          <div className="card-title">카테고리별 지출</div>
          <div style={{ height: '250px', marginTop: '20px' }}>
            {pieData.length === 0 ? <div className="empty-state">지출 내역이 없습니다</div> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: 'none', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      </div>
      
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-title">최근 내역</div>
        <div className="tx-list" style={{ marginTop: '15px' }}>
          <AnimatePresence>
            {transactions.slice(0, 10).map((t, i) => {
              const info = getCategoryInfo(t.type, t.category);
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: i * 0.05 }}
                  key={t.id} 
                  className="tx-item" 
                  onClick={() => { if(confirm('삭제할까요?')) deleteTransaction(t.id) }}
                >
                  <div className={`tx-icon ${t.type}-icon`}>{info.emoji}</div>
                  <div className="tx-info">
                    <div className="tx-memo">{t.memo || info.name}</div>
                    <div className="tx-category">{info.name}</div>
                  </div>
                  <div className="tx-right">
                    <div className={`tx-amount ${t.type}`}>{t.type==='income'?'+':'-'}{formatMoneyFull(t.amount)}</div>
                    <div className="tx-date">{t.date}</div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && <TxModal onClose={() => setModalOpen(false)} onSave={addTransaction} />}
      </AnimatePresence>
    </div>
  );
}

function TxModal({ onClose, onSave }) {
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [category, setCategory] = useState('food');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const handleSave = async () => {
    if(!amount || !date) return alert('필수 입력 누락');
    await onSave({
      type, amount: parseInt(amount.replace(/[^\d]/g, ''), 10), memo, category, date
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex' }}>
      <motion.div 
        initial={{ y: 100, opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: 100, opacity: 0 }}
        className="modal-content" 
        onClick={e=>e.stopPropagation()}
        style={{ display: 'block' }}
      >
        <div className="modal-header">
          <h3>새 내역 추가</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="tx-type-toggle">
            <button className={`tx-type-btn ${type==='expense'?'active':''}`} onClick={()=>setType('expense')} style={{color: type==='expense'?'var(--expense)':'var(--text)'}}>지출</button>
            <button className={`tx-type-btn ${type==='income'?'active':''}`} onClick={()=>setType('income')} style={{color: type==='income'?'var(--income)':'var(--text)'}}>수입</button>
          </div>
          <div className="form-group">
            <label>금액</label>
            <input type="text" className="tx-input tx-amount-input" placeholder="0" value={amount} onChange={e => {
              let v = e.target.value.replace(/[^\d]/g, '');
              setAmount(v ? Number(v).toLocaleString() : '');
            }} />
          </div>
          <div className="form-group">
            <label>카테고리</label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <button 
                  key={c.id} 
                  className={`tx-cat-btn ${category === c.id ? 'active' : ''}`}
                  onClick={() => setCategory(c.id)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
            <input type="date" className="tx-input" value={date} onChange={e=>setDate(e.target.value)} style={{ marginTop: '15px' }} />
            <input type="text" className="tx-input" placeholder="메모 (선택)" value={memo} onChange={e=>setMemo(e.target.value)} style={{ marginTop: '15px' }} />
          </div>
        </div>
        <div className="modal-footer">
          <button className="reset-btn" onClick={onClose}>취소</button>
          <button className="tx-submit" onClick={handleSave}>추가</button>
        </div>
      </motion.div>
    </div>
  )
}
