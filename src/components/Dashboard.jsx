import React, { useState } from 'react';
import { useTransactions, useBudget, useCategoryBudgets, useFixedExpenses, formatMoneyFull, getCategoryInfo, EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useData';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Target, Zap, TrendingUp, DollarSign, Calendar, Edit3, Trash2, Plus, ChevronLeft, ChevronRight, FileSpreadsheet, Camera, RefreshCw, Settings, CreditCard } from 'lucide-react';
import ExcelImport from './ExcelImport';
import OCRCapture from './OCRCapture';
import BudgetSettings from './BudgetSettings';
import FixedExpenses from './FixedExpenses';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PAYMENT_METHODS = ['현금', '국민카드', '신한카드', '하나카드', '삼성카드', '현대카드', '카카오페이', '토스', '네이버페이', '기타'];

export default function Dashboard({ userId }) {
  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions(userId);
  const { budget, updateBudget } = useBudget(userId);
  const { catBudgets, updateCatBudgets } = useCategoryBudgets(userId);
  const { fixedExpenses, saveFixedExpenses } = useFixedExpenses(userId);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [excelOpen, setExcelOpen] = useState(false);
  const [ocrOpen, setOcrOpen] = useState(false);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [fixedOpen, setFixedOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [txTab, setTxTab] = useState('all');
  const [showAllTx, setShowAllTx] = useState(false);
  const [cardFilter, setCardFilter] = useState(null);

  if (loading) return <div style={{ padding: '40px', color: 'var(--text-secondary)' }}>데이터를 불러오는 중...</div>;

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

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dailyData = Array.from({ length: daysInMonth }, (_, i) => ({ name: `${i + 1}일`, income: 0, expense: 0 }));
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
  })).sort((a, b) => b.value - a.value);

  const fixedTotal = fixedExpenses.filter(f => f.active).reduce((s, f) => s + f.amount, 0);

  // 카드/계좌 목록 (이번 달 사용된 것)
  const usedCards = [...new Set(filteredTransactions.filter(t => t.paymentMethod).map(t => t.paymentMethod))];

  const fetchAiInsights = async () => {
    if (!GEMINI_KEY || aiLoading) return;
    setAiLoading(true);
    try {
      const catSummary = pieData.map(c => `${c.info?.name || c.name}:${c.value.toLocaleString()}원`).join(', ');
      const prompt = `한국어로 답하세요. 아래는 사용자의 이번 달 가계부 데이터입니다.
수입: ${income.toLocaleString()}원 / 지출: ${expense.toLocaleString()}원 / 잔액: ${balance.toLocaleString()}원
저축률: ${savingsRate}% / 목표예산 대비: ${budgetPct}% / 고정비: ${fixedTotal.toLocaleString()}원
카테고리별 지출: ${catSummary || '없음'}

3개의 짧고 구체적인 재무 인사이트를 JSON 배열로만 반환해주세요 (다른 텍스트 없이):
[{"type":"warning|success|tip","title":"짧은 제목","message":"1-2문장 조언"}]`;

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\[[\s\S]*\]/);
      if (match) setAiInsights(JSON.parse(match[0]));
    } catch (e) {
      console.error('Gemini error:', e);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', paddingBottom: '100px', overflowY: 'auto', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>자산 대시보드</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '4px', border: '1px solid var(--border-color)' }}>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }}
                style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronLeft size={16} />
              </motion.button>
              <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', padding: '0 12px', minWidth: '90px', textAlign: 'center' }}>
                {currentYear}년 {currentMonth + 1}월
              </span>
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }}
                style={{ padding: '6px', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRight size={16} />
              </motion.button>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setBudgetOpen(true)} style={btnSecondary}><Settings size={14} /> 예산 설정</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setFixedOpen(true)} style={btnSecondary}><RefreshCw size={14} /> 고정비</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setOcrOpen(true)} style={btnSecondary}><Camera size={14} /> 문자 캡처</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setExcelOpen(true)} style={btnSecondary}><FileSpreadsheet size={14} /> 엑셀 가져오기</motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => { setEditingTx(null); setModalOpen(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', borderRadius: '16px', fontWeight: '700', fontSize: '15px', border: 'none', boxShadow: '0 8px 20px var(--accent-glow)', cursor: 'pointer' }}>
            <Plus size={18} /> 내역 추가
          </motion.button>
        </div>
      </header>

      {/* 1. 요약 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '28px' }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={card}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>총 수입</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--income)' }}>{formatMoneyFull(income)}</div>
          <div style={{ fontSize: '12px', color: 'var(--success)', marginTop: '8px', fontWeight: '600' }}>+ 저축률 {savingsRate}%</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} style={card}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>총 지출</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--expense)' }}>{formatMoneyFull(expense)}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>목표 대비 {budgetPct}%</div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={card}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>잔액</div>
          <div style={{ fontSize: '24px', fontWeight: '800', color: 'var(--accent)' }}>{formatMoneyFull(balance)}</div>
          <div style={{ fontSize: '12px', color: 'var(--accent)', marginTop: '8px', fontWeight: '600' }}>재무 상태 양호 ✨</div>
        </motion.div>
      </div>

      {/* 2. 카테고리 지출 랭킹 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DollarSign size={18} color="var(--expense)" /> 카테고리별 지출 랭킹
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {pieData.length === 0 ? <div className="empty-state" style={{ padding: '20px 0' }}>지출 내역이 없습니다</div> : (
            pieData.map(c => {
              const catBudget = catBudgets[c.name];
              const budgetPctCat = catBudget ? Math.min(Math.round((c.value / catBudget) * 100), 100) : null;
              const isOver = catBudget && c.value > catBudget;
              const barColor = isOver ? 'var(--danger)' : (budgetPctCat > 80 ? 'var(--warning)' : c.color);
              return (
                <div key={c.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px', fontWeight: '600', marginBottom: 5 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{c.info.emoji} {c.info.name}</span>
                    <span style={{ color: isOver ? 'var(--danger)' : 'var(--text-secondary)', fontWeight: '700' }}>
                      {formatMoneyFull(c.value)}{catBudget ? ` / ${formatMoneyFull(catBudget)}` : ''}{isOver && ' 🚨'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '7px', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: catBudget ? `${budgetPctCat}%` : `${Math.round((c.value / expense) * 100)}%` }}
                      transition={{ duration: 0.8 }} style={{ height: '100%', background: barColor, borderRadius: '6px' }} />
                  </div>
                  {isOver && <p style={{ fontSize: 11, color: 'var(--danger)', fontWeight: 600, marginTop: 2 }}>예산 초과 {formatMoneyFull(c.value - catBudget)}</p>}
                </div>
              );
            })
          )}
          {Object.keys(catBudgets).length === 0 && pieData.length > 0 && (
            <button onClick={() => setBudgetOpen(true)} style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
              + 카테고리별 예산 설정하기
            </button>
          )}
        </div>
      </div>

      {/* 3. 거래 내역 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>거래 내역</h3>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { key: 'all', label: `전체 ${sortedTransactions.length}` },
              { key: 'expense', label: `지출 ${sortedTransactions.filter(t => t.type === 'expense').length}` },
              { key: 'income', label: `수입 ${sortedTransactions.filter(t => t.type === 'income').length}` },
            ].map(tab => (
              <button key={tab.key} onClick={() => { setTxTab(tab.key); setShowAllTx(false); setCardFilter(null); }}
                style={{ padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: '1px solid var(--border-color)', background: txTab === tab.key ? 'var(--accent)' : 'var(--bg-tertiary)', color: txTab === tab.key ? 'white' : 'var(--text-secondary)', transition: '0.15s' }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 카드/계좌 필터 */}
        {usedCards.length > 0 && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <button onClick={() => setCardFilter(null)}
              style={{ padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-color)', background: cardFilter === null ? 'var(--text-primary)' : 'var(--bg-tertiary)', color: cardFilter === null ? 'white' : 'var(--text-secondary)' }}>
              전체
            </button>
            {usedCards.map(card => (
              <button key={card} onClick={() => setCardFilter(card)}
                style={{ padding: '4px 12px', borderRadius: 16, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-color)', background: cardFilter === card ? 'var(--accent)' : 'var(--bg-tertiary)', color: cardFilter === card ? 'white' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CreditCard size={11} /> {card}
              </button>
            ))}
          </div>
        )}

        <div className="tx-list">
          <AnimatePresence>
            {(() => {
              let display = txTab === 'all' ? sortedTransactions : sortedTransactions.filter(t => t.type === txTab);
              if (cardFilter) display = display.filter(t => t.paymentMethod === cardFilter);
              const total = display.length;
              const shown = showAllTx ? display : display.slice(0, 30);
              if (total === 0) return <div className="empty-state">{txTab === 'expense' ? '지출 내역이 없습니다.' : txTab === 'income' ? '수입 내역이 없습니다.' : '기록된 내역이 없습니다.'}</div>;
              return (
                <>
                  {shown.map((t, i) => {
                    const info = getCategoryInfo(t.type, t.category);
                    return (
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: i * 0.02 }}
                        key={t.id}
                        className="tx-item"
                        style={{ cursor: 'default', background: 'var(--bg-tertiary)', marginBottom: '8px', borderRadius: '16px', padding: '14px 16px', border: '1px solid rgba(0,0,0,0.02)' }}
                      >
                        <div className={`tx-icon ${t.type}-icon`} style={{ fontSize: '20px', width: '40px', height: '40px', flexShrink: 0 }}>{info.emoji}</div>
                        <div className="tx-info" style={{ flex: 1, minWidth: 0 }}>
                          <div className="tx-memo" style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{t.description || t.memo || info.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: 2 }}>
                            {info.name}
                            {t.paymentMethod && <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 8, background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', fontWeight: 600 }}>{t.paymentMethod}</span>}
                            {t.memo && t.description ? ` · ${t.memo}` : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div className={`tx-amount ${t.type}`} style={{ fontSize: '15px', fontWeight: '800' }}>
                              {t.type === 'income' ? '+' : '-'}{formatMoneyFull(t.amount)}
                            </div>
                            <div className="tx-date" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.date}</div>
                          </div>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            style={{ padding: '7px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                            title="내역 수정"
                            onClick={(e) => { e.stopPropagation(); setEditingTx(t); setModalOpen(true); }}>
                            <Edit3 size={14} />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            style={{ padding: '7px', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                            title="내역 삭제"
                            onClick={(e) => { e.stopPropagation(); if (confirm('이 내역을 삭제하시겠습니까?')) deleteTransaction(t.id); }}>
                            <Trash2 size={14} />
                          </motion.button>
                        </div>
                      </motion.div>
                    );
                  })}
                  {!showAllTx && total > 30 && (
                    <button onClick={() => setShowAllTx(true)}
                      style={{ width: '100%', padding: '12px', marginTop: 8, borderRadius: 12, border: '1px dashed var(--border-color)', background: 'transparent', color: 'var(--accent)', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                      전체 보기 ({total}건 중 30건 표시 중)
                    </button>
                  )}
                </>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>

      {/* 4. 예산 진행률 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px 30px', marginBottom: '24px', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(99,102,241,0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Target size={22} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-muted)' }}>이번 달 목표 예산</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>
                {formatMoneyFull(expense)} <span style={{ fontSize: '15px', color: 'var(--text-muted)', fontWeight: '500' }}>/ {formatMoneyFull(budget)}</span>
              </div>
            </div>
          </div>
          <button onClick={() => setBudgetOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '12px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: '600', border: '1px solid var(--border-color)', cursor: 'pointer' }}>
            <Edit3 size={14} /> 예산 설정
          </button>
        </div>
        <div style={{ width: '100%', height: '14px', background: 'var(--bg-tertiary)', borderRadius: '10px', overflow: 'hidden' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${budgetPct}%` }} transition={{ duration: 1, type: 'spring' }}
            style={{ height: '100%', background: budgetPct > 90 ? 'var(--danger)' : (budgetPct > 70 ? 'var(--warning)' : 'var(--success)'), borderRadius: '10px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '13px', fontWeight: '600' }}>
          <span style={{ color: budgetPct > 90 ? 'var(--danger)' : 'var(--text-secondary)' }}>
            {budgetPct}% 사용됨 {budgetPct > 90 && '🚨'}
          </span>
          <span style={{ color: 'var(--text-muted)' }}>남은 예산: {formatMoneyFull(Math.max(0, budget - expense))}</span>
        </div>
      </motion.div>

      {/* 5. 일별 흐름 차트 */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '26px', boxShadow: 'var(--shadow-md)', marginBottom: '28px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--accent)" /> 일별 지출 및 수입 흐름
        </h3>
        <div style={{ height: '240px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData}>
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', fontSize: 13 }}
                formatter={(value, name) => [`${value.toLocaleString()}원`, name === 'income' ? '수입' : '지출']} />
              <Bar dataKey="income" name="수입" fill="var(--income)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="expense" name="지출" fill="var(--expense)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. Gemini AI 인사이트 */}
      <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: 'linear-gradient(135deg, #fafbff, #f0f4ff)', border: '1px solid var(--accent)', borderRadius: '22px', padding: '24px 28px', marginBottom: '28px', boxShadow: '0 8px 25px rgba(99,102,241,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent)', fontWeight: 800, fontSize: 16 }}>
            <Zap size={20} /> Gemini AI 재무 인사이트
          </div>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={fetchAiInsights}
            disabled={aiLoading || !GEMINI_KEY}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 10, background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: 13, border: 'none', cursor: GEMINI_KEY ? 'pointer' : 'not-allowed', opacity: GEMINI_KEY ? 1 : 0.4 }}>
            <RefreshCw size={13} style={{ animation: aiLoading ? 'spin 1s linear infinite' : 'none' }} />
            {aiLoading ? '분석 중...' : '분석하기'}
          </motion.button>
        </div>
        {!GEMINI_KEY && <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>.env 파일에 VITE_GEMINI_API_KEY를 설정하면 AI 분석을 사용할 수 있어요.</p>}
        {aiInsights ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {aiInsights.map((ins, i) => {
              const colors = { warning: { bg: 'rgba(245,158,11,0.1)', txt: '#d97706', label: '⚠️ 주의' }, success: { bg: 'rgba(5,150,105,0.1)', txt: 'var(--income)', label: '✅ 양호' }, tip: { bg: 'rgba(99,102,241,0.08)', txt: 'var(--accent)', label: '💡 팁' } };
              const c = colors[ins.type] || colors.tip;
              return (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', background: c.bg, borderRadius: 12, padding: '12px 14px' }}>
                  <span style={{ fontSize: 12, fontWeight: 800, color: c.txt, whiteSpace: 'nowrap', paddingTop: 1 }}>{c.label}</span>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{ins.title}</p>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{ins.message}</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : !aiLoading && GEMINI_KEY ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <TrendingUp size={16} color="var(--income)" />
              <span>저축률 <strong style={{ color: 'var(--income)' }}>{savingsRate}%</strong> {savingsRate >= 40 ? '— 권장 저축률 달성!' : `— 권장 40%까지 ${40 - savingsRate}%p 남았어요`}</span>
            </div>
            {budgetPct > 85 && <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--danger)' }}><AlertCircle size={16} /><span>예산의 {budgetPct}% 소진 — 지출 주의 필요</span></div>}
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>"분석하기" 버튼을 누르면 Gemini가 맞춤 인사이트를 드려요.</p>
          </div>
        ) : null}
      </motion.div>

      {/* 7. 고정비 현황 (맨 아래) */}
      {fixedExpenses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '24px 28px', marginBottom: '28px', boxShadow: 'var(--shadow-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={17} color="var(--accent)" /> 월 고정비 현황
            </h3>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>예정 합계</span>
              <p style={{ fontWeight: 800, fontSize: 18, color: 'var(--expense)' }}>{formatMoneyFull(fixedTotal)}</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10 }}>
            {fixedExpenses.filter(f => f.active).map(f => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === f.category);
              return (
                <div key={f.id} style={{ padding: '12px 14px', borderRadius: 12, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{cat?.emoji || '📦'}</div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{f.name}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>매월 {f.dayOfMonth}일</p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--expense)' }}>{formatMoneyFull(f.amount)}</p>
                </div>
              );
            })}
          </div>
          <button onClick={() => setFixedOpen(true)} style={{ marginTop: 12, fontSize: 12, color: 'var(--accent)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>+ 고정비 관리</button>
        </motion.div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {modalOpen && (
          <TxModal
            onClose={() => { setModalOpen(false); setEditingTx(null); }}
            onSave={addTransaction}
            onUpdate={updateTransaction}
            initialData={editingTx}
          />
        )}
      </AnimatePresence>
      {excelOpen && <ExcelImport onClose={() => setExcelOpen(false)} onSave={addTransaction} />}
      {ocrOpen && <OCRCapture onClose={() => setOcrOpen(false)} onSave={addTransaction} />}
      {budgetOpen && <BudgetSettings totalBudget={budget} catBudgets={catBudgets} onSaveTotal={updateBudget} onSaveCat={updateCatBudgets} onClose={() => setBudgetOpen(false)} />}
      {fixedOpen && <FixedExpenses fixedExpenses={fixedExpenses} onSave={saveFixedExpenses} onClose={() => setFixedOpen(false)} />}
    </div>
  );
}

const card = { background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '22px', padding: '24px', boxShadow: 'var(--shadow-md)' };
const btnSecondary = { display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 14px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', borderRadius: '12px', fontWeight: '600', fontSize: '13px', border: '1px solid var(--border-color)', cursor: 'pointer' };

function TxModal({ onClose, onSave, onUpdate, initialData }) {
  const isEdit = !!initialData;
  const [type, setType] = useState(initialData?.type || 'expense');
  const [amount, setAmount] = useState(initialData?.amount ? initialData.amount.toLocaleString() : '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [memo, setMemo] = useState(initialData?.memo || '');
  const [category, setCategory] = useState(initialData?.category || 'food');
  const [date, setDate] = useState(initialData?.date || new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState(initialData?.paymentMethod || '');

  const handleSave = async () => {
    if (!amount || !date) return alert('금액과 날짜를 입력하세요.');
    const payload = { type, amount: parseInt(amount.replace(/[^\d]/g, ''), 10), description, memo, category, date, paymentMethod };
    if (isEdit) {
      await onUpdate(initialData.id, payload);
    } else {
      await onSave(payload);
    }
    onClose();
  };

  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border-color)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)' }}>{isEdit ? '내역 수정' : '새 내역 추가'}</h3>
          <button onClick={onClose} style={{ background: 'var(--bg-tertiary)', padding: '8px', borderRadius: '12px', color: 'var(--text-secondary)', fontWeight: '700', fontSize: '14px', cursor: 'pointer', border: 'none' }}>✕</button>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '14px', marginBottom: '24px' }}>
          <button type="button"
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', background: type === 'expense' ? 'var(--expense)' : 'transparent', color: type === 'expense' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => { setType('expense'); setCategory('food'); }}>지출</button>
          <button type="button"
            style={{ flex: 1, padding: '12px', borderRadius: '12px', fontWeight: '700', fontSize: '14px', transition: 'all 0.2s', background: type === 'income' ? 'var(--income)' : 'transparent', color: type === 'income' ? '#fff' : 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}
            onClick={() => { setType('income'); setCategory('salary'); }}>수입</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={lbl}>금액</label>
            <input type="text" placeholder="0 원" value={amount}
              onChange={e => { let v = e.target.value.replace(/[^\d]/g, ''); setAmount(v ? Number(v).toLocaleString() : ''); }}
              style={{ width: '100%', padding: '16px 20px', fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '16px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={lbl}>카테고리</label>
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
              {(type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES).map(c => (
                <button type="button" key={c.id}
                  style={{ padding: '9px 14px', borderRadius: '14px', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s', background: category === c.id ? (type === 'expense' ? 'var(--expense)' : 'var(--income)') : 'var(--bg-tertiary)', color: category === c.id ? '#fff' : 'var(--text-secondary)', border: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => setCategory(c.id)}>
                  {c.emoji} {c.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={lbl}>날짜</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={lbl}>사용처 / 내용</label>
            <input type="text" placeholder="예: 스타벅스, 마트, 월급" value={description} onChange={e => setDescription(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={lbl}>카드 / 계좌 (선택)</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
              {PAYMENT_METHODS.map(pm => (
                <button type="button" key={pm}
                  style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid var(--border-color)', background: paymentMethod === pm ? 'var(--accent)' : 'var(--bg-tertiary)', color: paymentMethod === pm ? 'white' : 'var(--text-secondary)', transition: '0.15s' }}
                  onClick={() => setPaymentMethod(paymentMethod === pm ? '' : pm)}>
                  {pm}
                </button>
              ))}
            </div>
            <input type="text" placeholder="직접 입력 (예: 우리카드)" value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', fontSize: '14px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxSizing: 'border-box' }} />
          </div>

          <div>
            <label style={lbl}>메모 (선택)</label>
            <input type="text" placeholder="추가 메모" value={memo} onChange={e => setMemo(e.target.value)}
              style={{ width: '100%', padding: '14px 18px', fontSize: '15px', color: 'var(--text-primary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', borderRadius: '14px', boxSizing: 'border-box' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
          <button type="button" onClick={onClose} style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '700', fontSize: '15px', background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: 'none', cursor: 'pointer' }}>취소</button>
          <button type="button" onClick={handleSave} style={{ flex: 1, padding: '16px', borderRadius: '16px', fontWeight: '700', fontSize: '15px', background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: '#fff', border: 'none', boxShadow: '0 8px 20px var(--accent-glow)', cursor: 'pointer' }}>
            {isEdit ? '수정 완료' : '내역 추가'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

const lbl = { fontSize: '13px', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' };
