import { useState, useEffect } from 'react';
import { db, collection, doc, setDoc, deleteDoc, onSnapshot, getDoc, getDocs, query, where } from '../firebase.js';

const COLLECTION_NAME = 'budget_transactions';
const USERS_COLLECTION = 'budget_users';

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

export function getCategoryInfo(type, catId) {
  const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  return list.find(c => c.id === catId) || list[list.length - 1];
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('budget_user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (userId, password) => {
    const userRef = doc(db, USERS_COLLECTION, userId);
    const snap = await getDoc(userRef);
    if (snap.exists() && snap.data().password === password) {
      const user = { id: userId, ...snap.data() };
      setCurrentUser(user);
      localStorage.setItem('budget_user', JSON.stringify(user));
      return user;
    }
    throw new Error("아이디 또는 비밀번호가 올바르지 않습니다.");
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('budget_user');
  };

  return { currentUser, login, logout };
}

export function useTransactions(userId) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTransactions(txs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  const addTransaction = async (tx) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    tx.id = id;
    tx.userId = userId;
    await setDoc(doc(db, COLLECTION_NAME, id), tx);
  };

  const updateTransaction = async (id, updates) => {
    await setDoc(doc(db, COLLECTION_NAME, id), updates, { merge: true });
  };

  const deleteTransaction = async (id) => {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  };

  return { transactions, loading, addTransaction, updateTransaction, deleteTransaction };
}

export async function getAllUsers() {
  const snap = await getDocs(collection(db, USERS_COLLECTION));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createUser(id, password, role = 'user') {
  const ref = doc(db, USERS_COLLECTION, id);
  const snap = await getDoc(ref);
  if (snap.exists()) throw new Error("이미 존재하는 아이디입니다.");
  await setDoc(ref, { password, role });
}

export async function updateUserPassword(id, newPassword) {
  const ref = doc(db, USERS_COLLECTION, id);
  await setDoc(ref, { password: newPassword }, { merge: true });
}

export async function deleteUserAccount(id) {
  if (id === 'admin') throw new Error("최고 관리자는 삭제할 수 없습니다.");
  const ref = doc(db, USERS_COLLECTION, id);
  await deleteDoc(ref);
}
