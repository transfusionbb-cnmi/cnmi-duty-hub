/* CNMI Duty Hub Patch V72
   - ลดปัญหา refresh แล้วหลุดหน้าเดิมด้วยการจำเมนูล่าสุด
   - เพิ่มหน้า Admin ให้เพิ่ม/แก้/ปิดใช้ตำแหน่งรายวันจากหน้าเว็บได้
   - ไม่แตะ logic คำขอ/แลกเวร/HR เดิม
*/
(function(){
  const PATCH = 'v72-session-position-template';
  const TABLE = 'daily_position_templates';
  const LS_TEMPLATES = 'cnmiDutyPositionTemplates.v72';
  const LS_LAST_PAGE = 'cnmiDutyLastPage.v72';
  const txt = v => String(v ?? '').trim();
  const esc = v => { try { return escapeHtml(v); } catch (_) { return txt(v).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } };
  const byId = id => document.getElementById(id);
  const uid = () => 'local-' + Math.random().toString(36).slice(2) + Date.now().toString(36);

  function baseTemplates(){
    try { return [...ALL_POSITION_TEMPLATES].map((p,i)=>({
      id: p.id || p.eligibility_code || p.code || uid(),
      code: p.code || '',
      eligibility_code: p.eligibility_code || p.code || '',
      zone: p.zone || 'อื่นๆ',
      break_time: p.break_time || '',
      main_rule: p.main_rule || '',
      job_desc: p.job_desc || '',
      is_active: true,
      sort_order: i + 1,
      source: 'base'
    })); } catch (_) { return []; }
  }
  function readLocalTemplates(){
    try { return JSON.parse(localStorage.getItem(LS_TEMPLATES) || '[]') || []; } catch (_) { return []; }
  }
  function writeLocalTemplates(rows){ try { localStorage.setItem(LS_TEMPLATES, JSON.stringify(rows || [])); } catch (_) {} }
  function normalizeTemplate(r, i=0){
    return {
      id: r.id || r.eligibility_code || r.code || uid(),
      code: txt(r.code),
      eligibility_code: txt(r.eligibility_code || r.code),
      zone: txt(r.zone || 'อื่นๆ'),
      break_time: txt(r.break_time || ''),
      main_rule: txt(r.main_rule || ''),
      job_desc: txt(r.job_desc || ''),
      is_active: r.is_active !== false,
      sort_order: Number(r.sort_order || i + 1),
      source: r.source || 'db'
    };
  }
  function mergedTemplates(){
    const local = readLocalTemplates().map(normalizeTemplate);
    const db = (state.positionTemplates || []).map(normalizeTemplate);
    const merged = new Map();
    baseTemplates().forEach(x => merged.set(x.eligibility_code, x));
    local.forEach(x => merged.set(x.eligibility_code, x));
    db.forEach(x => merged.set(x.eligibility_code, x));
    return [...merged.values()].filter(x => x.is_active).sort((a,b)=>(a.sort_order||0)-(b.sort_order||0) || xSort(a,b));
  }
  function allManageTemplates(){
    const db = (state.positionTemplates || []).map(normalizeTemplate);
    const local = readLocalTemplates().map(normalizeTemplate);
    const merged = new Map();
    baseTemplates().forEach(x => merged.set(x.eligibility_code, x));
    local.forEach(x => merged.set(x.eligibility_code, x));
    db.forEach(x => merged.set(x.eligibility_code, x));
    return [...merged.values()].sort((a,b)=>(a.sort_order||0)-(b.sort_order||0) || xSort(a,b));
  }
  function xSort(a,b){ return `${a.zone}|${a.code}`.localeCompare(`${b.zone}|${b.code}`, 'th'); }
  function groupedTemplates(){
    return mergedTemplates().reduce((acc,p)=>{ (acc[p.zone] = acc[p.zone] || []).push(p); return acc; }, {});
  }
  async function loadPositionTemplates(){
    state.positionTemplatesTableReady = false;
    state.positionTemplates = [];
    if (!window.sb && typeof sb === 'undefined') return;
    try {
      const client = window.sb || sb;
      const { data, error } = await client.from(TABLE).select('*').order('sort_order', { ascending:true }).order('zone').order('code');
      if (error) throw error;
      state.positionTemplatesTableReady = true;
      state.positionTemplates = (data || []).map(normalizeTemplate);
      if (!state.positionTemplates.length && typeof isAdmin === 'function' && isAdmin()) await seedPositionTemplates();
    } catch (err) {
      console.warn(`[${PATCH}] ${TABLE} not ready, using built-in/local templates`, err?.message || err);
      state.positionTemplatesTableReady = false;
      state.positionTemplates = readLocalTemplates().map(normalizeTemplate);
    }
  }
  async function seedPositionTemplates(){
    try {
      const client = window.sb || sb;
      const rows = baseTemplates().map((p,i)=>({
        code:p.code, eligibility_code:p.eligibility_code, zone:p.zone, break_time:p.break_time,
        main_rule:p.main_rule, job_desc:p.job_desc, is_active:true, sort_order:i+1, updated_by:currentStaffId()
      }));
      const { error } = await client.from(TABLE).upsert(rows, { onConflict:'eligibility_code' });
      if (error) throw error;
      const { data } = await client.from(TABLE).select('*').order('sort_order', { ascending:true });
      state.positionTemplates = (data || []).map(normalizeTemplate);
      state.positionTemplatesTableReady = true;
    } catch (err) { console.warn(`[${PATCH}] seed failed`, err?.message || err); }
  }

  const oldLoadAllData = window.loadAllData || (typeof loadAllData === 'function' ? loadAllData : null);
  if (oldLoadAllData) {
    window.loadAllData = loadAllData = async function loadAllDataV71(){
      await oldLoadAllData();
      await loadPositionTemplates();
    };
  }

  const oldEnterApp = window.enterApp || (typeof enterApp === 'function' ? enterApp : null);
  if (oldEnterApp) {
    window.enterApp = enterApp = async function enterAppV71(){
      const res = await oldEnterApp();
      try {
        const saved = localStorage.getItem(LS_LAST_PAGE);
        if (saved && NAV_ITEMS.some(x => x.id === saved) && state.page !== saved) { state.page = saved; renderPage(); }
      } catch (_) {}
      return res;
    };
  }

  function templateByIdOrKey(key){
    return allManageTemplates().find(x => txt(x.id) === txt(key) || txt(x.eligibility_code) === txt(key));
  }
  function templateForm(editing=null){
    return `<form id="positionTemplateForm" class="form-grid v71-template-form">
      <input type="hidden" name="id" value="${esc(editing?.id || '')}">
      <label>รหัสตำแหน่ง <input name="code" value="${esc(editing?.code || '')}" placeholder="เช่น DR-Registration" required></label>
      <label>รหัสสิทธิ์ <input name="eligibility_code" value="${esc(editing?.eligibility_code || editing?.code || '')}" placeholder="ปกติใช้เหมือนรหัสตำแหน่ง" required></label>
      <label>กลุ่มงาน <input name="zone" value="${esc(editing?.zone || '')}" placeholder="เช่น Blood Bank / Donor Room" required></label>
      <label>เวลาพัก <input name="break_time" value="${esc(editing?.break_time || '')}" placeholder="เช่น 12:00"></label>
      <label class="wide">กติกาคนที่ทำได้ <input name="main_rule" value="${esc(editing?.main_rule || '')}" placeholder="เช่น MT เท่านั้น / MT + พี่เลี้ยง"></label>
      <label>ลำดับแสดงผล <input name="sort_order" type="number" value="${esc(editing?.sort_order || '')}" placeholder="เช่น 10"></label>
      <label>สถานะ <select name="is_active"><option value="true" ${editing?.is_active !== false ? 'selected':''}>ใช้งาน</option><option value="false" ${editing?.is_active === false ? 'selected':''}>ซ่อน/ไม่ใช้งาน</option></select></label>
      <label class="wide">รายละเอียดงาน <textarea name="job_desc" placeholder="อธิบายงานของตำแหน่งนี้">${esc(editing?.job_desc || '')}</textarea></label>
      <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไขตำแหน่ง' : 'เพิ่มตำแหน่งรายวัน'}</button>
      ${editing ? '<button class="ghost-btn wide" type="button" data-v71-cancel-template-edit>ยกเลิกแก้ไข</button>' : ''}
      <p class="hint wide">ถ้าต้องการซ่อนตำแหน่งเดิม แนะนำเปลี่ยนสถานะเป็น “ซ่อน/ไม่ใช้งาน” แทนการลบทิ้ง เพื่อไม่กระทบประวัติเก่า</p>
    </form>`;
  }
  function manageTemplateList(){
    const rows = allManageTemplates();
    if (!rows.length) return empty('ยังไม่มีตำแหน่งรายวัน');
    return `<div class="table-wrap v71-template-table"><table><thead><tr><th>ตำแหน่ง</th><th>กลุ่ม</th><th>กติกา</th><th>รายละเอียด</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${rows.map(r=>`<tr>
      <td><b>${esc(r.code)}</b><br><span class="muted">${esc(r.eligibility_code)}</span></td>
      <td>${esc(r.zone)}<br><span class="muted">พัก ${esc(r.break_time || '-')}</span></td>
      <td>${esc(r.main_rule || '-')}</td>
      <td>${esc(r.job_desc || '-')}</td>
      <td>${badge(r.is_active ? 'ใช้งาน' : 'ซ่อน', r.is_active ? 'green':'black')}</td>
      <td><button class="tiny-btn" data-v71-edit-template="${esc(r.id)}">แก้ไข</button><button class="tiny-btn danger" data-v71-disable-template="${esc(r.id)}">ซ่อน</button></td>
    </tr>`).join('')}</tbody></table></div>`;
  }

  window.renderEligibilityPage = renderEligibilityPage = function renderEligibilityPageV71(){
    if (!isAdmin()) return noPermission();
    const activeStaff = orderedStaff(state.staff.filter(s => s.is_active));
    if (!activeStaff.length) return empty('ยังไม่มีเจ้าหน้าที่ active');
    if (!state.eligibilityStaffId || !activeStaff.some(s => s.id === state.eligibilityStaffId)) state.eligibilityStaffId = activeStaff[0].id;
    const selected = activeStaff.find(s => s.id === state.eligibilityStaffId) || activeStaff[0];
    const grouped = groupedTemplates();
    const editing = state.editingPositionTemplateId ? templateByIdOrKey(state.editingPositionTemplateId) : null;
    return `<div class="grid eligibility-page">
      <div class="card eligibility-staff-panel">
        <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
        <label>เจ้าหน้าที่
          <select id="eligibilityStaffSelect">${activeStaff.map(s => `<option value="${esc(s.id)}" ${selected.id===s.id?'selected':''}>${esc(s.nickname || s.full_name)} (${esc(s.staff_type || '-')})</option>`).join('')}</select>
        </label>
        <div class="selected-staff-card" style="--staff-bg:${staffColor(selected)};--staff-fg:${textColorFor(staffColor(selected))}">
          <div class="big-staff-name">${esc(selected.nickname || selected.full_name)}</div>
          <div>${esc(selected.full_name || '')}</div>
          <small>${esc(selected.staff_type || '-')} • ${esc(selected.position_training_status || 'ใช้งานปกติ')}</small>
        </div>
      </div>
      <div class="card eligibility-position-panel">
        <div class="section-title">
          <div><h3>สิทธิ์ตำแหน่งรายวันของ ${esc(selected.nickname || selected.full_name)}</h3><p class="hint">ติ๊กเฉพาะตำแหน่งที่ขึ้นงานได้จริง ระบบ Auto Assign จะใช้ข้อมูลนี้เป็นตัวกรองหลัก</p></div>
          <button class="primary-btn" data-save-position-eligibility>บันทึกสิทธิ์ตำแหน่ง</button>
        </div>
        <div class="position-card-grid">
          ${Object.entries(grouped).map(([zone, positions]) => `<div class="position-zone-card"><h4>${esc(zone)}</h4>${positions.map(p => {
            const eligibilityKey = p.eligibility_code || p.code;
            const checked = positionEligible(selected, eligibilityKey);
            const ruleOk = positionRuleOk(selected, p.main_rule);
            return `<label class="position-check ${checked?'checked':''} ${ruleOk?'':'rule-mismatch'}">
              <input type="checkbox" data-eligibility data-staff-id="${selected.id}" data-position-code="${esc(eligibilityKey)}" ${checked?'checked':''}>
              <span><b>${esc(p.code)}</b><small>${esc(p.main_rule || '-')}${ruleOk ? '' : ' • ไม่ตรงผู้ปฏิบัติหลัก'}</small><em>${esc(p.job_desc || '')}</em></span>
            </label>`;
          }).join('')}</div>`).join('')}
        </div>
      </div>
      <div class="card wide-card v71-template-admin">
        <div class="section-title"><div><h3>จัดการรายละเอียดตำแหน่งรายวัน</h3><p class="hint">Admin เพิ่ม/แก้ไข/ซ่อนตำแหน่งได้จากหน้าเว็บ</p></div>${state.positionTemplatesTableReady ? badge('บันทึกใน Supabase','green') : badge('โหมดเครื่องนี้ / ต้อง Run SQL V71 เพื่อใช้ร่วมกัน','orange')}</div>
        ${templateForm(editing)}
        <hr class="soft-sep">
        ${manageTemplateList()}
      </div>
    </div>`;
  };

  async function savePositionTemplate(form){
    if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น', { tone:'error' });
    const fd = new FormData(form);
    const row = {
      code: txt(fd.get('code')),
      eligibility_code: txt(fd.get('eligibility_code') || fd.get('code')),
      zone: txt(fd.get('zone')),
      break_time: txt(fd.get('break_time')),
      main_rule: txt(fd.get('main_rule')),
      job_desc: txt(fd.get('job_desc')),
      sort_order: Number(fd.get('sort_order') || 999),
      is_active: fd.get('is_active') === 'true',
      updated_by: currentStaffId()
    };
    const editId = txt(fd.get('id'));
    if (!row.code || !row.eligibility_code || !row.zone) return showToast('กรุณากรอกตำแหน่ง รหัสสิทธิ์ และกลุ่มงาน', { tone:'error' });
    if (state.positionTemplatesTableReady) {
      const client = window.sb || sb;
      let error;
      if (editId && !editId.startsWith('local-') && !['base'].includes(editId)) {
        ({ error } = await client.from(TABLE).update(row).eq('id', editId));
      } else {
        ({ error } = await client.from(TABLE).upsert(row, { onConflict:'eligibility_code' }));
      }
      if (error) return showToast(error.message || 'บันทึกตำแหน่งไม่สำเร็จ', { tone:'error' });
      await loadPositionTemplates();
    } else {
      const rows = allManageTemplates().filter(x => x.source !== 'base' || x.eligibility_code !== row.eligibility_code);
      const idx = rows.findIndex(x => txt(x.id) === editId || txt(x.eligibility_code) === row.eligibility_code);
      const saveRow = normalizeTemplate({ ...row, id: editId || uid(), source:'local' });
      if (idx >= 0) rows[idx] = saveRow; else rows.push(saveRow);
      writeLocalTemplates(rows);
      state.positionTemplates = rows;
    }
    state.editingPositionTemplateId = null;
    renderPage();
    showToast('บันทึกตำแหน่งรายวันแล้ว');
  }
  async function disableTemplate(key){
    if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น', { tone:'error' });
    const r = templateByIdOrKey(key);
    if (!r) return showToast('ไม่พบตำแหน่งนี้', { tone:'error' });
    const ok = await confirmDialog(`ซ่อนตำแหน่ง ${r.code} จากหน้าสิทธิ์ตำแหน่งรายวันหรือไม่?`, 'ยืนยันซ่อนตำแหน่ง');
    if (!ok) return;
    if (state.positionTemplatesTableReady && r.source !== 'base' && !String(r.id).startsWith('local-')) {
      const client = window.sb || sb;
      const { error } = await client.from(TABLE).update({ is_active:false, updated_by:currentStaffId() }).eq('id', r.id);
      if (error) return showToast(error.message || 'ซ่อนตำแหน่งไม่สำเร็จ', { tone:'error' });
      await loadPositionTemplates();
    } else {
      const rows = allManageTemplates();
      const idx = rows.findIndex(x => txt(x.id) === txt(r.id) || txt(x.eligibility_code) === txt(r.eligibility_code));
      if (idx >= 0) rows[idx] = { ...rows[idx], is_active:false, source:'local' };
      else rows.push({ ...r, is_active:false, source:'local' });
      writeLocalTemplates(rows);
      state.positionTemplates = rows;
    }
    renderPage();
    showToast('ซ่อนตำแหน่งแล้ว');
  }

  document.addEventListener('click', function(e){
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn?.dataset?.page) { try { localStorage.setItem(LS_LAST_PAGE, pageBtn.dataset.page); } catch (_) {} }
  }, true);
  document.addEventListener('submit', async function(e){
    if (e.target?.id === 'positionTemplateForm') { e.preventDefault(); await savePositionTemplate(e.target); }
  }, true);
  document.addEventListener('click', async function(e){
    const edit = e.target.closest('[data-v71-edit-template]');
    if (edit) { e.preventDefault(); state.editingPositionTemplateId = edit.dataset.v71EditTemplate; renderPage(); return; }
    const dis = e.target.closest('[data-v71-disable-template]');
    if (dis) { e.preventDefault(); await disableTemplate(dis.dataset.v71DisableTemplate); return; }
    if (e.target.closest('[data-v71-cancel-template-edit]')) { e.preventDefault(); state.editingPositionTemplateId = null; renderPage(); }
  }, true);

  const st = document.createElement('style');
  st.id = 'v71-position-template-style';
  st.textContent = `
    .wide-card{grid-column:1 / -1;}
    .v71-template-form textarea{min-height:76px;}
    .v71-template-table td{vertical-align:top;}
    .soft-sep{border:0;border-top:1px solid rgba(148,163,184,.24);margin:18px 0;}
    @media(max-width:820px){.v71-template-admin{display:none;}}
  `;
  document.head.appendChild(st);

  console.info(`CNMI Staff Planner ${PATCH} loaded`);
})();


/* V72: reset link + page refresh safety add-on */
(function(){
  const LS_LAST_PAGE = 'cnmiDutyLastPage.v72';
  function safePathBase(){
    const p = window.location.pathname.endsWith('/') ? window.location.pathname : window.location.pathname + '/';
    return window.location.origin + p;
  }
  if (typeof authRedirectUrl === 'function') {
    window.authRedirectUrl = authRedirectUrl = function authRedirectUrlV72(mode=''){
      const base = safePathBase();
      return mode ? `${base}?mode=${encodeURIComponent(mode)}` : base;
    };
  }
  if (typeof requestPasswordSetupLink === 'function') {
    window.requestPasswordSetupLink = requestPasswordSetupLink = async function requestPasswordSetupLinkV73(email){
      const cleanEmail = String(email || '').trim().toLowerCase();
      const redirectTo = authRedirectUrl('recovery');

      // V73 FIX: ต้องให้ Apps Script เป็นทางหลักเสมอ
      // เพราะ Supabase resetPasswordForEmail อาจตอบว่าสำเร็จแม้ยังไม่มี Auth user
      // ทำให้ผู้ใช้เห็น Pop-up สำเร็จ แต่ไม่มีอีเมลเข้า
      if (CFG.APP_SCRIPT_URL) {
        const res = await fetch(CFG.APP_SCRIPT_URL, {
          method:'POST',
          headers:{ 'Content-Type':'text/plain;charset=utf-8' },
          body: JSON.stringify({ action:'requestPasswordLink', email: cleanEmail, redirectTo })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || data.ok === false) throw new Error(data.message || 'ส่งลิงก์ตั้งรหัสผ่านไม่สำเร็จ');
        return { ok:true, sentBy: data.sentBy || 'MailApp', ...data };
      }

      // กรณีไม่มี Apps Script URL: ใช้ Supabase ได้เฉพาะคนที่มี Auth user อยู่แล้ว
      const { data: profile, error: profileError } = await sb
        .from('staff_profiles')
        .select('id,email,is_active')
        .ilike('email', cleanEmail)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile || profile.is_active === false) throw new Error('ไม่พบอีเมลนี้ในรายชื่อเจ้าหน้าที่ หรือบัญชีถูกปิดใช้งาน');

      const direct = await sb.auth.resetPasswordForEmail(cleanEmail, { redirectTo });
      if (direct.error) throw direct.error;
      return { ok:true, sentBy:'Supabase' };
    };
  }
  if (typeof resetUserPassword === 'function') {
    window.resetUserPassword = resetUserPassword = async function resetUserPasswordV72(email){
      if (!email) return showToast('ยังไม่มีอีเมลของผู้ใช้นี้', { tone:'error' });
      if (!(await confirmDialog(`ส่งลิงก์ตั้งรหัสผ่านไปที่ ${email}?`, 'ส่งลิงก์ตั้งรหัสผ่าน'))) return;
      try {
        await requestPasswordSetupLink(String(email).trim().toLowerCase());
        showToast('ส่งลิงก์ตั้งรหัสผ่านแล้ว กรุณาเช็ก Inbox / Spam');
      } catch (err) {
        showToast(err.message || 'ส่งลิงก์ไม่สำเร็จ', { tone:'error' });
      }
    };
  }
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-page]');
    if (btn?.dataset?.page) {
      try { localStorage.setItem(LS_LAST_PAGE, btn.dataset.page); } catch(_) {}
    }
  }, true);
})();
