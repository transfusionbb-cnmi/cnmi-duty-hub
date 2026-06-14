
/* V203 Dynamic Thai fiscal year logic for Leave + Calendar */
(function(){
  const VERSION_V203 = 'V203_DYNAMIC_FISCAL_YEAR_LEAVE_CALENDAR';

  function pad2V203(n) { return String(n).padStart(2, '0'); }

  function parseLocalDateV203(value) {
    if (value instanceof Date) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    const text = String(value || '').slice(0, 10);
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
    if (!m) return null;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;
    const out = new Date(y, mo - 1, d);
    if (out.getFullYear() !== y || out.getMonth() !== mo - 1 || out.getDate() !== d) return null;
    return out;
  }

  function dateKeyV203(value) {
    const d = parseLocalDateV203(value);
    if (!d) return '';
    return `${d.getFullYear()}-${pad2V203(d.getMonth() + 1)}-${pad2V203(d.getDate())}`;
  }

  function thaiDateSlashV203(value) {
    const d = parseLocalDateV203(value);
    if (!d) return '-';
    return `${pad2V203(d.getDate())}/${pad2V203(d.getMonth() + 1)}/${d.getFullYear() + 543}`;
  }

  function getThaiFiscalYearInfoV203(baseDate) {
    const base = parseLocalDateV203(baseDate || new Date()) || new Date();
    const ceYear = base.getFullYear();
    const month = base.getMonth() + 1;
    const currentFiscalYearCE = month >= 10 ? ceYear + 1 : ceYear;
    const nextFiscalYearCE = currentFiscalYearCE + 1;
    const currentStart = `${currentFiscalYearCE - 1}-10-01`;
    const currentEnd = `${currentFiscalYearCE}-09-30`;
    const nextStart = `${nextFiscalYearCE - 1}-10-01`;
    const nextEnd = `${nextFiscalYearCE}-09-30`;
    return {
      currentFiscalYearCE,
      nextFiscalYearCE,
      currentFiscalYearBE: currentFiscalYearCE + 543,
      nextFiscalYearBE: nextFiscalYearCE + 543,
      currentFiscalYear: currentFiscalYearCE + 543,
      nextFiscalYear: nextFiscalYearCE + 543,
      currentStart,
      currentEnd,
      nextStart,
      nextEnd,
      calendarQueryStart: currentStart,
      calendarQueryEnd: nextEnd,
      maxLeaveDate: nextEnd,
      maxLeaveDateThai: thaiDateSlashV203(nextEnd)
    };
  }

  function fiscalLimitMessageV203(info) {
    return `ไม่สามารถบันทึกการลาเกินวันที่ ${info.maxLeaveDateThai} ซึ่งเป็นวันสิ้นสุดของปีงบประมาณถัดไปได้`;
  }

  function addOrReplaceAttrV203(tag, attrName, attrValue) {
    const attr = `${attrName}="${String(attrValue).replace(/"/g, '&quot;')}"`;
    const re = new RegExp(`\\s${attrName}="[^"]*"`, 'i');
    if (re.test(tag)) return tag.replace(re, ` ${attr}`);
    return tag.replace(/>$/, ` ${attr}>`);
  }

  function applyFiscalMaxToLeaveFormHtmlV203(html) {
    const info = getThaiFiscalYearInfoV203();
    let out = String(html || '');
    out = out.replace(/<input\s+name="start_date"\s+type="date"[^>]*>/i, tag => addOrReplaceAttrV203(tag, 'max', info.maxLeaveDate));
    out = out.replace(/<input\s+name="end_date"\s+type="date"[^>]*>/i, tag => addOrReplaceAttrV203(tag, 'max', info.maxLeaveDate));
    if (!out.includes('data-v203-fiscal-leave-note')) {
      const note = `<div class="notice soft-notice wide" data-v203-fiscal-leave-note>ระบบเปิดให้บันทึกการลาถึง ${info.maxLeaveDateThai} (สิ้นปีงบประมาณ ${info.nextFiscalYearBE}) และจะปรับช่วงปีงบประมาณให้อัตโนมัติทุกวันที่ 1 ตุลาคม</div>`;
      out = out.replace(/<button class="primary-btn wide" type="submit">/i, `${note}<button class="primary-btn wide" type="submit">`);
    }
    return out;
  }

  window.getThaiFiscalYearInfo = getThaiFiscalYearInfoV203;
  window.getFiscalYearInfo = getThaiFiscalYearInfoV203;
  window.parseLocalDateKey = dateKeyV203;

  const previousRenderLeavePageV203 = window.renderLeavePage || (typeof renderLeavePage === 'function' ? renderLeavePage : null);
  if (previousRenderLeavePageV203) {
    window.renderLeavePage = renderLeavePage = function renderLeavePageV203() {
      return applyFiscalMaxToLeaveFormHtmlV203(previousRenderLeavePageV203.apply(this, arguments));
    };
  }

  function validateLeaveFiscalLimitV203(form, options = {}) {
    const info = getThaiFiscalYearInfoV203();
    const startInput = form?.querySelector?.('input[name="start_date"]');
    const endInput = form?.querySelector?.('input[name="end_date"]');
    if (startInput) startInput.max = info.maxLeaveDate;
    if (endInput) endInput.max = info.maxLeaveDate;
    const start = dateKeyV203(startInput?.value || '');
    const end = dateKeyV203(endInput?.value || '');
    const overLimit = (!!start && start > info.maxLeaveDate) || (!!end && end > info.maxLeaveDate);
    const msg = overLimit ? fiscalLimitMessageV203(info) : '';
    [startInput, endInput].forEach(input => {
      if (input && typeof input.setCustomValidity === 'function') input.setCustomValidity(msg);
    });
    if (overLimit && options.toast !== false && typeof showToast === 'function') showToast(msg);
    return !overLimit;
  }

  const previousSaveLeaveV203 = window.saveLeave || (typeof saveLeave === 'function' ? saveLeave : null);
  if (previousSaveLeaveV203) {
    window.saveLeave = saveLeave = async function saveLeaveV203(form) {
      if (!validateLeaveFiscalLimitV203(form, { toast: true })) return;
      return previousSaveLeaveV203.apply(this, arguments);
    };
  }

  document.addEventListener('change', function(e){
    const form = e.target?.closest?.('#leaveForm');
    if (!form || !['start_date', 'end_date'].includes(e.target?.name)) return;
    validateLeaveFiscalLimitV203(form, { toast: true });
  }, true);

  document.addEventListener('input', function(e){
    const form = e.target?.closest?.('#leaveForm');
    if (!form || !['start_date', 'end_date'].includes(e.target?.name)) return;
    validateLeaveFiscalLimitV203(form, { toast: false });
  }, true);

  async function queryCalendarFiscalWindowV203() {
    if (!state?.profile || !sb) return;
    const info = getThaiFiscalYearInfoV203();
    const start = info.calendarQueryStart;
    const end = info.calendarQueryEnd;
    const startMonth = start.slice(0, 7);
    const endMonth = end.slice(0, 7);
    const requests = {
      leaves: sb.from('leave_requests').select('*').gte('end_date', start).lte('start_date', end).order('start_date', { ascending: false }),
      activities: sb.from('activity_events').select('*').gte('end_date', start).lte('start_date', end).order('start_date'),
      rosterAssignments: sb.from('roster_assignments').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date'),
      positions: sb.from('daily_positions').select('*').gte('work_date', start).lte('work_date', end).order('work_date'),
      attendance: sb.from('attendance_logs').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date', { ascending: false }),
      holidays: sb.from('public_holidays').select('*').gte('holiday_date', start).lte('holiday_date', end).order('holiday_date'),
      incharges: sb.from('monthly_incharges').select('*').gte('month_key', startMonth).lte('month_key', endMonth).order('month_key', { ascending: false }),
      positionDayStatus: sb.from('daily_position_day_status').select('*').gte('work_date', start).lte('work_date', end).order('work_date')
    };
    if (typeof isAdmin === 'function' && isAdmin()) {
      requests.hrChecks = sb.from('hr_checks').select('*').order('updated_at', { ascending: false });
    }
    const entries = Object.entries(requests);
    const results = await Promise.all(entries.map(([, req]) => req));
    results.forEach((res, idx) => {
      const key = entries[idx][0];
      if (res.error) throw new Error(`${key}: ${res.error.message}`);
      state[key] = res.data || [];
    });
    state.fiscalYearWindow = info;
  }

  const previousLoadAllDataV203 = window.loadAllData || (typeof loadAllData === 'function' ? loadAllData : null);
  if (previousLoadAllDataV203) {
    window.loadAllData = loadAllData = async function loadAllDataV203() {
      await previousLoadAllDataV203.apply(this, arguments);
      await queryCalendarFiscalWindowV203();
    };
  }

  console.info(`[${VERSION_V203}] dynamic fiscal year max leave date + fiscal calendar window loaded`, getThaiFiscalYearInfoV203());
})();
