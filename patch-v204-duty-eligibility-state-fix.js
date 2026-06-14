/* V204: Duty Eligibility State Isolation + Supabase Re-fetch
   Fixes stale checkbox state on “สิทธิ์เวรตามวัน”.
   - Every selected staff loads DUTY_RULE rows directly from Supabase before enabling the matrix.
   - Save reads only the currently selected staff form, not every checkbox on the document.
   - After save, the page re-fetches the same staff from Supabase and updates state.positionEligibility.
   - Async request token prevents old staff fetch results from overwriting the newest selection. */
(function(){
  'use strict';
  if (window.__CNMI_V204_DUTY_ELIGIBILITY_STATE_FIX__) return;
  window.__CNMI_V204_DUTY_ELIGIBILITY_STATE_FIX__ = true;

  const VERSION = 'V204_DUTY_ELIGIBILITY_STATE_FIX';
  const DUTY_RULE_PREFIX = 'DUTY_RULE:';
  const CODES = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง','ช4-MT/แตง 1','ช4-MT/แตง 2'];
  const WEEKDAYS = [
    { key:'mon', label:'จันทร์' },
    { key:'tue', label:'อังคาร' },
    { key:'wed', label:'พุธ' },
    { key:'thu', label:'พฤหัสบดี' },
    { key:'fri', label:'ศุกร์' },
    { key:'sat', label:'เสาร์' },
    { key:'sun', label:'อาทิตย์' }
  ];

  const esc = (v) => {
    try { return typeof escapeHtml === 'function' ? escapeHtml(v == null ? '' : String(v)) : String(v == null ? '' : v).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch])); }
    catch (_) { return String(v == null ? '' : v); }
  };
  const $id = (id) => document.getElementById(id);
  const toast = (msg, tone) => { try { if (typeof showToast === 'function') showToast(msg, tone ? { tone } : undefined); else console.info(msg); } catch(_) {} };
  const friendly = (err) => { try { return typeof friendlyDbError === 'function' ? friendlyDbError(err) : (err?.message || String(err || 'เกิดข้อผิดพลาด')); } catch(_) { return err?.message || String(err || 'เกิดข้อผิดพลาด'); } };
  const currentActor = () => { try { return typeof currentStaffId === 'function' ? currentStaffId() : (state?.profile?.id || null); } catch(_) { return null; } };
  const colorOf = (s) => { try { return staffColor(s); } catch(_) { return s?.staff_color || s?.color || '#dbeafe'; } };
  const fgOf = (bg) => { try { return typeof textColorFor === 'function' ? textColorFor(bg) : '#0f172a'; } catch(_) { return '#0f172a'; } };
  const staffPillSafe = (s) => { try { return typeof staffPill === 'function' ? staffPill(s) : esc(s?.nickname || s?.full_name || '-'); } catch(_) { return esc(s?.nickname || s?.full_name || '-'); } };
  const noPerm = () => { try { return typeof noPermission === 'function' ? noPermission() : '<div class="card">ไม่มีสิทธิ์ใช้งานหน้านี้</div>'; } catch(_) { return '<div class="card">ไม่มีสิทธิ์ใช้งานหน้านี้</div>'; } };
  const isAdminSafe = () => { try { return typeof isAdmin === 'function' ? isAdmin() : false; } catch(_) { return false; } };
  const orderedRosterStaff = () => {
    const rows = (state.staff || []).filter(s => {
      try { return typeof isRosterEnabled === 'function' ? isRosterEnabled(s) : s?.is_active !== false && s?.staff_type !== 'แพทย์'; }
      catch (_) { return s?.is_active !== false; }
    });
    try { return typeof orderedStaff === 'function' ? orderedStaff(rows) : rows; } catch(_) { return rows; }
  };

  function normalizeDuty(code='') {
    const c = String(code || '').trim();
    if (['ช4','ช4A','ช4-MT/แตง','ช4-MT/แตง1','ช4-MT/แตง-1','ช4-1','ช4-MT/แตง 1'].includes(c)) return 'ช4-MT/แตง 1';
    if (['ช4B','ช4-MT/แตง2','ช4-MT/แตง-2','ช4-2','ช4-MT/แตง 2'].includes(c)) return 'ช4-MT/แตง 2';
    if (c === 'ช9-MT' || c === 'ช9' || c === 'ช9-MT/แตง') return 'ช9-MT/แตง';
    return c;
  }
  function eligCode(day, duty) { return `${DUTY_RULE_PREFIX}${day}:${normalizeDuty(duty)}`; }
  function defaultCodesForDayKey(k) {
    if (k === 'sat' || k === 'sun') return ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT/แตง'];
    return ['ชบด1','ชบด2','ชบด3','ช4-MT/แตง 1','ช4-MT/แตง 2'];
  }
  function isDutyRow(row) { return String(row?.position_code || '').startsWith(DUTY_RULE_PREFIX); }
  function truthy(v) { return v === true || String(v).toLowerCase() === 'true' || String(v) === '1'; }
  function selectedStaffId() {
    const staff = orderedRosterStaff();
    if (!staff.length) return '';
    if (!state.dutyEligibilityStaffId || !staff.some(s => String(s.id) === String(state.dutyEligibilityStaffId))) state.dutyEligibilityStaffId = staff[0].id;
    return String(state.dutyEligibilityStaffId || staff[0].id || '');
  }

  function replaceDutyRowsForStaff(staffId, rows) {
    const sid = String(staffId || '');
    state.positionEligibility = (state.positionEligibility || [])
      .filter(r => !(String(r?.staff_id) === sid && isDutyRow(r)))
      .concat((rows || []).map(r => ({ ...r, staff_id: r.staff_id || sid })));
  }

  function dutyRowsForStaff(staffId) {
    const sid = String(staffId || '');
    return (state.positionEligibility || []).filter(r => String(r?.staff_id) === sid && isDutyRow(r));
  }

  function recordMapForStaff(staffId) {
    const draft = state.__dutyEligibilityDraftV204;
    if (draft?.staffId && String(draft.staffId) === String(staffId) && draft.dirty && draft.map) return draft.map;
    const map = new Map();
    dutyRowsForStaff(staffId).forEach(r => map.set(String(r.position_code), truthy(r.is_eligible)));
    return map;
  }

  function hasLoadedStaff(staffId) {
    return String(state.__dutyEligibilityLoadedStaffV204 || '') === String(staffId) && !state.__dutyEligibilityLoadingStaffV204;
  }

  async function loadDutyRowsForStaffV204(staffId, options={}) {
    const sid = String(staffId || '');
    if (!sid || !sb) return false;
    const seq = (state.__dutyEligibilityLoadSeqV204 || 0) + 1;
    state.__dutyEligibilityLoadSeqV204 = seq;
    state.__dutyEligibilityLoadingStaffV204 = sid;
    if (options.renderLoading !== false) renderPageSafe();
    try {
      const res = await sb.from('daily_position_eligibility')
        .select('*')
        .eq('staff_id', sid)
        .like('position_code', `${DUTY_RULE_PREFIX}%`)
        .order('position_code', { ascending:true });
      if (res.error) throw res.error;
      if (state.__dutyEligibilityLoadSeqV204 !== seq) return false;
      replaceDutyRowsForStaff(sid, res.data || []);
      state.__dutyEligibilityLoadedStaffV204 = sid;
      state.__dutyEligibilityLoadingStaffV204 = '';
      if (state.__dutyEligibilityDraftV204?.staffId && String(state.__dutyEligibilityDraftV204.staffId) === sid) state.__dutyEligibilityDraftV204 = null;
      return true;
    } catch (err) {
      if (state.__dutyEligibilityLoadSeqV204 === seq) {
        state.__dutyEligibilityLoadingStaffV204 = '';
        state.__dutyEligibilityLoadErrorV204 = friendly(err);
      }
      toast('โหลดสิทธิ์เวรจาก Supabase ไม่สำเร็จ: ' + friendly(err), 'error');
      return false;
    } finally {
      if (state.__dutyEligibilityLoadSeqV204 === seq && options.renderAfter !== false) renderPageSafe();
    }
  }

  function readFormRowsV204(form) {
    const staffId = form?.dataset?.staffId || selectedStaffId();
    const checks = Array.from(form?.querySelectorAll?.('[data-duty-eligibility-v204]') || []);
    return checks.map(cb => ({
      staff_id: staffId,
      position_code: eligCode(cb.dataset.dayKey, cb.dataset.dutyCode),
      is_eligible: !!cb.checked,
      updated_by: currentActor()
    }));
  }

  function captureDraftFromFormV204(form) {
    const rows = readFormRowsV204(form);
    if (!rows.length) return;
    state.__dutyEligibilityDraftV204 = {
      staffId: rows[0].staff_id,
      dirty: true,
      map: new Map(rows.map(r => [String(r.position_code), !!r.is_eligible]))
    };
  }

  async function saveDutyEligibilityV204(form) {
    if (!isAdminSafe()) return toast('เฉพาะ Admin เท่านั้น', 'error');
    const staffId = String(form?.dataset?.staffId || selectedStaffId());
    if (!staffId) return toast('ไม่พบเจ้าหน้าที่ที่เลือก', 'error');
    const rows = readFormRowsV204(form);
    if (!rows.length) return toast('ไม่มีข้อมูลสิทธิ์เวรให้บันทึก', 'error');

    const btn = form?.querySelector?.('[data-save-duty-eligibility-v204]');
    if (btn) { btn.disabled = true; btn.textContent = 'กำลังบันทึก...'; }
    try {
      const res = await sb.from('daily_position_eligibility').upsert(rows, { onConflict:'staff_id,position_code' });
      if (res.error) throw res.error;
      state.rosterDraft = null;
      state.__dutyEligibilityDraftV204 = null;

      const verify = await sb.from('daily_position_eligibility')
        .select('*')
        .eq('staff_id', staffId)
        .like('position_code', `${DUTY_RULE_PREFIX}%`)
        .order('position_code', { ascending:true });
      if (verify.error) throw verify.error;
      replaceDutyRowsForStaff(staffId, verify.data || rows);
      state.__dutyEligibilityLoadedStaffV204 = staffId;
      state.__dutyEligibilityLoadingStaffV204 = '';

      try { if (typeof window.refreshDutyEligibilityFromDbV197 === 'function') await window.refreshDutyEligibilityFromDbV197({ clearDraft:true, toast:false }); } catch(_) {}
      state.dutyEligibilityStaffId = staffId;
      renderPageSafe();
      toast('บันทึกสิทธิ์เวรตามวันแล้ว และโหลดข้อมูลล่าสุดกลับมาตรวจซ้ำแล้ว');
    } catch (err) {
      toast('บันทึกสิทธิ์เวรไม่สำเร็จ: ' + friendly(err), 'error');
      renderPageSafe();
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'บันทึกสิทธิ์เวร'; }
    }
  }

  function renderDutyEligibilityPageV204() {
    if (!isAdminSafe()) return noPerm();
    const active = orderedRosterStaff();
    if (!active.length) return '<div class="card">ยังไม่มีเจ้าหน้าที่ที่เปิดสิทธิ์จัดเวร</div>';
    const staffId = selectedStaffId();
    const selected = active.find(s => String(s.id) === staffId) || active[0];
    const loading = String(state.__dutyEligibilityLoadingStaffV204 || '') === staffId;
    const loadError = state.__dutyEligibilityLoadErrorV204 || '';

    if (!hasLoadedStaff(staffId) && !loading && !loadError) {
      window.setTimeout(() => loadDutyRowsForStaffV204(staffId, { renderLoading:true, renderAfter:true }), 0);
    }

    const loaded = hasLoadedStaff(staffId);
    const rows = loaded ? dutyRowsForStaff(staffId) : [];
    const hasRows = rows.length > 0;
    const map = loaded ? recordMapForStaff(staffId) : new Map();
    const disabled = loading || !loaded;
    const dayRows = WEEKDAYS.map(w => `<tr><th>${esc(w.label)}</th>${CODES.map(code => {
      const key = eligCode(w.key, code);
      const checked = hasRows ? map.get(key) === true : defaultCodesForDayKey(w.key).includes(code);
      return `<td><label class="switch-check v204-duty-switch"><input type="checkbox" data-duty-eligibility-v204 data-day-key="${esc(w.key)}" data-duty-code="${esc(code)}" ${checked?'checked':''} ${disabled?'disabled':''}><span></span></label></td>`;
    }).join('')}</tr>`).join('');
    const bg = colorOf(selected);
    const fg = fgOf(bg);
    const syncText = loading
      ? '<div class="notice soft-notice v204-duty-sync">กำลังโหลดสิทธิ์เวรของเจ้าหน้าที่คนนี้จาก Supabase...</div>'
      : loadError
        ? `<div class="notice error-notice v204-duty-sync">โหลดข้อมูลล่าสุดไม่สำเร็จ: ${esc(loadError)}</div>`
        : !loaded
          ? '<div class="notice soft-notice v204-duty-sync">กำลังเตรียมโหลดข้อมูลล่าสุดจาก Supabase...</div>'
          : `<div class="notice soft-notice v204-duty-sync">โหลดข้อมูลของ <b>${esc(selected.nickname || selected.full_name)}</b> แยกจาก Supabase แล้ว ${hasRows ? `พบ ${rows.length} รายการ` : 'ยังไม่เคยบันทึก ใช้ค่าเริ่มต้นชั่วคราว'}</div>`;

    return `<div class="grid duty-eligibility-page-v137 duty-eligibility-page-v204">
      <div class="card eligibility-staff-panel">
        <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
        <label>เจ้าหน้าที่ <select id="dutyEligibilityStaffSelectV204">${active.map(s => `<option value="${esc(s.id)}" ${String(selected.id)===String(s.id)?'selected':''}>${esc(s.nickname || s.full_name)} (${esc(s.staff_type || '-')})</option>`).join('')}</select></label>
        <div class="selected-staff-card" style="background:${esc(bg)};color:${esc(fg)}"><b>${esc(selected.nickname || selected.full_name)}</b><span>${esc(selected.full_name || '')}</span></div>
        <div class="notice soft-notice compact">หน้านี้ใช้กับเวรเท่านั้น และจะโหลดข้อมูลใหม่ทุกครั้งเมื่อเปลี่ยนชื่อ</div>
        <button class="ghost-btn full-btn" type="button" data-refresh-duty-eligibility-v204 ${loading?'disabled':''}>โหลดข้อมูลคนนี้ใหม่</button>
      </div>
      <div class="card duty-eligibility-matrix-card">
        <form id="dutyEligibilityFormV204" data-staff-id="${esc(staffId)}">
          <div class="section-title"><div><h3>สิทธิ์เวรตามวันของ ${esc(selected.nickname || selected.full_name)}</h3><p class="hint">ช4-MT/แตง มี 2 ตำแหน่งต่อวัน จึงมี 2 ช่องให้ติ๊กแยกกัน</p></div><button class="primary-btn" type="submit" data-save-duty-eligibility-v204 ${disabled?'disabled':''}>บันทึกสิทธิ์เวร</button></div>
          ${syncText}
          ${!hasRows && loaded ? '<div class="notice soft-notice">ยังไม่เคยตั้งสิทธิ์เวรของคนนี้ ระบบแสดงค่าเริ่มต้นให้ก่อน กดบันทึกเพื่อเริ่มใช้ตารางนี้</div>' : ''}
          <div class="table-wrap duty-eligibility-wrap"><table class="duty-eligibility-table v137-duty-table v204-duty-table"><thead><tr><th>วัน</th>${CODES.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${dayRows}</tbody></table></div>
        </form>
      </div>
    </div>`;
  }

  function renderPageSafe() { try { if (typeof renderPage === 'function') renderPage(); } catch(err) { console.warn(`${VERSION}: render skipped`, err); } }

  const prevRenderPage = window.renderPage || (typeof renderPage === 'function' ? renderPage : null);
  window.renderPage = renderPage = function renderPageV204() {
    if (state.page === 'dutyEligibilityV107') {
      const item = (window.NAV_ITEMS || NAV_ITEMS || []).find(x => x.id === 'dutyEligibilityV107') || {};
      const title = $id('pageTitle'); if (title) title.textContent = item.title || 'สิทธิ์เวรตามวัน';
      const subtitle = $id('pageSubtitle'); if (subtitle) subtitle.textContent = item.subtitle || 'กำหนดสิทธิ์เวรแยกรายวันและรายคน';
      try { if (typeof renderNav === 'function') renderNav(); } catch(_) {}
      const content = $id('pageContent'); if (content) content.innerHTML = renderDutyEligibilityPageV204();
      return;
    }
    return prevRenderPage ? prevRenderPage.apply(this, arguments) : undefined;
  };

  document.addEventListener('change', function(e){
    if (e.target?.id === 'dutyEligibilityStaffSelectV204') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      state.dutyEligibilityStaffId = e.target.value;
      state.__dutyEligibilityDraftV204 = null;
      state.__dutyEligibilityLoadedStaffV204 = '';
      state.__dutyEligibilityLoadErrorV204 = '';
      renderPageSafe();
      return;
    }
    if (e.target?.matches?.('[data-duty-eligibility-v204]')) {
      const form = e.target.closest('#dutyEligibilityFormV204');
      captureDraftFromFormV204(form);
    }
  }, true);

  document.addEventListener('submit', async function(e){
    if (e.target?.id === 'dutyEligibilityFormV204') {
      e.preventDefault();
      e.stopPropagation();
      if (typeof e.stopImmediatePropagation === 'function') e.stopImmediatePropagation();
      await saveDutyEligibilityV204(e.target);
    }
  }, true);

  document.addEventListener('click', async function(e){
    const btn = e.target?.closest?.('[data-refresh-duty-eligibility-v204]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    state.__dutyEligibilityDraftV204 = null;
    state.__dutyEligibilityLoadedStaffV204 = '';
    state.__dutyEligibilityLoadErrorV204 = '';
    await loadDutyRowsForStaffV204(selectedStaffId(), { renderLoading:true, renderAfter:true });
  }, true);

  const style = document.createElement('style');
  style.textContent = `
    .duty-eligibility-page-v204 .selected-staff-card{display:flex;flex-direction:column;gap:3px}
    .v204-duty-sync{margin:0 0 10px}
    .v204-duty-table input[disabled] + span{opacity:.45;cursor:not-allowed}
    .duty-eligibility-page-v204 .full-btn{width:100%;margin-top:10px}
  `;
  document.head.appendChild(style);

  console.info(`${VERSION} loaded`);
})();
