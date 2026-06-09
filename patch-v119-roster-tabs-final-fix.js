/* V119 final roster tabs fix: only schedule page views + mobile table polish. Do not touch OT/admin pages. */
(function(){
  if (window.__CNMI_V119_ROSTER_TABS_FINAL__) return;
  window.__CNMI_V119_ROSTER_TABS_FINAL__ = true;

  const esc = (v) => (typeof escapeHtml === 'function') ? escapeHtml(v) : String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
  const safeStaff = () => {
    try { return orderedStaff((state.staff || []).filter(s => typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : true)); }
    catch(e){ return state.staff || []; }
  };
  const monthAssignments = () => {
    try { return getAssignmentsForMonth(state.monthKey || todayStr().slice(0,7)).filter(a => a && a.staff_id); }
    catch(e){ return (state.rosterAssignments || []).filter(a => String(a.duty_date || '').slice(0,7) === String(state.monthKey || '') && a.staff_id); }
  };
  const shortDuty = (code) => {
    const c = String(code || '');
    if (c.startsWith('ช9')) return 'ช9';
    if (c.startsWith('ช4')) return 'ช4';
    return (typeof DUTY_LABEL !== 'undefined' && DUTY_LABEL[c]) ? DUTY_LABEL[c] : c;
  };
  const nick = (staffId) => {
    try { return staffNick(staffId); } catch(e) {}
    const s = (state.staff || []).find(x => String(x.id) === String(staffId));
    return s?.nickname || s?.full_name || '-';
  };
  const colorStyle = (staffId) => {
    const s = (state.staff || []).find(x => String(x.id) === String(staffId));
    let bg = '#dbeafe', fg = '#0f172a';
    try { bg = staffColor(s || staffId); fg = textColorFor(bg); } catch(e) {}
    return { bg, fg, css:`background:${bg};color:${fg};--staff-bg:${bg};--staff-fg:${fg}` };
  };
  const assignmentId = (a) => String(a?.id || a?._temp_id || `${a?.duty_date}-${a?.duty_code}-${a?.staff_id}`);
  const thaiFull = (date) => { try { return formatThaiDate(date); } catch(e) { return date; } };
  const byDateCode = (a,b) => String(a.duty_date||'').localeCompare(String(b.duty_date||'')) || String(a.duty_code||'').localeCompare(String(b.duty_code||''));
  const dutiesByDate = (assignments, date) => (assignments || []).filter(a => String(a.duty_date) === String(date)).sort((a,b)=>String(a.duty_code||'').localeCompare(String(b.duty_code||'')));
  const dutiesByStaff = (assignments, staffId) => (assignments || []).filter(a => String(a.staff_id) === String(staffId)).sort(byDateCode);

  function tradeButton(a){
    let ok = true;
    try { ok = canRequestTrade(a); } catch(e) {}
    return ok ? `<button type="button" class="tiny-btn" data-v119-trade="${esc(assignmentId(a))}">ซื้อ/แลก/ยก</button>` : '';
  }

  function showDutyDetail(a){
    if (!a) return;
    const person = (typeof staffPill === 'function') ? staffPill(a.staff_id) : `<span>${esc(nick(a.staff_id))}</span>`;
    showModal(`<h2>รายละเอียดเวร</h2>
      <p class="hint">${person} • ${esc(thaiFull(a.duty_date))} • ${esc(shortDuty(a.duty_code))}</p>
      <div class="confirm-actions">${tradeButton(a) || ''}<button type="button" class="primary-btn" data-app-alert-ok>ปิด</button></div>`);
  }

  function showDayPopup(date){
    const rows = dutiesByDate(monthAssignments(), date);
    const body = rows.map(a => `<tr>
        <td>${(typeof staffPill === 'function') ? staffPill(a.staff_id) : esc(nick(a.staff_id))}</td>
        <td>${esc(shortDuty(a.duty_code))}</td>
        <td>${tradeButton(a) || '-'}</td>
      </tr>`).join('');
    showModal(`<h2>${esc(thaiFull(date))}</h2>
      <div class="table-wrap"><table><thead><tr><th>เจ้าหน้าที่</th><th>เวร</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body || '<tr><td colspan="3">ไม่มีเวร</td></tr>'}</tbody></table></div>`);
  }

  function showPersonPopup(staffId){
    const rows = dutiesByStaff(monthAssignments(), staffId);
    const body = rows.map(a => `<tr><td>${esc(thaiFull(a.duty_date))}</td><td>${esc(shortDuty(a.duty_code))}</td><td>${tradeButton(a) || '-'}</td></tr>`).join('');
    showModal(`<h2>${(typeof staffPill === 'function') ? staffPill(staffId) : esc(nick(staffId))}</h2>
      <p class="hint">รายการเวรประจำเดือน ${esc(state.monthKey || '')}</p>
      <div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ซื้อ/แลก</th></tr></thead><tbody>${body || '<tr><td colspan="3">ไม่มีเวรเดือนนี้</td></tr>'}</tbody></table></div>`);
  }

  function renderToolbar(){
    return `<div class="toolbar no-print schedule-toolbar-v119">
      <label>เดือน <input type="month" id="scheduleMonthInput" value="${esc(state.monthKey)}"></label>
      <button type="button" class="ghost-btn" data-export-schedule-excel>Export Excel</button>
      <button type="button" class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
      <button type="button" class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button>
    </div>`;
  }

  function renderTab(view, label, target){
    const current = target === 'desktop' ? (state.scheduleDesktopViewV119 || 'table') : (state.scheduleMobileViewV119 || 'day');
    const attr = target === 'desktop' ? 'data-v119-desktop-tab' : 'data-v119-mobile-tab';
    return `<button type="button" class="${current === view ? 'primary-btn' : 'ghost-btn'}" ${attr}="${view}">${esc(label)}</button>`;
  }

  function renderExcel(assignments){
    let html = '';
    try { html = renderSchedulePersonMatrix(assignments); }
    catch(e) { try { html = renderReadOnlySchedule(assignments); } catch(_) { html = '<div class="empty-state">ไม่พบตารางเวร</div>'; } }
    return `<div class="v119-excel-view"><h3>ตารางเวรรายเดือนแบบ Excel ${esc(state.monthKey || '')}</h3>${html}</div>`;
  }

  function renderDayCalendar(assignments, compact){
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const firstDow = new Date(y, m-1, 1).getDay();
    const cells = [];
    for (let i=0;i<firstDow;i++) cells.push({blank:true});
    for (let d=1; d<=last; d++) cells.push({day:d, date:`${y}-${pad(m)}-${pad(d)}`});
    const tail = (7 - (cells.length % 7)) % 7;
    for (let i=0;i<tail;i++) cells.push({blank:true});
    const limit = compact ? 4 : 8;
    return `<div class="v119-calendar ${compact ? 'mobile-cal' : 'desktop-cal'}">
      <div class="v119-week-head"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div>
      <div class="v119-calendar-grid">${cells.map(c => {
        if (c.blank) return `<button type="button" class="v119-day empty" disabled></button>`;
        const rows = dutiesByDate(assignments, c.date);
        const shown = rows.slice(0, limit);
        const hidden = Math.max(0, rows.length - shown.length);
        const isOff = (typeof isWeekend === 'function' && isWeekend(c.date)) || (typeof isHolidayDate === 'function' && isHolidayDate(c.date));
        return `<button type="button" class="v119-day ${isOff ? 'weekend' : ''}" data-v119-day="${c.date}">
          <div class="v119-day-num"><b>${c.day}</b><span>${parseDate(c.date).toLocaleDateString('th-TH',{weekday:'short'})}</span></div>
          ${shown.map(a => { const cs = colorStyle(a.staff_id); return `<span class="v119-duty-bar" data-v119-duty="${esc(assignmentId(a))}" style="${cs.css}">${esc(shortDuty(a.duty_code))} ${esc(nick(a.staff_id))}</span>`; }).join('')}
          ${hidden ? `<span class="v119-more">+${hidden}</span>` : ''}
        </button>`;
      }).join('')}</div>
    </div>`;
  }

  function renderPersons(assignments){
    return `<div class="v119-person-grid">${safeStaff().map(s => {
      const rows = dutiesByStaff(assignments, s.id);
      const cs = colorStyle(s.id);
      return `<button type="button" class="v119-person-card" data-v119-person="${s.id}">
        <span class="staff-chip" style="${cs.css}">${esc(s.nickname || s.full_name || '-')}</span>
        <b>${rows.length} เวร</b>
        <div>${rows.slice(0,6).map(a => `<small>${esc(thaiFull(a.duty_date))} ${esc(shortDuty(a.duty_code))}</small>`).join('') || '<small class="muted">ไม่มีเวรเดือนนี้</small>'}</div>
      </button>`;
    }).join('')}</div>`;
  }

  function countDaysOff(staffId, assignments){
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = new Set();
    for (let d=1; d<=last; d++) {
      const date = `${y}-${pad(m)}-${pad(d)}`;
      const hasDuty = assignments.some(a => String(a.staff_id) === String(staffId) && String(a.duty_date) === date);
      if (((typeof isWeekend === 'function' && isWeekend(date)) || (typeof isHolidayDate === 'function' && isHolidayDate(date))) && !hasDuty) days.add(date);
    }
    (state.leaves || []).forEach(l => {
      if (String(l.staff_id) !== String(staffId) || String(l.type) !== 'ไม่รับเวร') return;
      datesBetween(l.start_date, l.end_date).forEach(date => { if (typeof isWeekend === 'function' && isWeekend(date)) days.add(date); });
    });
    return days.size;
  }

  function renderOtCards(assignments){
    let stats = {};
    try { stats = calcFairness(assignments); } catch(e) {}
    return `<div class="v119-ot-cards">${safeStaff().map(s => {
      const rows = dutiesByStaff(assignments, s.id);
      const r = stats[s.id] || {};
      const count = (fn) => rows.filter(fn).length;
      const cs = colorStyle(s.id);
      return `<button type="button" class="v119-ot-card" data-v119-person="${s.id}">
        <span class="staff-chip" style="${cs.css}">${esc(s.nickname || s.full_name || '-')}</span>
        <div class="v119-ot-grid">
          <span>ชั่วโมงเวร/OT</span><b>${Number(r.hours || 0).toFixed(1)}</b>
          <span>ชั่วโมงอินชาร์จ</span><b>0.0</b>
          <span>รวม OT</span><b>${Number(r.hours || 0).toFixed(1)}</b>
          <span>เงินประมาณ</span><b>${Number(r.pay || 0).toLocaleString()}</b>
          <span>จำนวนเวร</span><b>${rows.length}</b>
          <span>วันที่ได้หยุด</span><b>${countDaysOff(s.id, assignments)}</b>
          <span>ชบด1</span><b>${count(a=>a.duty_code==='ชบด1')}</b>
          <span>ชบด2</span><b>${count(a=>a.duty_code==='ชบด2')}</b>
          <span>ชบด3</span><b>${count(a=>a.duty_code==='ชบด3')}</b>
          <span>ช9</span><b>${count(a=>String(a.duty_code||'').startsWith('ช9'))}</b>
          <span>ช3A</span><b>${count(a=>a.duty_code==='ช3A')}</b>
          <span>ช3B</span><b>${count(a=>a.duty_code==='ช3B')}</b>
          <span>ช4</span><b>${count(a=>String(a.duty_code||'').startsWith('ช4'))}</b>
        </div>
      </button>`;
    }).join('')}</div>`;
  }

  function renderDesktopView(assignments){
    const view = state.scheduleDesktopViewV119 || 'table';
    if (view === 'day') return renderDayCalendar(assignments, false);
    if (view === 'person') return renderPersons(assignments);
    return renderExcel(assignments);
  }
  function renderMobileView(assignments){
    const view = state.scheduleMobileViewV119 || 'day';
    if (view === 'person') return renderPersons(assignments);
    if (view === 'ot') return renderOtCards(assignments);
    if (view === 'table') return renderExcel(assignments);
    return renderDayCalendar(assignments, true);
  }

  function tradePanelSafe(assignments){
    try { return renderDutyTradePanel(assignments); } catch(e) { return ''; }
  }

  window.renderMonthlySchedulePage = renderMonthlySchedulePage = function renderMonthlySchedulePageV119(){
    if (!state.scheduleDesktopViewV119) state.scheduleDesktopViewV119 = 'table';
    if (!state.scheduleMobileViewV119) state.scheduleMobileViewV119 = 'day';
    const assignments = monthAssignments();
    return `<div class="card schedule-page-v119">
      ${renderToolbar()}
      <section class="v119-desktop-only">
        <div class="v119-tabs no-print">
          ${renderTab('table','ตารางทั้งเดือน','desktop')}
          ${renderTab('day','ดูตามวัน','desktop')}
          ${renderTab('person','ดูตามคน','desktop')}
        </div>
        <div class="v119-view">${renderDesktopView(assignments)}</div>
      </section>
      <section class="v119-mobile-only">
        <div class="v119-tabs v119-mobile-tabs no-print">
          ${renderTab('day','ดูตามวัน','mobile')}
          ${renderTab('person','ดูตามคน','mobile')}
          ${renderTab('ot','สรุป OT','mobile')}
          ${renderTab('table','ตาราง','mobile')}
        </div>
        <div class="v119-view">${renderMobileView(assignments)}</div>
      </section>
      <div class="v119-trade-panel">${tradePanelSafe(assignments)}</div>
    </div>`;
  };

  const prevRenderPage = window.renderPage || renderPage;
  window.renderPage = renderPage = function renderPageV119(){
    if (state.page === 'schedule') {
      const item = (NAV_ITEMS || []).find(x => x.id === 'schedule') || {};
      if ($('pageTitle')) $('pageTitle').textContent = item.title || 'ตารางเวรประจำเดือน';
      if ($('pageSubtitle')) $('pageSubtitle').textContent = item.subtitle || 'ดูรายเดือน Export Excel / PDF / Print';
      try { renderNav(); } catch(e) {}
      if ($('pageContent')) $('pageContent').innerHTML = renderMonthlySchedulePage();
      return;
    }
    return prevRenderPage();
  };

  document.addEventListener('click', function(e){
    const t = e.target.closest && e.target.closest('[data-v119-desktop-tab],[data-v119-mobile-tab],[data-v119-day],[data-v119-duty],[data-v119-person]');
    if (!t) return;
    if (t.dataset.v119DesktopTab) {
      e.preventDefault(); e.stopImmediatePropagation();
      state.scheduleDesktopViewV119 = t.dataset.v119DesktopTab;
      renderPage();
      return;
    }
    if (t.dataset.v119MobileTab) {
      e.preventDefault(); e.stopImmediatePropagation();
      state.scheduleMobileViewV119 = t.dataset.v119MobileTab;
      renderPage();
      return;
    }
    if (t.dataset.v119Duty) {
      e.preventDefault(); e.stopImmediatePropagation();
      const a = monthAssignments().find(x => assignmentId(x) === String(t.dataset.v119Duty));
      showDutyDetail(a);
      return;
    }
    if (t.dataset.v119Day) {
      e.preventDefault(); e.stopImmediatePropagation();
      showDayPopup(t.dataset.v119Day);
      return;
    }
    if (t.dataset.v119Person) {
      e.preventDefault(); e.stopImmediatePropagation();
      showPersonPopup(t.dataset.v119Person);
      return;
    }
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .schedule-page-v119 .v119-mobile-only{display:none}.schedule-page-v119 .v119-desktop-only{display:block}
    .schedule-page-v119 .v119-tabs{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0 16px}.schedule-page-v119 .v119-view{margin-top:8px}
    .v119-week-head{display:grid;grid-template-columns:repeat(7,1fr);gap:12px;text-align:center;color:#64748b;font-weight:700;margin:8px 0}.v119-calendar-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:12px}.v119-day{border:1px solid #dbe7f3;border-radius:16px;min-height:148px;background:#fff;padding:10px;display:block;text-align:left;overflow:hidden;cursor:pointer}.v119-day.weekend{background:#fff9e8}.v119-day.empty{background:#f8fafc;opacity:.65;cursor:default}.v119-day-num{display:flex;gap:6px;align-items:baseline;margin-bottom:8px}.v119-day-num b{font-size:18px}.v119-day-num span{color:#64748b}.v119-duty-bar{display:block;width:100%;border-radius:8px;margin:4px 0;padding:5px 8px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.v119-more{display:block;margin-top:4px;color:#64748b;font-weight:700}.v119-person-grid,.v119-ot-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}.v119-person-card,.v119-ot-card{border:1px solid #dbe7f3;border-radius:16px;background:#fff;padding:12px;text-align:left;cursor:pointer}.staff-chip{display:inline-block;border-radius:999px;padding:5px 12px;font-weight:800;margin-bottom:8px}.v119-person-card small{display:block;color:#334155;margin:3px 0}.v119-ot-grid{display:grid;grid-template-columns:1fr auto;gap:6px 10px}.v119-ot-grid span{color:#64748b}.v119-ot-grid b{color:#0f172a}.v119-trade-panel{margin-top:16px}
    @media(max-width:820px){
      .schedule-page-v119 .v119-desktop-only{display:none!important}.schedule-page-v119 .v119-mobile-only{display:block!important}.schedule-page-v119 .v119-mobile-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.schedule-page-v119 .v119-mobile-tabs button{border-radius:16px;padding:12px 5px;font-size:16px;white-space:nowrap}
      .schedule-page-v119 .v119-week-head{gap:6px;font-size:14px}.schedule-page-v119 .v119-calendar-grid{gap:6px}.schedule-page-v119 .v119-day{min-height:96px;border-radius:13px;padding:7px}.schedule-page-v119 .v119-day-num{margin-bottom:4px}.schedule-page-v119 .v119-day-num b{font-size:18px}.schedule-page-v119 .v119-duty-bar{font-size:12px;padding:3px 5px;margin:3px 0;border-radius:7px}.schedule-page-v119 .v119-more{font-size:13px}
      .schedule-page-v119 .v119-person-grid,.schedule-page-v119 .v119-ot-cards{grid-template-columns:1fr}
      .schedule-page-v119 .v119-excel-view h3{font-size:24px;margin:18px 0 14px}.schedule-page-v119 .schedule-person-matrix th:first-child{min-width:86px!important;width:86px!important;font-size:12px!important;line-height:1.05!important;padding:2px!important}.schedule-page-v119 .schedule-person-matrix td:first-child{min-width:86px!important;width:86px!important;font-size:12px!important;line-height:1.05!important;padding:2px!important}.schedule-page-v119 .schedule-person-matrix th,.schedule-page-v119 .schedule-person-matrix td{height:28px!important;min-height:28px!important;padding:2px 3px!important;font-size:11px!important;line-height:1.05!important}.schedule-page-v119 .schedule-person-matrix b,.schedule-page-v119 .schedule-person-matrix .duty-chip,.schedule-page-v119 .schedule-person-matrix span{font-size:11px!important;line-height:1.05!important}.schedule-page-v119 .schedule-person-matrix .trade-btn{display:none!important}.schedule-page-v119 .mobile-schedule-matrix-wrap{max-height:none!important}.schedule-page-v119 .table-wrap{overflow:auto!important}
    }
  `;
  document.head.appendChild(style);
})();
