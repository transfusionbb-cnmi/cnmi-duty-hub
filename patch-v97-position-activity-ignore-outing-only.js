/* CNMI Duty Hub v97 - Position month: ignore activities except real outing participants
   Patch-only. Load after v94/v96 and after all position patches.
   Goal:
   - จัดตำแหน่งรายเดือน/รายวัน: กิจกรรมทั่วไป เช่น ประชุม/อบรม/ตรวจมาตรฐาน ไม่ทำให้รอตรวจสอบ
   - ไม่รับเวร ยังจัดตำแหน่งได้
   - ลา... เท่านั้นที่ block ตำแหน่ง
   - ออกหน่วยจะใช้ตำแหน่งฝั่งออกหน่วยเฉพาะวันที่ event_type='ออกหน่วย' และมี participant_ids จริง
   - แก้ bug v96 ที่ตีความตำแหน่ง Donor Room ปกติเป็นออกหน่วย เพราะ code DR-* ซ้ำกับชุดออกหน่วย
*/
(function(){
  'use strict';
  const PATCH = 'v97-position-activity-ignore-outing-only';

  function S(){ try { return typeof state !== 'undefined' ? state : null; } catch(e){ return null; } }
  function safe(fn, fallback){ try { return fn(); } catch(e){ console.warn('[CNMI]', PATCH, e); return fallback; } }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))); }
  function arr(v){
    if (Array.isArray(v)) return v.filter(Boolean);
    if (v == null || v === '') return [];
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s || s === '[]') return [];
      try { const parsed = JSON.parse(s); if (Array.isArray(parsed)) return parsed.filter(Boolean); } catch(e) {}
      return s.split(/[,,;\n|]+/).map(x => x.trim()).filter(Boolean);
    }
    return [];
  }
  function inRange(date, row){
    return safe(() => dateInRange(date, row.start_date, row.end_date), String(row?.start_date || '') <= date && String(row?.end_date || '') >= date);
  }
  function isTrueLeaveType(type){
    const t = String(type || '').trim();
    return t.startsWith('ลา') && t !== 'ไม่รับเวร';
  }
  function isTrueLeaveOnV97(staffId, date){
    return !!(S()?.leaves || []).some(l => String(l.staff_id) === String(staffId) && l.status !== 'cancelled' && isTrueLeaveType(l.type) && inRange(date, l));
  }
  function realOutingActivities(date){
    return (S()?.activities || []).filter(a => {
      if (String(a.event_type || '').trim() !== 'ออกหน่วย') return false;
      if (!inRange(date, a)) return false;
      return arr(a.participant_ids).length > 0;
    });
  }
  function realOutingParticipantIds(date){
    const ids = new Set();
    realOutingActivities(date).forEach(a => arr(a.participant_ids).forEach(id => ids.add(String(id))));
    return [...ids];
  }
  function hasRealOuting(date){ return realOutingActivities(date).length > 0; }
  function isOutingParticipant(staffId, date){ return realOutingParticipantIds(date).includes(String(staffId)); }

  // Strict outing row: only rows explicitly saved as outing zone/eligibility are outing.
  // Do NOT treat normal Donor Room DR-* codes as outing, because DEFAULT_POSITIONS and OUTING_POSITIONS share several codes.
  function isStrictOutingRow(row){
    const zone = String(row?.zone || '').trim();
    const code = String(row?.position_code || row?.code || '').trim();
    const eligibility = String(row?.eligibility_code || '').trim();
    return zone.includes('ออกหน่วย') || /^OUTING:/.test(code) || /^OUTING:/.test(eligibility);
  }
  function isReviewRow(row){
    const text = `${row?.position_code || ''} ${row?.code || ''} ${row?.zone || ''} ${row?.main_rule || ''} ${row?.job_desc || ''}`;
    return /รอตรวจสอบ|ไม่พบตำแหน่ง/.test(text);
  }
  function templateCode(t){ return String(t?.code || t?.position_code || '').trim(); }
  function baseCode(code){ return safe(() => positionBaseCode(code), String(code || '').replace(/\s+#\d+$/, '').trim()); }
  function defaultTemplateByCode(code){
    const base = baseCode(code);
    return safe(() => DEFAULT_POSITIONS || [], []).find(t => templateCode(t) === base) || null;
  }
  function outingTemplateByCode(code){
    const base = baseCode(String(code || '').replace(/^OUTING:/, ''));
    return safe(() => OUTING_POSITIONS || [], []).find(t => templateCode(t) === base || String(t.eligibility_code || '').replace(/^OUTING:/, '') === base) || null;
  }
  function templatesForStaffDate(staffId, date){
    if (safe(() => isNoPositionDay(date), false)) return [];
    if (hasRealOuting(date) && isOutingParticipant(staffId, date)) return safe(() => OUTING_POSITIONS || [], []);
    return safe(() => DEFAULT_POSITIONS || [], []);
  }
  function canUsePosition(staff, tpl, date){
    if (!staff || !tpl) return false;
    if (isTrueLeaveOnV97(staff.id, date)) return false;
    return safe(() => positionCandidateOk(staff, tpl, date), true);
  }
  function chooseTemplateForStaff(staffId, date, preferredCode){
    const staff = (S()?.staff || []).find(s => String(s.id) === String(staffId));
    if (!staff) return null;
    const templates = templatesForStaffDate(staffId, date);
    const preferred = preferredCode ? templates.find(t => templateCode(t) === baseCode(preferredCode)) : null;
    if (preferred && canUsePosition(staff, preferred, date)) return preferred;
    return templates.find(t => canUsePosition(staff, t, date)) || templates[0] || null;
  }
  function makeRow(date, staffId, tpl){
    if (!tpl) return null;
    return {
      work_date: date,
      position_code: tpl.code,
      zone: tpl.zone || 'รอตรวจสอบ',
      break_time: tpl.break_time || '-',
      main_rule: tpl.main_rule || '',
      job_desc: tpl.job_desc || '',
      staff_id: staffId,
      updated_by: safe(() => currentStaffId(), null)
    };
  }

  // Global logic used by build/render: only real outing with participants counts.
  window.cnmiPositionHasRealOuting = hasRealOuting;
  window.cnmiPositionRealOutingParticipants = realOutingParticipantIds;
  if (typeof hasOuting === 'function') {
    window.hasOuting = hasOuting = function(date){ return hasRealOuting(date); };
  }
  if (typeof outingParticipants === 'function') {
    window.outingParticipants = outingParticipants = function(date){ return realOutingParticipantIds(date); };
  }
  if (typeof positionTemplateForDate === 'function') {
    window.positionTemplateForDate = positionTemplateForDate = function(date){
      if (safe(() => isNoPositionDay(date), false)) return [];
      // Default screen helper returns normal templates. Staff-specific outing is handled in build/render.
      return safe(() => DEFAULT_POSITIONS || [], []);
    };
  }
  if (typeof positionTemplateByCode === 'function') {
    window.positionTemplateByCode = positionTemplateByCode = function(code, date){
      const c = String(code || '').trim();
      if (/^OUTING:/.test(c)) return outingTemplateByCode(c);
      // Normal dates must prefer DEFAULT first so DR-* normal donor positions are not mistaken as outing.
      return defaultTemplateByCode(c) || outingTemplateByCode(c) || null;
    };
  }
  if (typeof makeMonthPositionRow === 'function') {
    window.makeMonthPositionRow = makeMonthPositionRow = function(date, staffId, code){
      const tpl = chooseTemplateForStaff(staffId, date, code) || defaultTemplateByCode(code) || outingTemplateByCode(code) || {};
      return {
        work_date: date,
        position_code: tpl.code || code,
        zone: tpl.zone || 'รอตรวจสอบ',
        break_time: tpl.break_time || '-',
        main_rule: tpl.main_rule || '',
        job_desc: tpl.job_desc || '',
        staff_id: staffId,
        updated_by: safe(() => currentStaffId(), null)
      };
    };
  }

  // Re-render cells: activities other than real outing do not create review cells.
  if (typeof renderMonthPositionCell === 'function') {
    window.renderMonthPositionCell = renderMonthPositionCell = function(staff, date, cellRows, canEdit=false){
      const noDay = safe(() => isNoPositionDay(date), false);
      const leave = isTrueLeaveOnV97(staff.id, date);
      const participantOuting = hasRealOuting(date) && isOutingParticipant(staff.id, date);
      if (noDay) return `<div class="no-position-cell">${safe(() => isHolidayDate(date), false) ? 'HOLIDAY' : 'WEEKEND'}</div>`;

      let rows = (cellRows || []).filter(r => {
        if (leave) return true;
        if (participantOuting) return true;
        return !isStrictOutingRow(r);
      });
      // Treat old bad rows as blank in UI, not as a scary รอตรวจสอบ caused by activities.
      if (rows.length && rows.every(isReviewRow)) rows = [];

      const row = rows[0] || null;
      const current = row?.position_code || '';
      const templates = templatesForStaffDate(staff.id, date);
      const cleanCodes = rows.map(r => safe(() => positionLabelForCell(r.position_code || r.code), r.position_code || r.code)).filter(Boolean);

      if (canEdit && !leave) {
        const options = [`<option value="">เลือกตำแหน่ง</option>`].concat(
          templates.map(t => `<option value="${esc(t.code)}" ${baseCode(current) === baseCode(t.code) ? 'selected' : ''}>${esc(safe(() => positionLabelForCell(t.code), t.code))}</option>`)
        ).join('');
        return `<div class="cnmi-v97-pos-cell ${participantOuting ? 'outing-cell' : ''}">
          <select class="month-position-select" onchange="applyMonthPositionEdit(this.value, '${esc(date)}|${esc(staff.id)}')">${options}</select>
          ${participantOuting ? '<div class="cell-note">ออกหน่วย</div>' : ''}
        </div>`;
      }
      const text = cleanCodes.length ? cleanCodes.join('<br>') : (leave ? 'ลา' : 'เลือกตำแหน่ง');
      return `<div class="cnmi-v97-pos-cell ${participantOuting ? 'outing-cell' : ''} ${leave ? 'leave-cell' : ''}">${text}${leave ? '<div class="cell-note">ไม่ต้องจัดตำแหน่ง</div>' : ''}${participantOuting && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : ''}</div>`;
    };
  }

  // Patch builder output: future generated monthly plans won't import false outing/review rows from generic activities.
  if (typeof buildMonthlyPositionDraft === 'function' && !buildMonthlyPositionDraft.__v97Patched) {
    const oldBuild = buildMonthlyPositionDraft;
    const patchedBuild = function(key){
      const draft = oldBuild.call(this, key);
      if (draft && Array.isArray(draft.rows)) {
        draft.rows = draft.rows.map(r => {
          if (!r?.work_date || !r?.staff_id) return r;
          if (safe(() => isNoPositionDay(r.work_date), false) || isTrueLeaveOnV97(r.staff_id, r.work_date)) return r;
          const participantOuting = hasRealOuting(r.work_date) && isOutingParticipant(r.staff_id, r.work_date);
          if (!participantOuting && (isStrictOutingRow(r) || isReviewRow(r))) {
            return makeRow(r.work_date, r.staff_id, chooseTemplateForStaff(r.staff_id, r.work_date, r.position_code)) || r;
          }
          return r;
        });
      }
      return draft;
    };
    patchedBuild.__v97Patched = true;
    window.buildMonthlyPositionDraft = buildMonthlyPositionDraft = patchedBuild;
  }

  function ensureDraft(){
    if (typeof ensureMonthPositionDraftForEdit === 'function') ensureMonthPositionDraftForEdit();
    const st = S();
    const key = st?.positionMonthKey || st?.monthKey || new Date().toISOString().slice(0,7);
    if (!st.monthPositionDraft || st.monthPositionDraft.monthKey !== key) {
      st.monthPositionDraft = { monthKey: key, rows: (st.positions || []).filter(r => String(r.work_date || '').startsWith(key)).map(r => ({...r})) };
    }
    return st.monthPositionDraft;
  }
  function repairCurrentDraft(){
    if (!safe(() => isAdmin(), false)) return safe(() => showToast('เฉพาะ Admin เท่านั้น'), null);
    const draft = ensureDraft();
    let fixed = 0;
    draft.rows = (draft.rows || []).map(r => {
      if (!r?.work_date || !r?.staff_id) return r;
      if (safe(() => isNoPositionDay(r.work_date), false) || isTrueLeaveOnV97(r.staff_id, r.work_date)) return r;
      const participantOuting = hasRealOuting(r.work_date) && isOutingParticipant(r.staff_id, r.work_date);
      const bad = (!participantOuting && isStrictOutingRow(r)) || isReviewRow(r);
      if (!bad) return r;
      const tpl = chooseTemplateForStaff(r.staff_id, r.work_date, r.position_code);
      const nr = makeRow(r.work_date, r.staff_id, tpl);
      if (nr) { fixed += 1; return nr; }
      return r;
    });
    safe(() => renderPage(), null);
    safe(() => showToast(fixed ? `ซ่อมช่องรอตรวจสอบ/ออกหน่วยผิดวัน ${fixed} ช่องแล้ว กดบันทึกแผนทั้งเดือนเพื่อบันทึกจริง` : 'ไม่พบช่องที่ต้องซ่อมในร่างนี้'), null);
  }

  function injectButton(){
    if (!safe(() => isAdmin(), false)) return;
    if (safe(() => state.page, '') !== 'positionMonth') return;
    if (document.querySelector('[data-v97-repair-position]')) return;
    const host = document.querySelector('.toolbar, .position-month-toolbar, .card .toolbar') || document.querySelector('.card');
    if (!host) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost-btn';
    btn.setAttribute('data-v97-repair-position', '1');
    btn.textContent = 'ซ่อมรอตรวจสอบ';
    host.appendChild(btn);
  }
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-v97-repair-position]');
    if (!btn) return;
    e.preventDefault();
    repairCurrentDraft();
  }, true);

  function injectStyle(){
    if (document.getElementById('cnmi-v97-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v97-style';
    style.textContent = `
      [data-v97-repair-position]{ margin-left:8px; }
      .cnmi-v97-pos-cell .month-position-select{ max-width:100%; }
      .cnmi-v97-pos-cell .cell-note{ font-size:11px; opacity:.72; margin-top:3px; font-weight:700; }
      .cnmi-v97-pos-cell.outing-cell{ background:#fff5f7; border-radius:10px; padding:3px; }
      .cnmi-v97-pos-cell.leave-cell{ background:#fff8d9; border-radius:10px; padding:3px; }
    `;
    document.head.appendChild(style);
  }

  const oldRenderPage = safe(() => renderPage, null);
  if (typeof oldRenderPage === 'function' && !oldRenderPage.__v97PositionActivityPatched) {
    const patchedRender = function(){
      const out = oldRenderPage.apply(this, arguments);
      injectStyle();
      setTimeout(injectButton, 0);
      return out;
    };
    patchedRender.__v97PositionActivityPatched = true;
    window.renderPage = renderPage = patchedRender;
  }
  document.addEventListener('DOMContentLoaded', () => { injectStyle(); setTimeout(injectButton, 100); });
  setTimeout(() => { injectStyle(); injectButton(); }, 500);
  console.log('[CNMI]', PATCH, 'loaded');
})();
