/* v147 Critical Data Props / Holiday / OT Feature Restore
   Scope only:
   1) Restore Monthly Schedule 4 tabs data flow by bypassing over-strict staff filter and explicit data props.
   2) Normalize public holiday matching in Monthly Position Schedule.
   3) Restore OT manual hour calculation + status filter in OT approval section.
*/
(function () {
  'use strict';

  const arr = (v) => Array.isArray(v) ? v : [];
  const pad2 = (n) => String(n).padStart(2, '0');
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    try { if (typeof window.escapeHtml === 'function') return window.escapeHtml(s); } catch (_) {}
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  };
  const getState = () => window.state || {};
  const num = (v, fallback = 0) => { const n = Number(v); return Number.isFinite(n) ? n : fallback; };

  function toDateKey(value) {
    if (!value) return '';
    if (value instanceof Date && Number.isFinite(value.getTime())) {
      return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
    }
    const s = String(value).trim();
    const iso = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${pad2(iso[2])}-${pad2(iso[3])}`;
    const dmy = s.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (dmy) return `${dmy[3]}-${pad2(dmy[2])}-${pad2(dmy[1])}`;
    const dt = new Date(s);
    if (Number.isFinite(dt.getTime())) return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
    return '';
  }
  function parseDateLocal(value) {
    const key = toDateKey(value);
    const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  function monthInfo(key) {
    const raw = String(key || getState().monthKey || new Date().toISOString().slice(0, 7));
    const m = raw.match(/^(\d{4})-(\d{1,2})$/);
    const y = m ? Number(m[1]) : new Date().getFullYear();
    const mon = m ? Number(m[2]) : new Date().getMonth() + 1;
    return { key: `${y}-${pad2(mon)}`, y, m: mon, last: new Date(y, mon, 0).getDate() };
  }
  function isWeekend(date) {
    const d = parseDateLocal(date);
    if (!d) return false;
    const wd = d.getDay();
    return wd === 0 || wd === 6;
  }
  function holidayRows() { return arr(getState().holidays || getState().publicHolidays); }
  function cleanHolidayTitle(v) { return String(v || '').split(':::')[0].trim(); }
  function findHoliday(date) {
    const key = toDateKey(date);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
    return holidayRows().find(h => {
      const hd = toDateKey(h?.holiday_date || h?.date || h?.work_date || h?.duty_date || h?.day);
      return hd === key;
    }) || null;
  }
  function isPublicHoliday(date) { return !!findHoliday(date); }
  function holidayName(date) {
    const h = findHoliday(date);
    if (!h) return '';
    return cleanHolidayTitle(h.title || h.name || h.holiday_name || h.description || 'HOLIDAY') || 'HOLIDAY';
  }

  // Publish exact holiday helpers last, so older patches cannot mark every day as holiday.
  window.isHolidayDate = isPublicHoliday;
  window.isPublicHoliday = isPublicHoliday;
  window.holidayName = holidayName;
  try { isHolidayDate = window.isHolidayDate; } catch (_) {}
  try { isPublicHoliday = window.isPublicHoliday; } catch (_) {}
  try { holidayName = window.holidayName; } catch (_) {}

  function low(v) { return String(v == null ? '' : v).toLowerCase(); }
  function isExplicitFalse(v) {
    return v === false || v === 0 || low(v) === 'false' || low(v) === '0' || /inactive|disabled|ลาออก|ยกเลิก|ปิด/.test(low(v));
  }
  function isExplicitTrue(v) { return v === true || v === 1 || low(v) === 'true' || low(v) === '1' || /active|ใช้งาน|เปิด/.test(low(v)); }
  function isPhysician(s) { return /แพทย์|physician|doctor/i.test(String(s?.staff_type || s?.role || s?.position || '')); }

  // Bypass strict staff filter: use active/is_active true first; if schema differs, only remove explicit disabled/physician rows.
  function scheduleStaffList() {
    const all = arr(getState().staff);
    if (!all.length) return [];
    let list = all.filter(s => s && !isPhysician(s) && (isExplicitTrue(s.active) || isExplicitTrue(s.is_active)));
    if (!list.length) list = all.filter(s => s && !isPhysician(s) && !isExplicitFalse(s.active) && !isExplicitFalse(s.is_active) && !isExplicitFalse(s.roster_enabled) && !isExplicitFalse(s.enable_roster));
    if (!list.length) list = all.filter(s => s && !isPhysician(s));
    if (!list.length) list = all.slice();
    try { if (typeof window.orderedStaff === 'function') return window.orderedStaff(list); } catch (_) {}
    return list.slice().sort((a,b) => String(a?.sort_order ?? a?.order_no ?? '').localeCompare(String(b?.sort_order ?? b?.order_no ?? '')) || String(a?.nickname || a?.full_name || '').localeCompare(String(b?.nickname || b?.full_name || ''), 'th'));
  }
  window.isRosterEnabled = function isRosterEnabledV147(s) {
    return !!(s && !isPhysician(s) && !isExplicitFalse(s.active) && !isExplicitFalse(s.is_active) && !isExplicitFalse(s.roster_enabled) && !isExplicitFalse(s.enable_roster));
  };
  try { isRosterEnabled = window.isRosterEnabled; } catch (_) {}

  function staffById(id, staffList) { return arr(staffList || getState().staff).find(s => String(s?.id) === String(id)) || null; }
  function staffName(sOrId, staffList) {
    const s = typeof sOrId === 'object' ? sOrId : staffById(sOrId, staffList);
    return s ? (s.nickname || s.full_name || s.name || '-') : '-';
  }
  function staffColor(s) { try { if (typeof window.staffColor === 'function') return window.staffColor(s); } catch (_) {} return s?.staff_color || s?.color || '#dbeafe'; }
  function textColor(bg) { try { if (typeof window.textColorFor === 'function') return window.textColorFor(bg); } catch (_) {} return '#111827'; }
  function labelDuty(code, staffView = true) {
    const c = String(code || '');
    if (/^(ช4A|ช4B|ช4|ช4-1|ช4-2|ช4-MT\/แตง)/.test(c)) return staffView ? 'ช4' : (c === 'ช4B' ? 'ช4 (2)' : 'ช4 (1)');
    try { return (window.DUTY_LABEL && window.DUTY_LABEL[c]) || (typeof DUTY_LABEL !== 'undefined' && DUTY_LABEL[c]) || c; } catch (_) { return c; }
  }
  function dutyColumns() {
    const base = arr(window.DUTY_COLUMNS || (typeof DUTY_COLUMNS !== 'undefined' ? DUTY_COLUMNS : null));
    const src = base.length ? base : ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT'];
    const out = [];
    src.forEach(x => {
      const c = String(x || '').trim();
      if (!c) return;
      if (/^(ช4|ช4A|ช4-1|ช4-MT\/แตง 1|ช4-MT\/แตง)$/i.test(c)) { if (!out.includes('ช4A')) out.push('ช4A'); if (!out.includes('ช4B')) out.push('ช4B'); }
      else if (/^(ช4B|ช4-2|ช4-MT\/แตง 2)$/i.test(c)) { if (!out.includes('ช4B')) out.push('ช4B'); }
      else if (!out.includes(c)) out.push(c);
    });
    if (!out.includes('ช4A')) out.splice(Math.min(3, out.length), 0, 'ช4A');
    if (!out.includes('ช4B')) out.splice(Math.min(out.indexOf('ช4A') + 1, out.length), 0, 'ช4B');
    return out;
  }
  function dutyOrder(code) { const i = dutyColumns().indexOf(String(code || '')); return i < 0 ? 999 : i; }
  function assignmentsForMonth(key) {
    const mk = monthInfo(key).key;
    let rows = [];
    try { if (typeof window.getAssignmentsForMonth === 'function') rows = arr(window.getAssignmentsForMonth(mk)); } catch (err) { console.warn('v147 getAssignmentsForMonth failed', err); }
    if (!rows.length) rows = arr(getState().rosterAssignments).filter(a => toDateKey(a?.duty_date).startsWith(mk));
    return rows;
  }

  let recoveringData = false;
  async function recoverScheduleDataIfEmpty() {
    if (recoveringData || !window.state) return;
    const st = getState();
    if (arr(st.staff).length && arr(st.holidays).length && arr(st.rosterAssignments).length) return;
    if (typeof sb === 'undefined' || !sb) return;
    recoveringData = true;
    const { key, y, m, last } = monthInfo(st.monthKey);
    const start = `${key}-01`, end = `${key}-${pad2(last)}`;
    try {
      const jobs = [];
      if (!arr(state.staff).length) {
        jobs.push(sb.from('staff_profiles').select('*').eq('is_active', true).order('staff_type').order('nickname').then(res => ({ name:'staff', res })));
      }
      if (!arr(state.rosterAssignments).some(a => toDateKey(a?.duty_date).startsWith(key))) {
        jobs.push(sb.from('roster_assignments').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date').then(res => ({ name:'rosterAssignments', res })));
      }
      if (!arr(state.holidays).some(h => toDateKey(h?.holiday_date || h?.date).startsWith(key))) {
        jobs.push(sb.from('public_holidays').select('*').gte('holiday_date', start).lte('holiday_date', end).order('holiday_date').then(res => ({ name:'holidays', res })));
      }
      const results = await Promise.all(jobs);
      results.forEach(({ name, res }) => {
        if (res?.error) { console.warn('v147 recovery fetch failed:', name, res.error); return; }
        if (name === 'staff') state.staff = arr(res.data);
        if (name === 'rosterAssignments') {
          const old = arr(state.rosterAssignments).filter(a => !toDateKey(a?.duty_date).startsWith(key));
          state.rosterAssignments = old.concat(arr(res.data));
        }
        if (name === 'holidays') {
          const old = arr(state.holidays).filter(h => !toDateKey(h?.holiday_date || h?.date).startsWith(key));
          state.holidays = old.concat(arr(res.data));
        }
      });
      console.log('Monthly Schedule Data recovered:', { staffList: arr(state.staff), holidays: arr(state.holidays), assignments: arr(state.rosterAssignments).filter(a => toDateKey(a?.duty_date).startsWith(key)) });
      if (getState().page === 'schedule' && typeof window.renderPage === 'function') window.renderPage();
    } catch (err) {
      console.error('v147 recoverScheduleDataIfEmpty failed', err);
    } finally {
      setTimeout(() => { recoveringData = false; }, 500);
    }
  }

  function activeView() {
    const v = String(getState().scheduleView || getState().scheduleMobileView || 'day');
    if (v === 'ot') return 'balance';
    return ['day','person','balance','table'].includes(v) ? v : 'day';
  }
  function setActiveView(v) { if (window.state) { state.scheduleView = v === 'ot' ? 'balance' : v; state.scheduleMobileView = state.scheduleView; } }
  function thaiDow(date) { const d = parseDateLocal(date); return d ? d.toLocaleDateString('th-TH', { weekday:'short' }) : ''; }
  function activeLeave(l) { return !/reject|cancel|delete|ยกเลิก|ไม่อนุมัติ/i.test(String(l?.status || l?.approval_status || 'active')); }
  function dateInLeave(date, l) {
    const s = toDateKey(l?.start_date || l?.work_date || l?.date), e = toDateKey(l?.end_date || l?.start_date || l?.work_date || l?.date);
    return !!s && s <= date && date <= e;
  }
  function isLongTermStaff(s) { return isExplicitTrue(s?.is_long_term_leave) || isExplicitTrue(s?.isLongTermLeave) || isExplicitTrue(s?.long_term_leave); }
  function leaveLabel(l) {
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
  function statusLabels(staff, date) {
    const labels = arr(getState().leaves).filter(l => activeLeave(l) && String(l?.staff_id) === String(staff?.id) && dateInLeave(date, l)).map(leaveLabel);
    if (!labels.length && isLongTermStaff(staff)) labels.push('ลาระยะยาว');
    return [...new Set(labels)];
  }
  function statusBadge(text) {
    const cls = text === 'ไม่รับเวร' ? 'no-duty' : /ลาระยะยาว|บวช|ดูใจ|ถือศีล/.test(text) ? 'long' : 'leave';
    return `<span class="v147-status ${cls}">${esc(text)}</span>`;
  }
  function shiftPill(a, s) {
    const bg = staffColor(s), fg = textColor(bg);
    const attrs = a?.id ? `data-trade-duty="${esc(a.id)}"` : `data-staff-stat="${esc(s?.id || '')}"`;
    return `<button type="button" class="v147-shift-pill" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}" ${attrs}>${esc(labelDuty(a?.duty_code, true))}</button>`;
  }
  function hasAnyDuty(staffId, date, assignments) { return arr(assignments).some(a => String(a?.staff_id) === String(staffId) && toDateKey(a?.duty_date) === date); }
  function isDayOffType(date) { return isWeekend(date) || isPublicHoliday(date); }
  function calculateDaysOff(staff, assignments) {
    if (isLongTermStaff(staff)) return 0;
    const { key, y, m, last } = monthInfo();
    let count = 0;
    for (let d = 1; d <= last; d++) {
      const date = `${key}-${pad2(d)}`;
      if (!isDayOffType(date)) continue;
      if (hasAnyDuty(staff.id, date, assignments)) continue;
      count += 1;
    }
    return count;
  }
  window.calculateDaysOffStrictV146 = calculateDaysOff;
  window.calculateDaysOffV147 = calculateDaysOff;

  function calcStats(assignments) {
    try { if (typeof window.calcFairness === 'function') return window.calcFairness(arr(assignments).filter(a => a?.staff_id)) || {}; } catch (_) {}
    const map = {};
    arr(assignments).forEach(a => { if (!a?.staff_id) return; map[a.staff_id] = map[a.staff_id] || { units:0, total:0, hours:0 }; map[a.staff_id].units += 1; map[a.staff_id].total += 1; });
    return map;
  }
  function targetOf(s, fallback) {
    const raw = s?.targetShifts ?? s?.target_shifts ?? s?.monthly_target_shifts ?? s?.quota_shifts;
    if (raw === undefined || raw === null || raw === '') return fallback;
    return num(raw, fallback);
  }
  function isTargetZeroOnly(s) { return !isLongTermStaff(s) && targetOf(s, NaN) === 0; }

  function renderScheduleTabs(active) {
    const t = (id, label) => `<button type="button" class="v147-tab ${active===id?'active':''}" data-v147-schedule-tab="${id}">${esc(label)}</button>`;
    return `<div class="v147-tabs no-print">${t('day','ดูตามวัน')}${t('person','ดูตามคน')}${t('balance','ดูสมดุล การกระจายเวร')}${t('table','ตาราง')}</div>`;
  }
  function renderDayView({ assignments, staffList }) {
    const { key, last } = monthInfo();
    return `<div class="v147-day-cards">${Array.from({length:last},(_,i)=>i+1).map(d=>{ const date=`${key}-${pad2(d)}`; const rows=arr(assignments).filter(a=>toDateKey(a?.duty_date)===date && a?.staff_id).sort((a,b)=>dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code)); return `<div class="v147-day-card ${isDayOffType(date)?'off':''}"><div class="v147-day-head"><b>${d}</b><span>${esc(thaiDow(date))}</span>${isPublicHoliday(date)?`<span class="badge yellow">${esc(holidayName(date))}</span>`:''}</div>${rows.length?rows.map(a=>{ const s=staffById(a.staff_id, staffList); return `<div class="v147-day-line"><b>${esc(labelDuty(a.duty_code,true))}</b>${s?shiftPill(a,s):`<span>${esc(a.staff_id)}</span>`}</div>`; }).join(''):'<span class="muted">ไม่มีเวร</span>'}</div>`; }).join('')}</div>`;
  }
  function renderPersonView({ assignments, staffList }) {
    if (!arr(staffList).length) return `<div class="empty-state">ไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้จัดเวร</div>`;
    const stats = calcStats(assignments);
    const cards = `<div class="v147-summary-cards">${staffList.map(s=>{ const bg=staffColor(s), fg=textColor(bg), r=stats[s.id]||{}; return `<button type="button" class="v147-summary-card" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}" data-staff-stat="${esc(s.id)}"><b>${esc(staffName(s))}</b><span>${num(r.units??r.total,0).toFixed(1)} เวร • ${num(r.hours,0).toFixed(0)} ชม.</span></button>`; }).join('')}</div>`;
    const list = `<div class="v147-person-list">${staffList.map(s=>{ const rows=arr(assignments).filter(a=>String(a?.staff_id)===String(s.id)).sort((a,b)=>toDateKey(a?.duty_date).localeCompare(toDateKey(b?.duty_date))||dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code)); return `<div class="v147-person-card"><div><b>${esc(staffName(s))}</b> <span class="badge blue">${rows.length} เวร</span></div>${rows.length?rows.map(a=>`<div class="v147-person-duty"><span>${esc(toDateKey(a.duty_date).slice(-2))}</span><b>${esc(labelDuty(a.duty_code,true))}</b></div>`).join(''):'<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`; }).join('')}</div>`;
    return cards + list;
  }
  function renderBalanceView({ assignments, staffList }) {
    if (!arr(staffList).length) return `<div class="empty-state">ไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้จัดเวร</div>`;
    const stats = calcStats(assignments);
    const nonExempt = staffList.filter(s => !isLongTermStaff(s) && !isTargetZeroOnly(s));
    const avg = nonExempt.length ? nonExempt.reduce((sum,s)=>sum+num(stats[s.id]?.units??stats[s.id]?.total,0),0)/nonExempt.length : 0;
    return `<div class="v147-balance-wrap"><div class="notice soft-notice">นิยามวันหยุด: เสาร์/อาทิตย์/นักขัต และเจ้าหน้าที่ไม่มีเวรในระบบเท่านั้น ถ้ามีเวรจะไม่นับเป็นวันหยุด</div><div class="table-wrap"><table class="v147-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เป้าหมาย</th><th>จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>จำนวนวันหยุด</th><th>Status</th></tr></thead><tbody>${staffList.map(s=>{ const long=isLongTermStaff(s), zero=isTargetZeroOnly(s), ex=long||zero; const current=ex?0:num(stats[s.id]?.units??stats[s.id]?.total,0); const target=ex?0:targetOf(s,avg); const gap=ex?0:target-current; const carry=ex?0:num(s.carry_over_balance??s.overtime_balance??s.overtimeBalance??s.ot_balance,0); const off=ex?0:calculateDaysOff(s,assignments); const status=long?'ยกเว้น/ลาระยะยาว':zero?'ไม่มีเป้าหมายเวร':Math.abs(gap)<0.5?'สมดุล':gap>0?'ขาดเวร':'งานหนักเกิน'; const cls=long||zero?'exempt':Math.abs(gap)<0.5?'ok':gap>0?'warn':'over'; return `<tr><td>${esc(staffName(s))}</td><td>${target.toFixed(1)}</td><td>${current.toFixed(1)}</td><td>${gap.toFixed(1)}</td><td>${carry.toFixed(1)} ชม.</td><td>${off}</td><td><span class="v147-balance ${cls}">${esc(status)}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }
  function renderGridView({ assignments, staffList }) {
    if (!arr(staffList).length) { recoverScheduleDataIfEmpty(); return `<div class="empty-state">ไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้จัดเวร<br><small>กำลังตรวจสอบข้อมูล staff_profiles...</small></div>`; }
    const { key, last } = monthInfo();
    const days = Array.from({length:last},(_,i)=>i+1);
    return `<div class="table-wrap v147-grid-wrap"><table id="scheduleTable" class="v147-grid"><thead><tr><th class="v147-name-head">เจ้าหน้าที่</th>${days.map(d=>{ const date=`${key}-${pad2(d)}`; return `<th class="${isDayOffType(date)?'v147-off-col':''}">${d}<br><span>${esc(thaiDow(date))}</span></th>`; }).join('')}</tr></thead><tbody>${staffList.map((s,i)=>{ const bg=staffColor(s), fg=textColor(bg); return `<tr class="${i%2?'zebra':''}"><th class="v147-name-cell" style="--staff-bg:${esc(bg)};--staff-fg:${esc(fg)}"><button type="button" data-staff-stat="${esc(s.id)}">${esc(staffName(s))}</button></th>${days.map(d=>{ const date=`${key}-${pad2(d)}`; const shifts=arr(assignments).filter(a=>String(a?.staff_id)===String(s.id)&&toDateKey(a?.duty_date)===date).sort((a,b)=>dutyOrder(a?.duty_code)-dutyOrder(b?.duty_code)); return `<td class="${isDayOffType(date)?'v147-off-cell':''}"><div class="v147-cell-stack">${statusLabels(s,date).map(statusBadge).join('')}${shifts.map(a=>shiftPill(a,s)).join('')}</div></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>`;
  }
  function renderScheduleContent(view, data) {
    try {
      if (view === 'day') return renderDayView(data);
      if (view === 'person') return renderPersonView(data);
      if (view === 'balance') return renderBalanceView(data);
      return renderGridView(data);
    } catch (err) {
      console.error('v147 schedule content error', err, data);
      return `<div class="notice danger">ไม่สามารถแสดงข้อมูลแท็บนี้ได้: ${esc(err?.message || err)}</div>`;
    }
  }
  window.renderMonthlySchedulePage = function renderMonthlySchedulePageV147() {
    const view = activeView();
    const staffList = scheduleStaffList();
    const holidays = holidayRows();
    const assignments = assignmentsForMonth();
    console.log('Monthly Schedule Data:', { staffList, holidays, assignments });
    if (!staffList.length) setTimeout(recoverScheduleDataIfEmpty, 0);
    let trade = '';
    try { if (typeof window.renderDutyTradePanel === 'function') trade = window.renderDutyTradePanel(assignments); } catch (_) {}
    return `<div class="card schedule-page-card v147-schedule-page"><div class="toolbar no-print v147-toolbar"><label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(monthInfo().key)}"></label><button class="ghost-btn" data-export-schedule-excel>Export Excel</button><button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button></div>${renderScheduleTabs(view)}<h3 class="print-only">ตารางเวรประจำเดือน ${esc(monthInfo().key)}</h3><div id="scheduleTabContent" class="v147-tab-content" data-active-view="${esc(view)}">${renderScheduleContent(view, { staffList, holidays, assignments })}</div>${trade}</div>`;
  };
  try { renderMonthlySchedulePage = window.renderMonthlySchedulePage; } catch (_) {}
  window.renderReadOnlySchedule = function renderReadOnlyScheduleV147(assignments) { return renderGridView({ assignments: arr(assignments).length ? assignments : assignmentsForMonth(), staffList: scheduleStaffList(), holidays: holidayRows() }); };
  try { renderReadOnlySchedule = window.renderReadOnlySchedule; } catch (_) {}

  const oldRenderPage = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
  window.renderPage = function renderPageV147() {
    if (getState().page === 'schedule') {
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
        console.error('v147 renderPage schedule failed', err);
        pc.innerHTML = `<div class="notice danger">หน้า “ตารางเวรประจำเดือน” มีข้อผิดพลาด: ${esc(err?.message || err)}</div>`;
        return false;
      }
    }
    try { return typeof oldRenderPage === 'function' ? oldRenderPage.apply(this, arguments) : undefined; }
    catch (err) { console.error('v147 renderPage error', err); const pc=document.getElementById('pageContent'); if (pc) pc.innerHTML=`<div class="notice danger">เกิดข้อผิดพลาดในการแสดงหน้า: ${esc(err?.message || err)}</div>`; return undefined; }
  };
  try { renderPage = window.renderPage; } catch (_) {}

  document.addEventListener('click', function(e) {
    const t = e.target && e.target.closest && e.target.closest('[data-v147-schedule-tab],[data-v146-schedule-tab],[data-v145-schedule-tab],[data-schedule-view],[data-schedule-mobile-view]');
    if (!t) return;
    const v = t.dataset.v147ScheduleTab || t.dataset.v146ScheduleTab || t.dataset.v145ScheduleTab || t.dataset.scheduleView || t.dataset.scheduleMobileView;
    if (!['day','person','balance','table','ot'].includes(v)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    setActiveView(v);
    if (typeof window.renderPage === 'function') window.renderPage();
  }, true);

  // Monthly Role Assignment: normalize both schedule date and holiday date before matching.
  window.isNoPositionDay = function isNoPositionDayV147(date) { return isWeekend(date) || isPublicHoliday(date); };
  try { isNoPositionDay = window.isNoPositionDay; } catch (_) {}
  const oldRenderMonthPositionCell = window.renderMonthPositionCell || (typeof renderMonthPositionCell === 'function' ? renderMonthPositionCell : null);
  window.renderMonthPositionCell = function renderMonthPositionCellV147(staff, date, cellRows, canEdit) {
    const key = toDateKey(date);
    if (isWeekend(key)) return `<td class="matrix-cell no-position-day weekend-day"><span>WEEKEND</span></td>`;
    if (isPublicHoliday(key)) return `<td class="matrix-cell no-position-day holiday-day"><span>HOLIDAY</span></td>`;
    if (typeof oldRenderMonthPositionCell === 'function') return oldRenderMonthPositionCell(staff, key || date, cellRows, canEdit);
    return `<td class="matrix-cell"></td>`;
  };
  try { renderMonthPositionCell = window.renderMonthPositionCell; } catch (_) {}

  // OT Feature restore.
  function normalizeTime(t) {
    const m = String(t || '').trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return '';
    const hh = Math.max(0, Math.min(23, Number(m[1]))), mm = Math.max(0, Math.min(59, Number(m[2]))), ss = Math.max(0, Math.min(59, Number(m[3] || 0)));
    return `${pad2(hh)}:${pad2(mm)}:${pad2(ss)}`;
  }
  function localDateTime(date, time) {
    const dk = toDateKey(date), tt = normalizeTime(time);
    if (!dk || !tt) return null;
    const d = new Date(`${dk}T${tt}`);
    return Number.isFinite(d.getTime()) ? d : null;
  }
  function otStartFor(date) { return (isWeekend(date) || isPublicHoliday(date)) ? '17:00:00' : '16:00:00'; }
  window.calcOtHours = function calcOtHoursV147(row) {
    try {
      const workDate = toDateKey(row?.work_date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return 0;
      const start = localDateTime(workDate, otStartFor(workDate));
      let end = row?.end_time ? localDateTime(workDate, row.end_time) : null;
      if (!end && row?.check_out_at && !row?.end_time) {
        const tmp = new Date(row.check_out_at);
        if (Number.isFinite(tmp.getTime())) end = tmp;
      }
      if (!start || !end) return 0;
      let hours = (end.getTime() - start.getTime()) / 36e5;
      if (!Number.isFinite(hours) || Number.isNaN(hours) || hours < 0) return 0;
      if (hours > 16) return 0;
      return Math.round(hours * 10) / 10;
    } catch (_) { return 0; }
  };
  try { calcOtHours = window.calcOtHours; } catch (_) {}
  function currentMonth() { return getState().monthKey || new Date().toISOString().slice(0,7); }
  function staffLabel(id) { try { if (typeof staffName === 'function') return staffName(id); } catch (_) {} return staffName(id); }
  function otFilterState() {
    if (!window.state) return { month: currentMonth(), date:'', status:'รออนุมัติ', q:'' };
    if (!state.otFilterStatus) state.otFilterStatus = 'รออนุมัติ';
    if (!state.otFilterMonth) state.otFilterMonth = currentMonth();
    return { month: state.otFilterMonth || '', date: state.otFilterDate || '', status: state.otFilterStatus || 'รออนุมัติ', q: String(state.otFilterText || '').trim().toLowerCase() };
  }
  function filterOtRows(rows) {
    const f = otFilterState();
    return arr(rows).filter(r => {
      const d = toDateKey(r?.work_date);
      if (f.date && d !== f.date) return false;
      if (!f.date && f.month && !d.startsWith(f.month)) return false;
      if (f.status && f.status !== 'ทั้งหมด' && String(r?.status || 'รออนุมัติ') !== f.status) return false;
      if (f.q) {
        const hay = [staffLabel(r?.staff_id), r?.reason, r?.note, r?.status, d].join(' ').toLowerCase();
        if (!hay.includes(f.q)) return false;
      }
      return true;
    }).sort((a,b) => toDateKey(b?.work_date).localeCompare(toDateKey(a?.work_date)) || String(b?.created_at || b?.check_out_at || '').localeCompare(String(a?.created_at || a?.check_out_at || '')));
  }
  function renderOtFilter(total, shown) {
    const f = otFilterState();
    const statuses = ['ทั้งหมด','รออนุมัติ','อนุมัติ','ไม่อนุมัติ'];
    return `<div class="toolbar compact-filter no-print v147-ot-filter"><label>สถานะ <select id="otFilterStatus">${statuses.map(s=>`<option value="${esc(s)}" ${f.status===s?'selected':''}>${esc(s)}</option>`).join('')}</select></label><label>เดือน/ปี <input type="month" id="otFilterMonth" value="${esc(f.month)}"></label><label>ค้นตามวันที่ทำงาน <input type="date" id="otFilterDate" value="${esc(f.date)}"></label><label>ค้นหา <input type="search" id="otFilterText" value="${esc(f.q)}" placeholder="ชื่อ / เหตุผล / สถานะ"></label><button type="button" class="ghost-btn" data-clear-ot-filter>ล้างตัวกรอง</button><span class="badge blue">แสดง ${shown}/${total} รายการ</span></div>`;
  }
  const oldRenderOtTable = window.renderOtTable || (typeof renderOtTable === 'function' ? renderOtTable : null);
  window.renderOtTable = function renderOtTableV147(rows) { return typeof oldRenderOtTable === 'function' ? oldRenderOtTable(filterOtRows(rows)) : ''; };
  try { renderOtTable = window.renderOtTable; } catch (_) {}
  const oldRenderOtPage = window.renderOtPage || (typeof renderOtPage === 'function' ? renderOtPage : null);
  window.renderOtPage = function renderOtPageV147() {
    if (typeof oldRenderOtPage !== 'function') return '';
    const html = oldRenderOtPage();
    if (!(typeof isAdmin === 'function' && isAdmin())) return html;
    const base = arr(getState().otRequests);
    const shown = filterOtRows(base).length;
    const filter = renderOtFilter(base.length, shown);
    if (html.includes('v147-ot-filter')) return html;
    return html.replace(/(<div class="section-title"><h3>ส่วนที่ 3 อนุมัติ OT<\/h3>[\s\S]*?<\/div>)/, `$1${filter}`);
  };
  try { renderOtPage = window.renderOtPage; } catch (_) {}
  document.addEventListener('change', function(e) {
    const t = e.target; if (!t || !window.state) return;
    if (t.id === 'otFilterStatus') { state.otFilterStatus = t.value || 'รออนุมัติ'; if (typeof window.renderPage === 'function') window.renderPage(); }
    if (t.id === 'otFilterMonth') { state.otFilterMonth = t.value || ''; state.otFilterDate = ''; if (typeof window.renderPage === 'function') window.renderPage(); }
    if (t.id === 'otFilterDate') { state.otFilterDate = t.value || ''; if (typeof window.renderPage === 'function') window.renderPage(); }
  }, true);
  document.addEventListener('input', function(e) {
    const t = e.target; if (!t || !window.state) return;
    if (t.id === 'otFilterText') { state.otFilterText = t.value || ''; clearTimeout(window.__v147OtInputTimer); window.__v147OtInputTimer = setTimeout(() => { if (typeof window.renderPage === 'function') window.renderPage(); }, 220); }
  }, true);
  document.addEventListener('click', function(e) {
    const t = e.target && e.target.closest && e.target.closest('[data-clear-ot-filter]'); if (!t || !window.state) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    state.otFilterStatus = 'รออนุมัติ'; state.otFilterMonth = currentMonth(); state.otFilterDate = ''; state.otFilterText = '';
    if (typeof window.renderPage === 'function') window.renderPage();
  }, true);

  const style = document.createElement('style');
  style.textContent = `
  .v147-tabs{position:sticky;top:0;z-index:180;display:flex;gap:8px;flex-wrap:wrap;background:#fff;padding:8px 0;margin-bottom:10px;border-bottom:1px solid #e5e7eb;pointer-events:auto!important}.v147-tab{cursor:pointer!important;pointer-events:auto!important;border:1px solid #cbd5e1;background:#fff;border-radius:999px;padding:7px 12px;font-weight:800}.v147-tab.active{background:#0ea5e9;color:#fff;border-color:#0ea5e9}.v147-tab-content{min-height:160px}.v147-day-cards,.v147-person-list,.v147-summary-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}.v147-summary-cards{margin-bottom:12px}.v147-day-card,.v147-person-card,.v147-summary-card{border:1px solid #e5e7eb;border-radius:14px;background:#fff;padding:10px;text-align:left}.v147-day-card.off{background:#f8fafc}.v147-day-head{display:flex;gap:6px;align-items:center;margin-bottom:8px}.v147-day-line,.v147-person-duty{display:flex;justify-content:space-between;gap:8px;align-items:center;padding:3px 0;border-top:1px dashed #e5e7eb}.v147-summary-card{cursor:pointer;background:var(--staff-bg,#fff);color:var(--staff-fg,#111827);display:flex;flex-direction:column;gap:4px}.v147-grid-wrap{overflow:auto}.v147-grid,.v147-balance-table{border-collapse:collapse;width:max-content;min-width:100%;font-size:12px;table-layout:fixed}.v147-grid th,.v147-grid td,.v147-balance-table th,.v147-balance-table td{border:1px solid #e5e7eb;padding:3px 5px;line-height:1.12;vertical-align:top}.v147-name-head,.v147-name-cell{position:sticky;left:0;z-index:20;min-width:96px;max-width:118px}.v147-name-head{background:#fff!important}.v147-name-cell{background:var(--staff-bg,#fff)!important;color:var(--staff-fg,#111827)!important}.v147-name-cell button{all:unset;cursor:pointer;font-weight:800}.v147-off-col,.v147-off-cell{background:#f1f5f9!important}.v147-cell-stack{display:flex;flex-direction:column;gap:2px;min-height:16px}.v147-shift-pill{border:0;border-radius:8px;padding:2px 5px;background:var(--staff-bg,#dbeafe);color:var(--staff-fg,#111827);font-weight:800;font-size:11px;line-height:1.1;cursor:pointer;white-space:nowrap}.v147-status{display:inline-block;border-radius:7px;padding:1px 4px;font-size:10px;font-weight:800;background:#f3f4f6;border:1px solid #d1d5db;color:#374151}.v147-status.no-duty{background:#fff7ed;border-color:#fdba74;color:#9a3412}.v147-status.long{background:#f1f5f9;border-color:#94a3b8;color:#334155}.v147-status.leave{background:#f8fafc;border-color:#cbd5e1;color:#475569}.v147-balance{display:inline-block;border-radius:999px;padding:3px 8px;font-size:11px;font-weight:800}.v147-balance.exempt{background:#f1f5f9;color:#334155}.v147-balance.ok{background:#dcfce7;color:#166534}.v147-balance.warn{background:#fef3c7;color:#92400e}.v147-balance.over{background:#fee2e2;color:#991b1b}.holiday-day{background:#fef3c7!important;color:#92400e!important;font-weight:800}.weekend-day{background:#e5e7eb!important;color:#374151!important;font-weight:800}.v147-ot-filter{margin:8px 0 12px;gap:8px;align-items:end}.v147-ot-filter label{min-width:145px}.v147-ot-filter input,.v147-ot-filter select{height:36px}.empty-state{padding:18px;border:1px dashed #cbd5e1;border-radius:12px;background:#f8fafc;color:#64748b;text-align:center}@media(max-width:820px){.v147-ot-filter{display:grid;grid-template-columns:1fr}.v147-ot-filter label{min-width:0}}
  `;
  document.head.appendChild(style);

  setTimeout(() => { try { if (getState().page === 'schedule' && typeof window.renderPage === 'function') window.renderPage(); } catch (_) {} }, 0);
})();
