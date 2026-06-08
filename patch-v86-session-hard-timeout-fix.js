/* CNMI Duty Hub V86: hard session refresh timeout fix
   Patch-only. Load after v84/v85. No SQL/schema changes.
   Goal: refresh must not get stuck on the session-restore overlay; keep old session/page when Supabase session exists.
*/
(function(){
  const PATCH = 'v86-session-hard-timeout-fix';
  const UI_KEY = 'cnmiDutyHub.v86.uiState';
  const LEGACY_UI_KEYS = [
    'cnmiDutyHub.v85.uiState',
    'cnmiDutyHub.v84.uiState',
    'cnmiDutyHub.v83.uiState'
  ];
  const LOGOUT_KEYS = [
    'cnmiDutyHub.v85.explicitLogoutAt',
    'cnmiDutyHub.v84.explicitLogoutAt',
    'cnmiDutyHub.v83.explicitLogoutAt',
    'cnmiDutyHub.v86.explicitLogoutAt'
  ];
  const HAD_KEYS = [
    'cnmiDutyHub.v85.hadAppSession',
    'cnmiDutyHub.v86.hadAppSession'
  ];
  const RESTORE_MAX_MS = 9000;
  let restoreRunning = false;
  let bootStartedAt = Date.now();

  function safe(fn, fallback){ try { return fn(); } catch(_) { return fallback; } }
  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function C(){ return (typeof sb !== 'undefined') ? sb : null; }
  function $(id){ return document.getElementById(id); }
  function isHidden(el){ return !el || el.classList.contains('hidden'); }
  function delay(ms){ return new Promise(r => setTimeout(r, ms)); }
  function timeoutResult(ms, value){ return new Promise(r => setTimeout(() => r(value), ms)); }
  function withTimeout(promise, ms, value){ return Promise.race([promise, timeoutResult(ms, value)]); }

  function recentLogout(){
    return LOGOUT_KEYS.some(k => {
      const t = Number(sessionStorage.getItem(k) || localStorage.getItem(k) || 0);
      return t && Date.now() - t < 25000;
    });
  }
  function markLogout(){
    sessionStorage.setItem('cnmiDutyHub.v86.explicitLogoutAt', String(Date.now()));
    localStorage.setItem('cnmiDutyHub.v86.explicitLogoutAt', String(Date.now()));
    HAD_KEYS.forEach(k => localStorage.removeItem(k));
  }

  function hasKnownSession(){
    const st = S();
    if (st?.session?.user || st?.profile?.id) return true;
    if (!isHidden($('appView'))) return true;
    return HAD_KEYS.some(k => localStorage.getItem(k) === '1');
  }

  function setHadSession(){
    if (hasKnownSession() && !recentLogout()) {
      localStorage.setItem('cnmiDutyHub.v86.hadAppSession', '1');
      localStorage.setItem('cnmiDutyHub.v85.hadAppSession', '1');
    }
  }

  function persistUi(){
    const st = S();
    if (!st) return;
    const data = {
      page: st.page,
      monthKey: st.monthKey,
      calendarView: st.calendarView,
      calendarDate: st.calendarDate ? safe(() => st.calendarDate.toISOString(), null) : null,
      scheduleMobileView: st.scheduleMobileView,
      scheduleSelectedDate: st.scheduleSelectedDate,
      tradeFilterStaff: st.tradeFilterStaff,
      positionDate: st.positionDate,
      positionMonthKey: st.positionMonthKey,
      positionMonthViewKey: st.positionMonthViewKey,
      savedAt: Date.now()
    };
    safe(() => localStorage.setItem(UI_KEY, JSON.stringify(data)), null);
    setHadSession();
  }

  function readUi(){
    const keys = [UI_KEY].concat(LEGACY_UI_KEYS);
    for (const k of keys) {
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      try {
        const data = JSON.parse(raw);
        if (data && Date.now() - Number(data.savedAt || 0) < 1000 * 60 * 60 * 24 * 14) return data;
      } catch(_) {}
    }
    return null;
  }

  function restoreUi(){
    const st = S(); if (!st) return;
    const data = readUi(); if (!data) return;
    if (data.page) st.page = data.page;
    if (data.monthKey) st.monthKey = data.monthKey;
    if (data.calendarView) st.calendarView = data.calendarView;
    if (data.calendarDate) {
      const d = new Date(data.calendarDate);
      if (!Number.isNaN(d.getTime())) st.calendarDate = d;
    }
    if (data.scheduleMobileView) st.scheduleMobileView = data.scheduleMobileView;
    if (data.scheduleSelectedDate) st.scheduleSelectedDate = data.scheduleSelectedDate;
    if (data.tradeFilterStaff !== undefined) st.tradeFilterStaff = data.tradeFilterStaff;
    if (data.positionDate) st.positionDate = data.positionDate;
    if (data.positionMonthKey) st.positionMonthKey = data.positionMonthKey;
    if (data.positionMonthViewKey) st.positionMonthViewKey = data.positionMonthViewKey;
  }

  function clearBlockingSessionUi(){
    // v85 overlay can hide login forever if getSession hangs on mobile Safari.
    document.body.classList.remove('v85-session-restoring');
    document.body.classList.remove('v84-session-restoring');
    document.body.classList.remove('v86-session-restoring');
    document.querySelectorAll('#v85SessionOverlay,.v85-session-overlay,#v86SessionOverlay,.v86-session-overlay').forEach(el => {
      el.style.display = 'none';
      safe(() => el.remove(), null);
    });
    const auth = $('authView');
    if (auth) auth.style.visibility = '';
    safe(() => setBusy(false), null);
  }

  function showLoginUsable(){
    clearBlockingSessionUi();
    const app = $('appView');
    const auth = $('authView');
    if (app) app.classList.add('hidden');
    if (auth) {
      auth.classList.remove('hidden');
      auth.style.visibility = '';
    }
    safe(() => showLoginPanel(), null);
    document.querySelectorAll('button,input,select,textarea').forEach(el => {
      if (el.dataset?.keepDisabled === '1') return;
      el.disabled = false;
    });
  }

  async function waitForClient(ms=3500){
    const start = Date.now();
    while (Date.now() - start < ms) {
      const client = C();
      if (client?.auth?.getSession) return client;
      await delay(100);
    }
    return C();
  }

  async function getSessionFast(client){
    if (!client?.auth?.getSession) return null;
    const res = await withTimeout(client.auth.getSession(), 2500, { __timeout:true });
    if (res?.__timeout) return 'timeout';
    return res?.data?.session || null;
  }

  async function restoreSession(reason){
    if (restoreRunning || recentLogout()) return false;
    restoreRunning = true;
    const started = Date.now();
    try {
      clearBlockingSessionUi();
      restoreUi();
      const client = await waitForClient(4000);
      if (!client?.auth?.getSession) { showLoginUsable(); return false; }

      for (const wait of [0, 250, 600, 1200, 2200]) {
        if (Date.now() - started > RESTORE_MAX_MS) break;
        if (wait) await delay(wait);
        const session = await getSessionFast(client);
        if (session === 'timeout') break;
        if (!session?.user) continue;

        const st = S();
        if (st) st.session = session;
        restoreUi();
        setHadSession();

        const ok = await withTimeout((async () => {
          await enterApp();
          restoreUi();
          safe(() => renderPage(), null);
          safe(() => setBusy(false), null);
          persistUi();
          return true;
        })(), 12000, false);

        clearBlockingSessionUi();
        console.info('CNMI Staff Planner ' + PATCH + ' restored:', reason, ok);
        if (ok || !isHidden($('appView'))) return true;
        return false;
      }

      // No usable session: do not leave a frozen overlay/login.
      showLoginUsable();
      return false;
    } catch (err) {
      console.warn(PATCH, 'restore failed', reason, err);
      showLoginUsable();
      return false;
    } finally {
      restoreRunning = false;
      clearBlockingSessionUi();
    }
  }

  function patchSessionFunctions(){
    try {
      const oldEnter = enterApp;
      window.enterApp = enterApp = async function enterAppV86(){
        restoreUi();
        clearBlockingSessionUi();
        await oldEnter.apply(this, arguments);
        restoreUi();
        safe(() => renderPage(), null);
        persistUi();
        clearBlockingSessionUi();
      };
    } catch(err) { console.warn(PATCH, 'enter patch skipped', err); }

    try {
      const oldExit = exitApp;
      window.exitApp = exitApp = function exitAppV86(){
        if (!recentLogout() && hasKnownSession()) {
          restoreSession('exitApp').then(ok => { if (!ok) oldExit.apply(this, arguments); });
          return;
        }
        oldExit.apply(this, arguments);
        clearBlockingSessionUi();
      };
    } catch(err) { console.warn(PATCH, 'exit patch skipped', err); }

    try {
      const oldRender = renderPage;
      window.renderPage = renderPage = function renderPageV86(){
        const out = oldRender.apply(this, arguments);
        setTimeout(persistUi, 0);
        return out;
      };
    } catch(err) { console.warn(PATCH, 'render patch skipped', err); }
  }

  function installWatchdogs(){
    document.addEventListener('click', e => { if (e.target?.closest?.('#logoutBtn')) markLogout(); }, true);
    document.addEventListener('submit', e => { if (e.target?.id === 'loginForm') clearBlockingSessionUi(); }, true);
    window.addEventListener('beforeunload', persistUi, { capture:true });
    window.addEventListener('pagehide', persistUi, { capture:true });
    window.addEventListener('pageshow', () => setTimeout(() => restoreSession('pageshow'), 150));
    window.addEventListener('focus', () => setTimeout(() => restoreSession('focus'), 250));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) setTimeout(() => restoreSession('visibility'), 250); });

    // Hard anti-freeze: never let old restore overlay block the UI for more than a few seconds.
    const watchdog = setInterval(() => {
      clearBlockingSessionUi();
      const st = S();
      if (st?.session?.user || !isHidden($('appView'))) setHadSession();
      if (Date.now() - bootStartedAt > 45000) clearInterval(watchdog);
    }, 750);

    setTimeout(() => restoreSession('load-300'), 300);
    setTimeout(() => restoreSession('load-1800'), 1800);
    setTimeout(() => {
      // If after boot the app is still hidden and old overlay/login is blocking, make login usable.
      if (isHidden($('appView')) && !recentLogout()) {
        clearBlockingSessionUi();
      }
    }, 9000);
  }

  function injectStyle(){
    if (document.getElementById('cnmi-v86-session-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v86-session-style';
    style.textContent = `
      body:not(.v86-allow-old-session-overlay) .v85-session-overlay { display:none !important; }
      body:not(.v86-allow-old-session-overlay).v85-session-restoring #authView { visibility:visible !important; }
    `;
    document.head.appendChild(style);
  }

  function install(){
    injectStyle();
    clearBlockingSessionUi();
    restoreUi();
    patchSessionFunctions();
    installWatchdogs();
    console.info('CNMI Staff Planner ' + PATCH + ' loaded');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install);
  else install();
})();
