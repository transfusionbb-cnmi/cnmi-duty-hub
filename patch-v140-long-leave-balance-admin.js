/* v140 Long-term Leave / Balance Reset Admin Patch
   Scope only: add Admin UI controls for long-term leave and balance reset,
   force balance dashboard to exclude long-term leave / target 0 staff,
   and make carry-over helpers return 0 for excluded staff.
   Does not modify roster assignment, OT formulas, or existing duty calculations.
*/
(function () {
  'use strict';

  const VERSION = 'v140';
  const esc = (v) => (typeof escapeHtml === 'function')
    ? escapeHtml(v == null ? '' : String(v))
    : String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad2 = (n) => String(n).padStart(2, '0');
  const num = (v, fallback = 0) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const LONG_LEAVE_RE = /(คลอด|ลาคลอด|บวช|ลาบวช|ดูใจ|ลาดูใจ|ถือศีล|ลาถือศีล|long.?term|maternity|mat\s*leave)/i;

  function monthKeyNow() {
    if (window.state && state.monthKey) return state.monthKey;
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function prevMonthKey(key) {
    const [y, m] = String(key || monthKeyNow()).split('-').map(Number);
    const d = new Date(y || new Date().getFullYear(), (m || 1) - 2, 1);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
  }
  function rosterStaffV140() {
    const arr = (window.state && Array.isArray(state.staff)) ? state.staff : [];
    const filtered = arr.filter(s => s && s.is_active !== false && s.staff_type !== 'แพทย์' && s.roster_enabled !== false);
    try { return typeof orderedStaff === 'function' ? orderedStaff(filtered) : filtered; }
    catch (_) { return filtered; }
  }
  function monthRange(key) {
    const [y, m] = String(key || monthKeyNow()).split('-').map(Number);
    return { y, m, last: new Date(y, m, 0).getDate() };
  }
  function dateInRange(date, start, end) {
    if (!date || !start) return false;
    const e = end || start;
    return String(start) <= date && date <= String(e);
  }
  function activeLeave(l) {
    const st = String(l.status || l.approval_status || '').toLowerCase();
    return !/reject|cancel|ยกเลิก|ไม่อนุมัติ/.test(st);
  }
  function leaveTypeText(l) {
    return String(l.type || l.leave_type || l.reason || l.note || '').trim();
  }
  function hasLongLeaveInMonth(staff, key) {
    if (!window.state || !Array.isArray(state.leaves)) return false;
    const { y, m, last } = monthRange(key);
    const start = `${y}-${pad2(m)}-01`;
    const end = `${y}-${pad2(m)}-${pad2(last)}`;
    return state.leaves.some(l => {
      if (!activeLeave(l)) return false;
      if (String(l.staff_id) !== String(staff.id)) return false;
      if (!LONG_LEAVE_RE.test(leaveTypeText(l))) return false;
      const ls = String(l.start_date || l.work_date || '');
      const le = String(l.end_date || l.start_date || l.work_date || '');
      return ls <= end && le >= start;
    });
  }
  function isLongLeaveStaff(staff, key) {
    if (!staff) return false;
    if (staff.is_long_term_leave === true || staff.isLongTermLeave === true) return true;
    if (String(staff.is_long_term_leave).toLowerCase() === 'true') return true;
    if (String(staff.isLongTermLeave).toLowerCase() === 'true') return true;
    if (LONG_LEAVE_RE.test(String(staff.position_training_status || staff.maternity_status || staff.note || staff.remark || ''))) return true;
    return hasLongLeaveInMonth(staff, key || monthKeyNow());
  }
  function targetFor(staff, stats, avgQuota) {
    const raw = staff.targetShifts ?? staff.target_shifts ?? staff.monthly_target_shifts ?? staff.quota_shifts;
    const n = num(raw, NaN);
    if (Number.isFinite(n)) return n;
    return num(avgQuota, 0);
  }
  function isTargetZero(staff, stats, avgQuota) {
    const raw = staff.targetShifts ?? staff.target_shifts ?? staff.monthly_target_shifts ?? staff.quota_shifts;
    return raw !== undefined && raw !== null && raw !== '' && num(raw, 0) === 0;
  }
  function assignmentList(key) {
    try {
      if (typeof getAssignmentsForMonth === 'function') return getAssignmentsForMonth(key || monthKeyNow()).filter(a => a && a.staff_id);
    } catch (_) {}
    return ((window.state && state.rosterAssignments) || []).filter(a => String(a.duty_date || '').startsWith(key || monthKeyNow()) && a.staff_id);
  }
  function isWeekend(date) {
    const d = new Date(`${date}T12:00:00`);
    const day = d.getDay();
    return day === 0 || day === 6;
  }
  function isHoliday(date) {
    try { if (typeof isHolidayDate === 'function' && isHolidayDate(date)) return true; } catch (_) {}
    try { if (typeof getHolidayName === 'function' && getHolidayName(date)) return true; } catch (_) {}
    return false;
  }
  function leaveLabelsFor(staff, date) {
    const out = [];
    ((window.state && state.leaves) || []).filter(activeLeave).forEach(l => {
      if (String(l.staff_id) !== String(staff.id)) return;
      const start = String(l.start_date || l.work_date || '');
      const end = String(l.end_date || l.start_date || l.work_date || '');
      if (!dateInRange(date, start, end)) return;
      const t = leaveTypeText(l);
      if (/ไม่รับเวร/.test(t)) out.push('ไม่รับเวร');
      else if (/คลอด/.test(t)) out.push('ลาคลอด');
      else if (/บวช/.test(t)) out.push('ลาบวช');
      else if (/ดูใจ/.test(t)) out.push('ลาดูใจ');
      else if (/ถือศีล/.test(t)) out.push('ลาถือศีล');
      else if (/กิจ/.test(t)) out.push('ลากิจ');
      else if (/ป่วย/.test(t)) out.push('ลาป่วย');
      else if (/พักผ่อน|พักร้อน/.test(t)) out.push('ลาพักผ่อน');
      else if (t) out.push(t);
    });
    return [...new Set(out)];
  }
  function daysOffFor(staff, key, assignments) {
    if (isLongLeaveStaff(staff, key)) return 0;
    const { y, m, last } = monthRange(key);
    let count = 0;
    for (let day = 1; day <= last; day++) {
      const date = `${y}-${pad2(m)}-${pad2(day)}`;
      if (!(isWeekend(date) || isHoliday(date))) continue;
      const hasDuty = (assignments || []).some(a => String(a.staff_id) === String(staff.id) && String(a.duty_date) === date);
      const labels = leaveLabelsFor(staff, date);
      if (!hasDuty || labels.includes('ไม่รับเวร')) count++;
    }
    return count;
  }
  function computeStats(assignments) {
    try {
      if (typeof calcFairness === 'function') return calcFairness((assignments || []).filter(a => a.staff_id)) || {};
    } catch (_) {}
    const stats = {};
    (assignments || []).forEach(a => {
      if (!a.staff_id) return;
      stats[a.staff_id] = stats[a.staff_id] || { units: 0, total: 0 };
      stats[a.staff_id].units += 1;
      stats[a.staff_id].total += 1;
    });
    return stats;
  }
  function carryFor(staff, exempt, previousExempt) {
    if (exempt || previousExempt) return 0;
    return num(staff.carry_over_balance ?? staff.overtime_balance ?? staff.overtimeBalance ?? staff.ot_balance, 0);
  }
  window.getCarryOverBalanceV140 = function getCarryOverBalanceV140(staff, key) {
    const prevExempt = isLongLeaveStaff(staff, prevMonthKey(key || monthKeyNow()));
    const exempt = isLongLeaveStaff(staff, key || monthKeyNow()) || num(staff.target_shifts ?? staff.targetShifts, NaN) === 0;
    return carryFor(staff, exempt, prevExempt);
  };

  function renderBalanceV140(assignments) {
    const key = monthKeyNow();
    const prevKey = prevMonthKey(key);
    const staff = rosterStaffV140();
    const stats = computeStats(assignments || assignmentList(key));
    const nonExempt = staff.filter(s => !isLongLeaveStaff(s, key) && !isTargetZero(s, stats, 0));
    const quotaValues = nonExempt.map(s => num(stats[s.id]?.units ?? stats[s.id]?.total, 0)).filter(Number.isFinite);
    const avgQuota = quotaValues.length ? quotaValues.reduce((a, b) => a + b, 0) / quotaValues.length : 0;
    const prevAssignments = assignmentList(prevKey);
    const prevOffValues = nonExempt.map(s => daysOffFor(s, prevKey, prevAssignments));
    const avgPrevOff = prevOffValues.length ? prevOffValues.reduce((a, b) => a + b, 0) / prevOffValues.length : 0;

    const rows = staff.map(s => {
      const r = stats[s.id] || {};
      const longExempt = isLongLeaveStaff(s, key);
      const zeroTarget = isTargetZero(s, r, avgQuota);
      const exempt = longExempt || zeroTarget;
      const prevExempt = isLongLeaveStaff(s, prevKey);
      const current = exempt ? 0 : num(r.units ?? r.total, 0);
      const target = exempt ? 0 : targetFor(s, r, avgQuota);
      const gap = exempt ? 0 : target - current;
      const carry = carryFor(s, exempt, prevExempt);
      const daysOff = exempt ? 0 : daysOffFor(s, key, assignments || assignmentList(key));
      const prevDaysOff = exempt ? 0 : daysOffFor(s, prevKey, prevAssignments);
      const nextOff = exempt ? 0 : avgPrevOff - prevDaysOff;
      const status = longExempt ? 'ยกเว้น/ลาระยะยาว'
        : zeroTarget ? 'ไม่มีเป้าหมายเวร'
        : prevExempt ? 'รีเซ็ตยอดสะสมแล้ว'
        : Math.abs(gap) < 0.5 ? 'สมดุล'
        : gap > 0 ? 'ขาดเวร' : 'งานหนักเกิน';
      const cls = longExempt || zeroTarget ? 'exempt' : prevExempt ? 'reset' : Math.abs(gap) < 0.5 ? 'ok' : gap > 0 ? 'warn' : 'over';
      const name = typeof staffPill === 'function' ? staffPill(s) : esc(s.nickname || s.full_name || '-');
      return `<tr class="${exempt ? 'v140-exempt-row' : ''}">
        <td>${name}</td>
        <td>${target.toFixed(1)}</td>
        <td>${current.toFixed(1)}</td>
        <td>${gap.toFixed(1)}</td>
        <td>${carry.toFixed(1)} ชม.</td>
        <td>${daysOff}</td>
        <td>${nextOff.toFixed(1)}</td>
        <td><span class="v140-balance-status ${cls}">${esc(status)}</span></td>
      </tr>`;
    }).join('');

    return `<div class="v140-balance-dashboard">
      <div class="notice soft-notice"><b>v140 Leave & Reset Logic:</b> คนที่เปิดสถานะลาระยะยาว หรือ targetShifts = 0 จะถูกบังคับ Gap/Balance เป็น 0 และไม่ถูกยกหนี้เวรไปเดือนถัดไป</div>
      <div class="table-wrap"><table class="v140-balance-table"><thead><tr>
        <th>เจ้าหน้าที่</th><th>เป้าหมายเวร</th><th>เวรที่จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>จำนวนวันหยุด</th><th>ทบวันหยุดครั้งหน้า</th><th>Status</th>
      </tr></thead><tbody>${rows}</tbody></table></div>
    </div>`;
  }

  function activeScheduleView() {
    const v = (window.state && (state.scheduleView || state.scheduleMobileView)) || 'table';
    return v === 'ot' ? 'balance' : v;
  }
  function replaceBalanceDashboard() {
    if (!window.state || state.page !== 'schedule' || activeScheduleView() !== 'balance') return;
    const page = document.getElementById('pageContent');
    if (!page || page.querySelector('.v140-balance-dashboard')) return;
    const target = page.querySelector('.v137-balance-dashboard, .v136-balance-dashboard, .v125-balance-dashboard, .balance-dashboard');
    const assignments = assignmentList(monthKeyNow());
    if (target) target.outerHTML = renderBalanceV140(assignments);
  }

  function injectAdminLeaveControls() {
    if (!window.state || state.page !== 'users') return;
    document.querySelectorAll('[data-staff-row]').forEach(card => {
      if (card.querySelector('[data-v140-long-leave-wrap]')) return;
      const staffId = card.getAttribute('data-staff-row');
      const staff = (state.staff || []).find(s => String(s.id) === String(staffId)) || {};
      const checked = isLongLeaveStaff(staff, monthKeyNow());
      const form = card.querySelector('.admin-user-form') || card;
      const wrap = document.createElement('div');
      wrap.className = 'v140-admin-leave-controls';
      wrap.setAttribute('data-v140-long-leave-wrap', staffId);
      wrap.innerHTML = `
        <label class="v140-toggle-row" title="เปิดเมื่อลาคลอด/ลาบวช/ลาดูใจ/ลาถือศีล หรือพักงานระยะยาว">
          <input type="checkbox" data-v140-long-leave-toggle="${esc(staffId)}" ${checked ? 'checked' : ''}>
          <span>สถานะลาระยะยาว</span>
        </label>
        <button type="button" class="tiny-btn warning" data-v140-reset-balance="${esc(staffId)}">รีเซ็ตยอดสะสมเป็น 0</button>
        <small class="muted">ใช้กับลาคลอด/กลับมาทำงาน/พนักงานใหม่ เพื่อไม่ให้หนี้เวรเก่าทบต่อ</small>`;
      form.appendChild(wrap);
    });
  }

  async function updateLongLeave(staffId, value) {
    if (!window.sb) return showToast('ยังไม่ได้เชื่อม Supabase', { tone: 'error' });
    setBusy && setBusy(true, 'กำลังบันทึกสถานะลาระยะยาว');
    try {
      const { error } = await sb.from('staff_profiles').update({ is_long_term_leave: !!value }).eq('id', staffId);
      if (error) throw error;
      const st = (state.staff || []).find(s => String(s.id) === String(staffId));
      if (st) st.is_long_term_leave = !!value;
      showToast(value ? 'เปิดสถานะลาระยะยาวแล้ว' : 'ปิดสถานะลาระยะยาวแล้ว');
      replaceBalanceDashboard();
    } catch (err) {
      showToast((err && err.message ? err.message : 'บันทึกไม่สำเร็จ') + ' — ถ้ายังไม่เคยรัน SQL v140 ให้รันก่อน', { tone: 'error' });
    } finally { setBusy && setBusy(false); }
  }

  async function resetBalance(staffId) {
    if (!window.sb) return showToast('ยังไม่ได้เชื่อม Supabase', { tone: 'error' });
    const st = (state.staff || []).find(s => String(s.id) === String(staffId)) || {};
    const name = st.nickname || st.full_name || 'เจ้าหน้าที่นี้';
    if (!confirm(`ยืนยันรีเซ็ตยอดสะสมของ ${name} เป็น 0 ?`)) return;
    setBusy && setBusy(true, 'กำลังรีเซ็ตยอดสะสม');
    try {
      const patch = { carry_over_balance: 0, overtime_balance: 0, ot_balance: 0, balance_reset_at: new Date().toISOString() };
      const { error } = await sb.from('staff_profiles').update(patch).eq('id', staffId);
      if (error) throw error;
      Object.assign(st, patch);
      showToast('รีเซ็ตยอดสะสมเป็น 0 แล้ว');
      replaceBalanceDashboard();
    } catch (err) {
      showToast((err && err.message ? err.message : 'รีเซ็ตไม่สำเร็จ') + ' — ถ้ายังไม่เคยรัน SQL v140 ให้รันก่อน', { tone: 'error' });
    } finally { setBusy && setBusy(false); }
  }

  const oldRenderPage = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
  window.renderPage = function renderPageV140() {
    const res = typeof oldRenderPage === 'function' ? oldRenderPage.apply(this, arguments) : undefined;
    setTimeout(() => { injectAdminLeaveControls(); replaceBalanceDashboard(); }, 0);
    setTimeout(() => { injectAdminLeaveControls(); replaceBalanceDashboard(); }, 120);
    return res;
  };
  try { renderPage = window.renderPage; } catch (_) {}

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t && t.matches && t.matches('[data-v140-long-leave-toggle]')) {
      updateLongLeave(t.getAttribute('data-v140-long-leave-toggle'), t.checked);
    }
  }, true);
  document.addEventListener('click', (e) => {
    const btn = e.target && e.target.closest && e.target.closest('[data-v140-reset-balance]');
    if (btn) {
      e.preventDefault();
      e.stopPropagation();
      resetBalance(btn.getAttribute('data-v140-reset-balance'));
    }
  }, true);

  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => { injectAdminLeaveControls(); replaceBalanceDashboard(); }, 250);
  });

  // Expose for quick console checks by admin/debugging.
  window.renderBalanceV140 = renderBalanceV140;
  window.isLongLeaveStaffV140 = isLongLeaveStaff;
})();
