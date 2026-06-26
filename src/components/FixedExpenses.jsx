import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, RefreshCw, Edit3, Check } from 'lucide-react';
import { EXPENSE_CATEGORIES, formatMoneyFull } from '../hooks/useData';

const EMPTY = { name: '', category: 'housing', amount: '', dayOfMonth: 1, active: true };

export default function FixedExpenses({ fixedExpenses, onSave, onClose }) {
  const [items, setItems] = useState(fixedExpenses.length > 0 ? fixedExpenses : []);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(EMPTY);

  const addItem = () => {
    if (!form.name || !form.amount) return;
    const newItem = { ...form, amount: parseInt(form.amount.replace(/[^\d]/g, ''), 10), id: Date.now().toString(36) };
    setItems(prev => [...prev, newItem]);
    setForm(EMPTY);
    setAdding(false);
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditForm({ ...item, amount: item.amount.toString() });
    setAdding(false);
  };

  const saveEdit = () => {
    setItems(prev => prev.map(i => i.id === editingId
      ? { ...editForm, amount: parseInt(editForm.amount.replace(/[^\d]/g, ''), 10) }
      : i
    ));
    setEditingId(null);
  };

  const removeItem = (id) => setItems(prev => prev.filter(i => i.id !== id));
  const toggleItem = (id) => setItems(prev => prev.map(i => i.id === id ? { ...i, active: !i.active } : i));

  const handleSave = async () => {
    await onSave(items);
    onClose();
  };

  const total = items.filter(i => i.active).reduce((s, i) => s + i.amount, 0);

  return (
    <div style={overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <RefreshCw size={20} color="var(--accent)" />
            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>고정비 관리</h2>
          </div>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
        </div>

        <div style={{ background: 'var(--bg-tertiary)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>월 고정비 합계</span>
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--expense)' }}>{formatMoneyFull(total)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, maxHeight: 340, overflowY: 'auto' }}>
          <AnimatePresence>
            {items.length === 0 && !adding && (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px 0', fontSize: 14 }}>
                등록된 고정비가 없어요
              </p>
            )}
            {items.map(item => {
              const cat = EXPENSE_CATEGORIES.find(c => c.id === item.category);

              if (editingId === item.id) {
                return (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ border: '1px solid var(--accent)', borderRadius: 14, padding: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="항목명" style={inp} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <select value={editForm.category} onChange={e => setEditForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, flex: 1 }}>
                          {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                        </select>
                        <input type="number" min={1} max={31} value={editForm.dayOfMonth}
                          onChange={e => setEditForm(f => ({ ...f, dayOfMonth: Number(e.target.value) }))}
                          placeholder="결제일" style={{ ...inp, width: 80 }} />
                      </div>
                      <input value={editForm.amount ? Number(editForm.amount.replace(/[^\d]/g, '') || 0).toLocaleString() : ''}
                        onChange={e => setEditForm(f => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '') }))}
                        placeholder="금액 (원)" style={inp} />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '9px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border-color)' }}>취소</button>
                        <button onClick={saveEdit} style={{ flex: 2, padding: '9px', borderRadius: 10, background: 'var(--accent)', color: 'white', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <Check size={14} /> 저장
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              return (
                <motion.div key={item.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: item.active ? 'var(--bg-tertiary)' : 'var(--bg-primary)', border: '1px solid var(--border-color)', opacity: item.active ? 1 : 0.5 }}>
                  <span style={{ fontSize: 20 }}>{cat?.emoji || '📦'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>{item.name}</p>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>{cat?.name} · 매월 {item.dayOfMonth}일</p>
                  </div>
                  <span style={{ fontWeight: 700, color: 'var(--expense)', fontSize: 14, flexShrink: 0 }}>
                    {formatMoneyFull(item.amount)}
                  </span>
                  <button onClick={() => toggleItem(item.id)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: item.active ? 'rgba(5,150,105,0.1)' : 'var(--bg-tertiary)', color: item.active ? 'var(--income)' : 'var(--text-muted)', fontWeight: 700, border: '1px solid var(--border-color)' }}>
                    {item.active ? 'ON' : 'OFF'}
                  </button>
                  <button onClick={() => startEdit(item)} style={{ color: 'var(--accent)', padding: 4 }}><Edit3 size={14} /></button>
                  <button onClick={() => removeItem(item.id)} style={{ color: 'var(--danger)', padding: 4 }}><Trash2 size={14} /></button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {adding ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{ border: '1px solid var(--accent)', borderRadius: 14, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="항목명 (예: 월세, 넷플릭스)" style={inp} />
              <div style={{ display: 'flex', gap: 8 }}>
                <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inp, flex: 1 }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
                <input type="number" min={1} max={31} value={form.dayOfMonth} onChange={e => setForm(f => ({ ...f, dayOfMonth: Number(e.target.value) }))}
                  placeholder="결제일" style={{ ...inp, width: 80 }} />
              </div>
              <input value={form.amount ? Number(form.amount.replace(/[^\d]/g, '') || 0).toLocaleString() : ''}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value.replace(/[^\d]/g, '') }))}
                placeholder="금액 (원)" style={inp} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setAdding(false)} style={{ flex: 1, padding: '10px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border-color)' }}>취소</button>
                <button onClick={addItem} style={{ flex: 2, padding: '10px', borderRadius: 10, background: 'var(--accent)', color: 'white', fontWeight: 700, border: 'none' }}>추가</button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => { setAdding(true); setEditingId(null); }}
            style={{ width: '100%', padding: '12px', borderRadius: 12, border: '2px dashed var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 16, cursor: 'pointer' }}>
            <Plus size={16} /> 고정비 추가
          </button>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600, border: '1px solid var(--border-color)' }}>취소</button>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleSave}
            style={{ flex: 2, padding: '12px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontWeight: 700, border: 'none' }}>
            저장
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const box = { background: 'var(--bg-secondary)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto' };
const inp = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box' };
