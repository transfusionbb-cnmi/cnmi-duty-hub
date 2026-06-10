/* CNMI Staff Planner Patch V124
   Scope: Summary calculation only
   - Fix สรุป OT / Summary: hours, shift units, days off, estimated pay
   - Days off counts only Sat/Sun/Public Holiday with no assigned duty, plus no-duty on off days
   - ช4 is bonus/extra: 0 hours, 0 shift units, 0 pay in summary baseline
*/
(function patchV124SummaryCalcFix(){
  if (window.__CNMI_V124_SUMMARY_CALC_FIX__) return;
  window.__CNMI_V124_SUMMARY_CALC_FIX__ = true;

  const esc = (v) => {
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch (_) {}
    return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  };
  const pad2 = (n) => String(n).padStart(2, '0');
  const parseDateSafe = (date) => {
    try { if (typeof parseDate === 'function') return parseDate(date); } catch (_) {}
    return new Date(`${String(date).slice(0, 10)}T00:00:00`);
  };
  const currentMonthKey = () => String(state?.monthKey || new Date().toISOString().slice(0, 7));
  const monthRange = (key=currentMonthKey()) => {
    try { if (typeof getMonthRange === 'function') return getMonthRange(key); } catch (_) {}
    const [y, m] = String(key).split('-').map(Number);
    return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(new Date(y, m, 0).getDate())}` };
  };
  const datesInMonth = (key=currentMonthKey()) => {
    const r = monthRange(key);
    const last = new Date(r.y, r.m, 0).getDate();
    return Array.from({ length:last }, (_, i) => `${r.y}-${pad2(r.m)}-${pad2(i + 1)}`);
  };
  const staffById = (id) => (state?.staff || []).find(s => String(s.id) === String(id));
  const rosterStaffList = () => {
    const rows = (state?.staff || []).filter(s => {
      try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : true; } catch (_) { return true; }
    });
    try { return typeof orderedStaff === 'function' ? orderedStaff(rows) : rows; } catch (_) { return rows; }
  };
  const staffName = (id) => {
    const s = staffById(id);
    return s?.nickname || s?.full_name || '-';
  };
  const colorOf = (staffOrId) => {
    const s = typeof staffOrId === 'object' ? staffOrId : staffById(staffOrId);
    let bg = '#dbeafe', fg = '#0f172a';
    try { bg = staffColor(s || staffOrId); fg = textColorFor(bg); } catch (_) {}
    return `background:${bg};color:${fg};--staff-bg:${bg};--staff-fg:${fg}`;
  };
  const staffPillSafe = (id) => {
    try { if (typeof staffPill === 'function') return staffPill(id); } catch (_) {}
    return `<span class="staff-chip" style="${colorOf(id)}">${esc(staffName(id))}</span>`;
  };

  function normalizeDutyCodeV124(code='') {
    const c = String(code || '').trim();
    if (!c) return '';
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (['ช4A','ช4-MT/แตง','ช4-MT/แตง1','ช4-MT/แตง-1','ช4-1','ช4-MT/แตง 1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4B','ช4-MT/แตง2','ช4-MT/แตง-2','ช4-2','ช4-MT/แตง 2'].includes(c)) return 'ช4-MT/แตง 2';
    if (c === 'ช4') return 'ช4-MT/แตง 1';
    return c;
  }
  function displayDutyCodeV124(code='') {
    const c = normalizeDutyCodeV124(code);
    if (c.startsWith('ช4')) return 'ช4';
    if (c.startsWith('ช9')) return 'ช9';
    return c;
  }
  function isPublicHolidayV124(date, holidayList=state?.holidays || []) {
    const ds = String(date).slice(0, 10);
    return (holidayList || []).some(h => String(h.holiday_date || h.date || h).slice(0, 10) === ds);
  }
  function isWeekendV124(date) {
    const dow = parseDateSafe(date).getDay();
    return dow === 0 || dow === 6;
  }
  function isOffDayV124(date, holidayList=state?.holidays || []) {
    // จุดสำคัญ: วันที่ได้หยุดนับเฉพาะ เสาร์/อาทิตย์/วันหยุดนักขัต เท่านั้น
    return isWeekendV124(date) || isPublicHolidayV124(date, holidayList);
  }
  function isActiveLeaveRowV124(row) {
    return String(row?.status || 'active') !== 'cancelled';
  }
  function dateInRowRangeV124(row, date) {
    const ds = String(date).slice(0, 10);
    return String(row?.start_date || '') <= ds && String(row?.end_date || '') >= ds;
  }
  function hasNoDutyV124(staffId, date) {
    return (state?.leaves || []).some(l => String(l.staff_id) === String(staffId)
      && String(l.type) === 'ไม่รับเวร'
      && isActiveLeaveRowV124(l)
      && dateInRowRangeV124(l, date));
  }
  function staffTypeForRateV124(staffData, dutyCode='') {
    const staff = typeof staffData === 'object' ? staffData : staffById(staffData);
    const raw = String(staff?.staff_type || staff?.position || staff?.role || '').toLowerCase();
    const code = normalizeDutyCodeV124(dutyCode);
    if (code.startsWith('ช4') && staff?.nickname === 'แตง') return 'MT';
    if (raw.includes('เคิก') || raw.includes('clerk') || raw.includes('kerk')) return 'CLERK';
    return 'MT';
  }
  function rateForShiftV124(staffData, date, dutyCode='') {
    const type = staffTypeForRateV124(staffData, dutyCode);
    const publicHoliday = isPublicHolidayV124(date);
    // จุดสำคัญ: เรทขึ้นกับตำแหน่ง MT/Clerk และเฉพาะนักขัตเท่านั้นที่เป็นเรทวันหยุดราชการ
    if (type === 'CLERK') return publicHoliday ? 120 : 90;
    return publicHoliday ? 160 : 120;
  }
  function shiftHoursV124(date, dutyCode='') {
    const c = normalizeDutyCodeV124(dutyCode);
    const offDay = isOffDayV124(date);
    // จุดสำคัญ: แยกวันทำงานปกติ vs เสาร์/อาทิตย์/นักขัต ก่อนแปลงเวรเป็นชั่วโมง
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return offDay ? 24 : 16;
    if (c === 'ช3A' || c === 'ช3B' || c.startsWith('ช9')) return 8;
    if (c.startsWith('ช4')) return 0; // ช4 เป็น bonus/extra ไม่เข้า summary baseline
    return 0; // เวรอื่นยังไม่คิดเงิน/ชั่วโมงอัตโนมัติ
  }
  function shiftUnitsV124(date, dutyCode='') {
    const c = normalizeDutyCodeV124(dutyCode);
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return isOffDayV124(date) ? 3 : 2;
    if (c === 'ช3A' || c === 'ช3B' || c.startsWith('ช9')) return 1;
    if (c.startsWith('ช4')) return 0;
    return 0;
  }
  function calculateShiftMetricsV124(record, staffData=null) {
    const date = record?.duty_date || record?.work_date || record;
    const code = normalizeDutyCodeV124(record?.duty_code || record?.shift_code || '');
    const staff = staffData || staffById(record?.staff_id);
    const hours = shiftHoursV124(date, code);
    const shifts = shiftUnitsV124(date, code);
    const rate = hours ? rateForShiftV124(staff, date, code) : 0;
    return {
      date:String(date).slice(0, 10),
      code,
      displayCode:displayDutyCodeV124(code),
      hours,
      shifts,
      rate,
      pay:hours * rate,
      publicHoliday:isPublicHolidayV124(date),
      weekend:isWeekendV124(date),
      offDay:isOffDayV124(date)
    };
  }

  function calculateStaffSummaryV124(staffData, shiftRecords=[], holidayList=state?.holidays || []) {
    const staff = typeof staffData === 'object' ? staffData : staffById(staffData);
    const staffId = staff?.id || staffData;
    const key = currentMonthKey();
    const monthDates = datesInMonth(key);
    const records = (shiftRecords || []).filter(r => String(r?.staff_id) === String(staffId));

    const summary = {
      staffId,
      totalHours:0,
      totalShifts:0,
      totalDaysOff:0,
      estimatedPay:0,
      dutyCounts:{ chbd1:0, chbd2:0, chbd3:0, ch3A:0, ch3B:0, ch9:0, ch4:0 },
      rows:records
    };

    records.forEach(row => {
      const code = normalizeDutyCodeV124(row.duty_code);
      const m = calculateShiftMetricsV124(row, staff);
      summary.totalHours += m.hours;
      summary.totalShifts += m.shifts;
      summary.estimatedPay += m.pay;
      if (code === 'ชบด1') summary.dutyCounts.chbd1 += 1;
      else if (code === 'ชบด2') summary.dutyCounts.chbd2 += 1;
      else if (code === 'ชบด3') summary.dutyCounts.chbd3 += 1;
      else if (code === 'ช3A') summary.dutyCounts.ch3A += 1;
      else if (code === 'ช3B') summary.dutyCounts.ch3B += 1;
      else if (code.startsWith('ช9')) summary.dutyCounts.ch9 += 1;
      else if (code.startsWith('ช4')) summary.dutyCounts.ch4 += 1;
    });

    monthDates.forEach(date => {
      if (!isOffDayV124(date, holidayList)) return;
      const hasAssignedDuty = records.some(r => String(r.duty_date).slice(0, 10) === date);
      const noDuty = hasNoDutyV124(staffId, date);
      // จุดสำคัญ: วันทำงานปกติที่ไม่มีเวร ไม่ถูกนับ / ไม่รับเวรบนเสาร์-อาทิตย์-นักขัต นับเป็นวันหยุดได้
      if (!hasAssignedDuty || noDuty) summary.totalDaysOff += 1;
    });

    return summary;
  }

  function calculateAllStaffSummariesV124(staffList=[], shiftRecords=[], holidayList=state?.holidays || []) {
    return (staffList || rosterStaffList()).reduce((acc, staff) => {
      acc[staff.id] = calculateStaffSummaryV124(staff, shiftRecords, holidayList);
      return acc;
    }, {});
  }

  window.calculateShiftMetricsV124 = calculateShiftMetricsV124;
  window.calculateStaffSummary = calculateStaffSummaryV124;
  window.calculateAllStaffSummariesV124 = calculateAllStaffSummariesV124;

  // Make shared metric helpers follow the same business rules, so popups/details show the same numbers as Summary.
  window.dutyRatePerHour = dutyRatePerHour = function dutyRatePerHourV124(staffId, date, dutyCode='') {
    return rateForShiftV124(staffById(staffId) || staffId, date, dutyCode);
  };
  window.dutyHoursForCode = dutyHoursForCode = function dutyHoursForCodeV124(date, dutyCode='') {
    return shiftHoursV124(date, dutyCode);
  };
  window.dutyUnitsForCode = dutyUnitsForCode = function dutyUnitsForCodeV124(date, dutyCode='') {
    return shiftUnitsV124(date, dutyCode);
  };
  window.dutyMetrics = dutyMetrics = function dutyMetricsV124(record, staffIdOverride=null) {
    const staff = staffIdOverride ? staffById(staffIdOverride) : staffById(record?.staff_id);
    const m = calculateShiftMetricsV124(record, staff || staffIdOverride || null);
    return { hours:m.hours, rate:m.rate, pay:m.pay, units:m.shifts, code:m.code, publicHoliday:m.publicHoliday, weekend:m.weekend };
  };
  window.dutyHours = dutyHours = function dutyHoursV124(date, dutyCode='') {
    return shiftHoursV124(date, dutyCode);
  };
  window.dutyAmount = dutyAmount = function dutyAmountV124(staffId, date, dutyCode='') {
    return shiftHoursV124(date, dutyCode) * rateForShiftV124(staffById(staffId) || staffId, date, dutyCode);
  };
  window.dutyRateByType = dutyRateByType = function dutyRateByTypeV124(type, date) {
    return rateForShiftV124({ staff_type:type }, date, '');
  };

  window.calcFairness = calcFairness = function calcFairnessV124(assignments=[]) {
    const stats = {};
    (assignments || []).forEach(row => {
      if (!row?.staff_id) return;
      const id = row.staff_id;
      const code = normalizeDutyCodeV124(row.duty_code);
      if (!stats[id]) stats[id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{} };
      const m = calculateShiftMetricsV124(row, staffById(id));
      const dow = parseDateSafe(row.duty_date).getDay();
      stats[id].total += 1;
      stats[id].hours += m.hours;
      stats[id].units += m.shifts;
      stats[id].pay += m.pay;
      if (code.startsWith('ชบด')) stats[id].chbd += 1;
      if (code.startsWith('ช9')) stats[id].ch9 += 1;
      if (code === 'ช3A' || code === 'ช3B') stats[id].ch3 += 1;
      if (code.startsWith('ช4')) stats[id].ch4 += 1;
      const wk = (typeof weekKeyOf === 'function') ? weekKeyOf(row.duty_date) : `${String(row.duty_date).slice(0, 7)}-W${Math.ceil(parseDateSafe(row.duty_date).getDate()/7)}`;
      stats[id].weekCounts[wk] = (stats[id].weekCounts[wk] || 0) + 1;
      if (dow === 1) stats[id].mon += 1;
      if (dow === 5) stats[id].fri += 1;
      if (isOffDayV124(row.duty_date)) stats[id].weekend += 1;
      else stats[id].weekday += 1;
    });
    return stats;
  };

  function monthAssignmentsV124() {
    try { return (typeof getAssignmentsForMonth === 'function' ? getAssignmentsForMonth(currentMonthKey()) : (state?.rosterAssignments || [])).filter(a => a?.staff_id); }
    catch (_) { return (state?.rosterAssignments || []).filter(a => a?.staff_id && String(a.duty_date || '').startsWith(currentMonthKey())); }
  }
  function renderSummaryCardsV124(assignments=monthAssignmentsV124()) {
    const staffRows = rosterStaffList();
    return `<div class="v121-ot-cards">${staffRows.map(staff => {
      const s = calculateStaffSummaryV124(staff, assignments, state?.holidays || []);
      return `<button type="button" class="v121-ot-card" data-v121-person="${esc(staff.id)}"><span class="staff-chip" style="${colorOf(staff)}">${esc(staff.nickname || staff.full_name || '-')}</span><div class="v121-ot-grid"><span>ชั่วโมงเวร/OT</span><b>${Number(s.totalHours || 0).toFixed(1)}</b><span>เงินประมาณ</span><b>${Number(s.estimatedPay || 0).toLocaleString()}</b><span>จำนวนเวร</span><b>${Number(s.totalShifts || 0).toFixed(1).replace(/\.0$/, '')}</b><span>วันที่ได้หยุด</span><b>${Number(s.totalDaysOff || 0)}</b><span>ชบด1</span><b>${s.dutyCounts.chbd1}</b><span>ชบด2</span><b>${s.dutyCounts.chbd2}</b><span>ชบด3</span><b>${s.dutyCounts.chbd3}</b><span>ช9</span><b>${s.dutyCounts.ch9}</b><span>ช3A</span><b>${s.dutyCounts.ch3A}</b><span>ช3B</span><b>${s.dutyCounts.ch3B}</b><span>ช4</span><b>${s.dutyCounts.ch4}</b></div></button>`;
    }).join('')}</div>`;
  }
  window.renderSummaryCardsV124 = renderSummaryCardsV124;

  function patchSummaryDomV124() {
    const cards = document.querySelector('.v121-ot-cards');
    if (!cards) return;
    cards.outerHTML = renderSummaryCardsV124(monthAssignmentsV124());
  }

  const prevRenderPage = window.renderPage || renderPage;
  window.renderPage = renderPage = function renderPageV124() {
    const out = prevRenderPage.apply(this, arguments);
    if (state?.page === 'schedule') {
      try { patchSummaryDomV124(); } catch (err) { console.warn('V124 summary patch failed', err); }
    }
    return out;
  };

  // Legacy staff-stat popup: keep the display, but correct วันหยุด/ชม./เงิน from the new summary engine.
  if (typeof showStaffStats === 'function') {
    window.showStaffStats = showStaffStats = function showStaffStatsV124(staffId) {
      const all = monthAssignmentsV124();
      const rows = all.filter(x => String(x.staff_id) === String(staffId)).sort((a,b) => String(a.duty_date).localeCompare(String(b.duty_date)) || String(a.duty_code).localeCompare(String(b.duty_code)));
      const summary = calculateStaffSummaryV124(staffById(staffId) || staffId, all, state?.holidays || []);
      const detail = rows.map(a => {
        const dm = calculateShiftMetricsV124(a, staffById(staffId));
        const dateText = typeof formatThaiDate === 'function' ? formatThaiDate(a.duty_date) : a.duty_date;
        return `<tr><td>${esc(dateText)}</td><td>${esc(displayDutyCodeV124(a.duty_code))}</td><td>${Number(dm.hours || 0).toFixed(0)} ชม.</td></tr>`;
      }).join('');
      showModal(`<h2>${staffPillSafe(staffId)}</h2><div class="grid grid-2 modal-stat-grid">${statCard('เวรรวม', Number(summary.totalShifts || 0).toFixed(1).replace(/\.0$/, ''))}${statCard('ชม.รวม', Number(summary.totalHours || 0).toFixed(1))}${statCard('เงินประมาณ', Number(summary.estimatedPay || 0).toLocaleString())}${statCard('วันที่ได้หยุด', summary.totalDaysOff || 0)}${statCard('ชบด1', summary.dutyCounts.chbd1)}${statCard('ชบด2', summary.dutyCounts.chbd2)}${statCard('ชบด3', summary.dutyCounts.chbd3)}${statCard('ช3A/ช3B', (summary.dutyCounts.ch3A || 0) + (summary.dutyCounts.ch3B || 0))}${statCard('ช4', summary.dutyCounts.ch4)}${statCard('ช9', summary.dutyCounts.ch9)}</div><div class="compact-detail-table"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ชม.ตั้งต้น</th></tr></thead><tbody>${detail || '<tr><td colspan="3">ยังไม่มีเวรในเดือนนี้</td></tr>'}</tbody></table></div>`);
    };
  }
})();
