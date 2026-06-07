/* CNMI Staff Planner Patch V57
   Fixes:
   - Login ด้วยชื่อผู้ใช้ก่อน sign-in ผ่าน RPC ที่เปิดให้ anon ใช้ได้
   - คำขอล่าสุดของฉัน / Admin / สรุปคำขอ โหลดจาก profile_change_requests แบบทนกว่าเดิม
   - สรุปคำขอเริ่มต้นไม่กรองเดือน เพื่อไม่ให้ดูเหมือนข้อมูลหาย
   - ปรับ spacing ข้อมูลส่วนตัว, เมนูไม่ตัดสองบรรทัด, ปุ่มสามขีดยุบ sidebar บนคอมได้
*/
(function () {
  const PATCH = 'V57_LOGIN_PROFILE_UI_FIX';
  function n(v) { return String(v ?? '').trim(); }
  function l(v) { return n(v).toLowerCase(); }
  function esc(v) { try { return escapeHtml(v); } catch(e) { return n(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } }
  function same(a,b) { return n(a) && n(a) === n(b); }
  function getUserId() { return n(state?.session?.user?.id); }
  function getEmail() { return l(state?.profile?.email || state?.session?.user?.email); }
  function getStaffId() { try { return n(currentStaffId && currentStaffId()); } catch(e) { return n(state?.profile?.id); } }
  function admin() { try { return !!isAdmin(); } catch(e) { return state?.profile?.role === 'admin'; } }
  function stat(r) { return l(r?.status || 'pending') || 'pending'; }
  function fieldText(f) { return ({ phone:'เบอร์โทร', login_name:'ชื่อผู้ใช้', nickname:'ชื่อเล่น', full_name:'ชื่อ-สกุล' }[n(f)] || f || '-'); }
  function statusText(s) { return ({ pending:'รออนุมัติ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ' }[l(s)] || s || '-'); }
  function statusBadge(s) { return l(s) === 'approved' ? 'green' : l(s) === 'rejected' ? 'red' : 'orange'; }
  function byAnyStaff(row) {
    const ids = [row?.staff_id, row?.requested_by, row?.reviewed_by, row?.user_id].map(n).filter(Boolean);
    const emails = [row?.email, row?.user_email, row?.request_email, row?.requester_email].map(l).filter(Boolean);
    return (state.staff || []).find(s => ids.includes(n(s.id)) || ids.includes(n(s.user_id)) || emails.includes(l(s.email))) || null;
  }
  function reviewerName(row) {
    const reviewer = (state.staff || []).find(s => same(s.id, row?.reviewed_by) || same(s.user_id, row?.reviewed_by));
    return reviewer ? staffPill(reviewer) : '-';
  }
  function isMine(row) {
    const sid = getStaffId();
    const uid = getUserId();
    const email = getEmail();
    const st = byAnyStaff(row);
    if (same(row?.staff_id, sid) || same(row?.requested_by, sid)) return true;
    if (same(row?.staff_id, uid) || same(row?.requested_by, uid)) return true;
    if (same(st?.id, sid) || same(st?.user_id, uid)) return true;
    if (email && (l(st?.email) === email || [row?.email,row?.user_email,row?.request_email,row?.requester_email].map(l).includes(email))) return true;
    // fallback สำหรับข้อมูลเก่าที่ staff_id/requested_by ไม่สัมพันธ์ แต่เป็นค่าที่ตรงกับ profile ปัจจุบัน
    if (row?.field_name === 'login_name' && n(row?.new_value) && n(row?.new_value) === n(state?.profile?.login_name)) return true;
    if (row?.field_name === 'phone' && n(row?.new_value) && n(row?.new_value) === n(state?.profile?.phone)) return true;
    return false;
  }
  function addRows(out, seen, rows) {
    (rows || []).forEach(r => {
      if (!r) return;
      const key = n(r.id) || `${r.staff_id}|${r.requested_by}|${r.field_name}|${r.new_value}|${r.created_at}`;
      if (seen.has(key)) return;
      seen.add(key);
      out.push(r);
    });
  }
  async function rpcRows(name, args) {
    try {
      const res = await sb.rpc(name, args || {});
      if (!res.error) return res.data || [];
      console.warn(`[${PATCH}] ${name}`, res.error.message || res.error);
    } catch (err) { console.warn(`[${PATCH}] ${name} failed`, err); }
    return [];
  }

  function injectStyle() {
    if (document.getElementById('v57Style')) return;
    const style = document.createElement('style');
    style.id = 'v57Style';
    style.textContent = `
      .profile-info-row{display:grid!important;grid-template-columns:130px minmax(0,1fr)!important;align-items:start!important;gap:8px 18px!important;padding:10px 0!important;border-bottom:1px solid rgba(148,163,184,.18)!important;line-height:1.55!important;}
      .profile-info-row span{color:#64748b!important;white-space:nowrap!important;}
      .profile-info-row b{word-break:break-word!important;overflow-wrap:anywhere!important;line-height:1.55!important;}
      .compact-form{gap:14px!important;margin-top:16px!important;}
      .profile-request-card{line-height:1.65!important;}
      .main-nav .nav-btn{white-space:nowrap!important;min-height:46px!important;}
      .main-nav .nav-btn span:last-child{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;}
      .sidebar{width:300px!important;min-width:300px!important;}
      .app-title{white-space:nowrap!important;letter-spacing:.01em!important;}
      body.sidebar-collapsed .sidebar{display:none!important;}
      body.sidebar-collapsed .main-panel{margin-left:0!important;width:100%!important;}
      @media (max-width: 760px){
        .profile-info-row{grid-template-columns:92px minmax(0,1fr)!important;gap:6px 12px!important;padding:9px 0!important;}
        .sidebar{width:82vw!important;min-width:82vw!important;}
        .main-nav .nav-btn{font-size:15px!important;}
      }
    `;
    document.head.appendChild(style);
  }
  injectStyle();

  async function resolveLogin(loginId) {
    const raw = n(loginId);
    if (!raw) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    if (raw.includes('@')) {
      const email = raw.toLowerCase();
      if (typeof requireMahidolEmail === 'function' && !requireMahidolEmail(email)) throw new Error('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
      return email;
    }
    const username = raw.toLowerCase();
    if (!/^[a-zA-Z0-9._-]{1,30}$/.test(username)) throw new Error('ชื่อผู้ใช้ควรเป็นตัวอักษรอังกฤษหรือตัวเลข');

    // ก่อน login ยังไม่มี session จึงต้องใช้ RPC security definer ที่ grant ให้ anon
    try {
      const r = await sb.rpc('resolve_login_identifier_v57', { p_login: username });
      if (!r.error && r.data) return String(r.data).toLowerCase();
      if (r.error) console.warn(`[${PATCH}] resolve_login_identifier_v57`, r.error.message || r.error);
    } catch (err) { console.warn(`[${PATCH}] resolve rpc failed`, err); }

    // fallback เฉพาะกรณี policy อนุญาตให้อ่านได้
    const res = await sb.from('staff_profiles').select('email, login_name, is_active').ilike('login_name', username).eq('is_active', true).limit(1);
    if (!res.error && res.data?.[0]?.email) return String(res.data[0].email).toLowerCase();
    throw new Error('ไม่พบชื่อผู้ใช้นี้ หรือยังไม่ได้ Run SQL Patch V57');
  }
  window.resolveLoginIdentifier = resolveLogin;

  document.addEventListener('submit', async function(e) {
    if (e.target?.id !== 'loginForm') return;
    e.preventDefault();
    e.stopImmediatePropagation();
    const loginId = document.getElementById('loginEmail')?.value || '';
    const password = document.getElementById('loginPassword')?.value || '';
    if (!password) return showToast('กรุณากรอกรหัสผ่าน', { tone:'error' });
    setBusy(true, 'กำลังเข้าสู่ระบบ');
    let email = '';
    try { email = await resolveLogin(loginId); }
    catch (err) { setBusy(false); return showToast(err.message || 'ไม่พบชื่อผู้ใช้', { tone:'error' }); }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('invalid login credentials')) return showToast('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน', { tone:'error', title:'แจ้งเตือน' });
      return showToast(msg, { tone:'error', title:'แจ้งเตือน' });
    }
  }, true);

  window.loadProfileChangeRequests = async function loadProfileChangeRequestsV57() {
    const rows = [];
    const seen = new Set();
    const args = { p_staff_id: getStaffId() || null, p_user_email: getEmail() || null, p_user_id: getUserId() || null, p_is_admin: admin() };
    addRows(rows, seen, await rpcRows('list_profile_change_requests_v57', args));
    if (!rows.length) addRows(rows, seen, await rpcRows('list_profile_change_requests_v56', args));
    if (!rows.length) {
      try {
        const direct = await sb.from('profile_change_requests').select('*').order('created_at', { ascending:false });
        if (!direct.error) addRows(rows, seen, direct.data || []);
        else console.warn(`[${PATCH}] direct profile_change_requests`, direct.error.message || direct.error);
      } catch (err) { console.warn(`[${PATCH}] direct profile_change_requests failed`, err); }
    }
    rows.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    state.profileChangeRequests = admin() ? rows : rows.filter(isMine);
    console.info(`[${PATCH}] profile requests loaded`, { total: rows.length, visible: state.profileChangeRequests.length, admin: admin(), staffId:getStaffId(), userId:getUserId(), email:getEmail() });
    return state.profileChangeRequests;
  };

  function requestCard(row, mode) {
    const s = stat(row);
    const st = byAnyStaff(row);
    const who = st ? staffPill(st) : `<span class="staff-color-pill">${esc(row.email || row.user_email || row.request_email || row.requested_by || 'ไม่พบชื่อ')}</span>`;
    const head = mode === 'me' ? esc(fieldText(row.field_name)) : who;
    const actions = mode === 'admin' && s === 'pending'
      ? `<div class="actions"><button class="primary-btn" data-approve-profile-request="${esc(row.id)}">อนุมัติ</button><button class="ghost-btn danger" data-reject-profile-request="${esc(row.id)}">ไม่อนุมัติ</button></div>`
      : `<div class="muted">ผู้ตรวจ: ${reviewerName(row)} ${formatThaiDateTime(row.reviewed_at)}</div>${row.review_note ? `<div><b>หมายเหตุ Admin:</b> ${esc(row.review_note)}</div>` : ''}`;
    return `<div class="mobile-card profile-request-card">
      <div class="mobile-day-head"><h3>${head}</h3>${badge(statusText(s), statusBadge(s))}</div>
      ${mode !== 'me' ? `<div><b>ขอแก้:</b> ${esc(fieldText(row.field_name))}</div>` : ''}
      <div><b>ค่าเดิม:</b> ${esc(row.old_value || '-')}</div>
      <div><b>ค่าใหม่:</b> ${esc(row.new_value || '-')}</div>
      <div><b>เหตุผล/หมายเหตุ:</b> ${esc(row.note || '-')}</div>
      <div class="muted">ส่งเมื่อ ${formatThaiDateTime(row.created_at)}</div>
      ${actions}
    </div>`;
  }

  window.renderMyProfilePage = function renderMyProfilePageV57() {
    const p = state.profile || {};
    const myReqs = (state.profileChangeRequests || []).filter(isMine).slice(0, 30);
    return `<div class="grid grid-2" id="myProfilePage">
      <div class="card">
        <div class="section-title"><h3>ข้อมูลส่วนตัว</h3></div>
        <p class="muted">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p>
        <div class="profile-info-row"><span>ชื่อเล่น</span><b>${esc(p.nickname || '-')}</b></div>
        <div class="profile-info-row"><span>ชื่อ-สกุล</span><b>${esc(p.full_name || '-')}</b></div>
        <div class="profile-info-row"><span>เบอร์โทร</span><b>${esc(p.phone || '-')}</b></div>
        <div class="profile-info-row"><span>Email</span><b>${esc(p.email || '-')}</b></div>
        <div class="profile-info-row"><span>ชื่อผู้ใช้</span><b>${esc(p.login_name || '-')}</b></div>
        <form id="profileChangeForm" class="form-grid compact-form">
          <label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="login_name">ชื่อผู้ใช้</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label>
          <label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label>
          <label class="wide">เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label>
          <button class="primary-btn wide" type="submit">ส่งคำขอให้ Admin อนุมัติ</button>
        </form>
      </div>
      <div class="card">
        <div class="section-title"><h3>คำขอล่าสุดของฉัน</h3><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรช</button></div>
        <div class="mobile-cards always-cards">${myReqs.length ? myReqs.map(r => requestCard(r, 'me')).join('') : empty('ยังไม่มีคำขอ')}</div>
      </div>
    </div>`;
  };

  window.renderProfileRequestsPage = function renderProfileRequestsPageV57() {
    if (!admin()) return noPermission();
    const pendingRows = (state.profileChangeRequests || []).filter(r => stat(r) === 'pending');
    return `<div class="card"><div class="section-title"><div><h3>คำขอแก้ไขข้อมูลส่วนตัว</h3></div><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรชคำขอ</button></div></div>
      <div class="mobile-cards always-cards">${pendingRows.length ? pendingRows.map(r => requestCard(r, 'admin')).join('') : empty('ยังไม่มีคำขอที่รออนุมัติ')}</div>`;
  };

  window.renderProfileRequestsSummaryPage = function renderProfileRequestsSummaryPageV57() {
    if (!admin()) return noPermission();
    const month = state.profileRequestSummaryMonth || '';
    const staffId = state.profileRequestSummaryStaffId || '';
    const done = (state.profileChangeRequests || []).filter(r => stat(r) !== 'pending')
      .filter(r => !month || String(r.reviewed_at || r.created_at || '').slice(0,7) === month)
      .filter(r => !staffId || same(byAnyStaff(r)?.id, staffId) || same(r.staff_id, staffId) || same(r.requested_by, staffId));
    return `<div class="card">
      <div class="section-title"><h3>สรุปคำขอแก้ไขข้อมูลส่วนตัว</h3><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรช</button></div>
      <div class="toolbar">
        <label>คน <select id="profileSummaryStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff || []).map(s => `<option value="${s.id}" ${staffId===s.id?'selected':''}>${esc(s.nickname || s.full_name)}</option>`).join('')}</select></label>
        <label>เดือน <input id="profileSummaryMonth" type="month" value="${month}"></label>
      </div>
    </div>
    <div class="mobile-cards always-cards">${done.length ? done.map(r => requestCard(r, 'summary')).join('') : empty('ยังไม่มีรายการที่ตรวจแล้วในเงื่อนไขนี้')}</div>`;
  };

  const oldRenderPage = renderPage;
  renderPage = function renderPageV57() {
    if (admin() && !NAV_ITEMS.some(x => x.id === 'profileRequestsSummary')) {
      const idx = NAV_ITEMS.findIndex(x => x.id === 'profileRequests');
      NAV_ITEMS.splice(idx >= 0 ? idx + 1 : NAV_ITEMS.length, 0, { id:'profileRequestsSummary', icon:'📄', title:'สรุปคำขอแก้ไขข้อมูลส่วนตัว', subtitle:'รายการที่ตรวจแล้ว ย้อนกลับมาดูได้', group:'admin' });
    }
    const item = NAV_ITEMS.find(x => x.id === state.page) || NAV_ITEMS[0];
    document.getElementById('pageTitle').textContent = item.title;
    document.getElementById('pageSubtitle').textContent = item.subtitle;
    renderNav();
    const pages = {
      dashboard: renderDashboard, calendar: renderCalendar, leave: renderLeavePage, myProfile: renderMyProfilePage,
      activities: renderActivitiesPage, hr: renderHrPage, hrSummary: renderHrSummaryPage, scheduler: renderSchedulerPage,
      schedule: renderMonthlySchedulePage, tradeRequests: renderTradeRequestsPage, positions: renderPositionsPage, ot: renderOtPage,
      audit: renderAuditPage, profileRequests: renderProfileRequestsPage, profileRequestsSummary: renderProfileRequestsSummaryPage,
      users: renderUsersPage, eligibility: renderEligibilityPage, positionMonth: renderPositionMonthPage, positionMonthView: renderPositionMonthViewPage
    };
    document.getElementById('pageContent').innerHTML = (pages[state.page] || renderDashboard)();
  };

  document.addEventListener('click', async function(e) {
    const b = e.target.closest('#mobileMenuBtn');
    if (b && window.innerWidth > 900) {
      e.preventDefault();
      e.stopImmediatePropagation();
      document.body.classList.toggle('sidebar-collapsed');
      return;
    }
    if (e.target.closest('[data-refresh-profile-requests]')) {
      await loadProfileChangeRequests();
      renderPage();
    }
  }, true);

  document.addEventListener('change', function(e) {
    if (e.target.id === 'profileSummaryMonth') { state.profileRequestSummaryMonth = e.target.value || ''; renderPage(); }
    if (e.target.id === 'profileSummaryStaff') { state.profileRequestSummaryStaffId = e.target.value || ''; renderPage(); }
  });

  setTimeout(async () => {
    try {
      if (typeof sb !== 'undefined' && sb && state?.session?.user) {
        await loadProfileChangeRequests();
        if (['myProfile','profileRequests','profileRequestsSummary'].includes(state.page)) renderPage();
      }
    } catch (err) { console.warn(`[${PATCH}] init`, err); }
  }, 900);

  console.info(`CNMI Staff Planner ${PATCH} loaded`);
})();
