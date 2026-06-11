/* v144 Critical Schedule Tab Content Restore
   Scope: restore monthly schedule tab content rendering only.
   - Summary cards are rendered inside the "ดูตามคน" tab only.
   - Restores content for day/person/balance/table tabs even if older patches leave an empty shell.
   - Keeps existing duty/OT/business calculations untouched.
*/
(function () {
  'use strict';

  const html = (v) => (typeof escapeHtml === 'function')
    ? escapeHtml(v == null ? '' : String(v))
    : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const toNum = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };
  const isTrue = (v) => v === true || String(v).toLowerCase() === 'true' || String(v) === '1';
  const LONG_LEAVE_WORDS = /(ลาบวช|บวช|ลาดูใจ|ดูใจ|ลาถือศีล|ถือศีล|ลาป่วยยาว|พักงานยาว|ลาระยะยาว|long.?term|maternity|mat\s*leave|ลาคลอด|คลอด)/i;

  function safeCall(fn, fallback) { try { return typeof fn === 'function' ? fn() : fallback; } catch (_) { return fallback; } }
  function parseD(date) {
    try { return typeof parseDate === 'function' ? parseDate(date) : new Date(`${date}T12:00:00`); }
    catch (_) { return new Date(`${date}T12:00:00`); }
  }
  function monthRange(key) {
    const [yy, mm] = String(key || (window.state && state.monthKey) || '').split('-').map(Number);
    const y = yy || new Date().getFullYear();
    const m = mm || (new Date().getMonth() + 1);
    return { y, m, last: new Date(y, m, 0).getDate() };
  }
  function prevMonthKey(key) {
    const { y, m } = monthRange(key);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function isWE(date) {
    try { if (typeof isWeekend === 'function') return !!isWeekend(date); } catch (_) {}
    const d = parseD(date).getDay();
    return d === 0 || d === 6;
  }
  function isHol(date) {
    try { if (typeof isHolidayDate === 'function' && isHolidayDate(date)) return true; } catch (_) {}
    try { if (typeof holidayName === 'function' && holidayName(date)) return true; } catch (_) {}
    try { if (typeof getHolidayName === 'function' && getHolidayName(date)) return true; } catch (_) {}
    return false;
  }
  function holName(date) {
    let name = '';
    try { if (typeof holidayName === 'function') name = holidayName(date) || ''; } catch (_) {}
    if (!name) { try { if (typeof getHolidayName === 'function') name = getHolidayName(date) || ''; } catch (_) {} }
    return String(name || '').split(':::')[0];
  }
  function dutyColumns() {
    const base = (typeof DUTY_COLUMNS !== 'undefined' && Array.isArray(DUTY_COLUMNS))
      ? DUTY_COLUMNS.slice()
      : ['ชบด1', 'ชบด2', 'ชบด3', 'ช4A', 'ช4B', 'ช3A', 'ช3B', 'ช9-เคิก', 'ช9-MT'];
    const out = [];
    base.forEach(raw => {
      const c = String(raw || '');
      if (/^(ช4|ช4-1|ช4-MT\/แตง 1|ช4-MT\/แตง)$/.test(c)) {
        if (!out.includes('ช4A')) out.push('ช4A');
        if (!out.includes('ช4B')) out.push('ช4B');
      } else if (/^(ช4-2|ช4-MT\/แตง 2)$/.test(c)) {
        if (!out.includes('ช4B')) out.push('ช4B');
      } else if (c && !out.includes(c)) out.push(c);
    });
    if (!out.includes('ช4A')) out.splice(Math.min(3, out.length), 0, 'ช4A');
    if (!out.includes('ช4B')) out.splice(Math.min(out.indexOf('ช4A') + 1, out.length), 0, 'ช4B');
    return out;
  }
  function dutyStaffLabel(code) {
    const c = String(code || '');
    if (/^(ช4A|ช4B|ช4|ช4-1|ช4-2|ช4-MT\/แตง)/.test(c)) return 'ช4';
    try { return (typeof DUTY_LABEL !== 'undefined' && DUTY_LABEL[c]) || c; } catch (_) { return c; }
  }
  function dutyIdx(code) { const i = dutyColumns().indexOf(code); return i < 0 ? 999 : i; }
  function staffList() {
    const arr = (window.state && Array.isArray(state.staff)) ? state.staff : [];
    const filtered = arr.filter(s => {
      try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : (s && s.is_active !== false && s.staff_type !== 'แพทย์' && s.roster_enabled !== false); }
      catch (_) { return s && s.is_active !== false; }
    });
    try { return typeof orderedStaff === 'function' ? orderedStaff(filtered) : filtered; } catch (_) { return filtered; }
  }
  function stById(id) { return ((window.state && state.staff) || []).find(s => String(s.id) === String(id)); }
  function staffName(st) { return st ? (st.nickname || st.full_name || st.name || '-') : '-'; }
  function staffColorSafe(st) { try { return typeof staffColor === 'function' ? staffColor(st) : (st?.staff_color || st?.color || '#e8f3ff'); } catch (_) { return '#e8f3ff'; } }
  function textColorSafe(bg) { try { return typeof textColorFor === 'function' ? textColorFor(bg) : '#1f2937'; } catch (_) { return '#1f2937'; } }
  function getAssignments() {
    try { if (typeof getAssignmentsForMonth === 'function') return getAssignmentsForMonth(state.monthKey) || []; } catch (_) {}
    return ((window.state && state.rosterAssignments) || []).filter(a => String(a.duty_date || '').startsWith(String(state.monthKey || '')));
  }
  function activeLeave(l) {
    const st = String(l?.status || l?.approval_status || 'active').toLowerCase();
    return !/reject|cancel|delete|ยกเลิก|ไม่อนุมัติ/.test(st);
  }
  function leaveType(l) { return String(l?.type || l?.leave_type || l?.reason || l?.note || '').trim(); }
  function dateInRange(date, l) {
    const start = String(l?.start_date || l?.work_date || '');
    const end = String(l?.end_date || l?.start_date || l?.work_date || '');
    return !!start && start <= date && date <= end;
  }
  function isLongTermFlag(st) {
    if (!st) return false;
    if (isTrue(st.is_long_term_leave) || isTrue(st.isLongTermLeave) || isTrue(st.long_term_leave)) return true;
    return LONG_LEAVE_WORDS.test(String(st.long_leave_reason || st.position_training_status || st.note || st.remark || ''));
  }
  function hasExplicitLongLeaveInMonth(st, key) {
    const { y, m, last } = monthRange(key);
    const start = `${y}-${pad2(m)}-01`;
    const end = `${y}-${pad2(m)}-${pad2(last)}`;
    return ((window.state && state.leaves) || []).some(l => {
      if (!activeLeave(l) || String(l.staff_id) !== String(st?.id)) return false;
      if (!LONG_LEAVE_WORDS.test(leaveType(l))) return false;
      const ls = String(l.start_date || l.work_date || '');
      const le = String(l.end_date || l.start_date || l.work_date || '');
      return ls <= end && le >= start;
    });
  }
  function isLongTermActual(st, key) { return isLongTermFlag(st) || hasExplicitLongLeaveInMonth(st, key || (window.state && state.monthKey)); }
  function targetRaw(st) { return st?.targetShifts ?? st?.target_shifts ?? st?.monthly_target_shifts ?? st?.quota_shifts; }
  function isTargetZeroOnly(st, key) {
    const raw = targetRaw(st);
    return !isLongTermActual(st, key) && raw !== undefined && raw !== null && raw !== '' && toNum(raw, 0) === 0;
  }
  function explicitLeaveLabels(st, date) {
    const labels = [];
    ((window.state && state.leaves) || []).filter(activeLeave).forEach(l => {
      if (String(l.staff_id) !== String(st?.id) || !dateInRange(date, l)) return;
      const t = leaveType(l);
      if (/ไม่รับเวร/.test(t)) labels.push('ไม่รับเวร');
      else if (/คลอด/.test(t)) labels.push('ลาคลอด');
      else if (/บวช/.test(t)) labels.push('ลาบวช');
      else if (/ดูใจ/.test(t)) labels.push('ลาดูใจ');
      else if (/ถือศีล/.test(t)) labels.push('ลาถือศีล');
      else if (/ป่วย/.test(t)) labels.push('ลาป่วย');
      else if (/กิจ/.test(t)) labels.push('ลากิจ');
      else if (/พักผ่อน|พักร้อน|annual/i.test(t)) labels.push('ลาพักผ่อน');
      else if (t) labels.push(t);
    });
    return [...new Set(labels)];
  }
  function statusLabels(st, date) {
    const labels = explicitLeaveLabels(st, date);
    if (isLongTermFlag(st) && labels.length === 0) labels.push('ลาระยะยาว');
    return [...new Set(labels)];
  }
  function statusClass(label) {
    if (label === 'ไม่รับเวร') return 'no-duty';
    if (label === 'ลาคลอด') return 'maternity';
    if (label === 'ลาระยะยาว' || /บวช|ดูใจ|ถือศีล/.test(label)) return 'long-leave';
    return 'leave';
  }
  function statusBadges(st, date) {
    return statusLabels(st, date).map(x => `<span class="v144-status ${statusClass(x)}">${html(x)}</span>`).join('');
  }
  function shiftPill(slot, st) {
    if (!slot || !st) return '';
    const bg = staffColorSafe(st), fg = textColorSafe(bg);
    const attrs = slot.id && typeof canRequestTrade === 'function' && canRequestTrade(slot)
      ? `data-trade-duty="${html(slot.id)}" title="คลิกเพื่อจัดการเวร"`
      : `data-staff-stat="${html(st.id)}" title="คลิกเพื่อดูสถิติ"`;
    return `<button type="button" class="v144-shift-pill" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}" ${attrs}>${html(dutyStaffLabel(slot.duty_code))}</button>`;
  }
  function computeStats(assignments) {
    try { if (typeof calcFairness === 'function') return calcFairness((assignments || []).filter(a => a.staff_id)) || {}; } catch (_) {}
    const out = {};
    (assignments || []).forEach(a => {
      if (!a.staff_id) return;
      out[a.staff_id] = out[a.staff_id] || { units: 0, hours: 0, pay: 0 };
      out[a.staff_id].units += 1;
    });
    return out;
  }
  function daysOffFor(st, key, assignments) {
    if (isLongTermActual(st, key) || isTargetZeroOnly(st, key)) return 0;
    const { y, m, last } = monthRange(key);
    let count = 0;
    for (let day = 1; day <= last; day++) {
      const date = `${y}-${pad2(m)}-${pad2(day)}`;
      if (!(isWE(date) || isHol(date))) continue;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(st.id) && String(a.duty_date) === date);
      if (!hasDuty || statusLabels(st, date).includes('ไม่รับเวร')) count++;
    }
    return count;
  }
  function viewId() {
    const v = (window.state && (state.scheduleView || state.scheduleMobileView)) || 'table';
    return v === 'ot' ? 'balance' : (['day', 'person', 'balance', 'table'].includes(v) ? v : 'table');
  }
  function setView(v) {
    if (!window.state) return;
    const next = v === 'ot' ? 'balance' : v;
    state.scheduleView = next;
    state.scheduleMobileView = next;
  }

  function tab(id, label, active) {
    return `<button type="button" class="v144-tab ${active === id ? 'active' : ''}" data-schedule-view="${id}" data-schedule-mobile-view="${id}">${html(label)}</button>`;
  }

  function renderGrid(assignments) {
    const { y, m, last } = monthRange(state.monthKey);
    const days = Array.from({ length: last }, (_, i) => i + 1);
    const staff = staffList();
    if (!staff.length) return `<div class="empty-state">ยังไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้จัดเวร</div>`;
    return `<div class="table-wrap desktop-schedule-table v144-grid-wrap"><table id="scheduleTable" class="v144-schedule-grid"><thead><tr><th class="v144-sticky-name">เจ้าหน้าที่</th>${days.map(day => {
      const date = `${y}-${pad2(m)}-${pad2(day)}`;
      const off = isWE(date) || isHol(date);
      return `<th class="${off ? 'v144-dayoff-col' : ''}">${day}<br><span>${html(parseD(date).toLocaleDateString('th-TH', { weekday:'short' }))}</span></th>`;
    }).join('')}</tr></thead><tbody>${staff.map((s, idx) => {
      const bg = staffColorSafe(s), fg = textColorSafe(bg);
      return `<tr class="${idx % 2 ? 'zebra' : ''}"><th class="v144-name-cell" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}"><button type="button" data-staff-stat="${html(s.id)}">${html(staffName(s))}</button></th>${days.map(day => {
        const date = `${y}-${pad2(m)}-${pad2(day)}`;
        const off = isWE(date) || isHol(date);
        const shifts = (assignments || []).filter(a => String(a.staff_id) === String(s.id) && String(a.duty_date) === date).sort((a, b) => dutyIdx(a.duty_code) - dutyIdx(b.duty_code));
        return `<td class="${off ? 'v144-dayoff-cell' : ''}"><div class="v144-cell-stack">${statusBadges(s, date)}${shifts.map(a => shiftPill(a, s)).join('')}</div></td>`;
      }).join('')}</tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderDayCards(assignments) {
    const { y, m, last } = monthRange(state.monthKey);
    return `<div class="v144-calendar-cards">${Array.from({ length: last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad2(m)}-${pad2(day)}`;
      const off = isWE(date) || isHol(date);
      const rows = (assignments || []).filter(a => String(a.duty_date) === date && a.staff_id).sort((a, b) => dutyIdx(a.duty_code) - dutyIdx(b.duty_code));
      return `<div class="v144-day-card ${off ? 'dayoff' : ''}"><div class="v144-day-head"><b>${day}</b><span>${html(parseD(date).toLocaleDateString('th-TH', { weekday:'short' }))}</span>${isHol(date) ? `<span class="badge yellow">${html(holName(date))}</span>` : ''}</div>${rows.length ? rows.map(a => { const s = stById(a.staff_id); return `<div class="v144-day-line"><span>${html(dutyStaffLabel(a.duty_code))}</span>${s ? shiftPill(a, s) : html(a.staff_id)}</div>`; }).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  }

  function renderSummaryCards(assignments) {
    const stats = computeStats(assignments || []);
    const staff = staffList();
    if (!staff.length) return '';
    return `<div class="v144-summary-cards">${staff.map(s => {
      const r = stats[s.id] || {};
      const bg = staffColorSafe(s), fg = textColorSafe(bg);
      return `<button type="button" class="v144-summary-card" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}" data-staff-stat="${html(s.id)}"><b>${html(staffName(s))}</b><span>${toNum(r.units ?? r.total, 0).toFixed(1)} เวร • ${toNum(r.hours, 0).toFixed(0)} ชม.</span></button>`;
    }).join('')}</div>`;
  }

  function renderPersonView(assignments) {
    const cards = staffList().map(s => {
      const bg = staffColorSafe(s), fg = textColorSafe(bg);
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a, b) => String(a.duty_date).localeCompare(String(b.duty_date)) || dutyIdx(a.duty_code) - dutyIdx(b.duty_code));
      return `<button type="button" class="v144-person-card" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}" data-staff-stat="${html(s.id)}"><b>${html(staffName(s))}</b><span>${rows.length} เวร</span><small>${rows.slice(0, 10).map(a => `${Number(String(a.duty_date).slice(-2))}:${dutyStaffLabel(a.duty_code)}`).join(' • ') || 'ไม่มีเวรเดือนนี้'}</small></button>`;
    }).join('');
    return `${renderSummaryCards(assignments)}<div class="v144-person-list">${cards}</div>`;
  }

  function renderBalance(assignments) {
    const key = state.monthKey;
    const prevKey = prevMonthKey(key);
    const staff = staffList();
    const stats = computeStats(assignments || []);
    const active = staff.filter(s => !isLongTermActual(s, key) && !isTargetZeroOnly(s, key));
    const values = active.map(s => toNum(stats[s.id]?.units ?? stats[s.id]?.total, 0));
    const avgQuota = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const prevAssignments = ((window.state && state.rosterAssignments) || []).filter(a => String(a.duty_date || '').startsWith(prevKey));
    const prevOffValues = active.map(s => daysOffFor(s, prevKey, prevAssignments));
    const avgPrevOff = prevOffValues.length ? prevOffValues.reduce((a, b) => a + b, 0) / prevOffValues.length : 0;
    const rows = staff.map(s => {
      const r = stats[s.id] || {};
      const longExempt = isLongTermActual(s, key);
      const zeroTarget = isTargetZeroOnly(s, key);
      const prevLong = isLongTermActual(s, prevKey);
      const exempt = longExempt || zeroTarget;
      const current = exempt ? 0 : toNum(r.units ?? r.total, 0);
      const target = exempt ? 0 : toNum(targetRaw(s), avgQuota);
      const gap = exempt ? 0 : target - current;
      const carry = (exempt || prevLong) ? 0 : toNum(s.carry_over_balance ?? s.overtime_balance ?? s.overtimeBalance ?? s.ot_balance, 0);
      const daysOff = exempt ? 0 : daysOffFor(s, key, assignments || []);
      const prevDaysOff = exempt ? 0 : daysOffFor(s, prevKey, prevAssignments);
      const nextOff = exempt ? 0 : avgPrevOff - prevDaysOff;
      const status = longExempt ? 'ยกเว้น/ลาระยะยาว' : zeroTarget ? 'ไม่มีเป้าหมายเวร' : prevLong ? 'รีเซ็ตยอดสะสมแล้ว' : Math.abs(gap) < 0.5 ? 'สมดุล' : gap > 0 ? 'ขาดเวร' : 'งานหนักเกิน';
      const cls = longExempt || zeroTarget ? 'exempt' : prevLong ? 'reset' : Math.abs(gap) < 0.5 ? 'ok' : gap > 0 ? 'warn' : 'over';
      const name = (typeof staffPill === 'function') ? staffPill(s) : html(staffName(s));
      return `<tr class="${exempt ? 'v144-exempt-row' : ''}"><td>${name}</td><td>${target.toFixed(1)}</td><td>${current.toFixed(1)}</td><td>${gap.toFixed(1)}</td><td>${carry.toFixed(1)} ชม.</td><td>${daysOff}</td><td>${nextOff.toFixed(1)}</td><td><span class="v144-balance-status ${cls}">${html(status)}</span></td></tr>`;
    }).join('');
    return `<div class="v144-balance-dashboard"><div class="notice soft-notice">ตารางนี้แยก “ลาระยะยาว” ออกจาก “ไม่มีเป้าหมายเวร” และรีเซ็ตยอดยกมาของคนที่เพิ่งกลับจากลาระยะยาว</div><div class="table-wrap"><table class="v144-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เป้าหมายเวร</th><th>เวรที่จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>จำนวนวันหยุด</th><th>ทบวันหยุดครั้งหน้า</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }

  function renderScheduleTabContent(assignments) {
    const v = viewId();
    try {
      if (v === 'day') return renderDayCards(assignments);
      if (v === 'person') return renderPersonView(assignments); // Summary cards live here only.
      if (v === 'balance') return renderBalance(assignments);
      return renderGrid(assignments);
    } catch (err) {
      console.error('v144 schedule tab render failed:', err);
      return `<div class="notice danger">แสดงแท็บตารางเวรไม่สำเร็จ: ${html(err.message || err)}</div>`;
    }
  }

  window.renderMonthlySchedulePage = function renderMonthlySchedulePageV144() {
    const assignments = getAssignments();
    const active = viewId();
    return `<div class="card schedule-page-card v144-schedule-page">
      <div class="toolbar no-print v144-toolbar">
        <label>เดือน <input type="month" id="scheduleMonthInput" value="${html(state.monthKey)}"></label>
        <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
        <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
      </div>
      <div class="v144-schedule-tabs no-print" aria-label="ตารางเวรประจำเดือน">
        ${tab('day', 'ดูตามวัน', active)}${tab('person', 'ดูตามคน', active)}${tab('balance', 'ดูสมดุล การกระจายเวร', active)}${tab('table', 'ตาราง', active)}
      </div>
      <h3 class="print-only">ตารางเวรประจำเดือน ${html(state.monthKey)}</h3>
      <div id="scheduleTabContent" class="v144-tab-content" data-active-view="${html(active)}">${renderScheduleTabContent(assignments)}</div>
      ${typeof renderDutyTradePanel === 'function' ? renderDutyTradePanel(assignments) : ''}
    </div>`;
  };
  try { renderMonthlySchedulePage = window.renderMonthlySchedulePage; } catch (_) {}

  // Keep read-only schedule calls functional for older handlers/exporters.
  window.renderReadOnlySchedule = function renderReadOnlyScheduleV144(assignments) {
    return renderScheduleTabContent(assignments || getAssignments());
  };
  try { renderReadOnlySchedule = window.renderReadOnlySchedule; } catch (_) {}

  function ensureScheduleRendered() {
    if (!window.state || state.page !== 'schedule') return;
    const content = document.getElementById('pageContent');
    if (!content) return;
    const shell = content.querySelector('.v144-schedule-page');
    const tabContent = content.querySelector('#scheduleTabContent');
    const emptyBroken = !tabContent || !tabContent.textContent.trim() || (!tabContent.querySelector('table') && !tabContent.querySelector('.v144-day-card') && !tabContent.querySelector('.v144-person-card') && !tabContent.querySelector('.v144-balance-dashboard'));
    if (!shell || emptyBroken) content.innerHTML = window.renderMonthlySchedulePage();
  }

  const priorRenderPage = window.renderPage;
  window.renderPage = function renderPageV144() {
    const result = (typeof priorRenderPage === 'function') ? priorRenderPage.apply(this, arguments) : undefined;
    ensureScheduleRendered();
    return result;
  };
  try { renderPage = window.renderPage; } catch (_) {}

  document.addEventListener('click', function v144ScheduleTabClick(e) {
    const t = e.target.closest('[data-schedule-view], [data-schedule-mobile-view]');
    if (!t) return;
    const v = t.dataset.scheduleView || t.dataset.scheduleMobileView;
    if (!['day', 'person', 'balance', 'table', 'ot'].includes(v)) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    setView(v);
    if (typeof renderPage === 'function') renderPage();
    else ensureScheduleRendered();
  }, true);

  const css = document.createElement('style');
  css.textContent = `
    .v144-schedule-tabs{position:sticky;top:0;z-index:90;display:flex;gap:8px;flex-wrap:wrap;background:#fff;padding:8px 0;margin-bottom:10px;border-bottom:1px solid #e5e7eb;pointer-events:auto!important}
    .v144-tab{cursor:pointer!important;pointer-events:auto!important;position:relative;z-index:91;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:7px 12px;font-weight:800}.v144-tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}
    .v144-tab-content{min-height:160px}.v144-grid-wrap{overflow:auto}.v144-schedule-grid,.v144-balance-table{border-collapse:collapse;width:max-content;min-width:100%;table-layout:fixed;font-size:12px}.v144-schedule-grid th,.v144-schedule-grid td,.v144-balance-table th,.v144-balance-table td{border:1px solid #e5e7eb;padding:3px 5px;vertical-align:top;line-height:1.15}.v144-sticky-name,.v144-name-cell{position:sticky;left:0;z-index:12;background:var(--staff-bg,#fff)!important;color:var(--staff-fg,#111827)!important;min-width:92px;max-width:110px}.v144-name-cell button{all:unset;cursor:pointer;font-weight:800}.v144-dayoff-col,.v144-dayoff-cell{background:#f1f5f9!important}.v144-cell-stack{display:flex;flex-direction:column;gap:2px;min-height:18px}.v144-shift-pill{border:0;border-radius:8px;padding:2px 5px;background:var(--staff-bg,#dbeafe);color:var(--staff-fg,#111827);font-weight:800;font-size:11px;line-height:1.1;cursor:pointer;white-space:nowrap}.v144-status{display:inline-block;border-radius:7px;padding:1px 4px;font-size:10px;font-weight:800;background:#f3f4f6;border:1px solid #d1d5db;color:#374151}.v144-status.no-duty{background:#fff7ed;border-color:#fdba74;color:#9a3412}.v144-status.maternity{background:#fef3c7;border-color:#fbbf24;color:#92400e}.v144-status.long-leave{background:#f1f5f9;border-color:#94a3b8;color:#334155}.v144-status.leave{background:#f8fafc;border-color:#cbd5e1;color:#475569}.v144-calendar-cards,.v144-person-list,.v144-summary-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v144-summary-cards{margin-bottom:12px}.v144-day-card,.v144-person-card,.v144-summary-card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:10px;text-align:left}.v144-day-card.dayoff{background:#f8fafc}.v144-day-head{display:flex;gap:6px;align-items:center;margin-bottom:8px}.v144-day-line{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:3px 0;border-top:1px dashed #e5e7eb}.v144-person-card,.v144-summary-card{cursor:pointer;background:var(--staff-bg,#fff);color:var(--staff-fg,#111827);display:flex;flex-direction:column;gap:4px}.v144-balance-status{display:inline-block;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800}.v144-balance-status.exempt{background:#f1f5f9;color:#334155}.v144-balance-status.reset,.v144-balance-status.ok{background:#dcfce7;color:#166534}.v144-balance-status.warn{background:#fef3c7;color:#92400e}.v144-balance-status.over{background:#fee2e2;color:#991b1b}
  `;
  document.head.appendChild(css);

  setTimeout(ensureScheduleRendered, 0);
})();
