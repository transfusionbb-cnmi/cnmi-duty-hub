/* CNMI Duty Hub V90: Stable roster preset drag/drop
   Patch-only. Load after v89.
   Fixes:
   - In เมนูตั้งต้นเวร, dragging 1 staff into 1 slot will NOT trigger auto-fill/rebalance for the whole month.
   - Lock / clear / dropdown in ตั้งต้นเวร preserves scroll position instead of jumping to top.
*/
(function(){
  const PATCH = 'v90-roster-preset-dnd-stable';
  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function safe(fn, fallback){ try { return fn(); } catch(e) { console.warn('[CNMI]', PATCH, e); return fallback; } }
  function toast(msg){ return safe(() => showToast(msg), console.log(msg)); }
  function isPresetPage(){ return S()?.page === 'rosterPreset'; }
  function slotKey(slot){ return slot?.id || slot?._temp_id || ''; }
  function currentAssignments(){ return safe(() => getAssignmentsForMonth(S()?.monthKey), S()?.rosterDraft?.assignments || []); }
  function ensureDraftForCurrentMonth(){
    const st = S();
    if (!st) return [];
    if (!st.rosterDraft || st.rosterDraft.monthKey !== st.monthKey) {
      const existing = safe(() => getAssignmentsForMonth(st.monthKey), []);
      st.rosterDraft = {
        monthKey: st.monthKey,
        assignments: existing.length ? existing.map(a => ({...a})) : safe(() => generateEmptyAssignments(st.monthKey), [])
      };
    }
    return st.rosterDraft.assignments || [];
  }
  function findSlot(id){
    const list = ensureDraftForCurrentMonth();
    return list.find(x => String(slotKey(x)) === String(id));
  }
  function setSlot(id, patch){
    const slot = findSlot(id);
    if (slot) Object.assign(slot, patch);
    return slot;
  }
  function captureScroll(anchor){
    const wrap = anchor?.closest?.('.table-wrap') || document.querySelector('.roster-board .table-wrap');
    const pool = document.querySelector('.staff-pool');
    const sidebar = document.getElementById('sidebar');
    return {
      x: window.scrollX || 0,
      y: window.scrollY || 0,
      wrapLeft: wrap ? wrap.scrollLeft : 0,
      wrapTop: wrap ? wrap.scrollTop : 0,
      poolTop: pool ? pool.scrollTop : 0,
      sidebarTop: sidebar ? sidebar.scrollTop : 0
    };
  }
  function restoreScroll(snap){
    const apply = () => {
      window.scrollTo(snap.x || 0, snap.y || 0);
      const wrap = document.querySelector('.roster-board .table-wrap');
      if (wrap) { wrap.scrollLeft = snap.wrapLeft || 0; wrap.scrollTop = snap.wrapTop || 0; }
      const pool = document.querySelector('.staff-pool');
      if (pool) pool.scrollTop = snap.poolTop || 0;
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.scrollTop = snap.sidebarTop || 0;
    };
    requestAnimationFrame(() => { apply(); setTimeout(apply, 30); setTimeout(apply, 120); });
  }
  function renderKeep(anchor){
    const snap = captureScroll(anchor);
    safe(() => renderPage(), null);
    restoreScroll(snap);
  }
  function canPlace(staffId, slot){
    if (!staffId || !slot) return true;
    return safe(() => canStaffWorkSlot(staffId, slot, currentAssignments()), true);
  }
  function warnCannotPlace(staffId, slot){
    const adjacent = safe(() => hasAdjacentDuty(staffId, slot.duty_date, currentAssignments(), slot), false);
    if (adjacent) toast('คนนี้มี ชบด ติดกับ ชบด วันก่อน/วันถัดไป กรุณาเลือกคนอื่น');
    else toast('คนนี้ติดลา/ไม่รับเวร หรือประเภทไม่ตรงกับเวร');
  }

  // Safety net: the old app's drag/drop calls rebalanceRosterAfterManualChange().
  // In ตั้งต้นเวร, this must be disabled because preset means “put only the lottery/preset names”.
  const oldRebalance = safe(() => rebalanceRosterAfterManualChange, null);
  if (typeof oldRebalance === 'function' && !oldRebalance.__v90PresetGuard) {
    const guarded = function(changedSlotId){
      if (isPresetPage()) return; // never auto-fill the month in ตั้งต้นเวร
      return oldRebalance.apply(this, arguments);
    };
    guarded.__v90PresetGuard = true;
    window.rebalanceRosterAfterManualChange = rebalanceRosterAfterManualChange = guarded;
  }

  // Intercept drop before the app-level handler sees it.
  window.addEventListener('drop', function(e){
    if (!isPresetPage()) return;
    const host = e.target.closest && e.target.closest('[data-drop-slot]');
    if (!host) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    host.classList.remove('drag-over');
    const staffId = e.dataTransfer && e.dataTransfer.getData('staffId');
    const id = host.dataset.dropSlot;
    const slot = findSlot(id);
    if (!slot) return toast('ไม่พบช่องเวรนี้ กรุณารีเฟรชหน้า');
    if (slot.is_locked) return toast('ช่องนี้ล็อกอยู่');
    if (staffId && !canPlace(staffId, slot)) return warnCannotPlace(staffId, slot);
    setSlot(id, { staff_id: staffId || null });
    renderKeep(host);
  }, true);

  window.addEventListener('dragover', function(e){
    if (!isPresetPage()) return;
    const host = e.target.closest && e.target.closest('[data-drop-slot]');
    if (!host) return;
    e.preventDefault();
    host.classList.add('drag-over');
  }, true);

  window.addEventListener('dragleave', function(e){
    if (!isPresetPage()) return;
    const host = e.target.closest && e.target.closest('[data-drop-slot]');
    if (host) host.classList.remove('drag-over');
  }, true);

  // Intercept click actions that normally re-render and jump to top.
  window.addEventListener('click', function(e){
    if (!isPresetPage()) return;
    const t = e.target.closest && e.target.closest('[data-v89-lock-filled], [data-toggle-lock-slot], [data-clear-slot]');
    if (!t) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    if (t.hasAttribute('data-v89-lock-filled')) {
      const list = ensureDraftForCurrentMonth();
      let locked = 0;
      list.forEach(a => { if (a.staff_id) { a.is_locked = true; locked++; } });
      renderKeep(t);
      toast(locked ? `ล็อกช่องที่มีชื่อแล้ว ${locked} ช่อง` : 'ยังไม่มีช่องที่ใส่ชื่อไว้');
      return;
    }
    if (t.dataset.toggleLockSlot) {
      const slot = findSlot(t.dataset.toggleLockSlot);
      if (!slot) return toast('ไม่พบช่องเวรนี้');
      slot.is_locked = !slot.is_locked;
      renderKeep(t);
      return;
    }
    if (t.dataset.clearSlot) {
      const slot = findSlot(t.dataset.clearSlot);
      if (!slot) return toast('ไม่พบช่องเวรนี้');
      if (slot.is_locked) return toast('ช่องนี้ล็อกอยู่ กรุณาปลดล็อกก่อนล้าง');
      slot.staff_id = null;
      renderKeep(t);
      return;
    }
  }, true);

  // Intercept dropdown assignment in preset page so it also preserves scroll.
  window.addEventListener('change', function(e){
    if (!isPresetPage()) return;
    const sel = e.target.closest && e.target.closest('[data-roster-slot-select]');
    if (!sel) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    const id = sel.dataset.rosterSlotSelect;
    const slot = findSlot(id);
    const staffId = sel.value || null;
    if (!slot) return toast('ไม่พบช่องเวรนี้');
    if (slot.is_locked) { renderKeep(sel); return toast('ช่องนี้ล็อกอยู่'); }
    if (staffId && !canPlace(staffId, slot)) { renderKeep(sel); return warnCannotPlace(staffId, slot); }
    slot.staff_id = staffId;
    renderKeep(sel);
  }, true);

  // Make the preset page message explicit so users know it will not auto-fill.
  function injectStyle(){
    if (document.getElementById('cnmi-v90-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v90-style';
    style.textContent = `
      body .roster-slot.drag-over { outline: 3px solid rgba(128,202,255,.85); outline-offset: 2px; }
      body[data-page="rosterPreset"] .roster-slot { scroll-margin-top: 90px; }
    `;
    document.head.appendChild(style);
  }
  injectStyle();
  setTimeout(injectStyle, 500);
  console.log('[CNMI]', PATCH, 'loaded');
})();
