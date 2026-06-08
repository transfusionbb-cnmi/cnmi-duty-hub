/* CNMI Duty Hub V84: final schedule mobile UX + monthly position calendar + refresh/session restore
   Scope only:
   1) ตารางเวรประจำเดือน: ปุ่ม แลก/ขาย/ยก ขึ้นทุกเวรที่มีคนอยู่ แบบ Admin
   2) มือถือ: ดูตามวัน = เฉพาะวันที่เลือก, ดูตามคน = staff เห็นเฉพาะตัวเอง ยกเว้น Admin,
      สรุป OT = ทุกคน, ตาราง = calendar grid compact ไม่มีปุ่ม แลก/ขาย/ยก
   3) แจ้งลา/ไม่รับเวร: staff ซ่อนตัวกรองชื่อในรายการของฉัน, Admin เห็นเหมือนเดิม
   4) Refresh/session: พยายามรักษา session และกลับหน้าเดิมหลัง refresh
   No SQL / no schema / no drag-drop / no duty rule changes
*/
(function(){
  const PATCH = 'v84-final-mobile-schedule-position-session';
  const STORE_KEY = 'cnmiDutyHub.v84.uiState';
  const LOGOUT_KEY = 'cnmiDutyHub.v84.explicitLogoutAt';

  function safe(fn, fallback){ try { return fn(); } catch (_) { return fallback; } }
  function getState(){ return (typeof state !== 'undefined') ? state : null; }
  function getSb(){ return (typeof sb !== 'undefined') ? sb : null; }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))); }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function today(){ return safe(() => todayStr(), new Date().toISOString().slice(0,10)); }
  function thaiDate(d){ return safe(() => formatThaiDate(d), String(d || '-')); }
  function parseD(d){ return safe(() => parseDate(d), new Date(String(d || '').slice(0,10))); }
  function monthRange(key){
    const st = getState();
    return safe(() => getMonthRange(key || st?.monthKey), (() => {
      const [y,m] = String(key || today().slice(0,7)).split('-').map(Number);
      return { y, m };
    })());
  }
  function firstOfMonth(key){ const r = monthRange(key); return `${r.y}-${pad2(r.m)}-01`; }
  function lastOfMonth(key){ const r = monthRange(key); return `${r.y}-${pad2(r.m)}-${pad2(new Date(r.y, r.m, 0).getDate())}`; }
  function inMonth(date, key){ return String(date || '').slice(0,7) === String(key || '').slice(0,7); }
  function currentStaff(){ return safe(() => currentStaffId(), getState()?.profile?.id || null); }
  function admin(){ return !!safe(() => isAdmin(), false); }
  function mobile(){ return !!safe(() => isMobileView(), window.matchMedia && window.matchMedia('(max-width: 820px)').matches); }
  function staffName(id){ return safe(() => staffNick(id), '-'); }
  function staffPillX(id, opts){ return safe(() => staffPill(id, opts || {}), `<span>${esc(staffName(id))}</span>`); }
  function badgeX(text, cls){ return safe(() => badge(text, cls), `<span class="badge ${esc(cls || 'black')}">${esc(text)}</span>`); }
  function dutyLabel(code){ return safe(() => DUTY_LABEL[code] || code || '-', code || '-'); }
  function dutyCols(){ return safe(() => DUTY_COLUMNS, ['ชบด1','ชบด2','ชบด3','ช4','ช3A','ช3B','ช9']).slice(); }
  function allowed(date, code){ return safe(() => allowedDutyCodesForDate(date).includes(code), true); }
  function eventTextX(type){ return safe(() => eventText(type), type || '-'); }
  function eventColorClass(e){ return `event-${esc(e?.type || 'activity')}`; }

  function injectStyle(){
    if (document.getElementById('cnmi-v84-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v84-style';
    style.textContent = `
      @media (max-width: 820px) {
        .schedule-page-card .toolbar.no-print {
          position: sticky;
          top: 0;
          z-index: 9;
          background: rgba(247, 251, 255, .96);
          backdrop-filter: blur(8px);
          padding: 10px;
          border-radius: 18px;
          border: 1px solid rgba(210, 225, 238, .95);
        }
        .mobile-schedule-tabs {
          display: flex !important;
          gap: 8px;
          overflow-x: auto;
          padding: 4px 0 10px;
          -webkit-overflow-scrolling: touch;
        }
        .mobile-schedule-tabs button { white-space: nowrap; min-width: max-content; padding: 10px 13px; }
        .v84-day-picker {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 8px;
          align-items: end;
          margin: 6px 0 12px;
          padding: 10px;
          border: 1px solid var(--line, #dbe7f0);
          border-radius: 18px;
          background: #fff;
        }
        .v84-day-picker label { margin: 0; }
        .v84-day-picker input { width: 100%; }
        .v84-one-day-card {
          border: 1px solid var(--line, #dbe7f0);
          border-radius: 22px;
          padding: 14px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(31,50,72,.06);
        }
        .v84-one-day-card .mobile-day-head { margin-bottom: 10px; }
        .v84-one-day-card .mobile-day-head b { font-size: 22px; }
        .v84-duty-line {
          display: grid;
          grid-template-columns: 70px 1fr;
          gap: 8px;
          align-items: center;
          padding: 9px 0;
          border-top: 1px dashed rgba(166, 187, 206, .8);
        }
        .v84-duty-line:first-of-type { border-top: 0; }
        .v84-duty-line .trade-btn { grid-column: 1 / -1; width: 100%; margin-top: 4px; }
        .mobile-schedule-person-list { gap: 10px !important; }
        .schedule-person-card { padding: 12px !important; border-radius: 20px !important; }
        .person-duty-line { flex-wrap: wrap; align-items: flex-start !important; }
        .person-duty-line .trade-btn { width: 100%; margin-top: 4px; }
        .v84-schedule-calendar-grid, .v84-central-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          width: 100%;
        }
        .v84-cal-dayname {
          text-align: center;
          font-size: 10px;
          font-weight: 900;
          color: #60758c;
          padding: 3px 0;
        }
        .v84-schedule-day, .v84-central-day {
          min-height: 70px;
          border: 1px solid #dce8f2;
          border-radius: 10px;
          padding: 4px;
          background: #fff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .v84-schedule-day.other-month, .v84-central-day.other-month { opacity: .45; background: #f7f9fc; }
        .v84-schedule-day.weekend, .v84-central-day.weekend { background: #fffaf0; }
        .v84-schedule-day.today, .v84-central-day.today { outline: 2px solid #80caff; }
        .v84-day-num {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2px;
          font-size: 11px;
          font-weight: 900;
          color: #203245;
          line-height: 1.1;
        }
        .v84-duty-chip, .v84-event-chip {
          display: block;
          width: 100%;
          border: 0;
          border-radius: 6px;
          padding: 2px 3px;
          font-size: 9.5px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          color: #203245;
          background: #edf7ff;
        }
        .v84-duty-chip { background: #e9f5ff; }
        .v84-more { font-size: 9px; color: #60758c; line-height: 1.1; }
        .v84-calendar-note { font-size: 11px; color: #60758c; margin: 6px 0 8px; }
        .v84-staff-filter-hidden { display: none !important; }

        .v84-month-position-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 4px;
          width: 100%;
        }
        .v84-position-day {
          min-height: 74px;
          border: 1px solid #dce8f2;
          border-radius: 10px;
          padding: 4px;
          background: #fff;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .v84-position-day.other-month { opacity: .42; background: #f7f9fc; }
        .v84-position-day.no-position { background: #eef3f8; }
        .v84-position-day.has-leave { background: #fff8df; }
        .v84-position-day.has-outing { background: #fff0f2; }
        .v84-position-chip {
          display: block;
          width: 100%;
          border-radius: 6px;
          padding: 2px 3px;
          font-size: 8.8px;
          line-height: 1.1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          color: #203245;
          background: #edf7ff;
        }
        .v84-position-chip.leave { background: #fff1b8; color:#785700; }
        .v84-position-chip.outing { background: #ffd9df; color:#8c2332; }
        .v84-position-chip.no-position { background: #dfe6ee; color:#506172; }
        .v84-position-day-detail { display: grid; gap: 8px; }
        .v84-position-day-row {
          display: grid;
          grid-template-columns: 1fr auto;
          gap: 8px;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid var(--line, #dbe7f0);
        }
        .v84-position-day-row:last-child { border-bottom: 0; }
        html, body { min-height: 100%; }
        body { min-height: var(--v84-vh, 100dvh); }
        #appView.app-view { min-height: var(--v84-vh, 100dvh); }
        .main-panel { min-height: var(--v84-vh, 100dvh); }
        .page-content { padding-bottom: max(96px, calc(env(safe-area-inset-bottom) + 72px)); }
        .topbar { top: 0; }
        #sidebar.sidebar { max-height: var(--v84-vh, 100dvh); }
        #sidebar .main-nav { -webkit-overflow-scrolling: touch; }
        #sidebar .sidebar-foot { padding-bottom: max(18px, env(safe-area-inset-bottom)); }
        .modal-card { max-height: calc(var(--v84-vh, 100dvh) - 32px); overflow: auto; }

      }
      @media (max-width: 430px) {
        .v84-schedule-day, .v84-central-day { min-height: 58px; border-radius: 8px; padding: 3px; }
        .v84-duty-chip, .v84-event-chip { font-size: 8.5px; padding: 2px; }
        .v84-day-num { font-size: 10px; }
      }
    `;
    document.head.appendChild(style);
  }

  // 1) ปุ่ม แลก/ขาย/ยก ขึ้นทุกเวรที่มีเจ้าของเวร แบบ Admin
  function patchTradeButtons(){
    try {
      window.canRequestTrade = canRequestTrade = function canRequestTradeV84(slot){
        return !!(slot && slot.id && slot.staff_id);
      };
      window.renderTradeButton = renderTradeButton = function renderTradeButtonV84(slot){
        if (!slot || !slot.id || !slot.staff_id) return '';
        return `<button class="tiny-btn trade-btn" data-trade-duty="${esc(slot.id)}">แลก/ขาย/ยก</button>`;
      };
    } catch (err) { console.warn(PATCH, 'trade patch skipped', err); }
  }

  function ensureScheduleDate(){
    const st = getState();
    if (!st) return today();
    const key = st.monthKey || today().slice(0,7);
    if (!st.scheduleSelectedDate || !inMonth(st.scheduleSelectedDate, key)) {
      st.scheduleSelectedDate = inMonth(today(), key) ? today() : firstOfMonth(key);
    }
    return st.scheduleSelectedDate;
  }

  function scheduleTab(id, label){
    const st = getState();
    const active = (st?.scheduleMobileView || 'day') === id;
    return `<button class="${active ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${esc(id)}">${esc(label)}</button>`;
  }

  function renderScheduleBySelectedDay(assignments){
    const st = getState();
    const date = ensureScheduleDate();
    const day = parseD(date);
    const slots = dutyCols()
      .map(code => ({ code, slot: (assignments || []).find(a => a.duty_date === date && a.duty_code === code) }))
      .filter(x => allowed(date, x.code));
    const visibleSlots = slots.filter(x => x.slot?.staff_id);
    return `<div class="v84-schedule-day-view">
      <div class="v84-day-picker no-print">
        <button class="ghost-btn" data-sched-day-nav="prev">‹</button>
        <label>เลือกวันที่ <input type="date" id="scheduleDayInput" value="${esc(date)}" min="${esc(firstOfMonth(st?.monthKey))}" max="${esc(lastOfMonth(st?.monthKey))}"></label>
        <button class="ghost-btn" data-sched-day-nav="next">›</button>
      </div>
      <div class="v84-one-day-card ${safe(() => isHolidayDate(date) || isWeekend(date), false) ? 'weekend-row' : ''}">
        <div class="mobile-day-head">
          <b>${day.getDate()}</b>
          <span>${esc(safe(() => day.toLocaleDateString('th-TH', { weekday:'long' }), ''))}</span>
          ${safe(() => isHolidayDate(date), false) ? badgeX(safe(() => holidayName(date), 'วันหยุด'), 'yellow') : ''}
        </div>
        ${visibleSlots.length ? visibleSlots.map(({code, slot}) => `<div class="v84-duty-line"><b>${esc(dutyLabel(code))}</b><span>${staffPillX(slot.staff_id, { button:true, attrs:`data-staff-stat="${esc(slot.staff_id)}" type="button"` })}</span>${safe(() => renderTradeButton(slot), '')}</div>`).join('') : '<span class="muted">วันนี้ไม่มีเวร</span>'}
      </div>
    </div>`;
  }

  function renderScheduleByPersonV84(assignments){
    const st = getState();
    let active = safe(() => orderedStaff(state.staff.filter(s => isRosterEnabled(s))), []);
    if (!admin()) active = active.filter(s => String(s.id) === String(currentStaff()));
    if (!active.length) return safe(() => empty('ไม่พบรายชื่อเจ้าหน้าที่'), '<div class="empty">ไม่พบรายชื่อเจ้าหน้าที่</div>');
    return `<div class="mobile-schedule-person-list">${active.map(s => {
      const rows = (assignments || []).filter(a => a.staff_id === s.id).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || String(a.duty_code).localeCompare(String(b.duty_code)));
      return `<div class="schedule-person-card" style="--staff-bg:${safe(() => staffColor(s), '#e9f5ff')};--staff-fg:${safe(() => textColorFor(staffColor(s)), '#203245')}"><div class="person-card-head"><b>${esc(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${thaiDate(a.duty_date)}</span><b>${esc(dutyLabel(a.duty_code))}</b>${safe(() => renderTradeButton(a), '')}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
    }).join('')}</div>`;
  }

  function renderScheduleCalendarGridV84(assignments){
    const st = getState();
    const key = st?.monthKey || today().slice(0,7);
    const { y, m } = monthRange(key);
    const first = new Date(y, m - 1, 1);
    first.setDate(1 - first.getDay());
    const cells = [];
    for (let i=0; i<42; i++) {
      const cur = new Date(first);
      cur.setDate(first.getDate() + i);
      const ds = `${cur.getFullYear()}-${pad2(cur.getMonth()+1)}-${pad2(cur.getDate())}`;
      const dayAssignments = (assignments || [])
        .filter(a => a.duty_date === ds && a.staff_id)
        .sort((a,b) => dutyCols().indexOf(a.duty_code) - dutyCols().indexOf(b.duty_code));
      const shown = dayAssignments.slice(0, 3);
      cells.push(`<button class="v84-schedule-day ${cur.getMonth() !== (m-1) ? 'other-month' : ''} ${ds === today() ? 'today' : ''} ${safe(() => isHolidayDate(ds) || isWeekend(ds), false) ? 'weekend' : ''}" type="button" data-day-detail="${esc(ds)}">
        <span class="v84-day-num"><span>${cur.getDate()}</span>${safe(() => isHolidayDate(ds), false) ? '<span>●</span>' : ''}</span>
        ${shown.map(a => `<span class="v84-duty-chip">${esc(dutyLabel(a.duty_code))} ${esc(staffName(a.staff_id))}</span>`).join('')}
        ${dayAssignments.length > shown.length ? `<span class="v84-more">+${dayAssignments.length - shown.length}</span>` : ''}
      </button>`);
    }
    return `<div class="v84-calendar-note">ตารางย่อทั้งเดือน กดวันที่เพื่อดูรายละเอียด ไม่มีปุ่มแลก/ขาย/ยกในมุมมองนี้</div><div class="v84-schedule-calendar-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => `<div class="v84-cal-dayname">${d}</div>`).join('')}${cells.join('')}</div>`;
  }

  function patchScheduleMobile(){
    try {
      window.renderMonthlySchedulePage = renderMonthlySchedulePage = function renderMonthlySchedulePageV84(){
        const st = getState();
        if (mobile() && (!st.scheduleMobileView || st.scheduleMobileView === 'mine')) st.scheduleMobileView = 'day';
        ensureScheduleDate();
        const assignments = safe(() => getAssignmentsForMonth(state.monthKey), []);
        return `<div class="card schedule-page-card">
          <div class="toolbar no-print">
            <label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(st.monthKey)}"></label>
            <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
            <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
            <button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button>
          </div>
          <div class="mobile-schedule-tabs no-print">
            ${scheduleTab('day', 'ดูตามวัน')}
            ${scheduleTab('person', 'ดูตามคน')}
            ${scheduleTab('ot', 'สรุป OT')}
            ${scheduleTab('table', 'ตาราง')}
          </div>
          <h3 class="print-only">ตารางเวรประจำเดือน ${esc(st.monthKey)}</h3>
          ${safe(() => renderScheduleSummary(assignments), '')}
          ${safe(() => renderReadOnlySchedule(assignments), '')}
          ${safe(() => renderDutyTradePanel(assignments), '')}
        </div>`;
      };
      window.renderMobileScheduleView = renderMobileScheduleView = function renderMobileScheduleViewV84(assignments){
        const view = getState()?.scheduleMobileView || 'day';
        if (view === 'person') return renderScheduleByPersonV84(assignments);
        if (view === 'ot') return safe(() => renderMobileScheduleOt(assignments), '');
        if (view === 'table') return renderScheduleCalendarGridV84(assignments);
        return renderScheduleBySelectedDay(assignments);
      };
    } catch (err) { console.warn(PATCH, 'schedule mobile patch skipped', err); }
  }

  // Calendar กลาง: month view บนมือถือเป็นตาราง compact แบบ Google Calendar
  function patchCentralCalendarMobile(){
    try {
      window.renderCalendarMobileMonth = renderCalendarMobileMonth = function renderCalendarMobileMonthV84(events, monthDate){
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth() + 1;
        const first = new Date(y, m - 1, 1);
        first.setDate(1 - first.getDay());
        const cells = [];
        for (let i=0; i<42; i++) {
          const cur = new Date(first);
          cur.setDate(first.getDate() + i);
          const ds = `${cur.getFullYear()}-${pad2(cur.getMonth()+1)}-${pad2(cur.getDate())}`;
          const evs = (events || []).filter(e => e.date === ds);
          const shown = evs.slice(0, 3);
          cells.push(`<button class="v84-central-day ${cur.getMonth() !== (m-1) ? 'other-month' : ''} ${ds === today() ? 'today' : ''} ${safe(() => isHolidayDate(ds) || isWeekend(ds), false) ? 'weekend' : ''}" type="button" data-day-detail="${esc(ds)}">
            <span class="v84-day-num"><span>${cur.getDate()}</span>${evs.length ? `<span>${evs.length}</span>` : ''}</span>
            ${shown.map(e => `<span class="v84-event-chip ${eventColorClass(e)}">${esc(e.title)}</span>`).join('')}
            ${evs.length > shown.length ? `<span class="v84-more">+${evs.length - shown.length}</span>` : ''}
          </button>`);
        }
        return `<div class="v84-calendar-note">มุมมอง Month แบบตาราง กดวันที่เพื่อดูรายละเอียด</div><div class="v84-central-calendar-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => `<div class="v84-cal-dayname">${d}</div>`).join('')}${cells.join('')}</div>`;
      };
    } catch (err) { console.warn(PATCH, 'central calendar patch skipped', err); }
  }


  // ตารางตำแหน่งรายเดือน: บนมือถือเปลี่ยน matrix แนวนอนยาวเป็น calendar grid แบบ Google Calendar
  function renderMonthPositionCalendarGridV84(rows, dates){
    if (!rows || !rows.length) return safe(() => empty('ยังไม่มีแผนรายเดือน'), '<div class="empty-state">ยังไม่มีแผนรายเดือน</div>');
    const st = getState();
    const key = (st?.page === 'positionMonthView' ? (st?.positionMonthViewKey || st?.monthKey) : (st?.positionMonthKey || st?.monthKey)) || today().slice(0,7);
    const { y, m } = monthRange(key);
    const first = new Date(y, m - 1, 1);
    first.setDate(1 - first.getDay());
    const byDate = {};
    (rows || []).forEach(r => {
      if (!r?.work_date || !r?.staff_id) return;
      byDate[r.work_date] = byDate[r.work_date] || [];
      byDate[r.work_date].push(r);
    });
    Object.values(byDate).forEach(list => list.sort((a,b) => String(a.position_code || '').localeCompare(String(b.position_code || '')) || staffName(a.staff_id).localeCompare(staffName(b.staff_id), 'th')));
    const cells = [];
    for (let i=0; i<42; i++) {
      const cur = new Date(first);
      cur.setDate(first.getDate() + i);
      const ds = `${cur.getFullYear()}-${pad2(cur.getMonth()+1)}-${pad2(cur.getDate())}`;
      const dayRows = byDate[ds] || [];
      const noDay = safe(() => isNoPositionDay(ds), false);
      const outing = safe(() => hasOuting(ds), false);
      const leaveCount = safe(() => (st.leaves || []).filter(l => l.status !== 'cancelled' && overlapsDate(l, ds)).length, 0);
      const shown = dayRows.slice(0, 3);
      const cls = `${cur.getMonth() !== (m-1) ? 'other-month' : ''} ${ds === today() ? 'today' : ''} ${noDay ? 'no-position' : ''} ${outing ? 'has-outing' : ''} ${leaveCount ? 'has-leave' : ''}`;
      const chips = [];
      if (noDay) chips.push(`<span class="v84-position-chip no-position">${safe(() => isHolidayDate(ds), false) ? 'HOLIDAY' : 'WEEKEND'}</span>`);
      if (outing) chips.push(`<span class="v84-position-chip outing">ออกหน่วย</span>`);
      if (leaveCount) chips.push(`<span class="v84-position-chip leave">ลา/ไม่รับเวร ${leaveCount}</span>`);
      chips.push(...shown.map(r => `<span class="v84-position-chip">${esc(safe(() => positionLabelForCell(r.position_code || r.code), r.position_code || r.code || '-'))} ${esc(staffName(r.staff_id))}</span>`));
      const more = dayRows.length > shown.length ? `<span class="v84-more">+${dayRows.length - shown.length}</span>` : '';
      cells.push(`<button class="v84-position-day ${cls}" type="button" data-v84-position-day-detail="${esc(ds)}">
        <span class="v84-day-num"><span>${cur.getDate()}</span>${dayRows.length ? `<span>${dayRows.length}</span>` : ''}</span>
        ${chips.join('')}${more}
      </button>`);
    }
    return `<div class="v84-calendar-note">มุมมองตำแหน่งรายเดือนแบบตาราง กดวันที่เพื่อดูรายละเอียด</div><div class="v84-month-position-calendar-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => `<div class="v84-cal-dayname">${d}</div>`).join('')}${cells.join('')}</div>`;
  }

  function showMonthPositionDayDetailV84(date){
    const st = getState();
    if (!st) return;
    const key = (st.page === 'positionMonthView' ? (st.positionMonthViewKey || st.monthKey) : (st.positionMonthKey || st.monthKey)) || String(date || '').slice(0,7);
    const rows = (st.monthPositionDraft?.monthKey === key ? st.monthPositionDraft.rows : st.positions.filter(x => x.work_date?.startsWith(key))) || [];
    const dayRows = rows.filter(r => r.work_date === date && r.staff_id).sort((a,b) => String(a.position_code || '').localeCompare(String(b.position_code || '')) || staffName(a.staff_id).localeCompare(staffName(b.staff_id), 'th'));
    const leaves = safe(() => (st.leaves || []).filter(l => l.status !== 'cancelled' && overlapsDate(l, date)), []);
    const positionRows = dayRows.map(r => `<div class="v84-position-day-row"><div>${staffPillX(r.staff_id)}<br><span class="muted">${esc(r.zone || '')}</span></div><b>${esc(safe(() => positionLabelForCell(r.position_code || r.code), r.position_code || r.code || '-'))}</b></div>`).join('');
    const leaveRows = leaves.map(l => `<div class="v84-position-day-row"><div>${staffPillX(l.staff_id)}<br><span class="muted">${esc(l.leave_period || 'เต็มวัน')}</span></div><b>${esc(l.type || 'ลา')}</b></div>`).join('');
    safe(() => showModal(`<h2>${thaiDate(date)}</h2><div class="v84-position-day-detail">${safe(() => isNoPositionDay(date), false) ? `<div class="notice soft-notice">${safe(() => isHolidayDate(date), false) ? 'วันหยุดราชการ' : 'WEEKEND'} — ไม่จัดตำแหน่ง</div>` : ''}${safe(() => hasOuting(date), false) ? '<div class="notice soft-notice">มีออกหน่วยวันนี้</div>' : ''}<h3>ตำแหน่ง</h3>${positionRows || safe(() => empty('ไม่มีตำแหน่งวันนี้'), '<div>ไม่มีตำแหน่งวันนี้</div>')}<h3>ลา / ไม่รับเวร</h3>${leaveRows || safe(() => empty('ไม่มีรายการลา/ไม่รับเวร'), '<div>ไม่มีรายการลา/ไม่รับเวร</div>')}</div>`), null);
  }

  function patchMonthlyPositionMobile(){
    try {
      const oldRenderMonthPositionMatrix = renderMonthPositionMatrix;
      window.renderMonthPositionMatrix = renderMonthPositionMatrix = function renderMonthPositionMatrixV84(rows, dates){
        if (mobile()) return renderMonthPositionCalendarGridV84(rows, dates);
        return oldRenderMonthPositionMatrix.apply(this, arguments);
      };
    } catch (err) { console.warn(PATCH, 'month position patch skipped', err); }
  }

  function updateViewportVar(){
    const h = window.visualViewport?.height || window.innerHeight || document.documentElement.clientHeight || 0;
    if (h) document.documentElement.style.setProperty('--v84-vh', `${h}px`);
  }
  function patchAndroidViewport(){
    updateViewportVar();
    window.addEventListener('resize', updateViewportVar, { passive:true });
    window.visualViewport?.addEventListener?.('resize', updateViewportVar, { passive:true });
    window.visualViewport?.addEventListener?.('scroll', updateViewportVar, { passive:true });
  }

  function hideStaffFilterOnLeave(){
    if (admin()) return;
    const title = document.getElementById('pageTitle')?.textContent || '';
    if (!/แจ้งลา|ไม่รับเวร/.test(title)) return;
    document.querySelectorAll('.card').forEach(card => {
      const h = card.querySelector('h3')?.textContent || '';
      if (!/รายการของฉัน/.test(h)) return;
      card.querySelectorAll('label, .toolbar label, .compact-filter label, .filter-bar label').forEach(el => {
        const text = String(el.textContent || '').replace(/\s+/g, ' ').trim();
        if (el.querySelector('select') && /^ชื่อ(\s|$)/.test(text)) {
          el.classList.add('v84-staff-filter-hidden');
          el.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }

  function persistUiState(){
    const st = getState();
    if (!st) return;
    const data = {
      page: st.page,
      monthKey: st.monthKey,
      calendarDate: st.calendarDate ? safe(() => st.calendarDate.toISOString(), null) : null,
      calendarView: st.calendarView,
      scheduleMobileView: st.scheduleMobileView,
      scheduleSelectedDate: st.scheduleSelectedDate,
      tradeFilterStaff: st.tradeFilterStaff,
      positionDate: st.positionDate,
      positionMonthKey: st.positionMonthKey,
      positionMonthViewKey: st.positionMonthViewKey,
      savedAt: Date.now()
    };
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
  }
  function restoreUiState(){
    const st = getState();
    if (!st) return;
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    let data = null;
    try { data = JSON.parse(raw); } catch (_) { return; }
    if (!data || Date.now() - Number(data.savedAt || 0) > 1000 * 60 * 60 * 24 * 14) return;
    if (data.page) st.page = data.page;
    if (data.monthKey) st.monthKey = data.monthKey;
    if (data.calendarView) st.calendarView = data.calendarView;
    if (data.calendarDate) {
      const d = new Date(data.calendarDate);
      if (!Number.isNaN(d.getTime())) st.calendarDate = d;
    }
    if (data.scheduleMobileView) st.scheduleMobileView = data.scheduleMobileView === 'mine' ? 'day' : data.scheduleMobileView;
    if (data.scheduleSelectedDate) st.scheduleSelectedDate = data.scheduleSelectedDate;
    if (data.tradeFilterStaff !== undefined) st.tradeFilterStaff = data.tradeFilterStaff;
    if (data.positionDate) st.positionDate = data.positionDate;
    if (data.positionMonthKey) st.positionMonthKey = data.positionMonthKey;
    if (data.positionMonthViewKey) st.positionMonthViewKey = data.positionMonthViewKey;
  }

  function explicitLogoutRecent(){
    const t = Number(sessionStorage.getItem(LOGOUT_KEY) || 0);
    return t && Date.now() - t < 15000;
  }
  function markLogout(){ sessionStorage.setItem(LOGOUT_KEY, String(Date.now())); }

  function patchStateAndRender(){
    try {
      const oldRenderPage = renderPage;
      window.renderPage = renderPage = function renderPageV84(){
        injectStyle();
        const out = oldRenderPage.apply(this, arguments);
        setTimeout(() => { hideStaffFilterOnLeave(); persistUiState(); }, 0);
        return out;
      };
    } catch (err) { console.warn(PATCH, 'renderPage hook skipped', err); }

    document.addEventListener('click', e => {
      if (e.target?.closest?.('#logoutBtn')) markLogout();
      const posDay = e.target?.closest?.('[data-v84-position-day-detail]');
      if (posDay) {
        e.preventDefault();
        showMonthPositionDayDetailV84(posDay.dataset.v84PositionDayDetail);
        return;
      }
      const nav = e.target?.closest?.('[data-sched-day-nav]');
      if (nav) {
        const st = getState();
        if (!st) return;
        const d = parseD(ensureScheduleDate());
        d.setDate(d.getDate() + (nav.dataset.schedDayNav === 'next' ? 1 : -1));
        const next = `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
        if (inMonth(next, st.monthKey)) st.scheduleSelectedDate = next;
        safe(() => renderPage(), null);
      }
      setTimeout(persistUiState, 50);
    }, true);

    window.addEventListener('beforeunload', persistUiState, { capture:true });
    window.addEventListener('pagehide', persistUiState, { capture:true });

    document.addEventListener('change', e => {
      const st = getState();
      if (!st) return;
      if (e.target?.id === 'scheduleDayInput') {
        st.scheduleSelectedDate = e.target.value;
        safe(() => renderPage(), null);
      }
      if (e.target?.id === 'scheduleMonthInput') {
        setTimeout(() => { ensureScheduleDate(); persistUiState(); }, 0);
      }
      setTimeout(persistUiState, 50);
    }, true);
  }

  async function rescueSession(reason){
    const st = getState();
    const client = getSb();
    if (!st || !client || explicitLogoutRecent()) return false;
    try {
      for (const delay of [0, 250, 600, 1200, 2200, 3500]) {
        if (delay) await new Promise(r => setTimeout(r, delay));
        const res = await client.auth.getSession();
        const session = res?.data?.session || null;
        if (!session?.user) continue;
        st.session = session;
        restoreUiState();
        const appHidden = document.getElementById('appView')?.classList.contains('hidden');
        const authVisible = !document.getElementById('authView')?.classList.contains('hidden');
        if (appHidden || authVisible || !st.profile) {
          console.info(PATCH, 'session restore:', reason);
          await enterApp();
          restoreUiState();
          safe(() => renderPage(), null);
        }
        safe(() => setBusy(false), null);
        return true;
      }
    } catch (err) { console.warn(PATCH, 'rescue failed', err); }
    safe(() => setBusy(false), null);
    return false;
  }

  function patchSession(){
    try {
      const oldEnterApp = enterApp;
      window.enterApp = enterApp = async function enterAppV84(){
        restoreUiState();
        await oldEnterApp.apply(this, arguments);
        restoreUiState();
        safe(() => renderPage(), null);
        persistUiState();
      };
    } catch (err) { console.warn(PATCH, 'enterApp hook skipped', err); }

    try {
      const oldExitApp = exitApp;
      window.exitApp = exitApp = function exitAppV84(){
        if (!explicitLogoutRecent()) {
          rescueSession('exitApp').then(ok => { if (!ok) oldExitApp.apply(this, arguments); });
          return;
        }
        oldExitApp.apply(this, arguments);
      };
    } catch (err) { console.warn(PATCH, 'exitApp hook skipped', err); }

    window.addEventListener('pageshow', () => setTimeout(() => rescueSession('pageshow'), 250));
    window.addEventListener('focus', () => setTimeout(() => rescueSession('focus'), 250));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => rescueSession('visibility'), 250); });
    setTimeout(() => rescueSession('load-700'), 700);
    setTimeout(() => rescueSession('load-2000'), 2000);
    setTimeout(() => rescueSession('load-4000'), 4000);
  }

  function install(){
    injectStyle();
    patchTradeButtons();
    patchScheduleMobile();
    patchCentralCalendarMobile();
    patchMonthlyPositionMobile();
    patchAndroidViewport();
    patchStateAndRender();
    patchSession();
    setTimeout(() => { restoreUiState(); hideStaffFilterOnLeave(); persistUiState(); }, 300);
    console.info('CNMI Staff Planner ' + PATCH + ' loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
