/* CNMI Staff Planner Patch V109
   - Clean Excel roster row height + remove staff type under name
   - Restore old roster sub-view tabs inside the lower panel
   - Clean OT page wording, move monthly export to section 4
   - Put duty check-in into OT approval queue and monthly OT summary
*/
(function patchV109(){
  window.CNMI_PATCH_V109 = true;

  const V109_DUTY_CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function normDutyV109(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4A' || c === 'ช4B' || c === 'ช4') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelV109(code='') {
    const c = normDutyV109(code);
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function leaveTextV109(staffId, date) {
    const rows = (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function allowedCodesForDateV109(date, assignments=[]) {
    let codes = [];
    try { codes = allowedDutyCodesForDate(date) || []; } catch (_) { codes = []; }
    const present = (assignments || []).filter(a => a.duty_date === date).map(a => normDutyV109(a.duty_code));
    const merged = [...new Set([...codes.map(normDutyV109), ...present])];
    return V109_DUTY_CODES.filter(c => merged.includes(c));
  }
  function dutySortV109(code) {
    const i = V109_DUTY_CODES.indexOf(normDutyV109(code));
    return i < 0 ? 999 : i;
  }
  function formatDateCellV109(date) {
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }
  function staffActiveForRosterV109(assignments) {
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function rowsByStaffDateV109(assignments) {
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code: normDutyV109(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySortV109(a.duty_code) - dutySortV109(b.duty_code)));
    return map;
  }
  function renderExcelRosterMatrixV109(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const active = staffActiveForRosterV109(assignments);
    const byStaffDate = rowsByStaffDateV109(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDateCellV109(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextV109(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabelV109(a.duty_code))).join('<br>') : escapeHtml(leaveText || '');
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }
  function scheduleSubTabV109(id, label) {
    return `<button class="${state.scheduleMobileView === id ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${id}" type="button">${label}</button>`;
  }
  function renderOldByDayV109(assignments, codes, y, m, last) {
    return `<div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV109(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length:last }, (_, i) => i + 1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${formatDateCellV109(date)}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedCodesForDateV109(date, assignments).includes(normDutyV109(code))) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normDutyV109(a.duty_code) === normDutyV109(code));
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
  }
  function renderOldByPersonV109(assignments) {
    const active = staffActiveForRosterV109(assignments);
    return `<div class="table-wrap"><table class="schedule-by-person-v107"><thead><tr><th>เจ้าหน้าที่</th><th>รายการเวรในเดือนนี้</th><th>รวม</th></tr></thead><tbody>${active.map(st => {
      const rows = assignments.filter(a => String(a.staff_id) === String(st.id)).sort((a,b) => String(a.duty_date).localeCompare(String(b.duty_date)) || dutySortV109(a.duty_code) - dutySortV109(b.duty_code));
      return `<tr><td>${staffPill(st)}</td><td>${rows.length ? rows.map(a => `<span class="mini-duty-chip-v107">${formatThaiDate(a.duty_date)} ${escapeHtml(dutyLabelV109(a.duty_code))}${renderTradeButton(a)}</span>`).join(' ') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</td><td>${rows.length}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldOtV109(assignments) {
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = staffActiveForRosterV109(assignments);
    return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${active.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.pay || 0).toLocaleString()}</td><td>${(r.units || 0).toFixed(1)}</td><td>${r.chbd || 0}</td><td>${r.ch9 || 0}</td><td>${r.ch3 || 0}</td><td>${r.ch4 || 0}</td><td>${r.weekend || 0}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldMatrixV109(assignments, y, m, last) {
    const active = staffActiveForRosterV109(assignments);
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const byStaffDate = rowsByStaffDateV109(assignments);
    return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${formatDateCellV109(`${y}-${pad(m)}-${pad(day)}`)}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rows = byStaffDate[`${s.id}|${date}`] || [];
      const leaveText = leaveTextV109(s.id, date);
      const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
      return `<td class="${cls}">${rows.length ? `<b>${rows.map(a => escapeHtml(dutyLabelV109(a.duty_code))).join('<br>')}</b>` : (leaveText ? `<span class="no-duty-one-line-v107">${escapeHtml(leaveText)}</span>` : '')}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderMobileScheduleByDayV109(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return `<div class="mobile-schedule-list">${Array.from({ length:last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = allowedCodesForDateV109(date, assignments).map(code => ({ code, slot: assignments.find(a => a.duty_date === date && normDutyV109(a.duty_code) === code) })).filter(x => x.slot?.staff_id);
      return `<div class="schedule-day-card ${isHolidayDate(date) || isWeekend(date) ? 'weekend-row' : ''}"><div class="mobile-day-head"><b>${day}</b><span>${formatDateCellV109(date)}</span>${isHolidayDate(date) ? badge(holidayName(date), 'yellow') : ''}</div>${slots.length ? slots.map(({ code, slot }) => `<div class="mobile-duty-line"><b>${escapeHtml(dutyLabelV109(code))}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV109(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = [...new Set((assignments || []).map(a => normDutyV109(a.duty_code)).filter(Boolean))].sort((a,b) => dutySortV109(a)-dutySortV109(b));
    const useCodes = codes.length ? codes : V109_DUTY_CODES;
    const view = state.scheduleMobileView || 'day';
    const detail = view === 'person'
      ? renderOldByPersonV109(assignments)
      : view === 'ot'
        ? renderOldOtV109(assignments)
        : view === 'table'
          ? renderOldMatrixV109(assignments, y, m, last)
          : renderOldByDayV109(assignments, useCodes, y, m, last);
    const oldPanel = `<details class="old-duty-table-v107 old-duty-table-v109" open><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary><div class="old-duty-tabs-v109 no-print">${scheduleSubTabV109('day','ดูตามวัน')}${scheduleSubTabV109('person','ดูตามคน')}${scheduleSubTabV109('ot','สรุปตามคน')}${scheduleSubTabV109('table','ตารางทั้งเดือน')}</div>${detail}</details>`;
    return renderExcelRosterMatrixV109(assignments) + oldPanel;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;
  renderSchedulePersonMatrix = function renderSchedulePersonMatrixV109(assignments) { return renderExcelRosterMatrixV109(assignments); };
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix;
  renderMobileScheduleByDay = renderMobileScheduleByDayV109;
  window.renderMobileScheduleByDay = renderMobileScheduleByDay;

  // ---- OT page ----
  function otMonthRowsV109() {
    const key = state.monthKey || todayStr().slice(0,7);
    const rows = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key));
    return isAdmin() ? rows : rows.filter(x => String(x.staff_id) === String(currentStaffId()));
  }
  function autoHoursFromNoteV109(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  calcOtHours = function calcOtHoursV109(r) {
    const auto = autoHoursFromNoteV109(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.end_time) return 0;
    const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
    let end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;
  function cleanOtNoteV109(note='') {
    return String(note || '').replace(/\s*\|?\s*AUTO_HOURS\s*:\s*[0-9]+(?:\.[0-9]+)?/i, '').trim();
  }
  function renderOtTableV109(rows) {
    if (!rows.length) return empty('ยังไม่มีรายการ OT');
    const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV109(r.note || ''))}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
    const cards = `<div class="mobile-cards ot-mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV109(r.note || ''))}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    return table + cards;
  }
  renderOtTable = renderOtTableV109;
  window.renderOtTable = renderOtTable;
  function renderOtSummaryV109() {
    const key = state.monthKey;
    const approved = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key) && x.status === 'อนุมัติ');
    const map = {};
    approved.forEach(r => {
      map[r.staff_id] = map[r.staff_id] || { hours:0, incharge:0, count:0 };
      map[r.staff_id].hours += calcOtHours(r);
      map[r.staff_id].count++;
    });
    const inchargeId = currentInchargeForMonth(key);
    if (inchargeId) {
      map[inchargeId] = map[inchargeId] || { hours:0, incharge:0, count:0 };
      map[inchargeId].incharge += 8;
    }
    const rows = Object.entries(map).filter(([,r]) => (r.hours || 0) || (r.incharge || 0) || (r.count || 0));
    if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
    rows.sort((a,b) => staffNick(a[0]).localeCompare(staffNick(b[0]), 'th'));
    return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมงจากเวร/OT</th><th>ชั่วโมงอินชาร์จ</th><th>รวมชั่วโมง OT</th><th>จำนวนรายการ</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.incharge || 0).toFixed(1)}</td><td>${((r.hours || 0) + (r.incharge || 0)).toFixed(1)}</td><td>${r.count || 0}</td></tr>`).join('')}</tbody></table></div>`;
  }
  renderOtSummary = renderOtSummaryV109;
  window.renderOtSummary = renderOtSummary;
  renderOtPage = function renderOtPageV109() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = (state.rosterAssignments || []).some(x => x.duty_date === todayStr() && String(x.staff_id) === String(currentStaffId()));
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const rows = otMonthRowsV109();
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${dutyLabelV109(x.assignment.duty_code)}`).join('<br>')}</div>` : '';
    return `<div class="grid grid-2 ot-page">
      <div class="card ot-card">
        <h3>ส่วนที่ 1 ยืนยันวันอยู่เวร</h3>
        <p class="muted">${myDuty ? 'วันนี้มีชื่อคุณในตารางเวร' : proxyOptions.length ? 'วันนี้คุณเป็นผู้มาทำเวรแทนตามข้อตกลงกันเอง / จ่ายกันเอง' : 'วันนี้ยังไม่พบชื่อคุณในตารางเวร ถ้าลงจริงให้ Admin ตรวจตารางก่อน'}</p>
        ${proxyBox}
        <button class="primary-btn" data-check-in ${(!canCheckIn) ? 'disabled' : ''}>ยืนยันวันอยู่เวร</button>
      </div>
      <div class="card ot-card">
        <h3>ส่วนที่ 2 ขอ OT เพิ่ม / เวรปั่นเลือด</h3>
        <form id="otForm" class="form-grid">
          <label>วันที่ <input name="work_date" type="date" value="${todayStr()}" required></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" required></label>
          <label>เหตุผล <select name="reason" id="otReasonSelect">${OT_REASONS.map(r => `<option>${r}</option>`).join('')}</select></label>
          <label>รายละเอียด <input name="note" id="otNoteInput" placeholder="เช่น ปั่นเลือดถึง 18:20 / รอเทียบ LIS"></label>
          <button class="primary-btn wide" type="submit">ยืนยันขอ OT เพิ่ม</button>
        </form>
      </div>
      <div class="card wide-card" style="grid-column:1/-1;">
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3></div>
        ${renderOtTableV109(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <div class="section-title"><div><h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว และบวกอินชาร์จประจำเดือน 8 ชม.</p></div>${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div>${renderOtSummaryV109()}
      </div>
    </div>`;
  };
  window.renderOtPage = renderOtPage;

  function scheduledAssignmentsForWorkerV109(date, workerId, proxyOptions=[]) {
    const direct = (state.rosterAssignments || []).filter(x => x.duty_date === date && String(x.staff_id) === String(workerId));
    if (direct.length) return direct;
    return (proxyOptions || []).map(x => x.assignment).filter(Boolean);
  }
  async function insertCheckInOtQueueV109(workerId, date, proxyOptions=[]) {
    const assignments = scheduledAssignmentsForWorkerV109(date, workerId, proxyOptions);
    if (!assignments.length) return;
    const already = (state.otRequests || []).some(r => String(r.staff_id) === String(workerId) && r.work_date === date && String(r.reason || '').includes('ยืนยันอยู่เวร'));
    if (already) return;
    const totalHours = assignments.reduce((sum, a) => sum + (dutyMetrics(a, workerId).hours || 0), 0);
    const dutyText = assignments.map(a => dutyLabelV109(a.duty_code)).join(', ');
    const note = `เวรตามตาราง: ${dutyText} | AUTO_HOURS:${totalHours}`;
    const row = { staff_id: workerId, work_date: date, end_time: null, reason: 'ยืนยันอยู่เวรตามตาราง', note, status: 'รออนุมัติ', check_out_at: new Date().toISOString(), device: navigator.userAgent.slice(0, 250) };
    const { error } = await sb.from('ot_requests').insert(row);
    if (error) console.warn('insert duty OT queue failed', error.message || error);
  }
  checkIn = async function checkInV109() {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const date = todayStr();
    const proxyOptions = selfPaidDutyProxyOptions(date);
    let staffIdToLog = currentStaffId();
    let proxyText = '';
    if (!(state.rosterAssignments || []).some(x => x.duty_date === date && String(x.staff_id) === String(currentStaffId())) && proxyOptions.length) {
      const pick = proxyOptions[0];
      staffIdToLog = pick.assignment.staff_id;
      proxyText = ` | ลงชื่อแทนโดย ${staffNick(currentStaffId())} จากข้อตกลงจ่ายกันเอง request:${pick.request.id}`;
    }
    const device = (navigator.userAgent + proxyText).slice(0, 250);
    const { error } = await sb.from('attendance_logs').insert({ staff_id: staffIdToLog, duty_date: date, check_in_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device });
    if (error) return showToast(error.message);
    await insertCheckInOtQueueV109(currentStaffId(), date, proxyOptions);
    await loadAllData(); renderPage();
    showToast(proxyText ? 'ยืนยันวันอยู่เวรแทนเจ้าของเวรเดิมแล้ว และส่งเข้ารอ Admin อนุมัติ OT แล้ว' : 'ยืนยันวันอยู่เวรแล้ว และส่งเข้ารอ Admin อนุมัติ OT แล้ว');
  };
  window.checkIn = checkIn;

  saveOtRequest = async function saveOtRequestV109(form) {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const fd = new FormData(form);
    const reason = fd.get('reason');
    const note = fd.get('note') || '';
    if (reason === 'อื่นๆ' && !String(note).trim()) return showToast('กรุณาใส่เหตุผลในช่องรายละเอียด');
    const row = { staff_id: currentStaffId(), work_date: fd.get('work_date'), end_time: fd.get('end_time'), reason, note, status: 'รออนุมัติ', check_out_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
    const { error } = await sb.from('ot_requests').insert(row);
    if (error) return showToast(error.message);
    await loadAllData(); renderPage(); showToast('ส่งคำขอ OT เพิ่มแล้ว และรอ Admin อนุมัติ');
  };
  window.saveOtRequest = saveOtRequest;

  const oldHandleChangeV109 = window.handleChange || handleChange;
  handleChange = function handleChangeV109(e) {
    if (e.target?.id === 'otReasonSelect') {
      const note = document.getElementById('otNoteInput');
      if (note) note.placeholder = e.target.value === 'อื่นๆ' ? 'ใส่เหตุผล' : 'เช่น ปั่นเลือดถึง 18:20 / รอเทียบ LIS';
      return oldHandleChangeV109(e);
    }
    return oldHandleChangeV109(e);
  };
  window.handleChange = handleChange;

  const oldHandleClickV109 = window.handleClick || handleClick;
  handleClick = async function handleClickV109(e) {
    const t = e.target.closest('button, [data-schedule-mobile-view]');
    if (t?.dataset?.scheduleMobileView) { state.scheduleMobileView = t.dataset.scheduleMobileView; renderPage(); return; }
    return oldHandleClickV109(e);
  };
  window.handleClick = handleClick;

  document.addEventListener('click', function(e) {
    const t = e.target.closest('[data-schedule-mobile-view]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    state.scheduleMobileView = t.dataset.scheduleMobileView;
    renderPage();
  }, true);
})();
