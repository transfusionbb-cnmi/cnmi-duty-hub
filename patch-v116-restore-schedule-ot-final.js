/* CNMI Staff Planner Patch V116
   Restore monthly roster page after V115: desktop = 3 tabs only, mobile = 4 tabs only.
   Fix OT hours from HH:mm:ss safely.
   Keep calendar card with staff colors and person popup.
*/
(function patchV116(){
  window.CNMI_PATCH_V116 = true;

  const esc = (v) => escapeHtml(String(v ?? ''));
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
  const dutySort = (code='') => {
    const order = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];
    const i = order.indexOf(normDuty(code));
    return i >= 0 ? i : 999;
  };
  const getYM = () => {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return { y, m, last, days:Array.from({ length:last }, (_,i)=>i+1) };
  };
  const staffObj = (id) => (state.staff || []).find(s => String(s.id) === String(id));
  const staffListForRoster = (assignments=[]) => {
    const ids = new Set((assignments || []).filter(a => a.staff_id).map(a => String(a.staff_id)));
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || ids.has(String(s.id))));
  };
  const fmtDow = (date) => parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  const leaveRowsFor = (staffId, date) => (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date) && String(l.status || 'active') !== 'cancelled');
  const leaveLabel = (staffId, date) => {
    const rows = leaveRowsFor(staffId, date);
    if (!rows.length) return '';
    const p = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    return ({ 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' }[p.type] || p.type || 'ลา');
  };
  const renderTradeBtnSafe = (a) => (typeof renderTradeButton === 'function' ? renderTradeButton(a) : '');

  // Robust OT hours: parse date/time manually. Fix NaN and HH:mm:ss rows.
  function parseLocalDateTime(dateText, timeText){
    const dm = String(dateText || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
    const tm = String(timeText || '').match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!dm || !tm) return null;
    return new Date(Number(dm[1]), Number(dm[2]) - 1, Number(dm[3]), Number(tm[1]), Number(tm[2]), Number(tm[3] || 0), 0);
  }
  function autoHoursFromNote(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  calcOtHours = function calcOtHoursV116(r){
    const auto = autoHoursFromNote(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.work_date || !r?.end_time) return 0;
    const start = parseLocalDateTime(r.work_date, '16:00:00');
    let end = parseLocalDateTime(r.work_date, r.end_time);
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end.getTime() - start.getTime()) / 36e5);
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
    Object.values(map).forEach(arr => arr.sort((a,b)=>dutySort(a.duty_code)-dutySort(b.duty_code)));
    return map;
  }

  function renderExcelRoster(assignments){
    const { y, m, days } = getYM();
    const staff = staffListForRoster(assignments);
    const map = byStaffDate(assignments);
    return `<section class="excel-roster-section-v116">
      <h3 class="schedule-view-title-v116">ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3>
      <div class="table-wrap excel-roster-wrap-v116"><table id="scheduleTable" class="excel-roster-table-v116"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${fmtDow(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>${staff.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${esc(st.full_name || st.nickname || '')}"><b>${esc(st.nickname || st.full_name)}</b></th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rows = map[`${st.id}|${date}`] || [];
        const txt = leaveLabel(st.id, date);
        const cls = [isHolidayDate(date)?'holiday-cell':'', isWeekend(date)?'weekend-cell':'', txt?'leave-cell':'', rows.length?'has-duty-cell':''].join(' ');
        const cellText = rows.length ? rows.map(a => esc(dutyShort(a.duty_code))).join('<br>') : esc(txt || '');
        const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
        return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${esc(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
    </section>`;
  }

  function renderCalendarView(assignments){
    const { y, m, last } = getYM();
    const first = new Date(y, m - 1, 1).getDay();
    const blanks = Array.from({ length:first }, () => `<div class="month-day-card-v116 muted-card-v116"></div>`).join('');
    const cards = Array.from({ length:last }, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutySort(a.duty_code)-dutySort(b.duty_code));
      const maxShow = isMobile() ? 4 : 12;
      return `<button type="button" class="month-day-card-v116 ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}" data-day-detail="${date}">
        <div class="month-day-head-v116"><b>${day}</b><span>${fmtDow(date)}</span></div>
        <div class="month-duty-list-v116">${slots.slice(0,maxShow).map(a => {
          const st = staffObj(a.staff_id) || {};
          const bg = staffColor(st);
          return `<span class="month-duty-pill-v116" style="--staff-bg:${bg};--staff-fg:${textColorFor(bg)}"><b>${esc(dutyShort(a.duty_code))}</b> ${esc(staffNick(a.staff_id))}</span>`;
        }).join('')}${slots.length > maxShow ? `<em>+${slots.length - maxShow}</em>` : ''}${!slots.length ? `<small>ไม่มีเวร</small>` : ''}</div>
      </button>`;
    }).join('');
    return `<section class="calendar-card-view-v116"><p class="hint desktop-only-v116">ตารางทั้งเดือนแบบแถบสี กดที่ช่องวันที่เพื่อดูรายละเอียดเวร</p><div class="calendar-dow-row-v116"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="calendar-grid-v116">${blanks}${cards}</div></section>`;
  }

  function renderPersonView(assignments){
    const staff = staffListForRoster(assignments);
    return `<section class="person-roster-list-v116">${staff.map(s => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code));
      return `<button type="button" class="person-roster-card-v116" data-roster-person-detail-v116="${s.id}"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${esc(s.nickname || s.full_name)}</span><b>${rows.length}</b><small>เวรเดือนนี้</small></button>`;
    }).join('')}</section>`;
  }

  function countDaysOff(staffId, assignments){
    const { y, m, days } = getYM();
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
  function dutyCounts(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => {
      const d = normDuty(a.duty_code); c.total++;
      if (d === 'ชบด1') c.chbd1++; else if (d === 'ชบด2') c.chbd2++; else if (d === 'ชบด3') c.chbd3++;
      else if (d === 'ช3A') c.ch3A++; else if (d === 'ช3B') c.ch3B++;
      else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9++; else if (d === 'ช4-MT/แตง') c.ch4++;
    });
    return c;
  }
  function renderMobileOtCards(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const staff = staffListForRoster(assignments);
    const inchargeId = currentInchargeForMonth(state.monthKey);
    return `<section class="mobile-ot-summary-list-v116">${staff.map(s => {
      const r = stats[s.id] || {}; const counts = dutyCounts(s.id, assignments);
      const hours = Number(r.hours || 0); const incharge = String(inchargeId || '') === String(s.id) ? 8 : 0;
      const totalHours = hours + incharge; const pay = Number(r.pay || 0);
      return `<button class="ot-summary-card-v116" data-staff-stat="${s.id}" type="button">
        <div class="ot-card-head-v116"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${esc(s.nickname || s.full_name)}</span></div>
        <div class="ot-card-grid-v116"><span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b><span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b><span>รวม OT:</span><b>${totalHours.toFixed(1)}</b><span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b><span>จำนวนเวร:</span><b>${counts.total}</b><span>วันที่ได้หยุด:</span><b>${countDaysOff(s.id, assignments)}</b></div>
        <div class="ot-duty-counts-v116"><span>ชบด1: <b>${counts.chbd1}</b></span><span>ชบด2: <b>${counts.chbd2}</b></span><span>ชบด3: <b>${counts.chbd3}</b></span><span>ช9: <b>${counts.ch9}</b></span><span>ช3A: <b>${counts.ch3A}</b></span><span>ช3B: <b>${counts.ch3B}</b></span><span>ช4: <b>${counts.ch4}</b></span></div>
      </button>`;
    }).join('')}</section>`;
  }

  function currentRosterView(){
    let v = state.rosterMonthlyView || state.scheduleMobileView || 'table';
    if (!isMobile() && v === 'ot') v = 'table';
    if (!['table','day','person','ot'].includes(v)) v = 'table';
    return v;
  }
  function tab(id, label){
    return `<button type="button" class="${currentRosterView() === id ? 'primary-btn' : 'ghost-btn'}" data-roster-view-v116="${id}">${label}</button>`;
  }
  function activeView(assignments){
    const v = currentRosterView();
    if (v === 'day') return renderCalendarView(assignments);
    if (v === 'person') return renderPersonView(assignments);
    if (v === 'ot' && isMobile()) return renderMobileOtCards(assignments);
    return renderExcelRoster(assignments);
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV116(assignments){
    if (!assignments?.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    return `<div class="schedule-single-view-v116 ${isMobile() ? 'mobile' : 'desktop'}">${activeView(assignments)}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;

  renderMonthlySchedulePage = function renderMonthlySchedulePageV116(){
    const assignments = getAssignmentsForMonth(state.monthKey);
    if (!state.rosterMonthlyView) state.rosterMonthlyView = isMobile() ? 'table' : 'table';
    const tabs = isMobile()
      ? `${tab('day','ดูตามวัน')}${tab('person','ดูตามคน')}${tab('ot','สรุป OT')}${tab('table','ตาราง')}`
      : `${tab('table','ตารางทั้งเดือน')}${tab('day','ดูตามวัน')}${tab('person','ดูตามคน')}`;
    return `<div class="card schedule-page-card schedule-page-card-v116">
      <div class="toolbar no-print">
        <label>เดือน <input type="month" id="scheduleMonthInput" value="${state.monthKey}"></label>
        <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
        <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
        <button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button>
      </div>
      <div class="schedule-tabs-v116 no-print">${tabs}</div>
      <h3 class="print-only">ตารางเวรประจำเดือน ${state.monthKey}</h3>
      ${renderReadOnlySchedule(assignments)}
      ${renderDutyTradePanel(assignments)}
    </div>`;
  };
  window.renderMonthlySchedulePage = renderMonthlySchedulePage;

  function showPersonDetail(staffId){
    const assignments = getAssignmentsForMonth(state.monthKey).filter(a => String(a.staff_id) === String(staffId)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code));
    const st = staffObj(staffId) || {};
    const rows = assignments.length ? assignments.map(a => `<tr><td>${formatThaiDate(a.duty_date)}</td><td>${esc(dutyShort(a.duty_code))}</td><td>${renderTradeBtnSafe(a)}</td></tr>`).join('') : `<tr><td colspan="3">ไม่มีเวรเดือนนี้</td></tr>`;
    showModal(`<h2>${esc(st.nickname || st.full_name || 'เจ้าหน้าที่')} • เวร ${state.monthKey}</h2><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ดำเนินการ</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }

  const oldClick = window.handleClick || handleClick;
  handleClick = async function handleClickV116(e){
    const t = e.target.closest('button, [data-roster-view-v116], [data-roster-person-detail-v116]');
    if (t?.dataset?.rosterViewV116) {
      state.rosterMonthlyView = t.dataset.rosterViewV116 || 'table';
      state.scheduleMobileView = state.rosterMonthlyView;
      renderPage();
      return;
    }
    if (t?.dataset?.rosterPersonDetailV116) {
      showPersonDetail(t.dataset.rosterPersonDetailV116);
      return;
    }
    return oldClick(e);
  };
  window.handleClick = handleClick;
})();
