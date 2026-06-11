/* v130: Compact monthly roster grid + freeze staff column + holiday column highlight + Supabase orphan tools hook
   Scope: UI ตารางเวรรายเดือนแบบ Excel เท่านั้น ไม่แตะ logic จัดเวร/OT/rebalance */
(function(){
  'use strict';

  function safe(fn, fallback){
    try { return fn(); } catch(e) { console.warn('[v130]', e); return fallback; }
  }

  function isHolidayLike(date){
    return safe(() => isWeekend(date) || isHolidayDate(date), false);
  }

  function dayHeader(y, m, day){
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const dow = safe(() => parseDate(date).toLocaleDateString('th-TH', { weekday:'short' }), '');
    const cls = isHolidayLike(date) ? 'cnmi-holiday-col' : '';
    const title = safe(() => isHolidayDate(date) ? holidayName(date) : '', '');
    return `<th class="${cls}" title="${escapeHtml(title || dow)}"><b>${day}</b><br><span>${escapeHtml(dow)}</span></th>`;
  }

  function shiftDisplayCode(code){
    const raw = String(code || '');
    if (raw.startsWith('ช4')) return 'ช4';
    return escapeHtml(DUTY_LABEL?.[raw] || raw || '-');
  }

  function canClickShift(slot){
    try { return !!(slot && slot.id && (typeof canRequestTrade !== 'function' || canRequestTrade(slot))); }
    catch(_) { return !!slot?.id; }
  }

  function shiftPill(slot, staff){
    if (!slot || !slot.staff_id) return '';
    const bg = safe(() => staffColor(staff || slot.staff_id), '#e8f3ff');
    const fg = safe(() => textColorFor(bg), '#203245');
    const code = shiftDisplayCode(slot.duty_code);
    const dateText = escapeHtml(slot.duty_date || '');
    const title = `${escapeHtml(staff?.nickname || staff?.full_name || '')} ${code} ${dateText}`;
    const clickable = canClickShift(slot);
    const attrs = clickable ? `type="button" data-trade-duty="${escapeHtml(slot.id)}"` : 'type="button" disabled';
    return `<button class="cnmi-v130-shift-pill" ${attrs} style="--staff-bg:${bg};--staff-fg:${fg}" title="${title}">${code}</button>`;
  }

  function noDutyBadge(staff, date){
    const rows = (state.leaveRequests || []).filter(r => r.staff_id === staff.id && r.request_type === 'ไม่รับเวร' && r.status !== 'cancelled' && r.start_date <= date && r.end_date >= date);
    return rows.length ? '<span class="cnmi-v130-noduty">ไม่รับเวร</span>' : '';
  }

  function longLeaveBadge(staff, date){
    const longFlag = staff.isLongTermLeave === true || staff.maternity_status === true || staff.long_term_leave === true;
    const rows = (state.leaveRequests || []).filter(r => r.staff_id === staff.id && r.status !== 'cancelled' && r.start_date <= date && r.end_date >= date && /ลาคลอด|ระยะยาว|long|maternity/i.test(String(r.request_type || r.leave_type || r.reason || '')));
    return (longFlag || rows.length) ? '<span class="cnmi-v130-longleave">ลาคลอด</span>' : '';
  }

  function renderV130ScheduleMatrix(assignments, opts={}){
    if (!assignments || !assignments.length) return typeof empty === 'function' ? empty('ยังไม่มีตารางเวรของเดือนนี้') : '<div>ยังไม่มีตารางเวรของเดือนนี้</div>';
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({length:last}, (_,i)=>i+1);
    const active = orderedStaff(state.staff.filter(s => isRosterEnabled(s)));
    const tableId = opts.tableId || 'scheduleTable';

    return `<div class="table-wrap cnmi-v130-grid-wrap ${opts.mobile ? 'cnmi-v130-mobile-wrap' : 'desktop-schedule-table'}">
      <table id="${tableId}" class="schedule-person-matrix cnmi-v130-schedule-grid">
        <thead><tr><th class="cnmi-sticky-staff-col">เจ้าหน้าที่</th>${days.map(day => dayHeader(y,m,day)).join('')}</tr></thead>
        <tbody>${active.map((staff, rowIdx) => {
          return `<tr class="${rowIdx % 2 ? 'cnmi-zebra-row' : ''}">
            <th class="cnmi-sticky-staff-col"><span class="cnmi-v130-staff-name">${escapeHtml(staff.nickname || staff.full_name || '-')}</span><small>${escapeHtml(staff.staff_type || staff.position || '')}</small></th>
            ${days.map(day => {
              const date = `${y}-${pad(m)}-${pad(day)}`;
              const holidayCls = isHolidayLike(date) ? 'cnmi-holiday-col' : '';
              const slots = assignments.filter(a => a.staff_id === staff.id && a.duty_date === date);
              const content = longLeaveBadge(staff, date) || (slots.length ? slots.map(slot => shiftPill(slot, staff)).join('') : noDutyBadge(staff, date));
              return `<td class="${holidayCls}">${content || ''}</td>`;
            }).join('')}
          </tr>`;
        }).join('')}</tbody>
      </table>
    </div>`;
  }

  const oldRenderReadOnlySchedule = window.renderReadOnlySchedule;
  window.renderSchedulePersonMatrix = function(assignments){
    return renderV130ScheduleMatrix(assignments, { mobile:true, tableId:'scheduleTableMobile' });
  };

  window.renderReadOnlySchedule = function(assignments){
    if (!assignments || !assignments.length) return typeof empty === 'function' ? empty('ยังไม่มีตารางเวรของเดือนนี้') : '<div>ยังไม่มีตารางเวรของเดือนนี้</div>';
    const desktop = renderV130ScheduleMatrix(assignments, { tableId:'scheduleTable' });
    const mobile = `<div class="mobile-schedule-view">${typeof renderMobileScheduleView === 'function' ? renderMobileScheduleView(assignments) : ''}</div>`;
    return desktop + mobile;
  };

  // Export helper: scheduleTable now points to the Excel-like staff x date matrix.
  window.exportScheduleExcel = function(){
    if (typeof exportTable === 'function') return exportTable('scheduleTable', `Roster_${state.monthKey}.xlsx`);
  };

  // Small admin helper button: show orphan profiles hint when users page exists without changing DB from browser.
  window.cnmiV130SupabaseOrphanNote = function(){
    return `ดูไฟล์ supabase_orphan_profiles_fix.sql และ tools/fix-orphan-profiles.mjs ใน zip นี้ ห้ามใส่ service_role key ใน browser`;
  };
})();
