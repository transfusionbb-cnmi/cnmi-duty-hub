/* CNMI Duty Hub v100
   Clean patch-only:
   1) Monthly position plan uses daily position rights as source of truth.
      - true leave only blocks positions
      - no-duty / general activities do not block positions
      - outing applies only to staff listed as participants in outing events, and uses OUTING_POSITIONS only
   2) Roster / preset: every Thursday from 2026-07-01 onward, ชบด3 requires MT (same as Sunday rule requested).
      June 2026 and earlier remain unchanged.
*/
(function(){
  'use strict';
  const PATCH = 'v100-position-rights-thursday-chbd3-mt';
  const THURSDAY_MT_START = '2026-07-01';

  function S(){ try { return typeof state !== 'undefined' ? state : null; } catch(e){ return null; } }
  function safe(fn, fallback){ try { return fn(); } catch(e){ console.warn('[CNMI]', PATCH, e); return fallback; } }
  function pad2(n){ return String(n).padStart(2, '0'); }
  function esc(v){
    return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])));
  }
  function parseD(date){ return safe(() => parseDate(date), new Date(String(date || '').slice(0,10) + 'T00:00:00')); }
  function dateIn(date, row){
    return safe(() => dateInRange(date, row.start_date, row.end_date), String(row?.start_date || '') <= date && String(row?.end_date || '') >= date);
  }
  function monthRangeLocal(key){
    return safe(() => getMonthRange(key), (() => {
      const [y, m] = String(key || '').split('-').map(Number);
      const last = new Date(y, m, 0).getDate();
      return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(last)}` };
    })());
  }
  function staffById(id){ return (S()?.staff || []).find(s => String(s.id) === String(id)) || null; }
  function ordered(list){ return safe(() => orderedStaff(list), [...(list || [])].sort((a,b) => String(a.nickname||a.full_name||'').localeCompare(String(b.nickname||b.full_name||''), 'th'))); }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function toast(msg){ return safe(() => showToast(msg), console.log(msg)); }
  function render(){ return safe(() => renderPage(), null); }
  function currentStaff(){ return safe(() => currentStaffId(), null); }

  function arr(v){
    if (Array.isArray(v)) return v.map(x => String(x)).filter(Boolean);
    if (v == null || v === '') return [];
    if (typeof v === 'string') {
      const s = v.trim();
      if (!s || s === '[]') return [];
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(x => String(x)).filter(Boolean);
      } catch(e) {}
      return s.split(/[;,|\n]+/).map(x => x.trim()).filter(Boolean);
    }
    return [];
  }

  // ---------- Roster: Thursday ชบด3 = MT from July 2026 onward ----------
  function isThursdayMtDate(date){
    const d = String(date || '').slice(0,10);
    if (d < THURSDAY_MT_START) return false;
    return parseD(d).getDay() === 4;
  }
  function normalizeDutyRole(code, role, date){
    const c = String(code || '');
    if (c === 'ชบด3' && isThursdayMtDate(date)) return 'MT';
    return role;
  }
  function normalizeRosterSlot(slot){
    if (!slot) return slot;
    if (String(slot.duty_code || '') === 'ชบด3' && isThursdayMtDate(slot.duty_date)) {
      slot.required_role = 'MT';
    }
    return slot;
  }
  function normalizeRosterRows(rows){
    if (!Array.isArray(rows)) return rows;
    rows.forEach(normalizeRosterSlot);
    return rows;
  }
  function normalizeRosterState(){
    try {
      const st = S();
      if (!st) return;
      normalizeRosterRows(st.rosterAssignments);
      if (st.rosterDraft && Array.isArray(st.rosterDraft.assignments)) normalizeRosterRows(st.rosterDraft.assignments);
    } catch(err) { console.warn('[CNMI]', PATCH, 'normalizeRosterState', err); }
  }

  try {
    const previousDutyRuleForDate = typeof dutyRuleForDate === 'function' ? dutyRuleForDate : null;
    window.dutyRuleForDate = dutyRuleForDate = function(date){
      const rules = previousDutyRuleForDate ? (previousDutyRuleForDate(date) || []) : [];
      return rules.map(r => ({ ...r, role: normalizeDutyRole(r.code, r.role, date) }));
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'dutyRuleForDate patch failed', err); }

  try {
    const previousGenerateEmptyAssignments = typeof generateEmptyAssignments === 'function' ? generateEmptyAssignments : null;
    if (previousGenerateEmptyAssignments) {
      window.generateEmptyAssignments = generateEmptyAssignments = function(key){
        const rows = previousGenerateEmptyAssignments.apply(this, arguments) || [];
        return normalizeRosterRows(rows);
      };
    }
  } catch(err) { console.warn('[CNMI]', PATCH, 'generateEmptyAssignments patch failed', err); }

  try {
    const previousCanStaffWorkSlot = typeof canStaffWorkSlot === 'function' ? canStaffWorkSlot : null;
    if (previousCanStaffWorkSlot) {
      window.canStaffWorkSlot = canStaffWorkSlot = function(staffId, slot, assignments){
        const normalizedSlot = normalizeRosterSlot({ ...(slot || {}) });
        return previousCanStaffWorkSlot.call(this, staffId, normalizedSlot, assignments);
      };
    }
  } catch(err) { console.warn('[CNMI]', PATCH, 'canStaffWorkSlot patch failed', err); }

  // ---------- Monthly positions: source of truth = daily position rights ----------
  function isTrueLeaveType(type){
    const t = String(type || '').trim();
    return t.startsWith('ลา') && t !== 'ไม่รับเวร';
  }
  function trueLeaveOn(staffId, date){
    return !!(S()?.leaves || []).some(l => String(l.staff_id) === String(staffId) && l.status !== 'cancelled' && isTrueLeaveType(l.type) && dateIn(date, l));
  }
  function outingEventsOn(date){
    return (S()?.activities || []).filter(a => {
      const type = String(a.event_type || a.type || '').trim();
      if (type !== 'ออกหน่วย') return false;
      if (!dateIn(date, a)) return false;
      return arr(a.participant_ids).length > 0;
    });
  }
  function outingParticipantIds(date){
    const ids = new Set();
    outingEventsOn(date).forEach(a => arr(a.participant_ids).forEach(id => ids.add(String(id))));
    return [...ids];
  }
  function isOutingParticipant(staffId, date){ return outingParticipantIds(date).includes(String(staffId)); }
  function templateCode(t){ return String(t?.code || t?.position_code || '').trim(); }
  function baseCode(code){
    return safe(() => positionBaseCode(code), String(code || '').replace(/^OUTING:/,'').replace(/\s+#\d+$/,'').trim());
  }
  function defaultTemplates(){ return safe(() => DEFAULT_POSITIONS || [], []); }
  function outingTemplates(){ return safe(() => OUTING_POSITIONS || [], []); }
  function isNoPosition(date){ return !!safe(() => isNoPositionDay(date), false); }
  function posLabel(code){ return safe(() => positionLabelForCell(code), String(code || '')); }
  function staffCanDaily(staff){ return !!safe(() => isDailyPositionEnabled(staff), !!staff?.is_active); }
  function ruleOk(staff, tpl){ return !!safe(() => positionRuleOk(staff, tpl?.main_rule), true); }
  function eligible(staff, tpl){
    const key = tpl?.eligibility_code || tpl?.code || tpl?.position_code;
    return !!safe(() => positionEligible(staff, key), true);
  }
  function canUseTemplate(staff, tpl, date){
    if (!staff || !tpl) return false;
    if (!staffCanDaily(staff)) return false;
    if (trueLeaveOn(staff.id, date)) return false;
    return ruleOk(staff, tpl) && eligible(staff, tpl);
  }
  function templatesFor(staffId, date){
    if (isNoPosition(date)) return [];
    if (trueLeaveOn(staffId, date)) return [];
    return isOutingParticipant(staffId, date) ? outingTemplates() : defaultTemplates();
  }
  function findTemplateByCode(list, code){
    const b = baseCode(code);
    return (list || []).find(t => baseCode(templateCode(t)) === b || baseCode(t?.eligibility_code) === b) || null;
  }
  function chooseTemplate(staffId, date, preferredCode){
    const staff = staffById(staffId);
    const list = templatesFor(staffId, date);
    if (!staff || !list.length) return null;
    const preferred = preferredCode ? findTemplateByCode(list, preferredCode) : null;
    if (preferred && canUseTemplate(staff, preferred, date)) return preferred;
    return list.find(t => canUseTemplate(staff, t, date)) || null;
  }
  function makeRow(date, staffId, tpl){
    if (!tpl) return null;
    return {
      work_date: date,
      staff_id: staffId,
      position_code: tpl.code || tpl.position_code,
      zone: tpl.zone || '',
      break_time: tpl.break_time || '-',
      main_rule: tpl.main_rule || '',
      job_desc: tpl.job_desc || '',
      updated_by: currentStaff()
    };
  }
  function isReviewRow(row){
    const txt = `${row?.position_code || ''} ${row?.code || ''} ${row?.zone || ''} ${row?.job_desc || ''}`;
    return /รอตรวจสอบ|ไม่พบตำแหน่ง/.test(txt);
  }
  function isOutingRow(row){
    const code = String(row?.position_code || row?.code || '');
    const eligibility = String(row?.eligibility_code || '');
    const zone = String(row?.zone || '');
    if (code.startsWith('OUTING:') || eligibility.startsWith('OUTING:')) return true;
    return zone.includes('ออกหน่วย');
  }
  function rowLooksUsableFor(staffId, date, row){
    if (!row || isReviewRow(row)) return false;
    const staff = staffById(staffId);
    const list = templatesFor(staffId, date);
    const tpl = findTemplateByCode(list, row.position_code || row.code);
    if (!tpl || !staff) return false;
    return canUseTemplate(staff, tpl, date);
  }

  window.cnmiV100IsOutingParticipant = isOutingParticipant;
  window.cnmiV100PositionTemplatesFor = templatesFor;

  try {
    window.positionCandidateOk = positionCandidateOk = function(staff, positionRow, date){
      if (!staff || !positionRow) return false;
      const d = date || safe(() => todayStr(), new Date().toISOString().slice(0,10));
      return canUseTemplate(staff, positionRow, d);
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'positionCandidateOk patch failed', err); }

  try {
    window.dailyWorkingStaff = dailyWorkingStaff = function(date){
      return ordered((S()?.staff || []).filter(st => staffCanDaily(st) && !trueLeaveOn(st.id, date)));
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'dailyWorkingStaff patch failed', err); }

  try {
    window.positionTemplateForDate = positionTemplateForDate = function(date){
      // generic helper: default templates. Staff-specific outing is handled per staff/date in this patch.
      return isNoPosition(date) ? [] : defaultTemplates();
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'positionTemplateForDate patch failed', err); }

  try {
    window.positionTemplateByCode = positionTemplateByCode = function(code, date, staffId){
      if (staffId) return findTemplateByCode(templatesFor(staffId, date), code);
      return findTemplateByCode(defaultTemplates(), code) || findTemplateByCode(outingTemplates(), code) || null;
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'positionTemplateByCode patch failed', err); }

  try {
    window.makeMonthPositionRow = makeMonthPositionRow = function(date, staffId, code){
      const tpl = chooseTemplate(staffId, date, code);
      return makeRow(date, staffId, tpl || findTemplateByCode(defaultTemplates(), code) || findTemplateByCode(outingTemplates(), code) || { code });
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'makeMonthPositionRow patch failed', err); }

  try {
    const previousBuild = typeof buildMonthlyPositionDraft === 'function' ? buildMonthlyPositionDraft : null;
    if (previousBuild) {
      window.buildMonthlyPositionDraft = buildMonthlyPositionDraft = function(key){
        const draft = previousBuild.call(this, key);
        if (!draft || !Array.isArray(draft.rows)) return draft;
        const existing = draft.rows || [];
        const byStaffDate = new Map();
        existing.forEach(r => {
          const k = `${r.work_date}|${r.staff_id}`;
          if (!byStaffDate.has(k)) byStaffDate.set(k, []);
          byStaffDate.get(k).push(r);
        });
        const { y, m } = monthRangeLocal(key || S()?.positionMonthKey || S()?.monthKey);
        const last = new Date(y, m, 0).getDate();
        const newRows = [];
        const active = (S()?.staff || []).filter(staffCanDaily);
        for (let day = 1; day <= last; day++) {
          const date = `${y}-${pad2(m)}-${pad2(day)}`;
          if (isNoPosition(date)) continue;
          active.forEach(st => {
            if (trueLeaveOn(st.id, date)) return;
            const rows = byStaffDate.get(`${date}|${st.id}`) || [];
            const usable = rows.find(r => rowLooksUsableFor(st.id, date, r));
            if (usable) {
              const tpl = findTemplateByCode(templatesFor(st.id, date), usable.position_code || usable.code);
              const row = makeRow(date, st.id, tpl);
              if (row) newRows.push(row);
              return;
            }
            const tpl = chooseTemplate(st.id, date, rows[0]?.position_code || rows[0]?.code);
            const row = makeRow(date, st.id, tpl);
            if (row) newRows.push(row);
          });
        }
        draft.rows = newRows;
        return draft;
      };
    }
  } catch(err) { console.warn('[CNMI]', PATCH, 'buildMonthlyPositionDraft patch failed', err); }

  try {
    window.renderMonthPositionCell = renderMonthPositionCell = function(staff, date, cellRows, canEdit=false){
      if (isNoPosition(date)) return `<div class="no-position-cell">${safe(() => isHolidayDate(date), false) ? 'HOLIDAY' : 'WEEKEND'}</div>`;
      if (trueLeaveOn(staff.id, date)) return `<div class="leave-cell">ลา<div class="cell-note">ไม่ต้องจัดตำแหน่ง</div></div>`;
      const isOut = isOutingParticipant(staff.id, date);
      const list = templatesFor(staff.id, date);
      let rows = (cellRows || []).filter(r => rowLooksUsableFor(staff.id, date, r));
      const row = rows[0] || null;
      const current = row?.position_code || row?.code || '';
      if (canEdit) {
        const options = [`<option value="">เลือกตำแหน่ง</option>`].concat(list.map(t => {
          const code = templateCode(t);
          const selected = baseCode(current) === baseCode(code) ? 'selected' : '';
          return `<option value="${esc(code)}" ${selected}>${esc(posLabel(code))}</option>`;
        })).join('');
        return `<div class="cnmi-v100-pos-cell ${isOut ? 'outing-cell' : ''}">
          <select class="month-position-select" onchange="applyMonthPositionEdit(this.value, '${esc(date)}|${esc(staff.id)}')">${options}</select>
          ${isOut ? '<div class="cell-note">ออกหน่วย</div>' : ''}
        </div>`;
      }
      const label = current ? esc(posLabel(current)) : '<span class="muted">เลือกตำแหน่ง</span>';
      return `<div class="cnmi-v100-pos-cell ${isOut ? 'outing-cell' : ''}">${label}${isOut ? '<div class="cell-note">ออกหน่วย</div>' : ''}</div>`;
    };
  } catch(err) { console.warn('[CNMI]', PATCH, 'renderMonthPositionCell patch failed', err); }

  function injectStyle(){
    if (document.getElementById('cnmi-v100-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v100-style';
    style.textContent = `
      .cnmi-v100-pos-cell.outing-cell, .outing-cell { background: #fff0f4; border-radius: 12px; padding: 5px; }
      .cnmi-v100-pos-cell .cell-note, .cell-note { font-size: 11px; color: #6b7280; margin-top: 3px; font-weight: 600; }
      .leave-cell { background:#fff7d8; border-radius:12px; padding:6px; font-weight:700; color:#795b00; }
      .no-position-cell { color:#4b5563; font-weight:700; }
    `;
    document.head.appendChild(style);
  }

  try {
    const previousLoadAllData = typeof loadAllData === 'function' ? loadAllData : null;
    if (previousLoadAllData && !previousLoadAllData.__v100Patch) {
      const patchedLoad = async function(...args){
        const result = await previousLoadAllData.apply(this, args);
        normalizeRosterState();
        return result;
      };
      patchedLoad.__v100Patch = true;
      window.loadAllData = loadAllData = patchedLoad;
    }
  } catch(err) { console.warn('[CNMI]', PATCH, 'loadAllData patch failed', err); }

  try {
    const previousRenderPage = typeof renderPage === 'function' ? renderPage : null;
    if (previousRenderPage && !previousRenderPage.__v100Patch) {
      const patchedRender = function(...args){
        normalizeRosterState();
        injectStyle();
        return previousRenderPage.apply(this, args);
      };
      patchedRender.__v100Patch = true;
      window.renderPage = renderPage = patchedRender;
    }
  } catch(err) { console.warn('[CNMI]', PATCH, 'renderPage patch failed', err); }

  normalizeRosterState();
  injectStyle();
  console.info('[CNMI]', PATCH, 'loaded');
})();
