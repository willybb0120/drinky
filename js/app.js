(function () {
  'use strict';

  const RING_CIRCUM = 2 * Math.PI * 85; // ≈ 534

  const el = {
    todayDate: document.getElementById('today-date'),
    ringFg: document.getElementById('ring-fg'),
    currentMl: document.getElementById('current-ml'),
    goalMl: document.getElementById('goal-ml'),
    percent: document.getElementById('percent'),
    containerGrid: document.getElementById('container-grid'),
    addContainerBtn: document.getElementById('add-container-btn'),
    recordList: document.getElementById('record-list'),
    emptyHint: document.getElementById('empty-hint'),
    progressSection: document.getElementById('progress-section'),
    calendarBtn: document.getElementById('calendar-btn'),
    calendarModal: document.getElementById('calendar-modal'),
    closeCalendar: document.getElementById('close-calendar'),
    calPrev: document.getElementById('cal-prev'),
    calNext: document.getElementById('cal-next'),
    calMonthLabel: document.getElementById('cal-month-label'),
    calGrid: document.getElementById('cal-grid'),
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    goalInput: document.getElementById('goal-input'),
    addContainerModal: document.getElementById('add-container-modal'),
    closeAddContainer: document.getElementById('close-add-container'),
    addContainerForm: document.getElementById('add-container-form'),
    addContainerIcon: document.getElementById('add-container-icon'),
    addContainerName: document.getElementById('add-container-name'),
    addContainerVolume: document.getElementById('add-container-volume'),
    dayDetailModal: document.getElementById('day-detail-modal'),
    closeDayDetail: document.getElementById('close-day-detail'),
    dayDetailTitle: document.getElementById('day-detail-title'),
    dayDetailSummary: document.getElementById('day-detail-summary'),
    dayDetailList: document.getElementById('day-detail-list'),
    dayDetailEmpty: document.getElementById('day-detail-empty'),
    editContainerModal: document.getElementById('edit-container-modal'),
    closeEditContainer: document.getElementById('close-edit-container'),
    editContainerForm: document.getElementById('edit-container-form'),
    editContainerId: document.getElementById('edit-container-id'),
    editContainerIcon: document.getElementById('edit-container-icon'),
    editContainerName: document.getElementById('edit-container-name'),
    editContainerVolume: document.getElementById('edit-container-volume'),
    deleteContainerBtn: document.getElementById('delete-container-btn'),
    toast: document.getElementById('toast')
  };

  let toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { el.toast.hidden = true; }, 1800);
  }

  function formatDate() {
    const d = new Date();
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} (${weekdays[d.getDay()]})`;
  }

  function formatDateFromKey(key) {
    const [y, m, d] = key.split('-').map(Number);
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    const dow = new Date(y, m - 1, d).getDay();
    return `${y}年${m}月${d}日 (週${weekdays[dow]})`;
  }

  function formatTime(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  function renderRing() {
    const goal = Storage.getGoal();
    const total = Storage.getTodayTotal();
    const pct = Math.min(1, total / goal);
    el.ringFg.setAttribute('stroke-dashoffset', RING_CIRCUM * (1 - pct));
    el.ringFg.classList.toggle('complete', total >= goal);
    el.currentMl.textContent = total;
    el.goalMl.textContent = goal;
    el.percent.textContent = Math.round(pct * 100) + '%';
  }

  function renderContainerGrid() {
    const containers = Storage.getContainers();
    el.containerGrid.innerHTML = '';
    containers.forEach(c => {
      const btn = document.createElement('button');
      btn.className = 'container-btn';
      btn.dataset.id = c.id;
      btn.innerHTML = `
        <span class="icon">${escapeHtml(c.icon)}</span>
        <span class="name">${escapeHtml(c.name)}</span>
        <span class="volume">${c.volumeMl} ml</span>
      `;
      btn.addEventListener('click', () => {
        Storage.addRecord(c.volumeMl, c.id);
        render();
        toast(`+${c.volumeMl}ml ${c.name}`);
      });

      const editBtn = document.createElement('button');
      editBtn.className = 'container-edit-btn';
      editBtn.type = 'button';
      editBtn.setAttribute('aria-label', '編輯');
      editBtn.textContent = '✏️';
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        el.editContainerId.value = c.id;
        el.editContainerIcon.value = c.icon;
        el.editContainerName.value = c.name;
        el.editContainerVolume.value = c.volumeMl;
        openModal(el.editContainerModal);
      });
      btn.appendChild(editBtn);

      el.containerGrid.appendChild(btn);
    });
  }

  function renderRecords() {
    const records = Storage.getTodayRecords();
    el.recordList.innerHTML = '';
    el.emptyHint.hidden = records.length > 0;
    records.forEach(r => {
      const li = document.createElement('li');
      li.className = 'record-item';
      const icon = r.containerIconSnapshot || '💧';
      const name = r.containerNameSnapshot || '手動輸入';
      li.innerHTML = `
        <span class="record-icon">${escapeHtml(icon)}</span>
        <div class="record-info">
          <div class="record-name">${escapeHtml(name)}</div>
          <div class="record-time">${formatTime(r.at)}</div>
        </div>
        <span class="record-ml">${r.ml} ml</span>
        <button class="del-btn" aria-label="刪除" data-id="${r.id}">🗑</button>
      `;
      li.querySelector('.del-btn').addEventListener('click', () => {
        if (confirm(`刪除這筆紀錄（${r.ml}ml）？`)) {
          Storage.deleteRecord(r.id);
          render();
        }
      });
      el.recordList.appendChild(li);
    });
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function render() {
    renderRing();
    renderContainerGrid();
    renderRecords();
  }

  function openModal(m) { m.hidden = false; }
  function closeModal(m) { m.hidden = true; }

  function openDayDetail(key) {
    const records = Storage.getDayRecords(key);
    const total = records.reduce((s, r) => s + r.ml, 0);
    const goal = Storage.getGoal();

    el.dayDetailTitle.textContent = formatDateFromKey(key);
    el.dayDetailSummary.textContent = total > 0
      ? `共 ${total} ml（目標 ${goal} ml，${Math.round(total / goal * 100)}%）`
      : '';
    el.dayDetailEmpty.hidden = records.length > 0;
    el.dayDetailList.innerHTML = '';
    records.forEach(r => {
      const li = document.createElement('li');
      li.className = 'record-item';
      const icon = r.containerIconSnapshot || '💧';
      const name = r.containerNameSnapshot || '手動輸入';
      li.innerHTML = `
        <span class="record-icon">${escapeHtml(icon)}</span>
        <div class="record-info">
          <div class="record-name">${escapeHtml(name)}</div>
          <div class="record-time">${formatTime(r.at)}</div>
        </div>
        <span class="record-ml">${r.ml} ml</span>
      `;
      el.dayDetailList.appendChild(li);
    });
    openModal(el.dayDetailModal);
  }

  el.closeDayDetail.addEventListener('click', () => closeModal(el.dayDetailModal));
  el.dayDetailModal.addEventListener('click', (e) => {
    if (e.target === el.dayDetailModal) closeModal(el.dayDetailModal);
  });

  // Calendar
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();

  function renderCalendar() {
    const goal = Storage.getGoal();
    const totals = Storage.getMonthTotals(calYear, calMonth);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startDow = new Date(calYear, calMonth, 1).getDay();
    const todayKey = Storage.todayKey();

    el.calMonthLabel.textContent = `${calYear} 年 ${calMonth + 1} 月`;
    el.calGrid.innerHTML = '';

    for (let i = 0; i < startDow; i++) {
      const empty = document.createElement('div');
      empty.className = 'cal-cell cal-cell--empty';
      el.calGrid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const total = totals[key] || 0;
      let statusClass = total === 0 ? 'cal-cell--none'
        : total >= goal ? 'cal-cell--met'
        : 'cal-cell--partial';

      const cell = document.createElement('div');
      cell.className = `cal-cell ${statusClass}`;
      if (key === todayKey) cell.classList.add('cal-cell--today');

      const mlText = total > 0
        ? (total >= 1000 ? (total / 1000).toFixed(1) + 'L' : total + 'ml')
        : '';
      cell.innerHTML = `<span class="cal-day-num">${d}</span>${mlText ? `<span class="cal-day-ml">${mlText}</span>` : ''}`;
      cell.style.cursor = 'pointer';
      cell.addEventListener('click', () => openDayDetail(key));
      el.calGrid.appendChild(cell);
    }
  }

  el.calendarBtn.addEventListener('click', () => {
    calYear = new Date().getFullYear();
    calMonth = new Date().getMonth();
    renderCalendar();
    openModal(el.calendarModal);
  });
  el.closeCalendar.addEventListener('click', () => closeModal(el.calendarModal));
  el.calendarModal.addEventListener('click', (e) => {
    if (e.target === el.calendarModal) closeModal(el.calendarModal);
  });
  el.calPrev.addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });
  el.calNext.addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
  // Progress ring → open settings
  function openSettings() {
    el.goalInput.value = Storage.getGoal();
    openModal(el.settingsModal);
  }

  el.progressSection.addEventListener('click', openSettings);
  el.progressSection.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(); }
  });

  // Settings modal
  el.closeSettings.addEventListener('click', () => {
    closeModal(el.settingsModal);
    render();
  });
  el.settingsModal.addEventListener('click', (e) => {
    if (e.target === el.settingsModal) {
      closeModal(el.settingsModal);
      render();
    }
  });

  el.goalInput.addEventListener('change', () => {
    Storage.setGoal(Number(el.goalInput.value));
    el.goalInput.value = Storage.getGoal();
    renderRing();
  });

  // Edit container modal
  el.deleteContainerBtn.addEventListener('click', () => {
    const id = el.editContainerId.value;
    if (Storage.getContainers().length <= 1) {
      toast('至少保留一個容器');
      return;
    }
    if (confirm('刪除此容器？\n歷史紀錄會保留當下的名稱。')) {
      Storage.softDeleteContainer(id);
      closeModal(el.editContainerModal);
      render();
      toast('容器已刪除');
    }
  });
  el.closeEditContainer.addEventListener('click', () => closeModal(el.editContainerModal));
  el.editContainerModal.addEventListener('click', (e) => {
    if (e.target === el.editContainerModal) closeModal(el.editContainerModal);
  });
  el.editContainerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = el.editContainerId.value;
    const icon = el.editContainerIcon.value.trim() || '💧';
    const name = el.editContainerName.value.trim();
    const volumeMl = Number(el.editContainerVolume.value);
    if (!name || !volumeMl) return;
    Storage.updateContainer(id, { icon, name, volumeMl });
    closeModal(el.editContainerModal);
    render();
    toast('容器已更新');
  });

  // Add container modal
  el.addContainerBtn.addEventListener('click', () => {
    el.addContainerForm.reset();
    openModal(el.addContainerModal);
    setTimeout(() => el.addContainerIcon.focus(), 100);
  });
  el.closeAddContainer.addEventListener('click', () => closeModal(el.addContainerModal));
  el.addContainerModal.addEventListener('click', (e) => {
    if (e.target === el.addContainerModal) closeModal(el.addContainerModal);
  });
  el.addContainerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const icon = el.addContainerIcon.value.trim() || '💧';
    const name = el.addContainerName.value.trim();
    const volumeMl = Number(el.addContainerVolume.value);
    if (!name || !volumeMl) return;
    Storage.addContainer({ icon, name, volumeMl });
    closeModal(el.addContainerModal);
    render();
    toast(`已新增容器：${name}`);
  });

  // Init
  el.todayDate.textContent = formatDate();
  closeModal(el.calendarModal);
  closeModal(el.dayDetailModal);
  closeModal(el.settingsModal);
  closeModal(el.addContainerModal);
  closeModal(el.editContainerModal);
  render();

  // Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => {
        console.warn('SW register failed:', err);
      });
    });
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
})();
