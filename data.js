/* ===== Categories ===== */
export const EXPENSE_CATEGORIES = [
  { id: 'food', name: '식비', emoji: '🍚', color: '#fd79a8' },
  { id: 'transport', name: '교통', emoji: '🚌', color: '#74b9ff' },
  { id: 'shopping', name: '쇼핑', emoji: '🛍️', color: '#a29bfe' },
  { id: 'housing', name: '주거', emoji: '🏠', color: '#fdcb6e' },
  { id: 'telecom', name: '통신', emoji: '📱', color: '#55efc4' },
  { id: 'medical', name: '의료', emoji: '🏥', color: '#e17055' },
  { id: 'education', name: '교육', emoji: '📚', color: '#00cec9' },
  { id: 'culture', name: '문화', emoji: '🎬', color: '#e84393' },
  { id: 'cafe', name: '카페', emoji: '☕', color: '#d35400' },
  { id: 'etc', name: '기타', emoji: '📦', color: '#636e72' },
];

export const INCOME_CATEGORIES = [
  { id: 'salary', name: '급여', emoji: '💰', color: '#00cec9' },
  { id: 'bonus', name: '상여', emoji: '🎁', color: '#55efc4' },
  { id: 'invest', name: '투자', emoji: '📈', color: '#6c5ce7' },
  { id: 'side', name: '부수입', emoji: '💵', color: '#fdcb6e' },
  { id: 'etc_income', name: '기타', emoji: '📦', color: '#636e72' },
];

const STORAGE_KEY = 'budget_transactions';

/* ===== Data Store ===== */
export function loadTransactions() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveTransactions(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addTransaction(tx) {
  const list = loadTransactions();
  tx.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  list.push(tx);
  saveTransactions(list);
  return tx;
}

export function updateTransaction(id, updates) {
  const list = loadTransactions();
  const idx = list.findIndex(t => t.id === id);
  if (idx >= 0) { Object.assign(list[idx], updates); saveTransactions(list); }
  return list;
}

export function deleteTransaction(id) {
  let list = loadTransactions();
  list = list.filter(t => t.id !== id);
  saveTransactions(list);
  return list;
}

export function getMonthTransactions(year, month) {
  return loadTransactions().filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function clearAll() {
  localStorage.removeItem(STORAGE_KEY);
}

/* ===== Helpers ===== */
export function formatMoney(n) {
  const abs = Math.abs(n);
  const formatted = abs >= 10000
    ? (abs / 10000).toFixed(abs % 10000 === 0 ? 0 : 1) + '만'
    : abs.toLocaleString();
  return (n < 0 ? '-' : '') + '₩' + formatted;
}

export function formatMoneyFull(n) {
  return '₩' + Math.abs(n).toLocaleString();
}

export function getCategoryInfo(type, catId) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find(c => c.id === catId) || list[list.length - 1];
}
