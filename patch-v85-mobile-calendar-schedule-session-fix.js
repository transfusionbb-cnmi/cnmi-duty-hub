/* CNMI Duty Hub V85: mobile calendar color/date fix + schedule calendar detail fix + stronger refresh/session rescue
   Patch-only. Load after v80/v84. No SQL/schema changes.
*/
(function(){
  const PATCH = 'v85-mobile-calendar-schedule-session-fix';
  const UI_KEY = 'cnmiDutyHub.v85.uiState';
  const HAD_SESSION_KEY = 'cnmiDutyHub.v85.hadAppSession';
  const LOGOUT_KEY = 'cnmiDutyHub.v85.explicitLogoutAt';

  function safe(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
  function st(){ return (typeof state !== 'undefined') ? state : null; }
  function client(){ return (typeof sb !== 'undefined') ? sb : null; }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))); }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function today(){ return safe(() => todayStr(), new Date().toISOString().slice(0,10)); }
  function parseD(d){ return safe(() => parseDate(d), new Date(String(d || '').slice(0,10))); }
  function thai(d){ return safe(() => formatThaiDate(d), String(d || '-')); }
  function monthRange(key){ return safe(() => getMonthRange(key || st()?.monthKey), (() => { const [y,m] = String(key || today().slice(0,7)).split('-').map(Number); return {y,m}; })()); }
  function firstOfMonth(key){ const r = monthRange(key); return `${r.y}-${pad2(r.m)}-01`; }
  function lastOfMonth(key){ const r = monthRange(key); return `${r.y}-${pad2(r.m)}-${pad2(new Date(r.y, r.m, 0).getDate())}`; }
  function dutyCols(){ return safe(() => DUTY_COLUMNS, ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT']).slice(); }
  function dutyLabel(code){ return safe(() => DUTY_LABEL[code] || code || '-', code || '-'); }
  function staffNickX(id){ return safe(() => staffNick(id), '-'); }
  function staffColorX(id){ return safe(() => staffColor(id), '#e8f3ff'); }
  function textColorX(bg){ return safe(() => textColorFor(bg), '#203245'); }
  function staffPillX(id, opts){ return safe(() => staffPill(id, opts || {}), `<span>${esc(staffNickX(id))}</span>`); }
  function isMobile(){ return !!safe(() => isMobileView(), window.matchMedia && window.matchMedia('(max-width: 820px)').matches); }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function currentStaff(){ return safe(() => currentStaffId(), st()?.profile?.id || null); }
  function allowedDuty(date, code){ return safe(() => allowedDutyCodesForDate(date).includes(code), true); }
  function dateInput(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

  function colorForEvent(e){
    if (!e) return '#edf2f7';
    if (e.type === 'duty') return staffColorX(e.raw?.staff_id);
    return ({
      'leave-vacation':'#dff7ce',
      'leave-personal':'#eadbff',
      'leave-sick':'#fff3bd',
      'leave-other':'#dff0ff',
      noduty:'#e8edf3',
      training:'#dff0ff',
      meeting:'#ffe7bd',
      outing:'#ffd3d8',
      standard:'#eadbff',
      code:'#fff3bd',
      holiday:'#fff3bd',
      activity:'#edf2f7'
    })[e.type] || '#edf2f7';
  }
  function calendarLabel(e){
    return safe(() => {
      if (e?.type === 'duty') return `${DUTY_LABEL[e.raw?.duty_code] || e.raw?.duty_code || ''}: ${staffNick(e.raw?.staff_id)}`;
      if (e?.raw?.event_type) return e.title || e.raw.event_type;
      return e?.title || eventText(e?.type) || '-';
    }, e?.title || '-');
  }

  function injectStyle(){
    if (document.getElementById('cnmi-v85-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v85-style';
    style.textContent = `
      @media (max-width: 820px) {
        .v85-calendar-grid, .v85-schedule-grid { display:grid; grid-template-columns:repeat(7,minmax(0,1fr)); gap:4px; width:100%; }
        .v85-dayname { text-align:center; font-size:10px; font-weight:900; color:#60758c; padding:3px 0; }
        .v85-cal-day, .v85-sched-day { min-height:62px; border:1px solid #dce8f2; border-radius:10px; padding:4px; background:#fff; overflow:hidden; display:flex; flex-direction:column; gap:2px; text-align:left; }
        .v85-cal-day.other-month, .v85-sched-day.other-month { opacity:.45; background:#f7f9fc; }
        .v85-cal-day.weekend, .v85-sched-day.weekend { background:#fffaf0; }
        .v85-cal-day.today, .v85-sched-day.today { outline:2px solid #80caff; }
        .v85-daynum { font-size:11px; font-weight:900; color:#203245; line-height:1.1; margin-bottom:1px; display:block; }
        .v85-event-chip, .v85-duty-chip { display:block; width:100%; border:0; border-radius:6px; padding:2px 3px; font-size:8.7px; line-height:1.1; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; text-align:left; box-shadow: inset 0 0 0 1px rgba(0,0,0,.035); }
        .v85-duty-chip { font-weight:700; }
        .v85-more { font-size:9px; line-height:1.1; color:#60758c; padding-left:2px; }
        .v85-calendar-note { font-size:11px; color:#60758c; margin:6px 0 8px; }
        .v85-calendar-legend { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; margin-top:14px; }
        .v85-legend-pill { border-radius:999px; padding:8px 12px; font-size:12px; font-weight:800; color:#203245; }
        .v85-sched-detail-list { display:grid; gap:8px; }
        .v85-sched-detail-row { border-radius:18px; padding:13px 14px; display:grid; grid-template-columns:1fr auto; gap:10px; align-items:center; box-shadow: inset 0 0 0 1px rgba(0,0,0,.05); }
        .v85-sched-detail-row b { display:block; font-size:18px; line-height:1.2; }
        .v85-sched-detail-row .muted { color:inherit; opacity:.78; }
        .v85-sched-detail-row .trade-btn { background:rgba(255,255,255,.82); border-color:rgba(255,255,255,.86); color:#203245; }
        .v85-session-overlay { position:fixed; inset:0; z-index:99999; display:none; place-items:center; background:linear-gradient(180deg, rgba(247,251,255,.96), rgba(235,245,255,.98)); color:#203245; padding:24px; text-align:center; }
        body.v85-session-restoring .v85-session-overlay { display:grid; }
        body.v85-session-restoring #authView { visibility:hidden; }
        .v85-session-box { background:#fff; border:1px solid #dbe7f0; border-radius:26px; padding:24px; box-shadow:0 16px 40px rgba(31,50,72,.12); max-width:360px; }
        .v85-spinner { width:42px; height:42px; border-radius:999px; border:4px solid #dbe7f0; border-top-color:#80caff; animation:v85spin .9s linear infinite; margin:0 auto 14px; }
        @keyframes v85spin { to { transform:rotate(360deg); } }
      }
      @media (max-width:430px) {
        .v85-cal-day, .v85-sched-day { min-height:56px; border-radius:8px; padding:3px; }
        .v85-event-chip, .v85-duty-chip { font-size:8.2px; padding:2px; }
        .v85-daynum { font-size:10px; }
      }
    `;
    document.head.appendChild(style);
  }

  // Requirement: ปุ่ม แลก/ขาย/ยก ขึ้นทุกเวรที่มีชื่อ แบบ Admin
  function patchTradeButtons(){
    try {
      window.canRequestTrade = canRequestTrade = function canRequestTradeV85(slot){ return !!(slot && slot.id && slot.staff_id); };
      window.renderTradeButton = renderTradeButton = function renderTradeButtonV85(slot){
        if (!slot || !slot.id || !slot.staff_id) return '';
        return `<button class="tiny-btn trade-btn" data-trade-duty="${esc(slot.id)}">แลก/ขาย/ยก</button>`;
      };
    } catch(err){ console.warn(PATCH, 'trade patch skipped', err); }
  }

  function patchCentralCalendar(){
    try {
      window.renderCalendarMobileMonth = renderCalendarMobileMonth = function renderCalendarMobileMonthV85(events, monthDate){
        const y = monthDate.getFullYear();
        const m = monthDate.getMonth() + 1;
        const first = new Date(y, m - 1, 1);
        first.setDate(1 - first.getDay());
        const cells = [];
        for (let i=0; i<42; i++) {
          const cur = new Date(first); cur.setDate(first.getDate() + i);
          const ds = dateInput(cur);
          const evs = (events || []).filter(e => e.date === ds);
          const shown = evs.slice(0, 3);
          cells.push(`<button class="v85-cal-day ${cur.getMonth() !== (m-1) ? 'other-month' : ''} ${ds === today() ? 'today' : ''} ${safe(() => isHolidayDate(ds) || isWeekend(ds), false) ? 'weekend' : ''}" type="button" data-day-detail="${esc(ds)}">
            <span class="v85-daynum">${cur.getDate()}</span>
            ${shown.map(e => { const bg = colorForEvent(e); const fg = textColorX(bg); return `<span class="v85-event-chip" style="background:${esc(bg)};color:${esc(fg)}">${esc(calendarLabel(e))}</span>`; }).join('')}
            ${evs.length > shown.length ? `<span class="v85-more">+${evs.length - shown.length}</span>` : ''}
          </button>`);
        }
        return `<div class="v85-calendar-note">มุมมอง Month แบบตาราง กดวันที่เพื่อดูรายละเอียด</div><div class="v85-calendar-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => `<div class="v85-dayname">${d}</div>`).join('')}${cells.join('')}</div><div class="v85-calendar-legend"><span class="v85-legend-pill" style="background:#dff7ce">ลาพักร้อน</span><span class="v85-legend-pill" style="background:#eadbff">ลากิจ</span><span class="v85-legend-pill" style="background:#fff3bd">ลาป่วย/ลาคลอด</span><span class="v85-legend-pill" style="background:#dff0ff">อบรม</span><span class="v85-legend-pill" style="background:#ffe7bd">ประชุม</span><span class="v85-legend-pill" style="background:#ffd3d8">ออกหน่วย</span><span class="v85-legend-pill" style="background:#e8edf3">ไม่รับเวร</span></div>`;
      };
    } catch(err){ console.warn(PATCH, 'calendar mobile patch skipped', err); }
  }

  function ensureScheduleDate(){
    const stateObj = st();
    if (!stateObj) return today();
    const key = stateObj.monthKey || today().slice(0,7);
    if (!stateObj.scheduleSelectedDate || String(stateObj.scheduleSelectedDate).slice(0,7) !== key) {
      stateObj.scheduleSelectedDate = today().slice(0,7) === key ? today() : firstOfMonth(key);
    }
    return stateObj.scheduleSelectedDate;
  }
  function scheduleTab(id, label){
    const active = (st()?.scheduleMobileView || 'day') === id;
    return `<button class="${active ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${esc(id)}">${esc(label)}</button>`;
  }
  function assignmentsForMonth(){ return safe(() => getAssignmentsForMonth(state.monthKey), []); }
  function assignmentsForDay(assignments, date){
    return (assignments || [])
      .filter(a => a?.duty_date === date && a.staff_id && allowedDuty(date, a.duty_code))
      .sort((a,b) => dutyCols().indexOf(a.duty_code) - dutyCols().indexOf(b.duty_code));
  }
  function dutyChip(a){
    const bg = staffColorX(a.staff_id); const fg = textColorX(bg);
    return `<span class="v85-duty-chip" style="background:${esc(bg)};color:${esc(fg)}">${esc(dutyLabel(a.duty_code))} ${esc(staffNickX(a.staff_id))}</span>`;
  }
  function showScheduleDayDetail(date){
    const rows = assignmentsForDay(assignmentsForMonth(), date);
    const body = rows.length ? `<div class="v85-sched-detail-list">${rows.map(a => {
      const bg = staffColorX(a.staff_id); const fg = textColorX(bg);
      return `<div class="v85-sched-detail-row" style="background:${esc(bg)};color:${esc(fg)}"><div><b>${esc(dutyLabel(a.duty_code))}: ${esc(staffNickX(a.staff_id))}</b><span class="muted">${esc(thai(date))}</span></div><div>${safe(() => renderTradeButton(a), '')}</div></div>`;
    }).join('')}</div>` : safe(() => empty('ไม่มีเวรวันนี้'), '<div class="empty-state">ไม่มีเวรวันนี้</div>');
    safe(() => showModal(`<h2>${thai(date)}</h2>${body}`), null);
  }
  function renderScheduleCalendarGrid(assignments){
    const key = st()?.monthKey || today().slice(0,7);
    const { y, m } = monthRange(key);
    const first = new Date(y, m - 1, 1); first.setDate(1 - first.getDay());
    const cells = [];
    for (let i=0; i<42; i++) {
      const cur = new Date(first); cur.setDate(first.getDate() + i);
      const ds = dateInput(cur);
      const dayRows = assignmentsForDay(assignments, ds);
      const shown = dayRows.slice(0, 3);
      cells.push(`<button class="v85-sched-day ${cur.getMonth() !== (m-1) ? 'other-month' : ''} ${ds === today() ? 'today' : ''} ${safe(() => isHolidayDate(ds) || isWeekend(ds), false) ? 'weekend' : ''}" type="button" data-v85-schedule-day="${esc(ds)}">
        <span class="v85-daynum">${cur.getDate()}</span>
        ${shown.map(dutyChip).join('')}
        ${dayRows.length > shown.length ? `<span class="v85-more">+${dayRows.length - shown.length}</span>` : ''}
      </button>`);
    }
    return `<div class="v85-calendar-note">ตารางย่อทั้งเดือน กดวันที่เพื่อดูเวรและปุ่มแลก/ขาย/ยก</div><div class="v85-schedule-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d => `<div class="v85-dayname">${d}</div>`).join('')}${cells.join('')}</div>`;
  }
  function renderSelectedDay(assignments){
    const date = ensureScheduleDate();
    const rows = assignmentsForDay(assignments, date);
    return `<div class="v84-schedule-day-view"><div class="v84-day-picker no-print"><button class="ghost-btn" data-sched-day-nav="prev">‹</button><label>เลือกวันที่ <input type="date" id="scheduleDayInput" value="${esc(date)}" min="${esc(firstOfMonth(st()?.monthKey))}" max="${esc(lastOfMonth(st()?.monthKey))}"></label><button class="ghost-btn" data-sched-day-nav="next">›</button></div><div class="v84-one-day-card ${safe(() => isHolidayDate(date) || isWeekend(date), false) ? 'weekend-row' : ''}"><div class="mobile-day-head"><b>${parseD(date).getDate()}</b><span>${esc(safe(() => parseD(date).toLocaleDateString('th-TH', { weekday:'long' }), ''))}</span>${safe(() => isHolidayDate(date), false) ? safe(() => badge(holidayName(date), 'yellow'), '') : ''}</div>${rows.length ? rows.map(a => `<div class="v84-duty-line"><b>${esc(dutyLabel(a.duty_code))}</b><span>${staffPillX(a.staff_id, { button:true, attrs:`data-staff-stat="${esc(a.staff_id)}" type="button"` })}</span>${safe(() => renderTradeButton(a), '')}</div>`).join('') : '<span class="muted">วันนี้ไม่มีเวร</span>'}</div></div>`;
  }
  function renderByPerson(assignments){
    let active = safe(() => orderedStaff(state.staff.filter(s => isRosterEnabled(s))), []);
    if (!isAdminX()) active = active.filter(s => String(s.id) === String(currentStaff()));
    if (!active.length) return safe(() => empty('ไม่พบรายชื่อเจ้าหน้าที่'), '<div class="empty-state">ไม่พบรายชื่อเจ้าหน้าที่</div>');
    return `<div class="mobile-schedule-person-list">${active.map(s => {
      const rows = (assignments || []).filter(a => a.staff_id === s.id).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || String(a.duty_code).localeCompare(String(b.duty_code)));
      return `<div class="schedule-person-card" style="--staff-bg:${esc(staffColorX(s))};--staff-fg:${esc(textColorX(staffColorX(s)))}"><div class="person-card-head"><b>${esc(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${thai(a.duty_date)}</span><b>${esc(dutyLabel(a.duty_code))}</b>${safe(() => renderTradeButton(a), '')}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
    }).join('')}</div>`;
  }
  function patchSchedule(){
    try {
      window.renderMonthlySchedulePage = renderMonthlySchedulePage = function renderMonthlySchedulePageV85(){
        const stateObj = st();
        if (isMobile() && !stateObj.scheduleMobileView) stateObj.scheduleMobileView = 'day';
        ensureScheduleDate();
        const assignments = assignmentsForMonth();
        return `<div class="card schedule-page-card"><div class="toolbar no-print"><label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(stateObj.monthKey)}"></label><button class="ghost-btn" data-export-schedule-excel>Export Excel</button><button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button><button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button></div><div class="mobile-schedule-tabs no-print">${scheduleTab('day','ดูตามวัน')}${scheduleTab('person','ดูตามคน')}${scheduleTab('ot','สรุป OT')}${scheduleTab('table','ตาราง')}</div><h3 class="print-only">ตารางเวรประจำเดือน ${esc(stateObj.monthKey)}</h3>${safe(() => renderScheduleSummary(assignments), '')}${safe(() => renderReadOnlySchedule(assignments), '')}${safe(() => renderDutyTradePanel(assignments), '')}</div>`;
      };
      window.renderMobileScheduleView = renderMobileScheduleView = function renderMobileScheduleViewV85(assignments){
        const view = st()?.scheduleMobileView || 'day';
        if (view === 'person') return renderByPerson(assignments);
        if (view === 'ot') return safe(() => renderMobileScheduleOt(assignments), '');
        if (view === 'table') return renderScheduleCalendarGrid(assignments);
        return renderSelectedDay(assignments);
      };
    } catch(err){ console.warn(PATCH, 'schedule patch skipped', err); }
  }

  function persistUi(){
    const stateObj = st(); if (!stateObj) return;
    const data = {
      page: stateObj.page, monthKey: stateObj.monthKey,
      calendarView: stateObj.calendarView,
      calendarDate: stateObj.calendarDate ? safe(() => stateObj.calendarDate.toISOString(), null) : null,
      scheduleMobileView: stateObj.scheduleMobileView,
      scheduleSelectedDate: stateObj.scheduleSelectedDate,
      positionDate: stateObj.positionDate,
      positionMonthKey: stateObj.positionMonthKey,
      positionMonthViewKey: stateObj.positionMonthViewKey,
      savedAt: Date.now()
    };
    localStorage.setItem(UI_KEY, JSON.stringify(data));
    if (stateObj.session?.user || stateObj.profile?.id || !document.getElementById('appView')?.classList.contains('hidden')) localStorage.setItem(HAD_SESSION_KEY, '1');
  }
  function restoreUi(){
    const stateObj = st(); if (!stateObj) return;
    let data = null; try { data = JSON.parse(localStorage.getItem(UI_KEY) || 'null'); } catch(_) { return; }
    if (!data || Date.now() - Number(data.savedAt || 0) > 1000*60*60*24*14) return;
    if (data.page) stateObj.page = data.page;
    if (data.monthKey) stateObj.monthKey = data.monthKey;
    if (data.calendarView) stateObj.calendarView = data.calendarView;
    if (data.calendarDate) { const d = new Date(data.calendarDate); if (!Number.isNaN(d.getTime())) stateObj.calendarDate = d; }
    if (data.scheduleMobileView) stateObj.scheduleMobileView = data.scheduleMobileView;
    if (data.scheduleSelectedDate) stateObj.scheduleSelectedDate = data.scheduleSelectedDate;
    if (data.positionDate) stateObj.positionDate = data.positionDate;
    if (data.positionMonthKey) stateObj.positionMonthKey = data.positionMonthKey;
    if (data.positionMonthViewKey) stateObj.positionMonthViewKey = data.positionMonthViewKey;
  }
  function recentLogout(){ const t = Number(localStorage.getItem(LOGOUT_KEY) || 0); return t && Date.now() - t < 20000; }
  function markLogout(){ localStorage.setItem(LOGOUT_KEY, String(Date.now())); localStorage.removeItem(HAD_SESSION_KEY); localStorage.removeItem(UI_KEY); }
  function hadSession(){ return localStorage.getItem(HAD_SESSION_KEY) === '1' && !recentLogout(); }
  function showRestoreOverlay(){
    if (!hadSession() || !isMobile()) return;
    let el = document.getElementById('v85SessionOverlay');
    if (!el) {
      el = document.createElement('div');
      el.id = 'v85SessionOverlay';
      el.className = 'v85-session-overlay';
      el.innerHTML = '<div class="v85-session-box"><div class="v85-spinner"></div><h3>กำลังคืน session เดิม</h3><p class="muted">ถ้ายังมี session อยู่ ระบบจะกลับไปหน้าเดิมให้อัตโนมัติ</p></div>';
      document.body.appendChild(el);
    }
    document.body.classList.add('v85-session-restoring');
  }
  function hideRestoreOverlay(){ document.body.classList.remove('v85-session-restoring'); }
  async function rescueSession(reason, maxMs=12000){
    const stateObj = st(); const supa = client();
    if (!stateObj || !supa || recentLogout()) { hideRestoreOverlay(); return false; }
    if (hadSession()) showRestoreOverlay();
    const waits = [0,250,500,900,1400,2200,3300,5000,7000,9500,12000];
    const started = Date.now();
    for (const wait of waits) {
      if (Date.now() - started > maxMs) break;
      if (wait) await new Promise(r => setTimeout(r, wait));
      try {
        const res = await supa.auth.getSession();
        const session = res?.data?.session;
        if (!session?.user) continue;
        stateObj.session = session;
        restoreUi();
        await enterApp();
        restoreUi();
        safe(() => renderPage(), null);
        safe(() => setBusy(false), null);
        localStorage.setItem(HAD_SESSION_KEY, '1');
        hideRestoreOverlay();
        console.info(PATCH, 'session restored:', reason);
        return true;
      } catch(err){ console.warn(PATCH, 'session retry failed', reason, err); }
    }
    safe(() => setBusy(false), null);
    hideRestoreOverlay();
    return false;
  }
  function patchSession(){
    try {
      const oldRenderPage = renderPage;
      window.renderPage = renderPage = function renderPageV85(){ const out = oldRenderPage.apply(this, arguments); setTimeout(persistUi, 0); return out; };
    } catch(err){ console.warn(PATCH, 'render hook skipped', err); }
    try {
      const oldEnter = enterApp;
      window.enterApp = enterApp = async function enterAppV85(){ restoreUi(); await oldEnter.apply(this, arguments); restoreUi(); safe(() => renderPage(), null); persistUi(); hideRestoreOverlay(); };
    } catch(err){ console.warn(PATCH, 'enter hook skipped', err); }
    try {
      const oldExit = exitApp;
      window.exitApp = exitApp = function exitAppV85(){
        if (!recentLogout() && hadSession()) { showRestoreOverlay(); rescueSession('exitApp', 10000).then(ok => { if (!ok) oldExit.apply(this, arguments); }); return; }
        oldExit.apply(this, arguments);
      };
    } catch(err){ console.warn(PATCH, 'exit hook skipped', err); }

    document.addEventListener('click', e => { if (e.target?.closest?.('#logoutBtn')) markLogout(); }, true);
    window.addEventListener('beforeunload', persistUi, {capture:true});
    window.addEventListener('pagehide', persistUi, {capture:true});
    window.addEventListener('pageshow', () => setTimeout(() => rescueSession('pageshow', 9000), 200));
    window.addEventListener('focus', () => setTimeout(() => rescueSession('focus', 8000), 250));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => rescueSession('visibility', 8000), 250); });
    document.addEventListener('submit', e => { if (e.target?.id === 'loginForm') { safe(() => setBusy(false), null); hideRestoreOverlay(); } }, true);
    setTimeout(() => rescueSession('load-500', 12000), 500);
    setTimeout(() => rescueSession('load-2500', 9000), 2500);
    setTimeout(() => rescueSession('load-6000', 7000), 6000);
  }

  function patchClicks(){
    document.addEventListener('click', e => {
      const sd = e.target?.closest?.('[data-v85-schedule-day]');
      if (sd) { e.preventDefault(); e.stopPropagation(); showScheduleDayDetail(sd.dataset.v85ScheduleDay); return; }
      const nav = e.target?.closest?.('[data-sched-day-nav]');
      if (nav) {
        const stateObj = st(); if (!stateObj) return;
        const d = parseD(ensureScheduleDate()); d.setDate(d.getDate() + (nav.dataset.schedDayNav === 'next' ? 1 : -1));
        const next = dateInput(d); if (next.slice(0,7) === String(stateObj.monthKey)) stateObj.scheduleSelectedDate = next;
        e.preventDefault(); e.stopPropagation(); safe(() => renderPage(), null); return;
      }
      setTimeout(persistUi, 50);
    }, true);
    document.addEventListener('change', e => {
      const stateObj = st(); if (!stateObj) return;
      if (e.target?.id === 'scheduleDayInput') { stateObj.scheduleSelectedDate = e.target.value; safe(() => renderPage(), null); }
      setTimeout(persistUi, 50);
    }, true);
  }

  function install(){
    injectStyle();
    patchTradeButtons();
    patchCentralCalendar();
    patchSchedule();
    patchSession();
    patchClicks();
    if (hadSession()) setTimeout(showRestoreOverlay, 0);
    console.info('CNMI Staff Planner ' + PATCH + ' loaded');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
