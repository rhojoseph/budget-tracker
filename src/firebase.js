// Firebase 설정 및 연동
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot } from "firebase/firestore";

// 사용자에게 받은 Firebase 구성 (보험 프로그램과 동일)
const firebaseConfig = {
  apiKey: "AIzaSyC9wL-fGIEWgISpYOGWmsZbdPr0JQNr7bE",
  authDomain: "my-family-insurance.firebaseapp.com",
  projectId: "my-family-insurance",
  storageBucket: "my-family-insurance.firebasestorage.app",
  messagingSenderId: "779441565031",
  appId: "1:779441565031:web:b5ac5874685521b02313c2",
  measurementId: "G-PZRQPHQK24"
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot };
