import React, { useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import { motion } from 'framer-motion';
import { X, FileSpreadsheet, Check, Upload } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../hooks/useData';

const CATEGORY_MAP = {
  '식비': 'food', '외식비': 'food', '식사': 'food', '점심': 'food', '저녁': 'food', '밥': 'food',
  '카페': 'cafe', '음료': 'cafe', '커피': 'cafe',
  '생활용품': 'shopping', '식료품': 'shopping', '쇼핑': 'shopping', '마트': 'shopping', '온라인쇼핑': 'shopping',
  '교통': 'transport', '주유': 'transport', '택시': 'transport', '버스': 'transport', '지하철': 'transport',
  '주거': 'housing', '관리비': 'housing', '월세': 'housing', '공과금': 'housing',
  '통신': 'telecom', '인터넷': 'telecom', '핸드폰': 'telecom', '휴대폰': 'telecom',
  '의료': 'medical', '병원': 'medical', '약국': 'medical', '헬스': 'medical',
  '교육': 'education', '학원': 'education', '도서': 'education',
  '문화': 'culture', '여가': 'culture', '영화': 'culture', 'OTT': 'culture', '스트리밍': 'culture',
  '서비스구독': 'etc', '구독': 'etc',
  '급여': 'salary', '월급': 'salary',
  '상여': 'bonus', '보너스': 'bonus',
  '투자': 'invest', '배당': 'invest',
  '부수입': 'side',
};

const INCOME_KEYWORDS = ['급여', '월급', '상여', '보너스', '투자', '배당', '부수입', '수입', '입금', '이자'];

function mapRow(row, cols) {
  const dateVal = row[cols.date];
  const dateStr = dateVal instanceof Date
    ? dateVal.toISOString().split('T')[0]
    : dateVal?.toString().split('T')[0];
  if (!dateStr || dateStr.length < 8) return null;

  const rawAmt = row[cols.amount];
  const amount = Math.abs(
    typeof rawAmt === 'string' ? parseInt(rawAmt.replace(/[^0-9]/g, ''), 10) : Number(rawAmt)
  );
  if (!amount || isNaN(amount)) return null;

  const korCat = row[cols.category]?.toString().trim() || '';
  const merchant = row[cols.merchant]?.toString().trim() || korCat || '내역';
  const fullText = `${korCat} ${merchant}`;
  const isIncome = INCOME_KEYWORDS.some(k => fullText.includes(k));
  const type = isIncome ? 'income' : 'expense';

  let category = isIncome ? 'etc_income' : 'etc';
  for (const [k, v] of Object.entries(CATEGORY_MAP)) {
    if (korCat.includes(k)) { category = v; break; }
  }

  return {
    _id: `ex_${Math.random().toString(36).slice(2)}`,
    date: dateStr,
    type,
    category,
    description: merchant,
    amount,
    memo: row[cols.memo]?.toString() || '',
  };
}

export default function ExcelImport({ onClose, onSave }) {
  const [step, setStep] = useState('upload');
  const [rows, setRows] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [saving, setSaving] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const parseFile = useCallback((file) => {
    if (!file?.name.match(/\.(xlsx|xls)$/i)) return alert('.xlsx 파일만 지원합니다.');
    const reader = new FileReader();
    reader.onload = (e) => {
      const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array', cellDates: true });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

      let hi = 0;
      for (let i = 0; i < Math.min(5, raw.length); i++) {
        if (raw[i]?.some(c => c?.toString().includes('날짜') || c?.toString().includes('금액'))) { hi = i; break; }
      }

      const hdrs = raw[hi] || [];
      const find = (...kws) => hdrs.findIndex(h => h && kws.some(k => h.toString().includes(k)));
      const cols = {
        date: find('날짜', '일자') >= 0 ? find('날짜', '일자') : 0,
        category: find('대분류', '분류') >= 0 ? find('대분류', '분류') : 3,
        merchant: find('사용처', '가맹점', '내용') >= 0 ? find('사용처', '가맹점', '내용') : 4,
        amount: find('금액') >= 0 ? find('금액') : 5,
        memo: find('메모', '비고'),
      };

      const parsed = raw.slice(hi + 1).map((r, i) => r && mapRow(r, cols)).filter(Boolean);
      setRows(parsed);
      setSelected(new Set(parsed.map(r => r._id)));
      setStep('preview');
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const toggleAll = () => selected.size === rows.length
    ? setSelected(new Set())
    : setSelected(new Set(rows.map(r => r._id)));

  const toggle = (id) => setSelected(prev => {
    const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s;
  });

  const handleSave = async () => {
    setSaving(true);
    for (const row of rows.filter(r => selected.has(r._id))) {
      const { _id, ...tx } = row;
      await onSave(tx);
    }
    setSavedCount(selected.size);
    setSaving(false);
    setStep('done');
  };

  const allCats = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

  return (
    <div style={overlay}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={box}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)' }}>엑셀 가져오기</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', padding: 4 }}><X size={20} /></button>
        </div>

        {step === 'upload' && (
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); parseFile(e.dataTransfer.files[0]); }}
            onClick={() => document.getElementById('xlsx-input').click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent)' : 'var(--border-color)'}`,
              borderRadius: 16, padding: '48px 32px', textAlign: 'center',
              background: dragOver ? 'rgba(99,102,241,0.05)' : 'var(--bg-tertiary)',
              cursor: 'pointer', transition: '0.2s',
            }}
          >
            <FileSpreadsheet size={48} style={{ color: 'var(--accent)', marginBottom: 14 }} />
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-primary)', marginBottom: 8 }}>
              엑셀 파일 드래그 또는 클릭
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>가계부_26.5월.xlsx 같은 파일 지원</p>
            <input id="xlsx-input" type="file" accept=".xlsx,.xls" onChange={e => parseFile(e.target.files[0])} style={{ display: 'none' }} />
          </div>
        )}

        {step === 'preview' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                총 <strong>{rows.length}건</strong> 인식 · <strong>{selected.size}건</strong> 선택됨
              </span>
              <button onClick={toggleAll} style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600 }}>
                {selected.size === rows.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>

            <div style={{ maxHeight: 380, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--bg-tertiary)', position: 'sticky', top: 0, zIndex: 1 }}>
                    <th style={th}></th>
                    <th style={th}>날짜</th>
                    <th style={th}>사용처</th>
                    <th style={th}>카테고리</th>
                    <th style={{ ...th, textAlign: 'right' }}>금액</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const catInfo = allCats.find(c => c.id === r.category);
                    return (
                      <tr
                        key={r._id}
                        onClick={() => toggle(r._id)}
                        style={{ borderTop: '1px solid var(--border-color)', opacity: selected.has(r._id) ? 1 : 0.35, cursor: 'pointer' }}
                      >
                        <td style={td}><input type="checkbox" checked={selected.has(r._id)} onChange={() => {}} /></td>
                        <td style={td}>{r.date}</td>
                        <td style={{ ...td, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description}</td>
                        <td style={td}>{catInfo ? `${catInfo.emoji} ${catInfo.name}` : r.category}</td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600, color: r.type === 'income' ? 'var(--income)' : 'var(--expense)' }}>
                          {r.type === 'income' ? '+' : '-'}{r.amount.toLocaleString()}원
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setStep('upload')} style={{ padding: '10px 20px', borderRadius: 10, background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                다시 선택
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={handleSave}
                disabled={saving || selected.size === 0}
                style={{ padding: '10px 24px', borderRadius: 10, background: 'var(--accent)', color: 'white', fontWeight: 700, opacity: selected.size === 0 ? 0.5 : 1 }}
              >
                {saving ? '저장 중...' : `${selected.size}건 가져오기`}
              </motion.button>
            </div>
          </>
        )}

        {step === 'done' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check size={32} style={{ color: 'var(--income)' }} />
            </div>
            <p style={{ fontWeight: 800, fontSize: 20, color: 'var(--text-primary)', marginBottom: 8 }}>{savedCount}건 가져오기 완료!</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24 }}>대시보드에서 바로 확인할 수 있어요.</p>
            <button onClick={onClose} style={{ padding: '12px 28px', borderRadius: 12, background: 'var(--accent)', color: 'white', fontWeight: 700, fontSize: 15 }}>
              닫기
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}

const overlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 };
const box = { background: 'var(--bg-secondary)', borderRadius: 20, padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' };
const th = { padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)', fontSize: 12, borderBottom: '1px solid var(--border-color)' };
const td = { padding: '10px 14px', color: 'var(--text-primary)' };
