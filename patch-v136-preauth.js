/* v136 pre-auth intent detector: runs before app.js so router/auth guard cannot eat Supabase email-link tokens. */
(function () {
  'use strict';
  var raw = String(location.href || '') + ' ' + String(location.search || '') + ' ' + String(location.hash || '');
  var isAuthLink = /(access_token|refresh_token|token_hash|code)=/i.test(raw) || /type=(recovery|password_recovery|invite|signup)/i.test(raw) || /mode=(recovery|set-password|update-password)/i.test(raw);
  var isError = /(error=|error_code=|error_description=)/i.test(raw);
  if (isAuthLink && !isError) {
    window.CNMI_AUTH_LINK_INTENT = true;
    window.CNMI_REQUIRE_PASSWORD_UPDATE = true;
    window.RECOVERY_INTENT = true;
    window.AUTH_LINK_PROCESSING = true;
    try { sessionStorage.setItem('cnmi.forcePasswordSetup.v134', JSON.stringify({ reason:'v136-preauth', at:Date.now() })); } catch (_) {}
    try { sessionStorage.setItem('cnmi.forcePasswordSetup.v135', '1'); } catch (_) {}
    try { sessionStorage.setItem('cnmi.forcePasswordSetup.v136', '1'); } catch (_) {}
    document.documentElement.classList.add('v136-auth-link');
  }
})();
