/* CNMI Staff Planner Patch V107
   - Duty eligibility by staff + weekday
   - Public holiday duty rules by date
   - Excel-like monthly roster matrix
   - Draft roster reassign before close day
   - Separate no-duty from daytime position on weekdays
   - ช4-MT/แตง as one slot, no automatic OT money
*/
(function patchV107(){
  const V107 = {
    codes: ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'],
    legacyCodes: ['ช4A','ช4B','ช9-MT'],
    weekdays: [
      { key: 'sun', label: 'อาทิตย์', js: 0 },
      { key: 'mon', label: 'จันทร์', js: 1 },
      { key: 'tue', label: 'อังคาร', js: 2 },
      { key: 'wed', label: 'พุธ', js: 3 },
      { key: 'thu', label: 'พฤหัสบดี', js: 4 },
      { key: 'fri', label: 'ศุกร์', js: 5 },
      { key: 'sat', label: 'เสาร์', js: 6 }
    ],
    defaultRules: {
      weekday: ['ชบด1','ชบด2','ชบด3','ช4-MT/แตง'],
      saturday: ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง'],
      sunday: ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง'],
      holiday: ['ชบด1','ชบด2','ชบด3']
    },
    roles: {
      'ชบด1': 'MT',
      'ชบด2': 'MT',
      'ชบด3': 'MT_OR_KERK',
      'ช3A': 'MT',
      'ช3B': 'MT',
      'ช9-เคิก': 'เคิก',
      'ช9-MT/แตง': 'MT_OR_TANG',
      'ช4-MT/แตง': 'MT_OR_TANG'
    },
    titleMarker: ':::DUTY_RULES:'
  };

  window.CNMI_PATCH_V107 = true;

  function v107MonthKeyFromDate(date) { return String(date || '').slice(0, 7); }
  function v107DowKey(date) { const d = parseDate(date).getDay(); return V107.weekdays.find(w => w.js === d)?.key || 'mon'; }
  function v107DowLabel(date) { const d = parseDate(date).getDay(); return V107.weekdays.find(w => w.js === d)?.label || ''; }
  function v107RoleFor(code) { return V107.roles[normalizeDutyCodeV107(code)] || 'MT'; }
  function dutyLabelV107(code) { return normalizeDutyCodeV107(code || ''); }
  function dutyDisplayLabelV107(code) {
    const c = normalizeDutyCodeV107(code || '');
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function normalizeDutyCodeV107(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4A' || c === 'ช4B' || c === 'ช4') return 'ช4-MT/แตง';
    return c;
  }
  function normalizeAssignmentV107(a) {
    if (!a) return a;
    const code = normalizeDutyCodeV107(a.duty_code);
    return { ...a, duty_code: code, required_role: a.required_role || v107RoleFor(code) };
  }
  function dutyEligibilityCodeV107(dayKey, dutyCode) { return `DUTY_RULE:${dayKey}:${normalizeDutyCodeV107(dutyCode)}`; }
  function isDutyEligibilityRowV107(r) { return String(r?.position_code || '').startsWith('DUTY_RULE:'); }
  function dutyEligibilityRowsForStaffV107(staffId) {
    return (state.positionEligibility || []).filter(r => String(r.staff_id) === String(staffId) && isDutyEligibilityRowV107(r));
  }
  function explicitDutyRowsForDayCodeV107(dayKey, dutyCode) {
    const code = dutyEligibilityCodeV107(dayKey, dutyCode);
    return (state.positionEligibility || []).filter(r => r.position_code === code);
  }
  function staffDutyEligibleV107(staff, date, dutyCode) {
    if (!staff || !isRosterEnabled(staff)) return false;
    const code = normalizeDutyCodeV107(dutyCode);
    const dayKey = v107DowKey(date);
    const rows = dutyEligibilityRowsForStaffV107(staff.id);
    // ถ้ายังไม่เคยตั้งสิทธิ์เวรให้คนนี้เลย ให้ใช้ logic เดิมเพื่อไม่ให้ระบบเดิมพังทันทีหลังอัปเดต
    if (!rows.length) return supportsRequiredRole(staff, v107RoleFor(code));
    const rec = rows.find(r => r.position_code === dutyEligibilityCodeV107(dayKey, code));
    return !!rec?.is_eligible;
  }
  function anyStaffEligibleForDutyV107(date, dutyCode) {
    const dayKey = v107DowKey(date);
    const explicitRows = explicitDutyRowsForDayCodeV107(dayKey, dutyCode);
    if (!explicitRows.length) return true;
    return explicitRows.some(r => r.is_eligible && orderedStaff(state.staff).some(s => String(s.id) === String(r.staff_id) && isRosterEnabled(s)));
  }
  function defaultDutyCodesForDateV107(date) {
    if (isHolidayDate(date)) return holidayAllowedDutyCodesV107(date);
    const dow = parseDate(date).getDay();
    if (dow === 0) return [...V107.defaultRules.sunday];
    if (dow === 6) return [...V107.defaultRules.saturday];
    return [...V107.defaultRules.weekday];
  }
  function dutyRulesFromCodesV107(date, codes) {
    return codes.map(code => ({ code: normalizeDutyCodeV107(code), role: v107RoleFor(code) }));
  }
  function cleanHolidayTitleV107(title='') {
    const text = String(title || '');
    const idx = text.indexOf(V107.titleMarker);
    return (idx >= 0 ? text.slice(0, idx) : text).trim() || 'วันหยุดราชการ';
  }
  function encodeHolidayTitleV107(title, allowedCodes) {
    const json = JSON.stringify({ duties: V107.codes.reduce((acc, code) => { acc[code] = allowedCodes.includes(code); return acc; }, {}) });
    let encoded = '';
    try { encoded = btoa(unescape(encodeURIComponent(json))); }
    catch (_) { encoded = btoa(json); }
    return `${String(title || '').trim()} ${V107.titleMarker}${encoded}:::`.trim();
  }
  function decodeHolidayRulesV107(title='') {
    const text = String(title || '');
    const start = text.indexOf(V107.titleMarker);
    if (start < 0) return null;
    const raw = text.slice(start + V107.titleMarker.length).split(':::')[0];
    try { return JSON.parse(decodeURIComponent(escape(atob(raw)))); }
    catch (_) {
      try { return JSON.parse(atob(raw)); }
      catch (e) { return null; }
    }
  }
  function holidayAllowedDutyCodesV107(date) {
    const row = (state.holidays || []).find(h => h.holiday_date === date);
    const cfg = decodeHolidayRulesV107(row?.title || '');
    if (!cfg?.duties) return [...V107.defaultRules.holiday];
    const codes = V107.codes.filter(code => cfg.duties[code]);
    return codes.length ? codes : [];
  }
  function leaveTextForRosterCellV107(staffId, date) {
    const rows = (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function activeDutyBlockLeaveV107(staffId, date) {
    return (state.leaves || []).some(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
  }
  function activePositionBlockLeaveV107(staffId, date) {
    // ไม่รับเวรในวันธรรมดา = ยังมาทำงาน 08.00-16.00 จึงไม่ block ตำแหน่งกลางวัน
    return (state.leaves || []).some(l => {
      if (String(l.staff_id) !== String(staffId) || !overlapsDate(l, date)) return false;
      if (l.type === 'ไม่รับเวร' && !isWeekend(date) && !isHolidayDate(date)) return false;
      return true;
    });
  }
  function rosterCloseDateForDutyMonthV107(monthKey) {
    const [y, m] = String(monthKey).split('-').map(Number);
    const closeDay = Number(CFG.ROSTER_CLOSE_DAY || 20);
    return new Date(y, (m || 1) - 2, closeDay, 23, 59, 59, 999);
  }
  function canAutoReassignRosterMonthV107(monthKey) {
    const { y, m } = getMonthRange(monthKey);
    const month = (state.rosterMonths || []).find(x => Number(x.year) === Number(y) && Number(x.month) === Number(m));
    if (['published','locked','official'].includes(String(month?.status || '').toLowerCase())) return false;
    return new Date() <= rosterCloseDateForDutyMonthV107(monthKey);
  }
  function isNoDutyLockedForDateV107(date) {
    if (isAdmin() && CFG.ADMIN_BYPASS_LEAVE_CLOSE_RULE !== false) return false;
    return new Date() > rosterCloseDateForDutyMonthV107(String(date).slice(0, 7));
  }

  // ---- NAV ----
  function ensureV107Nav() {
    const removeIds = new Set(['dutyEligibilityV107','holidayRulesV107']);
    for (let i = NAV_ITEMS.length - 1; i >= 0; i--) if (removeIds.has(NAV_ITEMS[i].id)) NAV_ITEMS.splice(i, 1);
    const schedulerIdx = NAV_ITEMS.findIndex(x => x.id === 'scheduler');
    NAV_ITEMS.splice(schedulerIdx >= 0 ? schedulerIdx + 1 : NAV_ITEMS.length, 0,
      { id:'dutyEligibilityV107', icon:'✅', title:'สิทธิ์เวรตามวัน', subtitle:'เลือกเจ้าหน้าที่ แล้วติ๊กว่าแต่ละวันอยู่เวรอะไรได้', group:'admin' },
      { id:'holidayRulesV107', icon:'🎌', title:'ตั้งค่าเวรวันนักขัตฤกษ์', subtitle:'เพิ่มวันหยุดและเลือกเวรที่เปิดรายวัน', group:'admin' }
    );
  }
  ensureV107Nav();

  // ---- Function overrides ----
  try { isNoDutyLockedForDate = isNoDutyLockedForDateV107; window.isNoDutyLockedForDate = isNoDutyLockedForDateV107; } catch (_) {}
  try { isRosterLockedForDate = isNoDutyLockedForDateV107; window.isRosterLockedForDate = isNoDutyLockedForDateV107; } catch (_) {}

  holidayName = function holidayNameV107(date) {
    const row = (state.holidays || []).find(h => h.holiday_date === date);
    return cleanHolidayTitleV107(row?.title || 'วันหยุดราชการ');
  };
  window.holidayName = holidayName;

  supportsRequiredRole = function supportsRequiredRoleV107(staff, required) {
    if (!required || required === 'ANY') return true;
    if (required === 'MT_OR_TANG') return staff?.staff_type === 'MT' || staff?.nickname === 'แตง';
    if (required === 'MT_OR_KERK') return staff?.staff_type === 'MT' || staff?.staff_type === 'เคิก';
    return staff?.staff_type === required;
  };
  window.supportsRequiredRole = supportsRequiredRole;

  dutyStaffTypeForRate = function dutyStaffTypeForRateV107(staffId, dutyCode='') {
    const s = (state.staff || []).find(x => String(x.id) === String(staffId));
    const code = normalizeDutyCodeV107(dutyCode);
    if (!s) return 'MT';
    if ((code === 'ช4-MT/แตง' || code === 'ช9-MT/แตง') && s.nickname === 'แตง') return 'MT';
    return s.staff_type === 'เคิก' ? 'เคิก' : 'MT';
  };
  window.dutyStaffTypeForRate = dutyStaffTypeForRate;

  dutyHoursForCode = function dutyHoursForCodeV107(date, dutyCode='') {
    const code = normalizeDutyCodeV107(dutyCode);
    if (['ช9-เคิก','ช9-MT/แตง'].includes(code)) return 8;
    if (['ช3A','ช3B'].includes(code)) return 8;
    if (code === 'ช4-MT/แตง') return 0; // ช4 16:00-20:00 ต้องยืนยันจริงและเทียบ LIS ก่อน ไม่บวกเงินในแอพ
    if (['ชบด1','ชบด2','ชบด3'].includes(code)) return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
    return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
  };
  window.dutyHoursForCode = dutyHoursForCode;

  dutyUnitsForCode = function dutyUnitsForCodeV107(date, dutyCode='') {
    const code = normalizeDutyCodeV107(dutyCode);
    const h = dutyHoursForCode(date, code);
    if (['ช3A','ช3B'].includes(code)) return 1;
    if (code === 'ช4-MT/แตง') return 0;
    return h / 8;
  };
  window.dutyUnitsForCode = dutyUnitsForCode;

  dutyMetrics = function dutyMetricsV107(a, staffIdOverride=null) {
    const date = a?.duty_date || a;
    const code = normalizeDutyCodeV107(a?.duty_code || '');
    const staffId = staffIdOverride || a?.staff_id || null;
    const hours = dutyHoursForCode(date, code);
    const rate = staffId ? dutyRatePerHour(staffId, date, code) : 0;
    const pay = hours * rate;
    return { hours, rate, pay, units: dutyUnitsForCode(date, code), code, publicHoliday: isHolidayDate(date), weekend: isWeekend(date) };
  };
  window.dutyMetrics = dutyMetrics;

  dutyRuleForDate = function dutyRuleForDateV107(date) {
    const base = defaultDutyCodesForDateV107(date);
    const codes = base.filter(code => anyStaffEligibleForDutyV107(date, code));
    return dutyRulesFromCodesV107(date, codes);
  };
  window.dutyRuleForDate = dutyRuleForDate;

  allowedDutyCodesForDate = function allowedDutyCodesForDateV107(date) {
    return dutyRuleForDate(date).map(x => x.code);
  };
  window.allowedDutyCodesForDate = allowedDutyCodesForDate;

  getAssignmentsForMonth = function getAssignmentsForMonthV107(key) {
    const normalizeRows = rows => (rows || []).map(normalizeAssignmentV107).filter(x => {
      const allowed = allowedDutyCodesForDate(x.duty_date);
      return allowed.includes(x.duty_code) || V107.legacyCodes.includes(String(x.duty_code || ''));
    });
    if (state.rosterDraft?.monthKey === key) return normalizeRows(state.rosterDraft.assignments);
    const { start, end } = getMonthRange(key);
    return normalizeRows((state.rosterAssignments || []).filter(x => x.duty_date >= start && x.duty_date <= end));
  };
  window.getAssignmentsForMonth = getAssignmentsForMonth;

  generateEmptyAssignments = function generateEmptyAssignmentsV107(key) {
    const { y, m } = getMonthRange(key);
    const last = new Date(y, m, 0).getDate();
    const rows = [];
    for (let day=1; day<=last; day++) {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      dutyRuleForDate(date).forEach(slot => rows.push({ _temp_id: uid(), duty_date: date, duty_code: slot.code, required_role: slot.role, staff_id: null, is_locked: false }));
    }
    return rows;
  };
  window.generateEmptyAssignments = generateEmptyAssignments;

  canStaffWorkSlot = function canStaffWorkSlotV107(staffId, slot, assignments = getAssignmentsForMonth(state.monthKey)) {
    const s = (state.staff || []).find(x => String(x.id) === String(staffId));
    if (!isRosterEnabled(s)) return false;
    const normalizedSlot = normalizeAssignmentV107(slot);
    if (!supportsRequiredRole(s, normalizedSlot.required_role || v107RoleFor(normalizedSlot.duty_code))) return false;
    if (!staffDutyEligibleV107(s, normalizedSlot.duty_date, normalizedSlot.duty_code)) return false;
    if (activeDutyBlockLeaveV107(staffId, normalizedSlot.duty_date)) return false;
    if (hasSameDayDuty(staffId, normalizedSlot.duty_date, assignments, normalizedSlot)) return false;
    if (hasAdjacentDuty(staffId, normalizedSlot.duty_date, assignments, normalizedSlot)) return false;
    return true;
  };
  window.canStaffWorkSlot = canStaffWorkSlot;

  dailyWorkingStaff = function dailyWorkingStaffV107(date) {
    return orderedStaff((state.staff || []).filter(s => isDailyPositionEnabled(s) && !activePositionBlockLeaveV107(s.id, date)));
  };
  window.dailyWorkingStaff = dailyWorkingStaff;

  positionCandidateOk = function positionCandidateOkV107(staff, positionRow, date=todayStr()) {
    const eligibilityKey = positionRow.eligibility_code || positionRow.code || positionRow.position_code;
    return isDailyPositionEnabled(staff)
      && !activePositionBlockLeaveV107(staff.id, date)
      && positionRuleOk(staff, positionRow.main_rule)
      && positionEligible(staff, eligibilityKey);
  };
  window.positionCandidateOk = positionCandidateOk;

  workingPositionStaffIdsForDate = function workingPositionStaffIdsForDateV107(date) {
    return orderedStaff(state.staff)
      .filter(s => isDailyPositionEnabled(s) && !activePositionBlockLeaveV107(s.id, date))
      .map(s => s.id);
  };
  window.workingPositionStaffIdsForDate = workingPositionStaffIdsForDate;

  // ---- Admin duty eligibility page ----
  function renderDutyEligibilityPageV107() {
    if (!isAdmin()) return noPermission();
    const activeStaff = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)));
    if (!activeStaff.length) return empty('ยังไม่มีเจ้าหน้าที่ที่เปิดสิทธิ์จัดเวร');
    if (!state.dutyEligibilityStaffId || !activeStaff.some(s => String(s.id) === String(state.dutyEligibilityStaffId))) state.dutyEligibilityStaffId = activeStaff[0].id;
    const selected = activeStaff.find(s => String(s.id) === String(state.dutyEligibilityStaffId)) || activeStaff[0];
    const hasRows = dutyEligibilityRowsForStaffV107(selected.id).length > 0;
    return `<div class="grid duty-eligibility-page-v107">
      <div class="card eligibility-staff-panel">
        <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
        <label>เจ้าหน้าที่ <select id="dutyEligibilityStaffSelect">${activeStaff.map(s => `<option value="${s.id}" ${String(selected.id)===String(s.id)?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select></label>
        <div class="selected-staff-card" style="--staff-bg:${staffColor(selected)};--staff-fg:${textColorFor(staffColor(selected))}">
          <b>${escapeHtml(selected.nickname || selected.full_name)}</b><br><span>${escapeHtml(selected.position || selected.role || '')}</span>
        </div>
        <div class="notice soft-notice">หน้านี้ใช้กับเวรเท่านั้น ไม่เกี่ยวกับตำแหน่งกลางวัน 08.00-16.00 น.</div>
      </div>
      <div class="card duty-eligibility-matrix-card">
        <div class="section-title"><div><h3>สิทธิ์เวรตามวันของ ${escapeHtml(selected.nickname || selected.full_name)}</h3><p class="hint">ติ๊กช่องที่คนนี้อยู่ได้ ระบบ Auto Assign จะใช้เป็นเงื่อนไขหลัก</p></div><button class="primary-btn" data-save-duty-eligibility>บันทึกสิทธิ์เวร</button></div>
        ${!hasRows ? '<div class="notice soft-notice">ยังไม่เคยตั้งสิทธิ์เวรของคนนี้ ระบบจะแสดงค่าเริ่มต้นตามกฎเดิมให้ก่อน กดบันทึกเพื่อเริ่มใช้ตารางนี้</div>' : ''}
        <div class="table-wrap duty-eligibility-wrap"><table class="duty-eligibility-table"><thead><tr><th>วัน</th>${V107.codes.map(c => `<th>${escapeHtml(c)}</th>`).join('')}</tr></thead><tbody>
          ${V107.weekdays.filter(w => w.js !== 0).concat(V107.weekdays.filter(w => w.js === 0)).map(w => `<tr><th>${w.label}</th>${V107.codes.map(code => {
            const rec = (state.positionEligibility || []).find(r => String(r.staff_id) === String(selected.id) && r.position_code === dutyEligibilityCodeV107(w.key, code));
            const checked = rec ? !!rec.is_eligible : defaultDutyCodesForWeekdayKeyV107(w.key).includes(code);
            return `<td><label class="switch-check"><input type="checkbox" data-duty-eligibility data-staff-id="${selected.id}" data-day-key="${w.key}" data-duty-code="${escapeHtml(code)}" ${checked?'checked':''}><span></span></label></td>`;
          }).join('')}</tr>`).join('')}
        </tbody></table></div>
      </div>
    </div>`;
  }
  function defaultDutyCodesForWeekdayKeyV107(dayKey) {
    if (dayKey === 'sat') return [...V107.defaultRules.saturday];
    if (dayKey === 'sun') return [...V107.defaultRules.sunday];
    return [...V107.defaultRules.weekday];
  }
  async function saveDutyEligibilityV107() {
    if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
    const checks = Array.from(document.querySelectorAll('[data-duty-eligibility]'));
    const rows = checks.map(cb => ({
      staff_id: cb.dataset.staffId,
      position_code: dutyEligibilityCodeV107(cb.dataset.dayKey, cb.dataset.dutyCode),
      is_eligible: !!cb.checked,
      updated_by: currentStaffId()
    }));
    if (!rows.length) return showToast('ไม่มีข้อมูลสิทธิ์เวรให้บันทึก');
    const { error } = await sb.from('daily_position_eligibility').upsert(rows, { onConflict: 'staff_id,position_code' });
    if (error) return showToast(friendlyDbError(error));
    state.rosterDraft = null;
    await loadAllData();
    renderPage();
    showToast('บันทึกสิทธิ์เวรตามวันแล้ว');
  }

  // ---- Holiday rule page ----
  function renderHolidayRulesPageV107() {
    if (!isAdmin()) return noPermission();
    const key = state.holidayRuleMonthKey || state.monthKey || monthKey(new Date());
    const rows = (state.holidays || []).filter(h => String(h.holiday_date || '').startsWith(key)).sort((a,b)=>String(a.holiday_date).localeCompare(String(b.holiday_date)));
    const editing = state.editHolidayRuleDate ? (state.holidays || []).find(h => h.holiday_date === state.editHolidayRuleDate) : null;
    const allowed = editing ? holidayAllowedDutyCodesV107(editing.holiday_date) : [...V107.defaultRules.holiday];
    return `<div class="grid grid-2 holiday-rules-page-v107">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขวันหยุดนักขัตฤกษ์' : 'เพิ่มวันหยุดนักขัตฤกษ์'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-holiday-rule>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="holidayRulesForm" class="form-grid compact-form">
          <label>วันที่ <input name="holiday_date" type="date" value="${editing?.holiday_date || `${key}-01`}" ${editing?'readonly':''} required></label>
          <label>ชื่อวันหยุด <input name="title" value="${escapeHtml(cleanHolidayTitleV107(editing?.title || ''))}" placeholder="เช่น วันเฉลิมฯ" required></label>
          <div class="wide duty-checkbox-grid"><div class="field-label">เวรที่เปิดในวันนี้</div>${V107.codes.map(code => `<label class="check-pill"><input type="checkbox" name="holiday_duties" value="${escapeHtml(code)}" ${allowed.includes(code)?'checked':''}> <span>${escapeHtml(code)}</span></label>`).join('')}</div>
          <button class="primary-btn wide" type="submit">บันทึกวันหยุดและกฎเวร</button>
        </form>
        <div class="notice soft-notice">วันหยุดแต่ละวันตั้งเวรได้เอง ไม่จำเป็นต้องเหมือนเสาร์-อาทิตย์</div>
      </div>
      <div class="card">
        <div class="section-title"><h3>รายการวันหยุด ${key}</h3></div>
        <div class="toolbar compact-filter"><label>เดือน <input type="month" id="holidayRuleMonthInput" value="${key}"></label></div>
        ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>วันที่</th><th>ชื่อวันหยุด</th><th>เวรที่เปิด</th><th>จัดการ</th></tr></thead><tbody>${rows.map(h => `<tr><td>${formatThaiDate(h.holiday_date)}</td><td>${escapeHtml(cleanHolidayTitleV107(h.title))}</td><td>${holidayAllowedDutyCodesV107(h.holiday_date).map(c => badge(c,'blue')).join(' ') || '-'}</td><td><button class="tiny-btn" data-edit-holiday-rule="${h.holiday_date}">แก้ไข</button><button class="tiny-btn danger" data-delete-holiday-rule="${h.holiday_date}">ลบ</button></td></tr>`).join('')}</tbody></table></div>` : empty('ยังไม่มีวันหยุดในเดือนนี้')}
      </div>
    </div>`;
  }
  async function saveHolidayRulesV107(form) {
    if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
    const fd = new FormData(form);
    const date = fd.get('holiday_date');
    const title = String(fd.get('title') || '').trim();
    const duties = Array.from(form.querySelectorAll('input[name="holiday_duties"]:checked')).map(x => normalizeDutyCodeV107(x.value));
    if (!date || !title) return showToast('กรุณาระบุวันที่และชื่อวันหยุด');
    const row = { holiday_date: date, title: encodeHolidayTitleV107(title, duties), updated_by: currentStaffId() };
    const { error } = await sb.from('public_holidays').upsert(row, { onConflict:'holiday_date' });
    if (error) return showToast(friendlyDbError(error));
    state.editHolidayRuleDate = '';
    state.rosterDraft = null;
    await loadAllData();
    renderPage();
    showToast('บันทึกวันหยุดและกฎเวรแล้ว');
  }
  async function deleteHolidayRuleV107(date) {
    if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
    if (!(await confirmDialog(`ลบวันหยุด ${formatThaiDate(date)} หรือไม่?`, 'ยืนยันลบวันหยุด'))) return;
    const { error } = await sb.from('public_holidays').delete().eq('holiday_date', date);
    if (error) return showToast(friendlyDbError(error));
    state.editHolidayRuleDate = '';
    state.rosterDraft = null;
    await loadAllData();
    renderPage();
    showToast('ลบวันหยุดแล้ว');
  }

  // ---- Roster grid / schedule matrix ----
  function dutyTableCodesForMonthV107(assignments, key) {
    const { start, end } = getMonthRange(key);
    const set = new Set(V107.codes);
    (assignments || []).filter(a => a.duty_date >= start && a.duty_date <= end).forEach(a => set.add(normalizeDutyCodeV107(a.duty_code)));
    return V107.codes.filter(c => set.has(c));
  }
  function rosterStaffOptionsFastV107(selectedId='') {
    const selected = String(selectedId || '');
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)))
      .map(st => `<option value="${st.id}" ${selected === String(st.id) ? 'selected' : ''}>${escapeHtml(st.nickname || st.full_name)} (${escapeHtml(st.staff_type || '-')})</option>`)
      .join('');
  }
  renderRosterGrid = function renderRosterGridV107(assignments) {
    if (!assignments.length) return empty('กด “สร้างร่าง Auto Assign” เพื่อเริ่มจัดเวร');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = dutyTableCodesForMonthV107(assignments, state.monthKey);
    const desktopTable = `<div class="table-wrap roster-table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyDisplayLabelV107(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({length:last}, (_,i)=>i+1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const dow = parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
        return `<tr><td><b>${day}</b><br><span class="muted">${dow}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normalizeDutyCodeV107(a.duty_code) === code);
          if (!slot) return '<td class="muted">-</td>';
          const id = slot.id || slot._temp_id;
          return `<td><div class="roster-slot ${slot.is_locked?'locked':''}" data-drop-slot="${id}">
            <div class="assigned-name">${slot.staff_id ? staffPill(slot.staff_id) : 'ยังไม่จัด'}</div>
            <div class="slot-meta">${escapeHtml(slot.required_role || v107RoleFor(code))} ${slot.is_locked?'• locked':''}</div>
            <select class="mobile-roster-select" data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${rosterStaffOptionsFastV107(slot.staff_id)}</select>
            <div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div>
          </div></td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
    return desktopTable + renderRosterMobileGrid(assignments, y, m, last);
  };
  window.renderRosterGrid = renderRosterGrid;

  renderRosterMobileGrid = function renderRosterMobileGridV107(assignments, y, m, last) {
    return `<div class="mobile-roster-cards">${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const dow = parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
      const slots = allowedDutyCodesForDate(date).map(code => assignments.find(a => a.duty_date === date && normalizeDutyCodeV107(a.duty_code) === code)).filter(Boolean);
      return `<div class="mobile-card roster-day-card"><div class="mobile-day-head"><b>${day}</b><span>${dow}</span>${isHolidayDate(date) ? `<span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</div>${slots.map(slot => {
        const id = slot.id || slot._temp_id;
        return `<div class="mobile-roster-slot"><div><b>${escapeHtml(dutyDisplayLabelV107(slot.duty_code))}</b><br><span class="muted">${escapeHtml(slot.required_role || v107RoleFor(slot.duty_code))} ${slot.is_locked?'• locked':''}</span></div><select data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${rosterStaffOptionsFastV107(slot.staff_id)}</select><div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div></div>`;
      }).join('')}</div>`;
    }).join('')}</div>`;
  };
  window.renderRosterMobileGrid = renderRosterMobileGrid;

  function renderExcelRosterMatrixV107(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({length:last}, (_,i)=>i+1);
    const active = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || assignments.some(a => String(a.staff_id) === String(s.id))));
    const byStaffDate = {};
    (assignments || []).filter(a => a.staff_id).forEach(a => {
      const key = `${a.staff_id}|${a.duty_date}`;
      byStaffDate[key] = byStaffDate[key] || [];
      byStaffDate[key].push(a);
    });
    return `<div class="excel-roster-section-v107">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3><p class="hint">แถวคือเจ้าหน้าที่ คอลัมน์คือวันที่ กดช่องเพื่อดูรายละเอียด/แลก/ขาย/รับเวรแทน</p></div></div>
      <div class="table-wrap excel-roster-wrap-v107"><table id="scheduleTable" class="excel-roster-table-v107"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}"><b>${escapeHtml(st.nickname || st.full_name)}</b><small>${escapeHtml(st.staff_type || '')}</small></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextForRosterCellV107(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => dutyDisplayLabelV107(a.duty_code)).join('<br>') : leaveText;
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }

  function renderScheduleOldByDayV107(assignments, codes, y, m, last) {
    return `<div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyDisplayLabelV107(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({length:last}, (_,i)=>i+1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normalizeDutyCodeV107(a.duty_code) === code);
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
  }

  function renderScheduleOldByPersonV107(assignments) {
    const active = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)));
    return `<div class="table-wrap"><table class="schedule-by-person-v107"><thead><tr><th>เจ้าหน้าที่</th><th>รายการเวรในเดือนนี้</th><th>รวม</th></tr></thead><tbody>${active.map(st => {
      const rows = assignments.filter(a => String(a.staff_id) === String(st.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)));
      return `<tr><td>${staffPill(st)}</td><td>${rows.length ? rows.map(a => `<span class="mini-duty-chip-v107">${formatThaiDate(a.duty_date)} ${escapeHtml(dutyDisplayLabelV107(a.duty_code))}${renderTradeButton(a)}</span>`).join(' ') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</td><td>${rows.length}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderScheduleOldOtV107(assignments) {
    const stats = calcFairness(assignments.filter(x => x.staff_id));
    const active = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)));
    return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${active.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours||0).toFixed(1)}</td><td>${(r.pay||0).toLocaleString()}</td><td>${(r.units||0).toFixed(1)}</td><td>${r.chbd||0}</td><td>${r.ch9||0}</td><td>${r.ch3||0}</td><td>${r.ch4||0}</td><td>${r.weekend||0}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }

  function renderScheduleOldMatrixV107(assignments, y, m, last) {
    const active = orderedStaff((state.staff || []).filter(s => isRosterEnabled(s)));
    const days = Array.from({length:last}, (_,i)=>i+1);
    return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${parseDate(`${y}-${pad(m)}-${pad(day)}`).toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rows = assignments.filter(a => String(a.staff_id) === String(s.id) && a.duty_date === date);
      const leaveText = leaveTextForRosterCellV107(s.id, date);
      const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
      return `<td class="${cls}">${rows.length ? `<b>${rows.map(a => escapeHtml(dutyDisplayLabelV107(a.duty_code))).join('<br>')}</b>` : (leaveText ? `<span class="no-duty-one-line-v107">${escapeHtml(leaveText)}</span>` : '')}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV107(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = dutyTableCodesForMonthV107(assignments, state.monthKey);
    const view = state.scheduleMobileView || 'day';
    const detail = view === 'person'
      ? renderScheduleOldByPersonV107(assignments)
      : view === 'ot'
        ? renderScheduleOldOtV107(assignments)
        : view === 'table'
          ? renderScheduleOldMatrixV107(assignments, y, m, last)
          : renderScheduleOldByDayV107(assignments, codes, y, m, last);
    const oldPanel = `<details class="old-duty-table-v107" open><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary>${detail}</details>`;
    return renderExcelRosterMatrixV107(assignments) + oldPanel;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;

  renderSchedulePersonMatrix = function renderSchedulePersonMatrixV107(assignments) {
    return renderExcelRosterMatrixV107(assignments);
  };
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix;

  renderMobileScheduleByDay = function renderMobileScheduleByDayV107(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return `<div class="mobile-schedule-list">${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = allowedDutyCodesForDate(date).map(code => ({ code, slot: assignments.find(a => a.duty_date === date && normalizeDutyCodeV107(a.duty_code) === code) })).filter(x => x.slot?.staff_id);
      return `<div class="schedule-day-card ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}"><div class="mobile-day-head"><b>${day}</b><span>${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? badge(holidayName(date),'yellow') : ''}</div>${slots.length ? slots.map(({code,slot}) => `<div class="mobile-duty-line"><b>${escapeHtml(dutyDisplayLabelV107(code))}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  };
  window.renderMobileScheduleByDay = renderMobileScheduleByDay;

  function showRosterExcelCellModalV107(encoded) {
    const [staffId, date, idsText=''] = String(encoded || '').split('|');
    const ids = idsText ? idsText.split(',').filter(Boolean) : [];
    const assignments = getAssignmentsForMonth(state.monthKey);
    const rows = ids.map(id => assignments.find(a => String(a.id || a._temp_id) === String(id))).filter(Boolean);
    const leaveText = leaveTextForRosterCellV107(staffId, date);
    const detailRows = rows.map(a => `<div class="duty-action-row"><div><b>${escapeHtml(dutyDisplayLabelV107(a.duty_code))}</b><br><span class="muted">${formatThaiDate(a.duty_date)} • ${staffPill(a.staff_id)}</span></div><div class="actions">${canRequestTrade(a) ? `<button class="tiny-btn" data-trade-duty="${a.id || a._temp_id}">ขอแลก/ขาย/ยกเวร</button>` : '<span class="muted">ดูอย่างเดียว</span>'}</div></div>`).join('');
    showModal(`<h2>รายละเอียดตารางเวร</h2><p class="hint">${staffPill(staffId)} • ${formatThaiDate(date)}</p>${leaveText ? `<div class="notice soft-notice">สถานะวันนี้: <b>${escapeHtml(leaveText)}</b></div>` : ''}${detailRows || empty('วันนี้ยังไม่มีเวรในช่องนี้')}<div class="confirm-actions"><button class="ghost-btn" data-page="tradeRequests">ดูคำขอแลก/ขาย/ยกเวร</button><button class="primary-btn" data-app-alert-ok>ปิด</button></div>`);
  }

  // ---- Scheduler / fairness / auto assign ----
  renderSchedulerPage = function renderSchedulerPageV107() {
    if (!isAdmin()) return noPermission();
    const { y, m } = getMonthRange(state.monthKey);
    const month = (state.rosterMonths || []).find(x => Number(x.year) === y && Number(x.month) === m);
    const assignments = getAssignmentsForMonth(state.monthKey);
    const monthHolidays = (state.holidays || []).filter(h => h.holiday_date?.startsWith(state.monthKey));
    return `<div class="grid">
      <div class="card">
        <div class="toolbar">
          <label>เดือน <input type="month" id="rosterMonthInput" value="${state.monthKey}"></label>
          <button class="soft-btn" data-auto-assign>สร้างร่าง Auto Assign</button>
          <button class="primary-btn" data-save-roster>บันทึก</button>
          <button class="ghost-btn danger" data-clear-roster-month>ล้างข้อมูลเดือนนี้</button>
          <button class="ghost-btn" data-restore-roster-month>ย้อนกลับข้อมูลล่าสุด</button>
          <button class="soft-btn" data-page="dutyEligibilityV107">สิทธิ์เวรตามวัน</button>
          <button class="soft-btn" data-page="holidayRulesV107">วันหยุดนักขัตฤกษ์</button>
          <span>${badge(month?.status || 'ยังไม่สร้าง', month?.status==='published'?'green':month?.status==='locked'?'red':'black')}</span>
        </div>
        <div class="hint">Auto Assign ใช้สิทธิ์เวรตามวัน + ไม่รับเวร/ลา + ห้ามเวรติดกัน และไม่แตะช่องที่ล็อกไว้</div>
        ${monthHolidays.length ? `<div class="chip-line">${monthHolidays.map(h => `<span class="badge yellow">${formatThaiDate(h.holiday_date)} ${escapeHtml(cleanHolidayTitleV107(h.title))}</span>`).join('')}</div>` : ''}
      </div>
      <div class="roster-board">
        <div class="card"><h3>รายชื่อเจ้าหน้าที่</h3><p class="hint">ลากชื่อไปวางในช่องเวรได้เลย / คนที่ปิดจัดเวรจะไม่ถูก Auto Assign</p><div class="staff-pool">${orderedStaff((state.staff || []).filter(s => isRosterEnabled(s))).map(s => `<div class="staff-chip" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" draggable="true" data-drag-staff="${s.id}" data-staff-stat="${s.id}" title="กดเพื่อดูสถิติเวร"><span>${escapeHtml(s.nickname || s.full_name)}</span><span>${badge(s.staff_type || '-', s.staff_type==='MT'?'blue':'orange')}</span></div>`).join('')}</div></div>
        <div class="card"><div class="section-title"><h3>ตารางร่าง ${state.monthKey}</h3><button class="tiny-btn" data-show-fairness>ดูสมดุลเวร</button></div>${renderRosterGrid(assignments)}</div>
      </div>
    </div>`;
  };
  window.renderSchedulerPage = renderSchedulerPage;

  calcFairness = function calcFairnessV107(assignments) {
    const stats = {};
    (assignments || []).forEach(a0 => {
      const a = normalizeAssignmentV107(a0);
      if (!a.staff_id) return;
      if (!stats[a.staff_id]) stats[a.staff_id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{} };
      const dow = parseDate(a.duty_date).getDay();
      const m = dutyMetrics(a);
      stats[a.staff_id].total++;
      stats[a.staff_id].hours += m.hours;
      stats[a.staff_id].units += m.units;
      stats[a.staff_id].pay += m.pay;
      if (String(a.duty_code || '').startsWith('ชบด')) stats[a.staff_id].chbd++;
      if (String(a.duty_code || '').startsWith('ช9')) stats[a.staff_id].ch9++;
      if (['ช3A','ช3B'].includes(a.duty_code)) stats[a.staff_id].ch3++;
      if (a.duty_code === 'ช4-MT/แตง') stats[a.staff_id].ch4++;
      const wk = weekKeyOf(a.duty_date);
      stats[a.staff_id].weekCounts[wk] = (stats[a.staff_id].weekCounts[wk] || 0) + 1;
      if (dow === 1) stats[a.staff_id].mon++;
      if (dow === 5) stats[a.staff_id].fri++;
      if (dow === 0 || dow === 6 || isHolidayDate(a.duty_date)) stats[a.staff_id].weekend++; else stats[a.staff_id].weekday++;
    });
    return stats;
  };
  window.calcFairness = calcFairness;

  showFairness = function showFairnessV107() {
    const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id);
    const stats = calcFairness(assignments);
    const hours = Object.values(stats).map(x => x.hours || 0);
    const pays = Object.values(stats).map(x => x.pay || 0);
    const diff = hours.length ? Math.max(...hours) - Math.min(...hours) : 0;
    const payDiff = pays.length ? Math.max(...pays) - Math.min(...pays) : 0;
    showModal(`<h2>ตรวจสมดุลการกระจายเวร ${state.monthKey}</h2><p class="hint">ช4-MT/แตง ไม่บวกเงิน OT ตั้งต้นในแอพ ต้องยืนยันจริงและเทียบ LIS ก่อน</p><p class="hint">ส่วนต่างชั่วโมง ${diff.toFixed(1)} ชม. • ส่วนต่างเงินโดยประมาณ ${payDiff.toLocaleString()} บาท</p><div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${orderedStaff(state.staff.filter(s=>isRosterEnabled(s))).map(s => { const r = stats[s.id] || {}; return `<tr><td>${staffPill(s)}</td><td>${(r.hours||0).toFixed(1)}</td><td>${(r.pay||0).toLocaleString()}</td><td>${(r.units||0).toFixed(1)}</td><td>${r.chbd||0}</td><td>${r.ch9||0}</td><td>${r.ch3||0}</td><td>${r.ch4||0}</td><td>${r.mon||0}</td><td>${r.fri||0}</td><td>${r.weekend||0}</td></tr>`; }).join('')}</tbody></table></div>`);
  };
  window.showFairness = showFairness;

  autoAssignRoster = function autoAssignRosterV107(opts={}) {
    if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
    state.rosterDraft.assignments = (state.rosterDraft.assignments || []).map(normalizeAssignmentV107);
    const assignments = state.rosterDraft.assignments;
    const counts = calcFairness(assignments.filter(x => x.staff_id));
    let blockedByConsecutive = 0;
    let unfilled = 0;
    assignments.forEach(slot => {
      if (slot.is_locked || slot.staff_id) return;
      const wk = weekKeyOf(slot.duty_date);
      const baseCandidates = orderedStaff(state.staff.filter(s => canStaffWorkSlot(s.id, slot, assignments)));
      if (!baseCandidates.length) {
        const softCandidates = orderedStaff(state.staff.filter(s => {
          if (!isRosterEnabled(s)) return false;
          if (!staffDutyEligibleV107(s, slot.duty_date, slot.duty_code)) return false;
          if (activeDutyBlockLeaveV107(s.id, slot.duty_date)) return false;
          if (hasSameDayDuty(s.id, slot.duty_date, assignments, slot)) return false;
          return true;
        }));
        if (softCandidates.length) blockedByConsecutive++;
        unfilled++;
        return;
      }
      baseCandidates.sort((a,b) => {
        const ca = counts[a.id] || { total:0, weekend:0, hours:0, pay:0, weekCounts:{} };
        const cb = counts[b.id] || { total:0, weekend:0, hours:0, pay:0, weekCounts:{} };
        return ((ca.pay || 0) - (cb.pay || 0)) || ((ca.hours || 0) - (cb.hours || 0)) || ((ca.weekCounts[wk]||0) - (cb.weekCounts[wk]||0)) || ((ca.weekend||0) - (cb.weekend||0)) || ((ca.total||0) - (cb.total||0)) || compareStaffOrder(a,b);
      });
      const chosen = baseCandidates[0];
      slot.staff_id = chosen.id;
      const c = counts[chosen.id] = counts[chosen.id] || { total:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, units:0, weekCounts:{} };
      const dm = dutyMetrics(slot, chosen.id);
      c.total++; c.hours += dm.hours; c.units += dm.units; c.pay += dm.pay;
      c.weekCounts[wk] = (c.weekCounts[wk] || 0) + 1;
      if (isWeekend(slot.duty_date) || isHolidayDate(slot.duty_date)) c.weekend++; else c.weekday++;
    });
    if (opts.silent) return { unfilled, blockedByConsecutive };
    if (unfilled) showToast(`Auto Assign แล้ว แต่เหลือ ${unfilled} ช่องที่ยังจัดไม่ได้ เพราะติดเงื่อนไขลา/ไม่รับเวร/สิทธิ์เวร/ห้ามเวรติดกัน`);
    else showToast('Auto Assign แล้ว โดยใช้สิทธิ์เวรตามวันและกันไม่ให้ใครอยู่เวรติดกัน ตรวจทานก่อนประกาศอีกทีนะ');
  };
  window.autoAssignRoster = autoAssignRoster;

  async function persistRosterDraftV107(status='draft', opts={}) {
    if (!state.rosterDraft || !state.rosterDraft.assignments.length) { if (!opts.silent) showToast('ยังไม่มีร่างตาราง'); return false; }
    const { y, m } = getMonthRange(state.monthKey);
    let month = (state.rosterMonths || []).find(x => Number(x.year) === y && Number(x.month) === m);
    const monthPayload = { year: y, month: m, status, updated_by: currentStaffId() };
    if (!month) {
      const { data, error } = await sb.from('roster_months').insert({ ...monthPayload, created_by: currentStaffId() }).select().single();
      if (error) { if (!opts.silent) showToast(friendlyDbError(error)); return false; }
      month = data;
    } else {
      const { error } = await sb.from('roster_months').update(monthPayload).eq('id', month.id);
      if (error) { if (!opts.silent) showToast(friendlyDbError(error)); return false; }
    }
    const rows = state.rosterDraft.assignments.map(a0 => {
      const a = normalizeAssignmentV107(a0);
      const row = { roster_month_id: month.id, duty_date: a.duty_date, duty_code: a.duty_code, required_role: a.required_role || v107RoleFor(a.duty_code), staff_id: a.staff_id || null, is_locked: !!a.is_locked, updated_by: currentStaffId() };
      if (a.id) row.id = a.id;
      return row;
    });
    const { error } = await sb.from('roster_assignments').upsert(rows, { onConflict: 'roster_month_id,duty_date,duty_code' });
    if (error) { if (!opts.silent) showToast(friendlyDbError(error)); return false; }
    // ลบ slot ช4/ช9 แบบเก่าที่เคยค้าง เพื่อไม่ให้มีช่องซ้ำใน backend
    try { await sb.from('roster_assignments').delete().eq('roster_month_id', month.id).in('duty_code', ['ช4A','ช4B','ช9-MT']); } catch (_) {}
    state.rosterDraft = null;
    await loadAllData();
    if (!opts.silent) { renderPage(); showToast(status === 'published' ? 'ประกาศตารางแล้ว' : status === 'locked' ? 'ล็อกตารางแล้ว' : 'บันทึกร่างแล้ว'); }
    return true;
  }
  saveRosterDraft = async function saveRosterDraftV107(status='draft') { return persistRosterDraftV107(status, { silent:false }); };
  window.saveRosterDraft = saveRosterDraft;

  async function autoAdjustRosterAfterLeaveV107(row) {
    if (!row?.staff_id) return { adjusted:0, unfilled:0 };
    const months = Array.from(new Set(datesBetween(row.start_date, row.end_date).map(d => d.slice(0,7))));
    let adjusted = 0, unfilled = 0;
    for (const mk of months) {
      if (!canAutoReassignRosterMonthV107(mk)) continue;
      const oldMonthKey = state.monthKey;
      state.monthKey = mk;
      const assignments = getAssignmentsForMonth(mk).map(normalizeAssignmentV107);
      const targetDates = new Set(datesBetween(row.start_date, row.end_date).filter(d => d.slice(0,7) === mk));
      const affected = assignments.filter(a => !a.is_locked && String(a.staff_id) === String(row.staff_id) && targetDates.has(a.duty_date));
      if (!affected.length) { state.monthKey = oldMonthKey; continue; }
      state.rosterDraft = { monthKey: mk, assignments: assignments.map(a => ({ ...a })) };
      for (const bad of affected) {
        const liveBad = state.rosterDraft.assignments.find(a => String(a.id || a._temp_id) === String(bad.id || bad._temp_id));
        if (!liveBad) continue;
        liveBad.staff_id = null;
        const candidates = orderedStaff(state.staff.filter(s => String(s.id) !== String(row.staff_id) && canStaffWorkSlot(s.id, liveBad, state.rosterDraft.assignments)));
        let placed = false;
        for (const cand of candidates) {
          const candSlots = state.rosterDraft.assignments.filter(a => !a.is_locked && String(a.staff_id) === String(cand.id) && a.duty_date !== liveBad.duty_date);
          const swapSlot = candSlots.find(a => canStaffWorkSlot(row.staff_id, { ...a, staff_id:null }, state.rosterDraft.assignments));
          if (swapSlot) {
            swapSlot.staff_id = row.staff_id;
            liveBad.staff_id = cand.id;
            placed = true;
            break;
          }
        }
        if (!placed && candidates[0]) { liveBad.staff_id = candidates[0].id; placed = true; }
        if (!placed) unfilled++;
      }
      const fill = autoAssignRoster({ silent:true });
      unfilled += fill.unfilled || 0;
      const ok = await persistRosterDraftV107('draft', { silent:true });
      if (ok) adjusted++;
      state.monthKey = oldMonthKey;
    }
    return { adjusted, unfilled };
  }

  // ---- Position month no-duty weekday fix ----
  buildMonthPositionSummary = function buildMonthPositionSummaryV107(rows, dates) {
    const dateSet = new Set(dates || []);
    const summary = {};
    (rows || []).forEach(r => {
      if (!r.staff_id || !r.work_date || (dateSet.size && !dateSet.has(r.work_date))) return;
      if (isNoPositionDay(r.work_date)) return;
      if (activePositionBlockLeaveV107(r.staff_id, r.work_date)) return;
      const st = state.staff.find(s => s.id === r.staff_id);
      if (!st || !isDailyPositionEnabled(st)) return;
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
  window.buildMonthPositionSummary = buildMonthPositionSummary;

  renderMonthPositionCell = function renderMonthPositionCellV107(staff, date, cellRows, canEdit=false) {
    const noDay = isNoPositionDay(date);
    const leave = activePositionBlockLeaveV107(staff.id, date);
    const outing = hasOuting(date);
    if (noDay) return `<td class="matrix-cell no-position-day"><span>${isHolidayDate(date) ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
    const row = cellRows[0] || null;
    const cleanCodes = cellRows.map(r => positionLabelForCell(r.position_code || r.code));
    const cls = `${outing ? 'outing-cell' : ''} ${leave ? 'leave-cell' : ''} ${!cleanCodes.length && !leave ? 'needs-review-cell' : ''}`.trim();
    if (canEdit && !leave) {
      const current = row?.position_code || '';
      return `<td class="matrix-cell ${cls}"><select class="month-position-select" data-month-position-edit="${date}|${staff.id}"><option value="">รอตรวจสอบ</option>${ALL_POSITION_TEMPLATES.map(t => `<option value="${escapeHtml(t.code)}" ${current===t.code?'selected':''}>${escapeHtml(positionLabelForCell(t.code))}</option>`).join('')}</select>${outing ? '<div class="cell-note">ออกหน่วย</div>' : ''}</td>`;
    }
    const text = cleanCodes.length ? cleanCodes.join('<br>') : (leave ? 'ลา' : 'รอตรวจสอบ');
    const leaveMark = leave ? '<div class="cell-note">ไม่ต้องจัดตำแหน่ง</div>' : '';
    const outingMark = outing && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : '';
    return `<td class="matrix-cell ${cls}"><span>${text}</span>${leaveMark}${outingMark}</td>`;
  };
  window.renderMonthPositionCell = renderMonthPositionCell;

  // ---- Event handlers ----
  const oldHandleClickV107 = window.handleClick || handleClick;
  handleClick = async function handleClickV107(e) {
    const t = e.target.closest('button, [data-page], [data-roster-excel-cell], [data-edit-holiday-rule], [data-delete-holiday-rule]');
    if (t?.dataset?.page) { state.page = t.dataset.page; closeModal(); renderPage(); return; }
    if (t?.dataset?.scheduleMobileView) { state.scheduleMobileView = t.dataset.scheduleMobileView; renderPage(); return; }
    if (t?.hasAttribute('data-save-duty-eligibility')) { await saveDutyEligibilityV107(); return; }
    if (t?.dataset?.rosterExcelCell) { showRosterExcelCellModalV107(t.dataset.rosterExcelCell); return; }
    if (t?.dataset?.editHolidayRule) { state.editHolidayRuleDate = t.dataset.editHolidayRule; renderPage(); return; }
    if (t?.dataset?.deleteHolidayRule) { await deleteHolidayRuleV107(t.dataset.deleteHolidayRule); return; }
    if (t?.hasAttribute('data-cancel-edit-holiday-rule')) { state.editHolidayRuleDate = ''; renderPage(); return; }
    return oldHandleClickV107(e);
  };
  window.handleClick = handleClick;

  const oldHandleChangeV107 = window.handleChange || handleChange;
  handleChange = function handleChangeV107(e) {
    if (e.target.id === 'dutyEligibilityStaffSelect') { state.dutyEligibilityStaffId = e.target.value; renderPage(); return; }
    if (e.target.id === 'holidayRuleMonthInput') { state.holidayRuleMonthKey = e.target.value; state.editHolidayRuleDate = ''; renderPage(); return; }
    return oldHandleChangeV107(e);
  };
  window.handleChange = handleChange;

  const oldHandleSubmitV107 = window.handleSubmit || handleSubmit;
  handleSubmit = async function handleSubmitV107(e) {
    if (e.target.id === 'holidayRulesForm') { e.preventDefault(); await saveHolidayRulesV107(e.target); return; }
    return oldHandleSubmitV107(e);
  };
  window.handleSubmit = handleSubmit;

  const oldSaveLeaveV107 = window.saveLeave || saveLeave;
  saveLeave = async function saveLeaveV107(form) {
    const fd = new FormData(form);
    const rowPreview = {
      staff_id: isAdmin() ? (fd.get('staff_id') || currentStaffId()) : currentStaffId(),
      type: fd.get('type'),
      start_date: fd.get('start_date'),
      end_date: fd.get('end_date')
    };
    await oldSaveLeaveV107(form);
    const savedOk = (state.leaves || []).some(l => String(l.staff_id) === String(rowPreview.staff_id)
      && String(l.type) === String(rowPreview.type)
      && String(l.start_date) === String(rowPreview.start_date)
      && String(l.end_date) === String(rowPreview.end_date)
      && String(l.status || 'active') !== 'cancelled');
    if (!savedOk) return;
    try {
      if (rowPreview.start_date && rowPreview.end_date) {
        const result = await autoAdjustRosterAfterLeaveV107(rowPreview);
        if (result.adjusted) {
          await loadAllData();
          renderPage();
          showToast(result.unfilled ? `บันทึกแล้ว และจัดเวรร่างใหม่ ${result.adjusted} เดือน แต่ยังเหลือ ${result.unfilled} ช่องที่ต้องแก้มือ/แลกเวร` : `บันทึกแล้ว และระบบจัดเวรร่างใหม่ให้ ${result.adjusted} เดือน`);
        }
      }
    } catch (err) {
      console.warn('V107 auto adjust roster after leave failed', err);
      showToast('บันทึกลา/ไม่รับเวรแล้ว แต่จัดเวรอัตโนมัติหลังบันทึกไม่สำเร็จ กรุณาเปิดหน้าจัดตารางเวรแล้วกด Auto Assign อีกครั้ง');
    }
  };
  window.saveLeave = saveLeave;

  const oldRenderPageV107 = window.renderPage || renderPage;
  renderPage = function renderPageV107() {
    const item = NAV_ITEMS.find(x => x.id === state.page) || NAV_ITEMS[0];
    $('pageTitle').textContent = item.title;
    $('pageSubtitle').textContent = item.subtitle;
    renderNav();
    const pages = {
      dashboard: renderDashboard,
      calendar: renderCalendar,
      leave: renderLeavePage,
      myProfile: renderMyProfilePage,
      activities: renderActivitiesPage,
      hr: renderHrPage,
      hrSummary: renderHrSummaryPage,
      scheduler: renderSchedulerPage,
      schedule: renderMonthlySchedulePage,
      tradeRequests: renderTradeRequestsPage,
      positions: renderPositionsPage,
      ot: renderOtPage,
      audit: renderAuditPage,
      profileRequests: renderProfileRequestsPage,
      profileRequestSummary: typeof window.renderProfileRequestSummaryPage === 'function' ? window.renderProfileRequestSummaryPage : (typeof renderProfileRequestSummaryPage === 'function' ? renderProfileRequestSummaryPage : undefined),
      users: renderUsersPage,
      eligibility: renderEligibilityPage,
      positionMonth: renderPositionMonthPage,
      positionMonthView: renderPositionMonthViewPage,
      dutyEligibilityV107: renderDutyEligibilityPageV107,
      holidayRulesV107: renderHolidayRulesPageV107
    };
    const fn = pages[state.page];
    if (typeof fn === 'function') {
      $('pageContent').innerHTML = fn();
      return;
    }
    // ถ้าเป็นหน้าจาก patch รุ่นก่อน เช่น ตั้งต้นเวร ให้คืนสิทธิ์ให้ renderer เดิมแทนที่จะเด้งไป Dashboard
    if (typeof oldRenderPageV107 === 'function' && oldRenderPageV107 !== renderPage) {
      oldRenderPageV107();
      return;
    }
    $('pageContent').innerHTML = renderDashboard();
  };
  window.renderPage = renderPage;

})();
/* CNMI Staff Planner Patch V109
   - Clean Excel roster row height + remove staff type under name
   - Restore old roster sub-view tabs inside the lower panel
   - Clean OT page wording, move monthly export to section 4
   - Put duty check-in into OT approval queue and monthly OT summary
*/
(function patchV109(){
  window.CNMI_PATCH_V109 = true;

  const V109_DUTY_CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function normDutyV109(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4A' || c === 'ช4B' || c === 'ช4') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelV109(code='') {
    const c = normDutyV109(code);
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function leaveTextV109(staffId, date) {
    const rows = (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function allowedCodesForDateV109(date, assignments=[]) {
    let codes = [];
    try { codes = allowedDutyCodesForDate(date) || []; } catch (_) { codes = []; }
    const present = (assignments || []).filter(a => a.duty_date === date).map(a => normDutyV109(a.duty_code));
    const merged = [...new Set([...codes.map(normDutyV109), ...present])];
    return V109_DUTY_CODES.filter(c => merged.includes(c));
  }
  function dutySortV109(code) {
    const i = V109_DUTY_CODES.indexOf(normDutyV109(code));
    return i < 0 ? 999 : i;
  }
  function formatDateCellV109(date) {
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }
  function staffActiveForRosterV109(assignments) {
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function rowsByStaffDateV109(assignments) {
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code: normDutyV109(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySortV109(a.duty_code) - dutySortV109(b.duty_code)));
    return map;
  }
  function renderExcelRosterMatrixV109(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const active = staffActiveForRosterV109(assignments);
    const byStaffDate = rowsByStaffDateV109(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDateCellV109(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextV109(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabelV109(a.duty_code))).join('<br>') : escapeHtml(leaveText || '');
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }
  function scheduleSubTabV109(id, label) {
    return `<button class="${state.scheduleMobileView === id ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${id}" type="button">${label}</button>`;
  }
  function renderOldByDayV109(assignments, codes, y, m, last) {
    return `<div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV109(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length:last }, (_, i) => i + 1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${formatDateCellV109(date)}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedCodesForDateV109(date, assignments).includes(normDutyV109(code))) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normDutyV109(a.duty_code) === normDutyV109(code));
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
  }
  function renderOldByPersonV109(assignments) {
    const active = staffActiveForRosterV109(assignments);
    return `<div class="table-wrap"><table class="schedule-by-person-v107"><thead><tr><th>เจ้าหน้าที่</th><th>รายการเวรในเดือนนี้</th><th>รวม</th></tr></thead><tbody>${active.map(st => {
      const rows = assignments.filter(a => String(a.staff_id) === String(st.id)).sort((a,b) => String(a.duty_date).localeCompare(String(b.duty_date)) || dutySortV109(a.duty_code) - dutySortV109(b.duty_code));
      return `<tr><td>${staffPill(st)}</td><td>${rows.length ? rows.map(a => `<span class="mini-duty-chip-v107">${formatThaiDate(a.duty_date)} ${escapeHtml(dutyLabelV109(a.duty_code))}${renderTradeButton(a)}</span>`).join(' ') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</td><td>${rows.length}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldOtV109(assignments) {
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = staffActiveForRosterV109(assignments);
    return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${active.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.pay || 0).toLocaleString()}</td><td>${(r.units || 0).toFixed(1)}</td><td>${r.chbd || 0}</td><td>${r.ch9 || 0}</td><td>${r.ch3 || 0}</td><td>${r.ch4 || 0}</td><td>${r.weekend || 0}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldMatrixV109(assignments, y, m, last) {
    const active = staffActiveForRosterV109(assignments);
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const byStaffDate = rowsByStaffDateV109(assignments);
    return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${formatDateCellV109(`${y}-${pad(m)}-${pad(day)}`)}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rows = byStaffDate[`${s.id}|${date}`] || [];
      const leaveText = leaveTextV109(s.id, date);
      const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
      return `<td class="${cls}">${rows.length ? `<b>${rows.map(a => escapeHtml(dutyLabelV109(a.duty_code))).join('<br>')}</b>` : (leaveText ? `<span class="no-duty-one-line-v107">${escapeHtml(leaveText)}</span>` : '')}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderMobileScheduleByDayV109(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return `<div class="mobile-schedule-list">${Array.from({ length:last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = allowedCodesForDateV109(date, assignments).map(code => ({ code, slot: assignments.find(a => a.duty_date === date && normDutyV109(a.duty_code) === code) })).filter(x => x.slot?.staff_id);
      return `<div class="schedule-day-card ${isHolidayDate(date) || isWeekend(date) ? 'weekend-row' : ''}"><div class="mobile-day-head"><b>${day}</b><span>${formatDateCellV109(date)}</span>${isHolidayDate(date) ? badge(holidayName(date), 'yellow') : ''}</div>${slots.length ? slots.map(({ code, slot }) => `<div class="mobile-duty-line"><b>${escapeHtml(dutyLabelV109(code))}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV109(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = [...new Set((assignments || []).map(a => normDutyV109(a.duty_code)).filter(Boolean))].sort((a,b) => dutySortV109(a)-dutySortV109(b));
    const useCodes = codes.length ? codes : V109_DUTY_CODES;
    const view = state.scheduleMobileView || 'day';
    const detail = view === 'person'
      ? renderOldByPersonV109(assignments)
      : view === 'ot'
        ? renderOldOtV109(assignments)
        : view === 'table'
          ? renderOldMatrixV109(assignments, y, m, last)
          : renderOldByDayV109(assignments, useCodes, y, m, last);
    const oldPanel = `<details class="old-duty-table-v107 old-duty-table-v109" open><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary><div class="old-duty-tabs-v109 no-print">${scheduleSubTabV109('day','ดูตามวัน')}${scheduleSubTabV109('person','ดูตามคน')}${scheduleSubTabV109('ot','สรุปตามคน')}${scheduleSubTabV109('table','ตารางทั้งเดือน')}</div>${detail}</details>`;
    return renderExcelRosterMatrixV109(assignments) + oldPanel;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;
  renderSchedulePersonMatrix = function renderSchedulePersonMatrixV109(assignments) { return renderExcelRosterMatrixV109(assignments); };
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix;
  renderMobileScheduleByDay = renderMobileScheduleByDayV109;
  window.renderMobileScheduleByDay = renderMobileScheduleByDay;

  // ---- OT page ----
  function otMonthRowsV109() {
    const key = state.monthKey || todayStr().slice(0,7);
    const rows = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key));
    return isAdmin() ? rows : rows.filter(x => String(x.staff_id) === String(currentStaffId()));
  }
  function autoHoursFromNoteV109(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  calcOtHours = function calcOtHoursV109(r) {
    const auto = autoHoursFromNoteV109(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.end_time) return 0;
    const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
    let end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;
  function cleanOtNoteV109(note='') {
    return String(note || '').replace(/\s*\|?\s*AUTO_HOURS\s*:\s*[0-9]+(?:\.[0-9]+)?/i, '').trim();
  }
  function renderOtTableV109(rows) {
    if (!rows.length) return empty('ยังไม่มีรายการ OT');
    const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV109(r.note || ''))}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
    const cards = `<div class="mobile-cards ot-mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV109(r.note || ''))}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    return table + cards;
  }
  renderOtTable = renderOtTableV109;
  window.renderOtTable = renderOtTable;
  function renderOtSummaryV109() {
    const key = state.monthKey;
    const approved = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key) && x.status === 'อนุมัติ');
    const map = {};
    approved.forEach(r => {
      map[r.staff_id] = map[r.staff_id] || { hours:0, incharge:0, count:0 };
      map[r.staff_id].hours += calcOtHours(r);
      map[r.staff_id].count++;
    });
    const inchargeId = currentInchargeForMonth(key);
    if (inchargeId) {
      map[inchargeId] = map[inchargeId] || { hours:0, incharge:0, count:0 };
      map[inchargeId].incharge += 8;
    }
    const rows = Object.entries(map).filter(([,r]) => (r.hours || 0) || (r.incharge || 0) || (r.count || 0));
    if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
    rows.sort((a,b) => staffNick(a[0]).localeCompare(staffNick(b[0]), 'th'));
    return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมงจากเวร/OT</th><th>ชั่วโมงอินชาร์จ</th><th>รวมชั่วโมง OT</th><th>จำนวนรายการ</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.incharge || 0).toFixed(1)}</td><td>${((r.hours || 0) + (r.incharge || 0)).toFixed(1)}</td><td>${r.count || 0}</td></tr>`).join('')}</tbody></table></div>`;
  }
  renderOtSummary = renderOtSummaryV109;
  window.renderOtSummary = renderOtSummary;
  renderOtPage = function renderOtPageV109() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = (state.rosterAssignments || []).some(x => x.duty_date === todayStr() && String(x.staff_id) === String(currentStaffId()));
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const rows = otMonthRowsV109();
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${dutyLabelV109(x.assignment.duty_code)}`).join('<br>')}</div>` : '';
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
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3></div>
        ${renderOtTableV109(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <div class="section-title"><div><h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว และบวกอินชาร์จประจำเดือน 8 ชม.</p></div>${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div>${renderOtSummaryV109()}
      </div>
    </div>`;
  };
  window.renderOtPage = renderOtPage;

  function scheduledAssignmentsForWorkerV109(date, workerId, proxyOptions=[]) {
    const direct = (state.rosterAssignments || []).filter(x => x.duty_date === date && String(x.staff_id) === String(workerId));
    if (direct.length) return direct;
    return (proxyOptions || []).map(x => x.assignment).filter(Boolean);
  }
  async function insertCheckInOtQueueV109(workerId, date, proxyOptions=[]) {
    const assignments = scheduledAssignmentsForWorkerV109(date, workerId, proxyOptions);
    if (!assignments.length) return;
    const already = (state.otRequests || []).some(r => String(r.staff_id) === String(workerId) && r.work_date === date && String(r.reason || '').includes('ยืนยันอยู่เวร'));
    if (already) return;
    const totalHours = assignments.reduce((sum, a) => sum + (dutyMetrics(a, workerId).hours || 0), 0);
    const dutyText = assignments.map(a => dutyLabelV109(a.duty_code)).join(', ');
    const note = `เวรตามตาราง: ${dutyText} | AUTO_HOURS:${totalHours}`;
    const row = { staff_id: workerId, work_date: date, end_time: null, reason: 'ยืนยันอยู่เวรตามตาราง', note, status: 'รออนุมัติ', check_out_at: new Date().toISOString(), device: navigator.userAgent.slice(0, 250) };
    const { error } = await sb.from('ot_requests').insert(row);
    if (error) console.warn('insert duty OT queue failed', error.message || error);
  }
  checkIn = async function checkInV109() {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const date = todayStr();
    const proxyOptions = selfPaidDutyProxyOptions(date);
    let staffIdToLog = currentStaffId();
    let proxyText = '';
    if (!(state.rosterAssignments || []).some(x => x.duty_date === date && String(x.staff_id) === String(currentStaffId())) && proxyOptions.length) {
      const pick = proxyOptions[0];
      staffIdToLog = pick.assignment.staff_id;
      proxyText = ` | ลงชื่อแทนโดย ${staffNick(currentStaffId())} จากข้อตกลงจ่ายกันเอง request:${pick.request.id}`;
    }
    const device = (navigator.userAgent + proxyText).slice(0, 250);
    const { error } = await sb.from('attendance_logs').insert({ staff_id: staffIdToLog, duty_date: date, check_in_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device });
    if (error) return showToast(error.message);
    await insertCheckInOtQueueV109(currentStaffId(), date, proxyOptions);
    await loadAllData(); renderPage();
    showToast(proxyText ? 'ยืนยันวันอยู่เวรแทนเจ้าของเวรเดิมแล้ว และส่งเข้ารอ Admin อนุมัติ OT แล้ว' : 'ยืนยันวันอยู่เวรแล้ว และส่งเข้ารอ Admin อนุมัติ OT แล้ว');
  };
  window.checkIn = checkIn;

  saveOtRequest = async function saveOtRequestV109(form) {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const fd = new FormData(form);
    const reason = fd.get('reason');
    const note = fd.get('note') || '';
    if (reason === 'อื่นๆ' && !String(note).trim()) return showToast('กรุณาใส่เหตุผลในช่องรายละเอียด');
    const row = { staff_id: currentStaffId(), work_date: fd.get('work_date'), end_time: fd.get('end_time'), reason, note, status: 'รออนุมัติ', check_out_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
    const { error } = await sb.from('ot_requests').insert(row);
    if (error) return showToast(error.message);
    await loadAllData(); renderPage(); showToast('ส่งคำขอ OT เพิ่มแล้ว และรอ Admin อนุมัติ');
  };
  window.saveOtRequest = saveOtRequest;

  const oldHandleChangeV109 = window.handleChange || handleChange;
  handleChange = function handleChangeV109(e) {
    if (e.target?.id === 'otReasonSelect') {
      const note = document.getElementById('otNoteInput');
      if (note) note.placeholder = e.target.value === 'อื่นๆ' ? 'ใส่เหตุผล' : 'เช่น ปั่นเลือดถึง 18:20 / รอเทียบ LIS';
      return oldHandleChangeV109(e);
    }
    return oldHandleChangeV109(e);
  };
  window.handleChange = handleChange;

  const oldHandleClickV109 = window.handleClick || handleClick;
  handleClick = async function handleClickV109(e) {
    const t = e.target.closest('button, [data-schedule-mobile-view]');
    if (t?.dataset?.scheduleMobileView) { state.scheduleMobileView = t.dataset.scheduleMobileView; renderPage(); return; }
    return oldHandleClickV109(e);
  };
  window.handleClick = handleClick;

  document.addEventListener('click', function(e) {
    const t = e.target.closest('[data-schedule-mobile-view]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    state.scheduleMobileView = t.dataset.scheduleMobileView;
    renderPage();
  }, true);
})();
/* CNMI Staff Planner Patch V110
   - Compact Excel roster cells + display all ช9 variants as ช9
   - Remove duplicate lower roster sub-tabs; use the main middle tabs only
   - Add month filters to OT approval and monthly OT summary
*/
(function patchV110(){
  window.CNMI_PATCH_V110 = true;

  const V110_DUTY_CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function normDutyV110(code='') {
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4A' || c === 'ช4B' || c === 'ช4') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelV110(code='') {
    const c = normDutyV110(code);
    if (c === 'ช4-MT/แตง') return 'ช4';
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง' || c === 'ช9-MT') return 'ช9';
    return c;
  }
  function leaveTextV110(staffId, date) {
    const rows = (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function allowedCodesForDateV110(date, assignments=[]) {
    let codes = [];
    try { codes = allowedDutyCodesForDate(date) || []; } catch (_) { codes = []; }
    const present = (assignments || []).filter(a => a.duty_date === date).map(a => normDutyV110(a.duty_code));
    const merged = [...new Set([...codes.map(normDutyV110), ...present])];
    return V110_DUTY_CODES.filter(c => merged.includes(c));
  }
  function dutySortV110(code) {
    const i = V110_DUTY_CODES.indexOf(normDutyV110(code));
    return i < 0 ? 999 : i;
  }
  function formatDateCellV110(date) {
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }
  function staffActiveForRosterV110(assignments) {
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function rowsByStaffDateV110(assignments) {
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code: normDutyV110(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySortV110(a.duty_code) - dutySortV110(b.duty_code)));
    return map;
  }
  function renderExcelRosterMatrixV110(assignments) {
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const active = staffActiveForRosterV110(assignments);
    const byStaffDate = rowsByStaffDateV110(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109 excel-roster-section-v110">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109 excel-roster-wrap-v110"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109 excel-roster-table-v110"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDateCellV110(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextV110(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabelV110(a.duty_code))).join('<br>') : escapeHtml(leaveText || '');
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }
  function renderOldByDayV110(assignments, codes, y, m, last) {
    return `<div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV110(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length:last }, (_, i) => i + 1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${formatDateCellV110(date)}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedCodesForDateV110(date, assignments).includes(normDutyV110(code))) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normDutyV110(a.duty_code) === normDutyV110(code));
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
  }
  function renderOldByPersonV110(assignments) {
    const active = staffActiveForRosterV110(assignments);
    return `<div class="table-wrap"><table class="schedule-by-person-v107"><thead><tr><th>เจ้าหน้าที่</th><th>รายการเวรในเดือนนี้</th><th>รวม</th></tr></thead><tbody>${active.map(st => {
      const rows = assignments.filter(a => String(a.staff_id) === String(st.id)).sort((a,b) => String(a.duty_date).localeCompare(String(b.duty_date)) || dutySortV110(a.duty_code) - dutySortV110(b.duty_code));
      return `<tr><td>${staffPill(st)}</td><td>${rows.length ? rows.map(a => `<span class="mini-duty-chip-v107">${formatThaiDate(a.duty_date)} ${escapeHtml(dutyLabelV110(a.duty_code))}${renderTradeButton(a)}</span>`).join(' ') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</td><td>${rows.length}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldOtV110(assignments) {
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = staffActiveForRosterV110(assignments);
    return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>${active.map(s => {
      const r = stats[s.id] || {};
      return `<tr><td>${staffPill(s)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.pay || 0).toLocaleString()}</td><td>${(r.units || 0).toFixed(1)}</td><td>${r.chbd || 0}</td><td>${r.ch9 || 0}</td><td>${r.ch3 || 0}</td><td>${r.ch4 || 0}</td><td>${r.weekend || 0}</td></tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderOldMatrixV110(assignments, y, m, last) {
    const active = staffActiveForRosterV110(assignments);
    const days = Array.from({ length:last }, (_, i) => i + 1);
    const byStaffDate = rowsByStaffDateV110(assignments);
    return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${formatDateCellV110(`${y}-${pad(m)}-${pad(day)}`)}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rows = byStaffDate[`${s.id}|${date}`] || [];
      const leaveText = leaveTextV110(s.id, date);
      const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
      return `<td class="${cls}">${rows.length ? `<b>${rows.map(a => escapeHtml(dutyLabelV110(a.duty_code))).join('<br>')}</b>` : (leaveText ? `<span class="no-duty-one-line-v107">${escapeHtml(leaveText)}</span>` : '')}</td>`;
    }).join('')}</tr>`).join('')}</tbody></table></div>`;
  }
  function renderReadOnlyScheduleV110(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = [...new Set((assignments || []).map(a => normDutyV110(a.duty_code)).filter(Boolean))].sort((a,b) => dutySortV110(a)-dutySortV110(b));
    const useCodes = codes.length ? codes : V110_DUTY_CODES;
    const view = state.scheduleMobileView || 'day';
    const detail = view === 'person'
      ? renderOldByPersonV110(assignments)
      : view === 'ot'
        ? renderOldOtV110(assignments)
        : view === 'table'
          ? renderOldMatrixV110(assignments, y, m, last)
          : renderOldByDayV110(assignments, useCodes, y, m, last);
    const oldPanel = `<details class="old-duty-table-v107 old-duty-table-v109 old-duty-table-v110" open><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary>${detail}</details>`;
    return renderExcelRosterMatrixV110(assignments) + oldPanel;
  }
  renderReadOnlySchedule = renderReadOnlyScheduleV110;
  window.renderReadOnlySchedule = renderReadOnlySchedule;
  renderSchedulePersonMatrix = function renderSchedulePersonMatrixV110(assignments) { return renderExcelRosterMatrixV110(assignments); };
  window.renderSchedulePersonMatrix = renderSchedulePersonMatrix;

  // ---- OT month filter ----
  function currentOtMonthV110() {
    return state.otMonthKey || state.monthKey || todayStr().slice(0,7);
  }
  function otMonthRowsV110() {
    const key = currentOtMonthV110();
    const rows = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key));
    return isAdmin() ? rows : rows.filter(x => String(x.staff_id) === String(currentStaffId()));
  }
  function autoHoursFromNoteV110(note='') {
    const m = String(note || '').match(/AUTO_HOURS\s*:\s*([0-9]+(?:\.[0-9]+)?)/i);
    return m ? Number(m[1]) : null;
  }
  function cleanOtNoteV110(note='') {
    return String(note || '').replace(/\s*\|?\s*AUTO_HOURS\s*:\s*[0-9]+(?:\.[0-9]+)?/i, '').trim();
  }
  calcOtHours = function calcOtHoursV110(r) {
    const auto = autoHoursFromNoteV110(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.end_time) return 0;
    const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
    let end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, (end - start) / 36e5);
  };
  window.calcOtHours = calcOtHours;
  function renderMonthFilterV110(extraClass='') {
    return `<label class="month-filter-v110 ${extraClass}">เดือน <input type="month" data-ot-month-filter value="${currentOtMonthV110()}"></label>`;
  }
  function renderOtTableV110(rows) {
    if (!rows.length) return empty('ยังไม่มีรายการ OT ในเดือนนี้');
    const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV110(r.note || ''))}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
    </tbody></table></div>`;
    const cards = `<div class="mobile-cards ot-mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">${formatThaiDateTime(r.check_out_at || r.created_at)}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(cleanOtNoteV110(r.note || ''))}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
    return table + cards;
  }
  renderOtTable = renderOtTableV110;
  window.renderOtTable = renderOtTable;
  function renderOtSummaryV110() {
    const key = currentOtMonthV110();
    const approved = (state.otRequests || []).filter(x => String(x.work_date || '').startsWith(key) && x.status === 'อนุมัติ');
    const map = {};
    approved.forEach(r => {
      map[r.staff_id] = map[r.staff_id] || { hours:0, incharge:0, count:0 };
      map[r.staff_id].hours += calcOtHours(r);
      map[r.staff_id].count++;
    });
    const inchargeId = currentInchargeForMonth(key);
    if (inchargeId) {
      map[inchargeId] = map[inchargeId] || { hours:0, incharge:0, count:0 };
      map[inchargeId].incharge += 8;
    }
    const rows = Object.entries(map).filter(([,r]) => (r.hours || 0) || (r.incharge || 0) || (r.count || 0));
    if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
    rows.sort((a,b) => staffNick(a[0]).localeCompare(staffNick(b[0]), 'th'));
    return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมงจากเวร/OT</th><th>ชั่วโมงอินชาร์จ</th><th>รวมชั่วโมง OT</th><th>จำนวนรายการ</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${(r.hours || 0).toFixed(1)}</td><td>${(r.incharge || 0).toFixed(1)}</td><td>${((r.hours || 0) + (r.incharge || 0)).toFixed(1)}</td><td>${r.count || 0}</td></tr>`).join('')}</tbody></table></div>`;
  }
  renderOtSummary = renderOtSummaryV110;
  window.renderOtSummary = renderOtSummary;
  renderOtPage = function renderOtPageV110() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = (state.rosterAssignments || []).some(x => x.duty_date === todayStr() && String(x.staff_id) === String(currentStaffId()));
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const rows = otMonthRowsV110();
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${dutyLabelV110(x.assignment.duty_code)}`).join('<br>')}</div>` : '';
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
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${renderMonthFilterV110()}</div>
        ${renderOtTableV110(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <div class="section-title"><div><h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว และบวกอินชาร์จประจำเดือน 8 ชม.</p></div><div class="actions">${renderMonthFilterV110('compact')}${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div></div>${renderOtSummaryV110()}
      </div>
    </div>`;
  };
  window.renderOtPage = renderOtPage;

  const oldHandleChangeV110 = window.handleChange || handleChange;
  handleChange = function handleChangeV110(e) {
    if (e.target?.dataset?.otMonthFilter !== undefined) {
      state.otMonthKey = e.target.value || todayStr().slice(0,7);
      state.monthKey = state.otMonthKey;
      renderPage();
      return;
    }
    return oldHandleChangeV110(e);
  };
  window.handleChange = handleChange;
})();
/* CNMI Staff Planner Patch V111
   Mobile-only roster page polish
   - Mobile default view = ตาราง (Excel roster)
   - Excel roster appears only inside the ตาราง tab on mobile
   - ดูตามวัน = calendar cards
   - สรุป OT = readable cards with detailed duty counts and days off
   - Keep desktop behavior untouched
*/
(function patchV111(){
  window.CNMI_PATCH_V111 = true;

  const oldRenderReadOnlyScheduleV111 = window.renderReadOnlySchedule || renderReadOnlySchedule;
  const oldHandleClickV111 = window.handleClick || handleClick;

  const DUTY_ORDER_V111 = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function isMobileV111(){
    try { return window.matchMedia && window.matchMedia('(max-width: 820px)').matches; }
    catch(_) { return window.innerWidth <= 820; }
  }
  function normDutyV111(code=''){
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4' || c === 'ช4A' || c === 'ช4B') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabelV111(code=''){
    const c = normDutyV111(code);
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 'ช9';
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function dutySortV111(code){
    const idx = DUTY_ORDER_V111.indexOf(normDutyV111(code));
    return idx < 0 ? 999 : idx;
  }
  function staffActiveForRosterV111(assignments){
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function rowsByStaffDateV111(assignments){
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code: normDutyV111(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySortV111(a.duty_code) - dutySortV111(b.duty_code)));
    return map;
  }
  function leaveRowsV111(staffId, date){
    return (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
  }
  function leaveTextV111(staffId, date){
    const rows = leaveRowsV111(staffId, date);
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function hasLeaveTypeV111(staffId, date, types){
    return leaveRowsV111(staffId, date).some(r => types.includes(r.type));
  }
  function formatDowV111(date){
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }
  function monthPartsV111(){
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return { y, m, last, days:Array.from({ length:last }, (_, i) => i + 1) };
  }

  function renderMobileExcelRosterV111(assignments){
    const { y, m, days } = monthPartsV111();
    const active = staffActiveForRosterV111(assignments);
    const byStaffDate = rowsByStaffDateV111(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109 excel-roster-section-v110 excel-roster-section-v111 mobile-only-roster-v111">
      <div class="section-title"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109 excel-roster-wrap-v110 excel-roster-wrap-v111"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109 excel-roster-table-v110 excel-roster-table-v111"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDowV111(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>
        ${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${escapeHtml(st.full_name || st.nickname || '')}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
          const date = `${y}-${pad(m)}-${pad(day)}`;
          const rows = byStaffDate[`${st.id}|${date}`] || [];
          const leaveText = leaveTextV111(st.id, date);
          const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', leaveText ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
          const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabelV111(a.duty_code))).join('<br>') : escapeHtml(leaveText || '');
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }

  function renderMobileScheduleByDayV111(assignments){
    const { y, m, last } = monthPartsV111();
    return `<div class="mobile-schedule-list mobile-day-calendar-v111">${Array.from({ length:last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || [])
        .filter(a => a.duty_date === date && a.staff_id)
        .sort((a,b) => dutySortV111(a.duty_code) - dutySortV111(b.duty_code));
      return `<div class="schedule-day-card ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}"><div class="mobile-day-head"><b>${day}</b><span>${formatDowV111(date)}</span>${isHolidayDate(date) ? badge(holidayName(date),'yellow') : ''}</div>${slots.length ? slots.map(slot => `<div class="mobile-duty-line"><b>${escapeHtml(dutyLabelV111(slot.duty_code))}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  }

  function renderMobileScheduleByPersonV111(assignments){
    const active = staffActiveForRosterV111(assignments);
    return `<div class="mobile-schedule-person-list">${active.map(s => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySortV111(a.duty_code)-dutySortV111(b.duty_code));
      return `<div class="schedule-person-card" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}"><div class="person-card-head"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${formatThaiDate(a.duty_date)}</span><b>${escapeHtml(dutyLabelV111(a.duty_code))}</b>${renderTradeButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
    }).join('')}</div>`;
  }

  function countDaysOffV111(staffId, assignments){
    const { y, m, days } = monthPartsV111();
    let count = 0;
    days.forEach(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staffId) && a.duty_date === date);
      if (hasDuty) return;
      if (hasLeaveTypeV111(staffId, date, ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด'])) return;
      const noDutyWeekend = isWeekend(date) && hasLeaveTypeV111(staffId, date, ['ไม่รับเวร']);
      if (isWeekend(date) || isHolidayDate(date) || noDutyWeekend) count += 1;
    });
    return count;
  }
  function dutyCountsV111(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => {
      const d = normDutyV111(a.duty_code);
      c.total += 1;
      if (d === 'ชบด1') c.chbd1 += 1;
      else if (d === 'ชบด2') c.chbd2 += 1;
      else if (d === 'ชบด3') c.chbd3 += 1;
      else if (d === 'ช3A') c.ch3A += 1;
      else if (d === 'ช3B') c.ch3B += 1;
      else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9 += 1;
      else if (d === 'ช4-MT/แตง') c.ch4 += 1;
    });
    return c;
  }
  function renderMobileScheduleOtCardsV111(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = staffActiveForRosterV111(assignments);
    return `<div class="mobile-ot-summary-list-v111">${active.map(s => {
      const r = stats[s.id] || {};
      const counts = dutyCountsV111(s.id, assignments);
      const hours = Number(r.hours || 0);
      const incharge = 0;
      const totalHours = hours + incharge;
      const pay = Number(r.pay || 0);
      return `<button class="ot-summary-card-v111" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-staff-stat="${s.id}" type="button">
        <div class="ot-card-head-v111"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</span></div>
        <div class="ot-card-grid-v111">
          <span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b>
          <span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b>
          <span>รวม OT:</span><b>${totalHours.toFixed(1)}</b>
          <span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b>
          <span>จำนวนเวร:</span><b>${counts.total}</b>
          <span>วันที่ได้หยุด:</span><b>${countDaysOffV111(s.id, assignments)}</b>
        </div>
        <div class="ot-duty-counts-v111">
          <span>ชบด1: <b>${counts.chbd1}</b></span>
          <span>ชบด2: <b>${counts.chbd2}</b></span>
          <span>ชบด3: <b>${counts.chbd3}</b></span>
          <span>ช9: <b>${counts.ch9}</b></span>
          <span>ช3A: <b>${counts.ch3A}</b></span>
          <span>ช3B: <b>${counts.ch3B}</b></span>
          <span>ช4: <b>${counts.ch4}</b></span>
        </div>
      </button>`;
    }).join('')}</div>`;
  }

  function renderMobileSelectedViewV111(assignments){
    const view = state._v111MobileScheduleTouched ? (state.scheduleMobileView || 'table') : 'table';
    if (view === 'person') return renderMobileScheduleByPersonV111(assignments);
    if (view === 'ot') return renderMobileScheduleOtCardsV111(assignments);
    if (view === 'day') return renderMobileScheduleByDayV111(assignments);
    return renderMobileExcelRosterV111(assignments);
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV111(assignments){
    if (!isMobileV111()) return oldRenderReadOnlyScheduleV111(assignments);
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    return `<div class="mobile-schedule-view-v111">${renderMobileSelectedViewV111(assignments)}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;

  handleClick = function handleClickV111(e){
    const tab = e.target?.closest?.('[data-schedule-mobile-view]');
    if (tab) state._v111MobileScheduleTouched = true;
    return oldHandleClickV111(e);
  };
  window.handleClick = handleClick;
})();
/* CNMI Staff Planner Patch V112
   Mobile-only roster tab fix
   - ตาราง tab = Excel roster only
   - ดูตามวัน = compact month cards/grid
   - สรุป OT = mobile cards
   - Excel roster no longer sticks across all mobile tabs
   - Desktop behavior untouched
*/
(function patchV112(){
  window.CNMI_PATCH_V112 = true;

  const DUTY_ORDER = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function isMobile(){
    try { return window.matchMedia && window.matchMedia('(max-width: 820px)').matches; }
    catch(_) { return window.innerWidth <= 820; }
  }
  function normDuty(code=''){
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4' || c === 'ช4A' || c === 'ช4B') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabel(code=''){
    const c = normDuty(code);
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 'ช9';
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function dutySort(code){
    const idx = DUTY_ORDER.indexOf(normDuty(code));
    return idx < 0 ? 999 : idx;
  }
  function monthParts(){
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return { y, m, last, days:Array.from({ length:last }, (_, i) => i + 1) };
  }
  function activeStaff(assignments){
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function byStaffDate(assignments){
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code:normDuty(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySort(a.duty_code) - dutySort(b.duty_code)));
    return map;
  }
  function leaveRows(staffId, date){
    return (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
  }
  function leaveText(staffId, date){
    const rows = leaveRows(staffId, date);
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function hasLeaveType(staffId, date, types){
    return leaveRows(staffId, date).some(r => types.includes(r.type));
  }
  function formatDow(date){
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }

  function renderExcel(assignments){
    const { y, m, days } = monthParts();
    const active = activeStaff(assignments);
    const map = byStaffDate(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109 excel-roster-section-v110 excel-roster-section-v111 excel-roster-section-v112 mobile-only-roster-v111 mobile-only-roster-v112">
      <div class="section-title mobile-roster-title-v112"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109 excel-roster-wrap-v110 excel-roster-wrap-v111 excel-roster-wrap-v112"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109 excel-roster-table-v110 excel-roster-table-v111 excel-roster-table-v112"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDow(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${escapeHtml(st.full_name || st.nickname || '')}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rows = map[`${st.id}|${date}`] || [];
        const txt = leaveText(st.id, date);
        const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', txt ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
        const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabel(a.duty_code))).join('<br>') : escapeHtml(txt || '');
        const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
        return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  function renderDayGrid(assignments){
    const { y, m, last } = monthParts();
    const first = new Date(y, m - 1, 1).getDay(); // 0 Sun
    const blanks = Array.from({ length:first }, (_, i) => `<div class="month-day-card-v112 muted-card-v112"><b></b></div>`).join('');
    const cards = Array.from({ length:last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutySort(a.duty_code)-dutySort(b.duty_code));
      const maxShow = 4;
      return `<button type="button" class="month-day-card-v112 ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}" data-day-detail="${date}">
        <div class="month-day-head-v112"><b>${day}</b><span>${formatDow(date)}</span></div>
        <div class="month-duty-list-v112">${slots.slice(0,maxShow).map(a => `<span><b>${escapeHtml(dutyLabel(a.duty_code))}</b> ${escapeHtml(staffNick(a.staff_id))}</span>`).join('')}${slots.length > maxShow ? `<em>+${slots.length - maxShow}</em>` : ''}${!slots.length ? `<small>ไม่มีเวร</small>` : ''}</div>
      </button>`;
    }).join('');
    return `<div class="mobile-day-month-v112"><div class="month-dow-row-v112"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="month-grid-v112">${blanks}${cards}</div></div>`;
  }

  function renderPerson(assignments){
    const active = activeStaff(assignments);
    return `<div class="mobile-schedule-person-list mobile-person-list-v112">${active.map(s => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code));
      return `<div class="schedule-person-card" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}"><div class="person-card-head"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${formatThaiDate(a.duty_date)}</span><b>${escapeHtml(dutyLabel(a.duty_code))}</b>${renderTradeButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
    }).join('')}</div>`;
  }

  function countDaysOff(staffId, assignments){
    const { y, m, days } = monthParts();
    let count = 0;
    days.forEach(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staffId) && a.duty_date === date);
      if (hasDuty) return;
      if (hasLeaveType(staffId, date, ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด'])) return;
      if (isWeekend(date) || isHolidayDate(date)) count += 1;
    });
    return count;
  }
  function dutyCounts(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => {
      const d = normDuty(a.duty_code);
      c.total += 1;
      if (d === 'ชบด1') c.chbd1 += 1;
      else if (d === 'ชบด2') c.chbd2 += 1;
      else if (d === 'ชบด3') c.chbd3 += 1;
      else if (d === 'ช3A') c.ch3A += 1;
      else if (d === 'ช3B') c.ch3B += 1;
      else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9 += 1;
      else if (d === 'ช4-MT/แตง') c.ch4 += 1;
    });
    return c;
  }
  function renderOtCards(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = activeStaff(assignments);
    const inchargeId = currentInchargeForMonth(state.monthKey);
    return `<div class="mobile-ot-summary-list-v111 mobile-ot-summary-list-v112">${active.map(s => {
      const r = stats[s.id] || {};
      const counts = dutyCounts(s.id, assignments);
      const hours = Number(r.hours || 0);
      const incharge = String(inchargeId || '') === String(s.id) ? 8 : 0;
      const totalHours = hours + incharge;
      const pay = Number(r.pay || 0);
      return `<button class="ot-summary-card-v111 ot-summary-card-v112" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-staff-stat="${s.id}" type="button">
        <div class="ot-card-head-v111"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</span></div>
        <div class="ot-card-grid-v111">
          <span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b>
          <span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b>
          <span>รวม OT:</span><b>${totalHours.toFixed(1)}</b>
          <span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b>
          <span>จำนวนเวร:</span><b>${counts.total}</b>
          <span>วันที่ได้หยุด:</span><b>${countDaysOff(s.id, assignments)}</b>
        </div>
        <div class="ot-duty-counts-v111">
          <span>ชบด1: <b>${counts.chbd1}</b></span><span>ชบด2: <b>${counts.chbd2}</b></span><span>ชบด3: <b>${counts.chbd3}</b></span><span>ช9: <b>${counts.ch9}</b></span><span>ช3A: <b>${counts.ch3A}</b></span><span>ช3B: <b>${counts.ch3B}</b></span><span>ช4: <b>${counts.ch4}</b></span>
        </div>
      </button>`;
    }).join('')}</div>`;
  }

  const oldRenderReadOnly = window.renderReadOnlySchedule || renderReadOnlySchedule;
  renderReadOnlySchedule = function renderReadOnlyScheduleV112(assignments){
    if (!isMobile()) return oldRenderReadOnly(assignments);
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const view = state.scheduleMobileView || 'table';
    let html = '';
    if (view === 'day') html = renderDayGrid(assignments);
    else if (view === 'person') html = renderPerson(assignments);
    else if (view === 'ot') html = renderOtCards(assignments);
    else html = renderExcel(assignments);
    return `<div class="mobile-schedule-view-v111 mobile-schedule-view-v112">${html}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;

  const oldRenderMonthly = window.renderMonthlySchedulePage || renderMonthlySchedulePage;
  renderMonthlySchedulePage = function renderMonthlySchedulePageV112(){
    if (isMobile() && !state._v112MobileScheduleDefaulted) {
      state.scheduleMobileView = 'table';
      state._v112MobileScheduleDefaulted = true;
    }
    return oldRenderMonthly();
  };
  window.renderMonthlySchedulePage = renderMonthlySchedulePage;

  if (isMobile()) state.scheduleMobileView = state.scheduleMobileView || 'table';

  document.addEventListener('click', function(e){
    const t = e.target.closest?.('[data-schedule-mobile-view]');
    if (!t) return;
    state.scheduleMobileView = t.dataset.scheduleMobileView || 'table';
    state._v112MobileScheduleDefaulted = true;
  }, true);
})();
/* CNMI Staff Planner Patch V113
   Mobile-only roster polish
   - ตาราง tab: keep current Excel style, reduce row height for phone space
   - ดูตามวัน tab: show compact month cards with staff-colored duty pills
   - Desktop untouched
*/
(function patchV113(){
  window.CNMI_PATCH_V113 = true;

  const DUTY_ORDER = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง'];

  function isMobile(){
    try { return window.matchMedia && window.matchMedia('(max-width: 820px)').matches; }
    catch(_) { return window.innerWidth <= 820; }
  }
  function normDuty(code=''){
    const c = String(code || '').trim();
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    if (c === 'ช4' || c === 'ช4A' || c === 'ช4B') return 'ช4-MT/แตง';
    return c;
  }
  function dutyLabel(code=''){
    const c = normDuty(code);
    if (c === 'ช9-เคิก' || c === 'ช9-MT/แตง') return 'ช9';
    if (c === 'ช4-MT/แตง') return 'ช4';
    return c;
  }
  function dutySort(code){
    const idx = DUTY_ORDER.indexOf(normDuty(code));
    return idx < 0 ? 999 : idx;
  }
  function monthParts(){
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return { y, m, last, days:Array.from({ length:last }, (_, i) => i + 1) };
  }
  function activeStaff(assignments){
    return orderedStaff((state.staff || []).filter(s => isRosterEnabled(s) || (assignments || []).some(a => String(a.staff_id) === String(s.id))));
  }
  function byStaffDate(assignments){
    const map = {};
    (assignments || []).filter(a => a.staff_id).forEach(a0 => {
      const a = { ...a0, duty_code:normDuty(a0.duty_code) };
      const key = `${a.staff_id}|${a.duty_date}`;
      map[key] = map[key] || [];
      map[key].push(a);
    });
    Object.values(map).forEach(arr => arr.sort((a,b) => dutySort(a.duty_code) - dutySort(b.duty_code)));
    return map;
  }
  function leaveRows(staffId, date){
    return (state.leaves || []).filter(l => String(l.staff_id) === String(staffId) && overlapsDate(l, date));
  }
  function leaveText(staffId, date){
    const rows = leaveRows(staffId, date);
    if (!rows.length) return '';
    const priority = rows.find(r => r.type === 'ไม่รับเวร') || rows[0];
    const map = { 'ลาพักร้อน':'Vac', 'ลากิจ':'Per', 'ลาป่วย':'Sick', 'ลาคลอด':'Mat', 'ไม่รับเวร':'ไม่รับเวร' };
    return map[priority.type] || priority.type || 'ลา';
  }
  function hasLeaveType(staffId, date, types){
    return leaveRows(staffId, date).some(r => types.includes(r.type));
  }
  function formatDow(date){
    return parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
  }

  function renderExcel(assignments){
    const { y, m, days } = monthParts();
    const active = activeStaff(assignments);
    const map = byStaffDate(assignments);
    return `<div class="excel-roster-section-v107 excel-roster-section-v109 excel-roster-section-v110 excel-roster-section-v111 excel-roster-section-v112 excel-roster-section-v113 mobile-only-roster-v111 mobile-only-roster-v112 mobile-only-roster-v113">
      <div class="section-title mobile-roster-title-v112 mobile-roster-title-v113"><div><h3>ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3></div></div>
      <div class="table-wrap excel-roster-wrap-v107 excel-roster-wrap-v109 excel-roster-wrap-v110 excel-roster-wrap-v111 excel-roster-wrap-v112 excel-roster-wrap-v113"><table id="scheduleTable" class="excel-roster-table-v107 excel-roster-table-v109 excel-roster-table-v110 excel-roster-table-v111 excel-roster-table-v112 excel-roster-table-v113"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : '';
        return `<th class="${cls}"><span>${day}</span><small>${formatDow(date)}</small></th>`;
      }).join('')}</tr></thead><tbody>${active.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${escapeHtml(st.full_name || st.nickname || '')}"><b>${escapeHtml(st.nickname || st.full_name)}</b></th>${days.map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rows = map[`${st.id}|${date}`] || [];
        const txt = leaveText(st.id, date);
        const cls = [isHolidayDate(date) ? 'holiday-cell' : '', isWeekend(date) ? 'weekend-cell' : '', txt ? 'leave-cell' : '', rows.length ? 'has-duty-cell' : ''].join(' ');
        const cellText = rows.length ? rows.map(a => escapeHtml(dutyLabel(a.duty_code))).join('<br>') : escapeHtml(txt || '');
        const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
        return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
      }).join('')}</tr>`).join('')}</tbody></table></div>
    </div>`;
  }

  function renderDayGrid(assignments){
    const { y, m, last } = monthParts();
    const first = new Date(y, m - 1, 1).getDay();
    const blanks = Array.from({ length:first }, () => `<div class="month-day-card-v112 month-day-card-v113 muted-card-v112"><b></b></div>`).join('');
    const cards = Array.from({ length:last }, (_, i) => i + 1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutySort(a.duty_code)-dutySort(b.duty_code));
      const maxShow = 4;
      return `<button type="button" class="month-day-card-v112 month-day-card-v113 ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}" data-day-detail="${date}">
        <div class="month-day-head-v112 month-day-head-v113"><b>${day}</b><span>${formatDow(date)}</span></div>
        <div class="month-duty-list-v112 month-duty-list-v113">${slots.slice(0,maxShow).map(a => {
          const st = staffById(a.staff_id) || {};
          const bg = staffColor(st);
          const fg = textColorFor(bg);
          return `<span class="month-duty-pill-v113" style="--staff-bg:${bg};--staff-fg:${fg};"><b>${escapeHtml(dutyLabel(a.duty_code))}</b> ${escapeHtml(staffNick(a.staff_id))}</span>`;
        }).join('')}${slots.length > maxShow ? `<em>+${slots.length - maxShow}</em>` : ''}${!slots.length ? `<small>ไม่มีเวร</small>` : ''}</div>
      </button>`;
    }).join('');
    return `<div class="mobile-day-month-v112 mobile-day-month-v113"><div class="month-dow-row-v112 month-dow-row-v113"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="month-grid-v112 month-grid-v113">${blanks}${cards}</div></div>`;
  }

  function renderPerson(assignments){
    const active = activeStaff(assignments);
    return `<div class="mobile-schedule-person-list mobile-person-list-v112">${active.map(s => {
      const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code));
      return `<div class="schedule-person-card" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}"><div class="person-card-head"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${formatThaiDate(a.duty_date)}</span><b>${escapeHtml(dutyLabel(a.duty_code))}</b>${renderTradeButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
    }).join('')}</div>`;
  }

  function countDaysOff(staffId, assignments){
    const { y, m, days } = monthParts();
    let count = 0;
    days.forEach(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staffId) && a.duty_date === date);
      if (hasDuty) return;
      if (hasLeaveType(staffId, date, ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด'])) return;
      if (isWeekend(date) || isHolidayDate(date)) count += 1;
    });
    return count;
  }
  function dutyCounts(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => {
      const d = normDuty(a.duty_code);
      c.total += 1;
      if (d === 'ชบด1') c.chbd1 += 1;
      else if (d === 'ชบด2') c.chbd2 += 1;
      else if (d === 'ชบด3') c.chbd3 += 1;
      else if (d === 'ช3A') c.ch3A += 1;
      else if (d === 'ช3B') c.ch3B += 1;
      else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9 += 1;
      else if (d === 'ช4-MT/แตง') c.ch4 += 1;
    });
    return c;
  }
  function renderOtCards(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id));
    const active = activeStaff(assignments);
    const inchargeId = currentInchargeForMonth(state.monthKey);
    return `<div class="mobile-ot-summary-list-v111 mobile-ot-summary-list-v112">${active.map(s => {
      const r = stats[s.id] || {};
      const counts = dutyCounts(s.id, assignments);
      const hours = Number(r.hours || 0);
      const incharge = String(inchargeId || '') === String(s.id) ? 8 : 0;
      const totalHours = hours + incharge;
      const pay = Number(r.pay || 0);
      return `<button class="ot-summary-card-v111 ot-summary-card-v112" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-staff-stat="${s.id}" type="button">
        <div class="ot-card-head-v111"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</span></div>
        <div class="ot-card-grid-v111">
          <span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b>
          <span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b>
          <span>รวม OT:</span><b>${totalHours.toFixed(1)}</b>
          <span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b>
          <span>จำนวนเวร:</span><b>${counts.total}</b>
          <span>วันที่ได้หยุด:</span><b>${countDaysOff(s.id, assignments)}</b>
        </div>
        <div class="ot-duty-counts-v111">
          <span>ชบด1: <b>${counts.chbd1}</b></span><span>ชบด2: <b>${counts.chbd2}</b></span><span>ชบด3: <b>${counts.chbd3}</b></span><span>ช9: <b>${counts.ch9}</b></span><span>ช3A: <b>${counts.ch3A}</b></span><span>ช3B: <b>${counts.ch3B}</b></span><span>ช4: <b>${counts.ch4}</b></span>
        </div>
      </button>`;
    }).join('')}</div>`;
  }

  const oldRenderReadOnly = window.renderReadOnlySchedule || renderReadOnlySchedule;
  renderReadOnlySchedule = function renderReadOnlyScheduleV113(assignments){
    if (!isMobile()) return oldRenderReadOnly(assignments);
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const view = state.scheduleMobileView || 'table';
    let html = '';
    if (view === 'day') html = renderDayGrid(assignments);
    else if (view === 'person') html = renderPerson(assignments);
    else if (view === 'ot') html = renderOtCards(assignments);
    else html = renderExcel(assignments);
    return `<div class="mobile-schedule-view-v111 mobile-schedule-view-v112 mobile-schedule-view-v113">${html}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;
})();
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

/* CNMI Staff Planner Patch V117 FINAL CONSOLIDATED
   - one loaded patch for v107-v117 features
   - restore monthly schedule views for staff/admin
   - robust OT end_time calculation
   - final fairness calculation rules
*/
(function patchV117Final(){
  window.CNMI_PATCH_V117 = true;
  const esc = (v) => escapeHtml(String(v ?? ''));
  const isPhone = () => {
    try { return (typeof isMobileView === 'function' && isMobileView()) || (window.matchMedia && window.matchMedia('(max-width: 820px)').matches); }
    catch(_) { return window.innerWidth <= 820; }
  };
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
  const staffNickSafe = (id) => {
    const s = staffObj(id);
    return s ? (s.nickname || s.full_name || '') : (typeof staffNick === 'function' ? staffNick(id) : '');
  };
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
  calcOtHours = function calcOtHoursV117(r){
    const auto = autoHoursFromNote(r?.note || '');
    if (auto !== null && Number.isFinite(auto)) return Math.max(0, auto);
    if (!r?.work_date || !r?.end_time) return 0;
    const start = parseLocalDateTime(r.work_date, '16:00:00');
    let end = parseLocalDateTime(r.work_date, r.end_time);
    if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    if (end < start) end = new Date(end.getTime() + 24 * 36e5);
    return Math.max(0, Math.round(((end.getTime() - start.getTime()) / 36e5) * 10) / 10);
  };
  window.calcOtHours = calcOtHours;

  function isWeekendDate(date){ const d = parseDate(date).getDay(); return d === 0 || d === 6; }
  function dutyRole(a){
    const code = normDuty(a.duty_code);
    const raw = String(a.required_role || a.role || '').toLowerCase();
    if (code === 'ช9-MT/แตง' || raw.includes('mt') || raw.includes('แตง')) return 'MT';
    if (code === 'ช9-เคิก' || raw.includes('เคิก')) return 'KIK';
    return raw.includes('mt') ? 'MT' : 'MT';
  }
  dutyMetrics = function dutyMetricsV117(a){
    const code = normDuty(a.duty_code);
    const holiday = isHolidayDate(a.duty_date);
    const weekend = isWeekendDate(a.duty_date);
    let hours = 0;
    if (code.startsWith('ชบด')) hours = (holiday || weekend) ? 24 : 16;
    else if (code === 'ช9-เคิก' || code === 'ช9-MT/แตง') hours = 8;
    else if (code === 'ช3A' || code === 'ช3B') hours = 8;
    else if (code === 'ช4-MT/แตง') hours = 0;
    const role = dutyRole(a);
    const rate = role === 'KIK' ? (holiday ? 120 : 90) : (holiday ? 160 : 130);
    const pay = code === 'ช4-MT/แตง' ? 0 : hours * rate;
    const units = code === 'ช4-MT/แตง' ? 0 : hours / 8;
    return { hours, pay, units, role, rate };
  };
  window.dutyMetrics = dutyMetrics;

  calcFairness = function calcFairnessV117(assignments){
    const stats = {};
    (assignments || []).forEach(a0 => {
      if (!a0.staff_id) return;
      const a = { ...a0, duty_code:normDuty(a0.duty_code) };
      if (!stats[a.staff_id]) stats[a.staff_id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{} };
      const dow = parseDate(a.duty_date).getDay();
      const m = dutyMetrics(a);
      stats[a.staff_id].total++;
      stats[a.staff_id].hours += m.hours;
      stats[a.staff_id].units += m.units;
      stats[a.staff_id].pay += m.pay;
      if (String(a.duty_code || '').startsWith('ชบด')) stats[a.staff_id].chbd++;
      if (a.duty_code === 'ช9-เคิก' || a.duty_code === 'ช9-MT/แตง') stats[a.staff_id].ch9++;
      if (['ช3A','ช3B'].includes(a.duty_code)) stats[a.staff_id].ch3++;
      if (a.duty_code === 'ช4-MT/แตง') stats[a.staff_id].ch4++;
      const wk = weekKeyOf(a.duty_date);
      stats[a.staff_id].weekCounts[wk] = (stats[a.staff_id].weekCounts[wk] || 0) + 1;
      if (dow === 1) stats[a.staff_id].mon++;
      if (dow === 5) stats[a.staff_id].fri++;
      if (dow === 0 || dow === 6 || isHolidayDate(a.duty_date)) stats[a.staff_id].weekend++;
      else stats[a.staff_id].weekday++;
    });
    return stats;
  };
  window.calcFairness = calcFairness;

  showFairness = function showFairnessV117(){
    const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id);
    const stats = calcFairness(assignments);
    const hours = Object.values(stats).map(x => x.hours || 0);
    const pays = Object.values(stats).map(x => x.pay || 0);
    const diff = hours.length ? Math.max(...hours) - Math.min(...hours) : 0;
    const payDiff = pays.length ? Math.max(...pays) - Math.min(...pays) : 0;
    showModal(`<h2>ตรวจสมดุลการกระจายเวร ${state.monthKey}</h2><p class="hint">ชม.ตั้งต้น: ชบด เสาร์-อาทิตย์/นักขัต 24 ชม., ชบด จันทร์-ศุกร์ 16 ชม., ช9 8 ชม., ช3A/ช3B 8 ชม., ช4 แสดงจำนวนครั้งแต่ไม่บวกชั่วโมง/เงิน/หน่วยเวร</p><p class="hint">เรทเคิก 90 บาท/ชม. และนักขัต 120 บาท/ชม. • เรท MT 130 บาท/ชม. และนักขัต 160 บาท/ชม. • ส่วนต่างชั่วโมง ${diff.toFixed(1)} ชม. • ส่วนต่างเงินโดยประมาณ ${payDiff.toLocaleString()} บาท</p><div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.ตั้งต้น</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>
      ${orderedStaff(state.staff.filter(s=>isRosterEnabled(s))).map(s => { const r = stats[s.id] || {}; return `<tr><td>${staffPill(s)}</td><td>${(r.hours||0).toFixed(1)}</td><td>${(r.pay||0).toLocaleString()}</td><td>${(r.units||0).toFixed(1)}</td><td>${r.chbd||0}</td><td>${r.ch9||0}</td><td>${r.ch3||0}</td><td>${r.ch4||0}</td><td>${r.mon||0}</td><td>${r.fri||0}</td><td>${r.weekend||0}</td></tr>`; }).join('')}
    </tbody></table></div>`);
  };
  window.showFairness = showFairness;

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
    return `<section class="excel-roster-section-v117"><h3 class="schedule-view-title-v117">ตารางเวรรายเดือนแบบ Excel ${state.monthKey}</h3><div class="table-wrap excel-roster-wrap-v117"><table id="scheduleTable" class="excel-roster-table-v117"><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${days.map(day => { const date = `${y}-${pad(m)}-${pad(day)}`; const cls = isHolidayDate(date) ? 'holiday-head' : isWeekendDate(date) ? 'weekend-head' : ''; return `<th class="${cls}"><span>${day}</span><small>${fmtDow(date)}</small></th>`; }).join('')}</tr></thead><tbody>${staff.map(st => `<tr><th class="sticky-col staff-col staff-name-cell" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}" title="${esc(st.full_name || st.nickname || '')}"><b>${esc(st.nickname || st.full_name)}</b></th>${days.map(day => { const date = `${y}-${pad(m)}-${pad(day)}`; const rows = map[`${st.id}|${date}`] || []; const txt = leaveLabel(st.id, date); const cls = [isHolidayDate(date)?'holiday-cell':'', isWeekendDate(date)?'weekend-cell':'', txt?'leave-cell':'', rows.length?'has-duty-cell':''].join(' '); const cellText = rows.length ? rows.map(a => esc(dutyShort(a.duty_code))).join('<br>') : esc(txt || ''); const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(','); return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${esc(staffNickSafe(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`; }).join('')}</tr>`).join('')}</tbody></table></div></section>`;
  }
  function renderCalendarView(assignments){
    const { y, m, last } = getYM();
    const first = new Date(y, m - 1, 1).getDay();
    const blanks = Array.from({ length:first }, () => `<div class="month-day-card-v117 muted-card-v117"></div>`).join('');
    const cards = Array.from({ length:last }, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const slots = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutySort(a.duty_code)-dutySort(b.duty_code));
      const maxShow = isPhone() ? 4 : 12;
      return `<button type="button" class="month-day-card-v117 ${isHolidayDate(date)||isWeekendDate(date)?'weekend-row':''}" data-day-detail="${date}"><div class="month-day-head-v117"><b>${day}</b><span>${fmtDow(date)}</span></div><div class="month-duty-list-v117">${slots.slice(0,maxShow).map(a => { const st = staffObj(a.staff_id) || {}; const bg = staffColor(st); return `<span class="month-duty-pill-v117" style="--staff-bg:${bg};--staff-fg:${textColorFor(bg)}"><b>${esc(dutyShort(a.duty_code))}</b> ${esc(staffNickSafe(a.staff_id))}</span>`; }).join('')}${slots.length > maxShow ? `<em>+${slots.length - maxShow}</em>` : ''}${!slots.length ? `<small>ไม่มีเวร</small>` : ''}</div></button>`;
    }).join('');
    return `<section class="calendar-card-view-v117"><div class="calendar-dow-row-v117"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="calendar-grid-v117">${blanks}${cards}</div></section>`;
  }
  function renderPersonView(assignments){
    const staff = staffListForRoster(assignments);
    return `<section class="person-roster-list-v117">${staff.map(s => { const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code)); return `<button type="button" class="person-roster-card-v117" data-roster-person-detail-v117="${s.id}"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${esc(s.nickname || s.full_name)}</span><b>${rows.length}</b><small>เวรเดือนนี้</small></button>`; }).join('')}</section>`;
  }
  function countDaysOff(staffId, assignments){
    const { y, m, days } = getYM(); let count = 0;
    days.forEach(day => { const date = `${y}-${pad(m)}-${pad(day)}`; const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staffId) && a.duty_date === date); if (hasDuty) return; const leaves = leaveRowsFor(staffId, date); if (leaves.some(l => ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด'].includes(l.type))) return; const noDutyWeekend = isWeekendDate(date) && leaves.some(l => l.type === 'ไม่รับเวร'); if (isWeekendDate(date) || isHolidayDate(date) || noDutyWeekend) count++; });
    return count;
  }
  function dutyCounts(staffId, assignments){
    const c = { chbd1:0, chbd2:0, chbd3:0, ch9:0, ch3A:0, ch3B:0, ch4:0, total:0 };
    (assignments || []).filter(a => String(a.staff_id) === String(staffId)).forEach(a => { const d = normDuty(a.duty_code); c.total++; if (d === 'ชบด1') c.chbd1++; else if (d === 'ชบด2') c.chbd2++; else if (d === 'ชบด3') c.chbd3++; else if (d === 'ช3A') c.ch3A++; else if (d === 'ช3B') c.ch3B++; else if (d === 'ช9-เคิก' || d === 'ช9-MT/แตง') c.ch9++; else if (d === 'ช4-MT/แตง') c.ch4++; });
    return c;
  }
  function renderMobileOtCards(assignments){
    const stats = calcFairness((assignments || []).filter(x => x.staff_id)); const staff = staffListForRoster(assignments); const inchargeId = currentInchargeForMonth(state.monthKey);
    return `<section class="mobile-ot-summary-list-v117">${staff.map(s => { const r = stats[s.id] || {}; const counts = dutyCounts(s.id, assignments); const hours = Number(r.hours || 0); const incharge = String(inchargeId || '') === String(s.id) ? 8 : 0; const totalHours = hours + incharge; const pay = Number(r.pay || 0); return `<button class="ot-summary-card-v117" data-staff-stat="${s.id}" type="button"><div class="ot-card-head-v117"><span class="staff-pill" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${esc(s.nickname || s.full_name)}</span></div><div class="ot-card-grid-v117"><span>ชั่วโมงเวร/OT:</span><b>${hours.toFixed(1)}</b><span>ชั่วโมงอินชาร์จ:</span><b>${incharge.toFixed(1)}</b><span>รวม OT:</span><b>${totalHours.toFixed(1)}</b><span>เงินประมาณ:</span><b>${pay.toLocaleString()}</b><span>จำนวนเวร:</span><b>${counts.total}</b><span>วันที่ได้หยุด:</span><b>${countDaysOff(s.id, assignments)}</b></div><div class="ot-duty-counts-v117"><span>ชบด1: <b>${counts.chbd1}</b></span><span>ชบด2: <b>${counts.chbd2}</b></span><span>ชบด3: <b>${counts.chbd3}</b></span><span>ช9: <b>${counts.ch9}</b></span><span>ช3A: <b>${counts.ch3A}</b></span><span>ช3B: <b>${counts.ch3B}</b></span><span>ช4: <b>${counts.ch4}</b></span></div></button>`; }).join('')}</section>`;
  }
  function rosterView(){
    let v = state.rosterMonthlyView || state.scheduleMobileView || 'table';
    if (!isPhone() && v === 'ot') v = 'table';
    if (!['table','day','person','ot'].includes(v)) v = 'table';
    return v;
  }
  function tab(id, label){ return `<button type="button" class="${rosterView() === id ? 'primary-btn' : 'ghost-btn'}" data-roster-view-v117="${id}">${label}</button>`; }
  function activeRosterView(assignments){ const v = rosterView(); if (v === 'day') return renderCalendarView(assignments); if (v === 'person') return renderPersonView(assignments); if (v === 'ot' && isPhone()) return renderMobileOtCards(assignments); return renderExcelRoster(assignments); }

  renderReadOnlySchedule = function renderReadOnlyScheduleV117(assignments){
    if (!assignments?.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    return `<div class="schedule-single-view-v117 ${isPhone() ? 'mobile' : 'desktop'}">${activeRosterView(assignments)}</div>`;
  };
  window.renderReadOnlySchedule = renderReadOnlySchedule;
  renderMonthlySchedulePage = function renderMonthlySchedulePageV117(){
    const assignments = getAssignmentsForMonth(state.monthKey);
    if (!state.rosterMonthlyView) state.rosterMonthlyView = 'table';
    const tabs = isPhone() ? `${tab('day','ดูตามวัน')}${tab('person','ดูตามคน')}${tab('ot','สรุป OT')}${tab('table','ตาราง')}` : `${tab('table','ตารางทั้งเดือน')}${tab('day','ดูตามวัน')}${tab('person','ดูตามคน')}`;
    return `<div class="card schedule-page-card schedule-page-card-v117"><div class="toolbar no-print"><label>เดือน <input type="month" id="scheduleMonthInput" value="${state.monthKey}"></label><button class="ghost-btn" data-export-schedule-excel>Export Excel</button><button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button><button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button></div><div class="schedule-tabs-v117 no-print">${tabs}</div><h3 class="print-only">ตารางเวรประจำเดือน ${state.monthKey}</h3>${renderReadOnlySchedule(assignments)}${renderDutyTradePanel(assignments)}</div>`;
  };
  window.renderMonthlySchedulePage = renderMonthlySchedulePage;
  function showPersonDetailV117(staffId){
    const assignments = getAssignmentsForMonth(state.monthKey).filter(a => String(a.staff_id) === String(staffId)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutySort(a.duty_code)-dutySort(b.duty_code));
    const st = staffObj(staffId) || {}; const rows = assignments.length ? assignments.map(a => `<tr><td>${formatThaiDate(a.duty_date)}</td><td>${esc(dutyShort(a.duty_code))}</td><td>${typeof renderTradeButton === 'function' ? renderTradeButton(a) : ''}</td></tr>`).join('') : `<tr><td colspan="3">ไม่มีเวรเดือนนี้</td></tr>`;
    showModal(`<h2>${esc(st.nickname || st.full_name || 'เจ้าหน้าที่')} • เวร ${state.monthKey}</h2><div class="table-wrap"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ดำเนินการ</th></tr></thead><tbody>${rows}</tbody></table></div>`);
  }
  renderPage = function renderPageV117(){
    const item = NAV_ITEMS.find(x => x.id === state.page) || NAV_ITEMS[0];
    $('pageTitle').textContent = item.title; $('pageSubtitle').textContent = item.subtitle; renderNav();
    const pages = { dashboard: renderDashboard, calendar: renderCalendar, leave: renderLeavePage, myProfile: renderMyProfilePage, activities: renderActivitiesPage, hr: renderHrPage, hrSummary: renderHrSummaryPage, scheduler: renderSchedulerPage, schedule: renderMonthlySchedulePage, tradeRequests: renderTradeRequestsPage, positions: renderPositionsPage, ot: renderOtPage, audit: renderAuditPage, profileRequests: renderProfileRequestsPage, profileRequestSummary: (typeof renderProfileRequestSummaryPage === 'function' ? renderProfileRequestSummaryPage : renderDashboard), users: renderUsersPage, eligibility: renderEligibilityPage, positionMonth: renderPositionMonthPage, positionMonthView: renderPositionMonthViewPage };
    $('pageContent').innerHTML = (pages[state.page] || renderDashboard)();
  };
  window.renderPage = renderPage;
  const oldHandleClick117 = window.handleClick || handleClick;
  handleClick = async function handleClickV117(e){
    const t = e.target.closest('button, [data-roster-view-v117], [data-roster-person-detail-v117]');
    if (t?.dataset?.rosterViewV117) { state.rosterMonthlyView = t.dataset.rosterViewV117 || 'table'; state.scheduleMobileView = state.rosterMonthlyView; renderPage(); return; }
    if (t?.dataset?.rosterPersonDetailV117) { showPersonDetailV117(t.dataset.rosterPersonDetailV117); return; }
    return oldHandleClick117(e);
  };
  window.handleClick = handleClick;
})();
