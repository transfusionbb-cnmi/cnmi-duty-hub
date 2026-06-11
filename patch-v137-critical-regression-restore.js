/* v137 Critical Regression Restore
   Scope: restore missing admin menus, sanitize holiday titles, keep person cards scoped,
   strengthen long-leave balance reset and add days-off columns. Does not change duty OT formulas.
*/
(function(){
  'use strict';
  if (window.__CNMI_V137_CRITICAL_RESTORE__) return;
  window.__CNMI_V137_CRITICAL_RESTORE__ = true;

  const MARKER = ':::DUTY_RULES:';
  const CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง 1','ช4-MT/แตง 2'];
  const WEEKDAYS = [
    {key:'mon', label:'จันทร์'}, {key:'tue', label:'อังคาร'}, {key:'wed', label:'พุธ'},
    {key:'thu', label:'พฤหัสบดี'}, {key:'fri', label:'ศุกร์'}, {key:'sat', label:'เสาร์'}, {key:'sun', label:'อาทิตย์'}
  ];
  const esc = (v) => (typeof escapeHtml === 'function') ? escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
  const $id = (id) => document.getElementById(id);
  const pad2 = (n) => (typeof pad === 'function' ? pad(n) : String(n).padStart(2,'0'));
  const parseD = (d) => (typeof parseDate === 'function' ? parseDate(d) : new Date(`${d}T00:00:00`));
  const monthKeyNow = () => (typeof monthKey === 'function' ? monthKey(new Date()) : new Date().toISOString().slice(0,7));
  const dateThai = (d) => { try { return formatThaiDate(d); } catch(_) { return d; } };
  const showMsg = (m) => { if (typeof showToast === 'function') showToast(m); else alert(m); };
  const staffById = (id) => (state.staff || []).find(s => String(s.id) === String(id));
  const rosterStaff = () => { try { return orderedStaff((state.staff || []).filter(s => typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : s?.is_active !== false)); } catch(_) { return state.staff || []; } };
  const colorOf = (s) => { try { return staffColor(s); } catch(_) { return s?.color || '#dbeafe'; } };
  const isWE = (d) => { try { return isWeekend(d); } catch(_) { return [0,6].includes(parseD(d).getDay()); } };
  const isHol = (d) => { try { return isHolidayDate(d); } catch(_) { return (state.holidays||[]).some(h => h.holiday_date === d); } };
  function cleanHolidayTitle(title='') {
    const t = String(title || '');
    const idx = t.indexOf(MARKER);
    return (idx >= 0 ? t.slice(0, idx) : t).replace(/\s+$/,'').trim() || 'วันหยุดราชการ';
  }
  function decodeHoliday(title='') {
    const t = String(title || '');
    const start = t.indexOf(MARKER);
    if (start < 0) return null;
    const raw = t.slice(start + MARKER.length).split(':::')[0];
    try { return JSON.parse(decodeURIComponent(escape(atob(raw)))); }
    catch(_) { try { return JSON.parse(atob(raw)); } catch(__) { return null; } }
  }
  function encodeHoliday(title, duties, roleMode) {
    const json = JSON.stringify({
      duties: CODES.reduce((acc,c) => { acc[c] = duties.includes(c); return acc; }, {}),
      roleMode: roleMode || 'MT_MT_KERK'
    });
    let enc = '';
    try { enc = btoa(unescape(encodeURIComponent(json))); } catch(_) { enc = btoa(json); }
    return `${String(title || '').trim()} ${MARKER}${enc}:::`.trim();
  }
  function holidayCfg(date) {
    const row = (state.holidays || []).find(h => h.holiday_date === date);
    return decodeHoliday(row?.title || '') || null;
  }
  function normalizeDuty(code='') {
    const c = String(code || '').trim();
    if (['ช4','ช4A','ช4B','ช4-MT/แตง','ช4-MT/แตง1','ช4-MT/แตง-1','ช4-1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4-MT/แตง2','ช4-MT/แตง-2','ช4-2'].includes(c)) return 'ช4-MT/แตง 2';
    if (c === 'ช9-MT') return 'ช9-MT/แตง';
    return c;
  }
  function detailDuty(code) {
    const c = normalizeDuty(code);
    if (c === 'ช4-MT/แตง 1') return 'ช4-MT/แตง 1';
    if (c === 'ช4-MT/แตง 2') return 'ช4-MT/แตง 2';
    if (c === 'ช9-MT/แตง') return 'ช9-MT/แตง';
    return c;
  }
  function dayKey(date) { return ['sun','mon','tue','wed','thu','fri','sat'][parseD(date).getDay()]; }
  function defaultCodesForDayKey(k) {
    if (k === 'sat' || k === 'sun') return ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง'];
    return ['ชบด1','ชบด2','ชบด3','ช4-MT/แตง 1','ช4-MT/แตง 2'];
  }
  function holidayAllowed(date) {
    const cfg = holidayCfg(date);
    if (!cfg?.duties) return ['ชบด1','ชบด2','ชบด3'];
    return CODES.filter(c => cfg.duties[c] || (c.startsWith('ช4') && cfg.duties['ช4-MT/แตง']));
  }
  function holidayRoleMode(date) { return holidayCfg(date)?.roleMode || 'MT_MT_KERK'; }
  function eligCode(day, duty) { return `DUTY_RULE:${day}:${normalizeDuty(duty)}`; }
  function eligRows(staffId) { return (state.positionEligibility || []).filter(r => String(r.staff_id) === String(staffId) && String(r.position_code || '').startsWith('DUTY_RULE:')); }

  // 1) Always sanitize hidden Base64 duty-rule payload before rendering holiday names.
  const oldHolidayName = window.holidayName || (typeof holidayName === 'function' ? holidayName : null);
  window.holidayName = function holidayNameV137(date) {
    const raw = (state.holidays || []).find(h => h.holiday_date === date)?.title;
    if (raw) return cleanHolidayTitle(raw);
    return oldHolidayName ? cleanHolidayTitle(oldHolidayName(date)) : 'วันหยุดราชการ';
  };
  try { holidayName = window.holidayName; } catch(_) {}

  // 2) Restore missing Admin menu items without deleting current menu logic.
  function ensureMenu() {
    if (!Array.isArray(window.NAV_ITEMS || NAV_ITEMS)) return;
    const arr = window.NAV_ITEMS || NAV_ITEMS;
    if (!arr.some(x => x.id === 'holidayRulesV107')) arr.push({ id:'holidayRulesV107', icon:'🎌', title:'ตั้งค่าเวรวันนักขัตฤกษ์', subtitle:'กำหนดวันนักขัตฤกษ์และเวรที่เปิด', group:'admin' });
    if (!arr.some(x => x.id === 'dutyEligibilityV107')) arr.push({ id:'dutyEligibilityV107', icon:'✅', title:'สิทธิ์เวรตามวัน', subtitle:'กำหนดสิทธิ์เวรแยกรายวันและรายคน', group:'admin' });
  }
  ensureMenu();

  function noPerm() { return typeof noPermission === 'function' ? noPermission() : '<div class="card">ไม่มีสิทธิ์ใช้งานหน้านี้</div>'; }
  function renderDutyEligibilityPageV137() {
    if (typeof isAdmin === 'function' && !isAdmin()) return noPerm();
    const active = rosterStaff();
    if (!active.length) return typeof empty === 'function' ? empty('ยังไม่มีเจ้าหน้าที่ที่เปิดสิทธิ์จัดเวร') : '<div class="card">ยังไม่มีเจ้าหน้าที่</div>';
    if (!state.dutyEligibilityStaffId || !active.some(s => String(s.id) === String(state.dutyEligibilityStaffId))) state.dutyEligibilityStaffId = active[0].id;
    const selected = active.find(s => String(s.id) === String(state.dutyEligibilityStaffId)) || active[0];
    const hasRows = eligRows(selected.id).length > 0;
    const dayRows = WEEKDAYS.map(w => `<tr><th>${esc(w.label)}</th>${CODES.map(code => {
      const rec = (state.positionEligibility || []).find(r => String(r.staff_id) === String(selected.id) && r.position_code === eligCode(w.key, code));
      const checked = rec ? !!rec.is_eligible : defaultCodesForDayKey(w.key).includes(code);
      return `<td><label class="switch-check"><input type="checkbox" data-duty-eligibility-v137 data-staff-id="${esc(selected.id)}" data-day-key="${esc(w.key)}" data-duty-code="${esc(code)}" ${checked?'checked':''}><span></span></label></td>`;
    }).join('')}</tr>`).join('');
    const bg = colorOf(selected);
    const fg = typeof textColorFor === 'function' ? textColorFor(bg) : '#0f172a';
    return `<div class="grid duty-eligibility-page-v137">
      <div class="card eligibility-staff-panel">
        <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
        <label>เจ้าหน้าที่ <select id="dutyEligibilityStaffSelectV137">${active.map(s => `<option value="${esc(s.id)}" ${String(selected.id)===String(s.id)?'selected':''}>${esc(s.nickname || s.full_name)} (${esc(s.staff_type || '-')})</option>`).join('')}</select></label>
        <div class="selected-staff-card" style="background:${esc(bg)};color:${esc(fg)}"><b>${esc(selected.nickname || selected.full_name)}</b></div>
        <div class="notice soft-notice">หน้านี้ใช้กับเวรเท่านั้น ไม่เกี่ยวกับตำแหน่งกลางวัน</div>
      </div>
      <div class="card duty-eligibility-matrix-card">
        <div class="section-title"><div><h3>สิทธิ์เวรตามวันของ ${esc(selected.nickname || selected.full_name)}</h3><p class="hint">ช4-MT/แตง มี 2 ตำแหน่งต่อวัน จึงมี 2 ช่องให้ติ๊กแยกกัน</p></div><button class="primary-btn" type="button" data-save-duty-eligibility-v137>บันทึกสิทธิ์เวร</button></div>
        ${!hasRows ? '<div class="notice soft-notice">ยังไม่เคยตั้งสิทธิ์เวรของคนนี้ ระบบแสดงค่าเริ่มต้นให้ก่อน กดบันทึกเพื่อเริ่มใช้ตารางนี้</div>' : ''}
        <div class="table-wrap duty-eligibility-wrap"><table class="duty-eligibility-table v137-duty-table"><thead><tr><th>วัน</th>${CODES.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${dayRows}</tbody></table></div>
      </div>
    </div>`;
  }
  async function saveDutyEligibilityV137() {
    if (typeof isAdmin === 'function' && !isAdmin()) return showMsg('เฉพาะ Admin เท่านั้น');
    const checks = Array.from(document.querySelectorAll('[data-duty-eligibility-v137]'));
    const rows = checks.map(cb => ({ staff_id: cb.dataset.staffId, position_code: eligCode(cb.dataset.dayKey, cb.dataset.dutyCode), is_eligible: !!cb.checked, updated_by: currentStaffId() }));
    if (!rows.length) return showMsg('ไม่มีข้อมูลสิทธิ์เวรให้บันทึก');
    const { error } = await sb.from('daily_position_eligibility').upsert(rows, { onConflict:'staff_id,position_code' });
    if (error) return showMsg(typeof friendlyDbError === 'function' ? friendlyDbError(error) : error.message);
    const targetStaff = rows[0].staff_id;
    const rowCodes = new Set(rows.map(r => r.position_code));
    state.positionEligibility = (state.positionEligibility || []).filter(r => !(String(r.staff_id) === String(targetStaff) && rowCodes.has(r.position_code))).concat(rows);
    state.rosterDraft = null;
    try { await loadAllData(); } catch(_) {}
    state.positionEligibility = (state.positionEligibility || []).filter(r => !(String(r.staff_id) === String(targetStaff) && rowCodes.has(r.position_code))).concat(rows);
    renderPage(); showMsg('บันทึกสิทธิ์เวรตามวันแล้ว');
  }

  function renderHolidayRulesPageV137() {
    if (typeof isAdmin === 'function' && !isAdmin()) return noPerm();
    const key = state.holidayRuleMonthKey || state.monthKey || monthKeyNow();
    const rows = (state.holidays || []).filter(h => String(h.holiday_date || '').startsWith(key)).sort((a,b) => String(a.holiday_date).localeCompare(String(b.holiday_date)));
    const editing = state.editHolidayRuleDate ? (state.holidays || []).find(h => h.holiday_date === state.editHolidayRuleDate) : null;
    const date = editing?.holiday_date || `${key}-01`;
    const cfg = editing ? holidayCfg(editing.holiday_date) : null;
    const allowed = editing ? holidayAllowed(editing.holiday_date) : ['ชบด1','ชบด2','ชบด3'];
    const mode = cfg?.roleMode || 'MT_MT_KERK';
    return `<div class="grid grid-2 holiday-rules-page-v137">
      <div class="card"><div class="section-title"><h3>${editing ? 'แก้ไขวันหยุดนักขัตฤกษ์' : 'เพิ่มวันหยุดนักขัตฤกษ์'}</h3>${editing ? '<button class="ghost-btn" type="button" data-cancel-edit-holiday-v137>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="holidayRulesFormV137" class="form-grid compact-form">
          <label>วันที่ <input name="holiday_date" type="date" value="${esc(date)}" ${editing?'readonly':''} required></label>
          <label>ชื่อวันหยุด <input name="title" value="${esc(cleanHolidayTitle(editing?.title || ''))}" placeholder="เช่น วันเข้าพรรษา" required></label>
          <label class="wide">รูปแบบคนอยู่เวรนักขัต <select name="holiday_role_mode"><option value="MT_MT_KERK" ${mode==='MT_MT_KERK'?'selected':''}>MT / MT / เคิก</option><option value="MT_MT_MT" ${mode==='MT_MT_MT'?'selected':''}>MT / MT / MT</option></select></label>
          <div class="wide duty-checkbox-grid"><div class="field-label">เวรที่เปิดในวันนี้</div>${CODES.map(code => `<label class="check-pill"><input type="checkbox" name="holiday_duties" value="${esc(code)}" ${allowed.includes(code)?'checked':''}> <span>${esc(code)}</span></label>`).join('')}</div>
          <button class="primary-btn wide" type="submit">บันทึกวันหยุดและกฎเวร</button>
        </form>
      </div>
      <div class="card"><div class="section-title"><h3>รายการวันหยุด ${esc(key)}</h3></div><div class="toolbar compact-filter"><label>เดือน <input type="month" id="holidayRuleMonthInputV137" value="${esc(key)}"></label></div>
        ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>วันที่</th><th>ชื่อวันหยุด</th><th>รูปแบบ</th><th>เวรที่เปิด</th><th>จัดการ</th></tr></thead><tbody>${rows.map(h => `<tr><td>${dateThai(h.holiday_date)}</td><td>${esc(cleanHolidayTitle(h.title))}</td><td>${holidayRoleMode(h.holiday_date)==='MT_MT_MT'?'MT/MT/MT':'MT/MT/เคิก'}</td><td>${holidayAllowed(h.holiday_date).map(c => `<span class="badge blue">${esc(detailDuty(c))}</span>`).join(' ') || '-'}</td><td><button class="tiny-btn" type="button" data-edit-holiday-v137="${esc(h.holiday_date)}">แก้ไข</button><button class="tiny-btn danger" type="button" data-delete-holiday-v137="${esc(h.holiday_date)}">ลบ</button></td></tr>`).join('')}</tbody></table></div>` : (typeof empty === 'function' ? empty('ยังไม่มีวันหยุดในเดือนนี้') : '<div>ยังไม่มีวันหยุดในเดือนนี้</div>')}
      </div>
    </div>`;
  }
  async function saveHolidayRulesV137(form) {
    if (typeof isAdmin === 'function' && !isAdmin()) return showMsg('เฉพาะ Admin เท่านั้น');
    const fd = new FormData(form);
    const date = fd.get('holiday_date');
    const title = String(fd.get('title') || '').trim();
    const duties = Array.from(form.querySelectorAll('input[name="holiday_duties"]:checked')).map(x => normalizeDuty(x.value));
    const roleMode = String(fd.get('holiday_role_mode') || 'MT_MT_KERK');
    if (!date || !title) return showMsg('กรุณาระบุวันที่และชื่อวันหยุด');
    const row = { holiday_date: date, title: encodeHoliday(title, duties, roleMode), updated_by: currentStaffId() };
    const { error } = await sb.from('public_holidays').upsert(row, { onConflict:'holiday_date' });
    if (error) return showMsg(typeof friendlyDbError === 'function' ? friendlyDbError(error) : error.message);
    state.editHolidayRuleDate = ''; state.rosterDraft = null;
    try { await loadAllData(); } catch(_) {}
    renderPage(); showMsg('บันทึกวันหยุดและกฎเวรแล้ว');
  }
  async function deleteHolidayV137(date) {
    if (typeof confirmDialog === 'function') { if (!(await confirmDialog(`ลบวันหยุด ${dateThai(date)} หรือไม่?`, 'ยืนยันลบวันหยุด'))) return; }
    else if (!confirm(`ลบวันหยุด ${dateThai(date)} หรือไม่?`)) return;
    const { error } = await sb.from('public_holidays').delete().eq('holiday_date', date);
    if (error) return showMsg(typeof friendlyDbError === 'function' ? friendlyDbError(error) : error.message);
    state.editHolidayRuleDate = ''; state.rosterDraft = null;
    try { await loadAllData(); } catch(_) {}
    renderPage(); showMsg('ลบวันหยุดแล้ว');
  }

  // 3) Balance logic display: long leave exemptions and days-off tracking.
  const LONG_LEAVE_WORDS = /(ลาคลอด|ลาบวช|ลาดูใจ|ลาถือศีล)/;
  function isActiveLeave(l) { return !['cancelled','rejected','deleted'].includes(String(l?.status || 'active').toLowerCase()); }
  function overlaps(l, date) { return String(l.start_date || '') <= date && String(l.end_date || l.start_date || '') >= date; }
  function leaveTextFor(s, date) {
    const texts = [];
    (state.leaves || []).filter(isActiveLeave).forEach(l => {
      if (String(l.staff_id) !== String(s.id) || !overlaps(l, date)) return;
      const t = String(l.type || l.leave_type || l.reason || '').trim();
      if (/ไม่รับเวร/.test(t)) texts.push('ไม่รับเวร');
      else if (/คลอด/.test(t)) texts.push('ลาคลอด');
      else if (/บวช/.test(t)) texts.push('ลาบวช');
      else if (/ดูใจ/.test(t)) texts.push('ลาดูใจ');
      else if (/ถือศีล/.test(t)) texts.push('ลาถือศีล');
      else if (/กิจ/.test(t)) texts.push('ลากิจ');
      else if (/ป่วย/.test(t)) texts.push('ลาป่วย');
      else if (/พักผ่อน|พักร้อน/.test(t)) texts.push('ลาพักผ่อน');
      else if (t) texts.push(t);
    });
    if (s.isLongTermLeave || s.is_long_term_leave || LONG_LEAVE_WORDS.test(String(s.position_training_status || s.note || s.remark || ''))) texts.push('ลาคลอด');
    return [...new Set(texts)];
  }
  function isLongLeaveWholeMonth(s, key) {
    const target = Number(s.targetShifts ?? s.target_shifts ?? NaN);
    if (target === 0) return true;
    if (s.isLongTermLeave || s.is_long_term_leave) return true;
    if (LONG_LEAVE_WORDS.test(String(s.position_training_status || s.note || s.remark || ''))) return true;
    const [yy, mm] = key.split('-').map(Number);
    const start = `${yy}-${pad2(mm)}-01`;
    const end = `${yy}-${pad2(mm)}-${pad2(new Date(yy, mm, 0).getDate())}`;
    return (state.leaves || []).filter(isActiveLeave).some(l => String(l.staff_id) === String(s.id) && LONG_LEAVE_WORDS.test(String(l.type || l.leave_type || l.reason || '')) && String(l.start_date || '') <= start && String(l.end_date || l.start_date || '') >= end);
  }
  function previousMonthKey(key) {
    const [y,m] = key.split('-').map(Number); const d = new Date(y, m-2, 1); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
  }
  function assignmentListForMonth(key) {
    try { return getAssignmentsForMonth(key).filter(a => a.staff_id); }
    catch(_) { return (state.rosterAssignments || []).filter(a => String(a.duty_date || '').startsWith(key) && a.staff_id); }
  }
  function daysOffForStaff(s, key, assignments) {
    const [y,m] = key.split('-').map(Number); const last = new Date(y,m,0).getDate(); let count = 0;
    for (let day=1; day<=last; day++) {
      const date = `${y}-${pad2(m)}-${pad2(day)}`;
      if (!(isWE(date) || isHol(date))) continue;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(s.id) && a.duty_date === date);
      const texts = leaveTextFor(s, date);
      if (!hasDuty || texts.includes('ไม่รับเวร')) count++;
    }
    return count;
  }
  function makeBalanceViewV137(assignments) {
    const key = state.monthKey || monthKeyNow();
    const stats = (typeof calcFairness === 'function') ? calcFairness((assignments || []).filter(a => a.staff_id)) : {};
    const staff = rosterStaff();
    const usable = staff.filter(s => !isLongLeaveWholeMonth(s, key));
    const values = usable.map(s => Number(stats[s.id]?.units || stats[s.id]?.total || 0)).filter(Number.isFinite);
    const avgQuota = values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
    const prevKey = previousMonthKey(key);
    const prevAssignments = assignmentListForMonth(prevKey);
    const prevOffs = usable.map(s => daysOffForStaff(s, prevKey, prevAssignments));
    const avgPrevOff = prevOffs.length ? prevOffs.reduce((a,b)=>a+b,0)/prevOffs.length : 0;
    return `<div class="v137-balance-dashboard"><div class="notice soft-notice">ลาระยะยาว/ลาคลอด/ลาบวช/ลาดูใจ/ลาถือศีล หรือ targetShifts = 0 จะไม่ถูกนำไปคิดหนี้เวร และเริ่มต้นใหม่เป็น 0 เมื่อกลับมาทำงาน</div><div class="table-wrap"><table class="v137-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เวรที่จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>จำนวนวันหยุด</th><th>ทบวันหยุดครั้งหน้า</th><th>สถานะ</th></tr></thead><tbody>${staff.map(s => {
      const r = stats[s.id] || {};
      const targetRaw = Number(s.targetShifts ?? s.target_shifts ?? avgQuota ?? 0);
      const exempt = isLongLeaveWholeMonth(s, key);
      const current = exempt ? 0 : Number(r.units || r.total || 0);
      const target = exempt ? 0 : targetRaw;
      const gap = exempt ? 0 : target - current;
      const prevExempt = isLongLeaveWholeMonth(s, prevKey);
      const carry = (exempt || prevExempt) ? 0 : Number(s.overtimeBalance ?? s.overtime_balance ?? s.carry_over_balance ?? 0);
      const off = exempt ? 0 : daysOffForStaff(s, key, assignments);
      const prevOff = exempt ? 0 : daysOffForStaff(s, prevKey, prevAssignments);
      const nextOff = exempt ? 0 : (avgPrevOff - prevOff);
      const label = exempt ? 'ยกเว้น/ลาระยะยาว' : prevExempt ? 'รีเซ็ตหลังกลับจากลา' : Math.abs(gap) < 0.5 ? 'สมดุล' : gap > 0 ? 'ขาดเวร' : 'งานหนักเกิน';
      const cls = exempt ? 'exempt' : prevExempt ? 'reset' : Math.abs(gap) < 0.5 ? 'ok' : gap > 0 ? 'warn' : 'over';
      const name = typeof staffPill === 'function' ? staffPill(s) : esc(s.nickname || s.full_name);
      return `<tr><td>${name}</td><td>${current.toFixed(1)}</td><td>${gap.toFixed(1)}</td><td>${carry.toFixed(1)} ชม.</td><td>${off}</td><td>${nextOff.toFixed(1)}</td><td><span class="v137-balance-status ${cls}">${esc(label)}</span></td></tr>`;
    }).join('')}</tbody></table></div></div>`;
  }
  function currentScheduleView() { const v = state.scheduleView || state.scheduleMobileView || 'table'; return v === 'ot' ? 'balance' : v; }

  // 4) Route restore and post-render cleanup. Keep existing pages except the two restored pages and balance tab content.
  const prevRenderPage = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
  window.renderPage = function renderPageV137() {
    ensureMenu();
    if (state.page === 'dutyEligibilityV107') {
      const item = (NAV_ITEMS || []).find(x => x.id === 'dutyEligibilityV107') || {};
      if ($id('pageTitle')) $id('pageTitle').textContent = item.title || 'สิทธิ์เวรตามวัน';
      if ($id('pageSubtitle')) $id('pageSubtitle').textContent = item.subtitle || 'กำหนดสิทธิ์เวรแยกรายวันและรายคน';
      try { renderNav(); } catch(_) {}
      if ($id('pageContent')) $id('pageContent').innerHTML = renderDutyEligibilityPageV137();
      return;
    }
    if (state.page === 'holidayRulesV107') {
      const item = (NAV_ITEMS || []).find(x => x.id === 'holidayRulesV107') || {};
      if ($id('pageTitle')) $id('pageTitle').textContent = item.title || 'ตั้งค่าเวรวันนักขัตฤกษ์';
      if ($id('pageSubtitle')) $id('pageSubtitle').textContent = item.subtitle || 'กำหนดวันนักขัตฤกษ์และเวรที่เปิด';
      try { renderNav(); } catch(_) {}
      if ($id('pageContent')) $id('pageContent').innerHTML = renderHolidayRulesPageV137();
      return;
    }
    const res = prevRenderPage ? prevRenderPage.apply(this, arguments) : undefined;
    postRenderFixes();
    return res;
  };
  try { renderPage = window.renderPage; } catch(_) {}

  function postRenderFixes() {
    if (state.page !== 'schedule') return;
    const page = document.querySelector('.v136-schedule-page');
    if (!page) return;
    const view = currentScheduleView();
    page.classList.toggle('v137-person-active', view === 'person');
    page.classList.toggle('v137-balance-active', view === 'balance');
    if (view === 'balance') {
      const old = page.querySelector('.v136-balance-dashboard, .v137-balance-dashboard');
      const assignments = (typeof getAssignmentsForMonth === 'function') ? getAssignmentsForMonth(state.monthKey) : (state.rosterAssignments || []).filter(a => String(a.duty_date || '').startsWith(state.monthKey || ''));
      if (old) old.outerHTML = makeBalanceViewV137(assignments);
    }
    // one more cleanup pass for hidden holiday metadata that escaped from older renderers
    page.querySelectorAll('.badge, em, td, th, span').forEach(el => { if (el.childElementCount === 0 && el.textContent.includes(MARKER)) el.textContent = cleanHolidayTitle(el.textContent); });
  }

  document.addEventListener('click', async function(e) {
    const t = e.target.closest && e.target.closest('[data-save-duty-eligibility-v137],[data-edit-holiday-v137],[data-delete-holiday-v137],[data-cancel-edit-holiday-v137]');
    if (!t) return;
    if (t.hasAttribute('data-save-duty-eligibility-v137')) { e.preventDefault(); e.stopImmediatePropagation(); await saveDutyEligibilityV137(); return; }
    if (t.dataset.editHolidayV137) { e.preventDefault(); e.stopImmediatePropagation(); state.editHolidayRuleDate = t.dataset.editHolidayV137; renderPage(); return; }
    if (t.dataset.deleteHolidayV137) { e.preventDefault(); e.stopImmediatePropagation(); await deleteHolidayV137(t.dataset.deleteHolidayV137); return; }
    if (t.hasAttribute('data-cancel-edit-holiday-v137')) { e.preventDefault(); e.stopImmediatePropagation(); state.editHolidayRuleDate = ''; renderPage(); return; }
  }, true);
  document.addEventListener('change', function(e) {
    if (e.target.id === 'dutyEligibilityStaffSelectV137') { e.preventDefault(); e.stopImmediatePropagation(); state.dutyEligibilityStaffId = e.target.value; renderPage(); }
    if (e.target.id === 'holidayRuleMonthInputV137') { e.preventDefault(); e.stopImmediatePropagation(); state.holidayRuleMonthKey = e.target.value; state.editHolidayRuleDate = ''; renderPage(); }
  }, true);
  document.addEventListener('submit', async function(e) {
    if (e.target.id === 'holidayRulesFormV137') { e.preventDefault(); e.stopImmediatePropagation(); await saveHolidayRulesV137(e.target); }
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .duty-eligibility-page-v137{grid-template-columns:280px 1fr}.holiday-rules-page-v137 .check-pill{min-width:130px}.v137-duty-table th,.v137-duty-table td{white-space:nowrap;text-align:center;padding:6px 8px}.v137-duty-table th:first-child{text-align:left;position:sticky;left:0;background:#fff;z-index:2}.v137-balance-table th,.v137-balance-table td{white-space:nowrap}.v137-balance-status{display:inline-block;border-radius:999px;padding:4px 9px;font-weight:700}.v137-balance-status.ok{background:#dcfce7;color:#166534}.v137-balance-status.warn{background:#fef3c7;color:#92400e}.v137-balance-status.over{background:#fee2e2;color:#991b1b}.v137-balance-status.exempt,.v137-balance-status.reset{background:#e0f2fe;color:#075985}.v136-schedule-page .floating-card,.v136-schedule-page .summary-cards,.v136-schedule-page .staff-summary-cards,.v136-schedule-page .roster-summary-cards{position:static!important;top:auto!important;z-index:auto!important}.v136-schedule-page:not(.v137-person-active) .v136-person-list,.v136-schedule-page:not(.v137-person-active) .v136-person-card,.v136-schedule-page:not(.v137-person-active) .schedule-person-card{position:static!important}.v136-schedule-page:not(.v137-person-active) > .v136-person-list{display:none!important}
    @media(max-width:820px){.duty-eligibility-page-v137,.holiday-rules-page-v137{grid-template-columns:1fr!important}.v137-duty-table{font-size:12px}}
  `;
  document.head.appendChild(style);

  document.addEventListener('DOMContentLoaded', () => { ensureMenu(); setTimeout(postRenderFixes, 200); setTimeout(postRenderFixes, 800); });
})();
