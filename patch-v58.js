/* CNMI Staff Planner Patch V58
   - Login ด้วยชื่อผู้ใช้ให้ชัวร์ขึ้นผ่าน resolve_login_identifier_v58 ก่อน sign-in
   - แสดงคำขอแก้ไขข้อมูลส่วนตัว / สรุปคำขอ ให้โหลดใหม่และแสดงหลังรีเฟรชหน้า
   - ปรับ spacing ข้อมูลส่วนตัว
   - เมนูซ้ายไม่ตัด 2 บรรทัดง่าย และปุ่มสามขีดยุบ/เปิด sidebar ได้บนคอม
*/
(function(){
  const PATCH = 'V58_LOGIN_PROFILE_SIDEBAR_FIX';
  const $id = (id)=>document.getElementById(id);
  const n = (v)=>String(v ?? '').trim();
  const l = (v)=>n(v).toLowerCase();
  const esc = (v)=>{ try { return escapeHtml(v); } catch(e){ return n(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } };
  const same = (a,b)=>n(a) !== '' && n(a) === n(b);
  const isAdminSafe = ()=>{ try { return !!isAdmin(); } catch(e){ return state?.profile?.role === 'admin'; } };
  const userId = ()=>n(state?.session?.user?.id);
  const staffId = ()=>{ try { return n(currentStaffId && currentStaffId()); } catch(e){ return n(state?.profile?.id); } };
  const userEmail = ()=>l(state?.profile?.email || state?.session?.user?.email);
  const statusOf = (r)=>l(r?.status || 'pending') || 'pending';
  const fieldText = (f)=>({phone:'เบอร์โทร',login_name:'ชื่อผู้ใช้',nickname:'ชื่อเล่น',full_name:'ชื่อ-สกุล'}[n(f)] || f || '-');
  const statusText = (s)=>({pending:'รออนุมัติ',approved:'อนุมัติแล้ว',rejected:'ไม่อนุมัติ'}[l(s)] || s || '-');
  const statusBadge = (s)=>l(s)==='approved'?'green':l(s)==='rejected'?'red':'orange';

  function injectStyle(){
    if ($id('v58Style')) return;
    const st = document.createElement('style'); st.id = 'v58Style';
    st.textContent = `
      .sidebar{width:310px!important;min-width:310px!important;max-width:310px!important;}
      .main-nav .nav-btn{white-space:nowrap!important;min-height:44px!important;gap:12px!important;padding:11px 14px!important;}
      .main-nav .nav-btn span:last-child,.main-nav .nav-btn .nav-title{white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;display:block!important;}
      .app-title{white-space:nowrap!important;}
      body.cnmi-sidebar-collapsed .sidebar{display:none!important;}
      body.cnmi-sidebar-collapsed .main-panel{margin-left:0!important;width:100%!important;}
      body.cnmi-sidebar-collapsed .topbar{left:0!important;}
      #myProfilePage .card{overflow:hidden!important;}
      .profile-info-row{display:grid!important;grid-template-columns:118px minmax(0,1fr)!important;gap:10px 18px!important;align-items:start!important;padding:12px 0!important;line-height:1.7!important;border-bottom:1px solid rgba(148,163,184,.22)!important;}
      .profile-info-row span{color:#64748b!important;white-space:nowrap!important;}
      .profile-info-row b{display:block!important;line-height:1.7!important;word-break:break-word!important;overflow-wrap:anywhere!important;}
      .profile-request-card{line-height:1.7!important;padding:18px!important;}
      .profile-request-card div{margin-top:4px!important;}
      @media (max-width:760px){
        .sidebar{width:84vw!important;min-width:84vw!important;max-width:84vw!important;}
        .main-nav .nav-btn{font-size:15px!important;}
        .profile-info-row{grid-template-columns:84px minmax(0,1fr)!important;gap:8px 12px!important;padding:10px 0!important;}
      }
    `;
    document.head.appendChild(st);
  }
  injectStyle();

  function centerModal(title, message, tone){
    const icon = tone === 'error' ? '!' : tone === 'warning' ? '!' : '✓';
    const iconBg = tone === 'error' ? '#fee2e2' : tone === 'warning' ? '#fef3c7' : '#dcfce7';
    const iconColor = tone === 'error' ? '#dc2626' : tone === 'warning' ? '#b45309' : '#16a34a';
    const body = $id('modalBody');
    const modal = $id('modal');
    if (!body || !modal) { alert(`${title}\n${message||''}`); return; }
    body.innerHTML = `<div style="text-align:center;padding:26px 22px 20px;max-width:560px;margin:auto;">
      <div style="width:68px;height:68px;border-radius:22px;background:${iconBg};color:${iconColor};display:flex;align-items:center;justify-content:center;font-size:38px;font-weight:800;margin:0 auto 16px;">${icon}</div>
      <h2 style="margin:0 0 10px;font-size:28px;">${esc(title)}</h2>
      ${message?`<p class="muted" style="font-size:17px;line-height:1.65;margin:0 auto 20px;">${esc(message)}</p>`:''}
      <button class="primary-btn" type="button" data-v58-close-modal>ตกลง</button>
    </div>`;
    modal.classList.remove('hidden');
  }

  async function resolveLoginV58(loginId){
    const raw = n(loginId);
    if (!raw) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    if (raw.includes('@')) return raw.toLowerCase();
    const username = raw.toLowerCase();
    if (!/^[a-z0-9._-]{1,30}$/.test(username)) throw new Error('ชื่อผู้ใช้ใช้ได้เฉพาะตัวอักษรอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
    for (const fn of ['resolve_login_identifier_v58','resolve_login_identifier_v57']) {
      try {
        const r = await sb.rpc(fn, { p_login: username });
        if (!r.error && r.data) return String(r.data).toLowerCase();
        if (r.error) console.warn(`[${PATCH}] ${fn}`, r.error.message || r.error);
      } catch(err){ console.warn(`[${PATCH}] ${fn} failed`, err); }
    }
    // ถ้า policy เปิดให้อ่านได้ จะลองหาโดยตรงอีกชั้น
    try {
      const direct = await sb.from('staff_profiles').select('email').eq('is_active', true).ilike('login_name', username).limit(1);
      if (!direct.error && direct.data?.[0]?.email) return String(direct.data[0].email).toLowerCase();
    } catch(err) {}
    throw new Error('ไม่พบชื่อผู้ใช้นี้ หรือยังไม่ได้ Run SQL Patch V58');
  }
  window.resolveLoginIdentifier = resolveLoginV58;

  document.addEventListener('submit', async function(e){
    if (e.target?.id !== 'loginForm') return;
    e.preventDefault(); e.stopImmediatePropagation();
    const loginId = $id('loginEmail')?.value || '';
    const password = $id('loginPassword')?.value || '';
    if (!password) return centerModal('แจ้งเตือน','กรุณากรอกรหัสผ่าน','error');
    try { setBusy(true, 'กำลังเข้าสู่ระบบ'); } catch(err) {}
    let email = '';
    try { email = await resolveLoginV58(loginId); }
    catch(err){ try{setBusy(false)}catch(e){}; return centerModal('แจ้งเตือน', err.message || 'ไม่พบชื่อผู้ใช้', 'error'); }
    const res = await sb.auth.signInWithPassword({ email, password });
    try { setBusy(false); } catch(err) {}
    if (res.error) {
      const msg = String(res.error.message || '');
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return centerModal('แจ้งเตือน','ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง ถ้าเพิ่งตั้งชื่อผู้ใช้ ให้ลอง Login ครั้งแรก / ลืมรหัสผ่าน เพื่อตั้งรหัสผ่านใหม่อีกครั้ง','error');
      }
      return centerModal('แจ้งเตือน', msg, 'error');
    }
  }, true);

  function byAnyStaff(row){
    const ids = [row?.staff_id,row?.requested_by,row?.reviewed_by,row?.user_id].map(n).filter(Boolean);
    const emails = [row?.email,row?.user_email,row?.request_email,row?.requester_email].map(l).filter(Boolean);
    return (state.staff || []).find(s => ids.includes(n(s.id)) || ids.includes(n(s.user_id)) || emails.includes(l(s.email))) || null;
  }
  function isMine(row){
    const sid = staffId(), uid = userId(), email = userEmail(), st = byAnyStaff(row);
    if (same(row?.staff_id,sid) || same(row?.requested_by,sid)) return true;
    if (same(row?.staff_id,uid) || same(row?.requested_by,uid)) return true;
    if (same(st?.id,sid) || same(st?.user_id,uid)) return true;
    if (email && (l(st?.email)===email || [row?.email,row?.user_email,row?.request_email,row?.requester_email].map(l).includes(email))) return true;
    if (row?.field_name === 'login_name' && n(row?.new_value) && n(row?.new_value) === n(state?.profile?.login_name)) return true;
    if (row?.field_name === 'phone' && n(row?.new_value) && n(row?.new_value) === n(state?.profile?.phone)) return true;
    return false;
  }
  function addRows(out, seen, rows){
    (rows || []).forEach(r=>{ const key = n(r?.id) || `${r?.staff_id}|${r?.requested_by}|${r?.field_name}|${r?.new_value}|${r?.created_at}`; if(!seen.has(key)){seen.add(key); out.push(r);} });
  }
  async function rpcRows(fn,args){
    try { const r = await sb.rpc(fn,args||{}); if(!r.error) return r.data || []; console.warn(`[${PATCH}] ${fn}`, r.error.message || r.error); }
    catch(err){ console.warn(`[${PATCH}] ${fn} failed`, err); }
    return [];
  }
  window.loadProfileChangeRequests = async function loadProfileChangeRequestsV58(){
    const args = { p_staff_id: staffId() || null, p_user_email: userEmail() || null, p_user_id: userId() || null, p_is_admin: isAdminSafe() };
    const rows = [], seen = new Set();
    for (const fn of ['list_profile_change_requests_v58','list_profile_change_requests_v57','list_profile_change_requests_v56']) {
      const got = await rpcRows(fn,args); addRows(rows, seen, got);
      if (got.length) break;
    }
    if (!rows.length) {
      try { const direct = await sb.from('profile_change_requests').select('*').order('created_at',{ascending:false}); if(!direct.error) addRows(rows,seen,direct.data||[]); }
      catch(err) { console.warn(`[${PATCH}] direct failed`, err); }
    }
    rows.sort((a,b)=>new Date(b.created_at||0)-new Date(a.created_at||0));
    state.profileChangeRequests = isAdminSafe() ? rows : rows.filter(isMine);
    state.profileChangeRequestsLoaded = true;
    console.info(`[${PATCH}] profile requests loaded`, {total:rows.length, visible:state.profileChangeRequests.length, admin:isAdminSafe(), staffId:staffId(), userId:userId(), email:userEmail()});
    return state.profileChangeRequests;
  };

  function reviewerName(row){ const rv=(state.staff||[]).find(s=>same(s.id,row?.reviewed_by)||same(s.user_id,row?.reviewed_by)); return rv ? staffPill(rv) : '-'; }
  function reqCard(row, mode){
    const s = statusOf(row), st = byAnyStaff(row);
    const who = st ? staffPill(st) : `<span class="staff-color-pill">${esc(row.email || row.requested_by || 'ไม่พบชื่อ')}</span>`;
    const title = mode === 'me' ? esc(fieldText(row.field_name)) : who;
    const actions = mode === 'admin' && s === 'pending'
      ? `<div class="actions"><button class="primary-btn" data-approve-profile-request="${esc(row.id)}">อนุมัติ</button><button class="ghost-btn danger" data-reject-profile-request="${esc(row.id)}">ไม่อนุมัติ</button></div>`
      : `<div class="muted">ผู้ตรวจ: ${reviewerName(row)} ${formatThaiDateTime(row.reviewed_at)}</div>${row.review_note ? `<div><b>หมายเหตุ Admin:</b> ${esc(row.review_note)}</div>` : ''}`;
    return `<div class="mobile-card profile-request-card"><div class="mobile-day-head"><h3>${title}</h3>${badge(statusText(s), statusBadge(s))}</div>
      ${mode !== 'me' ? `<div><b>ขอแก้:</b> ${esc(fieldText(row.field_name))}</div>` : ''}
      <div><b>ค่าเดิม:</b> ${esc(row.old_value || '-')}</div><div><b>ค่าใหม่:</b> ${esc(row.new_value || '-')}</div>
      <div><b>เหตุผล/หมายเหตุ:</b> ${esc(row.note || '-')}</div><div class="muted">ส่งเมื่อ ${formatThaiDateTime(row.created_at)}</div>${actions}</div>`;
  }
  function ensureProfileRequestsLoading(){
    if (state.profileChangeRequestsLoaded) return '';
    setTimeout(async()=>{ await loadProfileChangeRequests(); if(['myProfile','profileRequests','profileRequestsSummary'].includes(state.page)) renderPage(); }, 50);
    return `<div class="card"><div class="muted">กำลังโหลดคำขอ...</div></div>`;
  }

  window.renderMyProfilePage = function renderMyProfilePageV58(){
    const p = state.profile || {};
    const myReqs = (state.profileChangeRequests || []).filter(isMine).slice(0,30);
    const loading = ensureProfileRequestsLoading();
    return `<div class="grid grid-2" id="myProfilePage"><div class="card"><div class="section-title"><h3>ข้อมูลส่วนตัว</h3></div>
      <p class="muted">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p>
      <div class="profile-info-row"><span>ชื่อเล่น</span><b>${esc(p.nickname || '-')}</b></div>
      <div class="profile-info-row"><span>ชื่อ-สกุล</span><b>${esc(p.full_name || '-')}</b></div>
      <div class="profile-info-row"><span>เบอร์โทร</span><b>${esc(p.phone || '-')}</b></div>
      <div class="profile-info-row"><span>Email</span><b>${esc(p.email || '-')}</b></div>
      <div class="profile-info-row"><span>ชื่อผู้ใช้</span><b>${esc(p.login_name || '-')}</b></div>
      <form id="profileChangeForm" class="form-grid compact-form"><label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="login_name">ชื่อผู้ใช้</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label>
      <label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label><label class="wide">เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label><button class="primary-btn wide" type="submit">ส่งคำขอให้ Admin อนุมัติ</button></form>
      </div><div class="card"><div class="section-title"><h3>คำขอล่าสุดของฉัน</h3><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรช</button></div>${loading || `<div class="mobile-cards always-cards">${myReqs.length ? myReqs.map(r=>reqCard(r,'me')).join('') : empty('ยังไม่มีคำขอ')}</div>`}</div></div>`;
  };
  window.renderProfileRequestsPage = function renderProfileRequestsPageV58(){
    if (!isAdminSafe()) return noPermission();
    const loading = ensureProfileRequestsLoading();
    const rows = (state.profileChangeRequests || []).filter(r=>statusOf(r)==='pending');
    return `<div class="card"><div class="section-title"><h3>คำขอแก้ไขข้อมูลส่วนตัว</h3><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรชคำขอ</button></div></div>${loading || `<div class="mobile-cards always-cards">${rows.length ? rows.map(r=>reqCard(r,'admin')).join('') : empty('ยังไม่มีคำขอที่รออนุมัติ')}</div>`}`;
  };
  window.renderProfileRequestsSummaryPage = function renderProfileRequestsSummaryPageV58(){
    if (!isAdminSafe()) return noPermission();
    const loading = ensureProfileRequestsLoading();
    const month = state.profileRequestSummaryMonth || '';
    const sid = state.profileRequestSummaryStaffId || '';
    const rows = (state.profileChangeRequests || []).filter(r=>statusOf(r)!=='pending').filter(r=>!month || String(r.reviewed_at||r.created_at||'').slice(0,7)===month).filter(r=>!sid || same(byAnyStaff(r)?.id,sid) || same(r.staff_id,sid) || same(r.requested_by,sid));
    return `<div class="card"><div class="section-title"><h3>สรุปคำขอแก้ไขข้อมูลส่วนตัว</h3><button class="ghost-btn" type="button" data-refresh-profile-requests>รีเฟรช</button></div><div class="toolbar"><label>คน <select id="profileSummaryStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff||[]).map(s=>`<option value="${s.id}" ${sid===s.id?'selected':''}>${esc(s.nickname || s.full_name)}</option>`).join('')}</select></label><label>เดือน <input id="profileSummaryMonth" type="month" value="${month}"></label></div></div>${loading || `<div class="mobile-cards always-cards">${rows.length ? rows.map(r=>reqCard(r,'summary')).join('') : empty('ยังไม่มีรายการที่ตรวจแล้วในเงื่อนไขนี้')}</div>`}`;
  };

  const oldSaveProfile = window.saveProfileChangeRequest;
  window.saveProfileChangeRequest = async function saveProfileChangeRequestV58(form){
    if (oldSaveProfile) {
      await oldSaveProfile(form);
      state.profileChangeRequestsLoaded = false;
      await loadProfileChangeRequests();
      if (state.page === 'myProfile') renderPage();
      return;
    }
  };

  const oldRenderPage = renderPage;
  renderPage = function renderPageV58(){
    injectStyle();
    if (isAdminSafe() && !NAV_ITEMS.some(x=>x.id==='profileRequestsSummary')) {
      const idx = NAV_ITEMS.findIndex(x=>x.id==='profileRequests');
      NAV_ITEMS.splice(idx>=0?idx+1:NAV_ITEMS.length,0,{id:'profileRequestsSummary',icon:'📄',title:'สรุปคำขอแก้ไขข้อมูลส่วนตัว',subtitle:'รายการที่ตรวจแล้ว ย้อนกลับมาดูได้',group:'admin'});
    }
    const item = NAV_ITEMS.find(x=>x.id===state.page) || NAV_ITEMS[0];
    $id('pageTitle').textContent = item.title; $id('pageSubtitle').textContent = item.subtitle; renderNav();
    const pages = {dashboard:renderDashboard,calendar:renderCalendar,leave:renderLeavePage,myProfile:renderMyProfilePage,activities:renderActivitiesPage,hr:renderHrPage,hrSummary:renderHrSummaryPage,scheduler:renderSchedulerPage,schedule:renderMonthlySchedulePage,tradeRequests:renderTradeRequestsPage,positions:renderPositionsPage,ot:renderOtPage,audit:renderAuditPage,profileRequests:renderProfileRequestsPage,profileRequestsSummary:renderProfileRequestsSummaryPage,users:renderUsersPage,eligibility:renderEligibilityPage,positionMonth:renderPositionMonthPage,positionMonthView:renderPositionMonthViewPage};
    $id('pageContent').innerHTML = (pages[state.page] || renderDashboard)();
  };

  document.addEventListener('click', async function(e){
    if (e.target.closest('[data-v58-close-modal]')) { $id('modal')?.classList.add('hidden'); return; }
    const menuBtn = e.target.closest('#mobileMenuBtn');
    if (menuBtn && window.innerWidth > 900) { e.preventDefault(); e.stopImmediatePropagation(); document.body.classList.toggle('cnmi-sidebar-collapsed'); return; }
    if (e.target.closest('[data-refresh-profile-requests]')) { state.profileChangeRequestsLoaded=false; await loadProfileChangeRequests(); renderPage(); }
  }, true);
  document.addEventListener('change', function(e){
    if (e.target.id === 'profileSummaryMonth') { state.profileRequestSummaryMonth = e.target.value || ''; renderPage(); }
    if (e.target.id === 'profileSummaryStaff') { state.profileRequestSummaryStaffId = e.target.value || ''; renderPage(); }
  });
  setTimeout(async()=>{ try{ if(typeof sb !== 'undefined' && state?.session?.user){ await loadProfileChangeRequests(); if(['myProfile','profileRequests','profileRequestsSummary'].includes(state.page)) renderPage(); }} catch(err){ console.warn(`[${PATCH}] init`, err); } }, 700);
  console.info(`CNMI Staff Planner ${PATCH} loaded`);
})();
