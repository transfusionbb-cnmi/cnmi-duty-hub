/* v136 Auth + Navigation + Layout Stabilizer
   Scope: no duty calculation changes. Only guards auth flow, renders schedule tabs/UI, and restores compact Ch4 layout.
*/
(function () {
  'use strict';

  const FORCE_KEYS = ['cnmi.forcePasswordSetup.v134','cnmi.forcePasswordSetup.v135','cnmi.forcePasswordSetup.v136'];
  function html(s) { return typeof escapeHtml === 'function' ? escapeHtml(s == null ? '' : String(s)) : String(s == null ? '' : s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
  function rawUrl() { return String(location.href || '') + ' ' + String(location.search || '') + ' ' + String(location.hash || ''); }
  function authInfo(raw = rawUrl()) {
    const text = String(raw || '');
    const params = new URLSearchParams((String(location.search || '') + '&' + String(location.hash || '').replace(/^#/, '')).replace(/^&/, ''));
    const type = params.get('type') || '';
    const mode = params.get('mode') || '';
    const hasToken = /(access_token|refresh_token|token_hash|code)=/i.test(text);
    const isRecovery = hasToken || /^(recovery|password_recovery|invite|signup)$/i.test(type) || /^(recovery|set-password|update-password)$/i.test(mode);
    const hasError = /(error=|error_code=|error_description=)/i.test(text);
    return { text, type, mode, hasToken, isRecovery, hasError };
  }
  function forcePassword(reason) {
    window.CNMI_AUTH_LINK_INTENT = true;
    window.CNMI_REQUIRE_PASSWORD_UPDATE = true;
    window.RECOVERY_INTENT = true;
    window.AUTH_LINK_PROCESSING = true;
    FORCE_KEYS.forEach(k => { try { sessionStorage.setItem(k, JSON.stringify({ reason: reason || 'v136', at: Date.now() })); } catch (_) {} });
    document.documentElement.classList.add('v136-auth-link');
  }
  function isForced() {
    if (window.CNMI_REQUIRE_PASSWORD_UPDATE || window.CNMI_AUTH_LINK_INTENT) return true;
    for (const k of FORCE_KEYS) { try { if (sessionStorage.getItem(k)) return true; } catch (_) {} }
    const info = authInfo();
    return info.isRecovery && !info.hasError;
  }
  function clearForced() {
    window.CNMI_REQUIRE_PASSWORD_UPDATE = false;
    window.CNMI_AUTH_LINK_INTENT = false;
    window.RECOVERY_INTENT = false;
    window.AUTH_LINK_PROCESSING = false;
    FORCE_KEYS.forEach(k => { try { sessionStorage.removeItem(k); } catch (_) {} });
    document.documentElement.classList.remove('v136-auth-link');
  }
  function appBaseUrl() {
    try {
      const parts = location.pathname.split('/').filter(Boolean);
      if (location.hostname.endsWith('github.io') && parts[0]) return location.origin + '/' + parts[0] + '/';
      if (location.pathname.includes('/cnmi-saff-planner/')) return location.origin + '/cnmi-saff-planner/';
    } catch (_) {}
    return location.origin + '/';
  }
  function cleanToRecoveryMode() {
    try { history.replaceState({}, document.title, appBaseUrl() + '?mode=recovery'); } catch (_) {}
  }
  function showPasswordOverlay() {
    const authView = document.getElementById('authView');
    const appView = document.getElementById('appView');
    const resetForm = document.getElementById('resetPasswordForm');
    if (!authView || !appView || !resetForm) return false;
    appView.classList.add('hidden');
    authView.classList.remove('hidden');
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    resetForm.classList.remove('hidden');
    resetForm.classList.add('active', 'v136-password-panel');
    const h = document.querySelector('.auth-card h1');
    if (h) h.textContent = 'ตั้งชื่อผู้ใช้และรหัสผ่านใหม่';
    return true;
  }
  function showAuthExpired(msg) {
    try { window.CNMI_REQUIRE_PASSWORD_UPDATE = false; } catch (_) {}
    if (typeof showToast === 'function') showToast(msg || 'ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง', { tone:'error' });
  }

  const firstInfo = authInfo();
  if (firstInfo.isRecovery && !firstInfo.hasError) forcePassword('v136-early-url');
  if (firstInfo.hasError) {
    try { sessionStorage.removeItem('cnmi.forcePasswordSetup.v134'); sessionStorage.removeItem('cnmi.forcePasswordSetup.v135'); sessionStorage.removeItem('cnmi.forcePasswordSetup.v136'); } catch (_) {}
    setTimeout(async () => {
      try { if (window.sb && sb.auth) await sb.auth.signOut(); } catch (_) {}
      showAuthExpired();
    }, 100);
  }

  const originalShowLogin = window.showLoginPanel;
  window.showLoginPanel = function showLoginPanelV136() {
    if (isForced()) { forcePassword('block-show-login'); showPasswordOverlay(); return; }
    return typeof originalShowLogin === 'function' ? originalShowLogin.apply(this, arguments) : undefined;
  };
  try { showLoginPanel = window.showLoginPanel; } catch (_) {}

  const originalShowReset = window.showResetPasswordPanel;
  window.showResetPasswordPanel = function showResetPasswordPanelV136() {
    if (typeof originalShowReset === 'function') { try { originalShowReset.apply(this, arguments); } catch (_) {} }
    showPasswordOverlay();
  };
  try { showResetPasswordPanel = window.showResetPasswordPanel; } catch (_) {}

  const originalEnterApp = window.enterApp;
  window.enterApp = async function enterAppV136() {
    if (isForced()) { forcePassword('block-enter-app'); showPasswordOverlay(); try { if (typeof setBusy === 'function') setBusy(false); } catch (_) {} return; }
    return typeof originalEnterApp === 'function' ? originalEnterApp.apply(this, arguments) : undefined;
  };
  try { enterApp = window.enterApp; } catch (_) {}

  document.addEventListener('DOMContentLoaded', () => {
    if (isForced()) {
      forcePassword('domcontentloaded');
      showPasswordOverlay();
      [80, 300, 800, 1600, 2600].forEach(ms => setTimeout(showPasswordOverlay, ms));
      setTimeout(cleanToRecoveryMode, 2500);
    }
  });

  // Stop auth tabs/login UI from stealing focus while a recovery/invite link is being processed.
  document.addEventListener('click', (e) => {
    if (!isForced()) return;
    const tab = e.target.closest('.auth-tab, [data-auth-tab]');
    if (tab) { e.preventDefault(); e.stopImmediatePropagation(); showPasswordOverlay(); }
  }, true);

  async function waitSession(maxMs = 5000) {
    const waits = [0, 150, 300, 550, 900, 1300, 1800, 2400, 3200, 4200];
    let last = null;
    for (const ms of waits) {
      if (ms) await new Promise(r => setTimeout(r, ms));
      try {
        if (!window.sb && typeof sb !== 'undefined') window.sb = sb;
        const client = window.sb || (typeof sb !== 'undefined' ? sb : null);
        if (!client?.auth) continue;
        const res = await client.auth.getSession();
        last = res.data;
        if (res.data?.session?.user) return res.data;
      } catch (_) {}
      if (ms > maxMs) break;
    }
    return last || { session: null };
  }

  document.addEventListener('submit', async (e) => {
    if (!(e.target && e.target.id === 'resetPasswordForm') || !isForced()) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const loginName = String(document.getElementById('recoveryLoginName')?.value || '').trim();
    const password = String(document.getElementById('newPassword')?.value || '');
    if (!loginName) return typeof showToast === 'function' && showToast('กรุณาตั้งชื่อผู้ใช้');
    if (!/^[a-zA-Z0-9._-]+$/.test(loginName)) return typeof showToast === 'function' && showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
    if (!password || password.length < 6) return typeof showToast === 'function' && showToast('กรุณากรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร');
    try { if (typeof setBusy === 'function') setBusy(true, 'กำลังบันทึกชื่อผู้ใช้และรหัสผ่าน'); } catch (_) {}
    try {
      const client = (typeof sb !== 'undefined' ? sb : window.sb);
      if (!client?.auth) throw new Error('ระบบ Auth ยังไม่พร้อม กรุณารีเฟรชแล้วลองใหม่');
      let data = await waitSession();
      let user = data?.session?.user || null;
      if (!user) throw new Error('ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง');
      const email = user.email || '';
      // Save login name first. If RPC is absent, continue password update but show clear console detail.
      try {
        const r = await client.rpc('set_initial_login_name_v44', { p_email: email, p_login_name: loginName });
        if (r.error) throw r.error;
      } catch (rpcErr) {
        console.warn('set_initial_login_name_v44 failed; continue password update', rpcErr);
      }
      const upd = await client.auth.updateUser({ password });
      if (upd.error) throw upd.error;
      try { await client.rpc('link_my_staff_profile_v132'); } catch (linkErr) { console.warn('link profile rpc skipped', linkErr); }
      clearForced();
      cleanToRecoveryMode();
      try { history.replaceState({}, document.title, appBaseUrl()); } catch (_) {}
      const after = await client.auth.getSession();
      if (typeof state !== 'undefined') state.session = after.data?.session || data.session;
      document.getElementById('resetPasswordForm')?.classList.add('hidden');
      if (typeof showToast === 'function') showToast('ตั้งรหัสผ่านสำเร็จ');
      if (typeof originalEnterApp === 'function') await originalEnterApp();
    } catch (err) {
      forcePassword('submit-failed');
      showPasswordOverlay();
      if (typeof showToast === 'function') showToast(err.message || 'ตั้งรหัสผ่านไม่สำเร็จ', { tone:'error' });
    } finally {
      try { if (typeof setBusy === 'function') setBusy(false); } catch (_) {}
    }
  }, true);

  // Schedule helpers
  function monthRange(key) { return typeof getMonthRange === 'function' ? getMonthRange(key) : (() => { const [y,m] = String(key).split('-').map(Number); return { y, m, start:`${y}-${String(m).padStart(2,'0')}-01` }; })(); }
  function pad2(n) { return typeof pad === 'function' ? pad(n) : String(n).padStart(2, '0'); }
  function parseD(d) { return typeof parseDate === 'function' ? parseDate(d) : new Date(`${d}T00:00:00`); }
  function isWE(d) { return typeof isWeekend === 'function' ? isWeekend(d) : [0,6].includes(parseD(d).getDay()); }
  function isHol(d) { return typeof isHolidayDate === 'function' ? isHolidayDate(d) : false; }
  function holName(d) { return typeof holidayName === 'function' ? holidayName(d) : ''; }
  function colorOf(s) { return typeof staffColor === 'function' ? staffColor(s) : (s?.staff_color || '#e8f3ff'); }
  function fgOf(bg) { return typeof textColorFor === 'function' ? textColorFor(bg) : '#1f2937'; }
  function rosterStaff() { const list = (state.staff || []).filter(s => typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : s?.is_active !== false); return typeof orderedStaff === 'function' ? orderedStaff(list) : list; }
  function stById(id) { return (state.staff || []).find(s => String(s.id) === String(id)); }
  function dutyColumnsFinal() {
    const base = (typeof DUTY_COLUMNS !== 'undefined' && Array.isArray(DUTY_COLUMNS)) ? DUTY_COLUMNS.slice() : ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT'];
    const out = [];
    base.forEach(c => {
      if (c === 'ช4' || c === 'ช4-MT/แตง' || c === 'ช4-1' || c === 'ช4-MT/แตง 1') { if (!out.includes('ช4A')) out.push('ช4A'); if (!out.includes('ช4B')) out.push('ช4B'); }
      else if (c === 'ช4-2' || c === 'ช4-MT/แตง 2') { if (!out.includes('ช4B')) out.push('ช4B'); }
      else if (!out.includes(c)) out.push(c);
    });
    if (!out.includes('ช4A')) out.splice(Math.min(3, out.length), 0, 'ช4A');
    if (!out.includes('ช4B')) out.splice(Math.min(out.indexOf('ช4A') + 1, out.length), 0, 'ช4B');
    return out;
  }
  function dutyStaffLabel(code) { return /^(ช4A|ช4B|ช4|ช4-1|ช4-2|ช4-MT\/แตง)/.test(String(code || '')) ? 'ช4' : ((typeof DUTY_LABEL !== 'undefined' && DUTY_LABEL[code]) || code || ''); }
  function dutyAdminLabel(code) { return code === 'ช4A' ? 'ช4 (1)' : code === 'ช4B' ? 'ช4 (2)' : dutyStaffLabel(code); }
  function dutyIdx(code) { return dutyColumnsFinal().indexOf(code); }
  function isLeaveActive(l) { return !['cancelled','rejected','deleted'].includes(String(l?.status || 'active').toLowerCase()); }
  function longTerm(s) { return !!(s && (s.isLongTermLeave === true || s.is_long_term_leave === true || s.long_term_leave === true || s.maternity_status === true || String(s.maternity_status || '').toLowerCase() === 'true' || String(s.position_training_status || '').includes('ลาคลอด'))); }
  function statusLabels(s, date) {
    const labels = [];
    if (longTerm(s)) labels.push('ลาคลอด');
    (state.leaves || []).filter(isLeaveActive).forEach(l => {
      if (String(l.staff_id) !== String(s?.id)) return;
      if (!(String(l.start_date || '') <= date && String(l.end_date || l.start_date || '') >= date)) return;
      const t = String(l.type || l.leave_type || l.reason || '').trim();
      if (/ไม่รับเวร/.test(t)) labels.push('ไม่รับเวร');
      else if (/คลอด/.test(t)) labels.push('ลาคลอด');
      else if (/กิจ/.test(t)) labels.push('ลากิจ');
      else if (/ป่วย/.test(t)) labels.push('ลาป่วย');
      else if (/พักผ่อน|พักร้อน|annual/i.test(t)) labels.push('ลาพักผ่อน');
      else if (t) labels.push(t);
    });
    return [...new Set(labels)];
  }
  function statusBadges(s, date) { return statusLabels(s, date).map(x => `<span class="v136-status ${x === 'ไม่รับเวร' ? 'no-duty' : x === 'ลาคลอด' ? 'maternity' : 'leave'}">${html(x)}</span>`).join(''); }
  function shiftPill(slot, s) {
    if (!slot || !s) return '';
    const bg = colorOf(s), fg = fgOf(bg);
    const attrs = slot.id && typeof canRequestTrade === 'function' && canRequestTrade(slot) ? `data-trade-duty="${html(slot.id)}"` : `data-staff-stat="${html(s.id)}"`;
    return `<button type="button" class="v136-shift-pill" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}" ${attrs} title="คลิกเพื่อจัดการเวร">${html(dutyStaffLabel(slot.duty_code))}</button>`;
  }
  function activeView() {
    const v = state.scheduleMobileView || state.scheduleView || 'table';
    return ['day','person','balance','table','ot'].includes(v) ? (v === 'ot' ? 'balance' : v) : 'table';
  }
  function setView(v) { state.scheduleMobileView = v === 'ot' ? 'balance' : v; state.scheduleView = state.scheduleMobileView; }
  function tab(id, label, active) { return `<button type="button" class="v136-tab ${active === id ? 'active' : ''}" data-schedule-view="${id}" data-schedule-mobile-view="${id}">${html(label)}</button>`; }

  window.renderMonthlySchedulePage = function renderMonthlySchedulePageV136() {
    const assignments = getAssignmentsForMonth(state.monthKey);
    const view = activeView();
    return `<div class="card schedule-page-card v136-schedule-page">
      <div class="toolbar no-print v136-toolbar"><label>เดือน <input type="month" id="scheduleMonthInput" value="${html(state.monthKey)}"></label><button class="ghost-btn" data-export-schedule-excel>Export Excel</button><button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button></div>
      <div class="v136-schedule-tabs no-print" aria-label="ตารางเวรประจำเดือน">
        ${tab('day','ดูตามวัน',view)}${tab('person','ดูตามคน',view)}${tab('balance','ดูสมดุล การกระจายเวร',view)}${tab('table','ตาราง',view)}
      </div>
      <h3 class="print-only">ตารางเวรประจำเดือน ${html(state.monthKey)}</h3>
      ${renderV136ScheduleView(assignments)}
      ${typeof renderDutyTradePanel === 'function' ? renderDutyTradePanel(assignments) : ''}
    </div>`;
  };
  try { renderMonthlySchedulePage = window.renderMonthlySchedulePage; } catch (_) {}

  function renderV136ScheduleView(assignments) {
    const v = activeView();
    if (v === 'day') return renderDayCards(assignments);
    if (v === 'person') return renderPersonView(assignments);
    if (v === 'balance') return renderBalanceView(assignments);
    return renderGrid(assignments);
  }
  window.renderReadOnlySchedule = function renderReadOnlyScheduleV136(assignments) { return renderV136ScheduleView(assignments); };
  try { renderReadOnlySchedule = window.renderReadOnlySchedule; } catch (_) {}

  function renderGrid(assignments) {
    const { y, m } = monthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const days = Array.from({ length:last }, (_, i) => i + 1);
    return `<div class="table-wrap desktop-schedule-table v136-grid-wrap"><table id="scheduleTable" class="v136-schedule-grid"><thead><tr><th class="v136-sticky-name">เจ้าหน้าที่</th>${days.map(day => { const date = `${y}-${pad2(m)}-${pad2(day)}`; const off = isWE(date) || isHol(date); return `<th class="${off?'v136-dayoff-col':''}">${day}<br><span>${html(parseD(date).toLocaleDateString('th-TH',{weekday:'short'}))}</span></th>`; }).join('')}</tr></thead><tbody>${rosterStaff().map((s, idx) => {
      const bg = colorOf(s), fg = fgOf(bg);
      return `<tr class="${idx%2?'zebra':''}"><th class="v136-name-cell" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}"><button type="button" data-staff-stat="${html(s.id)}">${html(s.nickname || s.full_name || '-')}</button></th>${days.map(day => { const date = `${y}-${pad2(m)}-${pad2(day)}`; const off = isWE(date) || isHol(date); const shifts = (assignments || []).filter(a => String(a.staff_id) === String(s.id) && a.duty_date === date).sort((a,b)=>dutyIdx(a.duty_code)-dutyIdx(b.duty_code)); return `<td class="${off?'v136-dayoff-cell':''}"><div class="v136-cell-stack">${statusBadges(s,date)}${shifts.map(a => shiftPill(a,s)).join('')}</div></td>`; }).join('')}</tr>`;
    }).join('')}</tbody></table></div>`;
  }
  function renderDayCards(assignments) {
    const { y, m } = monthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    return `<div class="v136-calendar-cards">${Array.from({ length:last },(_,i)=>i+1).map(day => { const date = `${y}-${pad2(m)}-${pad2(day)}`; const off = isWE(date)||isHol(date); const rows = (assignments || []).filter(a => a.duty_date === date && a.staff_id).sort((a,b)=>dutyIdx(a.duty_code)-dutyIdx(b.duty_code)); return `<div class="v136-day-card ${off?'dayoff':''}"><div class="v136-day-head"><b>${day}</b><span>${html(parseD(date).toLocaleDateString('th-TH',{weekday:'short'}))}</span>${isHol(date)?`<span class="badge yellow">${html(holName(date))}</span>`:''}</div>${rows.length ? rows.map(a => { const s = stById(a.staff_id); return `<div class="v136-day-line"><span>${html(dutyStaffLabel(a.duty_code))}</span>${shiftPill(a,s)}</div>`; }).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`; }).join('')}</div>`;
  }
  function renderPersonView(assignments) {
    return `<div class="v136-person-list">${rosterStaff().map(s => { const bg = colorOf(s), fg = fgOf(bg); const rows = (assignments || []).filter(a => String(a.staff_id) === String(s.id)).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)) || dutyIdx(a.duty_code)-dutyIdx(b.duty_code)); return `<button type="button" class="v136-person-card" style="--staff-bg:${html(bg)};--staff-fg:${html(fg)}" data-staff-stat="${html(s.id)}"><b>${html(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span><small>${rows.slice(0,8).map(a => `${Number(String(a.duty_date).slice(-2))}:${dutyStaffLabel(a.duty_code)}`).join(' • ') || 'ไม่มีเวรเดือนนี้'}</small></button>`; }).join('')}</div>`;
  }
  function renderBalanceView(assignments) {
    const stats = (typeof calcFairness === 'function') ? calcFairness((assignments || []).filter(a => a.staff_id)) : {};
    const active = rosterStaff();
    const values = active.map(s => stats[s.id]?.units || 0).filter(v => Number.isFinite(v));
    const avg = values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0;
    return `<div class="v136-balance-dashboard"><div class="notice soft-notice">ดูภาพรวมการกระจายเวรเท่านั้น ไม่เปลี่ยนสูตรคำนวณเวรเดิม</div><div class="table-wrap"><table class="v136-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เวรที่จัดแล้ว</th><th>Quota Gap</th><th>OT Balance/ยกยอด</th><th>สถานะ</th></tr></thead><tbody>${active.map(s => { const r = stats[s.id] || {}; const target = Number(s.targetShifts ?? s.target_shifts ?? avg ?? 0); const current = Number(r.units || r.total || 0); const isExempt = longTerm(s) || target === 0; const gap = isExempt ? 0 : target - current; const bal = isExempt ? 0 : Number(s.overtimeBalance ?? s.overtime_balance ?? s.carry_over_balance ?? 0); const label = isExempt ? 'ยกเว้น/ลาคลอด' : Math.abs(gap) < 0.5 ? 'สมดุล' : gap > 0 ? 'ขาดเวร' : 'งานหนักเกิน'; const cls = isExempt ? 'exempt' : Math.abs(gap) < 0.5 ? 'ok' : gap > 0 ? 'warn' : 'over'; return `<tr><td>${typeof staffPill === 'function' ? staffPill(s) : html(s.nickname || s.full_name)}</td><td>${current.toFixed(1)}</td><td>${gap.toFixed(1)}</td><td>${bal.toFixed(1)} ชม.</td><td><span class="v136-balance-status ${cls}">${label}</span></td></tr>`; }).join('')}</tbody></table></div></div>`;
  }

  window.renderRosterGrid = function renderRosterGridV136(assignments) {
    if (!assignments || !assignments.length) return typeof empty === 'function' ? empty('กด “สร้างร่าง Auto Assign” เพื่อเริ่มจัดเวร') : '';
    const { y, m } = monthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const cols = dutyColumnsFinal();
    return `<div class="table-wrap roster-table-wrap v136-roster-admin-wrap"><table class="roster-table v136-roster-admin"><thead><tr><th class="v136-admin-date-col">วันที่</th>${cols.map(c => `<th>${html(dutyAdminLabel(c))}</th>`).join('')}</tr></thead><tbody>${Array.from({length:last},(_,i)=>i+1).map(day => { const date = `${y}-${pad2(m)}-${pad2(day)}`; const dow = parseD(date).toLocaleDateString('th-TH',{weekday:'short'}); const rowCls = isWE(date)||isHol(date)?'v136-admin-dayoff-row':''; return `<tr class="${rowCls}"><td class="v136-admin-date"><b>${day}</b><br><span>${html(dow)}</span>${isHol(date)?`<br><span class="badge yellow">${html(holName(date))}</span>`:''}</td>${cols.map(code => { if (typeof allowedDutyCodesForDate === 'function' && !allowedDutyCodesForDate(date).includes(code)) return '<td class="muted v136-admin-dayoff-cell">-</td>'; const slot = (assignments || []).find(a => a.duty_date === date && a.duty_code === code); if (!slot) return '<td class="muted">-</td>'; const id = slot.id || slot._temp_id; return `<td><div class="roster-slot ${slot.is_locked?'locked':''}" data-drop-slot="${html(id)}"><div class="assigned-name">${slot.staff_id && typeof staffPill === 'function' ? staffPill(slot.staff_id) : 'ยังไม่จัด'}</div><select class="mobile-roster-select" data-roster-slot-select="${html(id)}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${typeof staffOptionList === 'function' ? staffOptionList(slot.staff_id, st => typeof canStaffWorkSlot === 'function' ? canStaffWorkSlot(st.id, slot) : true) : ''}</select><div class="actions"><button class="tiny-btn" data-clear-slot="${html(id)}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${html(id)}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div></div></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>${typeof renderRosterMobileGrid === 'function' ? renderRosterMobileGrid(assignments, y, m, last) : ''}`;
  };
  try { renderRosterGrid = window.renderRosterGrid; } catch (_) {}

  document.addEventListener('click', function scheduleTabClickV136(e) {
    const t = e.target.closest('[data-schedule-view], [data-schedule-mobile-view]');
    if (!t) return;
    const v = t.dataset.scheduleView || t.dataset.scheduleMobileView;
    if (!['day','person','balance','table','ot'].includes(v)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    setView(v);
    if (typeof renderPage === 'function') renderPage();
  }, true);

  const originalRenderPage = window.renderPage;
  window.renderPage = function renderPageV136() {
    const res = typeof originalRenderPage === 'function' ? originalRenderPage.apply(this, arguments) : undefined;
    if (typeof state !== 'undefined' && state.page === 'schedule') {
      const content = document.getElementById('pageContent');
      if (content && !content.querySelector('.v136-schedule-page')) content.innerHTML = window.renderMonthlySchedulePage();
    }
    return res;
  };
  try { renderPage = window.renderPage; } catch (_) {}
})();
