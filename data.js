import { db, collection, doc, setDoc, deleteDoc, onSnapshot } from './src/firebase.js';

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

/* ===== Data Store (Firebase) ===== */
const COLLECTION_NAME = 'budget_transactions';

// 메모리에 로드된 트랜잭션 (동기적 접근을 위해)
let cachedTransactions = [];
let unsubscribeSnapshot = null;

// 실시간 구독
export function subscribeTransactions(onUpdate) {
  if (unsubscribeSnapshot) unsubscribeSnapshot();
  
  unsubscribeSnapshot = onSnapshot(collection(db, COLLECTION_NAME), (snapshot) => {
    cachedTransactions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    if (onUpdate) onUpdate(cachedTransactions);
  });
  
  return unsubscribeSnapshot;
}

export function loadTransactions() {
  return cachedTransactions;
}

export async function addTransaction(tx) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  tx.id = id;
  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, tx);
  return tx;
}

export async function updateTransaction(id, updates) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await setDoc(docRef, updates, { merge: true });
}

export async function deleteTransaction(id) {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

export function getMonthTransactions(year, month) {
  return cachedTransactions.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

// 개발/테스트 시에만 사용 (모두 지우기는 구현 안함. 실운영 방지)
export function clearAll() {
  console.warn("clearAll은 지원되지 않습니다.");
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
