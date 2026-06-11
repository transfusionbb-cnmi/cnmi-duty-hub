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

  // V150: schedule/roster overrides removed. Clean schedule components now live in app.js.
})();
