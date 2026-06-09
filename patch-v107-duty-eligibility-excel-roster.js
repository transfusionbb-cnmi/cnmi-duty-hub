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
  renderRosterGrid = function renderRosterGridV107(assignments) {
    if (!assignments.length) return empty('กด “สร้างร่าง Auto Assign” เพื่อเริ่มจัดเวร');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = dutyTableCodesForMonthV107(assignments, state.monthKey);
    const desktopTable = `<div class="table-wrap roster-table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV107(c))}</th>`).join('')}</tr></thead><tbody>
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
            <select class="mobile-roster-select" data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${staffOptionList(slot.staff_id, st => canStaffWorkSlot(st.id, slot))}</select>
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
        return `<div class="mobile-roster-slot"><div><b>${escapeHtml(dutyLabelV107(slot.duty_code))}</b><br><span class="muted">${escapeHtml(slot.required_role || v107RoleFor(slot.duty_code))} ${slot.is_locked?'• locked':''}</span></div><select data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${staffOptionList(slot.staff_id, st => canStaffWorkSlot(st.id, slot))}</select><div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div></div>`;
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
          const cellText = rows.length ? rows.map(a => dutyLabelV107(a.duty_code)).join('<br>') : leaveText;
          const ids = rows.map(a => a.id || a._temp_id).filter(Boolean).join(',');
          return `<td class="${cls}" data-roster-excel-cell="${st.id}|${date}|${ids}" title="${escapeHtml(staffNick(st.id))} ${formatThaiDate(date)}"><button type="button" class="excel-duty-cell-btn" data-roster-excel-cell="${st.id}|${date}|${ids}">${cellText || '&nbsp;'}</button></td>`;
        }).join('')}</tr>`).join('')}
      </tbody></table></div>
    </div>`;
  }

  renderReadOnlySchedule = function renderReadOnlyScheduleV107(assignments) {
    if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const codes = dutyTableCodesForMonthV107(assignments, state.monthKey);
    const oldByDay = `<details class="old-duty-table-v107"><summary>ตารางแยกตามวัน/เวรแบบเดิม</summary><div class="table-wrap desktop-schedule-table"><table class="schedule-readable"><thead><tr><th>วันที่</th>${codes.map(c => `<th>${escapeHtml(dutyLabelV107(c))}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({length:last}, (_,i)=>i+1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
        return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${codes.map(code => {
          if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && normalizeDutyCodeV107(a.duty_code) === code);
          return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div></details>`;
    return renderExcelRosterMatrixV107(assignments) + oldByDay + `<div class="mobile-schedule-view">${renderMobileScheduleView(assignments)}</div>`;
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
      return `<div class="schedule-day-card ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}"><div class="mobile-day-head"><b>${day}</b><span>${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? badge(holidayName(date),'yellow') : ''}</div>${slots.length ? slots.map(({code,slot}) => `<div class="mobile-duty-line"><b>${escapeHtml(dutyLabelV107(code))}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
    }).join('')}</div>`;
  };
  window.renderMobileScheduleByDay = renderMobileScheduleByDay;

  function showRosterExcelCellModalV107(encoded) {
    const [staffId, date, idsText=''] = String(encoded || '').split('|');
    const ids = idsText ? idsText.split(',').filter(Boolean) : [];
    const assignments = getAssignmentsForMonth(state.monthKey);
    const rows = ids.map(id => assignments.find(a => String(a.id || a._temp_id) === String(id))).filter(Boolean);
    const leaveText = leaveTextForRosterCellV107(staffId, date);
    const detailRows = rows.map(a => `<div class="duty-action-row"><div><b>${escapeHtml(dutyLabelV107(a.duty_code))}</b><br><span class="muted">${formatThaiDate(a.duty_date)} • ${staffPill(a.staff_id)}</span></div><div class="actions">${canRequestTrade(a) ? `<button class="tiny-btn" data-trade-duty="${a.id || a._temp_id}">ขอแลก/ขาย/ยกเวร</button>` : '<span class="muted">ดูอย่างเดียว</span>'}</div></div>`).join('');
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
      profileRequestSummary: typeof renderProfileRequestSummaryPage === 'function' ? renderProfileRequestSummaryPage : undefined,
      users: renderUsersPage,
      eligibility: renderEligibilityPage,
      positionMonth: renderPositionMonthPage,
      positionMonthView: renderPositionMonthViewPage,
      dutyEligibilityV107: renderDutyEligibilityPageV107,
      holidayRulesV107: renderHolidayRulesPageV107
    };
    $('pageContent').innerHTML = (pages[state.page] || renderDashboard)();
  };
  window.renderPage = renderPage;

})();
