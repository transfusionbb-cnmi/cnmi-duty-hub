/* CNMI Staff Planner Patch V54
   - Fix profile_change_requests visibility on My Profile + Admin review page
   - Add no-duty monthly quota: weekend max 2 days, weekday max 5 days per staff/month
   - Admin bypasses no-duty quota
*/
(function () {
  const PATCH = 'V54';
  const NO_DUTY_WEEKEND_LIMIT = 2;
  const NO_DUTY_WEEKDAY_LIMIT = 5;

  function norm(v) { return String(v ?? '').trim(); }
  function lower(v) { return norm(v).toLowerCase(); }
  function same(a, b) { return norm(a) && norm(a) === norm(b); }
  function isCancelled(row) { return lower(row?.status) === 'cancelled'; }
  function reqStatus(row) { return lower(row?.status || 'pending') || 'pending'; }

  function staffForProfileRequest(row) {
    const email = lower(row?.email || row?.user_email || row?.request_email || row?.requester_email);
    const reqBy = norm(row?.requested_by);
    const staffId = norm(row?.staff_id);
    return (state.staff || []).find(s =>
      same(s.id, staffId) ||
      same(s.id, reqBy) ||
      same(s.user_id, reqBy) ||
      (!!email && lower(s.email) === email)
    ) || {};
  }

  function isMineProfileRequest(row) {
    const myId = norm(currentStaffId());
    const userId = norm(state.session?.user?.id);
    const myEmail = lower(state.profile?.email || state.session?.user?.email);
    const staff = staffForProfileRequest(row);
    return same(row?.staff_id, myId) ||
      same(row?.requested_by, myId) ||
      same(row?.staff_id, userId) ||
      same(row?.requested_by, userId) ||
      same(staff?.id, myId) ||
      same(staff?.user_id, userId) ||
      (!!myEmail && (
        lower(row?.email || row?.user_email || row?.request_email || row?.requester_email) === myEmail ||
        lower(staff?.email) === myEmail
      ));
  }

  async function rpcMaybe(name, args) {
    try {
      const res = await sb.rpc(name, args || {});
      if (!res?.error) return res.data || [];
      console.warn(`[profile_change_requests] ${name} skipped:`, res.error.message || res.error);
    } catch (err) {
      console.warn(`[profile_change_requests] ${name} failed:`, err);
    }
    return [];
  }

  window.loadProfileChangeRequests = async function loadProfileChangeRequestsV54() {
    const staffId = currentStaffId();
    const email = state.profile?.email || state.session?.user?.email || null;
    const userId = state.session?.user?.id || null;
    const admin = isAdmin();
    const collected = [];
    const seen = new Set();
    const addRows = (arr) => (arr || []).forEach(r => {
      if (!r) return;
      const key = r.id || `${r.staff_id || ''}|${r.requested_by || ''}|${r.field_name || ''}|${r.new_value || ''}|${r.created_at || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(r);
    });

    addRows(await rpcMaybe('list_profile_change_requests_v54', {
      p_staff_id: staffId,
      p_user_email: email,
      p_user_id: userId,
      p_is_admin: admin
    }));

    for (const fn of ['list_profile_change_requests_v53','list_profile_change_requests_v52','list_profile_change_requests_v51','list_profile_change_requests_v50','list_profile_change_requests_v49','list_profile_change_requests_v47']) {
      if (collected.length) break;
      addRows(await rpcMaybe(fn, {
        p_staff_id: staffId,
        p_user_email: email,
        p_user_id: userId,
        p_is_admin: admin
      }));
    }

    // Direct query fallback. ถ้า RLS อนุญาต จะช่วยให้หน้าเว็บเห็นข้อมูลทันทีแม้ RPC ยังไม่ได้ Run SQL ล่าสุด
    try {
      const direct = admin
        ? await sb.from('profile_change_requests').select('*').order('created_at', { ascending: false })
        : await sb.from('profile_change_requests').select('*').order('created_at', { ascending: false });
      if (!direct.error) addRows(direct.data || []);
      else console.warn('[profile_change_requests] direct query skipped:', direct.error.message || direct.error);
    } catch (err) {
      console.warn('[profile_change_requests] direct query failed:', err);
    }

    collected.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    const visible = admin ? collected : collected.filter(isMineProfileRequest);
    state.profileChangeRequests = visible;
    console.log(`[profile_change_requests ${PATCH}] loaded rows:`, collected.length, 'visible rows:', visible.length, {
      isAdmin: admin,
      staffId,
      userId,
      email
    });
  };

  function renderProfileRequestCard(row, adminMode) {
    const st = staffForProfileRequest(row);
    const status = reqStatus(row);
    const actorName = st?.id ? staffPill(st) : `<span class="staff-color-pill">${escapeHtml(row.email || row.user_email || row.request_email || 'ไม่พบชื่อผู้ส่ง')}</span>`;
    const actions = adminMode && status === 'pending'
      ? `<div class="toolbar"><button class="primary-btn" type="button" onclick="reviewProfileChangeRequest('${row.id}','approved')">อนุมัติ</button><button class="danger-ghost" type="button" onclick="reviewProfileChangeRequest('${row.id}','rejected')">ไม่อนุมัติ</button></div>`
      : `<div class="muted">ผู้ตรวจ: ${row.reviewed_by ? staffPill(row.reviewed_by) : '-'} ${formatThaiDateTime(row.reviewed_at)}</div>${row.review_note ? `<div class="muted">หมายเหตุ Admin: ${escapeHtml(row.review_note)}</div>` : ''}`;
    return `
      <div class="request-card card">
        <div class="section-title">${adminMode ? actorName : profileFieldLabel(row.field_name)} ${badge(profileRequestStatusText(status), profileRequestBadge(status))}</div>
        ${adminMode ? `<p><b>ขอแก้:</b> ${escapeHtml(profileFieldLabel(row.field_name))}</p>` : ''}
        <p><b>ค่าเดิม:</b> ${escapeHtml(row.old_value || '-')}</p>
        <p><b>ค่าใหม่:</b> ${escapeHtml(row.new_value || '-')}</p>
        <p><b>เหตุผล/หมายเหตุ:</b> ${escapeHtml(row.note || '-')}</p>
        <p class="muted">ส่งเมื่อ ${formatThaiDateTime(row.created_at)}</p>
        ${actions}
      </div>`;
  }

  window.renderMyProfilePage = function renderMyProfilePageV54() {
    const p = state.profile || {};
    const myReqs = (state.profileChangeRequests || []).filter(isMineProfileRequest).slice(0, 20);
    return `
      <div class="grid grid-2" id="myProfilePage">
        <div class="card">
          <div class="section-title">ข้อมูลส่วนตัว</div>
          <p class="muted">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p>
          <div class="profile-info-row"><span>ชื่อเล่น</span><b>${escapeHtml(p.nickname || '-')}</b></div>
          <div class="profile-info-row"><span>ชื่อ-สกุล</span><b>${escapeHtml(p.full_name || '-')}</b></div>
          <div class="profile-info-row"><span>เบอร์โทร</span><b>${escapeHtml(p.phone || '-')}</b></div>
          <div class="profile-info-row"><span>Email</span><b>${escapeHtml(p.email || '-')}</b></div>
          <div class="profile-info-row"><span>ชื่อผู้ใช้</span><b>${escapeHtml(p.login_name || '-')}</b></div>
          <form class="grid" onsubmit="saveProfileChangeRequest(this); return false;">
            <div class="form-grid">
              <label>ต้องการแก้ไข
                <select name="field_name" required>
                  <option value="phone">เบอร์โทร</option>
                  <option value="login_name">ชื่อผู้ใช้</option>
                  <option value="nickname">ชื่อเล่น</option>
                  <option value="full_name">ชื่อ-สกุล</option>
                </select>
              </label>
              <label>ข้อมูลใหม่
                <input name="new_value" placeholder="กรอกข้อมูลใหม่" required>
              </label>
            </div>
            <label>เหตุผล/หมายเหตุ
              <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea>
            </label>
            <button class="primary-btn full-btn" type="submit">ส่งคำขอให้ Admin อนุมัติ</button>
          </form>
        </div>
        <div class="card">
          <div class="section-title">คำขอล่าสุดของฉัน</div>
          <div class="request-list">${myReqs.length ? myReqs.map(r => renderProfileRequestCard(r, false)).join('') : empty('ยังไม่มีคำขอ')}</div>
        </div>
      </div>`;
  };

  window.renderProfileRequestsPage = function renderProfileRequestsPageV54() {
    if (!isAdmin()) return noPermission();
    const rows = state.profileChangeRequests || [];
    return `
      <div class="card">
        <div class="section-title">คำขอแก้ไขข้อมูลส่วนตัว</div>
        <p class="muted">Admin ตรวจคำขอจาก staff ก่อนเปลี่ยนข้อมูลจริงในระบบ</p>
        <button class="ghost-btn" type="button" onclick="loadProfileChangeRequests().then(() => renderPage())">รีเฟรชคำขอ</button>
      </div>
      <div class="request-list grid">${rows.length ? rows.map(r => renderProfileRequestCard(r, true)).join('') : empty('ยังไม่มีคำขอ')}</div>`;
  };

  const originalSubmitProfileChangeRequest = window.saveProfileChangeRequest;
  window.saveProfileChangeRequest = async function saveProfileChangeRequestV54(form) {
    const fd = new FormData(form);
    const field = fd.get('field_name');
    const newValue = norm(fd.get('new_value'));
    if (!['phone','login_name','nickname','full_name'].includes(field)) return showToast('เลือกข้อมูลที่ต้องการแก้ไขไม่ถูกต้อง');
    if (!newValue) return showToast('กรุณากรอกข้อมูลใหม่');
    if (field === 'login_name' && !/^[a-zA-Z0-9._-]{1,30}$/.test(newValue)) return showToast('ชื่อผู้ใช้ควรเป็นอังกฤษ/ตัวเลข เช่น user หรือ gift123 หรือ 012345');
    const oldValue = state.profile?.[field] || null;
    if (norm(oldValue) === newValue) return showToast('ข้อมูลใหม่เหมือนข้อมูลเดิม');

    setBusy(true, 'กำลังส่งคำขอ');
    let saved = null;
    let lastError = null;
    const payload = { p_field_name: field, p_new_value: newValue, p_note: fd.get('note') || null };
    for (const fn of ['submit_profile_change_request_v54','submit_profile_change_request_v53','submit_profile_change_request_v47']) {
      try {
        const res = await sb.rpc(fn, payload);
        if (!res.error) { saved = Array.isArray(res.data) ? res.data[0] : res.data; lastError = null; break; }
        lastError = res.error;
      } catch (err) { lastError = err; }
    }
    if (!saved && lastError && originalSubmitProfileChangeRequest && !String(lastError.message || '').includes('Could not find')) {
      try { return await originalSubmitProfileChangeRequest(form); } catch (err) { lastError = err; }
    }
    setBusy(false);
    if (lastError && !saved) return showToast(friendlyDbError(lastError));
    form.reset();
    await loadProfileChangeRequests();
    if (saved && !state.profileChangeRequests.some(r => r.id === saved.id)) state.profileChangeRequests.unshift(saved);
    renderPage();
    showToast('ส่งคำขอให้ Admin แล้ว');
  };

  function noDutyRequestedDays(staffId, startDate, endDate, editingId) {
    const requested = datesBetween(startDate, endDate);
    const all = new Set(requested);
    (state.leaves || [])
      .filter(r => r.type === 'ไม่รับเวร' && !isCancelled(r) && same(r.staff_id, staffId) && !same(r.id, editingId))
      .forEach(r => datesBetween(r.start_date, r.end_date).forEach(d => all.add(d)));
    const byMonth = {};
    all.forEach(ds => {
      const d = parseDate(ds);
      const key = ds.slice(0, 7);
      if (!byMonth[key]) byMonth[key] = { weekend: 0, weekday: 0 };
      if (d.getDay() === 0 || d.getDay() === 6) byMonth[key].weekend += 1;
      else byMonth[key].weekday += 1;
    });
    return byMonth;
  }

  function validateNoDutyQuotaForForm(form) {
    if (isAdmin() && CFG.ADMIN_BYPASS_LEAVE_CLOSE_RULE !== false) return true;
    const values = Array.from(form.elements || []).map(el => el?.value).filter(Boolean);
    if (!values.includes('ไม่รับเวร')) return true;
    const dateInputs = Array.from(form.querySelectorAll('input[type="date"]'));
    const start = dateInputs[0]?.value;
    const end = dateInputs[1]?.value || start;
    if (!start || !end) return true;
    const staffField = form.querySelector('[name="staff_id"], [name="staffId"], select[data-staff-select]');
    const staffId = staffField?.value || currentStaffId();
    const editingId = state.editingLeaveId || null;
    const counts = noDutyRequestedDays(staffId, start, end, editingId);
    const badWeekend = Object.entries(counts).find(([, c]) => c.weekend > NO_DUTY_WEEKEND_LIMIT);
    if (badWeekend) {
      showToast('เดือนนี้ไม่รับเวรเสาร์-อาทิตย์ครบ 2 วันแล้ว', { tone: 'error', title: 'ไม่สำเร็จ' });
      return false;
    }
    const badWeekday = Object.entries(counts).find(([, c]) => c.weekday > NO_DUTY_WEEKDAY_LIMIT);
    if (badWeekday) {
      showToast('เดือนนี้ไม่รับเวรวันธรรมดาครบ 5 วันแล้ว', { tone: 'error', title: 'ไม่สำเร็จ' });
      return false;
    }
    return true;
  }

  document.addEventListener('submit', function (e) {
    const form = e.target;
    if (!(form instanceof HTMLFormElement)) return;
    if (!validateNoDutyQuotaForForm(form)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Reload once after patch is ready so both pages use the patched renderer.
  setTimeout(async () => {
    try {
      if (window.sb || typeof sb !== 'undefined') {
        await loadProfileChangeRequests();
        if (state?.page === 'myProfile' || state?.page === 'profileRequests') renderPage();
      }
    } catch (err) {
      console.warn(`[${PATCH}] initial reload skipped`, err);
    }
  }, 300);

  console.log('CNMI Staff Planner patch V54 loaded');
})();
