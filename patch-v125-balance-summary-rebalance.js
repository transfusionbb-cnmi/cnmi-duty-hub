/* CNMI Staff Planner Patch V125
   Scope:
   1) Harden Summary calculation for OT / Days Off / Pay with explicit business rules.
   2) Add schedule tab: ดูสมดุลเวร.
   3) Harden findBestSubstitute priority sorting while keeping V123 lock/deadline/rebalance behavior.
*/
(function patchV125BalanceSummaryRebalance(){
  if (window.__CNMI_V125_BALANCE_SUMMARY_REBALANCE__) return;
  window.__CNMI_V125_BALANCE_SUMMARY_REBALANCE__ = true;

  const ACTIVE_FROM_MONTH = '2026-07';
  const NO_DUTY_DEADLINE_DAY = 20;
  const NO_DUTY_DEADLINE_MESSAGE = 'หมดเขตลงไม่รับเวรแล้ว กรุณาหาแลก หรือซื้อขายเวรกับเจ้าหน้าที่ภายในหน่วยงาน';

  const esc = (v) => {
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch (_) {}
    return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const monthKey = () => String(state?.monthKey || new Date().toISOString().slice(0, 7));
  const monthOfDate = (date) => String(date || '').slice(0, 7);
  const parseDateSafe = (date) => {
    try { if (typeof parseDate === 'function') return parseDate(date); } catch (_) {}
    return new Date(`${String(date).slice(0, 10)}T00:00:00`);
  };
  const formatDateInputSafe = (d) => {
    try { if (typeof toDateInput === 'function') return toDateInput(d); } catch (_) {}
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };
  const monthRangeSafe = (key=monthKey()) => {
    try { if (typeof getMonthRange === 'function') return getMonthRange(key); } catch (_) {}
    const [y, m] = String(key).split('-').map(Number);
    return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}` };
  };
  const datesInMonthSafe = (key=monthKey()) => {
    const r = monthRangeSafe(key);
    const last = new Date(r.y, r.m, 0).getDate();
    return Array.from({ length:last }, (_, i) => `${r.y}-${pad2(r.m)}-${pad2(i + 1)}`);
  };
  const datesBetweenSafe = (start, end) => {
    try { if (typeof datesBetween === 'function') return datesBetween(start, end); } catch (_) {}
    const out = [];
    let d = parseDateSafe(start);
    const last = parseDateSafe(end);
    while (d <= last) { out.push(formatDateInputSafe(d)); d.setDate(d.getDate() + 1); }
    return out;
  };
  const staffById = (id) => (state?.staff || []).find(s => String(s.id) === String(id));
  const staffNameSafe = (id) => {
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
  const compareStaffSafe = (a, b) => {
    try { if (typeof compareStaffOrder === 'function') return compareStaffOrder(a, b); } catch (_) {}
    const list = staffRows();
    const ai = list.findIndex(s => String(s.id) === String(a?.id));
    const bi = list.findIndex(s => String(s.id) === String(b?.id));
    return (ai < 0 ? 9999 : ai) - (bi < 0 ? 9999 : bi);
  };
  const colorStyle = (staffOrId) => {
    const s = typeof staffOrId === 'object' ? staffOrId : staffById(staffOrId);
    let bg = '#dbeafe', fg = '#0f172a';
    try { if (typeof staffColor === 'function') bg = staffColor(s || staffOrId); } catch (_) {}
    try { if (typeof textColorFor === 'function') fg = textColorFor(bg); } catch (_) {}
    return `background:${bg};color:${fg};--staff-bg:${bg};--staff-fg:${fg}`;
  };
  const staffPillSafe = (id) => {
    try { if (typeof staffPill === 'function') return staffPill(id); } catch (_) {}
    return `<span class="staff-chip" style="${colorStyle(id)}">${esc(staffNameSafe(id))}</span>`;
  };
  const dateThaiSafe = (date) => {
    try { if (typeof dateThai === 'function') return dateThai(date); } catch (_) {}
    try { if (typeof formatThaiDate === 'function') return formatThaiDate(date); } catch (_) {}
    return String(date || '');
  };

  function normalizeDutyCodeV125(code='') {
    const c = String(code || '').trim();
    if (!c) return '';
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (['ช4A','ช4-MT/แตง','ช4-MT/แตง1','ช4-MT/แตง-1','ช4-1','ช4-MT/แตง 1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4B','ช4-MT/แตง2','ช4-MT/แตง-2','ช4-2','ช4-MT/แตง 2'].includes(c)) return 'ช4-MT/แตง 2';
    if (c === 'ช4') return 'ช4-MT/แตง 1';
    return c;
  }
  function displayDutyCodeV125(code='') {
    const c = normalizeDutyCodeV125(code);
    if (c.startsWith('ช4')) return 'ช4';
    if (c.startsWith('ช9')) return 'ช9';
    return c;
  }
  function roleForDutyV125(code, date) {
    const c = normalizeDutyCodeV125(code);
    if (c === 'ช9-เคิก') return 'เคิก';
    if (c === 'ช9-MT/แตง' || c.startsWith('ช4')) return 'MT_OR_TANG';
    if (c === 'ชบด3') {
      const h = (state?.holidays || []).find(x => String(x.holiday_date || x.date || '').slice(0, 10) === String(date).slice(0, 10));
      const text = String(h?.title || '');
      if (text.includes('MT_MT_MT') || text.includes('MT / MT / MT')) return 'MT';
      return 'MT_OR_KERK';
    }
    return 'MT';
  }
  function staffDutyLabelV125(code='') {
    try { if (typeof staffDutyLabelV121 === 'function') return staffDutyLabelV121(code); } catch (_) {}
    return displayDutyCodeV125(code);
  }
  function isPublicHolidayV125(date, holidayList=state?.holidays || []) {
    const ds = String(date).slice(0, 10);
    return (holidayList || []).some(h => String(h?.holiday_date || h?.date || h).slice(0, 10) === ds);
  }
  function isWeekendV125(date) {
    const dow = parseDateSafe(date).getDay();
    return dow === 0 || dow === 6;
  }
  function isOffDayTypeV125(date, holidayList=state?.holidays || []) {
    // นับเป็นชนิดวันหยุดเฉพาะ เสาร์/อาทิตย์/นักขัต เท่านั้น
    return isWeekendV125(date) || isPublicHolidayV125(date, holidayList);
  }
  function isActiveRow(row) {
    return String(row?.status || 'active').toLowerCase() !== 'cancelled';
  }
  function dateInRowRange(row, date) {
    const ds = String(date).slice(0, 10);
    return String(row?.start_date || '') <= ds && String(row?.end_date || '') >= ds;
  }
  function hasLeaveOrNoDuty(staffId, date) {
    return (state?.leaves || []).some(l => String(l.staff_id) === String(staffId) && isActiveRow(l) && dateInRowRange(l, date));
  }
  function hasNoDuty(staffId, date) {
    return (state?.leaves || []).some(l => String(l.staff_id) === String(staffId) && String(l.type) === 'ไม่รับเวร' && isActiveRow(l) && dateInRowRange(l, date));
  }
  function isSlotLocked(slot) {
    if (!slot) return false;
    if (slot.is_locked === true || slot.isLocked === true || slot.locked === true) return true;
    const raw = String(slot.is_locked ?? slot.isLocked ?? slot.locked ?? '').toLowerCase();
    return raw === 'true' || raw === '1' || raw === 'yes' || raw === 'locked';
  }
  function normalizeAssignment(row) {
    if (!row) return row;
    const duty_code = normalizeDutyCodeV125(row.duty_code || row.shift_code || '');
    return { ...row, duty_code, required_role:row.required_role || roleForDutyV125(duty_code, row.duty_date), is_locked:isSlotLocked(row) };
  }
  function assignmentsForMonth(key=monthKey(), includeEmpty=false) {
    let rows = [];
    try { if (typeof getAssignmentsForMonth === 'function') rows = getAssignmentsForMonth(key) || []; } catch (_) {}
    if (!rows.length) rows = (state?.rosterAssignments || []).filter(a => monthOfDate(a.duty_date) === key);
    rows = rows.map(normalizeAssignment).filter(a => monthOfDate(a.duty_date) === key);
    return includeEmpty ? rows : rows.filter(a => a.staff_id);
  }

  function staffTypeForRate(staffData, dutyCode='') {
    const staff = typeof staffData === 'object' ? staffData : staffById(staffData);
    const raw = String(staff?.staff_type || staff?.position || staff?.role || '').toLowerCase();
    if (raw.includes('เคิก') || raw.includes('clerk') || raw.includes('kerk')) return 'CLERK';
    return 'MT';
  }
  function rateForShift(staffData, date, dutyCode='') {
    const type = staffTypeForRate(staffData, dutyCode);
    const publicHoliday = isPublicHolidayV125(date);
    // จุดสำคัญ: MT/Clerk ใช้เรทต่างกัน และนักขัตฤกษ์เท่านั้นที่เปลี่ยนเป็นเรท holiday
    if (type === 'CLERK') return publicHoliday ? 120 : 90;
    return publicHoliday ? 160 : 120;
  }
  function shiftHours(date, dutyCode='') {
    const c = normalizeDutyCodeV125(dutyCode);
    const offDay = isOffDayTypeV125(date);
    // จุดสำคัญ: ชบด1/2/3 ต้องเช็คชนิดวันก่อน วันทำงาน=16 ชม. วันหยุด=24 ชม.
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return offDay ? 24 : 16;
    if (c === 'ช3A' || c === 'ช3B' || c.startsWith('ช9')) return 8;
    if (c.startsWith('ช4')) return 0; // ช4 เป็น bonus/extra ไม่เข้าชั่วโมงตั้งต้น
    return 0;
  }
  function shiftUnits(date, dutyCode='') {
    const c = normalizeDutyCodeV125(dutyCode);
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return isOffDayTypeV125(date) ? 3 : 2;
    if (c === 'ช3A' || c === 'ช3B' || c.startsWith('ช9')) return 1;
    if (c.startsWith('ช4')) return 0;
    return 0;
  }
  function balanceHours(record) {
    const c = normalizeDutyCodeV125(record?.duty_code || record || '');
    if (c.startsWith('ช4')) return 0;
    if (c === 'ช3A' || c === 'ช3B' || c.startsWith('ช9')) return 8;
    return shiftHours(record?.duty_date, c);
  }
  function calculateShiftMetricsV125(record, staffData=null) {
    const row = typeof record === 'object' ? record : { duty_date:record };
    const date = row.duty_date || row.work_date || row.date;
    const code = normalizeDutyCodeV125(row.duty_code || row.shift_code || '');
    const staff = staffData || staffById(row.staff_id);
    const hours = shiftHours(date, code);
    const units = shiftUnits(date, code);
    const rate = hours ? rateForShift(staff, date, code) : 0;
    return { date:String(date).slice(0, 10), code, displayCode:displayDutyCodeV125(code), hours, units, shifts:units, rate, pay:hours * rate, publicHoliday:isPublicHolidayV125(date), weekend:isWeekendV125(date), offDay:isOffDayTypeV125(date) };
  }

  function normalizeDaysInput(daysInMonthOrHolidayList, publicHolidays) {
    if (Array.isArray(daysInMonthOrHolidayList) && daysInMonthOrHolidayList.length && typeof daysInMonthOrHolidayList[0] === 'object' && (daysInMonthOrHolidayList[0].date || daysInMonthOrHolidayList[0].duty_date)) {
      return { days:daysInMonthOrHolidayList.map(d => ({ date:String(d.date || d.duty_date).slice(0, 10), isWeekend:!!d.isWeekend })), holidays:publicHolidays || state?.holidays || [] };
    }
    return { days:datesInMonthSafe(monthKey()).map(date => ({ date, isWeekend:isWeekendV125(date) })), holidays:publicHolidays || daysInMonthOrHolidayList || state?.holidays || [] };
  }

  window.calculateStaffSummary = function calculateStaffSummaryV125(staffData, shiftRecords=[], daysInMonthOrHolidayList=state?.holidays || [], publicHolidays=null) {
    const staff = typeof staffData === 'object' ? staffData : staffById(staffData);
    const staffId = staff?.id || staffData;
    const { days, holidays } = normalizeDaysInput(daysInMonthOrHolidayList, publicHolidays);
    const monthPrefix = days[0]?.date ? monthOfDate(days[0].date) : monthKey();
    const records = (shiftRecords || [])
      .map(normalizeAssignment)
      .filter(r => String(r?.staff_id) === String(staffId) && (!r.duty_date || monthOfDate(r.duty_date) === monthPrefix));

    const summary = { staffId, totalHours:0, totalShifts:0, totalDaysOff:0, estimatedPay:0, dutyCounts:{ chbd1:0, chbd2:0, chbd3:0, ch3A:0, ch3B:0, ch9:0, ch4:0 }, rows:records };

    records.forEach(row => {
      const code = normalizeDutyCodeV125(row.duty_code);
      const m = calculateShiftMetricsV125(row, staff);
      summary.totalHours += m.hours;
      summary.totalShifts += m.units;
      summary.estimatedPay += m.pay;
      if (code === 'ชบด1') summary.dutyCounts.chbd1 += 1;
      else if (code === 'ชบด2') summary.dutyCounts.chbd2 += 1;
      else if (code === 'ชบด3') summary.dutyCounts.chbd3 += 1;
      else if (code === 'ช3A') summary.dutyCounts.ch3A += 1;
      else if (code === 'ช3B') summary.dutyCounts.ch3B += 1;
      else if (code.startsWith('ช9')) summary.dutyCounts.ch9 += 1;
      else if (code.startsWith('ช4')) summary.dutyCounts.ch4 += 1;
    });

    days.forEach(day => {
      const date = String(day.date).slice(0, 10);
      const offDayType = Boolean(day.isWeekend) || isPublicHolidayV125(date, holidays);
      if (!offDayType) return; // ห้ามนับ จ.-ศ. ที่ไม่มีเวรเป็นวันที่ได้หยุด
      const hasDuty = records.some(r => String(r.duty_date).slice(0, 10) === date);
      const noDuty = hasNoDuty(staffId, date);
      if (!hasDuty || noDuty) summary.totalDaysOff += 1;
    });

    return summary;
  };
  window.calculateShiftMetricsV125 = calculateShiftMetricsV125;
  window.dutyMetrics = dutyMetrics = function dutyMetricsV125(record, staffIdOverride=null) {
    const staff = staffIdOverride ? staffById(staffIdOverride) : staffById(record?.staff_id);
    const m = calculateShiftMetricsV125(record, staff || staffIdOverride || null);
    return { hours:m.hours, rate:m.rate, pay:m.pay, units:m.units, code:m.code, publicHoliday:m.publicHoliday, weekend:m.weekend };
  };
  window.dutyHours = dutyHours = function dutyHoursV125(date, dutyCode='') { return shiftHours(date, dutyCode); };
  window.dutyAmount = dutyAmount = function dutyAmountV125(staffId, date, dutyCode='') { return shiftHours(date, dutyCode) * rateForShift(staffById(staffId) || staffId, date, dutyCode); };
  window.dutyRatePerHour = dutyRatePerHour = function dutyRatePerHourV125(staffId, date, dutyCode='') { return rateForShift(staffById(staffId) || staffId, date, dutyCode); };
  window.dutyHoursForCode = dutyHoursForCode = function dutyHoursForCodeV125(date, dutyCode='') { return shiftHours(date, dutyCode); };
  window.dutyUnitsForCode = dutyUnitsForCode = function dutyUnitsForCodeV125(date, dutyCode='') { return shiftUnits(date, dutyCode); };

  window.calcFairness = calcFairness = function calcFairnessV125(assignments=[]) {
    const stats = {};
    (assignments || []).map(normalizeAssignment).forEach(row => {
      if (!row?.staff_id) return;
      const id = row.staff_id;
      const code = normalizeDutyCodeV125(row.duty_code);
      if (!stats[id]) stats[id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{} };
      const m = calculateShiftMetricsV125(row, staffById(id));
      const dow = parseDateSafe(row.duty_date).getDay();
      stats[id].total += 1;
      stats[id].hours += m.hours;
      stats[id].units += m.units;
      stats[id].pay += m.pay;
      if (code.startsWith('ชบด')) stats[id].chbd += 1;
      if (code.startsWith('ช9')) stats[id].ch9 += 1;
      if (code === 'ช3A' || code === 'ช3B') stats[id].ch3 += 1;
      if (code.startsWith('ช4')) stats[id].ch4 += 1;
      const wk = (typeof weekKeyOf === 'function') ? weekKeyOf(row.duty_date) : `${monthOfDate(row.duty_date)}-W${Math.ceil(parseDateSafe(row.duty_date).getDate()/7)}`;
      stats[id].weekCounts[wk] = (stats[id].weekCounts[wk] || 0) + 1;
      if (dow === 1) stats[id].mon += 1;
      if (dow === 5) stats[id].fri += 1;
      if (isOffDayTypeV125(row.duty_date)) stats[id].weekend += 1;
      else stats[id].weekday += 1;
    });
    return stats;
  };

  function monthlySummaryFor(staff, key=monthKey(), assignments=assignmentsForMonth(key, false)) {
    const days = datesInMonthSafe(key).map(date => ({ date, isWeekend:isWeekendV125(date) }));
    return window.calculateStaffSummary(staff, assignments, days, state?.holidays || []);
  }
  function monthDaysOffForStaff(staffId, key, assignments) {
    const staff = staffById(staffId) || { id:staffId };
    return monthlySummaryFor(staff, key, assignments).totalDaysOff || 0;
  }
  function historyMonthsBefore(key=monthKey()) {
    const set = new Set((state?.rosterAssignments || []).map(a => monthOfDate(a.duty_date)).filter(mk => mk >= ACTIVE_FROM_MONTH && mk < key));
    return Array.from(set).sort();
  }
  function buildHistoricalBalance(key=monthKey()) {
    const people = staffRows();
    const histMonths = historyMonthsBefore(key);
    const rows = {};
    people.forEach(s => { rows[s.id] = { previousDaysOff:0, historicalHours:0, specialAdjustment: Number(s.special_adjustment_hours ?? s.balance_adjustment_hours ?? s.carry_over_hours ?? 0) || 0 }; });
    histMonths.forEach(mk => {
      const assignments = assignmentsForMonth(mk, false);
      people.forEach(s => {
        rows[s.id].previousDaysOff += monthDaysOffForStaff(s.id, mk, assignments);
      });
      assignments.forEach(a => {
        if (!a?.staff_id || !rows[a.staff_id]) return;
        rows[a.staff_id].historicalHours += balanceHours(a);
      });
    });
    const avgOff = people.length ? people.reduce((sum, s) => sum + Number(rows[s.id]?.previousDaysOff || 0), 0) / people.length : 0;
    const avgHours = people.length ? people.reduce((sum, s) => sum + Number(rows[s.id]?.historicalHours || 0), 0) / people.length : 0;
    people.forEach(s => {
      rows[s.id].carryOverDaysOff = Number(rows[s.id].previousDaysOff || 0) - avgOff;
      rows[s.id].overtimeBalance = Number(rows[s.id].historicalHours || 0) - avgHours + Number(rows[s.id].specialAdjustment || 0);
    });
    return { rows, avgOff, avgHours, months:histMonths };
  }

  function canStaffCoverShift(staff, slot, assignments) {
    if (!staff || !slot) return false;
    if (hasLeaveOrNoDuty(staff.id, slot.duty_date)) return false;
    try { if (typeof isRosterEnabled === 'function' && !isRosterEnabled(staff)) return false; } catch (_) {}
    try { if (typeof canStaffWorkSlot === 'function') return canStaffWorkSlot(staff.id, slot, assignments); } catch (_) {}
    try { if (typeof supportsRequiredRole === 'function' && !supportsRequiredRole(staff, slot.required_role || roleForDutyV125(slot.duty_code, slot.duty_date))) return false; } catch (_) {}
    try { if (typeof hasSameDayDuty === 'function' && hasSameDayDuty(staff.id, slot.duty_date, assignments, slot)) return false; } catch (_) {}
    try { if (typeof hasAdjacentDuty === 'function' && hasAdjacentDuty(staff.id, slot.duty_date, assignments, slot)) return false; } catch (_) {}
    return true;
  }
  function buildCurrentBalance(assignments=[], key=monthKey()) {
    const people = staffRows();
    const current = {};
    people.forEach(s => { current[s.id] = { hours:0, shifts:0, total:0, weekend:0, weekCounts:{} }; });
    (assignments || []).map(normalizeAssignment).filter(a => a.staff_id && monthOfDate(a.duty_date) === key).forEach(a => {
      const row = current[a.staff_id] = current[a.staff_id] || { hours:0, shifts:0, total:0, weekend:0, weekCounts:{} };
      row.hours += balanceHours(a);
      row.shifts += shiftUnits(a.duty_date, a.duty_code);
      row.total += 1;
      if (isOffDayTypeV125(a.duty_date)) row.weekend += 1;
      const wk = (typeof weekKeyOf === 'function') ? weekKeyOf(a.duty_date) : `${monthOfDate(a.duty_date)}-W${Math.ceil(parseDateSafe(a.duty_date).getDate()/7)}`;
      row.weekCounts[wk] = (row.weekCounts[wk] || 0) + 1;
    });
    return current;
  }
  window.findBestSubstitute = function findBestSubstituteV125(shiftDetails, staffList=[], historicalData={}) {
    const slot = normalizeAssignment(shiftDetails || {});
    if (isSlotLocked(slot)) return null; // Locked slot ห้ามทับเด็ดขาด
    const key = monthOfDate(slot.duty_date || monthKey());
    const assignments = (shiftDetails?.currentAssignments || historicalData.currentAssignments || assignmentsForMonth(key, true)).map(normalizeAssignment);
    const people = (staffList && staffList.length ? staffList : staffRows());
    const current = historicalData.current || buildCurrentBalance(assignments, key);
    const hist = historicalData.rows ? historicalData : buildHistoricalBalance(key);
    const avgCurrentHours = people.length ? people.reduce((sum, s) => sum + Number(current[s.id]?.hours || 0), 0) / people.length : 0;
    const wk = (typeof weekKeyOf === 'function') ? weekKeyOf(slot.duty_date) : `${monthOfDate(slot.duty_date)}-W${Math.ceil(parseDateSafe(slot.duty_date).getDate()/7)}`;

    const candidates = people
      // Hard Constraints: ลา/ไม่รับเวร/ทักษะไม่ตรง/เวรชน/เวรติดกัน = ตัดออกทันที
      .filter(staff => canStaffCoverShift(staff, slot, assignments))
      .map(staff => {
        const c = current[staff.id] || { hours:0, shifts:0, total:0, weekend:0, weekCounts:{} };
        const h = (hist.rows || hist)[staff.id] || {};
        const explicitTarget = Number(staff.target_hours ?? staff.monthly_target_hours ?? 0) || 0;
        const targetHours = Number((historicalData.targetHoursByStaff || {})[staff.id] ?? (explicitTarget || avgCurrentHours));
        const quotaGap = targetHours - Number(c.hours || 0); // มากกว่า = เดือนนี้ยังขาดเวรมากกว่า
        const carryOverDaysOff = Number(h.carryOverDaysOff ?? h.previousDaysOff ?? 0); // มากกว่า = เดือนก่อนหยุดได้มากกว่า จึงถูกเรียกได้ก่อน
        const overtimeBalance = Number(h.overtimeBalance ?? 0); // บวก = เคยทำมากกว่าเฉลี่ย ต้องเลี่ยงให้ก่อน
        const specialAdjustment = Number(h.specialAdjustment ?? staff.special_adjustment_hours ?? staff.balance_adjustment_hours ?? staff.carry_over_hours ?? 0) || 0;
        return { staff, quotaGap, carryOverDaysOff, overtimeBalance, specialAdjustment, currentHours:Number(c.hours || 0), currentShifts:Number(c.shifts || 0), currentWeekend:Number(c.weekend || 0), weekCount:Number((c.weekCounts || {})[wk] || 0) };
      });

    candidates.sort((a, b) => {
      // Priority 1: Quota Gap มากกว่า = ควรถูกเติมก่อน
      const quota = b.quotaGap - a.quotaGap;
      if (Math.abs(quota) > 0.0001) return quota;
      // Priority 2: คนที่เดือนก่อนหยุดได้น้อย/ทำเกิน จะถูกลด priority; จึงเลือก carryOverDaysOff มากกว่า และ overtimeBalance น้อยกว่า
      const offCarry = b.carryOverDaysOff - a.carryOverDaysOff;
      if (Math.abs(offCarry) > 0.0001) return offCarry;
      const over = a.overtimeBalance - b.overtimeBalance;
      if (Math.abs(over) > 0.0001) return over;
      // Priority 3: Special Adjustment ค่าบวก = ทำงานเกิน/ต้องชดเชยให้หลบเวร
      const special = a.specialAdjustment - b.specialAdjustment;
      if (Math.abs(special) > 0.0001) return special;
      return (a.weekCount - b.weekCount) || (a.currentHours - b.currentHours) || (a.currentWeekend - b.currentWeekend) || (a.currentShifts - b.currentShifts) || compareStaffSafe(a.staff, b.staff);
    });

    return candidates[0]?.staff || null;
  };

  function noDutyDeadlineForRosterMonth(key) {
    const [y, m] = String(key || '').split('-').map(Number);
    return new Date(y, (m || 1) - 2, NO_DUTY_DEADLINE_DAY, 23, 59, 59, 999);
  }
  window.isNoDutyLockedForDate = isNoDutyLockedForDate = function isNoDutyLockedForDateV125(date) {
    if (typeof isAdmin === 'function' && isAdmin() && (!window.CFG || CFG.ADMIN_BYPASS_LEAVE_CLOSE_RULE !== false)) return false;
    const key = monthOfDate(date);
    if (key < ACTIVE_FROM_MONTH) return false;
    return new Date() > noDutyDeadlineForRosterMonth(key);
  };
  window.isRosterLockedForDate = isRosterLockedForDate = window.isNoDutyLockedForDate;

  function renderScheduleToolbar() {
    return `<div class="toolbar no-print schedule-toolbar-v125"><label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(monthKey())}"></label><button type="button" class="ghost-btn" data-export-schedule-excel>Export Excel</button><button type="button" class="ghost-btn" data-print-page>Export PDF / พิมพ์</button></div>`;
  }
  function renderTab(view, label, target) {
    const cur = target === 'desktop' ? (state.scheduleDesktopViewV125 || state.scheduleDesktopViewV121 || 'table') : (state.scheduleMobileViewV125 || state.scheduleMobileViewV121 || 'day');
    const attr = target === 'desktop' ? 'data-v125-desktop-tab' : 'data-v125-mobile-tab';
    return `<button type="button" class="${cur === view ? 'primary-btn' : 'ghost-btn'}" ${attr}="${esc(view)}">${esc(label)}</button>`;
  }
  function renderExcel(assignments) {
    let html = '';
    try { html = renderSchedulePersonMatrix(assignments); }
    catch (_) { try { html = renderReadOnlySchedule(assignments); } catch (e) { html = '<div class="empty-state">ไม่พบตารางเวร</div>'; } }
    return `<div class="v121-excel-view v125-excel-view">${html}</div>`;
  }
  function dutiesByDate(assignments, date, includeEmpty=false) {
    const sort = (a, b) => {
      try { if (typeof dutySortV121 === 'function') return dutySortV121(a.duty_code, b.duty_code); } catch (_) {}
      return String(a.duty_code).localeCompare(String(b.duty_code));
    };
    return (assignments || []).filter(a => String(a.duty_date) === String(date) && (includeEmpty || a.staff_id)).sort(sort);
  }
  function dutiesByStaff(assignments, staffId) {
    return (assignments || []).filter(a => String(a.staff_id) === String(staffId)).sort((a, b) => String(a.duty_date).localeCompare(String(b.duty_date)) || String(a.duty_code).localeCompare(String(b.duty_code)));
  }
  function tradeButton(a) {
    if (!a?.staff_id) return '';
    const id = a.id || `${a.duty_date}|${a.duty_code}|${a.staff_id || ''}`;
    return `<button type="button" class="tiny-btn" data-v125-trade="${esc(id)}">ซื้อ/แลก</button>`;
  }
  function showDayDetail(date) {
    const rows = dutiesByDate(assignmentsForMonth(monthKey(), true), date, true);
    const body = rows.map(a => `<tr><td>${esc(staffDutyLabelV125(a.duty_code))}</td><td>${a.staff_id ? staffPillSafe(a.staff_id) : '<span class="muted">ยังไม่จัด</span>'}</td><td>${tradeButton(a) || '-'}</td></tr>`).join('') || '<tr><td colspan="3">ไม่มีเวร</td></tr>';
    showModal(`<h2>${esc(dateThaiSafe(date))}</h2><div class="table-wrap"><table><thead><tr><th>เวร</th><th>เจ้าหน้าที่</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body}</tbody></table></div>`);
  }
  function showPersonDetail(staffId) {
    const assignments = assignmentsForMonth(monthKey(), false);
    const rows = dutiesByStaff(assignments, staffId);
    const summary = monthlySummaryFor(staffById(staffId) || staffId, monthKey(), assignments);
    const body = rows.map(a => { const dm = calculateShiftMetricsV125(a, staffById(staffId)); return `<tr><td>${esc(dateThaiSafe(a.duty_date))}</td><td>${esc(staffDutyLabelV125(a.duty_code))}</td><td>${Number(dm.hours || 0).toFixed(0)} ชม.</td><td>${Number(dm.pay || 0).toLocaleString()} บ.</td><td>${tradeButton(a) || '-'}</td></tr>`; }).join('') || '<tr><td colspan="5">ไม่มีเวรเดือนนี้</td></tr>';
    showModal(`<h2>${staffPillSafe(staffId)}</h2><div class="metric-grid roster-person-popup-metrics"><div><b>${Number(summary.totalShifts || 0).toFixed(1).replace(/\.0$/, '')}</b><span>จำนวนเวร</span></div><div><b>${Number(summary.totalHours || 0).toFixed(1)}</b><span>ชม.รวม</span></div><div><b>${Number(summary.estimatedPay || 0).toLocaleString()}</b><span>เงินประมาณ</span></div><div><b>${Number(summary.totalDaysOff || 0)}</b><span>วันที่ได้หยุด</span></div></div><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ชม.</th><th>เงิน</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body}</tbody></table></div>`);
  }
  function renderDesktopDay(assignments) {
    const r = monthRangeSafe(monthKey());
    const last = new Date(r.y, r.m, 0).getDate();
    return `<div class="v121-desktop-day-list">${Array.from({ length:last }, (_, i) => i + 1).map(d => {
      const date = `${r.y}-${pad2(r.m)}-${pad2(d)}`;
      const rows = dutiesByDate(assignments, date);
      const holiday = isPublicHolidayV125(date);
      const off = holiday || isWeekendV125(date);
      const holidayText = holiday ? `<em>${esc((state?.holidays || []).find(h => String(h.holiday_date || h.date || '').slice(0,10) === date)?.title || 'วันหยุด')}</em>` : '';
      return `<button type="button" class="v121-date-card ${off ? 'weekend' : ''}" data-v125-day="${date}"><div class="v121-date-head"><b>${d}</b><span>${parseDateSafe(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${holidayText}</div><div class="v121-duty-lines">${rows.map(a => `<span class="v121-duty-bar" style="${colorStyle(a.staff_id)}">${esc(staffDutyLabelV125(a.duty_code))} ${esc(staffNameSafe(a.staff_id))}</span>`).join('') || '<small class="muted">ไม่มีเวร</small>'}</div></button>`;
    }).join('')}</div>`;
  }
  function renderPersons(assignments) {
    return `<div class="v121-person-grid">${staffRows().map(s => {
      const rows = dutiesByStaff(assignments, s.id);
      return `<button type="button" class="v121-person-card" data-v125-person="${esc(s.id)}"><span class="staff-chip" style="${colorStyle(s)}">${esc(s.nickname || s.full_name || '-')}</span><b>${rows.length} เวร</b><div>${rows.slice(0, 6).map(a => `<small>${esc(dateThaiSafe(a.duty_date))} ${esc(staffDutyLabelV125(a.duty_code))}</small>`).join('') || '<small class="muted">ไม่มีเวรเดือนนี้</small>'}</div></button>`;
    }).join('')}</div>`;
  }
  function renderMobileDay(assignments) {
    const r = monthRangeSafe(monthKey());
    const last = new Date(r.y, r.m, 0).getDate();
    const firstDow = new Date(r.y, r.m - 1, 1).getDay();
    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push({ blank:true });
    for (let d = 1; d <= last; d++) cells.push({ day:d, date:`${r.y}-${pad2(r.m)}-${pad2(d)}` });
    while (cells.length % 7) cells.push({ blank:true });
    return `<p class="hint mobile-day-hint">กดวันที่เพื่อดูรายการเวร และปุ่มซื้อ/แลก</p><div class="v121-mobile-cal"><div class="v121-week-head"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="v121-mobile-cal-grid">${cells.map(c => {
      if (c.blank) return '<button type="button" class="v121-mobile-day empty" disabled></button>';
      const rows = dutiesByDate(assignments, c.date);
      const shown = rows.slice(0, 3);
      const hidden = rows.length - shown.length;
      const off = isOffDayTypeV125(c.date);
      return `<button type="button" class="v121-mobile-day ${off ? 'weekend' : ''}" data-v125-day="${c.date}"><div class="v121-mobile-day-num"><b>${c.day}</b></div>${shown.map(a => `<span class="v121-duty-bar" style="${colorStyle(a.staff_id)}">${esc(staffDutyLabelV125(a.duty_code))} ${esc(staffNameSafe(a.staff_id))}</span>`).join('')}${hidden > 0 ? `<span class="v121-more">+${hidden}</span>` : ''}</button>`;
    }).join('')}</div></div>`;
  }
  function renderOtCards(assignments) {
    return `<div class="v121-ot-cards">${staffRows().map(staff => {
      const s = monthlySummaryFor(staff, monthKey(), assignments);
      return `<button type="button" class="v121-ot-card" data-v125-person="${esc(staff.id)}"><span class="staff-chip" style="${colorStyle(staff)}">${esc(staff.nickname || staff.full_name || '-')}</span><div class="v121-ot-grid"><span>ชั่วโมงเวร/OT</span><b>${Number(s.totalHours || 0).toFixed(1)}</b><span>เงินประมาณ</span><b>${Number(s.estimatedPay || 0).toLocaleString()}</b><span>จำนวนเวร</span><b>${Number(s.totalShifts || 0).toFixed(1).replace(/\.0$/, '')}</b><span>วันที่ได้หยุด</span><b>${Number(s.totalDaysOff || 0)}</b><span>ชบด1</span><b>${s.dutyCounts.chbd1}</b><span>ชบด2</span><b>${s.dutyCounts.chbd2}</b><span>ชบด3</span><b>${s.dutyCounts.chbd3}</b><span>ช9</span><b>${s.dutyCounts.ch9}</b><span>ช3A</span><b>${s.dutyCounts.ch3A}</b><span>ช3B</span><b>${s.dutyCounts.ch3B}</b><span>ช4</span><b>${s.dutyCounts.ch4}</b></div></button>`;
    }).join('')}</div>`;
  }
  function quotaForStaff(staff, avgShifts) {
    const raw = staff.target_shifts ?? staff.monthly_target_shifts ?? staff.roster_quota ?? staff.quota ?? staff.target_duty_count;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : avgShifts;
  }
  function renderBalanceView(assignments) {
    const people = staffRows();
    const summaries = people.map(staff => ({ staff, summary:monthlySummaryFor(staff, monthKey(), assignments) }));
    const avgShifts = summaries.length ? summaries.reduce((sum, r) => sum + Number(r.summary.totalShifts || 0), 0) / summaries.length : 0;
    const hist = buildHistoricalBalance(monthKey());
    const rows = summaries.map(({ staff, summary }) => {
      const target = quotaForStaff(staff, avgShifts);
      const current = Number(summary.totalShifts || 0);
      const gap = target - current;
      const h = hist.rows[staff.id] || {};
      const overtimeBalance = Number(h.overtimeBalance || 0);
      let status = 'สมดุล', cls = 'ok';
      if (current > target + 1 || overtimeBalance > 8) { status = 'งานหนักเกิน'; cls = 'heavy'; }
      else if (current < target - 1) { status = 'ขาดเวร'; cls = 'lack'; }
      return `<tr><td>${staffPillSafe(staff.id)}<small>${esc(staff.staff_type || staff.position || '')}</small></td><td><b>${current.toFixed(1).replace(/\.0$/, '')}</b> / ${Number(target || 0).toFixed(1).replace(/\.0$/, '')}<small>${gap > 0 ? `ขาด ${gap.toFixed(1).replace(/\.0$/, '')}` : gap < 0 ? `เกิน ${Math.abs(gap).toFixed(1).replace(/\.0$/, '')}` : 'พอดี'}</small></td><td>${Number(h.previousDaysOff || 0).toFixed(0)} วัน<small>${Number(h.carryOverDaysOff || 0) >= 0 ? '+' : ''}${Number(h.carryOverDaysOff || 0).toFixed(1)} เทียบเฉลี่ย</small></td><td>${overtimeBalance >= 0 ? '+' : ''}${overtimeBalance.toFixed(1)} ชม.<small>ชดเชย ${Number(h.specialAdjustment || 0).toFixed(1)} ชม.</small></td><td><span class="v125-status ${cls}">${status}</span></td></tr>`;
    }).join('');
    const note = hist.months.length ? `ใช้ประวัติสะสมตั้งแต่ ${ACTIVE_FROM_MONTH} ถึง ${hist.months[hist.months.length - 1]}` : `ยังไม่มีประวัติสะสมก่อนเดือนนี้ ระบบจะใช้เฉพาะสมดุลของเดือนปัจจุบัน`;
    return `<div class="v125-balance-view"><div class="alert info"><b>ดูสมดุลเวร</b><br>${esc(note)} · ช4 ไม่นำเข้าชั่วโมงสมดุล</div><div class="table-wrap"><table class="v125-balance-table"><thead><tr><th>ชื่อ-สกุล / ตำแหน่ง</th><th>จัดแล้ว / เป้าหมาย</th><th>วันหยุดยกยอด</th><th>ยอดชดเชยเวร</th><th>Status</th></tr></thead><tbody>${rows || '<tr><td colspan="5">ไม่มีข้อมูลเจ้าหน้าที่</td></tr>'}</tbody></table></div></div>`;
  }

  function renderMonthlySchedulePageV125() {
    if (!state.scheduleDesktopViewV125) state.scheduleDesktopViewV125 = state.scheduleDesktopViewV121 || 'table';
    if (!state.scheduleMobileViewV125) state.scheduleMobileViewV125 = state.scheduleMobileViewV121 || 'day';
    const assignments = assignmentsForMonth(monthKey(), false);
    const dview = state.scheduleDesktopViewV125;
    const mview = state.scheduleMobileViewV125;
    const desktopViewHtml = dview === 'day' ? renderDesktopDay(assignments) : dview === 'person' ? renderPersons(assignments) : dview === 'balance' ? renderBalanceView(assignments) : renderExcel(assignments);
    const mobileViewHtml = mview === 'person' ? renderPersons(assignments) : mview === 'ot' ? renderOtCards(assignments) : mview === 'table' ? renderExcel(assignments) : mview === 'balance' ? renderBalanceView(assignments) : renderMobileDay(assignments);
    return `<div class="card schedule-page-v121 schedule-page-v125">${renderScheduleToolbar()}
      <section class="v121-desktop-only"><div class="v121-tabs no-print">${renderTab('table','ตารางทั้งเดือน','desktop')}${renderTab('day','ดูตามวัน','desktop')}${renderTab('person','ดูตามคน','desktop')}${renderTab('balance','ดูสมดุลเวร','desktop')}</div><div class="v121-view">${desktopViewHtml}</div></section>
      <section class="v121-mobile-only"><div class="v121-tabs v121-mobile-tabs no-print">${renderTab('day','ดูตามวัน','mobile')}${renderTab('person','ดูตามคน','mobile')}${renderTab('ot','สรุป OT','mobile')}${renderTab('table','ตาราง','mobile')}${renderTab('balance','สมดุลเวร','mobile')}</div><div class="v121-view">${mobileViewHtml}</div></section>
    </div>`;
  }
  window.renderMonthlySchedulePage = renderMonthlySchedulePage = renderMonthlySchedulePageV125;

  const prevRenderPage = window.renderPage || renderPage;
  window.renderPage = renderPage = function renderPageV125() {
    if (state?.page === 'schedule') {
      const item = (typeof NAV_ITEMS !== 'undefined' ? NAV_ITEMS : []).find(x => x.id === 'schedule') || {};
      if ($id('pageTitle')) $id('pageTitle').textContent = item.title || 'ตารางเวรประจำเดือน';
      if ($id('pageSubtitle')) $id('pageSubtitle').textContent = item.subtitle || 'ดูรายเดือน Export Excel / PDF / Print';
      try { renderNav(); } catch (_) {}
      if ($id('pageContent')) $id('pageContent').innerHTML = renderMonthlySchedulePageV125();
      return;
    }
    return prevRenderPage.apply(this, arguments);
  };

  document.addEventListener('click', function(e) {
    const trade = e.target.closest?.('[data-v125-trade]');
    if (trade) {
      e.preventDefault(); e.stopImmediatePropagation();
      const id = String(trade.dataset.v125Trade || '');
      const a = assignmentsForMonth(monthKey(), false).find(x => String(x.id || `${x.duty_date}|${x.duty_code}|${x.staff_id || ''}`) === id);
      if (a && typeof showTradeRequestModal === 'function') showTradeRequestModal(a);
      else if (a && typeof showTradeModal === 'function' && a.id) showTradeModal(a.id);
      else if (a) showModal(`<h2>ซื้อ/แลกเวร</h2><p>${staffPillSafe(a.staff_id)} • ${esc(dateThaiSafe(a.duty_date))} • ${esc(staffDutyLabelV125(a.duty_code))}</p><button class="primary-btn" data-page="tradeRequests">ไปหน้าคำขอแลก/ขายเวร</button>`);
      return;
    }
    const t = e.target.closest?.('[data-v125-desktop-tab],[data-v125-mobile-tab],[data-v125-day],[data-v125-person]');
    if (!t) return;
    if (t.dataset.v125DesktopTab) { e.preventDefault(); e.stopImmediatePropagation(); state.scheduleDesktopViewV125 = t.dataset.v125DesktopTab; state.scheduleDesktopViewV121 = t.dataset.v125DesktopTab; renderPage(); return; }
    if (t.dataset.v125MobileTab) { e.preventDefault(); e.stopImmediatePropagation(); state.scheduleMobileViewV125 = t.dataset.v125MobileTab; state.scheduleMobileViewV121 = t.dataset.v125MobileTab; renderPage(); return; }
    if (t.dataset.v125Day) { e.preventDefault(); e.stopImmediatePropagation(); showDayDetail(t.dataset.v125Day); return; }
    if (t.dataset.v125Person) { e.preventDefault(); e.stopImmediatePropagation(); showPersonDetail(t.dataset.v125Person); return; }
  }, true);

  const css = document.createElement('style');
  css.textContent = `
    .schedule-page-v125 .v125-balance-view .alert.info{background:#f0f9ff;border:1px solid #bae6fd;color:#075985;border-radius:14px;padding:12px;margin:0 0 12px}
    .schedule-page-v125 .v125-balance-table td:first-child small{display:block;color:#64748b;margin-top:3px}
    .schedule-page-v125 .v125-balance-table td small{display:block;color:#64748b;margin-top:3px;font-size:12px}
    .schedule-page-v125 .v125-status{display:inline-block;border-radius:999px;padding:4px 10px;font-weight:800;white-space:nowrap}
    .schedule-page-v125 .v125-status.ok{background:#dcfce7;color:#166534}
    .schedule-page-v125 .v125-status.lack{background:#fef9c3;color:#854d0e}
    .schedule-page-v125 .v125-status.heavy{background:#fee2e2;color:#991b1b}
    @media(max-width:820px){.schedule-page-v125 .v121-mobile-tabs{grid-template-columns:repeat(5,1fr)!important;gap:6px!important}.schedule-page-v125 .v121-mobile-tabs button{font-size:13px!important;padding:10px 2px!important}.schedule-page-v125 .v125-balance-table{font-size:12px}.schedule-page-v125 .v125-balance-table th,.schedule-page-v125 .v125-balance-table td{padding:7px 6px!important}}
  `;
  document.head.appendChild(css);
})();
