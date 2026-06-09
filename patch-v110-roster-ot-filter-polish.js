/* CNMI Staff Planner Patch V110
   - Compact Excel roster cells + display all ช9 variants as ช9
   - Remove duplicate lower roster sub-tabs; use the main middle tabs only
   - Add month filters to OT approval and monthly OT summary
*/
(function patchV110(){
  window.CNMI_PATCH_V110 = true;

  const V110_DUTY_CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function normDutyV110(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4A' || c === 'ช4B' || c === 'ช4') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelV110(code='') {
    const c = normDutyV110(code);
    if (c === 'ช4-MT/แตง') return 'ช4';
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง' || c === 'ช9-MT') return 'ช9';
    return c;
  }
  function leaveTextV110(staffId, date) {
    const rows = (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function allowedCodesForDateV110(date, assignments=[]) {
    let codes = [];
    try { codes = allowedDutyCodesForDate(date) || []; } catch (_) { codes = []; }
    const present = (assignments || []).filter(a => a.duty_date === date).map(a => normDutyV110(a.duty_code));
    const merged = [...new Set([...codes.map(normDutyV110), ...present])];
    return V110_DUTY_CODES.filter(c => merged.includes(c));
  }
  function dutySortV110(code) {
    const i = V110_DUTY_CODES.indexOf(normDutyV110(code));
    return i < 0 ? 999 : i;
  }
  function formatDateCellV110(date) {
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }
  function staffActiveForRosterV110(assignments) {
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function rowsByStaffDateV110(assignments) {
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code: normDutyV110(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySortV110(a.duty_code) - dutySortV110(b.duty_code)));
    return map;
  }
  function renderExcelRosterMatrixV110(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const active = staffActiveForRosterV110(assignments);
    const byStaffDate = rowsByStaffDateV110(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109 excel-roster-section-v110">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109 excel-roster-wrap-v110"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109 excel-roster-table-v110"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDateCellV110(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextV110(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabelV110(a.duty_code))).join('<br>') : escapeHtml(leaveText || '');
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }
  function renderOldByDayV110(assignments, codes, y, m, last) {
    return `<div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV110(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length:last }, (_, i) => i + 1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${formatDateCellV110(date)}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedCodesForDateV110(date, assignments).includes(normDutyV110(code))) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normDutyV110(a.duty_code) === normDutyV110(code));
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
  }
  function renderOldByPersonV110(assignments) {
    const active = staffActiveForRosterV110(assignments);
    return `<div class="table-wrap"><table class="schedule-by-person-v107"><thead><tr><th>เจ้าหน้าที่</th><th>รายการเวรในเดือนนี้</th><th>รวม</th></tr></thead><tbody>${active.map(st => {
      const rows = assignments.filter(a => String(a.staff_id) === String(st.id)).sort((a,b) => String(a.duty_date).localeCompare(String(b.duty_date)) || dutySortV110(a.duty_code) - dutySortV110(b.duty_code));
      return `<tr><td>${staffPill(st)}</td><td>${rows.length ? rows.map(a => `<span class="mini-duty-chip-v107">${formatThaiDate(a.duty_date)} ${escapeHtml(dutyLabelV110(a.duty_code))}${renderTradeButton(a)}</span>`).join(' ') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</td><td>${rows.length}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldOtV110(assignments) {
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = staffActiveForRosterV110(assignments);
    return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${active.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.pay || 0).toLocaleString()}</td><td>${(r.units || 0).toFixed(1)}</td><td>${r.chbd || 0}</td><td>${r.ch9 || 0}</td><td>${r.ch3 || 0}</td><td>${r.ch4 || 0}</td><td>${r.weekend || 0}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldMatrixV110(assignments, y, m, last) {
    const active = staffActiveForRosterV110(assignments);
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const byStaffDate = rowsByStaffDateV110(assignments);
    return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${formatDateCellV110(`${y}-${pad(m)}-${pad(day)}`)}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rows = byStaffDate[`${s.id}|${date}`] || [];
      const leaveText = leaveTextV110(s.id, date);
      const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
      return `<td class="${cls}">${rows.length ? `<b>${rows.map(a => escapeHtml(dutyLabelV110(a.duty_code))).join('<br>')}</b>` : (leaveText ? `<span class="no-duty-one-line-v107">${escapeHtml(leaveText)}</span>` : '')}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderReadOnlyScheduleV110(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = [...new Set((assignments || []).map(a => normDutyV110(a.duty_code)).filter(Boolean))].sort((a,b) => dutySortV110(a)-dutySortV110(b));
    const useCodes = codes.length ? codes : V110_DUTY_CODES;
    const view = state.scheduleMobileView || 'day';
    const detail = view === 'person'
      ? renderOldByPersonV110(assignments)
      : view === 'ot'
        ? renderOldOtV110(assignments)
        : view === 'table'
          ? renderOldMatrixV110(assignments, y, m, last)
          : renderOldByDayV110(assignments, useCodes, y, m, last);
    const oldPanel = `<details class="old-duty-table-v107 old-duty-table-v109 old-duty-table-v110" open><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary>${detail}</details>`;
    return renderExcelRosterMatrixV110(assignments) + oldPanel;
  }
  renderReadOnlySchedule = renderReadOnlyScheduleV110;
  window.renderReadOnlySchedule = renderReadOnlySchedule;
  renderSchedulePersonMatrix = function renderSchedulePersonMatrixV110(assignments) { return renderExcelRosterMatrixV110(assignments); };
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix;

  // ---- OT month filter ----
  function currentOtMonthV110() {
    return state.otMonthKey || state.monthKey || todayStr().slice(0,7);
  }
  function otMonthRowsV110() {
    const key = currentOtMonthV110();
    const rows = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key));
    return isAdmin() ? rows : rows.filter(x => String(x.staff_id) === String(currentStaffId()));
  }
  function autoHoursFromNoteV110(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  function cleanOtNoteV110(note='') {
    return String(note || '').replace(/\s*\|?\s*AUTO_HOURS\s*:\s*[0-9]+(?:\.[0-9]+)?/i, '').trim();
  }
  calcOtHours = function calcOtHoursV110(r) {
    const auto = autoHoursFromNoteV110(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.end_time) return 0;
    const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
    let end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;
  function renderMonthFilterV110(extraClass='') {
    return `<label class="month-filter-v110 ${extraClass}">เดือน <input type="month" data-ot-month-filter value="${currentOtMonthV110()}"></label>`;
  }
  function renderOtTableV110(rows) {
    if (!rows.length) return empty('ยังไม่มีรายการ OT ในเดือนนี้');
    const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV110(r.note || ''))}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
    const cards = `<div class="mobile-cards ot-mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV110(r.note || ''))}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    return table + cards;
  }
  renderOtTable = renderOtTableV110;
  window.renderOtTable = renderOtTable;
  function renderOtSummaryV110() {
    const key = currentOtMonthV110();
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
  renderOtSummary = renderOtSummaryV110;
  window.renderOtSummary = renderOtSummary;
  renderOtPage = function renderOtPageV110() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = (state.rosterAssignments || []).some(x => x.duty_date === todayStr() && String(x.staff_id) === String(currentStaffId()));
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const rows = otMonthRowsV110();
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${dutyLabelV110(x.assignment.duty_code)}`).join('<br>')}</div>` : '';
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
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${renderMonthFilterV110()}</div>
        ${renderOtTableV110(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <div class="section-title"><div><h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว และบวกอินชาร์จประจำเดือน 8 ชม.</p></div><div class="actions">${renderMonthFilterV110('compact')}${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div></div>${renderOtSummaryV110()}
      </div>
    </div>`;
  };
  window.renderOtPage = renderOtPage;

  const oldHandleChangeV110 = window.handleChange || handleChange;
  handleChange = function handleChangeV110(e) {
    if (e.target?.dataset?.otMonthFilter !== undefined) {
      state.otMonthKey = e.target.value || todayStr().slice(0,7);
      state.monthKey = state.otMonthKey;
      renderPage();
      return;
    }
    return oldHandleChangeV110(e);
  };
  window.handleChange = handleChange;
})();
