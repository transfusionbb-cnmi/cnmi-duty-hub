/* V197: Duty eligibility sync for roster scheduler.
   Fixes stale/static roster rules after saving “สิทธิ์เวรตามวัน”.
   - Scheduler refreshes daily_position_eligibility before generate/auto-assign/open.
   - Empty draft, existing draft, dropdown, drag/drop, auto assign, and save use DUTY_RULE rows.
   - Slot required_role label is recalculated from the latest saved eligibility instead of stale defaults. */
(function(){
  'use strict';
  if (window.__CNMI_V197_DUTY_PERMISSION_SYNC__) return;
  window.__CNMI_V197_DUTY_PERMISSION_SYNC__ = true;

  const MARKER = ':::DUTY_RULES:';
  const DUTY_RULE_PREFIX = 'DUTY_RULE:';
  const CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง 1','ช4-MT/แตง 2'];
  const DUTY_COLUMNS_V197 = ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT'];
  const DEFAULT_RULES = {
    weekday: [
      { code:'ชบด1', role:'MT' },
      { code:'ชบด2', role:'MT' },
      { code:'ชบด3', role:'เคิก' },
      { code:'ช4A', role:'MT/แตง' },
      { code:'ช4B', role:'MT/แตง' }
    ],
    saturday: [
      { code:'ชบด1', role:'MT' },
      { code:'ชบด2', role:'MT' },
      { code:'ชบด3', role:'เคิก' },
      { code:'ช9-เคิก', role:'เคิก' },
      { code:'ช3A', role:'MT' },
      { code:'ช3B', role:'MT' },
      { code:'ช9-MT', role:'MT/แตง' }
    ],
    sunday: [
      { code:'ชบด1', role:'MT' },
      { code:'ชบด2', role:'MT' },
      { code:'ชบด3', role:'MT' },
      { code:'ช9-เคิก', role:'เคิก' },
      { code:'ช3A', role:'MT' },
      { code:'ช3B', role:'MT' },
      { code:'ช9-MT', role:'MT/แตง' }
    ],
    holidayMtMtKerk: [
      { code:'ชบด1', role:'MT' },
      { code:'ชบด2', role:'MT' },
      { code:'ชบด3', role:'เคิก' }
    ],
    holidayMtMtMt: [
      { code:'ชบด1', role:'MT' },
      { code:'ชบด2', role:'MT' },
      { code:'ชบด3', role:'MT' }
    ]
  };

  const prev = {
    dutyRuleForDate: window.dutyRuleForDate || (typeof dutyRuleForDate === 'function' ? dutyRuleForDate : null),
    allowedDutyCodesForDate: window.allowedDutyCodesForDate || (typeof allowedDutyCodesForDate === 'function' ? allowedDutyCodesForDate : null),
    generateEmptyAssignments: window.generateEmptyAssignments || (typeof generateEmptyAssignments === 'function' ? generateEmptyAssignments : null),
    getAssignmentsForMonth: window.getAssignmentsForMonth || (typeof getAssignmentsForMonth === 'function' ? getAssignmentsForMonth : null),
    canStaffWorkSlot: window.canStaffWorkSlot || (typeof canStaffWorkSlot === 'function' ? canStaffWorkSlot : null),
    autoAssignRoster: window.autoAssignRoster || (typeof autoAssignRoster === 'function' ? autoAssignRoster : null),
    saveRosterDraft: window.saveRosterDraft || (typeof saveRosterDraft === 'function' ? saveRosterDraft : null),
    supportsRequiredRole: window.supportsRequiredRole || (typeof supportsRequiredRole === 'function' ? supportsRequiredRole : null),
    handleDrop: window.handleDrop || (typeof handleDrop === 'function' ? handleDrop : null),
    renderPage: window.renderPage || (typeof renderPage === 'function' ? renderPage : null)
  };

  const esc = (v) => (typeof escapeHtml === 'function') ? escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const toast = (msg, tone) => { try { if (typeof showToast === 'function') showToast(msg, tone ? { tone } : undefined); else console.info(msg); } catch(_) {} };
  const pad2v = (n) => (typeof pad === 'function' ? pad(n) : String(n).padStart(2, '0'));
  const uidv = () => (typeof uid === 'function' ? uid() : 'tmp_' + Math.random().toString(36).slice(2));
  const parseDv = (date) => (typeof parseDate === 'function' ? parseDate(date) : new Date(String(date) + 'T00:00:00'));
  const normDate = (v) => (typeof normalizeDateKey === 'function' ? normalizeDateKey(v) : String(v || '').slice(0, 10));
  const slotIdOf = (a) => String((typeof getSlotId === 'function' ? getSlotId(a) : (a && (a.id || a._temp_id))) || '');
  const staffById = (id) => (state.staff || []).find(s => String(s.id) === String(id));
  const staffType = (s) => String(s?.staff_type || '').trim() === 'เคิก' ? 'เคิก' : 'MT';
  const isTang = (s) => String(s?.nickname || s?.full_name || '').trim() === 'แตง';
  const isRosterOn = (s) => { try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : s && s.is_active !== false && s.staff_type !== 'แพทย์'; } catch(_) { return !!s; } };
  const isHol = (date) => { try { return typeof isHolidayDate === 'function' ? isHolidayDate(date) : false; } catch(_) { return false; } };

  function cleanTitle(title='') {
    const t = String(title || '');
    const idx = t.indexOf(MARKER);
    return (idx >= 0 ? t.slice(0, idx) : t).trim();
  }

  function decodeHolidayConfig(title='') {
    const t = String(title || '');
    const idx = t.indexOf(MARKER);
    if (idx < 0) return null;
    const raw = t.slice(idx + MARKER.length).split(':::')[0];
    try { return JSON.parse(decodeURIComponent(escape(atob(raw)))); }
    catch(_) { try { return JSON.parse(atob(raw)); } catch(__) { return null; } }
  }

  function holidayCfg(date) {
    const row = (state.holidays || []).find(h => normDate(h?.holiday_date) === normDate(date));
    return decodeHolidayConfig(row?.title || '') || null;
  }

  function dayKey(date) {
    return ['sun','mon','tue','wed','thu','fri','sat'][parseDv(date).getDay()];
  }

  function normalizeEligibilityDuty(code='') {
    const c = String(code || '').trim();
    if (['ช4A','ช4','ช4-MT/แตง','ช4-MT/แตง1','ช4-MT/แตง-1','ช4-1','ช4-MT/แตง 1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4B','ช4-MT/แตง2','ช4-MT/แตง-2','ช4-2','ช4-MT/แตง 2'].includes(c)) return 'ช4-MT/แตง 2';
    if (c === 'ช9-MT' || c === 'ช9' || c === 'ช9-MT/แตง') return 'ช9-MT/แตง';
    return c;
  }

  function rosterCodeFromEligibility(code='') {
    const c = normalizeEligibilityDuty(code);
    if (c === 'ช4-MT/แตง 1') return 'ช4A';
    if (c === 'ช4-MT/แตง 2') return 'ช4B';
    if (c === 'ช9-MT/แตง') return 'ช9-MT';
    return c;
  }

  function eligCode(dateOrDay, dutyCode) {
    const dk = String(dateOrDay || '').length === 3 ? dateOrDay : dayKey(dateOrDay);
    return `${DUTY_RULE_PREFIX}${dk}:${normalizeEligibilityDuty(dutyCode)}`;
  }

  function dutyRowsForStaff(staffId) {
    return (state.positionEligibility || []).filter(r => String(r?.staff_id) === String(staffId) && String(r?.position_code || '').startsWith(DUTY_RULE_PREFIX));
  }

  function explicitDutyRecord(staffId, date, dutyCode) {
    const code = eligCode(date, dutyCode);
    return (state.positionEligibility || []).find(r => String(r?.staff_id) === String(staffId) && String(r?.position_code) === code);
  }

  function explicitRowsForSlot(date, dutyCode) {
    const code = eligCode(date, dutyCode);
    return (state.positionEligibility || []).filter(r => String(r?.position_code) === code);
  }

  function fallbackRoleForRosterCode(code, date) {
    const dow = parseDv(date).getDay();
    if (code === 'ชบด1' || code === 'ชบด2') return 'MT';
    if (code === 'ชบด3') {
      if (isHol(date)) return holidayCfg(date)?.roleMode === 'MT_MT_MT' ? 'MT' : (dow === 0 ? 'MT' : 'เคิก');
      return dow === 0 ? 'MT' : 'เคิก';
    }
    if (code === 'ช9-เคิก') return 'เคิก';
    if (code === 'ช9-MT') return 'MT/แตง';
    if (code === 'ช4A' || code === 'ช4B') return 'MT/แตง';
    if (code === 'ช3A' || code === 'ช3B') return 'MT';
    return 'MT/เคิก';
  }

  function defaultRuleListForDate(date) {
    const d = parseDv(date);
    const dow = d.getDay();
    if (isHol(date)) {
      const cfg = holidayCfg(date);
      const base = (cfg?.roleMode === 'MT_MT_MT') ? DEFAULT_RULES.holidayMtMtMt : DEFAULT_RULES.holidayMtMtKerk;
      if (cfg?.duties) {
        const allowedRosterCodes = [...new Set(CODES
          .filter(c => cfg.duties[c] || (String(c).startsWith('ช4') && cfg.duties['ช4-MT/แตง']))
          .map(rosterCodeFromEligibility))];
        return allowedRosterCodes.map(code => {
          const found = base.find(r => r.code === code);
          return found || { code, role: fallbackRoleForRosterCode(code, date) };
        });
      }
      return base;
    }
    if (dow === 0) return DEFAULT_RULES.sunday;
    if (dow === 6) return DEFAULT_RULES.saturday;
    return DEFAULT_RULES.weekday;
  }

  function roleFromExplicitRows(date, dutyCode, fallbackRole) {
    const rows = explicitRowsForSlot(date, dutyCode);
    if (!rows.length) return fallbackRole;
    const eligibleRows = rows.filter(r => r?.is_eligible === true || String(r?.is_eligible).toLowerCase() === 'true');
    if (!eligibleRows.length) return 'ไม่มีสิทธิ์';

    let hasMt = false;
    let hasKerk = false;
    let hasTangOnlyKerk = false;
    let hasOtherKerk = false;
    eligibleRows.forEach(r => {
      const st = staffById(r.staff_id);
      if (!st || !isRosterOn(st)) return;
      if (staffType(st) === 'เคิก') {
        hasKerk = true;
        if (isTang(st)) hasTangOnlyKerk = true; else hasOtherKerk = true;
      } else {
        hasMt = true;
      }
    });
    if (hasMt && hasOtherKerk) return 'MT/เคิก';
    if (hasMt && hasTangOnlyKerk && !hasOtherKerk) return 'MT/แตง';
    if (hasMt) return 'MT';
    if (hasKerk) return 'เคิก';
    return fallbackRole;
  }

  function effectiveRuleForDate(date) {
    return defaultRuleListForDate(date).map(slot => ({
      code: slot.code,
      role: roleFromExplicitRows(date, slot.code, slot.role)
    }));
  }

  function refreshSlotRole(row) {
    if (!row?.duty_date || !row?.duty_code) return row;
    const slot = effectiveRuleForDate(row.duty_date).find(x => x.code === row.duty_code);
    if (slot) row.required_role = slot.role;
    return row;
  }

  function syncAssignmentsInPlace(rows) {
    (rows || []).forEach(refreshSlotRole);
    return rows || [];
  }

  async function refreshDutyEligibilityFromDb(options={}) {
    if (!sb || !state?.profile) return false;
    try {
      const q = await sb.from('daily_position_eligibility').select('*');
      if (q.error) throw q.error;
      state.positionEligibility = q.data || [];
      state.__dutyEligibilitySyncedAtV197 = Date.now();
      if (options.clearDraft) state.rosterDraft = null;
      try { console.info('V197 duty eligibility refreshed', state.positionEligibility.filter(r => String(r.position_code || '').startsWith(DUTY_RULE_PREFIX)).length); } catch(_) {}
      return true;
    } catch (err) {
      console.warn('V197 duty eligibility refresh failed', err);
      if (options.toast !== false) toast('โหลดสิทธิ์เวรล่าสุดไม่สำเร็จ ใช้ข้อมูลที่มีในหน้าจอก่อน', 'error');
      return false;
    }
  }

  window.refreshDutyEligibilityFromDbV197 = refreshDutyEligibilityFromDb;
  window.dutyRuleForDate = dutyRuleForDate = function dutyRuleForDateV197(date) {
    return effectiveRuleForDate(normDate(date));
  };
  window.allowedDutyCodesForDate = allowedDutyCodesForDate = function allowedDutyCodesForDateV197(date) {
    return effectiveRuleForDate(normDate(date)).map(x => x.code);
  };
  window.generateEmptyAssignments = generateEmptyAssignments = function generateEmptyAssignmentsV197(key) {
    const range = (typeof getMonthRange === 'function') ? getMonthRange(key) : { y:Number(String(key).slice(0,4)), m:Number(String(key).slice(5,7)) };
    const last = new Date(range.y, range.m, 0).getDate();
    const rows = [];
    for (let day=1; day<=last; day++) {
      const date = `${range.y}-${pad2v(range.m)}-${pad2v(day)}`;
      effectiveRuleForDate(date).forEach(slot => rows.push({ _temp_id: uidv(), duty_date:date, duty_code:slot.code, required_role:slot.role, staff_id:null, is_locked:false }));
    }
    return rows;
  };

  if (prev.getAssignmentsForMonth) {
    window.getAssignmentsForMonth = getAssignmentsForMonth = function getAssignmentsForMonthV197(key) {
      const rows = prev.getAssignmentsForMonth.call(this, key) || [];
      return syncAssignmentsInPlace(rows);
    };
  }

  window.supportsRequiredRole = supportsRequiredRole = function supportsRequiredRoleV197(staff, required) {
    const r = String(required || '').trim();
    if (!staff) return false;
    if (!r || r === '-' || r === 'ใครก็ได้' || r === 'MT/เคิก') return staffType(staff) === 'MT' || staffType(staff) === 'เคิก';
    if (r === 'ไม่มีสิทธิ์') return false;
    if (r === 'MT/แตง' || r === 'MT_OR_TANG') return staffType(staff) === 'MT' || isTang(staff);
    if (r === 'MT') return staffType(staff) === 'MT';
    if (r === 'เคิก') return staffType(staff) === 'เคิก';
    if (/MT/.test(r) && /เคิก/.test(r)) return staffType(staff) === 'MT' || staffType(staff) === 'เคิก';
    if (/MT/.test(r) && /แตง/.test(r)) return staffType(staff) === 'MT' || isTang(staff);
    return prev.supportsRequiredRole ? prev.supportsRequiredRole(staff, required) : true;
  };

  function dutyEligibilityAllowsStaff(staffId, slot) {
    const staff = staffById(staffId);
    if (!staff || !slot) return false;
    const explicit = explicitDutyRecord(staffId, slot.duty_date, slot.duty_code);
    if (explicit) return explicit.is_eligible === true || String(explicit.is_eligible).toLowerCase() === 'true';
    const sameDayRows = dutyRowsForStaff(staffId).filter(r => String(r.position_code || '').startsWith(`${DUTY_RULE_PREFIX}${dayKey(slot.duty_date)}:`));
    if (sameDayRows.length) return false;
    return supportsRequiredRole(staff, slot.required_role || roleFromExplicitRows(slot.duty_date, slot.duty_code, ''));
  }

  window.canStaffWorkSlot = canStaffWorkSlot = function canStaffWorkSlotV197(staffId, slot, assignments) {
    const s = staffById(staffId);
    if (!isRosterOn(s)) return false;
    refreshSlotRole(slot);
    if (!dutyEligibilityAllowsStaff(staffId, slot)) return false;
    try { if (typeof activeLeaveRecordOn === 'function' && activeLeaveRecordOn(staffId, slot.duty_date)) return false; } catch(_) {}
    const list = assignments || (typeof getAssignmentsForMonth === 'function' ? getAssignmentsForMonth(state.monthKey) : []);
    try { if (typeof hasSameDayDuty === 'function' && hasSameDayDuty(staffId, slot.duty_date, list, slot)) return false; } catch(_) {}
    try { if (typeof isConsecutiveRestrictedDuty === 'function' && isConsecutiveRestrictedDuty(slot?.duty_code) && typeof hasAdjacentDuty === 'function' && hasAdjacentDuty(staffId, slot.duty_date, list, slot)) return false; } catch(_) {}
    return true;
  };

  window.autoAssignRoster = autoAssignRoster = function autoAssignRosterV197() {
    if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
    const assignments = syncAssignmentsInPlace(state.rosterDraft.assignments || []);
    const counts = (typeof calcFairness === 'function') ? calcFairness(assignments.filter(x => x.staff_id)) : {};
    let blockedByConsecutive = 0;
    let unfilled = 0;
    assignments.forEach(slot => {
      if (slot.is_locked || slot.staff_id) return;
      const wk = (typeof weekKeyOf === 'function') ? weekKeyOf(slot.duty_date) : String(slot.duty_date || '').slice(0, 10);
      const baseCandidates = (state.staff || []).filter(s => isRosterOn(s) && dutyEligibilityAllowsStaff(s.id, slot))
        .filter(s => { try { return !(state.leaves || []).some(l => l.staff_id === s.id && typeof overlapsDate === 'function' && overlapsDate(l, slot.duty_date)); } catch(_) { return true; } })
        .filter(s => { try { return !(typeof hasSameDayDuty === 'function' && hasSameDayDuty(s.id, slot.duty_date, assignments, slot)); } catch(_) { return true; } });
      const candidates = baseCandidates.filter(s => { try { return !(typeof hasAdjacentDuty === 'function' && hasAdjacentDuty(s.id, slot.duty_date, assignments, slot)); } catch(_) { return true; } });
      if (!candidates.length && baseCandidates.length) blockedByConsecutive++;
      candidates.sort((a,b) => {
        const ca = counts[a.id] || { total:0, weekend:0, hours:0, pay:0, weekCounts:{} };
        const cb = counts[b.id] || { total:0, weekend:0, hours:0, pay:0, weekCounts:{} };
        const order = (typeof compareStaffOrder === 'function') ? compareStaffOrder(a,b) : String(a.nickname || '').localeCompare(String(b.nickname || ''), 'th');
        return ((ca.pay || 0) - (cb.pay || 0)) || ((ca.hours || 0) - (cb.hours || 0)) || (((ca.weekCounts || {})[wk] || 0) - (((cb.weekCounts || {})[wk] || 0))) || ((ca.weekend || 0) - (cb.weekend || 0)) || ((ca.total || 0) - (cb.total || 0)) || order;
      });
      if (candidates[0]) {
        slot.staff_id = candidates[0].id;
        const c = counts[candidates[0].id] = counts[candidates[0].id] || { total:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, units:0, weekCounts:{} };
        c.total++;
        try {
          const dm = typeof dutyMetrics === 'function' ? dutyMetrics(slot, candidates[0].id) : { hours:0, units:1, pay:0 };
          c.hours = (c.hours || 0) + (dm.hours || 0);
          c.units = (c.units || 0) + (dm.units || 0);
          c.pay = (c.pay || 0) + (dm.pay || 0);
        } catch(_) {}
        c.weekCounts[wk] = (c.weekCounts[wk] || 0) + 1;
        try { if ((typeof isWeekend === 'function' && isWeekend(slot.duty_date)) || isHol(slot.duty_date)) c.weekend++; else c.weekday++; } catch(_) {}
      } else {
        unfilled++;
      }
    });
    state.rosterDraft = { monthKey: state.monthKey, assignments };
    if (unfilled) toast(`Auto Assign แล้ว แต่เหลือ ${unfilled} ช่องที่ยังจัดไม่ได้ เพราะติดเงื่อนไขลา/สิทธิ์เวรตามวัน/ห้าม ชบด ติดกัน`);
    else toast('Auto Assign แล้ว โดยใช้สิทธิ์เวรตามวันที่บันทึกล่าสุด');
  };

  if (prev.saveRosterDraft) {
    window.saveRosterDraft = saveRosterDraft = async function saveRosterDraftV197(status='draft') {
      if (state.rosterDraft?.assignments) syncAssignmentsInPlace(state.rosterDraft.assignments);
      return prev.saveRosterDraft.call(this, status);
    };
  }

  function cloneAssignments(rows) {
    try { return structuredClone(rows || []); } catch(_) { return JSON.parse(JSON.stringify(rows || [])); }
  }

  function swapRosterSlotsV197(sourceId, targetId, targetEl) {
    if (!sourceId || !targetId || String(sourceId) === String(targetId)) return;
    const assignments = cloneAssignments(state.rosterDraft?.monthKey === state.monthKey ? state.rosterDraft.assignments : (getAssignmentsForMonth(state.monthKey) || []));
    syncAssignmentsInPlace(assignments);
    const src = assignments.find(x => slotIdOf(x) === String(sourceId));
    const dst = assignments.find(x => slotIdOf(x) === String(targetId));
    if (!src || !dst) return;
    if (src.is_locked || dst.is_locked) return toast('ช่องต้นทางหรือปลายทางล็อกอยู่');
    if (normDate(src.duty_date) !== normDate(dst.duty_date)) return toast('สลับเวรได้เฉพาะช่องที่อยู่วันเดียวกัน');
    const sourceStaff = src.staff_id || null;
    const targetStaff = dst.staff_id || null;
    src.staff_id = targetStaff;
    dst.staff_id = sourceStaff;
    if (sourceStaff && !canStaffWorkSlot(sourceStaff, dst, assignments)) return toast('สลับไม่ได้: เจ้าหน้าที่ต้นทางไม่ตรงสิทธิ์เวร/ติดลา/ติดเวรต่อเนื่อง');
    if (targetStaff && !canStaffWorkSlot(targetStaff, src, assignments)) return toast('สลับไม่ได้: เจ้าหน้าที่ปลายทางไม่ตรงสิทธิ์เวร/ติดลา/ติดเวรต่อเนื่อง');
    let snap = null;
    try { snap = typeof captureRosterScroll === 'function' ? captureRosterScroll(targetEl || document.querySelector(`[data-drop-slot="${targetId}"]`)) : null; } catch(_) {}
    state.rosterDraft = { monthKey: state.monthKey, assignments };
    renderPage();
    try { if (snap && typeof restoreRosterScroll === 'function') restoreRosterScroll(snap); } catch(_) {}
    toast(targetStaff ? 'สลับเวรในวันเดียวกันแล้ว กดบันทึกเพื่อบันทึกจริง' : 'ย้ายเวรไปช่องใหม่แล้ว กดบันทึกเพื่อบันทึกจริง');
  }

  window.handleDrop = handleDrop = function handleDropV197(e) {
    const slotEl = e.target.closest && e.target.closest('[data-drop-slot]');
    if (!slotEl) return;
    e.preventDefault();
    try { document.querySelectorAll('.roster-slot.drag-over, .roster-slot.dragging').forEach(el => el.classList.remove('drag-over', 'dragging')); } catch(_) {}
    const slotId = slotEl.dataset.dropSlot;
    const sourceSlotId = e.dataTransfer?.getData('sourceSlotId');
    if (sourceSlotId) { swapRosterSlotsV197(sourceSlotId, slotId, slotEl); return; }
    const staffId = e.dataTransfer?.getData('staffId');
    if (!staffId || !slotId) return;
    const currentAssignments = cloneAssignments(state.rosterDraft?.monthKey === state.monthKey ? state.rosterDraft.assignments : (getAssignmentsForMonth(state.monthKey) || []));
    syncAssignmentsInPlace(currentAssignments);
    const target = currentAssignments.find(x => slotIdOf(x) === String(slotId));
    if (!target) return;
    if (target.is_locked) return toast('ช่องนี้ล็อกอยู่');
    if (allowedDutyCodesForDate(target.duty_date).indexOf(target.duty_code) < 0) return toast('ช่องนี้ปิดใช้งาน จึงไม่รับการลากวาง');
    if (!canStaffWorkSlot(staffId, target, currentAssignments)) {
      try { if (typeof isConsecutiveRestrictedDuty === 'function' && isConsecutiveRestrictedDuty(target?.duty_code) && typeof hasAdjacentDuty === 'function' && hasAdjacentDuty(staffId, target.duty_date, currentAssignments, target)) return toast('คนนี้มีเวร ชบด ติดกับวันก่อน/วันถัดไปแล้ว กรุณาเลือกคนอื่น'); } catch(_) {}
      return toast('คนนี้ติดลา/ไม่รับเวร หรือสิทธิ์เวรตามวันไม่ตรงกับช่องนี้');
    }
    let snap = null;
    try { snap = typeof captureRosterScroll === 'function' ? captureRosterScroll(slotEl) : null; } catch(_) {}
    target.staff_id = staffId;
    state.rosterDraft = { monthKey: state.monthKey, assignments: currentAssignments };
    renderPage();
    try { if (snap && typeof restoreRosterScroll === 'function') restoreRosterScroll(snap); } catch(_) {}
  };

  // Sync before scheduler render, so old saved required_role does not leak into the UI.
  if (prev.renderPage) {
    window.renderPage = renderPage = function renderPageV197() {
      try {
        if (state.page === 'scheduler') {
          if (state.rosterDraft?.monthKey === state.monthKey && Array.isArray(state.rosterDraft.assignments)) syncAssignmentsInPlace(state.rosterDraft.assignments);
          else (getAssignmentsForMonth(state.monthKey) || []).forEach(refreshSlotRole);
        }
      } catch(err) { console.warn('V197 pre-render sync failed', err); }
      const res = prev.renderPage.apply(this, arguments);
      try {
        if (state.page === 'scheduler') {
          const card = document.querySelector('.roster-board .card:nth-child(2) .section-title');
          if (card && !document.querySelector('[data-v197-duty-sync-note]')) {
            const note = document.createElement('div');
            note.setAttribute('data-v197-duty-sync-note', '1');
            note.className = 'notice soft-notice v197-duty-sync-note';
            const n = (state.positionEligibility || []).filter(r => String(r.position_code || '').startsWith(DUTY_RULE_PREFIX)).length;
            note.innerHTML = `ใช้สิทธิ์เวรตามวันล่าสุดจากฐานข้อมูลแล้ว <b>${esc(n)}</b> รายการ`;
            card.parentElement.insertBefore(note, card.nextSibling);
          }
        }
      } catch(_) {}
      return res;
    };
  }

  async function openSchedulerFresh() {
    await refreshDutyEligibilityFromDb({ clearDraft:true, toast:false });
    state.page = 'scheduler';
    renderPage();
    toast('โหลดสิทธิ์เวรล่าสุดแล้ว');
  }

  async function generateRosterFresh() {
    await refreshDutyEligibilityFromDb({ clearDraft:false, toast:false });
    state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
    renderPage();
    toast('สร้างตารางเปล่าจากสิทธิ์เวรล่าสุดแล้ว');
  }

  async function autoAssignFresh() {
    await refreshDutyEligibilityFromDb({ clearDraft:false, toast:false });
    autoAssignRoster();
    renderPage();
  }

  window.addEventListener('click', async function(e){
    const t = e.target && e.target.closest && e.target.closest('[data-page="scheduler"],[data-generate-roster],[data-auto-assign],[data-save-roster],[data-publish-roster],[data-lock-roster],[data-save-duty-eligibility-v137]');
    if (!t) return;
    if (t.dataset?.page === 'scheduler') {
      e.preventDefault(); e.stopImmediatePropagation();
      await openSchedulerFresh();
      return;
    }
    if (t.hasAttribute('data-generate-roster')) {
      e.preventDefault(); e.stopImmediatePropagation();
      await generateRosterFresh();
      return;
    }
    if (t.hasAttribute('data-auto-assign')) {
      e.preventDefault(); e.stopImmediatePropagation();
      await autoAssignFresh();
      return;
    }
    if (t.hasAttribute('data-save-roster') || t.hasAttribute('data-publish-roster') || t.hasAttribute('data-lock-roster')) {
      if (state.rosterDraft?.assignments) syncAssignmentsInPlace(state.rosterDraft.assignments);
      return;
    }
    if (t.hasAttribute('data-save-duty-eligibility-v137')) {
      state.rosterDraft = null;
      window.setTimeout(() => refreshDutyEligibilityFromDb({ clearDraft:true, toast:false }).then(() => { if (state.page === 'scheduler' || state.page === 'dutyEligibilityV107') renderPage(); }), 900);
      window.setTimeout(() => refreshDutyEligibilityFromDb({ clearDraft:true, toast:false }).then(() => { if (state.page === 'scheduler') renderPage(); }), 1800);
    }
  }, true);

  const style = document.createElement('style');
  style.textContent = `.v197-duty-sync-note{margin:8px 0 10px}.roster-slot .slot-meta{font-weight:700}`;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', function(){
    window.setTimeout(() => refreshDutyEligibilityFromDb({ toast:false }), 300);
  });
})();
