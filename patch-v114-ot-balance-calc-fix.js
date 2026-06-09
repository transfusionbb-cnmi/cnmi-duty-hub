/* CNMI Staff Planner Patch V114
   - Fix duty balance calculation display and rules
   - Fix OT requested hours: 16:00 -> selected end time, not submit time
   - Admin OT approval: filter by exact date
   - Monthly OT summary visible to everyone, new column order
*/
(function patchV114(){
  window.CNMI_PATCH_V114 = true;

  function normDuty(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4' || c === 'ช4A' || c === 'ช4B') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelShort(code='') {
    const c = normDuty(code);
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 'ช9';
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function staffForV114(staffId){ return (state.staff || []).find(s => String(s.id) === String(staffId)); }
  function isKerkStaffV114(staffId){ return staffForV114(staffId)?.staff_type === 'เคิก'; }
  function staffTypeForDutyV114(staffId, dutyCode='') {
    const c = normDuty(dutyCode);
    // ช่องที่ระบุ MT/แตง ให้คิดเป็น MT เสมอ รวมถึงกรณีแตง
    if (c === 'ช9-MT/แตง' || c === 'ช4-MT/แตง') return 'MT';
    // ช่องช9-เคิก ให้คิดเป็นเคิก
    if (c === 'ช9-เคิก') return 'เคิก';
    return isKerkStaffV114(staffId) ? 'เคิก' : 'MT';
  }
  function rateForDutyV114(staffId, date, dutyCode='') {
    const type = staffTypeForDutyV114(staffId, dutyCode);
    const holiday = !!isHolidayDate(date);
    if (type === 'เคิก') return holiday ? 120 : 90;
    return holiday ? 160 : 130;
  }
  function hoursForDutyV114(date, dutyCode='') {
    const c = normDuty(dutyCode);
    if (c === 'ช4-MT/แตง') return 0;
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 8;
    if (c === 'ช3A' || c === 'ช3B') return 8;
    if (String(c).startsWith('ชบด')) return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
    return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
  }
  function unitsForDutyV114(date, dutyCode='') {
    const c = normDuty(dutyCode);
    if (c === 'ช4-MT/แตง') return 0;
    return hoursForDutyV114(date, c) / 8;
  }

  // Patch global duty metric helpers so later screens and exports use the same rules.
  dutyStaffTypeForRate = function dutyStaffTypeForRateV114(staffId, dutyCode='') { return staffTypeForDutyV114(staffId, dutyCode); };
  window.dutyStaffTypeForRate = dutyStaffTypeForRate;
  dutyRatePerHour = function dutyRatePerHourV114(staffId, date, dutyCode='') { return rateForDutyV114(staffId, date, dutyCode); };
  window.dutyRatePerHour = dutyRatePerHour;
  dutyHoursForCode = function dutyHoursForCodeV114(date, dutyCode='') { return hoursForDutyV114(date, dutyCode); };
  window.dutyHoursForCode = dutyHoursForCode;
  dutyUnitsForCode = function dutyUnitsForCodeV114(date, dutyCode='') { return unitsForDutyV114(date, dutyCode); };
  window.dutyUnitsForCode = dutyUnitsForCode;
  dutyMetrics = function dutyMetricsV114(a, staffIdOverride=null) {
    const date = a?.duty_date || a;
    const code = normDuty(a?.duty_code || '');
    const staffId = staffIdOverride || a?.staff_id || null;
    const hours = hoursForDutyV114(date, code);
    const rate = staffId ? rateForDutyV114(staffId, date, code) : 0;
    const pay = code === 'ช4-MT/แตง' ? 0 : hours * rate;
    return { hours, rate, pay, units: unitsForDutyV114(date, code), code, publicHoliday: isHolidayDate(date), weekend: isWeekend(date) };
  };
  window.dutyMetrics = dutyMetrics;
  dutyHours = function dutyHoursV114(date, dutyCode='') { return hoursForDutyV114(date, dutyCode); };
  window.dutyHours = dutyHours;
  dutyAmount = function dutyAmountV114(staffId, date, dutyCode='') { return hoursForDutyV114(date, dutyCode) * rateForDutyV114(staffId, date, dutyCode); };
  window.dutyAmount = dutyAmount;

  calcFairness = function calcFairnessV114(assignments) {
    const stats = {};
    (assignments || []).forEach(a0 => {
      if (!a0?.staff_id) return;
      const a = { ...a0, duty_code: normDuty(a0.duty_code) };
      const id = a.staff_id;
      if (!stats[id]) stats[id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{}, holiday:0 };
      const dow = parseDate(a.duty_date).getDay();
      const m = dutyMetrics(a);
      const isCh4 = a.duty_code === 'ช4-MT/แตง';
      // ช4 แสดงจำนวนครั้ง แต่ไม่บวกชั่วโมง/เงิน/หน่วยเวร
      if (!isCh4) {
        stats[id].total++;
        stats[id].hours += m.hours;
        stats[id].units += m.units;
        stats[id].pay += m.pay;
      }
      if (String(a.duty_code || '').startsWith('ชบด')) stats[id].chbd++;
      if (a.duty_code === 'ช9-เคิก' || a.duty_code === 'ช9-MT/แตง') stats[id].ch9++;
      if (a.duty_code === 'ช3A' || a.duty_code === 'ช3B') stats[id].ch3++;
      if (isCh4) stats[id].ch4++;
      const wk = weekKeyOf(a.duty_date);
      stats[id].weekCounts[wk] = (stats[id].weekCounts[wk] || 0) + 1;
      if (dow === 1) stats[id].mon++;
      if (dow === 5) stats[id].fri++;
      if (isHolidayDate(a.duty_date)) stats[id].holiday++;
      if (dow === 0 || dow === 6 || isHolidayDate(a.duty_date)) stats[id].weekend++;
      else stats[id].weekday++;
    });
    return stats;
  };
  window.calcFairness = calcFairness;

  showFairness = function showFairnessV114() {
    const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id);
    const stats = calcFairness(assignments);
    const rosterStaff = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)));
    const hours = rosterStaff.map(s => stats[s.id]?.hours || 0);
    const pays = rosterStaff.map(s => stats[s.id]?.pay || 0);
    const diff = hours.length ? Math.max(...hours) - Math.min(...hours) : 0;
    const payDiff = pays.length ? Math.max(...pays) - Math.min(...pays) : 0;
    const rows = rosterStaff.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours||0).toFixed(1)}</td><td>${(r.pay||0).toLocaleString()}</td><td>${(r.units||0).toFixed(1)}</td><td>${r.chbd||0}</td><td>${r.ch9||0}</td><td>${r.ch3||0}</td><td>${r.ch4||0}</td><td>${r.mon||0}</td><td>${r.fri||0}</td><td>${r.weekend||0}</td></tr>`;
    }).join('');
    showModal(`<h2>ตรวจสมดุลการกระจายเวร ${state.monthKey}</h2>
      <p class="hint">ชม.ตั้งต้น: ชบด เสาร์-อาทิตย์/นักขัต 24 ชม., ชบด จันทร์-ศุกร์ 16 ชม., ช9 8 ชม., ช3A/ช3B 8 ชม., ช4 แสดงจำนวนครั้งแต่ไม่บวกชั่วโมง/เงิน/หน่วยเวร</p>
      <p class="hint">เรทเคิก 90 บาท/ชม. และนักขัต 120 บาท/ชม. • เรท MT 130 บาท/ชม. และนักขัต 160 บาท/ชม. • ส่วนต่างชั่วโมง ${diff.toFixed(1)} ชม. • ส่วนต่างเงินโดยประมาณ ${payDiff.toLocaleString()} บาท</p>
      <div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.ตั้งต้น</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  };
  window.showFairness = showFairness;

  function autoHoursFromNoteV114(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  function cleanOtNoteV114(note='') {
    return String(note || '').replace(/\s*\|?\s*AUTO_HOURS\s*:\s*[0-9]+(?:\.[0-9]+)?/i, '').trim();
  }
  calcOtHours = function calcOtHoursV114(r) {
    const auto = autoHoursFromNoteV114(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.work_date || !r?.end_time) return 0;
    // คำขอ OT เพิ่ม/เวรปั่นเลือด คิดจาก 16:00 ถึงเวลาสิ้นสุดที่เลือก ไม่ใช้เวลาที่กดส่งคำขอ
    const start = new Date(`${r.work_date}T16:00:00`);
    let end = new Date(`${r.work_date}T${r.end_time}:00`);
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;

  function currentOtMonthV114() { return state.otMonthKey || state.monthKey || todayStr().slice(0,7); }
  function currentOtApprovalDateV114() { return state.otApprovalDate || todayStr(); }
  function renderMonthFilterV114(extraClass='') {
    return `<label class="month-filter-v110 ${extraClass}">เดือน <input type="month" data-ot-month-filter value="${currentOtMonthV114()}"></label>`;
  }
  function renderApprovalDateFilterV114() {
    return `<label class="month-filter-v110 ot-date-filter-v114">วันที่ <input type="date" data-ot-approval-date-filter value="${currentOtApprovalDateV114()}"></label>`;
  }
  function otApprovalRowsV114() {
    const rows = (state.otRequests || []);
    if (isAdmin()) {
      const d = currentOtApprovalDateV114();
      return rows.filter(x => String(x.work_date || '') === d);
    }
    const key = currentOtMonthV114();
    return rows.filter(x => String(x.work_date || '').startsWith(key) && String(x.staff_id) === String(currentStaffId()));
  }
  function renderOtTableV114(rows) {
    if (!rows.length) return empty(isAdmin() ? 'ยังไม่มีรายการ OT ในวันที่เลือก' : 'ยังไม่มีรายการ OT ในเดือนนี้');
    const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.created_at || r.check_out_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV114(r.note || ''))}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
    const cards = `<div class="mobile-cards ot-mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">${formatThaiDateTime(r.created_at || r.check_out_at)}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV114(r.note || ''))}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    return table + cards;
  }
  window.renderOtTable = renderOtTableV114;

  function renderOtSummaryV114() {
    const key = currentOtMonthV114();
    const approved = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key) && x.status === 'อนุมัติ');
    const map = {};
    approved.forEach(r => {
      const id = r.staff_id;
      map[id] = map[id] || { hours:0, incharge:0, count:0 };
      map[id].hours += calcOtHours(r);
      map[id].count++;
    });
    const inchargeId = currentInchargeForMonth(key);
    if (inchargeId) {
      map[inchargeId] = map[inchargeId] || { hours:0, incharge:0, count:0 };
      map[inchargeId].incharge += 8;
    }
    const rows = Object.entries(map).filter(([,r]) => (r.hours || 0) || (r.incharge || 0) || (r.count || 0));
    if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
    rows.sort((a,b) => staffNick(a[0]).localeCompare(staffNick(b[0]), 'th'));
    return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>จำนวนครั้งที่เบิก OT</th><th>ชั่วโมงจากเวร/OT</th><th>ชั่วโมงอินชาร์จ</th><th>รวมชั่วโมง OT</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${r.count || 0}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.incharge || 0).toFixed(1)}</td><td>${((r.hours || 0) + (r.incharge || 0)).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>`;
  }
  renderOtSummary = renderOtSummaryV114;
  window.renderOtSummary = renderOtSummary;

  renderOtPage = function renderOtPageV114() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = (state.rosterAssignments || []).some(x => x.duty_date === todayStr() && String(x.staff_id) === String(currentStaffId()));
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const rows = otApprovalRowsV114();
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${dutyLabelShort(x.assignment.duty_code)}`).join('<br>')}</div>` : '';
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
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${isAdmin() ? renderApprovalDateFilterV114() : renderMonthFilterV114()}</div>
        ${renderOtTableV114(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <div class="section-title"><div><h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">ทุกคนเห็นสรุปรายเดือนรวมเหมือน Admin</p></div><div class="actions">${renderMonthFilterV114('compact')}<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button></div></div>${renderOtSummaryV114()}
      </div>
    </div>`;
  };
  window.renderOtPage = renderOtPage;

  const oldSaveOtRequestV114 = window.saveOtRequest || saveOtRequest;
  saveOtRequest = async function saveOtRequestV114(form) {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const fd = new FormData(form);
    const reason = fd.get('reason');
    const note = fd.get('note') || '';
    if (reason === 'อื่นๆ' && !String(note).trim()) return showToast('กรุณาใส่เหตุผลในช่องรายละเอียด');
    const row = { staff_id: currentStaffId(), work_date: fd.get('work_date'), end_time: fd.get('end_time'), reason, note, status: 'รออนุมัติ', check_out_at: null, lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
    const { error } = await sb.from('ot_requests').insert(row);
    if (error) return showToast(error.message);
    await loadAllData(); renderPage(); showToast('ส่งคำขอ OT เพิ่มแล้ว และรอ Admin อนุมัติ');
  };
  window.saveOtRequest = saveOtRequest;

  const oldHandleChangeV114 = window.handleChange || handleChange;
  handleChange = function handleChangeV114(e) {
    if (e.target?.dataset?.otApprovalDateFilter !== undefined) {
      state.otApprovalDate = e.target.value || todayStr();
      renderPage();
      return;
    }
    if (e.target?.dataset?.otMonthFilter !== undefined) {
      state.otMonthKey = e.target.value || todayStr().slice(0,7);
      state.monthKey = state.otMonthKey;
      renderPage();
      return;
    }
    return oldHandleChangeV114(e);
  };
  window.handleChange = handleChange;

  const oldHandleClickV114 = window.handleClick || handleClick;
  handleClick = async function handleClickV114(e) {
    const t = e.target.closest('button, [data-day-detail], [data-staff-stat]');
    if (t?.hasAttribute?.('data-export-ot-excel')) {
      exportTable('otSummaryTable', `OT_${currentOtMonthV114()}.xlsx`);
      return;
    }
    return oldHandleClickV114(e);
  };
  window.handleClick = handleClick;
})();
