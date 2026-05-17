import {
  EXPENSE_CATEGORIES, INCOME_CATEGORIES,
  loadTransactions, subscribeTransactions, addTransaction, updateTransaction, deleteTransaction,
  getMonthTransactions, clearAll, formatMoney, formatMoneyFull, getCategoryInfo,
  initializeAdmin, login, logout, getCurrentUser, createUser, updateUserPassword, deleteUserAccount, getAllUsers
} from './data.js';

/* ===== State ===== */
let currentYear, currentMonth;
let currentView = 'dashboard';
let activeFilter = 'all';
let editingTxId = null;

let isDataLoaded = false;

let deferredPrompt;

function init() {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  bindEvents();
  
  initializeAdmin().catch(console.error);

  
  // PWA 설치 로직
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = document.getElementById('install-btn');
    if (installBtn) {
      installBtn.style.display = 'flex';
      installBtn.addEventListener('click', async () => {
        installBtn.style.display = 'none';
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        deferredPrompt = null;
      });
    }
  });
  
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    console.log('PWA was installed');
  });
}

/* ===== Event Binding ===== */
function bindEvents() {
  // Sidebar toggle
  document.getElementById('sidebar-toggle').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('collapsed');
  });

  // Month nav
  document.getElementById('prev-month').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    render();
  });
  document.getElementById('next-month').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    render();
  });

  // View toggle
  ['dashboard', 'list', 'calendar', 'admin'].forEach(v => {
    const el = document.getElementById(`view-${v}`);
    if (el) {
      el.addEventListener('click', () => {
        currentView = v;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        render();
      });
    }
  });

  // Auth Events
  document.getElementById('login-btn').addEventListener('click', async () => {
    const id = document.getElementById('login-id').value.trim();
    const pw = document.getElementById('login-pw').value.trim();
    if (!id || !pw) return toast('아이디와 비밀번호를 입력해주세요.', 'error');
    try {
      const btn = document.getElementById('login-btn');
      btn.disabled = true;
      btn.textContent = '로그인 중...';
      const user = await login(id, pw);
      document.getElementById('login-overlay').style.display = 'none';
      if (user.role === 'admin') {
        document.getElementById('view-admin').style.display = '';
      }
      
      subscribeTransactions(() => {
        isDataLoaded = true;
        render();
      });
      toast(`환영합니다, ${id}님!`, 'success');
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      const btn = document.getElementById('login-btn');
      btn.disabled = false;
      btn.textContent = '로그인';
    }
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    logout();
    document.getElementById('login-overlay').style.display = 'flex';
    document.getElementById('view-admin').style.display = 'none';
    currentView = 'dashboard';
    document.getElementById('login-id').value = '';
    document.getElementById('login-pw').value = '';
  });

  // Admin Events
  const createUserBtn = document.getElementById('create-user-btn');
  if (createUserBtn) {
    createUserBtn.addEventListener('click', async () => {
      const id = document.getElementById('new-user-id').value.trim();
      const pw = document.getElementById('new-user-pw').value.trim();
      if (!id || !pw) return toast('아이디와 비밀번호를 입력하세요.', 'error');
      try {
        await createUser(id, pw);
        toast('사용자가 생성되었습니다.', 'success');
        document.getElementById('new-user-id').value = '';
        document.getElementById('new-user-pw').value = '';
        renderAdmin();
      } catch (e) {
        toast(e.message, 'error');
      }
    });
  }

  // Add transaction
  document.getElementById('add-transaction-btn').addEventListener('click', () => openModal());

  // Modal events
  document.getElementById('tx-backdrop').addEventListener('click', closeModal);
  document.getElementById('tx-modal-close').addEventListener('click', closeModal);
  document.getElementById('tx-cancel').addEventListener('click', closeModal);
  document.getElementById('tx-submit').addEventListener('click', submitTransaction);
  document.getElementById('tx-delete').addEventListener('click', handleDelete);

  // Type toggle
  document.getElementById('tx-type-expense').addEventListener('click', () => setTxType('expense'));
  document.getElementById('tx-type-income').addEventListener('click', () => setTxType('income'));

  // Amount formatting
  document.getElementById('tx-amount').addEventListener('input', (e) => {
    let v = e.target.value.replace(/[^\d]/g, '');
    e.target.value = v ? Number(v).toLocaleString() : '';
  });

  // Reset
  document.getElementById('reset-btn').addEventListener('click', () => {
    toast('안전상의 이유로 전체 삭제는 비활성화되었습니다.', 'info');
  });

  // Export
  document.getElementById('export-btn').addEventListener('click', exportCSV);
}

/* ===== Render ===== */
function render() {
  if (!getCurrentUser()) return; // Not logged in
  
  const txs = getMonthTransactions(currentYear, currentMonth);
  renderMonthLabel();
  renderSidebarStats(txs);
  renderCategoryFilters(txs);
  const filtered = activeFilter === 'all' ? txs : txs.filter(t => t.category === activeFilter);

  document.getElementById('dashboard-view').style.display = currentView === 'dashboard' ? '' : 'none';
  document.getElementById('list-view').style.display = currentView === 'list' ? '' : 'none';
  document.getElementById('calendar-view').style.display = currentView === 'calendar' ? '' : 'none';
  document.getElementById('admin-view').style.display = currentView === 'admin' ? '' : 'none';

  const titles = { dashboard: '대시보드', list: '거래 내역', calendar: '캘린더', admin: '관리자 대시보드' };
  document.getElementById('page-title').textContent = titles[currentView];

  if (currentView === 'dashboard') renderDashboard(txs, filtered);
  else if (currentView === 'list') renderList(filtered);
  else if (currentView === 'calendar') renderCalendar(txs);
  else if (currentView === 'admin') renderAdmin();
}

function renderMonthLabel() {
  document.getElementById('current-month').textContent = `${currentYear}년 ${currentMonth + 1}월`;
}

function renderSidebarStats(txs) {
  const income = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  document.getElementById('sidebar-income').textContent = formatMoneyFull(income);
  document.getElementById('sidebar-expense').textContent = formatMoneyFull(expense);
  document.getElementById('sidebar-balance').textContent = formatMoneyFull(income - expense);
}

function renderCategoryFilters(txs) {
  const container = document.getElementById('category-filters');
  const cats = new Set(txs.map(t => t.category));
  let html = `<button class="cat-filter ${activeFilter === 'all' ? 'active' : ''}" data-cat="all">전체</button>`;
  cats.forEach(catId => {
    const tx = txs.find(t => t.category === catId);
    const info = getCategoryInfo(tx.type, catId);
    html += `<button class="cat-filter ${activeFilter === catId ? 'active' : ''}" data-cat="${catId}">${info.emoji} ${info.name}</button>`;
  });
  container.innerHTML = html;
  container.querySelectorAll('.cat-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activeFilter = btn.dataset.cat;
      render();
    });
  });
}

/* ===== Dashboard ===== */
function renderDashboard(allTxs, filtered) {
  const el = document.getElementById('dashboard-view');
  const income = allTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = allTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expense;
  const txCount = allTxs.length;

  let html = '';

  // Summary cards
  html += `<div class="summary-cards">
    <div class="summary-card income-card">
      <div class="label">총 수입</div>
      <div class="amount">${formatMoneyFull(income)}</div>
      <div class="sub">${allTxs.filter(t=>t.type==='income').length}건</div>
    </div>
    <div class="summary-card expense-card">
      <div class="label">총 지출</div>
      <div class="amount">${formatMoneyFull(expense)}</div>
      <div class="sub">${allTxs.filter(t=>t.type==='expense').length}건</div>
    </div>
    <div class="summary-card balance-card">
      <div class="label">잔액</div>
      <div class="amount">${formatMoneyFull(balance)}</div>
      <div class="sub">${balance >= 0 ? '흑자' : '적자'}</div>
    </div>
  </div>`;

  // Charts row
  html += `<div class="dashboard-grid">`;

  // Daily bar chart
  html += `<div class="card"><div class="card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="12" width="4" height="9" rx="1"/><rect x="10" y="7" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/></svg>일별 지출</div><div class="chart-container">${renderDailyChart(allTxs)}</div></div>`;

  // Category donut
  html += `<div class="card"><div class="card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0110 10h-10z"/></svg>카테고리별 지출</div>${renderDonut(allTxs)}</div>`;

  html += `</div>`;

  // Recent transactions
  html += `<div class="card"><div class="card-title"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>최근 내역</div>`;

  if (filtered.length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">아직 내역이 없습니다</div><div class="empty-sub">상단의 "내역 추가" 버튼을 눌러 시작하세요</div></div>`;
  } else {
    const sorted = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
    html += `<div class="tx-list">${sorted.map(renderTxItem).join('')}</div>`;
  }
  html += `</div>`;

  el.innerHTML = html;
  bindTxClicks();
}

function renderDailyChart(txs) {
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daily = new Array(daysInMonth).fill(0);
  const dailyIncome = new Array(daysInMonth).fill(0);
  txs.forEach(t => {
    const day = new Date(t.date).getDate() - 1;
    if (t.type === 'expense') daily[day] += t.amount;
    else dailyIncome[day] += t.amount;
  });
  const max = Math.max(...daily, ...dailyIncome, 1);

  let bars = '';
  for (let i = 0; i < daysInMonth; i++) {
    const eh = Math.max((daily[i] / max) * 160, daily[i] ? 4 : 0);
    const ih = Math.max((dailyIncome[i] / max) * 160, dailyIncome[i] ? 4 : 0);
    const showLabel = daysInMonth <= 15 || (i + 1) % 5 === 0 || i === 0;
    bars += `<div class="chart-bar-col">
      <div style="display:flex;gap:2px;align-items:flex-end;height:160px;">
        ${ih ? `<div class="chart-bar income-bar" style="height:${ih}px" title="수입: ${formatMoneyFull(dailyIncome[i])}"></div>` : ''}
        ${eh ? `<div class="chart-bar expense-bar" style="height:${eh}px" title="지출: ${formatMoneyFull(daily[i])}"></div>` : ''}
        ${!ih && !eh ? `<div style="height:4px"></div>` : ''}
      </div>
      ${showLabel ? `<div class="chart-bar-label">${i + 1}</div>` : `<div class="chart-bar-label"></div>`}
    </div>`;
  }
  return `<div class="chart-bar-group">${bars}</div>`;
}

function renderDonut(txs) {
  const expenses = txs.filter(t => t.type === 'expense');
  if (expenses.length === 0) return `<div class="empty-state" style="padding:20px"><div class="empty-icon">📊</div><div class="empty-sub">지출 내역이 없습니다</div></div>`;

  const catTotals = {};
  expenses.forEach(t => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const total = Object.values(catTotals).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(catTotals).sort((a, b) => b[1] - a[1]);

  const R = 50, cx = 70, cy = 70, stroke = 16;
  const circumference = 2 * Math.PI * R;
  let offset = 0;
  let paths = '';
  let legend = '';

  sorted.forEach(([catId, amount]) => {
    const info = getCategoryInfo('expense', catId);
    const pct = amount / total;
    const dashLen = pct * circumference;
    paths += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${info.color}" stroke-width="${stroke}" stroke-dasharray="${dashLen} ${circumference - dashLen}" stroke-dashoffset="${-offset}" style="transition:all 0.6s"/>`;
    offset += dashLen;
    legend += `<div class="legend-item"><div class="legend-dot" style="background:${info.color}"></div><span class="legend-name">${info.emoji} ${info.name}</span><span class="legend-value">${formatMoney(amount)}</span><span class="legend-pct">${(pct * 100).toFixed(0)}%</span></div>`;
  });

  return `<div class="donut-wrap" style="position:relative">
    <div style="position:relative">
      <svg class="donut-svg" viewBox="0 0 140 140">${paths}</svg>
      <div class="donut-center"><div class="donut-total">${formatMoney(total)}</div><div class="donut-label">총 지출</div></div>
    </div>
    <div class="donut-legend">${legend}</div>
  </div>`;
}

function renderTxItem(tx) {
  const info = getCategoryInfo(tx.type, tx.category);
  const d = new Date(tx.date);
  const dateStr = `${d.getMonth() + 1}/${d.getDate()}`;
  return `<div class="tx-item" data-id="${tx.id}">
    <div class="tx-icon ${tx.type}-icon">${info.emoji}</div>
    <div class="tx-info">
      <div class="tx-memo">${tx.memo || info.name}</div>
      <div class="tx-category">${info.name}</div>
    </div>
    <div class="tx-right">
      <div class="tx-amount ${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatMoneyFull(tx.amount)}</div>
      <div class="tx-date">${dateStr}</div>
    </div>
  </div>`;
}

/* ===== List View ===== */
function renderList(txs) {
  const el = document.getElementById('list-view');
  if (txs.length === 0) {
    el.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">내역이 없습니다</div><div class="empty-sub">상단의 "내역 추가" 버튼을 눌러 시작하세요</div></div>`;
    return;
  }
  const sorted = [...txs].sort((a, b) => new Date(b.date) - new Date(a.date));
  // Group by date
  const groups = {};
  sorted.forEach(t => {
    const key = t.date;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  let html = `<div class="list-header"><input class="list-search" id="list-search" placeholder="🔍 메모 검색..." /></div>`;

  Object.entries(groups).forEach(([date, items]) => {
    const d = new Date(date);
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayIncome = items.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    html += `<div class="list-group-title">${d.getMonth() + 1}월 ${d.getDate()}일 (${dayNames[d.getDay()]}) · <span style="color:var(--income)">+${formatMoneyFull(dayIncome)}</span> <span style="color:var(--expense)">-${formatMoneyFull(dayExpense)}</span></div>`;
    html += `<div class="tx-list">${items.map(renderTxItem).join('')}</div>`;
  });

  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  html += `<div class="list-total">${txs.length}건 · 수입 <span style="color:var(--income)">${formatMoneyFull(totalIncome)}</span> · 지출 <span style="color:var(--expense)">${formatMoneyFull(totalExpense)}</span></div>`;

  el.innerHTML = html;
  bindTxClicks();

  // Search
  document.getElementById('list-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    const items = el.querySelectorAll('.tx-item');
    items.forEach(item => {
      const memo = item.querySelector('.tx-memo').textContent.toLowerCase();
      item.style.display = memo.includes(q) ? '' : 'none';
    });
  });
}

/* ===== Calendar View ===== */
function renderCalendar(txs) {
  const el = document.getElementById('calendar-view');
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();
  const today = new Date();

  // Daily sums
  const dailyData = {};
  txs.forEach(t => {
    const day = new Date(t.date).getDate();
    if (!dailyData[day]) dailyData[day] = { income: 0, expense: 0 };
    if (t.type === 'income') dailyData[day].income += t.amount;
    else dailyData[day].expense += t.amount;
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
  let html = `<div class="cal-grid">`;
  dayNames.forEach((d, i) => {
    const cls = i === 0 ? ' sunday' : i === 6 ? ' saturday' : '';
    html += `<div class="cal-header-cell${cls}">${d}</div>`;
  });

  // Prev month padding
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-cell other-month"><div class="cal-day">${prevMonthDays - i}</div></div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(currentYear, currentMonth, d).getDay();
    const isToday = today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d;
    const dayCls = dayOfWeek === 0 ? ' sunday' : dayOfWeek === 6 ? ' saturday' : '';
    const cellCls = isToday ? ' today' : '';
    const data = dailyData[d];

    html += `<div class="cal-cell${cellCls}" data-day="${d}"><div class="cal-day${dayCls}">${d}</div>`;
    if (data) {
      html += `<div class="cal-amounts">`;
      if (data.income) html += `<div class="cal-income">+${formatMoney(data.income)}</div>`;
      if (data.expense) html += `<div class="cal-expense">-${formatMoney(data.expense)}</div>`;
      html += `</div>`;
    }
    html += `</div>`;
  }

  // Next month padding
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-cell other-month"><div class="cal-day">${i}</div></div>`;
  }

  html += `</div>`;
  el.innerHTML = html;

  // Click on calendar cell to add transaction for that date
  el.querySelectorAll('.cal-cell:not(.other-month)').forEach(cell => {
    cell.addEventListener('click', () => {
      const day = cell.dataset.day;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      openModal(null, dateStr);
    });
  });
}

/* ===== Admin View ===== */
async function renderAdmin() {
  const listEl = document.getElementById('user-list');
  listEl.innerHTML = '<div class="empty-state">로딩 중...</div>';
  try {
    const users = await getAllUsers();
    listEl.innerHTML = users.map(u => `
      <div class="tx-item" style="cursor:default;">
        <div class="tx-icon expense-icon">👤</div>
        <div class="tx-info">
          <div class="tx-memo">${u.id}</div>
          <div class="tx-category">권한: ${u.role === 'admin' ? '관리자' : '일반 사용자'}</div>
        </div>
        <div class="tx-right" style="gap:5px; align-items:center;">
          <button class="tx-submit" style="padding: 6px 12px; margin:0;" onclick="window.resetPw('${u.id}')">비밀번호 변경</button>
          ${u.id !== 'admin' ? `<button class="reset-btn" style="padding: 6px 12px; margin:0; background:rgba(225,112,85,0.15); color:var(--expense); border:none; border-radius:8px;" onclick="window.delUser('${u.id}')">삭제</button>` : ''}
        </div>
      </div>
    `).join('');
  } catch (e) {
    listEl.innerHTML = `<div class="empty-state">오류: ${e.message}</div>`;
  }
}

window.resetPw = async (id) => {
  const newPw = prompt(`${id}의 새 비밀번호를 입력하세요:`);
  if (newPw) {
    try {
      await updateUserPassword(id, newPw);
      toast('비밀번호가 변경되었습니다.', 'success');
    } catch(e) {
      toast(e.message, 'error');
    }
  }
};

window.delUser = async (id) => {
  if (confirm(`${id} 사용자를 정말 삭제하시겠습니까?`)) {
    try {
      await deleteUserAccount(id);
      toast('삭제되었습니다.', 'info');
      renderAdmin();
    } catch(e) {
      toast(e.message, 'error');
    }
  }
};

/* ===== TX Item Click ===== */
function bindTxClicks() {
  document.querySelectorAll('.tx-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      const tx = loadTransactions().find(t => t.id === id);
      if (tx) openModal(tx);
    });
  });
}

/* ===== Modal ===== */
let currentTxType = 'expense';

function openModal(tx = null, preDate = null) {
  editingTxId = tx ? tx.id : null;
  const modal = document.getElementById('transaction-modal');
  modal.style.display = '';

  document.getElementById('tx-modal-title').textContent = tx ? '내역 수정' : '새 내역 추가';
  document.getElementById('tx-submit').textContent = tx ? '수정' : '추가';
  document.getElementById('tx-delete').style.display = tx ? '' : 'none';

  if (tx) {
    setTxType(tx.type);
    document.getElementById('tx-amount').value = tx.amount.toLocaleString();
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-memo').value = tx.memo || '';
    setTimeout(() => {
      const catBtn = document.querySelector(`.tx-cat-btn[data-cat="${tx.category}"]`);
      if (catBtn) catBtn.click();
    }, 10);
  } else {
    setTxType('expense');
    document.getElementById('tx-amount').value = '';
    const dateVal = preDate || `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    document.getElementById('tx-date').value = dateVal;
    document.getElementById('tx-memo').value = '';
  }

  setTimeout(() => document.getElementById('tx-amount').focus(), 100);
}

function closeModal() {
  document.getElementById('transaction-modal').style.display = 'none';
  editingTxId = null;
}

function setTxType(type) {
  currentTxType = type;
  document.getElementById('tx-type-expense').classList.toggle('active', type === 'expense');
  document.getElementById('tx-type-income').classList.toggle('active', type === 'income');
  renderModalCategories(type);
}

function renderModalCategories(type) {
  const cats = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const container = document.getElementById('tx-categories');
  container.innerHTML = cats.map((c, i) => `<button class="tx-cat-btn${i === 0 ? ' active' : ''}" data-cat="${c.id}">${c.emoji} ${c.name}</button>`).join('');
  container.querySelectorAll('.tx-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      container.querySelectorAll('.tx-cat-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

async function submitTransaction() {
  const amount = parseInt(document.getElementById('tx-amount').value.replace(/[^\d]/g, ''), 10);
  if (!amount || amount <= 0) { toast('금액을 입력해주세요.', 'error'); return; }
  const date = document.getElementById('tx-date').value;
  if (!date) { toast('날짜를 선택해주세요.', 'error'); return; }
  const category = document.querySelector('.tx-cat-btn.active')?.dataset.cat;
  const memo = document.getElementById('tx-memo').value.trim();

  const txData = { type: currentTxType, amount, date, category, memo };

  try {
    const submitBtn = document.getElementById('tx-submit');
    submitBtn.disabled = true;
    
    if (editingTxId) {
      await updateTransaction(editingTxId, txData);
      toast('내역이 수정되었습니다.', 'success');
    } else {
      await addTransaction(txData);
      toast('내역이 추가되었습니다.', 'success');
    }
    closeModal();
  } catch (error) {
    console.error(error);
    toast('처리 중 오류가 발생했습니다.', 'error');
  } finally {
    document.getElementById('tx-submit').disabled = false;
  }
}

async function handleDelete() {
  if (editingTxId && confirm('이 내역을 삭제하시겠습니까?')) {
    try {
      const deleteBtn = document.getElementById('tx-delete');
      deleteBtn.disabled = true;
      await deleteTransaction(editingTxId);
      toast('내역이 삭제되었습니다.', 'info');
      closeModal();
    } catch (e) {
      console.error(e);
      toast('삭제 중 오류가 발생했습니다.', 'error');
    } finally {
      const deleteBtn = document.getElementById('tx-delete');
      if (deleteBtn) deleteBtn.disabled = false;
    }
  }
}

/* ===== Export CSV ===== */
function exportCSV() {
  const txs = getMonthTransactions(currentYear, currentMonth);
  if (txs.length === 0) { toast('내보낼 데이터가 없습니다.', 'error'); return; }

  let csv = '\uFEFF날짜,유형,카테고리,금액,메모\n';
  txs.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(t => {
    const info = getCategoryInfo(t.type, t.category);
    csv += `${t.date},${t.type === 'income' ? '수입' : '지출'},${info.name},${t.amount},${(t.memo || '').replace(/,/g, ' ')}\n`;
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `가계부_${currentYear}년_${currentMonth + 1}월.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast('CSV 파일이 다운로드되었습니다.', 'success');
}

/* ===== Toast ===== */
function toast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; el.style.transform = 'translateX(40px)'; setTimeout(() => el.remove(), 300); }, 2500);
}

/* ===== Init ===== */
document.addEventListener('DOMContentLoaded', init);
