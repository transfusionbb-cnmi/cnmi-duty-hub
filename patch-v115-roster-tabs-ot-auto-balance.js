/* CNMI Staff Planner Patch V115
   - Fix OT requested hours when end_time is stored as HH:mm:ss
   - Make schedule views single-view only (desktop and mobile): table / day / person; mobile also OT
   - Mobile day view uses monthly calendar cards with staff colors
   - After no-duty/leave before official, try to give the requester a replacement duty elsewhere to rebalance
*/
(function patchV115(){
  window.CNMI_PATCH_V115 = true;

  const escape = (v) => escapeHtml(String(v ?? ''));
  const normDuty = (code='') => {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4' || c === 'ช4A' || c === 'ช4B') return 'ช4-MT/แตง';
    return c;
  };
  const dutyShort = (code='') => {
    const c = normDuty(code);
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 'ช9';
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  };
  const staffObj = (id) => (state.staff || []).find(s => String(s.id) === String(id));
  const activeRosterStaff = (assignments=[]) => {
    const ids = new Set((assignments || []).filter(a => a.staff_id).map(a => String(a.staff_id)));
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || ids.has(String(s.id))));
  };
  const ymParts = () => {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return { y, m, last, days:Array.from({length:last}, (_,i)=>i+1) };
  };
  const fmtDow = (date) => parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  const dutySort2 = (code) => {
    const order = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];
    const i = order.indexOf(normDuty(code));
    return i >= 0 ? i : 999;
  };
  const leaveRowsFor = (staffId, date) => (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date) && String(l.status || 'active') !== 'cancelled');
  const leaveLabel = (staffId, date) => {
    const rows = leaveRowsFor(staffId, date);
    if (!rows.length) return '';
    const p = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    return ({ 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' }[p.type] || p.type || 'ลา');
  };
  const renderTradeBtnSafe = (a) => (typeof renderTradeButton === 'function' ? renderTradeButton(a) : '');

  function normalEndTimeV115(t){
    const s = String(t || '').trim();
    if (!s) return '';
    const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?/);
    if (!m) return '';
    return `${String(m[1]).padStart(2,'0')}:${m[2]}:00`;
  }
  function autoHoursFromNoteV115(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  calcOtHours = function calcOtHoursV115(r){
    const auto = autoHoursFromNoteV115(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.work_date || !r?.end_time) return 0;
    const endTxt = normalEndTimeV115(r.end_time);
    if (!endTxt) return 0;
    const start = new Date(`${r.work_date}T16:00:00`);
    let end = new Date(`${r.work_date}T${endTxt}`);
    if (Number.isNaN(end.getTime())) return 0;
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;

  function byStaffDate(assignments){
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code:normDuty(a0.duty_code) };
      const k = `${a.staff_id}|${a.duty_date}`;
      map[k] = map[k] || [];
      map[k].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b)=>dutySort2(a.duty_code)-dutySort2(b.duty_code)));
    return map;
  }

  function renderExcelRosterV115(assignments){
    const { y, m, days } = ymParts();
    const staff = activeRosterStaff(assignments);
    const map = byStaffDate(assignments);
    return `<div class="excel-roster-section-v115">
      <h3 class="schedule-view-title-v115">ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3>
      <div class="table-wrap excel-roster-wrap-v115"><table id="scheduleTable" class="excel-roster-table-v115"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${fmtDow(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>${staff.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${escape(st.full_name || st.nickname || '')}"><b>${escape(st.nickname || st.full_name)}</b></th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rows = map[`${st.id}|${date}`] || [];
        const txt = leaveLabel(st.id, date);
        const cls = [isHolidayDate(date)?'holiday-cell':'', isWeekend(date)?'weekend-cell':'', txt?'leave-cell':'', rows.length?'has-duty-cell':''].join(' ');
        const cellText = rows.length ? rows.map(a => escape(dutyShort(a.duty_code))).join('<br>') : escape(txt || '');
        const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
        return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escape(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  function renderCalendarCardV115(assignments){
    const { y, m, last } = ymParts();
    const first = new Date(y, m - 1, 1).getDay();
    const blanks = Array.from({length:first}, () => `<div class="month-day-card-v115 muted-card-v115"></div>`).join('');
    const cards = Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutySort2(a.duty_code)-dutySort2(b.duty_code));
      const maxShow = isMobile() ? 4 : 10;
      return `<button type="button" class="month-day-card-v115 ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}" data-day-detail="${date}">
        <div class="month-day-head-v115"><b>${day}</b><span>${fmtDow(date)}</span></div>
        <div class="month-duty-list-v115">${slots.slice(0,maxShow).map(a => {
          const st = staffObj(a.staff_id) || {};
          const bg = staffColor(st);
          return `<span class="month-duty-pill-v115" style="--staff-bg:${bg};--staff-fg:${textColorFor(bg)}"><b>${escape(dutyShort(a.duty_code))}</b> ${escape(staffNick(a.staff_id))}</span>`;
        }).join('')}${slots.length > maxShow ? `<em>+${slots.length - maxShow}</em>` : ''}${!slots.length ? `<small>ไม่มีเวร</small>` : ''}</div>
      </button>`;
    }).join('');
    return `<div class="calendar-card-view-v115"><div class="calendar-dow-row-v115"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="calendar-grid-v115">${blanks}${cards}</div></div>`;
  }

  function renderPersonViewV115(assignments){
    const staff = activeRosterStaff(assignments);
    return `<div class="person-roster-list-v115">${staff.map(s => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort2(a.duty_code)-dutySort2(b.duty_code));
      return `<button type="button" class="person-roster-card-v115" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-roster-person-detail="${s.id}"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escape(s.nickname || s.full_name)}</span><b>${rows.length}</b><small>เวรเดือนนี้</small></button>`;
    }).join('')}</div>`;
  }

  function countDaysOffV115(staffId, assignments){
    const { y, m, days } = ymParts();
    let count = 0;
    days.forEach(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staffId) && a.duty_date === date);
      if (hasDuty) return;
      const leaves = leaveRowsFor(staffId, date);
      if (leaves.some(l => ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด'].includes(l.type))) return;
      const noDutyWeekend = isWeekend(date) && leaves.some(l => l.type === 'ไม่รับเวร');
      if (isWeekend(date) || isHolidayDate(date) || noDutyWeekend) count++;
    });
    return count;
  }
  function dutyCountsV115(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => {
      const d = normDuty(a.duty_code); c.total++;
      if (d === 'ชบด1') c.chbd1++; else if (d === 'ชบด2') c.chbd2++; else if (d === 'ชบด3') c.chbd3++;
      else if (d === 'ช3A') c.ch3A++; else if (d === 'ช3B') c.ch3B++;
      else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9++; else if (d === 'ช4-MT/แตง') c.ch4++;
    });
    return c;
  }
  function renderMobileOtCardsV115(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const staff = activeRosterStaff(assignments);
    const inchargeId = currentInchargeForMonth(state.monthKey);
    return `<div class="mobile-ot-summary-list-v115">${staff.map(s => {
      const r = stats[s.id] || {}; const counts = dutyCountsV115(s.id, assignments);
      const hours = Number(r.hours || 0); const incharge = String(inchargeId || '') === String(s.id) ? 8 : 0;
      const totalHours = hours + incharge; const pay = Number(r.pay || 0);
      return `<button class="ot-summary-card-v115" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-staff-stat="${s.id}" type="button">
        <div class="ot-card-head-v115"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escape(s.nickname || s.full_name)}</span></div>
        <div class="ot-card-grid-v115"><span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b><span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b><span>รวม OT:</span><b>${totalHours.toFixed(1)}</b><span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b><span>จำนวนเวร:</span><b>${counts.total}</b><span>วันที่ได้หยุด:</span><b>${countDaysOffV115(s.id, assignments)}</b></div>
        <div class="ot-duty-counts-v115"><span>ชบด1: <b>${counts.chbd1}</b></span><span>ชบด2: <b>${counts.chbd2}</b></span><span>ชบด3: <b>${counts.chbd3}</b></span><span>ช9: <b>${counts.ch9}</b></span><span>ช3A: <b>${counts.ch3A}</b></span><span>ช3B: <b>${counts.ch3B}</b></span><span>ช4: <b>${counts.ch4}</b></span></div>
      </button>`;
    }).join('')}</div>`;
  }

  function currentScheduleViewV115(){
    const raw = state.scheduleMobileView || 'table';
    if (!isMobile() && raw === 'ot') return 'table';
    return raw;
  }
  function scheduleTabV115(id, label){
    return `<button type="button" class="${currentScheduleViewV115() === id ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${id}">${label}</button>`;
  }
  function renderScheduleActiveViewV115(assignments){
    const view = currentScheduleViewV115();
    if (view === 'day') return renderCalendarCardV115(assignments);
    if (view === 'person') return renderPersonViewV115(assignments);
    if (view === 'ot' && isMobile()) return renderMobileOtCardsV115(assignments);
    return renderExcelRosterV115(assignments);
  }
  renderReadOnlySchedule = function renderReadOnlyScheduleV115(assignments){
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    return `<div class="schedule-single-view-v115 ${isMobile()?'mobile':'desktop'}">${renderScheduleActiveViewV115(assignments)}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;

  renderMonthlySchedulePage = function renderMonthlySchedulePageV115(){
    const assignments = getAssignmentsForMonth(state.monthKey);
    if (!state.scheduleMobileView) state.scheduleMobileView = 'table';
    const tabs = isMobile()
      ? `${scheduleTabV115('day','ดูตามวัน')}${scheduleTabV115('person','ดูตามคน')}${scheduleTabV115('ot','สรุป OT')}${scheduleTabV115('table','ตาราง')}`
      : `${scheduleTabV115('table','ตารางทั้งเดือน')}${scheduleTabV115('day','ดูตามวัน')}${scheduleTabV115('person','ดูตามคน')}`;
    return `<div class="card schedule-page-card schedule-page-card-v115">
      <div class="toolbar no-print">
        <label>เดือน <input type="month" id="scheduleMonthInput" value="${state.monthKey}"></label>
        <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
        <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
        <button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button>
      </div>
      <div class="schedule-tabs-v115 no-print">${tabs}</div>
      <h3 class="print-only">ตารางเวรประจำเดือน ${state.monthKey}</h3>
      ${renderReadOnlySchedule(assignments)}
      ${renderDutyTradePanel(assignments)}
    </div>`;
  };
  window.renderMonthlySchedulePage = renderMonthlySchedulePage;

  function showRosterPersonDetailV115(staffId){
    const assignments = getAssignmentsForMonth(state.monthKey).filter(a => String(a.staff_id) === String(staffId)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort2(a.duty_code)-dutySort2(b.duty_code));
    const st = staffObj(staffId) || {};
    const rows = assignments.length ? assignments.map(a => `<tr><td>${formatThaiDate(a.duty_date)}</td><td>${escape(dutyShort(a.duty_code))}</td><td>${renderTradeBtnSafe(a)}</td></tr>`).join('') : `<tr><td colspan="3">ไม่มีเวรเดือนนี้</td></tr>`;
    showModal(`<h2>${escape(st.nickname || st.full_name || 'เจ้าหน้าที่')} • เวร ${state.monthKey}</h2><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ดำเนินการ</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  const oldClickV115 = window.handleClick || handleClick;
  handleClick = async function handleClickV115(e){
    const t = e.target.closest('button, [data-day-detail], [data-staff-stat], [data-roster-person-detail]');
    if (t?.dataset?.scheduleMobileView) {
      state.scheduleMobileView = t.dataset.scheduleMobileView || 'table';
      renderPage();
      return;
    }
    if (t?.dataset?.rosterPersonDetail) {
      showRosterPersonDetailV115(t.dataset.rosterPersonDetail);
      return;
    }
    return oldClickV115(e);
  };
  window.handleClick = handleClick;

  // ---- Better replacement balance after no-duty/leave before official ----
  function canAutoMonthV115(monthKey){
    const [y,m] = String(monthKey).split('-').map(Number);
    if (!y || !m) return false;
    const deadline = new Date(y, m - 2, 20, 23, 59, 59, 999); // previous month day 20 23:59
    return new Date() <= deadline;
  }
  function datesBetweenV115(start, end){
    const out = []; let d = parseDate(start); const e = parseDate(end || start);
    while (d <= e) { out.push(toDateInput(d)); d.setDate(d.getDate()+1); }
    return out;
  }
  function metricUnitsV115(a){ return (dutyMetrics(a, a.staff_id).units || 0); }
  async function updateAssignmentStaffV115(slot, staffId){
    if (!slot?.id) return false;
    const { error } = await sb.from('roster_assignments').update({ staff_id: staffId || null, updated_by: currentStaffId() }).eq('id', slot.id);
    if (error) { console.warn('V115 update assignment failed', error.message || error); return false; }
    slot.staff_id = staffId || null;
    return true;
  }
  async function rebalanceRequesterV115(row){
    if (!row?.staff_id || !row?.start_date) return { moved:0 };
    const staffId = row.staff_id;
    const months = Array.from(new Set(datesBetweenV115(row.start_date, row.end_date || row.start_date).map(d => d.slice(0,7))));
    let moved = 0;
    for (const mk of months) {
      if (!canAutoMonthV115(mk)) continue;
      const oldKey = state.monthKey;
      state.monthKey = mk;
      const assignments = getAssignmentsForMonth(mk).filter(a => a.id && a.staff_id).map(a => ({ ...a, duty_code:normDuty(a.duty_code) }));
      if (!assignments.length) { state.monthKey = oldKey; continue; }
      let stats = calcFairness(assignments);
      let mine = stats[staffId]?.units || 0;
      const rosterIds = activeRosterStaff(assignments).map(s => s.id);
      const unitVals = rosterIds.map(id => stats[id]?.units || 0);
      const avg = unitVals.length ? unitVals.reduce((a,b)=>a+b,0) / unitVals.length : mine;
      const targetDates = new Set(datesBetweenV115(row.start_date, row.end_date || row.start_date).filter(d => d.slice(0,7) === mk));
      let guard = 0;
      while (mine + 0.01 < Math.floor(avg) && guard++ < 6) {
        const candidates = assignments
          .filter(a => !a.is_locked && a.staff_id && String(a.staff_id) !== String(staffId) && !targetDates.has(a.duty_date))
          .map(a => ({ a, donorUnits: stats[a.staff_id]?.units || 0, u: metricUnitsV115(a) }))
          .filter(x => x.donorUnits > mine + 0.01)
          .sort((x,y) => (y.donorUnits - x.donorUnits) || (y.u - x.u));
        let changed = false;
        for (const item of candidates) {
          const testSlot = { ...item.a, staff_id:null };
          if (typeof canStaffWorkSlot === 'function' && !canStaffWorkSlot(staffId, testSlot, assignments.map(x => x.id === item.a.id ? testSlot : x))) continue;
          const ok = await updateAssignmentStaffV115(item.a, staffId);
          if (!ok) continue;
          moved++; changed = true;
          stats = calcFairness(assignments);
          mine = stats[staffId]?.units || 0;
          break;
        }
        if (!changed) break;
      }
      state.monthKey = oldKey;
    }
    if (moved) await loadAllData();
    return { moved };
  }

  const oldSaveLeaveV115 = window.saveLeave || saveLeave;
  saveLeave = async function saveLeaveV115(form){
    const fd = new FormData(form);
    const rowPreview = {
      staff_id: isAdmin() ? (fd.get('staff_id') || currentStaffId()) : currentStaffId(),
      type: fd.get('type'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date') || fd.get('start_date')
    };
    await oldSaveLeaveV115(form);
    if (rowPreview.type === 'ไม่รับเวร' || rowPreview.type) {
      try {
        const res = await rebalanceRequesterV115(rowPreview);
        if (res.moved) { renderPage(); showToast(`ระบบเกลี่ยเวรกลับให้ ${staffNick(rowPreview.staff_id)} เพิ่ม ${res.moved} เวรแล้ว`); }
      } catch (err) { console.warn('V115 rebalance after leave failed', err); }
    }
  };
  window.saveLeave = saveLeave;
})();
