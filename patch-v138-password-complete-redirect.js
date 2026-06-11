/* v138 Password Update Completion Fix
   Scope: only fixes recovery/invite submit completion. Does not touch duty calculation or roster layout logic.
*/
(function () {
  'use strict';

  const FORCE_KEYS = [
    'cnmi.forcePasswordSetup.v134',
    'cnmi.forcePasswordSetup.v135',
    'cnmi.forcePasswordSetup.v136',
    'cnmi.forcePasswordSetup.v138'
  ];

  function $(id) { return document.getElementById(id); }
  function val(id) { return String($(id)?.value || '').trim(); }
  function authClient() { return window.sb || (typeof sb !== 'undefined' ? sb : null); }

  function appBaseUrl() {
    try {
      const parts = location.pathname.split('/').filter(Boolean);
      if (location.hostname.endsWith('github.io') && parts[0]) return location.origin + '/' + parts[0] + '/';
      if (location.pathname.includes('/cnmi-saff-planner/')) return location.origin + '/cnmi-saff-planner/';
    } catch (_) {}
    return location.origin + '/';
  }

  function clearRecoveryFlags() {
    try { window.CNMI_REQUIRE_PASSWORD_UPDATE = false; } catch (_) {}
    try { window.CNMI_AUTH_LINK_INTENT = false; } catch (_) {}
    try { window.RECOVERY_INTENT = false; } catch (_) {}
    try { window.AUTH_LINK_PROCESSING = false; } catch (_) {}
    for (const key of FORCE_KEYS) {
      try { sessionStorage.removeItem(key); } catch (_) {}
      try { localStorage.removeItem(key); } catch (_) {}
    }
    try { document.documentElement.classList.remove('v136-auth-link'); } catch (_) {}
  }

  function cleanAuthUrl() {
    try { window.history.replaceState(null, '', appBaseUrl()); } catch (_) {
      try { window.history.replaceState(null, '', window.location.pathname); } catch (__) {}
    }
  }

  async function waitForSession(client, maxMs = 4500) {
    const waits = [0, 120, 250, 500, 800, 1200, 1700, 2400, 3200, 4200];
    let last = null;
    for (const ms of waits) {
      if (ms) await new Promise(r => setTimeout(r, ms));
      try {
        const res = await client.auth.getSession();
        last = res?.data || null;
        if (last?.session?.user) return last;
      } catch (_) {}
      if (ms >= maxMs) break;
    }
    return last || { session: null };
  }

  async function setLoginNameIfPossible(client, email, loginName) {
    if (!email || !loginName) return;
    const payload = { p_email: email, p_login_name: loginName };
    const rpcNames = ['set_initial_login_name_v56', 'set_initial_login_name_v44'];
    let lastError = null;
    for (const fn of rpcNames) {
      try {
        const r = await client.rpc(fn, payload);
        if (!r?.error) return;
        lastError = r.error;
      } catch (err) { lastError = err; }
    }
    if (lastError) throw lastError;
  }

  async function linkProfileIfPossible(client) {
    try { await client.rpc('link_my_staff_profile_v132'); } catch (err) { console.warn('v138 link profile skipped', err); }
  }

  function forceHidePasswordForm() {
    try { $('resetPasswordForm')?.classList.add('hidden'); } catch (_) {}
    try { $('resetPasswordForm')?.classList.remove('active', 'v136-password-panel'); } catch (_) {}
    try { document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active')); } catch (_) {}
    try { $('authView')?.classList.add('hidden'); } catch (_) {}
    try { $('appView')?.classList.remove('hidden'); } catch (_) {}
  }

  async function enterDashboard(client, sessionData) {
    clearRecoveryFlags();
    cleanAuthUrl();
    try {
      const latest = await client.auth.getSession();
      if (typeof state !== 'undefined') state.session = latest?.data?.session || sessionData?.session || null;
    } catch (_) {
      try { if (typeof state !== 'undefined') state.session = sessionData?.session || null; } catch (__) {}
    }

    forceHidePasswordForm();

    // Prefer the app's normal enterApp so data, permissions and routing are loaded exactly as usual.
    try {
      if (typeof window.enterApp === 'function') {
        await window.enterApp();
      } else if (typeof enterApp === 'function') {
        await enterApp();
      }
    } catch (err) {
      console.warn('v138 enterApp fallback', err);
    }

    // Fallback if enterApp was not available or was interrupted by older guards.
    try {
      clearRecoveryFlags();
      forceHidePasswordForm();
      if (typeof state !== 'undefined') {
        state.page = state.page && state.page !== 'login' ? state.page : 'roster';
      }
      if (typeof loadAllData === 'function' && !window.__CNMI_V138_LOADED_ONCE__) {
        window.__CNMI_V138_LOADED_ONCE__ = true;
        await loadAllData();
      }
      if (typeof renderPage === 'function') renderPage();
    } catch (err) {
      console.warn('v138 render fallback', err);
    }
  }

  async function handlePasswordSubmit(e) {
    if (!(e.target && e.target.id === 'resetPasswordForm')) return;

    // Run before older document-level recovery submit guards. This prevents the success alert from leaving
    // the user stuck on the password setup form.
    e.preventDefault();
    e.stopImmediatePropagation();

    const loginName = val('recoveryLoginName');
    const password = String($('newPassword')?.value || '');
    if (!loginName) return typeof showToast === 'function' && showToast('กรุณาตั้งชื่อผู้ใช้', { tone:'error' });
    if (!/^[a-zA-Z0-9._-]+$/.test(loginName)) return typeof showToast === 'function' && showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง', { tone:'error' });
    if (!password || password.length < 6) return typeof showToast === 'function' && showToast('กรุณากรอกรหัสผ่านใหม่อย่างน้อย 6 ตัวอักษร', { tone:'error' });

    const client = authClient();
    if (!client?.auth) return typeof showToast === 'function' && showToast('ระบบ Auth ยังไม่พร้อม กรุณารีเฟรชแล้วลองใหม่', { tone:'error' });

    try { if (typeof setBusy === 'function') setBusy(true, 'กำลังบันทึกชื่อผู้ใช้และรหัสผ่าน'); } catch (_) {}

    try {
      const sessionData = await waitForSession(client);
      const user = sessionData?.session?.user;
      const email = user?.email || '';
      if (!user || !email) throw new Error('ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง');

      await setLoginNameIfPossible(client, email, loginName);

      const upd = await client.auth.updateUser({ password });
      if (upd?.error) throw upd.error;

      await linkProfileIfPossible(client);

      // This is the missing part from the regression: clear state + hash, then enter the app immediately.
      await enterDashboard(client, sessionData);

      if (typeof showToast === 'function') showToast('บันทึกชื่อผู้ใช้และรหัสผ่านแล้ว เข้าสู่ระบบเรียบร้อย');
    } catch (err) {
      try {
        window.CNMI_REQUIRE_PASSWORD_UPDATE = true;
        window.CNMI_AUTH_LINK_INTENT = true;
        sessionStorage.setItem('cnmi.forcePasswordSetup.v138', '1');
      } catch (_) {}
      try { $('authView')?.classList.remove('hidden'); $('appView')?.classList.add('hidden'); $('resetPasswordForm')?.classList.remove('hidden'); $('resetPasswordForm')?.classList.add('active'); } catch (_) {}
      if (typeof showToast === 'function') showToast(err.message || 'บันทึกไม่สำเร็จ', { tone:'error' });
    } finally {
      try { if (typeof setBusy === 'function') setBusy(false); } catch (_) {}
    }
  }

  // Use window capture so this handler runs before previous document-capture patches that call stopImmediatePropagation.
  window.addEventListener('submit', handlePasswordSubmit, true);
})();
