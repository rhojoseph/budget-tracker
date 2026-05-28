import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Camera, Loader, Check, AlertCircle } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useData';

const GEMINI_KEY = import.meta.env.VITE_GEMINI_API_KEY;

const PROMPT = `이것은 한국 은행이나 카드사의 결제/이체 문자메시지 캡처입니다.
다음 정보를 JSON으로만 반환해주세요 (다른 텍스트 없이):
{
  "amount": 숫자(원 단위, 숫자만),
  "merchant": "사용처 또는 입금처 이름",
  "date": "YYYY-MM-DD 형식 (문자에서 날짜를 읽고, 없으면 오늘 날짜)",
  "type": "expense 또는 income",
  "category": "식비/카페/쇼핑/교통/주거/통신/의료/교육/문화/급여/기타 중 하나"
}`;

function toBase64(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

const KOR_CAT_MAP = {
  '식비': 'food', '카페': 'cafe', '쇼핑': 'shopping', '교통': 'transport',
  '주거': 'housing', '통신': 'telecom', '의료': 'medical', '교육': 'education',
  '문화': 'culture', '급여': 'salary', '기타': 'etc',
};

export default function OCRCapture({ onClose, onSave }) {
  const [imgUrl, setImgUrl] = useState(null);
  const [imgFile, setImgFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleImage = (file) => {
    if (!file) return;
    setImgFile(file);
    setImgUrl(URL.createObjectURL(file));
    setResult(null);
    setError('');
  };

  const analyze = async () => {
    if (!imgFile) return;
    if (!GEMINI_KEY) {
      setError('.env 파일에 VITE_GEMINI_API_KEY가 없습니다. 아래 안내를 확인해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const base64 = await toBase64(imgFile);
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: PROMPT },
                { inlineData: { mimeType: imgFile.type, data: base64.split(',')[1] } },
              ],
            }],
          }),
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('결과를 파싱할 수 없습니다.');
      const ex = JSON.parse(match[0]);

      const isIncome = ex.type === 'income';
      const korCat = ex.category || '기타';
      const category = KOR_CAT_MAP[korCat] || (isIncome ? 'etc_income' : 'etc');

      setResult({
        date: ex.date || new Date().toISOString().split('T')[0],
        amount: Math.abs(Number(ex.amount)) || 0,
        description: ex.merchant || '알 수 없음',
        type: isIncome ? 'income' : 'expense',
        category,
        memo: '',
      });
    } catch (e) {
      setError('분석 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!result) return;
    await onSave(result);
    onClose();
  };

  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div style={overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>문자 캡처로 입력</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
        </div>

        {!GEMINI_KEY && (
          <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid var(--warning)', borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
            <p style={{ fontWeight: 700, color: 'var(--warning)', marginBottom: 4 }}>Gemini API 키 설정 필요</p>
            <p style={{ color: 'var(--text-secondary)' }}>프로젝트 폴더에 <code>.env</code> 파일을 만들고 아래 내용을 추가하세요:</p>
            <code style={{ display: 'block', background: 'var(--bg-tertiary)', padding: '8px 12px', borderRadius: 8, marginTop: 8, fontSize: 12 }}>
              VITE_GEMINI_API_KEY=여기에_API_키_붙여넣기
            </code>
            <p style={{ color: 'var(--text-muted)', marginTop: 8, fontSize: 12 }}>저장 후 개발 서버 재시작 필요 (npm run dev)</p>
          </div>
        )}

        <div
          style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}
        >
          <label style={{
            flex: 1, minWidth: 200, border: '2px dashed var(--border-color)', borderRadius: 12,
            padding: 20, textAlign: 'center', cursor: 'pointer', background: 'var(--bg-tertiary)',
          }}>
            <Camera size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} />
            <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>이미지 선택</p>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>카드/계좌 문자 스크린샷</p>
            <input type="file" accept="image/*" capture="environment" onChange={e => handleImage(e.target.files[0])} style={{ display: 'none' }} />
          </label>

          {imgUrl && (
            <div style={{ flex: 1, minWidth: 200, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-color)', maxHeight: 200 }}>
              <img src={imgUrl} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>

        {imgFile && !result && (
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={analyze}
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> AI 분석 중...</> : '✨ Gemini로 자동 분석'}
          </motion.button>
        )}

        {error && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', background: 'rgba(225,29,72,0.08)', border: '1px solid var(--expense)', borderRadius: 10, padding: '10px 14px', marginTop: 12 }}>
            <AlertCircle size={16} style={{ color: 'var(--expense)', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: 'var(--expense)' }}>{error}</p>
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 12 }}>인식 결과 — 수정 후 저장</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: '날짜', key: 'date', type: 'date' },
                { label: '금액 (원)', key: 'amount', type: 'number' },
                { label: '사용처', key: 'description', type: 'text' },
              ].map(f => (
                <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ width: 80, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>{f.label}</span>
                  <input
                    type={f.type}
                    value={result[f.key]}
                    onChange={e => setResult(r => ({ ...r, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14 }}
                  />
                </div>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 80, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>구분</span>
                <select
                  value={result.type}
                  onChange={e => setResult(r => ({ ...r, type: e.target.value, category: e.target.value === 'income' ? 'etc_income' : 'etc' }))}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14 }}
                >
                  <option value="expense">지출</option>
                  <option value="income">수입</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 80, fontSize: 13, color: 'var(--text-muted)', flexShrink: 0 }}>카테고리</span>
                <select
                  value={result.category}
                  onChange={e => setResult(r => ({ ...r, category: e.target.value }))}
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: 14 }}
                >
                  {(result.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)
                    .map(c => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
                </select>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #818cf8)', color: 'white', fontWeight: 700, fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Check size={18} /> 저장하기
            </motion.button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const box = { background: 'var(--bg-secondary)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' };
