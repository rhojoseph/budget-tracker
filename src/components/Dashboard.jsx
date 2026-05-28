import React, { useState } from 'react';
import { useTransactions, useBudget, formatMoneyFull, getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Target, Zap, TrendingUp, DollarSign, Calendar, Edit3, Trash2, Plus, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Dashboard({ userId }) {
  const { transactions, loading, addTransaction, deleteTransaction } = useTransactions(userId);
  const { budget, updateBudget } = useBudget(userId);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>데이터를 불러오는 중...</div>;

  // Filter transactions by year and month
  const filteredTransactions = transactions.filter(t => {
    if (!t.date) return false;
    const tDate = new Date(t.date);
    return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.date) - new Date(a.date));

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
  const budgetPct = budget > 0 ? Math.min(100, Math.round((expense / budget) * 100)) : 0;

  // Chart data
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({
    name: `${i + 1}일`,
    income: 0,
    expense: 0
  }));
  
  filteredTransactions.forEach(t => {
    const day = new Date(t.date).getDate() - 1;
    if (day >= 0 && day < daysInMonth) {
      if (t.type === 'income') dailyData[day].income += t.amount;
      else dailyData[day].expense += t.amount;
    }
  });

  const catTotals = {};
  filteredTransactions.filter(t => t.type === 'expense').forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const pieData = Object.entries(catTotals).map(([name, value]) => ({
    name, value,
    color: getCategoryInfo('expense', name).color,
    info: getCategoryInfo('expense', name)
  })).sort((a,b) => b.value - a.value);

  const highestCat = pieData[0];

  const handleEditBudget = () => {
    const res = prompt('이번 달 목표 예산(원)을 설정하세요:', budget);
    const parsed = parseInt(res?.replace(/[^\d]/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      updateBudget(parsed);
    }
  };

  return (
    <div style={{ padding: '32px', paddingBottom: '100px', overflowY: 'auto', height: '100%', background: 'var(--bg-primary)' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            자산 대시보드
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)' }}>
              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(y => y - 1);
                  } else {
                    setCurrentMonth(m => m - 1);
                  }
                }}
                style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronLeft size={16} />
              </motion.button>
              
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', padding: '0 12px', minWidth: '90px', textAlign: 'center' }}>
                {currentYear}년 {currentMonth + 1}월
              </span>

              <motion.button 
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(y => y + 1);
                  } else {
                    setCurrentMonth(m => m + 1);
                  }
                }}
                style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <ChevronRight size={16} />
              </motion.button>
            </div>
            
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              자산 흐름과 스마트 분석
            </span>
          </div>
        </div>
        <motion.button 
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => setModalOpen(true)}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', borderRadius: '16px', fontWeight: '700', fontSize: '15px', border: 'none', boxShadow: '0 8px 20px var(--accent-glow)', cursor: 'pointer' }}
        >
          <Plus size={18} />
          내역 추가
        </motion.button>
      </header>

      {/* Target Budget Alert / Progress Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px 30px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={22} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>이번 달 목표 예산 진행률</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {formatMoneyFull(expense)} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>/ {formatMoneyFull(budget)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleEditBudget}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border-color)', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Edit3 size={14} /> 예산 설정
          </button>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${budgetPct}%` }}
            transition={{ duration: 1, type: 'spring' }}
            style={{ height: '100%', background: budgetPct > 90 ? 'var(--danger)' : (budgetPct > 70 ? 'var(--warning)' : 'var(--success)'), borderRadius: '10px' }}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '13px', fontWeight: '600' }}>
          <span style={{ color: budgetPct > 90 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {budgetPct}% 사용됨 {budgetPct > 90 && '🚨 (예산 초과 위험!)'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>
            남은 예산: {formatMoneyFull(Math.max(0, budget - expense))}
          </span>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>총 수입</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--income)' }}>{formatMoneyFull(income)}</div>
          <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', fontWeight: '600' }}>+ 저축률 {savingsRate}%</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>총 지출</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--expense)' }}>{formatMoneyFull(expense)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>목표 예산 대비 {budgetPct}%</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '24px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>총 여유 자산 (잔액)</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>{formatMoneyFull(balance)}</div>
          <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px', fontWeight: '600' }}>재무 상태 양호 ✨</div>
        </motion.div>
      </div>

      {/* Smart Advice Panel (Premium Feature) */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        style={{ background: 'linear-gradient(135deg, #fff, #f8fafc)', border: '1px solid var(--accent)', borderRadius: '22px', padding: '26px 30px', marginBottom: '28px', boxShadow: '0 12px 35px rgba(99,102,241,0.1)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: '800', fontSize: '16px', marginBottom: '14px' }}>
          <Zap size={20} /> 스마트 재무 조언 (AI Insights)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--text-primary)', lineHeight: '1.6' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'var(--bg-tertiary)', fontWeight: '700', color: 'var(--accent)' }}>저축 건강</span>
            <span>이번 달 총 수입 중 <strong>{savingsRate}%</strong>를 저축할 수 있습니다. 권장 저축률(40%)을 향해 조금 더 관리해보세요!</span>
          </div>
          {highestCat && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(225,29,72,0.1)', fontWeight: '700', color: 'var(--expense)' }}>지출 분석</span>
              <span>가장 지출이 많은 분야는 <strong>{highestCat.info.emoji} {highestCat.name} ({Math.round((highestCat.value/expense)*100)}%)</strong> 입니다. {highestCat.name} 예산을 10%만 절감해도 {formatMoneyFull(Math.round(highestCat.value * 0.1))}원을 추가 저축할 수 있습니다!</span>
            </div>
          )}
          {budgetPct > 85 ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--danger)' }}>
              <AlertCircle size={18} /> <strong>경고:</strong> 예산 소진 속도가 매우 빠릅니다. 월말까지 지출을 통제하시길 강력 권장합니다.
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--success)' }}>
              <TrendingUp size={18} /> <strong>양호:</strong> 훌륭한 예산 통제력을 보여주고 계십니다! 안정적인 재무 흐름 유지 중입니다.
            </div>
          )}
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '28px' }}>
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--accent)" /> 일별 지출 및 수입 흐름
          </h3>
          <div style={{ height: '260px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData}>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{fill: 'rgba(0,0,0,0.03)'}} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }} />
                <Bar dataKey="income" fill="var(--income)" radius={[6,6,0,0]} />
                <Bar dataKey="expense" fill="var(--expense)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Ranking List */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarSign size={18} color="var(--expense)" /> 카테고리 지출 랭킹
          </h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pieData.length === 0 ? <div className="empty-state">지출 내역이 없습니다</div> : (
              pieData.map(c => {
                const pct = Math.round((c.value / expense) * 100);
                return (
                  <div key={c.name} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '14px', fontWeight: '600' }}>
                      <span style={{ color: 'var(--text-primary)' }}>{c.info.emoji} {c.name}</span>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>{formatMoneyFull(c.value)} ({pct}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '8px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: c.color, borderRadius: '6px' }}
                      />
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent TX List */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px' }}>최근 거래 내역</h3>
        <div className="tx-list" style={{ marginTop: '15px' }}>
          <AnimatePresence>
            {sortedTransactions.length === 0 ? <div className="empty-state">기록된 내역이 없습니다.</div> : (
              sortedTransactions.slice(0, 15).map((t, i) => {
                const info = getCategoryInfo(t.type, t.category);
                return (
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.03 }}
                    key={t.id} 
                    className="tx-item"
                    style={{ cursor: 'default', background: 'var(--bg-tertiary)', marginBottom: '8px', borderRadius: '16px', padding: '16px 20px', border: '1px solid rgba(0,0,0,0.02)' }}
                  >
                    <div className={`tx-icon ${t.type}-icon`} style={{ fontSize: '22px', width: '44px', height: '44px' }}>{info.emoji}</div>
                    <div className="tx-info">
                      <div className="tx-memo" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.memo || info.name}</div>
                      <div className="tx-category" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{info.name}</div>
                    </div>
                    <div className="tx-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div className={`tx-amount ${t.type}`} style={{ fontSize: '16px', fontWeight: '800' }}>
                          {t.type==='income'?'+':'-'}{formatMoneyFull(t.amount)}
                        </div>
                        <div className="tx-date" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t.date}</div>
                      </div>
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none', borderRadius: '12px', cursor: 'pointer' }}
                        title="내역 삭제"
                        onClick={(e) => { e.stopPropagation(); if(confirm('이 내역을 삭제하시겠습니까?')) deleteTransaction(t.id); }}
                      >
                        <Trash2 size={16} />
                      </motion.button>
                    </div>
                  </motion.div>
                )
              })
            )}
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
    if(!amount || !date) return alert('금액과 날짜를 입력하세요.');
    await onSave({
      type, amount: parseInt(amount.replace(/[^\d]/g, ''), 10), memo, category, date
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="modal-content" 
        onClick={e=>e.stopPropagation()}
        style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>새 자산 내역 추가</h3>
          <button onClick={onClose} style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}>✕</button>
        </div>
        
        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
          <button 
            type="button" 
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', background: type === 'expense' ? 'var(--expense)' : 'transparent', color: type === 'expense' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => { setType('expense'); setCategory('food'); }}
          >
            지출
          </button>
          <button 
            type="button" 
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', background: type === 'income' ? 'var(--income)' : 'transparent', color: type === 'income' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => { setType('income'); setCategory('salary'); }}
          >
            수입
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>금액</label>
            <input 
              type="text" 
              placeholder="0 원" 
              value={amount}
              onChange={e => {
                let v = e.target.value.replace(/[^\d]/g, '');
                setAmount(v ? Number(v).toLocaleString() : '');
              }}
              style={{ width: '100%', padding: '16px 20px', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>카테고리</label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <button 
                  type="button"
                  key={c.id} 
                  style={{ padding: '10px 16px', borderRadius: '14px', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s', background: category === c.id ? (type === 'expense' ? 'var(--expense)' : 'var(--income)') : 'var(--bg-tertiary)', color: category === c.id ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => setCategory(c.id)}
                >
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>날짜</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{ width: '100%', padding: '14px 18px', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px' }} />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>메모 (선택)</label>
            <input type="text" placeholder="어디에 사용하셨나요?" value={memo} onChange={e=>setMemo(e.target.value)} style={{ width: '100%', padding: '14px 18px', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '700', fontSize: '15px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>취소</button>
          <button type="button" onClick={handleSave} style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '700', fontSize: '15px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', border: 'none', boxShadow: '0 8px 20px var(--accent-glow)', cursor: 'pointer' }}>내역 추가</button>
        </div>
      </motion.div>
    </div>
  )
}
