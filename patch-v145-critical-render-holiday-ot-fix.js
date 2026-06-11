/* v145 Critical Render/Holiday/OT Filter Fix
   Scope only:
   1) Prevent white screen in monthly schedule tabs with defensive rendering.
   2) Strict holiday matching so holiday tags do not show on every day.
   3) Add OT status filter with Pending default.
*/
(function () {
  'use strict';

  const esc = (v) => {
    const s = v == null ? '' : String(v);
    if (typeof window.escapeHtml === 'function') {
      try { return window.escapeHtml(s); } catch (_) {}
    }
    return s.replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const arr = (v) => Array.isArray(v) ? v : [];
  const num = (v, f = 0) => { const n = Number(v); return Number.isFinite(n) ? n : f; };
  const getState = () => window.state || {};
  const cleanHolidayTitle = (v) => String(v || '').split(':::')[0].trim();
  const toDateKey = (v) => String(v || '').slice(0, 10);
  const parseLocalDate = (date) => {
    const s = toDateKey(date);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    return Number.isFinite(d.getTime()) ? d : null;
  };
  const monthParts = () => {
    const key = String(getState().monthKey || new Date().toISOString().slice(0, 7));
    const [y0, m0] = key.split('-').map(Number);
    const y = Number.isFinite(y0) ? y0 : new Date().getFullYear();
    const m = Number.isFinite(m0) ? m0 : new Date().getMonth() + 1;
    return { key: `${y}-${pad2(m)}`, y, m, last: new Date(y, m, 0).getDate() };
  };

  // ------------------------------------------------------------------
  // Strict holiday matcher: exact YYYY-MM-DD only. No default holiday text.
  // This fixes the bug where every day was tagged as a public holiday.
  // ------------------------------------------------------------------
  function strictHolidayRow(date) {
    const key = toDateKey(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    return arr(getState().holidays).find(h => toDateKey(h && (h.holiday_date || h.date || h.work_date)) === key) || null;
  }
  window.isHolidayDate = function isHolidayDateV145(date) { return !!strictHolidayRow(date); };
  window.holidayName = function holidayNameV145(date) {
    const h = strictHolidayRow(date);
    return h ? cleanHolidayTitle(h.title || h.name || h.holiday_name || 'วันหยุดราชการ') : '';
  };
  try { isHolidayDate = window.isHolidayDate; } catch (_) {}
  try { holidayName = window.holidayName; } catch (_) {}

  const isWeekendSafe = (date) => {
    const d = parseLocalDate(date);
    if (!d) return false;
    const day = d.getDay();
    return day === 0 || day === 6;
  };
  const isDayOff = (date) => isWeekendSafe(date) || window.isHolidayDate(date);
  const thaiDow = (date) => {
    const d = parseLocalDate(date);
    return d ? d.toLocaleDateString('th-TH', { weekday: 'short' }) : '';
  };

  function dutyColumnsSafe() {
    const source = arr(window.DUTY_COLUMNS || (typeof DUTY_COLUMNS !== 'undefined' ? DUTY_COLUMNS : null));
    const base = source.length ? source : ['ชบด1', 'ชบด2', 'ชบด3', 'ช4A', 'ช4B', 'ช3A', 'ช3B', 'ช9-เคิก', 'ช9-MT'];
    const out = [];
    base.forEach(x => {
      const c = String(x || '').trim();
      if (!c) return;
      if (/^(ช4|ช4-1|ช4A|ช4-MT\/แตง 1|ช4-MT\/แตง)$/i.test(c)) {
        if (!out.includes('ช4A')) out.push('ช4A');
        if (!out.includes('ช4B')) out.push('ช4B');
      } else if (/^(ช4-2|ช4B|ช4-MT\/แตง 2)$/i.test(c)) {
        if (!out.includes('ช4B')) out.push('ช4B');
      } else if (!out.includes(c)) out.push(c);
    });
    if (!out.includes('ช4A')) out.splice(Math.min(3, out.length), 0, 'ช4A');
    if (!out.includes('ช4B')) out.splice(Math.min(out.indexOf('ช4A') + 1, out.length), 0, 'ช4B');
    return out;
  }
  function dutyLabelSafe(code, staffView) {
    const c = String(code || '');
    if (/^(ช4A|ช4B|ช4|ช4-1|ช4-2|ช4-MT\/แตง)/.test(c)) return staffView ? 'ช4' : (c === 'ช4B' ? 'ช4 (2)' : 'ช4 (1)');
    try { return (window.DUTY_LABEL && window.DUTY_LABEL[c]) || (typeof DUTY_LABEL !== 'undefined' && DUTY_LABEL[c]) || c; } catch (_) { return c; }
  }
  const dutyOrder = (code) => {
    const idx = dutyColumnsSafe().indexOf(String(code || ''));
    return idx < 0 ? 999 : idx;
  };

  function rosterStaff() {
    const list = arr(getState().staff).filter(s => {
      if (!s) return false;
      try { if (typeof window.isRosterEnabled === 'function') return !!window.isRosterEnabled(s); } catch (_) {}
      return s.is_active !== false && s.roster_enabled !== false && s.staff_type !== 'แพทย์';
    });
    try { return typeof window.orderedStaff === 'function' ? arr(window.orderedStaff(list)) : list; } catch (_) { return list; }
  }
  function staffById(id) { return arr(getState().staff).find(s => String(s.id) === String(id)) || null; }
  function staffNameSafe(sOrId) {
    const s = typeof sOrId === 'object' ? sOrId : staffById(sOrId);
    return s ? (s.nickname || s.full_name || s.name || '-') : '-';
  }
  function staffColorSafe(s) {
    try { if (typeof window.staffColor === 'function') return window.staffColor(s); } catch (_) {}
    return s?.staff_color || s?.color || '#e0f2fe';
  }
  function textColorSafe(bg) {
    try { if (typeof window.textColorFor === 'function') return window.textColorFor(bg); } catch (_) {}
    return '#111827';
  }
  function assignmentsForMonth() {
    const key = monthParts().key;
    try {
      if (typeof window.getAssignmentsForMonth === 'function') return arr(window.getAssignmentsForMonth(key));
      if (typeof getAssignmentsForMonth === 'function') return arr(getAssignmentsForMonth(key));
    } catch (e) { console.warn('v145 getAssignmentsForMonth failed', e); }
    return arr(getState().rosterAssignments).filter(a => toDateKey(a?.duty_date).startsWith(key));
  }

  const activeLeave = (l) => !/reject|cancel|delete|ยกเลิก|ไม่อนุมัติ/i.test(String(l?.status || l?.approval_status || 'active'));
  function leaveText(l) {
    const t = String(l?.type || l?.leave_type || l?.reason || l?.note || '').trim();
    if (/ไม่รับเวร/.test(t)) return 'ไม่รับเวร';
    if (/คลอด/.test(t)) return 'ลาคลอด';
    if (/บวช/.test(t)) return 'ลาบวช';
    if (/ดูใจ/.test(t)) return 'ลาดูใจ';
    if (/ถือศีล/.test(t)) return 'ลาถือศีล';
    if (/ป่วย/.test(t)) return 'ลาป่วย';
    if (/กิจ/.test(t)) return 'ลากิจ';
    if (/พักผ่อน|พักร้อน|annual/i.test(t)) return 'ลาพักผ่อน';
    return t || 'ลา';
  }
  function dateInLeave(date, l) {
    const start = toDateKey(l?.start_date || l?.work_date || l?.date);
    const end = toDateKey(l?.end_date || l?.start_date || l?.work_date || l?.date);
    return !!start && start <= date && date <= end;
  }
  function isTrue(v) { return v === true || String(v).toLowerCase() === 'true' || String(v) === '1'; }
  function isLongTermStaff(s) {
    if (!s) return false;
    return isTrue(s.is_long_term_leave) || isTrue(s.isLongTermLeave) || isTrue(s.long_term_leave);
  }
  function statusLabels(s, date) {
    const labels = arr(getState().leaves).filter(l => activeLeave(l) && String(l.staff_id) === String(s?.id) && dateInLeave(date, l)).map(leaveText);
    if (labels.length === 0 && isLongTermStaff(s)) labels.push('ลาระยะยาว');
    return [...new Set(labels)];
  }
  function statusBadge(label) {
    const cls = label === 'ไม่รับเวร' ? 'no-duty' : /ลาระยะยาว|บวช|ดูใจ|ถือศีล/.test(label) ? 'long' : /คลอด/.test(label) ? 'mat' : 'leave';
    return `<span class="v145-status ${cls}">${esc(label)}</span>`;
  }
  function shiftPill(a, s) {
    if (!a || !s) return '';
    const bg = staffColorSafe(s), fg = textColorSafe(bg);
    const id = esc(a.id || '');
    const attrs = id ? `data-trade-duty="${id}"` : `data-staff-stat="${esc(s.id)}"`;
    return `<button type="button" class="v145-shift-pill" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}" ${attrs}>${esc(dutyLabelSafe(a.duty_code, true))}</button>`;
  }

  function safeStats(assignments) {
    try { if (typeof window.calcFairness === 'function') return window.calcFairness(arr(assignments).filter(a => a?.staff_id)) || {}; } catch (_) {}
    const out = {};
    arr(assignments).forEach(a => {
      if (!a?.staff_id) return;
      out[a.staff_id] = out[a.staff_id] || { units: 0, hours: 0, pay: 0, total: 0 };
      out[a.staff_id].units += 1;
      out[a.staff_id].total += 1;
    });
    return out;
  }
  function targetShifts(s, fallback) {
    const raw = s?.targetShifts ?? s?.target_shifts ?? s?.monthly_target_shifts ?? s?.quota_shifts;
    if (raw === undefined || raw === null || raw === '') return fallback;
    return num(raw, fallback);
  }
  function isTargetZeroOnly(s) { return !isLongTermStaff(s) && targetShifts(s, NaN) === 0; }
  function daysOff(s, assignments) {
    if (isLongTermStaff(s) || isTargetZeroOnly(s)) return 0;
    const { y, m, last } = monthParts();
    let n = 0;
    for (let d = 1; d <= last; d++) {
      const date = `${y}-${pad2(m)}-${pad2(d)}`;
      if (!isDayOff(date)) continue;
      const hasDuty = arr(assignments).some(a => String(a?.staff_id) === String(s.id) && toDateKey(a?.duty_date) === date);
      const noDuty = statusLabels(s, date).includes('ไม่รับเวร');
      if (!hasDuty || noDuty) n++;
    }
    return n;
  }

  function currentScheduleView() {
    const v = String(getState().scheduleView || getState().scheduleMobileView || 'day');
    if (v === 'ot') return 'balance';
    return ['day', 'person', 'balance', 'table'].includes(v) ? v : 'day';
  }
  function setScheduleView(v) {
    const next = v === 'ot' ? 'balance' : v;
    if (window.state) { state.scheduleView = next; state.scheduleMobileView = next; }
  }
  function tabButton(id, label, active) {
    return `<button type="button" class="v145-tab ${active === id ? 'active' : ''}" data-v145-schedule-tab="${id}">${esc(label)}</button>`;
  }

  function renderGrid(assignments) {
    const { y, m, last } = monthParts();
    const staff = rosterStaff();
    if (!staff.length) return `<div class="empty-state">ไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้จัดเวร</div>`;
    const days = Array.from({ length: last }, (_, i) => i + 1);
    return `<div class="table-wrap v145-grid-wrap"><table id="scheduleTable" class="v145-grid"><thead><tr><th class="v145-name-head">เจ้าหน้าที่</th>${days.map(d => {
      const date = `${y}-${pad2(m)}-${pad2(d)}`;
      return `<th class="${isDayOff(date) ? 'v145-off-col' : ''}">${d}<br><span>${esc(thaiDow(date))}</span></th>`;
    }).join('')}</tr></thead><tbody>${staff.map((s, i) => {
      const bg = staffColorSafe(s), fg = textColorSafe(bg);
      return `<tr class="${i % 2 ? 'zebra' : ''}"><th class="v145-name-cell" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}"><button type="button" data-staff-stat="${esc(s.id)}">${esc(staffNameSafe(s))}</button></th>${days.map(d => {
        const date = `${y}-${pad2(m)}-${pad2(d)}`;
        const shifts = arr(assignments).filter(a => String(a?.staff_id) === String(s.id) && toDateKey(a?.duty_date) === date).sort((a,b) => dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code));
        return `<td class="${isDayOff(date) ? 'v145-off-cell' : ''}"><div class="v145-cell-stack">${statusLabels(s, date).map(statusBadge).join('')}${shifts.map(a => shiftPill(a, s)).join('')}</div></td>`;
      }).join('')}</tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderDay(assignments) {
    const { y, m, last } = monthParts();
    return `<div class="v145-day-cards">${Array.from({ length: last }, (_, i) => i + 1).map(d => {
      const date = `${y}-${pad2(m)}-${pad2(d)}`;
      const rows = arr(assignments).filter(a => toDateKey(a?.duty_date) === date && a?.staff_id).sort((a,b) => dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code));
      return `<div class="v145-day-card ${isDayOff(date) ? 'off' : ''}"><div class="v145-day-head"><b>${d}</b><span>${esc(thaiDow(date))}</span>${window.isHolidayDate(date) ? `<span class="badge yellow">${esc(window.holidayName(date))}</span>` : ''}</div>${rows.length ? rows.map(a => { const s = staffById(a.staff_id); return `<div class="v145-day-line"><b>${esc(dutyLabelSafe(a.duty_code, true))}</b>${s ? shiftPill(a, s) : `<span>${esc(a.staff_id)}</span>`}</div>`; }).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  }
  function renderPerson(assignments) {
    const stats = safeStats(assignments);
    const staff = rosterStaff();
    const summary = `<div class="v145-summary-cards">${staff.map(s => { const bg=staffColorSafe(s), fg=textColorSafe(bg); const r=stats[s.id]||{}; return `<button type="button" class="v145-summary-card" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}" data-staff-stat="${esc(s.id)}"><b>${esc(staffNameSafe(s))}</b><span>${num(r.units ?? r.total,0).toFixed(1)} เวร • ${num(r.hours,0).toFixed(0)} ชม.</span></button>`; }).join('')}</div>`;
    const list = `<div class="v145-person-list">${staff.map(s => { const bg=staffColorSafe(s), fg=textColorSafe(bg); const rows=arr(assignments).filter(a => String(a?.staff_id)===String(s.id)).sort((a,b)=>toDateKey(a?.duty_date).localeCompare(toDateKey(b?.duty_date))||dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code)); return `<button type="button" class="v145-person-card" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}" data-staff-stat="${esc(s.id)}"><b>${esc(staffNameSafe(s))}</b><span>${rows.length} เวร</span><small>${rows.slice(0,12).map(a => `${Number(toDateKey(a?.duty_date).slice(-2))}:${dutyLabelSafe(a?.duty_code,true)}`).join(' • ') || 'ไม่มีเวรเดือนนี้'}</small></button>`; }).join('')}</div>`;
    return summary + list;
  }
  function renderBalance(assignments) {
    const staff = rosterStaff();
    const stats = safeStats(assignments);
    const nonExempt = staff.filter(s => !isLongTermStaff(s) && !isTargetZeroOnly(s));
    const avg = nonExempt.length ? nonExempt.reduce((sum, s) => sum + num(stats[s.id]?.units ?? stats[s.id]?.total, 0), 0) / nonExempt.length : 0;
    const rows = staff.map(s => {
      const long = isLongTermStaff(s);
      const zero = isTargetZeroOnly(s);
      const exempt = long || zero;
      const current = exempt ? 0 : num(stats[s.id]?.units ?? stats[s.id]?.total, 0);
      const target = exempt ? 0 : targetShifts(s, avg);
      const gap = exempt ? 0 : target - current;
      const carry = exempt ? 0 : num(s.carry_over_balance ?? s.overtime_balance ?? s.overtimeBalance ?? s.ot_balance, 0);
      const off = exempt ? 0 : daysOff(s, assignments);
      const status = long ? 'ยกเว้น/ลาระยะยาว' : zero ? 'ไม่มีเป้าหมายเวร' : Math.abs(gap) < 0.5 ? 'สมดุล' : gap > 0 ? 'ขาดเวร' : 'งานหนักเกิน';
      const cls = long || zero ? 'exempt' : Math.abs(gap) < 0.5 ? 'ok' : gap > 0 ? 'warn' : 'over';
      const name = (typeof window.staffPill === 'function') ? window.staffPill(s) : esc(staffNameSafe(s));
      return `<tr><td>${name}</td><td>${target.toFixed(1)}</td><td>${current.toFixed(1)}</td><td>${gap.toFixed(1)}</td><td>${carry.toFixed(1)} ชม.</td><td>${off}</td><td><span class="v145-balance ${cls}">${esc(status)}</span></td></tr>`;
    }).join('');
    return `<div class="v145-balance-wrap"><div class="notice soft-notice">ลาระยะยาวและคนที่ไม่มีเป้าหมายเวรถูกแยกออกจากการคำนวณยอดติดลบ</div><div class="table-wrap"><table class="v145-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เป้าหมายเวร</th><th>เวรที่จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>จำนวนวันหยุด</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="7">ไม่มีข้อมูล</td></tr>'}</tbody></table></div></div>`;
  }
  function renderTabContent(view, assignments) {
    try {
      if (view === 'day') return renderDay(assignments);
      if (view === 'person') return renderPerson(assignments);
      if (view === 'balance') return renderBalance(assignments);
      return renderGrid(assignments);
    } catch (err) {
      console.error('v145 tab render error:', err);
      return `<div class="notice danger">ไม่สามารถแสดงข้อมูลแท็บนี้ได้: ${esc(err && (err.message || err))}</div>`;
    }
  }

  window.renderMonthlySchedulePage = function renderMonthlySchedulePageV145() {
    const assignments = assignmentsForMonth();
    const active = currentScheduleView();
    const trade = (() => { try { return typeof window.renderDutyTradePanel === 'function' ? window.renderDutyTradePanel(assignments) : ''; } catch (_) { return ''; } })();
    return `<div class="card schedule-page-card v145-schedule-page">
      <div class="toolbar no-print v145-toolbar"><label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(monthParts().key)}"></label><button class="ghost-btn" data-export-schedule-excel>Export Excel</button><button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button></div>
      <div class="v145-tabs no-print">${tabButton('day','ดูตามวัน',active)}${tabButton('person','ดูตามคน',active)}${tabButton('balance','ดูสมดุล การกระจายเวร',active)}${tabButton('table','ตาราง',active)}</div>
      <h3 class="print-only">ตารางเวรประจำเดือน ${esc(monthParts().key)}</h3>
      <div id="scheduleTabContent" class="v145-tab-content" data-active-view="${esc(active)}">${renderTabContent(active, assignments)}</div>
      ${trade}
    </div>`;
  };
  try { renderMonthlySchedulePage = window.renderMonthlySchedulePage; } catch (_) {}
  window.renderReadOnlySchedule = function renderReadOnlyScheduleV145(assignments) { return renderGrid(assignments || assignmentsForMonth()); };
  try { renderReadOnlySchedule = window.renderReadOnlySchedule; } catch (_) {}

  function renderScheduleDirect() {
    const pc = document.getElementById('pageContent');
    if (!pc) return false;
    try {
      const title = document.getElementById('pageTitle');
      const sub = document.getElementById('pageSubtitle');
      if (title) title.textContent = 'ตารางเวรประจำเดือน';
      if (sub) sub.textContent = 'ดูตามวัน / ดูตามคน / ดูสมดุล / ตาราง';
      pc.innerHTML = window.renderMonthlySchedulePage();
      return true;
    } catch (err) {
      console.error('v145 direct schedule render failed:', err);
      pc.innerHTML = `<div class="notice danger">หน้า “ตารางเวรประจำเดือน” มีข้อผิดพลาด: ${esc(err && (err.message || err))}</div>`;
      return false;
    }
  }

  const previousRenderPage = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
  window.renderPage = function renderPageV145() {
    if (getState().page === 'schedule') return renderScheduleDirect();
    try { return typeof previousRenderPage === 'function' ? previousRenderPage.apply(this, arguments) : undefined; }
    catch (err) {
      console.error('v145 renderPage caught error:', err);
      const pc = document.getElementById('pageContent');
      if (pc) pc.innerHTML = `<div class="notice danger">เกิดข้อผิดพลาดในการแสดงหน้า: ${esc(err && (err.message || err))}</div>`;
      return undefined;
    }
  };
  try { renderPage = window.renderPage; } catch (_) {}

  document.addEventListener('click', function (e) {
    const t = e.target && e.target.closest && e.target.closest('[data-v145-schedule-tab],[data-schedule-view],[data-schedule-mobile-view]');
    if (!t) return;
    const v = t.dataset.v145ScheduleTab || t.dataset.scheduleView || t.dataset.scheduleMobileView;
    if (!['day','person','balance','table','ot'].includes(v)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    setScheduleView(v);
    renderScheduleDirect();
  }, true);

  // ------------------------------------------------------------------
  // OT status filter: default Pending first.
  // ------------------------------------------------------------------
  function statusGroup(row) {
    const s = String(row?.status || row?.approval_status || '').toLowerCase();
    if (/approved|approve|อนุมัติ|verified|ยืนยัน/.test(s)) return 'approved';
    if (/reject|rejected|ไม่อนุมัติ|cancel|ยกเลิก/.test(s)) return 'rejected';
    return 'pending';
  }
  function otFilterState() {
    if (!window.state) return { status: 'pending' };
    if (!state.otFilterStatus) state.otFilterStatus = 'pending';
    return {
      status: state.otFilterStatus || 'pending',
      month: state.otFilterMonth || state.monthKey || new Date().toISOString().slice(0,7),
      date: state.otFilterDate || '',
      q: String(state.otFilterText || '').trim().toLowerCase()
    };
  }
  function staffNameById(id) { return staffNameSafe(id); }
  function filterOtRows(rows) {
    const f = otFilterState();
    return arr(rows).filter(r => {
      if (f.status !== 'all' && statusGroup(r) !== f.status) return false;
      const d = toDateKey(r?.work_date);
      if (f.date && d !== f.date) return false;
      if (!f.date && f.month && !d.startsWith(f.month)) return false;
      if (f.q) {
        const hay = [staffNameById(r?.staff_id), r?.reason, r?.note, r?.status, d].join(' ').toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      return true;
    }).sort((a,b) => toDateKey(b?.work_date).localeCompare(toDateKey(a?.work_date)) || String(b?.created_at || b?.check_out_at || '').localeCompare(String(a?.created_at || a?.check_out_at || '')));
  }
  function otFilterBar(total, shown) {
    const f = otFilterState();
    const opt = (v, label) => `<option value="${v}" ${f.status===v?'selected':''}>${label}</option>`;
    return `<div class="toolbar compact-filter no-print v145-ot-filter"><label>สถานะ <select id="otFilterStatus">${opt('all','ทั้งหมด')}${opt('pending','รออนุมัติ')}${opt('approved','อนุมัติ')}${opt('rejected','ไม่อนุมัติ')}</select></label><label>เดือน/ปี <input type="month" id="otFilterMonth" value="${esc(f.month)}"></label><label>ค้นตามวันที่ทำงาน <input type="date" id="otFilterDate" value="${esc(f.date)}"></label><label>ค้นหา <input type="search" id="otFilterText" value="${esc(f.q)}" placeholder="ชื่อ / เหตุผล / สถานะ"></label><button type="button" class="ghost-btn" data-clear-ot-filter>ล้างตัวกรอง</button><span class="badge blue">แสดง ${shown}/${total} รายการ</span></div>`;
  }
  const previousRenderOtTable = window.renderOtTable || (typeof renderOtTable === 'function' ? renderOtTable : null);
  window.renderOtTable = function renderOtTableV145(rows) {
    const filtered = filterOtRows(rows);
    return typeof previousRenderOtTable === 'function' ? previousRenderOtTable(filtered) : '';
  };
  try { renderOtTable = window.renderOtTable; } catch (_) {}
  const previousRenderOtPage = window.renderOtPage || (typeof renderOtPage === 'function' ? renderOtPage : null);
  window.renderOtPage = function renderOtPageV145() {
    const html = typeof previousRenderOtPage === 'function' ? previousRenderOtPage() : '';
    const rows = arr(getState().otRequests);
    const baseRows = (typeof window.isAdmin === 'function' && window.isAdmin()) ? rows : rows.filter(x => typeof window.currentStaffId === 'function' && x.staff_id === window.currentStaffId());
    const bar = (typeof window.isAdmin === 'function' && window.isAdmin()) ? otFilterBar(baseRows.length, filterOtRows(baseRows).length) : '';
    if (!bar) return html;
    if (html.includes('v145-ot-filter')) return html;
    const sectionRe = /(<div class="section-title"><h3>ส่วนที่ 3 อนุมัติ OT<\/h3>[\s\S]*?<\/div>)/;
    return sectionRe.test(html) ? html.replace(sectionRe, `$1${bar}`) : `${bar}${html}`;
  };
  try { renderOtPage = window.renderOtPage; } catch (_) {}

  document.addEventListener('change', function(e) {
    const t = e.target;
    if (!t) return;
    if (t.id === 'otFilterStatus') { state.otFilterStatus = t.value || 'pending'; if (typeof renderPage === 'function') renderPage(); }
    if (t.id === 'otFilterMonth') { state.otFilterMonth = t.value || ''; state.otFilterDate = ''; if (typeof renderPage === 'function') renderPage(); }
    if (t.id === 'otFilterDate') { state.otFilterDate = t.value || ''; if (typeof renderPage === 'function') renderPage(); }
  }, true);
  document.addEventListener('input', function(e) {
    const t = e.target;
    if (t && t.id === 'otFilterText') { state.otFilterText = t.value || ''; clearTimeout(window.__v145OtTimer); window.__v145OtTimer = setTimeout(() => { if (typeof renderPage === 'function') renderPage(); }, 220); }
  }, true);
  document.addEventListener('click', function(e) {
    const t = e.target && e.target.closest && e.target.closest('[data-clear-ot-filter]');
    if (!t) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    state.otFilterStatus = 'pending'; state.otFilterDate = ''; state.otFilterText = ''; state.otFilterMonth = state.monthKey || new Date().toISOString().slice(0,7);
    if (typeof renderPage === 'function') renderPage();
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .v145-tabs{position:sticky;top:0;z-index:120;display:flex;gap:8px;flex-wrap:wrap;background:#fff;padding:8px 0;margin-bottom:10px;border-bottom:1px solid #e5e7eb;pointer-events:auto!important}.v145-tab{cursor:pointer!important;pointer-events:auto!important;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:7px 12px;font-weight:800}.v145-tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}.v145-tab-content{min-height:140px}.v145-grid-wrap{overflow:auto}.v145-grid,.v145-balance-table{border-collapse:collapse;width:max-content;min-width:100%;font-size:12px;table-layout:fixed}.v145-grid th,.v145-grid td,.v145-balance-table th,.v145-balance-table td{border:1px solid #e5e7eb;padding:3px 5px;line-height:1.12;vertical-align:top}.v145-name-head,.v145-name-cell{position:sticky;left:0;z-index:20;min-width:96px;max-width:115px}.v145-name-head{background:#fff!important}.v145-name-cell{background:var(--staff-bg,#fff)!important;color:var(--staff-fg,#111827)!important}.v145-name-cell button{all:unset;cursor:pointer;font-weight:800}.v145-off-col,.v145-off-cell{background:#f1f5f9!important}.v145-cell-stack{display:flex;flex-direction:column;gap:2px;min-height:16px}.v145-shift-pill{border:0;border-radius:8px;padding:2px 5px;background:var(--staff-bg,#dbeafe);color:var(--staff-fg,#111827);font-weight:800;font-size:11px;line-height:1.1;cursor:pointer;white-space:nowrap}.v145-status{display:inline-block;border-radius:7px;padding:1px 4px;font-size:10px;font-weight:800;background:#f3f4f6;border:1px solid #d1d5db;color:#374151}.v145-status.no-duty{background:#fff7ed;border-color:#fdba74;color:#9a3412}.v145-status.long{background:#f1f5f9;border-color:#94a3b8;color:#334155}.v145-status.mat{background:#fef3c7;border-color:#fbbf24;color:#92400e}.v145-status.leave{background:#f8fafc;border-color:#cbd5e1;color:#475569}.v145-day-cards,.v145-person-list,.v145-summary-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v145-summary-cards{margin-bottom:12px}.v145-day-card,.v145-person-card,.v145-summary-card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:10px;text-align:left}.v145-day-card.off{background:#f8fafc}.v145-day-head{display:flex;gap:6px;align-items:center;margin-bottom:8px}.v145-day-line{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:3px 0;border-top:1px dashed #e5e7eb}.v145-person-card,.v145-summary-card{cursor:pointer;background:var(--staff-bg,#fff);color:var(--staff-fg,#111827);display:flex;flex-direction:column;gap:4px}.v145-balance{display:inline-block;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800}.v145-balance.exempt{background:#f1f5f9;color:#334155}.v145-balance.ok{background:#dcfce7;color:#166534}.v145-balance.warn{background:#fef3c7;color:#92400e}.v145-balance.over{background:#fee2e2;color:#991b1b}.v145-ot-filter{margin:8px 0 12px;gap:8px;align-items:end}.v145-ot-filter label{min-width:135px}.v145-ot-filter input,.v145-ot-filter select{height:36px}@media(max-width:820px){.v145-ot-filter{display:grid;grid-template-columns:1fr}.v145-ot-filter label{min-width:0}}
  `;
  document.head.appendChild(style);
})();
