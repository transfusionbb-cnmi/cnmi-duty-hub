/* CNMI Duty Hub V93: Unlock all roster preset locks
   Patch-only. Load after v89/v90/v91/v92.
   Purpose:
   - Add a one-click "ปลดล็อกทั้งหมด" button on จัดตารางเวร.
   - Used after importing/setting preset lottery duties, when Admin wants to save and manage the roster from จัดตารางเวร instead.
   - Does not change staff names. It only changes is_locked=true -> false in the current draft.
*/
(function(){
  const PATCH = 'v93-unlock-all-roster';

  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function safe(fn, fallback){ try { return fn(); } catch(e) { console.warn('[CNMI]', PATCH, e); return fallback; } }
  function toast(msg){ return safe(() => showToast(msg), console.log(msg)); }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))); }

  function currentMonthKey(){ return S()?.monthKey || safe(() => todayStr().slice(0,7), ''); }

  function currentAssignmentsForMonth(key){
    return safe(() => getAssignmentsForMonth(key), []).map(a => ({ ...a }));
  }

  function emptyAssignmentsForMonth(key){
    return safe(() => generateEmptyAssignments(key), []);
  }

  function ensureDraft(useEmptyIfNoExisting=true){
    const st = S();
    if (!st) return [];
    const key = currentMonthKey();
    if (!st.rosterDraft || st.rosterDraft.monthKey !== key) {
      const existing = currentAssignmentsForMonth(key);
      const base = existing.length ? existing : (useEmptyIfNoExisting ? emptyAssignmentsForMonth(key) : []);
      st.rosterDraft = { monthKey: key, assignments: base };
    }
    return st.rosterDraft.assignments || [];
  }

  function captureScroll(anchor){
    const wrap = anchor?.closest?.('.table-wrap') || document.querySelector('.roster-board .table-wrap') || document.querySelector('.table-wrap');
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
      const wrap = document.querySelector('.roster-board .table-wrap') || document.querySelector('.table-wrap');
      if (wrap) { wrap.scrollLeft = snap.wrapLeft || 0; wrap.scrollTop = snap.wrapTop || 0; }
      const pool = document.querySelector('.staff-pool');
      if (pool) pool.scrollTop = snap.poolTop || 0;
      const sidebar = document.getElementById('sidebar');
      if (sidebar) sidebar.scrollTop = snap.sidebarTop || 0;
    };
    requestAnimationFrame(() => { apply(); setTimeout(apply, 40); setTimeout(apply, 140); });
  }

  function renderKeep(anchor){
    const snap = captureScroll(anchor);
    safe(() => renderPage(), null);
    restoreScroll(snap);
  }

  async function unlockAllRosterSlots(anchor){
    if (!isAdminX()) return toast('เฉพาะ Admin เท่านั้น');
    const assignments = ensureDraft(true);
    if (!assignments.length) return toast('ยังไม่มีตารางเวรเดือนนี้');

    const lockedCount = assignments.filter(a => !!a.is_locked).length;
    if (!lockedCount) return toast('ไม่มีช่องที่ล็อกอยู่');

    const ok = await safe(() => confirmDialog(
      `ปลดล็อกช่องเวรที่ล็อกไว้ทั้งหมด ${lockedCount} ช่องในเดือน ${esc(currentMonthKey())} หรือไม่?\n\nชื่อที่ใส่ไว้จะยังอยู่เหมือนเดิม แต่ Auto Assign สามารถปรับช่องเหล่านี้ได้หลังจากปลดล็อก`,
      'ยืนยันปลดล็อกทั้งหมด'
    ), Promise.resolve(true));
    if (!ok) return;

    assignments.forEach(a => { a.is_locked = false; });
    renderKeep(anchor);
    toast(`ปลดล็อกทั้งหมดแล้ว ${lockedCount} ช่อง • ถ้าต้องการบันทึกสถานะนี้ ให้กด “บันทึก”`);
  }

  function injectUnlockButton(){
    const st = S();
    if (!st || st.page !== 'scheduler') return;
    if (document.querySelector('[data-v93-unlock-all-roster]')) return;

    const rebalance = document.querySelector('[data-v89-rebalance-empty-month], [data-v91-rebalance-empty-month]');
    const fairness = document.querySelector('[data-show-fairness]');
    const save = document.querySelector('[data-save-roster]');
    const host = rebalance?.parentElement || save?.parentElement || fairness?.parentElement || document.querySelector('.toolbar') || document.querySelector('.section-title');
    if (!host) return;

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'ghost-btn tiny-btn';
    btn.dataset.v93UnlockAllRoster = '1';
    btn.textContent = 'ปลดล็อกทั้งหมด';
    btn.title = 'ปลดล็อกช่องที่ตั้งต้นไว้ทั้งหมด โดยไม่ลบชื่อที่ใส่ไว้';

    if (rebalance && rebalance.parentElement === host) host.insertBefore(btn, rebalance.nextSibling);
    else if (fairness && fairness.parentElement === host) host.insertBefore(btn, fairness);
    else host.appendChild(btn);
  }

  function injectStyle(){
    if (document.getElementById('cnmi-v93-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v93-style';
    style.textContent = `
      [data-v93-unlock-all-roster] { margin-left: 8px; }
      @media (max-width: 820px) {
        [data-v93-unlock-all-roster] { width: 100%; margin: 6px 0; }
      }
    `;
    document.head.appendChild(style);
  }

  const oldRenderPage = safe(() => renderPage, null);
  if (typeof oldRenderPage === 'function' && !oldRenderPage.__v93UnlockAllPatched) {
    const patched = function(){
      const out = oldRenderPage.apply(this, arguments);
      injectStyle();
      setTimeout(injectUnlockButton, 0);
      setTimeout(injectUnlockButton, 250);
      return out;
    };
    patched.__v93UnlockAllPatched = true;
    window.renderPage = renderPage = patched;
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest && e.target.closest('[data-v93-unlock-all-roster]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    unlockAllRosterSlots(btn);
  }, true);

  document.addEventListener('DOMContentLoaded', function(){ injectStyle(); setTimeout(injectUnlockButton, 300); });
  setTimeout(() => { injectStyle(); injectUnlockButton(); }, 700);
  console.log('[CNMI]', PATCH, 'loaded');
})();
