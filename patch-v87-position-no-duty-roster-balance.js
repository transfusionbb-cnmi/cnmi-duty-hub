/* CNMI Duty Hub V87: position no-duty allowance + roster empty-slot rebalance
   Patch-only. Load after v86. No SQL/schema changes.
   Goals:
   1) Monthly/daily positions block only true leave types, not "ไม่รับเวร".
   2) Roster: adjacent-duty rule applies only to ชบด1/ชบด2/ชบด3; other short shifts do not count as adjacent-duty blockers.
   3) Add "ปรับสมดุลช่องว่างทั้งเดือน" button for scheduler. It fills only empty unlocked slots and does not change slots already assigned by Admin.
*/
(function(){
  const PATCH = 'v87-position-no-duty-roster-balance';
  function safe(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))); }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function parseD(d){ return safe(() => parseDate(d), new Date(String(d || '').slice(0,10))); }
  function dateInput(d){ return safe(() => toDateInput(d), `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`); }
  function toast(msg){ return safe(() => showToast(msg), console.log(msg)); }
  function render(){ return safe(() => renderPage(), null); }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function currentStaff(){ return safe(() => currentStaffId(), null); }
  function staffOrder(st){ return safe(() => staffOrderIndex(st), 9999); }
  function compareStaff(a,b){ return safe(() => compareStaffOrder(a,b), staffOrder(a)-staffOrder(b)); }
  function monthRange(key){ return safe(() => getMonthRange(key), (() => { const [y,m] = String(key || '').split('-').map(Number); return {y,m,start:`${y}-${pad2(m)}-01`,end:`${y}-${pad2(m)}-${pad2(new Date(y,m,0).getDate())}`}; })()); }
  function dutyLabel(code){ return safe(() => DUTY_LABEL[code] || code || '-', code || '-'); }
  function dutyCols(){ return safe(() => DUTY_COLUMNS, ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT']).slice(); }
  function staffNickX(id){ return safe(() => staffNick(id), '-'); }
  function findStaff(id){ return S()?.staff?.find(x => x.id === id) || null; }

  const BOD = new Set(['ชบด1','ชบด2','ชบด3']);
  function isBodDuty(code){ return BOD.has(String(code || '')); }
  function dutyGroup(code){
    code = String(code || '');
    if (BOD.has(code)) return 'ชบด';
    if (code === 'ช4A' || code === 'ช4B') return 'ช4';
    if (code === 'ช3A' || code === 'ช3B') return 'ช3A/B';
    if (code.startsWith('ช9')) return 'ช9';
    return code || '-';
  }
  function dayGroup(date){
    if (safe(() => isHolidayDate(date), false) || safe(() => isWeekend(date), false)) return 'วันหยุด/นักขัต';
    const dow = parseD(date).getDay();
    if (dow === 1) return 'จันทร์';
    if (dow === 5) return 'ศุกร์';
    return 'วันธรรมดา';
  }
  function slotId(slot){ return slot?.id || slot?._temp_id || `${slot?.duty_date}|${slot?.duty_code}`; }

  // ---------- Position leave rules: block only true leave, not no-duty ----------
  function isTrueLeaveType(type){
    const t = String(type || '').trim();
    return t.startsWith('ลา') && t !== 'ไม่รับเวร';
  }
  function isPositionBlockingLeaveOn(staffId, date){
    const st = S();
    return !!st?.leaves?.some(l => l.staff_id === staffId && isTrueLeaveType(l.type) && safe(() => overlapsDate(l, date), l.start_date <= date && l.end_date >= date && l.status !== 'cancelled'));
  }

  // Expose helper for debugging without changing schema.
  window.cnmiV87IsPositionBlockingLeaveOn = isPositionBlockingLeaveOn;

  const originalPositionCandidateOk = safe(() => positionCandidateOk, null);
  window.positionCandidateOk = positionCandidateOk = function(staff, positionRow, date){
    date = date || safe(() => todayStr(), new Date().toISOString().slice(0,10));
    if (!staff) return false;
    const eligibilityKey = positionRow?.eligibility_code || positionRow?.code || positionRow?.position_code;
    return safe(() => isDailyPositionEnabled(staff), !!staff?.is_active)
      && !isPositionBlockingLeaveOn(staff.id, date)
      && safe(() => positionRuleOk(staff, positionRow?.main_rule), true)
      && safe(() => positionEligible(staff, eligibilityKey), true);
  };

  window.dailyWorkingStaff = dailyWorkingStaff = function(date){
    const st = S();
    const list = (st?.staff || []).filter(s => safe(() => isDailyPositionEnabled(s), !!s?.is_active) && !isPositionBlockingLeaveOn(s.id, date));
    return safe(() => orderedStaff(list), list);
  };

  // Make monthly-position cells treat only true leave as blocked. "ไม่รับเวร" remains editable/assignable.
  if (typeof renderMonthPositionCell === 'function') {
    window.renderMonthPositionCell = renderMonthPositionCell = function(staff, date, cellRows, canEdit=false){
      const noDay = safe(() => isNoPositionDay(date), false);
      const leave = isPositionBlockingLeaveOn(staff.id, date);
      const outing = safe(() => hasOuting(date), false);
      if (noDay) return `<td class="matrix-cell no-position-day"><span>${safe(() => isHolidayDate(date), false) ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
      const row = (cellRows || [])[0] || null;
      const cleanCodes = (cellRows || []).map(r => safe(() => positionLabelForCell(r.position_code || r.code), r.position_code || r.code || ''));
      const cls = `${outing ? 'outing-cell' : ''} ${leave ? 'leave-cell' : ''} ${!cleanCodes.length && !leave ? 'needs-review-cell' : ''}`.trim();
      if (canEdit && !leave) {
        const current = row?.position_code || '';
        const templates = safe(() => ALL_POSITION_TEMPLATES, []);
        return `<td class="matrix-cell ${cls}"><select class="month-position-select" data-month-position-edit="${date}|${staff.id}"><option value="">รอตรวจสอบ</option>${templates.map(t => `<option value="${esc(t.code)}" ${current===t.code?'selected':''}>${esc(safe(() => positionLabelForCell(t.code), t.code))}</option>`).join('')}</select>${outing ? '<div class="cell-note">ออกหน่วย</div>' : ''}</td>`;
      }
      const text = cleanCodes.length ? cleanCodes.join('<br>') : (leave ? 'ลา' : 'รอตรวจสอบ');
      const leaveMark = leave ? '<div class="cell-note">ไม่ต้องจัดตำแหน่ง</div>' : '';
      const outingMark = outing && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : '';
      return `<td class="matrix-cell ${cls}"><span>${text}</span>${leaveMark}${outingMark}</td>`;
    };
  }

  // Monthly position summary should subtract only true leave days, not no-duty days.
  if (typeof buildMonthPositionSummary === 'function') {
    window.buildMonthPositionSummary = buildMonthPositionSummary = function(rows, dates){
      const dateSet = new Set(dates || []);
      const summary = {};
      (rows || []).forEach(r => {
        if (!r.staff_id || !r.work_date || (dateSet.size && !dateSet.has(r.work_date))) return;
        if (safe(() => isNoPositionDay(r.work_date), false)) return;
        if (isPositionBlockingLeaveOn(r.staff_id, r.work_date)) return;
        const st = findStaff(r.staff_id);
        if (!st || !safe(() => isDailyPositionEnabled(st), true)) return;
        summary[r.staff_id] = summary[r.staff_id] || { zones:{}, positions:{}, dates:new Set(), rows:[] };
        const zone = r.zone || 'ไม่ระบุห้อง';
        const code = r.position_code || 'ไม่ระบุตำแหน่ง';
        summary[r.staff_id].zones[zone] = (summary[r.staff_id].zones[zone] || 0) + 1;
        summary[r.staff_id].positions[code] = (summary[r.staff_id].positions[code] || 0) + 1;
        summary[r.staff_id].dates.add(r.work_date);
        summary[r.staff_id].rows.push(r);
      });
      return summary;
    };
  }

  // ---------- Roster adjacent rule: only ชบด1/2/3 are consecutive-duty blockers ----------
  function hasDutyOnSameDate(staffId, date, assignments, excludeSlot){
    const ex = slotId(excludeSlot);
    const inDraft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || slotId(a) !== ex));
    const inSaved = (S()?.rosterAssignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || slotId(a) !== ex));
    return inDraft || inSaved;
  }
  function hasBodDutyOnDate(staffId, date, assignments, excludeSlot){
    const ex = slotId(excludeSlot);
    const inDraft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && isBodDuty(a.duty_code) && (!ex || slotId(a) !== ex));
    const inSaved = (S()?.rosterAssignments || []).some(a => a.staff_id === staffId && a.duty_date === date && isBodDuty(a.duty_code) && (!ex || slotId(a) !== ex));
    return inDraft || inSaved;
  }
  window.hasAdjacentDuty = hasAdjacentDuty = function(staffId, date, assignments=[], excludeSlot=null){
    // If target slot is not ชบด, do not block by adjacent duty.
    if (excludeSlot && !isBodDuty(excludeSlot.duty_code)) return false;
    const d = parseD(date);
    const prev = new Date(d); prev.setDate(d.getDate()-1);
    const next = new Date(d); next.setDate(d.getDate()+1);
    return hasBodDutyOnDate(staffId, dateInput(prev), assignments, excludeSlot) || hasBodDutyOnDate(staffId, dateInput(next), assignments, excludeSlot);
  };

  function rosterBlockedOnDate(staffId, date){
    const st = S();
    // Roster still respects all leave/no-duty records. Only position-month ignores no-duty.
    return !!st?.leaves?.some(l => l.staff_id === staffId && safe(() => overlapsDate(l, date), l.start_date <= date && l.end_date >= date && l.status !== 'cancelled'));
  }
  window.canStaffWorkSlot = canStaffWorkSlot = function(staffId, slot, assignments){
    assignments = assignments || safe(() => getAssignmentsForMonth(S()?.monthKey), []);
    const staff = findStaff(staffId);
    if (!safe(() => isRosterEnabled(staff), !!staff?.is_active)) return false;
    if (!safe(() => supportsRequiredRole(staff, slot?.required_role), true)) return false;
    if (rosterBlockedOnDate(staffId, slot?.duty_date)) return false;
    if (hasDutyOnSameDate(staffId, slot?.duty_date, assignments, slot)) return false;
    if (isBodDuty(slot?.duty_code) && hasAdjacentDuty(staffId, slot?.duty_date, assignments, slot)) return false;
    return true;
  };

  // ---------- Fair empty-slot rebalance ----------
  function ensureDraft(){
    const st = S();
    if (!st) return [];
    if (!st.rosterDraft || st.rosterDraft.monthKey !== st.monthKey) {
      const existing = safe(() => getAssignmentsForMonth(st.monthKey), []);
      st.rosterDraft = { monthKey: st.monthKey, assignments: existing.length ? existing.map(a => ({...a})) : safe(() => generateEmptyAssignments(st.monthKey), []) };
    }
    return st.rosterDraft.assignments || [];
  }
  function buildRosterStats(assignments){
    const stats = {};
    const active = (S()?.staff || []).filter(s => safe(() => isRosterEnabled(s), !!s?.is_active));
    active.forEach(s => stats[s.id] = { total:0, hours:0, pay:0, duty:{}, group:{}, day:{}, weekend:0 });
    (assignments || []).forEach(a => {
      if (!a.staff_id) return;
      stats[a.staff_id] = stats[a.staff_id] || { total:0, hours:0, pay:0, duty:{}, group:{}, day:{}, weekend:0 };
      const r = stats[a.staff_id];
      const dm = safe(() => dutyMetrics(a, a.staff_id), { hours:0, pay:0, units:0 });
      r.total += 1;
      r.hours += Number(dm.hours || 0);
      r.pay += Number(dm.pay || 0);
      r.duty[a.duty_code] = (r.duty[a.duty_code] || 0) + 1;
      const g = dutyGroup(a.duty_code); r.group[g] = (r.group[g] || 0) + 1;
      const dg = dayGroup(a.duty_date); r.day[dg] = (r.day[dg] || 0) + 1;
      if (dg === 'วันหยุด/นักขัต') r.weekend += 1;
    });
    return stats;
  }
  function keepNearMinimum(candidates, countFn){
    if (!candidates.length) return candidates;
    const vals = candidates.map(c => Number(countFn(c) || 0));
    const min = Math.min(...vals);
    const kept = candidates.filter(c => Number(countFn(c) || 0) <= min + 1);
    return kept.length ? kept : candidates;
  }
  function fairCandidatesForSlot(slot, assignments, stats){
    let candidates = (S()?.staff || [])
      .filter(s => safe(() => isRosterEnabled(s), !!s?.is_active))
      .filter(s => canStaffWorkSlot(s.id, slot, assignments));
    if (!candidates.length) return [];
    const g = dutyGroup(slot.duty_code);
    const dg = dayGroup(slot.duty_date);
    candidates = keepNearMinimum(candidates, s => stats[s.id]?.duty?.[slot.duty_code] || 0);
    candidates = keepNearMinimum(candidates, s => stats[s.id]?.group?.[g] || 0);
    if (['วันหยุด/นักขัต','จันทร์','ศุกร์'].includes(dg)) {
      candidates = keepNearMinimum(candidates, s => stats[s.id]?.day?.[dg] || 0);
    }
    candidates.sort((a,b) => scoreCandidate(a, slot, stats) - scoreCandidate(b, slot, stats) || compareStaff(a,b));
    return candidates;
  }
  function scoreCandidate(staff, slot, stats){
    const r = stats[staff.id] || { total:0, hours:0, pay:0, duty:{}, group:{}, day:{}, weekend:0 };
    const g = dutyGroup(slot.duty_code);
    const dg = dayGroup(slot.duty_date);
    const specific = r.duty?.[slot.duty_code] || 0;
    const group = r.group?.[g] || 0;
    const day = r.day?.[dg] || 0;
    // Weights mirror the Excel logic: exact column first, grouped duty next, special day columns next, then total/hours/pay.
    return (specific * 900000)
      + (group * 260000)
      + (['วันหยุด/นักขัต','จันทร์','ศุกร์'].includes(dg) ? day * 180000 : 0)
      + ((r.total || 0) * 45000)
      + ((r.hours || 0) * 350)
      + ((r.pay || 0) * 0.35)
      + (staffOrder(staff) * 0.001);
  }
  function addStats(stats, staffId, slot){
    stats[staffId] = stats[staffId] || { total:0, hours:0, pay:0, duty:{}, group:{}, day:{}, weekend:0 };
    const r = stats[staffId];
    const dm = safe(() => dutyMetrics(slot, staffId), { hours:0, pay:0, units:0 });
    r.total += 1;
    r.hours += Number(dm.hours || 0);
    r.pay += Number(dm.pay || 0);
    r.duty[slot.duty_code] = (r.duty[slot.duty_code] || 0) + 1;
    const g = dutyGroup(slot.duty_code); r.group[g] = (r.group[g] || 0) + 1;
    const dg = dayGroup(slot.duty_date); r.day[dg] = (r.day[dg] || 0) + 1;
    if (dg === 'วันหยุด/นักขัต') r.weekend += 1;
  }
  function slotPriority(slot){
    const dg = dayGroup(slot.duty_date);
    const dutyPr = isBodDuty(slot.duty_code) ? 0 : (String(slot.duty_code).startsWith('ช9') ? 1 : (String(slot.duty_code).startsWith('ช4') ? 2 : 3));
    const dayPr = dg === 'วันหยุด/นักขัต' ? 0 : dg === 'ศุกร์' ? 1 : dg === 'จันทร์' ? 2 : 3;
    return `${dayPr}${dutyPr}${slot.duty_date}${slot.duty_code}`;
  }
  function rebalanceEmptyRosterMonth(){
    if (!isAdminX()) return toast('เฉพาะ Admin เท่านั้น');
    const assignments = ensureDraft();
    if (!assignments.length) return toast('ยังไม่มีร่างตารางเวร');
    const emptySlots = assignments.filter(a => !a.is_locked && !a.staff_id).sort((a,b) => slotPriority(a).localeCompare(slotPriority(b)) || String(a.duty_date).localeCompare(String(b.duty_date)));
    if (!emptySlots.length) return toast('ไม่มีช่องว่างให้ปรับสมดุลแล้ว');
    let filled = 0;
    const failed = [];
    let stats = buildRosterStats(assignments);
    emptySlots.forEach(slot => {
      const cands = fairCandidatesForSlot(slot, assignments, stats);
      if (!cands.length) { failed.push(slot); return; }
      const chosen = cands[0];
      slot.staff_id = chosen.id;
      addStats(stats, chosen.id, slot);
      filled += 1;
    });
    render();
    if (failed.length) {
      toast(`เติมช่องว่างได้ ${filled} ช่อง เหลือ ${failed.length} ช่องที่ติดเงื่อนไขลา/ไม่รับเวร/ประเภทเวร/ชบดติดกัน`);
    } else {
      toast(`ปรับสมดุลช่องว่างทั้งเดือนแล้ว ${filled} ช่อง — ตรวจทานก่อนกดบันทึก`);
    }
  }
  window.cnmiV87RebalanceEmptyRosterMonth = rebalanceEmptyRosterMonth;

  function injectButton(){
    const st = S();
    if (!st || st.page !== 'scheduler') return;
    if (document.querySelector('[data-v87-rebalance-empty-month]')) return;
    const fairness = document.querySelector('[data-show-fairness]');
    const host = fairness?.parentElement || document.querySelector('.section-title');
    if (!host) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tiny-btn soft-btn';
    btn.dataset.v87RebalanceEmptyMonth = '1';
    btn.textContent = 'ปรับสมดุลช่องว่างทั้งเดือน';
    if (fairness) host.insertBefore(btn, fairness);
    else host.appendChild(btn);
  }

  function injectStyle(){
    if (document.getElementById('cnmi-v87-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v87-style';
    style.textContent = `
      [data-v87-rebalance-empty-month] { margin-right: 8px; }
      .matrix-legend { gap: 8px; flex-wrap: wrap; }
      @media (max-width: 820px) { [data-v87-rebalance-empty-month] { width: 100%; margin: 6px 0; } }
    `;
    document.head.appendChild(style);
  }

  const oldRenderPage = safe(() => renderPage, null);
  if (typeof oldRenderPage === 'function' && !oldRenderPage.__v87Patched) {
    const patched = function(){
      const out = oldRenderPage.apply(this, arguments);
      safe(() => { injectStyle(); injectButton(); }, null);
      return out;
    };
    patched.__v87Patched = true;
    window.renderPage = renderPage = patched;
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('[data-v87-rebalance-empty-month]');
    if (!btn) return;
    e.preventDefault();
    rebalanceEmptyRosterMonth();
  }, true);

  document.addEventListener('DOMContentLoaded', function(){ safe(() => { injectStyle(); injectButton(); }, null); });
  setTimeout(() => safe(() => { injectStyle(); injectButton(); }, null), 500);
  console.log('[CNMI]', PATCH, 'loaded');
})();
