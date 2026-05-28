import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Target } from 'lucide-react';
import { EXPENSE_CATEGORIES } from '../hooks/useData';

export default function BudgetSettings({ totalBudget, catBudgets, onSaveTotal, onSaveCat, onClose }) {
  const [total, setTotal] = useState(totalBudget.toString());
  const [cats, setCats] = useState(() => {
    const init = {};
    EXPENSE_CATEGORIES.forEach(c => { init[c.id] = catBudgets[c.id]?.toString() || ''; });
    return init;
  });

  useEffect(() => {
    setTotal(totalBudget.toString());
  }, [totalBudget]);

  const handleSave = async () => {
    const totalNum = parseInt(total.replace(/[^\d]/g, ''), 10);
    if (totalNum > 0) await onSaveTotal(totalNum);
    const catNums = {};
    EXPENSE_CATEGORIES.forEach(c => {
      const v = parseInt(cats[c.id]?.replace(/[^\d]/g, '') || '0', 10);
      if (v > 0) catNums[c.id] = v;
    });
    await onSaveCat(catNums);
    onClose();
  };

  const fmt = (v) => v ? Number(v.replace(/[^\d]/g, '') || 0).toLocaleString() : '';

  return (
    <div style={overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Target size={22} color="var(--accent)" />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>예산 설정</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={lbl}>월 전체 목표 예산</label>
          <input
            type="text"
            value={total ? Number(total.replace(/[^\d]/g, '') || 0).toLocaleString() : ''}
            onChange={e => setTotal(e.target.value.replace(/[^\d]/g, ''))}
            placeholder="예: 1,500,000"
            style={input}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 20, marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>카테고리별 예산 (선택)</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {EXPENSE_CATEGORIES.map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 100, fontSize: 14, color: 'var(--text-primary)', flexShrink: 0 }}>
                  {c.emoji} {c.name}
                </span>
                <input
                  type="text"
                  value={cats[c.id] ? Number(cats[c.id].replace(/[^\d]/g, '') || 0).toLocaleString() : ''}
                  onChange={e => setCats(prev => ({ ...prev, [c.id]: e.target.value.replace(/[^\d]/g, '') }))}
                  placeholder="설정 안 함"
                  style={{ ...input, fontSize: 14, padding: '8px 14px' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600 }}>취소</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
            style={{ flex: 2, padding: '12px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontWeight: 700 }}>
            저장
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const box = { background: 'var(--bg-secondary)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' };
const lbl = { fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 };
const input = { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 15 };
