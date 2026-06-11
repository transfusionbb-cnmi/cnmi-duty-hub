/* CNMI Staff Planner Patch V127
   Scope:
   1) Exclude long-term leave / maternity / target 0 staff from balance and auto rebalance.
   2) Add HR Dummy Schedule export based on approved OT hours.
   3) Row color for Excel-like roster grid and print schedule as grid.
   4) Add Export PDF / Print buttons for monthly position pages.
   5) Validate mutually exclusive monthly positions: BB-Report vs DR-Processing.
*/
(function patchV127HrDummyPrintBalancePosition(){
  if (window.__CNMI_V127_HR_DUMMY_PRINT_BALANCE_POSITION__) return;
  window.__CNMI_V127_HR_DUMMY_PRINT_BALANCE_POSITION__ = true;

  const ACTIVE_FROM_MONTH = '2026-07';
  const EXCLUSIVE_POSITION_PAIRS = [['BB-Report','DR-Processing']];

  const esc = (v) => {
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch (_) {}
    return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const monthKey = () => String(state?.monthKey || new Date().toISOString().slice(0, 7));
  const parseDateSafe = (date) => {
    try { if (typeof parseDate === 'function') return parseDate(date); } catch (_) {}
    const [y, m, d] = String(date || '').slice(0, 10).split('-').map(Number);
    return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
  };
  const monthRangeSafe = (key=monthKey()) => {
    try { if (typeof getMonthRange === 'function') return getMonthRange(key); } catch (_) {}
    const [y, m] = String(key).split('-').map(Number);
    return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}` };
  };
  const datesInMonth = (key=monthKey()) => {
    const r = monthRangeSafe(key);
    const last = new Date(r.y, r.m, 0).getDate();
    return Array.from({ length:last }, (_, i) => `${r.y}-${pad2(r.m)}-${pad2(i + 1)}`);
  };
  const staffById = (id) => (state?.staff || []).find(s => String(s.id) === String(id));
  const staffName = (id) => {
    try { if (typeof staffName === 'function') return staffName(id); } catch (_) {}
    const s = staffById(id);
    return s?.nickname || s?.full_name || '-';
  };
  const staffRows = () => {
    const rows = (state?.staff || []).filter(s => {
      try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : true; } catch (_) { return true; }
    });
    try { return typeof orderedStaff === 'function' ? orderedStaff(rows) : rows; } catch (_) { return rows; }
  };
  const staffColorSafe = (staffOrId, alpha=false) => {
    const staff = typeof staffOrId === 'object' ? staffOrId : staffById(staffOrId);
    let color = '#dbeafe';
    try { if (typeof staffColor === 'function') color = staffColor(staff || staffOrId); } catch (_) {}
    if (!alpha) return color;
    return hexToRgba(color, 0.16) || color;
  };
  const textColorSafe = (bg) => { try { if (typeof textColorFor === 'function') return textColorFor(bg); } catch (_) {} return '#0f172a'; };
  const staffPillSafe = (id) => {
    try { if (typeof staffPill === 'function') return staffPill(id, { button:true, attrs:`data-staff-stat="${esc(id)}" type="button"` }); } catch (_) {}
    return `<button type="button" class="staff-color-pill staff-pill-btn" data-staff-stat="${esc(id)}">${esc(staffName(id))}</button>`;
  };
  function hexToRgba(hex, alpha) {
    const raw = String(hex || '').trim();
    const m = raw.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return '';
    return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},${alpha})`;
  }
  function isWeekend(date) {
    try { if (typeof window.isWeekend === 'function') return window.isWeekend(date); } catch (_) {}
    const d = parseDateSafe(date).getDay();
    return d === 0 || d === 6;
  }
  function isHoliday(date) {
    try { if (typeof isHolidayDate === 'function') return isHolidayDate(date); } catch (_) {}
    const ds = String(date || '').slice(0, 10);
    return (state?.holidays || []).some(h => String(h.holiday_date || h.date || h).slice(0, 10) === ds);
  }
  function holidayNameSafe(date) {
    try { if (typeof holidayName === 'function') return holidayName(date); } catch (_) {}
    const ds = String(date || '').slice(0,10);
    return (state?.holidays || []).find(h => String(h.holiday_date || h.date || '').slice(0,10) === ds)?.title || 'วันหยุด';
  }
  function isActiveRow(row) {
    return String(row?.status || 'active').toLowerCase() !== 'cancelled';
  }
  function rowCoversDate(row, date) {
    const ds = String(date || '').slice(0, 10);
    return String(row?.start_date || '') <= ds && String(row?.end_date || '') >= ds;
  }
  function hasLeaveOn(staffId, date) {
    return (state?.leaves || []).some(l => String(l.staff_id) === String(staffId) && isActiveRow(l) && rowCoversDate(l, date) && String(l.type) !== 'ไม่รับเวร');
  }
  function monthIsFullyCoveredByLeave(staffId, key=monthKey()) {
    const days = datesInMonth(key).filter(d => !isWeekend(d) && !isHoliday(d));
    if (!days.length) return false;
    return days.every(d => hasLeaveOn(staffId, d));
  }
  function isLongTermExcludedStaff(staff, key=monthKey()) {
    if (!staff) return false;
    const rawTarget = staff.target_shifts ?? staff.monthly_target_shifts ?? staff.roster_quota ?? staff.quota ?? staff.target_duty_count;
    const targetNumber = Number(rawTarget);
    const flag = staff.isLongTermLeave === true || staff.is_long_term_leave === true || String(staff.leave_status || '').includes('ลาระยะยาว') || String(staff.leave_status || '').includes('ลาคลอด');
    const targetZero = rawTarget !== undefined && rawTarget !== null && rawTarget !== '' && Number.isFinite(targetNumber) && targetNumber === 0;
    const maternityWholeMonth = (state?.leaves || []).some(l => String(l.staff_id) === String(staff.id) && isActiveRow(l) && String(l.type || '').includes('ลาคลอด') && String(l.start_date || '').slice(0,10) <= monthRangeSafe(key).start && String(l.end_date || '').slice(0,10) >= monthRangeSafe(key).end);
    return Boolean(flag || targetZero || maternityWholeMonth || monthIsFullyCoveredByLeave(staff.id, key));
  }
  window.isLongTermExcludedStaffV127 = isLongTermExcludedStaff;

  // Part 1: stop auto-rebalance from choosing people who are excluded from balance.
  const prevFindBestSubstitute = window.findBestSubstitute;
  window.findBestSubstitute = function findBestSubstituteV127(shiftDetails, staffList=[], historicalData={}) {
    const key = String(shiftDetails?.duty_date || shiftDetails?.date || monthKey()).slice(0,7);
    const filtered = (staffList && staffList.length ? staffList : staffRows()).filter(st => !isLongTermExcludedStaff(st, key));
    if (!filtered.length) return null;
    if (typeof prevFindBestSubstitute === 'function') return prevFindBestSubstitute.call(this, shiftDetails, filtered, historicalData);
    return filtered[0] || null;
  };

  function normalizeDutyCode(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (['ช4A','ช4-1','ช4-MT/แตง 1','ช4-MT/แตง1','ช4-MT/แตง-1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4B','ช4-2','ช4-MT/แตง 2','ช4-MT/แตง2','ช4-MT/แตง-2'].includes(c)) return 'ช4-MT/แตง 2';
    return c;
  }
  function displayDuty(code='') {
    const c = normalizeDutyCode(code);
    if (c.startsWith('ช4')) return 'ช4';
    if (c.startsWith('ช9')) return 'ช9';
    return c;
  }
  function dutyHours(date, code) {
    try { if (typeof window.dutyHoursForCode === 'function') return Number(window.dutyHoursForCode(date, code) || 0); } catch (_) {}
    const c = normalizeDutyCode(code);
    const off = isWeekend(date) || isHoliday(date);
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return off ? 24 : 16;
    if (['ช3A','ช3B'].includes(c) || c.startsWith('ช9')) return 8;
    return 0;
  }
  function dutyUnits(date, code) {
    try { if (typeof window.dutyUnitsForCode === 'function') return Number(window.dutyUnitsForCode(date, code) || 0); } catch (_) {}
    const c = normalizeDutyCode(code);
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return (isWeekend(date) || isHoliday(date)) ? 3 : 2;
    if (['ช3A','ช3B'].includes(c) || c.startsWith('ช9')) return 1;
    return 0;
  }
  function assignmentsForMonth(key=monthKey()) {
    try { if (typeof getAssignmentsForMonth === 'function') return getAssignmentsForMonth(key) || []; } catch (_) {}
    const r = monthRangeSafe(key);
    return (state?.rosterAssignments || []).filter(a => String(a.duty_date || '') >= r.start && String(a.duty_date || '') <= r.end);
  }
  function quotaForStaff(staff, avg) {
    const raw = staff?.target_shifts ?? staff?.monthly_target_shifts ?? staff?.roster_quota ?? staff?.quota ?? staff?.target_duty_count;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : avg;
  }
  function buildHistoricalBalanceV127(key=monthKey()) {
    const people = staffRows();
    const months = Array.from(new Set((state?.rosterAssignments || []).map(a => String(a.duty_date || '').slice(0,7)).filter(mk => mk >= ACTIVE_FROM_MONTH && mk < key))).sort();
    const rows = {};
    people.forEach(st => { rows[st.id] = { previousDaysOff:0, historicalHours:0, specialAdjustment:Number(st.special_adjustment_hours ?? st.balance_adjustment_hours ?? st.carry_over_hours ?? 0) || 0, excluded:isLongTermExcludedStaff(st, key) }; });
    months.forEach(mk => {
      const monthRows = assignmentsForMonth(mk).filter(a => a.staff_id);
      monthRows.forEach(a => {
        if (!rows[a.staff_id] || rows[a.staff_id].excluded) return;
        const code = normalizeDutyCode(a.duty_code);
        if (code.startsWith('ช4')) return;
        rows[a.staff_id].historicalHours += dutyHours(a.duty_date, code);
      });
    });
    const included = people.filter(st => !rows[st.id]?.excluded);
    const avgHours = included.length ? included.reduce((sum, st) => sum + Number(rows[st.id]?.historicalHours || 0), 0) / included.length : 0;
    people.forEach(st => {
      if (rows[st.id]?.excluded) {
        rows[st.id].overtimeBalance = 0;
        rows[st.id].previousDaysOff = 0;
        return;
      }
      rows[st.id].overtimeBalance = Number(rows[st.id].historicalHours || 0) - avgHours + Number(rows[st.id].specialAdjustment || 0);
    });
    return { rows, months };
  }
  function renderBalanceViewV127(assignments) {
    const people = staffRows();
    const currentByStaff = {};
    people.forEach(st => { currentByStaff[st.id] = { shifts:0, hours:0 }; });
    (assignments || []).filter(a => a.staff_id).forEach(a => {
      const code = normalizeDutyCode(a.duty_code);
      if (code.startsWith('ช4')) return;
      const row = currentByStaff[a.staff_id] || (currentByStaff[a.staff_id] = { shifts:0, hours:0 });
      row.shifts += dutyUnits(a.duty_date, code);
      row.hours += dutyHours(a.duty_date, code);
    });
    const included = people.filter(st => !isLongTermExcludedStaff(st, monthKey()));
    const avg = included.length ? included.reduce((sum, st) => sum + Number(currentByStaff[st.id]?.shifts || 0), 0) / included.length : 0;
    const hist = buildHistoricalBalanceV127(monthKey());
    const body = people.map(st => {
      const excluded = isLongTermExcludedStaff(st, monthKey());
      const cur = currentByStaff[st.id] || { shifts:0, hours:0 };
      const h = hist.rows[st.id] || {};
      if (excluded) {
        return `<tr class="v127-excluded"><td>${staffPillSafe(st.id)}<small>${esc(st.staff_type || st.position || '')}</small></td><td><b>0</b> / 0<small>ไม่นำเข้าสมการ</small></td><td>0 วัน<small>ข้ามการคำนวณ</small></td><td>0 ชม.<small>ไม่หักลบเป้าหมาย</small></td><td><span class="v127-status excluded">ยกเว้น/ลาคลอด</span></td></tr>`;
      }
      const target = quotaForStaff(st, avg);
      const gap = target - Number(cur.shifts || 0);
      const overtimeBalance = Number(h.overtimeBalance || 0);
      let status = 'สมดุล', cls = 'ok';
      if (Number(cur.shifts || 0) > target + 1 || overtimeBalance > 8) { status = 'งานหนักเกิน'; cls = 'heavy'; }
      else if (Number(cur.shifts || 0) < target - 1) { status = 'ขาดเวร'; cls = 'lack'; }
      return `<tr><td>${staffPillSafe(st.id)}<small>${esc(st.staff_type || st.position || '')}</small></td><td><b>${Number(cur.shifts || 0).toFixed(1).replace(/\.0$/,'')}</b> / ${Number(target || 0).toFixed(1).replace(/\.0$/,'')}<small>${gap > 0 ? `ขาด ${gap.toFixed(1).replace(/\.0$/,'')}` : gap < 0 ? `เกิน ${Math.abs(gap).toFixed(1).replace(/\.0$/,'')}` : 'พอดี'}</small></td><td>${Number(h.previousDaysOff || 0).toFixed(0)} วัน<small>ประวัติสะสม</small></td><td>${overtimeBalance >= 0 ? '+' : ''}${overtimeBalance.toFixed(1)} ชม.<small>ชดเชย ${Number(h.specialAdjustment || 0).toFixed(1)} ชม.</small></td><td><span class="v127-status ${cls}">${status}</span></td></tr>`;
    }).join('');
    return `<div class="v127-balance-view"><div class="notice soft-notice"><b>ดูสมดุลเวร</b><br>คนที่ลาคลอด/ลาระยะยาว/target = 0 จะขึ้น “ยกเว้น/ลาคลอด” และไม่ถูกส่งเข้า Auto-Rebalance</div><div class="table-wrap"><table class="v127-balance-table"><thead><tr><th>ชื่อ-สกุล / ตำแหน่ง</th><th>จัดแล้ว / เป้าหมาย</th><th>วันหยุดยกยอด</th><th>ยอดชดเชยเวร</th><th>Status</th></tr></thead><tbody>${body || '<tr><td colspan="5">ไม่มีข้อมูล</td></tr>'}</tbody></table></div></div>`;
  }

  function renderTabs(target) {
    const cur = target === 'desktop' ? (state.scheduleDesktopViewV125 || state.scheduleDesktopViewV121 || 'table') : (state.scheduleMobileViewV125 || state.scheduleMobileViewV121 || 'day');
    const attr = target === 'desktop' ? 'data-v127-desktop-tab' : 'data-v127-mobile-tab';
    const tabs = target === 'desktop' ? [['table','ตารางทั้งเดือน'],['day','ดูตามวัน'],['person','ดูตามคน'],['balance','ดูสมดุลเวร']] : [['day','ดูตามวัน'],['person','ดูตามคน'],['ot','สรุป OT'],['table','ตาราง'],['balance','สมดุลเวร']];
    return tabs.map(([v,l]) => `<button type="button" class="${cur === v ? 'primary-btn' : 'ghost-btn'}" ${attr}="${v}">${esc(l)}</button>`).join('');
  }
  function renderScheduleToolbarV127() {
    return `<div class="toolbar no-print schedule-toolbar-v127"><label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(monthKey())}"></label><button type="button" class="ghost-btn" data-export-schedule-excel>Export Excel</button>${(typeof isAdmin === 'function' && isAdmin()) ? '<button type="button" class="ghost-btn" data-export-hr-dummy>Export HR Dummy Excel</button>' : ''}<button type="button" class="ghost-btn" data-print-page>Export PDF / พิมพ์</button></div>`;
  }
  function renderDesktopDay(assignments) {
    const r = monthRangeSafe(monthKey());
    const last = new Date(r.y, r.m, 0).getDate();
    return `<div class="v121-desktop-day-list">${Array.from({ length:last }, (_, i) => i + 1).map(d => {
      const date = `${r.y}-${pad2(r.m)}-${pad2(d)}`;
      const rows = (assignments || []).filter(a => a.staff_id && String(a.duty_date) === date);
      const off = isWeekend(date) || isHoliday(date);
      return `<button type="button" class="v121-date-card ${off ? 'weekend' : ''}" data-v127-day="${date}"><div class="v121-date-head"><b>${d}</b><span>${parseDateSafe(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHoliday(date) ? `<em>${esc(holidayNameSafe(date))}</em>` : ''}</div><div class="v121-duty-lines">${rows.map(a => `<span class="v121-duty-bar" style="background:${staffColorSafe(a.staff_id)};color:${textColorSafe(staffColorSafe(a.staff_id))}">${esc(displayDuty(a.duty_code))} ${esc(staffName(a.staff_id))}</span>`).join('') || '<small class="muted">ไม่มีเวร</small>'}</div></button>`;
    }).join('')}</div>`;
  }
  function renderPersons(assignments) {
    return `<div class="v121-person-grid">${staffRows().map(st => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(st.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)));
      return `<button type="button" class="v121-person-card" data-v127-person="${esc(st.id)}"><span class="staff-chip" style="background:${staffColorSafe(st)};color:${textColorSafe(staffColorSafe(st))}">${esc(st.nickname || st.full_name || '-')}</span><b>${rows.length} เวร</b><div>${rows.slice(0,6).map(a => `<small>${esc(a.duty_date)} ${esc(displayDuty(a.duty_code))}</small>`).join('') || '<small class="muted">ไม่มีเวรเดือนนี้</small>'}</div></button>`;
    }).join('')}</div>`;
  }
  function renderMobileDay(assignments) {
    const r = monthRangeSafe(monthKey());
    const last = new Date(r.y, r.m, 0).getDate();
    const firstDow = new Date(r.y, r.m - 1, 1).getDay();
    const cells = [];
    for (let i=0; i<firstDow; i++) cells.push(null);
    for (let d=1; d<=last; d++) cells.push(`${r.y}-${pad2(r.m)}-${pad2(d)}`);
    while (cells.length % 7) cells.push(null);
    return `<div class="v121-mobile-cal"><div class="v121-week-head"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="v121-mobile-cal-grid">${cells.map(date => {
      if (!date) return '<button type="button" class="v121-mobile-day empty" disabled></button>';
      const shown = (assignments || []).filter(a => a.staff_id && String(a.duty_date) === date).slice(0,3);
      const d = Number(date.slice(8,10));
      return `<button type="button" class="v121-mobile-day ${(isWeekend(date)||isHoliday(date)) ? 'weekend' : ''}" data-v127-day="${date}"><div class="v121-mobile-day-num"><b>${d}</b></div>${shown.map(a => `<span class="v121-duty-bar" style="background:${staffColorSafe(a.staff_id)};color:${textColorSafe(staffColorSafe(a.staff_id))}">${esc(displayDuty(a.duty_code))} ${esc(staffName(a.staff_id))}</span>`).join('')}</button>`;
    }).join('')}</div></div>`;
  }
  function renderOtCards(assignments) {
    if (typeof renderMobileScheduleOt === 'function') return renderMobileScheduleOt(assignments);
    return '<div class="empty-state">ยังไม่มีข้อมูลสรุป OT</div>';
  }
  function renderSchedulePageV127() {
    const assignments = assignmentsForMonth(monthKey());
    const dview = state.scheduleDesktopViewV125 || state.scheduleDesktopViewV121 || 'table';
    const mview = state.scheduleMobileViewV125 || state.scheduleMobileViewV121 || 'day';
    const excel = () => {
      try { return typeof renderSchedulePersonMatrix === 'function' ? renderSchedulePersonMatrix(assignments) : ''; } catch (_) {}
      try { return typeof renderReadOnlySchedule === 'function' ? renderReadOnlySchedule(assignments) : ''; } catch (_) {}
      return '<div class="empty-state">ไม่พบตารางเวร</div>';
    };
    const desktop = dview === 'balance' ? renderBalanceViewV127(assignments) : dview === 'day' ? renderDesktopDay(assignments) : dview === 'person' ? renderPersons(assignments) : `<div class="v127-print-grid">${excel()}</div>`;
    const mobile = mview === 'balance' ? renderBalanceViewV127(assignments) : mview === 'person' ? renderPersons(assignments) : mview === 'ot' ? renderOtCards(assignments) : mview === 'table' ? `<div class="v127-print-grid">${excel()}</div>` : renderMobileDay(assignments);
    return `<div class="card schedule-page-v121 schedule-page-v127">${renderScheduleToolbarV127()}<section class="v121-desktop-only"><div class="v121-tabs no-print">${renderTabs('desktop')}</div><div class="v121-view">${desktop}</div></section><section class="v121-mobile-only"><div class="v121-tabs v121-mobile-tabs no-print">${renderTabs('mobile')}</div><div class="v121-view">${mobile}</div></section></div>`;
  }
  const prevRenderPage = window.renderPage;
  window.renderMonthlySchedulePage = renderMonthlySchedulePage = renderSchedulePageV127;
  window.renderPage = renderPage = function renderPageV127() {
    if (state?.page === 'schedule') {
      const item = (typeof NAV_ITEMS !== 'undefined' ? NAV_ITEMS : []).find(x => x.id === 'schedule') || {};
      const title = document.getElementById('pageTitle'); if (title) title.textContent = item.title || 'ตารางเวรประจำเดือน';
      const sub = document.getElementById('pageSubtitle'); if (sub) sub.textContent = item.subtitle || 'ดูรายเดือน Export Excel / PDF / Print';
      try { if (typeof renderNav === 'function') renderNav(); } catch (_) {}
      const pc = document.getElementById('pageContent'); if (pc) pc.innerHTML = renderSchedulePageV127();
      return;
    }
    if (prevRenderPage) {
      const out = prevRenderPage.apply(this, arguments);
      try { injectPositionPrintButton(); } catch (_) {}
      return out;
    }
  };

  // Part 3: row color in Excel-like grid.
  const prevRenderSchedulePersonMatrix = window.renderSchedulePersonMatrix;
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix = function renderSchedulePersonMatrixV127(assignments) {
    const key = monthKey();
    const { y, m } = monthRangeSafe(key);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const active = staffRows();
    return `<div class="table-wrap mobile-schedule-matrix-wrap v127-schedule-grid-wrap"><table id="scheduleTable" class="schedule-person-matrix v127-colored-grid"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => { const date = `${y}-${pad2(m)}-${pad2(day)}`; return `<th>${day}<br><span>${parseDateSafe(date).toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`; }).join('')}</tr></thead><tbody>${active.map(st => {
      const bg = staffColorSafe(st, true);
      const strong = staffColorSafe(st);
      return `<tr style="--row-bg:${bg};--staff-bg:${strong};--staff-fg:${textColorSafe(strong)}"><th style="background:${strong};color:${textColorSafe(strong)}">${esc(st.nickname || st.full_name)}</th>${days.map(day => {
        const date = `${y}-${pad2(m)}-${pad2(day)}`;
        const row = (assignments || []).find(a => String(a.staff_id) === String(st.id) && String(a.duty_date) === date);
        const cls = isHoliday(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
        return `<td class="${cls}">${row ? `<b>${esc(displayDuty(row.duty_code))}</b>${renderTradeBtnSafe(row)}` : (isWeekend(date) ? 'WEEKEND' : isHoliday(date) ? 'HOLIDAY' : '')}</td>`;
      }).join('')}</tr>`;
    }).join('')}</tbody></table></div>`;
  };
  function renderTradeBtnSafe(row) {
    try { if (typeof renderTradeButton === 'function') return renderTradeButton(row); } catch (_) {}
    return '';
  }

  // Part 2: HR Dummy Schedule.
  function approvedOtHoursByStaff(key=monthKey()) {
    const map = {};
    (state?.otRequests || []).filter(r => String(r.work_date || '').startsWith(key) && String(r.status || '') === 'อนุมัติ').forEach(r => {
      let hrs = 0;
      try { if (typeof calcOtHours === 'function') hrs = Number(calcOtHours(r) || 0); } catch (_) {}
      if (!hrs) hrs = Number(r.hours || r.approved_hours || r.total_hours || 0) || 0;
      map[r.staff_id] = (map[r.staff_id] || 0) + hrs;
    });
    return map;
  }
  function choosePair(existing, candidates) {
    const allowed = [['ช','บ'],['บ','ด'],['ช','ด'],['ด','ช']];
    for (const pair of allowed) {
      if (pair.every(x => candidates.includes(x)) && new Set([...existing, ...pair]).size <= 2) return pair.filter(x => !existing.includes(x));
    }
    return candidates.filter(x => !existing.includes(x)).slice(0, Math.max(0, 2 - existing.length));
  }
  window.generateHRDummySchedule = function generateHRDummySchedule(key=monthKey()) {
    const hoursMap = approvedOtHoursByStaff(key);
    const days = datesInMonth(key);
    const rows = [];
    const people = staffRows().filter(st => Number(hoursMap[st.id] || 0) > 0);
    people.forEach(st => {
      let remaining = Math.floor(Number(hoursMap[st.id] || 0) / 8);
      const startOffset = Math.max(0, (typeof staffOrderIndex === 'function' ? staffOrderIndex(st) : people.indexOf(st)) % Math.max(days.length, 1));
      let guard = 0;
      const dayState = {};
      while (remaining > 0 && guard < days.length * 4) {
        const date = days[(startOffset + guard) % days.length];
        guard += 1;
        if (hasLeaveOn(st.id, date)) continue; // วันลา ห้ามลงเวรจำลองเด็ดขาด
        const weekendOrHoliday = isWeekend(date) || isHoliday(date);
        const existing = dayState[date] || (dayState[date] = []);
        // วันทำงานมีเวร ช อยู่แล้วโดยอัตโนมัติ จึงหยอดได้หลัก ๆ คือ บ/ด และห้ามเกิน 2 กะต่อวัน
        const base = weekendOrHoliday ? [] : ['ช'];
        const combined = Array.from(new Set([...base, ...existing]));
        if (combined.length >= 2) continue;
        const candidates = weekendOrHoliday ? ['ช','บ','ด'] : ['บ','ด'];
        const toAdd = choosePair(combined, candidates).slice(0, remaining);
        toAdd.forEach(shift => { existing.push(shift); rows.push({ staff_id:st.id, staff_name:st.nickname || st.full_name || '', work_date:date, shift_code:shift, hours:8, day_type:isHoliday(date) ? 'นักขัตฤกษ์' : isWeekend(date) ? 'เสาร์-อาทิตย์' : 'วันทำงาน', source:'HR Dummy' }); remaining -= 1; });
      }
      if (remaining > 0) rows.push({ staff_id:st.id, staff_name:st.nickname || st.full_name || '', work_date:'', shift_code:'ยังจัดไม่ครบ', hours:remaining * 8, day_type:'เกินเงื่อนไข', source:'ตรวจมือ' });
    });
    return rows.sort((a,b)=>String(a.staff_name).localeCompare(String(b.staff_name),'th') || String(a.work_date).localeCompare(String(b.work_date)) || String(a.shift_code).localeCompare(String(b.shift_code),'th'));
  };
  function exportHRDummySchedule(key=monthKey()) {
    const rows = window.generateHRDummySchedule(key);
    if (!rows.length) { alert('ยังไม่มี OT ที่อนุมัติในเดือนนี้สำหรับสร้าง HR Dummy Schedule'); return; }
    const data = rows.map(r => ({ 'ชื่อ':r.staff_name, 'วันที่':r.work_date, 'เวร HR':r.shift_code, 'ชั่วโมง':r.hours, 'ประเภทวัน':r.day_type, 'หมายเหตุ':r.source }));
    if (typeof XLSX === 'undefined') { console.table(data); alert('ไม่พบไลบรารี Excel ในหน้านี้'); return; }
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'HR Dummy');
    XLSX.writeFile(wb, `HR_Dummy_OT_${key}.xlsx`);
  }

  // Part 4: inject print button in monthly position pages.
  function injectPositionPrintButton() {
    if (!['positionMonth','positionMonthView'].includes(state?.page)) return;
    const toolbar = document.querySelector('.monthly-position-page .toolbar');
    if (!toolbar || toolbar.querySelector('[data-print-month-positions]')) return;
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ghost-btn'; btn.dataset.printMonthPositions = '1'; btn.textContent = 'Export PDF / พิมพ์';
    toolbar.appendChild(btn);
  }
  setTimeout(injectPositionPrintButton, 0);

  // Part 5: mutually exclusive BB-Report / DR-Processing.
  function getMonthPositionRowsForKey(key) {
    if (state?.monthPositionDraft?.monthKey === key) return state.monthPositionDraft.rows || [];
    return (state?.positions || []).filter(r => String(r.work_date || '').startsWith(key));
  }
  function conflictForMonthlyPosition(staffId, newCode, key=state?.positionMonthKey || state?.monthKey) {
    const pair = EXCLUSIVE_POSITION_PAIRS.find(p => p.includes(newCode));
    if (!pair || !staffId) return null;
    const other = pair.find(x => x !== newCode);
    const rows = getMonthPositionRowsForKey(key);
    return rows.find(r => String(r.staff_id) === String(staffId) && String(r.position_code || r.code) === other) || null;
  }
  const prevApplyMonthPositionEdit = window.applyMonthPositionEdit;
  window.applyMonthPositionEdit = applyMonthPositionEdit = function applyMonthPositionEditV127(value, encoded) {
    const [date, staffId] = String(encoded || '').split('|');
    const key = String(date || state?.positionMonthKey || state?.monthKey).slice(0,7);
    const conflict = conflictForMonthlyPosition(staffId, value, key);
    if (conflict) {
      const msg = `ตำแหน่ง BB-Report และ DR-Processing ห้ามเป็นคนเดียวกันในเดือนเดียวกัน\n${staffName(staffId)} มี ${conflict.position_code || conflict.code} อยู่แล้วในเดือนนี้`;
      alert(msg);
      try { if (typeof renderPage === 'function') renderPage(); } catch (_) {}
      return;
    }
    if (typeof prevApplyMonthPositionEdit === 'function') return prevApplyMonthPositionEdit.call(this, value, encoded);
  };

  document.addEventListener('click', function(e) {
    const tab = e.target.closest?.('[data-v127-desktop-tab],[data-v127-mobile-tab]');
    if (tab) {
      e.preventDefault(); e.stopImmediatePropagation();
      if (tab.dataset.v127DesktopTab) { state.scheduleDesktopViewV125 = tab.dataset.v127DesktopTab; state.scheduleDesktopViewV121 = tab.dataset.v127DesktopTab; }
      if (tab.dataset.v127MobileTab) { state.scheduleMobileViewV125 = tab.dataset.v127MobileTab; state.scheduleMobileViewV121 = tab.dataset.v127MobileTab; }
      renderPage(); return;
    }
    const day = e.target.closest?.('[data-v127-day]');
    if (day) {
      e.preventDefault(); e.stopImmediatePropagation();
      const date = day.dataset.v127Day;
      const rows = assignmentsForMonth(monthKey()).filter(a => String(a.duty_date) === date && a.staff_id);
      const body = rows.map(a => `<tr><td>${esc(displayDuty(a.duty_code))}</td><td>${staffPillSafe(a.staff_id)}</td><td>${renderTradeBtnSafe(a) || '-'}</td></tr>`).join('') || '<tr><td colspan="3">ไม่มีเวร</td></tr>';
      showModal(`<h2>${esc(date)}</h2><div class="table-wrap"><table><thead><tr><th>เวร</th><th>เจ้าหน้าที่</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body}</tbody></table></div>`); return;
    }
    const person = e.target.closest?.('[data-v127-person]');
    if (person) {
      e.preventDefault(); e.stopImmediatePropagation();
      const sid = person.dataset.v127Person;
      const rows = assignmentsForMonth(monthKey()).filter(a => String(a.staff_id) === String(sid));
      const body = rows.map(a => `<tr><td>${esc(a.duty_date)}</td><td>${esc(displayDuty(a.duty_code))}</td><td>${renderTradeBtnSafe(a) || '-'}</td></tr>`).join('') || '<tr><td colspan="3">ไม่มีเวร</td></tr>';
      showModal(`<h2>${staffPillSafe(sid)}</h2><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body}</tbody></table></div>`); return;
    }
    if (e.target.closest?.('[data-export-hr-dummy]')) { e.preventDefault(); e.stopImmediatePropagation(); exportHRDummySchedule(monthKey()); return; }
    if (e.target.closest?.('[data-print-month-positions]')) { e.preventDefault(); e.stopImmediatePropagation(); document.body.classList.add('print-month-positions'); setTimeout(() => window.print(), 30); return; }
    if (e.target.closest?.('[data-print-page]') && state?.page === 'schedule') {
      e.preventDefault(); e.stopImmediatePropagation();
      state.scheduleDesktopViewV125 = 'table'; state.scheduleDesktopViewV121 = 'table'; state.scheduleMobileViewV125 = 'table'; state.scheduleMobileViewV121 = 'table';
      document.body.classList.add('print-schedule-grid');
      renderPage(); setTimeout(() => window.print(), 50); return;
    }
  }, true);

  window.addEventListener('afterprint', () => { document.body.classList.remove('print-schedule-grid','print-month-positions'); });

  const css = document.createElement('style');
  css.textContent = `
    .v127-colored-grid tbody tr{background:var(--row-bg)!important}
    .v127-colored-grid tbody tr td{background:var(--row-bg)!important}
    .v127-colored-grid tbody tr td.weekend-cell,.v127-colored-grid tbody tr td.holiday-cell{background:color-mix(in srgb, var(--row-bg) 72%, #fff7ed)!important}
    .v127-colored-grid tbody th{position:sticky;left:0;z-index:3}
    .v127-balance-table td small{display:block;color:#64748b;margin-top:3px;font-size:12px}.v127-excluded{opacity:.82}.v127-status{display:inline-block;border-radius:999px;padding:4px 10px;font-weight:800}.v127-status.ok{background:#dcfce7;color:#166534}.v127-status.lack{background:#fef9c3;color:#854d0e}.v127-status.heavy{background:#fee2e2;color:#991b1b}.v127-status.excluded{background:#e0e7ff;color:#3730a3}
    @media print{
      body.print-schedule-grid .no-print, body.print-month-positions .no-print, body.print-schedule-grid aside, body.print-month-positions aside, body.print-schedule-grid .topbar, body.print-month-positions .topbar{display:none!important}
      body.print-schedule-grid .app-shell, body.print-month-positions .app-shell{display:block!important}
      body.print-schedule-grid main, body.print-month-positions main{margin:0!important;padding:0!important;width:100%!important}
      body.print-schedule-grid .v121-mobile-only{display:none!important} body.print-schedule-grid .v121-desktop-only{display:block!important}
      body.print-schedule-grid .schedule-page-v127, body.print-month-positions .monthly-position-page{box-shadow:none!important;border:0!important;padding:0!important}
      body.print-schedule-grid table, body.print-month-positions table{font-size:9px!important;border-collapse:collapse!important;min-width:0!important;width:100%!important}
      body.print-schedule-grid th, body.print-schedule-grid td, body.print-month-positions th, body.print-month-positions td{padding:3px 4px!important;border:1px solid #cbd5e1!important}
      body.print-schedule-grid .trade-btn, body.print-month-positions .staff-summary-trigger span, body.print-month-positions select{display:none!important}
      body.print-month-positions .monthly-position-page .toolbar{display:none!important}
      @page{size:A4 landscape;margin:8mm}
    }
  `;
  document.head.appendChild(css);
})();
