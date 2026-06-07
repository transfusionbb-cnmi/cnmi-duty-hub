/* CNMI Staff Planner Patch V59
   - เพิ่มตัวกรองรายการลา/ไม่รับเวร: ชื่อ, วันที่, เดือน, ปี, ประเภท
   - เพิ่มตัวกรองกิจกรรม: ผู้เข้าร่วม, วันที่, เดือน, ปี, ประเภท
   - จัดระยะฟอร์มข้อมูลส่วนตัวไม่ให้ตัวหนังสือชนกัน
   - ปรับคำอธิบายใน Pop-up ขอแลก/ขาย/ยกเวร กรณีตกลงกันเอง
   - ปรับกติกา Auto Assign: เวร ชบด เป็น hard rule ห้ามติดกัน ส่วนเวรอื่นพยายามเลี่ยงก่อน ถ้าเลี่ยงไม่ได้จึงยอมให้ติดได้
*/
(function(){
  const PATCH = 'V59_FILTERS_DUTY_RULES';
  const id = (v)=>String(v ?? '').trim();
  const low = (v)=>id(v).toLowerCase();
  const esc = (v)=>{ try { return escapeHtml(v); } catch(e){ return id(v).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); } };
  const $id = (x)=>document.getElementById(x);

  function injectStyle(){
    if ($id('v59Style')) return;
    const st = document.createElement('style');
    st.id = 'v59Style';
    st.textContent = `
      .v59-filter-grid{display:grid;grid-template-columns:repeat(5,minmax(120px,1fr));gap:10px;align-items:end;margin:12px 0 16px;}
      .v59-filter-grid label{margin:0!important;}
      .v59-filter-grid input,.v59-filter-grid select{width:100%;}
      .v59-filter-grid .ghost-btn{height:44px;white-space:nowrap;}
      .activity-list-card,.leave-list-card{max-height:calc(100vh - 230px);overflow:auto;}
      .activity-card-list,.leave-filtered-list{display:flex;flex-direction:column;gap:12px;}
      .activity-row-card{border:1px solid rgba(148,163,184,.24);border-radius:18px;padding:14px 16px;background:#fff;}
      .activity-row-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px;}
      .activity-row-detail{display:grid;grid-template-columns:92px minmax(0,1fr);gap:8px;margin:5px 0;line-height:1.55;}
      .activity-row-detail span{color:#64748b;}
      #myProfilePage .compact-form{display:grid!important;grid-template-columns:minmax(150px,220px) minmax(0,1fr)!important;gap:14px 16px!important;align-items:end!important;margin-top:18px!important;}
      #myProfilePage .compact-form label{display:flex!important;flex-direction:column!important;gap:7px!important;min-width:0!important;line-height:1.45!important;}
      #myProfilePage .compact-form .wide{grid-column:1 / -1!important;}
      #myProfilePage .compact-form textarea{min-height:84px!important;resize:vertical!important;}
      #myProfilePage .compact-form button.wide{min-height:48px!important;line-height:1.3!important;white-space:normal!important;}
      .trade-selfpay-note{background:#eff6ff;border:1px solid #bfdbfe;border-radius:16px;padding:12px 14px;line-height:1.65;margin-top:8px;color:#334155;}
      @media(max-width:1100px){.v59-filter-grid{grid-template-columns:repeat(2,minmax(0,1fr));}.v59-filter-grid .ghost-btn{grid-column:1/-1;}}
      @media(max-width:720px){.v59-filter-grid{grid-template-columns:1fr;}#myProfilePage .compact-form{grid-template-columns:1fr!important;}.activity-row-head{display:block;}.activity-row-detail{grid-template-columns:78px minmax(0,1fr);}.activity-list-card,.leave-list-card{max-height:none;}}
    `;
    document.head.appendChild(st);
  }
  injectStyle();

  function staffList(){ return (typeof orderedStaff === 'function' ? orderedStaff(state.staff || []) : (state.staff || [])); }
  function staffOptionsFilter(selected){ return `<option value="">ทุกคน</option>${staffList().map(s=>`<option value="${esc(s.id)}" ${selected===s.id?'selected':''}>${esc(s.nickname || s.full_name || s.email || '-')}</option>`).join('')}`; }
  function toArr(v){
    if (Array.isArray(v)) return v;
    if (!v) return [];
    try { const p = JSON.parse(v); return Array.isArray(p) ? p : []; } catch(e){ return String(v).split(',').map(x=>x.trim()).filter(Boolean); }
  }
  function overlapsRange(rowStart,rowEnd,date){
    if (!date) return true;
    const s = id(rowStart), e = id(rowEnd || rowStart);
    return s <= date && e >= date;
  }
  function monthOverlap(rowStart,rowEnd,month){
    if (!month) return true;
    const s = id(rowStart), e = id(rowEnd || rowStart);
    return s.slice(0,7) <= month && e.slice(0,7) >= month;
  }
  function yearOverlap(rowStart,rowEnd,year){
    if (!year) return true;
    const s = id(rowStart), e = id(rowEnd || rowStart);
    return s.slice(0,4) <= String(year) && e.slice(0,4) >= String(year);
  }
  function resetBtn(kind){ return `<button class="ghost-btn" type="button" data-v59-reset-filter="${kind}">ล้างตัวกรอง</button>`; }

  window.renderLeavePage = function renderLeavePageV59(){
    injectStyle();
    const editing = state.editingLeaveId ? (state.leaves || []).find(x => x.id === state.editingLeaveId) : null;
    const selectedStaff = editing?.staff_id || (typeof currentStaffId === 'function' ? currentStaffId() : '');
    const selectedPhone = editing?.contact_phone || (typeof staffPhone === 'function' ? staffPhone(selectedStaff) : '');
    const staffFilter = state.leaveFilterStaff || '';
    const dateFilter = state.leaveFilterDate || '';
    const monthFilter = state.leaveFilterMonth || '';
    const yearFilter = state.leaveFilterYear || '';
    const typeFilter = state.leaveFilterType || '';
    const rows = [...(state.leaves || [])]
      .filter(x => (typeof isAdmin === 'function' && isAdmin()) || x.staff_id === (typeof currentStaffId === 'function' ? currentStaffId() : ''))
      .filter(x => !staffFilter || x.staff_id === staffFilter)
      .filter(x => !typeFilter || x.type === typeFilter)
      .filter(x => overlapsRange(x.start_date, x.end_date, dateFilter))
      .filter(x => monthOverlap(x.start_date, x.end_date, monthFilter))
      .filter(x => yearOverlap(x.start_date, x.end_date, yearFilter))
      .sort((a,b)=>String(b.start_date||'').localeCompare(String(a.start_date||'')) || String(a.staff_id||'').localeCompare(String(b.staff_id||'')));
    return `
      <div class="grid grid-2">
        <div class="card">
          <div class="section-title"><h3>${editing ? 'แก้ไขรายการ' : 'แจ้งลา / ไม่รับเวร'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-leave>ยกเลิกแก้ไข</button>' : ''}</div>
          <form id="leaveForm" class="form-grid">
            ${(typeof isAdmin === 'function' && isAdmin()) ? `<label class="wide">บันทึกให้เจ้าหน้าที่ <select name="staff_id" id="leaveStaffSelect" required>${staffOptions(selectedStaff)}</select><span class="hint">Admin เพิ่ม/แก้/ยกเลิกแทน staff ได้ รวมถึงย้อนหลัง</span></label>` : ''}
            <label>ประเภท <select name="type" required>${LEAVE_TYPES.map(t => `<option ${editing?.type===t?'selected':''}>${t}</option>`).join('')}</select></label>
            <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
            <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
            <label>ช่วงเวลา <select name="leave_period">${['เต็มวัน','ครึ่งเช้า 08:00-12:30','ครึ่งบ่าย 11:30-16:00'].map(v => `<option value="${v}" ${(editing?.leave_period || 'เต็มวัน')===v?'selected':''}>${v}</option>`).join('')}</select></label>
            <label>เบอร์ติดต่อระหว่างลา <input name="contact_phone" id="leaveContactPhone" value="${esc(selectedPhone || '')}" placeholder="ระบบเติมจากข้อมูลเจ้าหน้าที่ให้อัตโนมัติ"></label>
            <label>แนบไฟล์ (ถ้ามี) <input name="file" type="file"><span class="hint">ไม่บังคับแนบไฟล์</span></label>
            ${(typeof isAdmin === 'function' && isAdmin()) ? `<label class="wide">เหตุผลที่ Admin บันทึกแทน / ย้อนหลัง <textarea name="admin_record_reason" placeholder="เช่น น้องไม่สะดวกเข้าระบบ / แจ้งทางโทรศัพท์">${esc(editing?.admin_record_reason || '')}</textarea></label>` : ''}
            <label class="wide">หมายเหตุ <textarea name="note" placeholder="ระบุรายละเอียดเพิ่มเติม">${esc(editing?.note || '')}</textarea></label>
            <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</button>
          </form>
        </div>
        <div class="card leave-list-card">
          <div class="section-title"><h3>รายการของ${(typeof isAdmin === 'function' && isAdmin()) ? 'ทุกคน' : 'ฉัน'}</h3>${typeof badge==='function'?badge(`${rows.length} รายการ`, rows.length ? 'blue':'black'):''}</div>
          <div class="v59-filter-grid">
            <label>ชื่อ <select id="leaveFilterStaff">${staffOptionsFilter(staffFilter)}</select></label>
            <label>วันที่ <input id="leaveFilterDate" type="date" value="${esc(dateFilter)}"></label>
            <label>เดือน <input id="leaveFilterMonth" type="month" value="${esc(monthFilter)}"></label>
            <label>ปี <input id="leaveFilterYear" type="number" min="2020" max="2100" placeholder="เช่น 2026" value="${esc(yearFilter)}"></label>
            <label>ประเภท <select id="leaveFilterType"><option value="">ทุกประเภท</option>${LEAVE_TYPES.map(t=>`<option value="${esc(t)}" ${typeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
            ${resetBtn('leave')}
          </div>
          ${rows.length ? renderLeaveTable(rows) : empty('ไม่พบรายการตามตัวกรอง')}
        </div>
      </div>`;
  };

  function renderActivityCardsV59(rows){
    return `<div class="activity-card-list">${rows.map(r=>{
      const participants = toArr(r.participant_ids).map(typeof staffNick==='function'?staffNick:(x=>x)).filter(Boolean).join(', ') || '-';
      const time = [r.start_time, r.end_time].filter(Boolean).join(' - ') || '-';
      const canEdit = (typeof isAdmin === 'function' && isAdmin()) || r.created_by === (typeof currentStaffId==='function'?currentStaffId():'') || r.owner_id === (typeof currentStaffId==='function'?currentStaffId():'');
      return `<div class="activity-row-card">
        <div class="activity-row-head"><div><b>${esc(r.title)}</b><br>${badge(r.event_type, activityClass(r.event_type))}</div><span class="muted">${formatThaiDate(r.start_date)}${r.end_date && r.end_date !== r.start_date ? ` - ${formatThaiDate(r.end_date)}` : ''}</span></div>
        <div class="activity-row-detail"><span>เวลา</span><b>${esc(time)}</b></div>
        <div class="activity-row-detail"><span>สถานที่</span><b>${esc(r.location || '-')}</b></div>
        <div class="activity-row-detail"><span>ผู้รับผิดชอบ</span><b>${esc(staffNick(r.owner_id) || '-')}</b></div>
        <div class="activity-row-detail"><span>ผู้เข้าร่วม</span><b>${esc(participants)}</b></div>
        <div class="actions">${canEdit ? `<button class="tiny-btn" data-edit-activity="${esc(r.id)}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${esc(r.id)}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}</div>
      </div>`;
    }).join('')}</div>`;
  }

  window.renderActivitiesPage = function renderActivitiesPageV59(){
    injectStyle();
    const editing = state.editingActivityId ? (state.activities || []).find(x => x.id === state.editingActivityId) : null;
    const personFilter = state.activityFilterParticipant || '';
    const dateFilter = state.activityFilterDate || '';
    const monthFilter = state.activityFilterMonth || '';
    const yearFilter = state.activityFilterYear || '';
    const typeFilter = state.activityFilterType || '';
    const rows = [...(state.activities || [])]
      .filter(r => !personFilter || r.owner_id === personFilter || toArr(r.participant_ids).includes(personFilter))
      .filter(r => !typeFilter || r.event_type === typeFilter)
      .filter(r => overlapsRange(r.start_date, r.end_date, dateFilter))
      .filter(r => monthOverlap(r.start_date, r.end_date, monthFilter))
      .filter(r => yearOverlap(r.start_date, r.end_date, yearFilter))
      .sort((a,b)=>String(a.start_date||'').localeCompare(String(b.start_date||'')) || String(a.start_time||'').localeCompare(String(b.start_time||'')) || String(a.title||'').localeCompare(String(b.title||'')));
    return `<div class="grid grid-2 activities-v59">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมหน่วยงาน'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-activity>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="activityForm" class="form-grid">
          <label class="wide">รายละเอียดกิจกรรม <input name="title" value="${esc(editing?.title || '')}" placeholder="เช่น ประชุมทีม / ออกหน่วยที่..." required></label>
          <label>ประเภท <select name="event_type" required>${ACTIVITY_TYPES.map(t => `<option ${editing?.event_type===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>สถานที่ <input name="location" list="activityLocationList" value="${esc(editing?.location || '')}" placeholder="เลือกหรือพิมพ์เอง" required></label><datalist id="activityLocationList">${ACTIVITY_LOCATIONS.map(x => `<option value="${esc(x)}"></option>`).join('')}</datalist>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เวลาเริ่ม <input name="start_time" type="time" value="${editing?.start_time || ''}" required></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" value="${editing?.end_time || ''}" required></label>
          <label>ผู้รับผิดชอบ <select name="owner_id" required><option value="">เลือกผู้รับผิดชอบ</option>${staffOptions(editing?.owner_id || currentStaffId())}</select></label>
          <label>เอกสารแนบ <input name="file" type="file"></label>
          <div class="wide"><div class="field-label">ผู้เข้าร่วม</div>${renderParticipantCheckboxes(toArr(editing?.participant_ids))}</div>
          <label class="wide">หมายเหตุเพิ่มเติม <textarea name="note" placeholder="ถ้ามี เช่น จำนวนคน / รายละเอียดเสริม">${esc(editing?.note || '')}</textarea></label>
          <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกกิจกรรม'}</button>
        </form>
      </div>
      <div class="card activity-list-card">
        <div class="section-title"><h3>กิจกรรมทั้งหมด</h3>${typeof badge==='function'?badge(`${rows.length} รายการ`, rows.length ? 'blue':'black'):''}</div>
        <div class="v59-filter-grid">
          <label>ผู้เข้าร่วม <select id="activityFilterParticipant">${staffOptionsFilter(personFilter)}</select></label>
          <label>วันที่ <input id="activityFilterDate" type="date" value="${esc(dateFilter)}"></label>
          <label>เดือน <input id="activityFilterMonth" type="month" value="${esc(monthFilter)}"></label>
          <label>ปี <input id="activityFilterYear" type="number" min="2020" max="2100" placeholder="เช่น 2026" value="${esc(yearFilter)}"></label>
          <label>ประเภท <select id="activityFilterType"><option value="">ทุกประเภท</option>${ACTIVITY_TYPES.map(t => `<option value="${esc(t)}" ${typeFilter===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label>
          ${resetBtn('activity')}
        </div>
        ${rows.length ? renderActivityCardsV59(rows) : empty('ไม่พบกิจกรรมตามตัวกรอง')}
      </div>
    </div>`;
  };

  // Trade modal: ช่วยอธิบาย flow กรณีตกลงกันเองให้ staff เข้าใจว่าแตะ/ยืนยันได้ แต่ตารางจะเปลี่ยนหลัง Admin บันทึก
  const oldShowTradeModal = window.showTradeModal;
  window.showTradeModal = function showTradeModalV59(slotId){
    if (oldShowTradeModal) oldShowTradeModal(slotId);
    setTimeout(()=>{
      const body = $id('modalBody');
      if (!body || body.querySelector('.trade-selfpay-note')) return;
      const rateWrap = body.querySelector('#tradeRateWrap');
      if (rateWrap) rateWrap.insertAdjacentHTML('afterend', `<div class="wide trade-selfpay-note"><b>กรณีตกลงกันเอง / จ่ายกันเอง:</b> อีกฝ่ายกดยืนยันในแอพได้ตามปกติ จากนั้น Admin ต้องกด “บันทึกเปลี่ยนเวร” ก่อน ตารางจึงเปลี่ยนเป็นชื่อคนที่มาทำเวรจริง และคนนั้นใช้ลงชื่ออยู่เวรวันนั้นได้</div>`);
    },0);
  };

  // Hard rule เฉพาะ ชบด ห้ามติดกัน; เวรอื่นใช้เป็น soft rule ใน Auto Assign
  function isChbd(code){ return /^ชบด/.test(id(code)); }
  function slotKey(a){ return a?.id || a?._temp_id || ''; }
  function dutyOnDate(staffId, date, assignments, excludeSlot){
    const ex = slotKey(excludeSlot);
    const all = [...(assignments || []), ...(state.rosterAssignments || [])];
    return all.filter(a => a && a.staff_id === staffId && a.duty_date === date && (!ex || slotKey(a) !== ex));
  }
  function anyAdjacentDuty(staffId, date, assignments, excludeSlot){
    const d = parseDate(date); const p = new Date(d); p.setDate(d.getDate()-1); const n = new Date(d); n.setDate(d.getDate()+1);
    return dutyOnDate(staffId, toDateInput(p), assignments, excludeSlot).length || dutyOnDate(staffId, toDateInput(n), assignments, excludeSlot).length;
  }
  function hardAdjacentDuty(staffId, date, assignments, excludeSlot){
    const d = parseDate(date); const p = new Date(d); p.setDate(d.getDate()-1); const n = new Date(d); n.setDate(d.getDate()+1);
    const currentIsChbd = isChbd(excludeSlot?.duty_code || excludeSlot?.duty_type || excludeSlot?.duty || '');
    const adj = [...dutyOnDate(staffId, toDateInput(p), assignments, excludeSlot), ...dutyOnDate(staffId, toDateInput(n), assignments, excludeSlot)];
    return currentIsChbd ? adj.length > 0 : adj.some(a => isChbd(a.duty_code || a.duty_type || a.duty || ''));
  }
  window.hasAdjacentDuty = function hasAdjacentDutyV59(staffId, date, assignments=[], excludeSlot=null){ return !!hardAdjacentDuty(staffId, date, assignments, excludeSlot); };

  window.autoAssignRoster = function autoAssignRosterV59(){
    if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
    const assignments = state.rosterDraft.assignments;
    const counts = calcFairness(assignments.filter(x => x.staff_id));
    let unfilled = 0, softAdjacentUsed = 0;
    assignments.forEach(slot => {
      if (slot.is_locked || slot.staff_id) return;
      const wk = weekKeyOf(slot.duty_date);
      const baseCandidates = (state.staff || []).filter(s => isRosterEnabled(s) && supportsRequiredRole(s, slot.required_role) && !(state.leaves || []).some(l => l.staff_id === s.id && overlapsDate(l, slot.duty_date)) && !hasSameDayDuty(s.id, slot.duty_date, assignments, slot));
      let candidates = baseCandidates.filter(s => !hardAdjacentDuty(s.id, slot.duty_date, assignments, slot)).filter(s => !anyAdjacentDuty(s.id, slot.duty_date, assignments, slot));
      if (!candidates.length) {
        candidates = baseCandidates.filter(s => !hardAdjacentDuty(s.id, slot.duty_date, assignments, slot));
        if (candidates.length) softAdjacentUsed++;
      }
      candidates.sort((a,b) => {
        const ca = counts[a.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
        const cb = counts[b.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
        return ((ca.pay || 0) - (cb.pay || 0)) || ((ca.hours||0) - (cb.hours||0)) || (((ca.weekCounts||{})[wk]||0) - (((cb.weekCounts||{})[wk]||0))) || ((ca.weekend||0) - (cb.weekend||0)) || ((ca.total||0) - (cb.total||0)) || (typeof compareStaffOrder==='function'?compareStaffOrder(a,b):0);
      });
      if (candidates[0]) {
        slot.staff_id = candidates[0].id;
        counts[candidates[0].id] = counts[candidates[0].id] || { total:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, weekCounts:{} };
        const c = counts[candidates[0].id];
        c.total++;
        const dm = dutyMetrics(slot, candidates[0].id);
        c.hours = (c.hours||0) + (dm.hours||0);
        c.units = (c.units||0) + (dm.units||0);
        c.pay = (c.pay||0) + (dm.pay||0);
        c.weekCounts = c.weekCounts || {}; c.weekCounts[wk] = (c.weekCounts[wk] || 0) + 1;
        if (isWeekend(slot.duty_date) || isHolidayDate(slot.duty_date)) c.weekend = (c.weekend||0)+1; else c.weekday = (c.weekday||0)+1;
      } else unfilled++;
    });
    if (unfilled) showToast(`Auto Assign แล้ว แต่เหลือ ${unfilled} ช่องที่ยังจัดไม่ได้ เพราะติดเงื่อนไขลา/ประเภทเวร/ชบดติดกัน`);
    else if (softAdjacentUsed) showToast(`Auto Assign แล้ว โดยเลี่ยงเวรติดกันเท่าที่ทำได้ แต่มีบางช่องที่ต้องยอมให้เวรอื่นติดกันเพื่อไม่ให้ตารางว่าง`);
    else showToast('Auto Assign แล้ว โดยเลี่ยงเวรติดกันเรียบร้อย ตรวจทานก่อนบันทึกอีกที');
  };

  document.addEventListener('change', function(e){
    const t = e.target;
    const map = {
      leaveFilterStaff:'leaveFilterStaff', leaveFilterDate:'leaveFilterDate', leaveFilterMonth:'leaveFilterMonth', leaveFilterYear:'leaveFilterYear', leaveFilterType:'leaveFilterType',
      activityFilterParticipant:'activityFilterParticipant', activityFilterDate:'activityFilterDate', activityFilterMonth:'activityFilterMonth', activityFilterYear:'activityFilterYear', activityFilterType:'activityFilterType'
    };
    if (map[t.id]) { state[map[t.id]] = t.value || ''; renderPage(); }
  }, true);
  document.addEventListener('click', function(e){
    const btn = e.target.closest('[data-v59-reset-filter]');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    if (btn.dataset.v59ResetFilter === 'leave') ['leaveFilterStaff','leaveFilterDate','leaveFilterMonth','leaveFilterYear','leaveFilterType'].forEach(k=>state[k]='');
    if (btn.dataset.v59ResetFilter === 'activity') ['activityFilterParticipant','activityFilterDate','activityFilterMonth','activityFilterYear','activityFilterType'].forEach(k=>state[k]='');
    renderPage();
  }, true);

  const oldRenderPage = window.renderPage || renderPage;
  window.renderPage = renderPage = function renderPageV59(){ injectStyle(); return oldRenderPage(); };
  console.info(`CNMI Staff Planner ${PATCH} loaded`);
})();
