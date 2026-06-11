/* CNMI Staff Planner Patch V129
   Scope:
   1) Compact Excel-like roster grid: hide ↔/trade icon in main grid, keep duty pill clickable.
   2) Reset carry-over/overtime debt for staff returning from long-term/maternity leave.
   3) Optional Admin manual reset button in balance view.
*/
(function patchV129CompactGridBalanceReset(){
  if (window.__CNMI_V129_COMPACT_GRID_BALANCE_RESET__) return;
  window.__CNMI_V129_COMPACT_GRID_BALANCE_RESET__ = true;

  const esc = (v) => {
    try { if (typeof escapeHtml === 'function') return escapeHtml(v); } catch (_) {}
    return String(v ?? '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  };
  const pad2 = n => String(n).padStart(2,'0');
  const monthKeySafe = () => String(state?.monthKey || new Date().toISOString().slice(0,7));
  const monthRangeSafe = (key=monthKeySafe()) => {
    try { if (typeof getMonthRange === 'function') return getMonthRange(key); } catch (_) {}
    const [y,m] = String(key).split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(last)}` };
  };
  const parseDateSafe = (date) => {
    try { if (typeof parseDate === 'function') return parseDate(date); } catch (_) {}
    const [y,m,d] = String(date || '').slice(0,10).split('-').map(Number);
    return new Date(y || new Date().getFullYear(), (m || 1) - 1, d || 1);
  };
  const prevMonthKey = (key=monthKeySafe()) => {
    const [y,m] = String(key).split('-').map(Number);
    const d = new Date(y, (m || 1) - 2, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
  };
  const staffById = id => (state?.staff || []).find(s => String(s.id) === String(id));
  const staffName = st => st?.nickname || st?.full_name || st?.name || '-';
  const staffRows = () => {
    const rows = (state?.staff || []).filter(s => {
      try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : true; } catch (_) { return true; }
    });
    try { return typeof orderedStaff === 'function' ? orderedStaff(rows) : rows; } catch (_) { return rows; }
  };
  const staffColorSafe = (staffOrId, alpha=false) => {
    const staff = typeof staffOrId === 'object' ? staffOrId : staffById(staffOrId);
    let color = staff?.color || '#dbeafe';
    try { if (typeof staffColor === 'function') color = staffColor(staff || staffOrId); } catch (_) {}
    if (!alpha) return color || '#dbeafe';
    const m = String(color || '').trim().match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
    if (!m) return color || '#dbeafe';
    return `rgba(${parseInt(m[1],16)},${parseInt(m[2],16)},${parseInt(m[3],16)},0.18)`;
  };
  const textColorSafe = bg => { try { if (typeof textColorFor === 'function') return textColorFor(bg); } catch (_) {} return '#0f172a'; };
  const isWeekendSafe = date => {
    try { if (typeof isWeekend === 'function') return isWeekend(date); } catch (_) {}
    const d = parseDateSafe(date).getDay(); return d === 0 || d === 6;
  };
  const isHolidaySafe = date => {
    try { if (typeof isHolidayDate === 'function') return isHolidayDate(date); } catch (_) {}
    const ds = String(date || '').slice(0,10);
    return (state?.holidays || []).some(h => String(h.holiday_date || h.date || h).slice(0,10) === ds);
  };
  const coversDate = (row,date) => {
    const ds = String(date || '').slice(0,10);
    return String(row?.start_date || '').slice(0,10) <= ds && String(row?.end_date || '').slice(0,10) >= ds;
  };
  const activeLeaveRows = (staffId, date) => (state?.leaves || []).filter(l => String(l.staff_id) === String(staffId) && String(l.status || 'active').toLowerCase() !== 'cancelled' && coversDate(l, date));
  const hasNoDuty = (staffId,date) => activeLeaveRows(staffId,date).some(l => String(l.type || '').trim() === 'ไม่รับเวร');
  const hasMatLeave = (staffId,date) => activeLeaveRows(staffId,date).some(l => String(l.type || '').includes('ลาคลอด'));
  const targetValue = st => {
    const raw = st?.target_shifts ?? st?.monthly_target_shifts ?? st?.roster_quota ?? st?.quota ?? st?.target_duty_count;
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  };
  const monthIsFullyLeave = (staffId,key) => {
    const r = monthRangeSafe(key);
    const last = new Date(r.y, r.m, 0).getDate();
    const workdays = Array.from({length:last},(_,i)=>`${r.y}-${pad2(r.m)}-${pad2(i+1)}`).filter(d => !isWeekendSafe(d) && !isHolidaySafe(d));
    if (!workdays.length) return false;
    return workdays.every(d => activeLeaveRows(staffId,d).some(l => String(l.type || '').trim() !== 'ไม่รับเวร'));
  };
  function isLongTermExcluded(staff,key=monthKeySafe()){
    if (!staff) return false;
    const t = targetValue(staff);
    const flag = staff.isLongTermLeave === true || staff.is_long_term_leave === true || String(staff.leave_status || '').includes('ลาคลอด') || String(staff.leave_status || '').includes('ลาระยะยาว');
    const r = monthRangeSafe(key);
    const matWholeMonth = (state?.leaves || []).some(l => String(l.staff_id) === String(staff.id) && String(l.status || 'active').toLowerCase() !== 'cancelled' && String(l.type || '').includes('ลาคลอด') && String(l.start_date || '').slice(0,10) <= r.start && String(l.end_date || '').slice(0,10) >= r.end);
    return Boolean(flag || t === 0 || matWholeMonth || monthIsFullyLeave(staff.id, key));
  }
  window.isLongTermExcludedStaffV129 = isLongTermExcluded;
  function isReturningFromLongLeave(staff,key=monthKeySafe()){
    const currentTarget = targetValue(staff);
    const currentActive = (currentTarget === null || currentTarget > 0) && !isLongTermExcluded(staff, key);
    return currentActive && isLongTermExcluded(staff, prevMonthKey(key));
  }
  function manualResetKey(staffId,key=monthKeySafe()){ return `cnmi.v129.balanceReset.${key}.${staffId}`; }
  function hasManualReset(staffId,key=monthKeySafe()){ try { return localStorage.getItem(manualResetKey(staffId,key)) === '1'; } catch (_) { return false; } }
  function setManualReset(staffId,key=monthKeySafe()){ try { localStorage.setItem(manualResetKey(staffId,key),'1'); } catch (_) {} }
  function shouldResetBalance(staff,key=monthKeySafe()){ return isReturningFromLongLeave(staff,key) || hasManualReset(staff.id,key); }

  function normalizeDuty(code=''){
    const c = String(code || '').trim();
    if (c.startsWith('ช4') || ['ช4A','ช4B','ช4-1','ช4-2','ช4-MT/แตง 1','ช4-MT/แตง 2'].includes(c)) return 'ช4';
    if (c.startsWith('ช9')) return 'ช9';
    return c;
  }
  function dutyHours(date, code){
    const c = normalizeDuty(code);
    if (c === 'ช4') return 0;
    const off = isWeekendSafe(date) || isHolidaySafe(date);
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return off ? 24 : 16;
    if (['ช3A','ช3B','ช9'].includes(c)) return 8;
    return 0;
  }
  function dutyUnits(date, code){
    const c = normalizeDuty(code);
    if (c === 'ช4') return 0;
    if (['ชบด1','ชบด2','ชบด3'].includes(c)) return (isWeekendSafe(date) || isHolidaySafe(date)) ? 3 : 2;
    if (['ช3A','ช3B','ช9'].includes(c)) return 1;
    return 0;
  }
  function assignmentsForMonth(key=monthKeySafe()){
    try { if (typeof getAssignmentsForMonth === 'function') return getAssignmentsForMonth(key) || []; } catch (_) {}
    const r = monthRangeSafe(key);
    return (state?.rosterAssignments || []).filter(a => String(a.duty_date || '').slice(0,10) >= r.start && String(a.duty_date || '').slice(0,10) <= r.end);
  }
  function assignmentKey(a){ return String(a?.id || a?._temp_id || `${a?.duty_date || ''}|${a?.duty_code || ''}|${a?.staff_id || ''}`); }

  // Part 1: Re-render Excel grid without ↔ button. Duty pill itself remains clickable.
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix = function renderSchedulePersonMatrixV129(assignments){
    const key = monthKeySafe();
    const r = monthRangeSafe(key);
    const last = new Date(r.y, r.m, 0).getDate();
    const days = Array.from({length:last},(_,i)=>i+1);
    const rows = staffRows().map(st => {
      const strong = staffColorSafe(st);
      const rowBg = staffColorSafe(st,true);
      const fg = textColorSafe(strong);
      const cells = days.map(day => {
        const date = `${r.y}-${pad2(r.m)}-${pad2(day)}`;
        const dutyRows = (assignments || []).filter(a => String(a.staff_id) === String(st.id) && String(a.duty_date || '').slice(0,10) === date);
        const noDuty = hasNoDuty(st.id,date);
        const mat = isLongTermExcluded(st,key) || hasMatLeave(st.id,date);
        const cls = [isWeekendSafe(date)?'weekend-cell':'', isHolidaySafe(date)?'holiday-cell':'', noDuty?'v129-noduty-cell':'', mat?'v129-matleave-cell':'', dutyRows.length?'has-duty-cell':''].filter(Boolean).join(' ');
        let inner = '';
        if (mat) {
          inner = `<span class="v129-leave-label v129-matleave-label">ลาคลอด</span>`;
        } else if (dutyRows.length) {
          inner = dutyRows.map(a => `<button type="button" class="v129-duty-pill v128-duty-pill" data-v129-duty="${esc(assignmentKey(a))}" title="คลิกเพื่อจัดการเวร ${esc(normalizeDuty(a.duty_code))}">${esc(normalizeDuty(a.duty_code))}</button>`).join('');
          if (noDuty) inner += `<span class="v129-leave-label v129-noduty-label">ไม่รับเวร</span>`;
        } else if (noDuty) {
          inner = `<span class="v129-leave-label v129-noduty-label">ไม่รับเวร</span>`;
        }
        return `<td class="${cls}">${inner}</td>`;
      }).join('');
      return `<tr style="--row-bg:${rowBg};--staff-bg:${strong};--staff-fg:${fg}"><th class="v129-staff-head v128-staff-head" style="background:${strong};color:${fg}">${esc(staffName(st))}</th>${cells}</tr>`;
    }).join('');
    return `<div class="table-wrap mobile-schedule-matrix-wrap v127-schedule-grid-wrap v128-schedule-grid-wrap v129-schedule-grid-wrap"><table id="scheduleTable" class="schedule-person-matrix v127-colored-grid v128-colored-grid v129-colored-grid"><thead><tr><th class="v129-staff-head">เจ้าหน้าที่</th>${days.map(day => { const date = `${r.y}-${pad2(r.m)}-${pad2(day)}`; return `<th>${day}<br><span>${parseDateSafe(date).toLocaleDateString('th-TH',{weekday:'short'})}</span></th>`; }).join('')}</tr></thead><tbody>${rows}</tbody></table></div>`;
  };

  function buildBalanceRowsV129(assignments=assignmentsForMonth(monthKeySafe()), key=monthKeySafe()){
    const people = staffRows();
    const current = {};
    people.forEach(st => current[st.id] = { shifts:0, hours:0 });
    (assignments || []).filter(a => a.staff_id).forEach(a => {
      const row = current[a.staff_id] || (current[a.staff_id] = { shifts:0, hours:0 });
      row.shifts += dutyUnits(a.duty_date, a.duty_code);
      row.hours += dutyHours(a.duty_date, a.duty_code);
    });
    const months = Array.from(new Set((state?.rosterAssignments || []).map(a => String(a.duty_date || '').slice(0,7)).filter(mk => mk >= '2026-07' && mk < key))).sort();
    const hist = {};
    people.forEach(st => hist[st.id] = { historicalHours:0, specialAdjustment:Number(st.special_adjustment_hours ?? st.balance_adjustment_hours ?? st.carry_over_hours ?? 0) || 0, reset:shouldResetBalance(st,key), returning:isReturningFromLongLeave(st,key), excluded:isLongTermExcluded(st,key) });
    months.forEach(mk => {
      assignmentsForMonth(mk).forEach(a => {
        if (!a?.staff_id || !hist[a.staff_id]) return;
        const st = staffById(a.staff_id);
        if (!st || hist[a.staff_id].reset || isLongTermExcluded(st,mk)) return;
        hist[a.staff_id].historicalHours += dutyHours(a.duty_date, a.duty_code);
      });
    });
    const included = people.filter(st => !isLongTermExcluded(st,key));
    const avgCurrent = included.length ? included.reduce((s,st)=>s+Number(current[st.id]?.shifts||0),0)/included.length : 0;
    const avgHist = included.filter(st => !hist[st.id]?.reset).length ? included.filter(st => !hist[st.id]?.reset).reduce((s,st)=>s+Number(hist[st.id]?.historicalHours||0),0)/included.filter(st => !hist[st.id]?.reset).length : 0;
    people.forEach(st => {
      if (hist[st.id].excluded || hist[st.id].reset) hist[st.id].overtimeBalance = 0;
      else hist[st.id].overtimeBalance = Number(hist[st.id].historicalHours || 0) - avgHist + Number(hist[st.id].specialAdjustment || 0);
      const rawTarget = targetValue(st);
      hist[st.id].target = rawTarget !== null && rawTarget > 0 ? rawTarget : avgCurrent;
    });
    return { people, current, hist, avgCurrent };
  }
  function staffPillHtml(st){
    try { if (typeof staffPill === 'function') return staffPill(st.id); } catch (_) {}
    const bg = staffColorSafe(st); return `<span class="staff-chip" style="background:${bg};color:${textColorSafe(bg)}">${esc(staffName(st))}</span>`;
  }
  function renderBalanceViewV129(assignments){
    const key = monthKeySafe();
    const { people, current, hist } = buildBalanceRowsV129(assignments, key);
    const rows = people.map(st => {
      const cur = current[st.id] || { shifts:0, hours:0 };
      const h = hist[st.id] || {};
      const adminReset = (typeof isAdmin === 'function' ? isAdmin() : true) ? `<button type="button" class="tiny-btn v129-reset-balance" data-v129-reset-balance="${esc(st.id)}">Reset ยอดสะสม</button>` : '';
      if (h.excluded) {
        return `<tr class="v129-excluded"><td>${staffPillHtml(st)}<small>${esc(st.staff_type || st.position || '')}</small></td><td><b>0</b> / 0<small>ไม่นำเข้าสมการ</small></td><td>0 ชม.<small>ไม่หักลบเป้าหมาย</small></td><td><span class="v129-status excluded">ยกเว้น/ลาคลอด</span>${adminReset}</td></tr>`;
      }
      const target = Number(h.target || 0);
      const gap = target - Number(cur.shifts || 0);
      const resetNote = h.reset ? (h.returning ? 'รีเซ็ตอัตโนมัติหลังกลับจากลาระยะยาว' : 'รีเซ็ตโดยแอดมิน') : `ประวัติ ${Number(h.historicalHours || 0).toFixed(1)} ชม.`;
      const over = Number(h.overtimeBalance || 0);
      let status = 'สมดุล', cls = 'ok';
      if (Number(cur.shifts || 0) > target + 1 || over > 8) { status = 'งานหนักเกิน'; cls = 'heavy'; }
      else if (Number(cur.shifts || 0) < target - 1) { status = 'ขาดเวร'; cls = 'lack'; }
      if (h.reset) { status = 'เริ่มใหม่'; cls = 'reset'; }
      return `<tr><td>${staffPillHtml(st)}<small>${esc(st.staff_type || st.position || '')}</small></td><td><b>${Number(cur.shifts||0).toFixed(1).replace(/\.0$/,'')}</b> / ${Number(target||0).toFixed(1).replace(/\.0$/,'')}<small>${gap > 0 ? `ขาด ${gap.toFixed(1).replace(/\.0$/,'')}` : gap < 0 ? `เกิน ${Math.abs(gap).toFixed(1).replace(/\.0$/,'')}` : 'พอดี'}</small></td><td>${over >= 0 ? '+' : ''}${over.toFixed(1)} ชม.<small>${esc(resetNote)}</small></td><td><span class="v129-status ${cls}">${status}</span>${adminReset}</td></tr>`;
    }).join('');
    return `<div class="v129-balance-view"><div class="notice soft-notice"><b>ดูสมดุลเวร</b><br>ถ้าเดือนก่อนเป็นลาคลอด/ลาระยะยาวหรือ target = 0 แล้วเดือนนี้กลับมาทำงาน ระบบจะล้างยอดสะสมติดลบเป็น 0 อัตโนมัติ และไม่เอาหนี้จากเดือนลามาทบ</div><div class="table-wrap"><table class="v129-balance-table"><thead><tr><th>ชื่อ-สกุล / ตำแหน่ง</th><th>จัดแล้ว / เป้าหมาย</th><th>ยอดชดเชยเวรสะสม</th><th>Status / จัดการ</th></tr></thead><tbody>${rows || '<tr><td colspan="4">ไม่มีข้อมูล</td></tr>'}</tbody></table></div></div>`;
  }
  function replaceBalanceViewIfNeeded(){
    if (state?.page !== 'schedule') return;
    const dview = state.scheduleDesktopViewV125 || state.scheduleDesktopViewV121 || 'table';
    const mview = state.scheduleMobileViewV125 || state.scheduleMobileViewV121 || 'day';
    if (dview !== 'balance' && mview !== 'balance') return;
    const old = document.querySelector('.v127-balance-view,.v125-balance-view');
    if (!old) return;
    old.outerHTML = renderBalanceViewV129(assignmentsForMonth(monthKeySafe()));
  }
  const prevRenderPage = window.renderPage;
  window.renderPage = renderPage = function renderPageV129(){
    const out = prevRenderPage ? prevRenderPage.apply(this, arguments) : undefined;
    try { replaceBalanceViewIfNeeded(); } catch (err) { console.warn('V129 balance replace failed', err); }
    return out;
  };

  const prevFindBest = window.findBestSubstitute;
  window.findBestSubstitute = function findBestSubstituteV129(shiftDetails, staffList=[], historicalData={}){
    const key = String(shiftDetails?.duty_date || shiftDetails?.date || monthKeySafe()).slice(0,7);
    const list = (staffList && staffList.length ? staffList : staffRows()).filter(st => !isLongTermExcluded(st,key));
    if (historicalData && historicalData.rows) {
      list.forEach(st => {
        if (!historicalData.rows[st.id]) historicalData.rows[st.id] = {};
        if (shouldResetBalance(st,key)) {
          historicalData.rows[st.id].overtimeBalance = 0;
          historicalData.rows[st.id].historicalHours = 0;
          historicalData.rows[st.id].specialAdjustment = 0;
          historicalData.rows[st.id].resetFromLongLeave = true;
        }
      });
    }
    if (typeof prevFindBest === 'function') return prevFindBest.call(this, shiftDetails, list, historicalData);
    return list[0] || null;
  };

  document.addEventListener('click', function(e){
    const dutyBtn = e.target.closest?.('[data-v129-duty]');
    if (dutyBtn) {
      e.preventDefault(); e.stopImmediatePropagation();
      const id = String(dutyBtn.dataset.v129Duty || '');
      const a = assignmentsForMonth(monthKeySafe()).find(x => assignmentKey(x) === id);
      if (a && typeof showTradeRequestModal === 'function') showTradeRequestModal(a);
      else if (a && typeof showTradeModal === 'function' && a.id) showTradeModal(a.id);
      else if (a && typeof showModal === 'function') showModal(`<h2>จัดการเวร</h2><p>${esc(a.duty_date)} • ${esc(normalizeDuty(a.duty_code))} • ${esc(staffName(staffById(a.staff_id)))}</p><button class="primary-btn" data-page="tradeRequests">ไปหน้าคำขอแลก/ขายเวร</button>`);
      return;
    }
    const reset = e.target.closest?.('[data-v129-reset-balance]');
    if (reset) {
      e.preventDefault(); e.stopImmediatePropagation();
      const staffId = reset.dataset.v129ResetBalance;
      setManualReset(staffId, monthKeySafe());
      try { if (typeof showToast === 'function') showToast('รีเซ็ตยอดสะสมเป็น 0 แล้ว'); } catch (_) {}
      try { if (typeof renderPage === 'function') renderPage(); } catch (_) {}
    }
  }, true);

  const css = document.createElement('style');
  css.textContent = `
    /* V129: make roster grid compact and hide ↔ / trade icon completely */
    .v129-schedule-grid-wrap{overflow:auto!important;-webkit-overflow-scrolling:touch;max-width:100%}
    .v129-colored-grid{border-collapse:collapse!important;table-layout:fixed!important;min-width:980px;width:max-content}
    .v129-colored-grid th,.v129-colored-grid td{padding:4px 6px!important;line-height:1.05!important;vertical-align:middle!important;height:22px!important;min-height:0!important}
    .v129-colored-grid thead th{font-size:10.5px!important;padding:3px 4px!important;white-space:normal!important}
    .v129-colored-grid tbody td{background:var(--row-bg)!important;font-size:10.5px!important;text-align:center!important;white-space:normal!important;word-break:break-word!important;overflow-wrap:anywhere!important}
    .v129-colored-grid tbody th.v129-staff-head{position:sticky;left:0;z-index:4;min-width:78px!important;max-width:96px!important;font-size:10.5px!important;white-space:normal!important;word-break:break-word!important}
    .v129-duty-pill{display:inline-block;border:0;border-radius:7px;background:rgba(255,255,255,.78);color:#0f172a;font-weight:800;font-size:10px!important;line-height:1!important;padding:2px 4px!important;margin:0!important;cursor:pointer!important;box-shadow:inset 0 0 0 1px rgba(15,23,42,.08)}
    .v129-duty-pill:hover{filter:brightness(.96);box-shadow:0 0 0 2px rgba(37,99,235,.14), inset 0 0 0 1px rgba(37,99,235,.26)}
    .v129-colored-grid .trade-btn,.v129-colored-grid .v128-trade-click,.v129-colored-grid .v128-trade-btn,.v129-colored-grid .trade-btn::after{display:none!important;visibility:hidden!important;width:0!important;height:0!important;margin:0!important;padding:0!important;content:none!important}
    .v129-leave-label{display:inline-block;border-radius:6px;font-size:9.5px!important;font-weight:800;line-height:1!important;padding:2px 3px!important;margin:0!important;white-space:nowrap!important}
    .v129-noduty-label{background:#ffedd5;color:#9a3412;border:1px solid #fdba74}
    .v129-matleave-label{background:#fce7f3;color:#9d174d;border:1px solid #f9a8d4}
    .v129-colored-grid tbody td.weekend-cell,.v129-colored-grid tbody td.holiday-cell{background:color-mix(in srgb, var(--row-bg) 72%, #fff7ed)!important}
    .v129-colored-grid tbody td.v129-noduty-cell{box-shadow:inset 0 0 0 1px rgba(251,146,60,.35)}
    .v129-colored-grid tbody td.v129-matleave-cell{box-shadow:inset 0 0 0 1px rgba(236,72,153,.35)}
    .v129-balance-table td small{display:block;color:#64748b;margin-top:3px;font-size:12px}.v129-balance-table .tiny-btn{margin-top:4px;padding:3px 7px;font-size:11px}.v129-status{display:inline-block;border-radius:999px;padding:4px 10px;font-weight:800;white-space:nowrap}.v129-status.ok{background:#dcfce7;color:#166534}.v129-status.lack{background:#fef9c3;color:#854d0e}.v129-status.heavy{background:#fee2e2;color:#991b1b}.v129-status.excluded{background:#e0f2fe;color:#075985}.v129-status.reset{background:#ede9fe;color:#5b21b6}
    @media(max-width:760px){.v129-schedule-grid-wrap{margin:0 -8px;padding-bottom:8px;overflow-x:auto!important;background:#fff;border-radius:14px}.v129-colored-grid{min-width:900px!important;width:max-content!important}.v129-colored-grid th,.v129-colored-grid td{height:20px!important;padding:2px 3px!important}.v129-duty-pill,.v129-leave-label{font-size:9px!important;padding:1px 3px!important}.v129-colored-grid tbody th.v129-staff-head{font-size:9.5px!important;min-width:72px!important;max-width:84px!important}}
    @media print{body.print-schedule-grid .v129-colored-grid th,body.print-schedule-grid .v129-colored-grid td{padding:1px 2px!important;height:auto!important;font-size:7.5px!important;line-height:1!important}body.print-schedule-grid .v129-duty-pill,body.print-schedule-grid .v129-leave-label{font-size:6.8px!important;padding:1px!important;box-shadow:none!important}body.print-schedule-grid .v129-colored-grid tbody tr,body.print-schedule-grid .v129-colored-grid tbody td{background:var(--row-bg)!important;print-color-adjust:exact!important;-webkit-print-color-adjust:exact!important}}
  `;
  document.head.appendChild(css);

  try { if (state?.page === 'schedule' && typeof renderPage === 'function') renderPage(); } catch (_) {}
})();
