/* CNMI Duty Hub V98: add duty-code columns to roster fairness popup
   Patch-only. Load after v91/v92/v93/v94/v95/v96/v97 if present.
   Adds columns after รวมเวร: ชบด1, ชบด2, ชบด3, ช3A, ช3B, ช9, ช4
*/
(function(){
  const PATCH = 'v98-fairness-duty-columns';
  const GROUP_A = new Set(['ชบด1','ชบด2','ชบด3']);

  function safe(fn, fallback){ try { return fn(); } catch(e) { console.warn('[CNMI]', PATCH, e); return fallback; } }
  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function esc(v){
    if (typeof escapeHtml === 'function') return safe(() => escapeHtml(v), String(v ?? ''));
    return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function parseD(d){
    if (typeof parseDate === 'function') return safe(() => parseDate(d), new Date(String(d || '').slice(0,10)));
    return new Date(String(d || '').slice(0,10));
  }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function monthRange(key){
    if (typeof getMonthRange === 'function') return safe(() => getMonthRange(key), null);
    const [y,m] = String(key || '').split('-').map(Number);
    const last = new Date(y, m, 0).getDate();
    return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(last)}` };
  }
  function staffById(id){ return (S()?.staff || []).find(s => String(s.id) === String(id)) || null; }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function isRosterStaff(st){
    if (!st) return false;
    if (typeof isRosterEnabled === 'function') return !!safe(() => isRosterEnabled(st), false);
    return !!(st.is_active !== false && st.staff_type !== 'แพทย์');
  }
  function compareStaff(a,b){
    if (typeof compareStaffOrder === 'function') return safe(() => compareStaffOrder(a,b), 0);
    const ao = Number(a?.display_order ?? a?.order ?? 9999);
    const bo = Number(b?.display_order ?? b?.order ?? 9999);
    return ao - bo || String(a?.nickname||a?.full_name||'').localeCompare(String(b?.nickname||b?.full_name||''), 'th');
  }
  function ordered(list){
    if (typeof orderedStaff === 'function') return safe(() => orderedStaff(list), [...(list||[])].sort(compareStaff));
    return [...(list||[])].sort(compareStaff);
  }
  function isWeekendOrHoliday(date){
    const weekend = (typeof isWeekend === 'function') ? safe(() => isWeekend(date), false) : [0,6].includes(parseD(date).getDay());
    const holiday = (typeof isHolidayDate === 'function') ? safe(() => isHolidayDate(date), false) : false;
    return weekend || holiday;
  }
  function dutyBucket(code){
    code = String(code || '');
    if (code === 'ชบด1') return 'ชบด1';
    if (code === 'ชบด2') return 'ชบด2';
    if (code === 'ชบด3') return 'ชบด3';
    if (code === 'ช3A') return 'ช3A';
    if (code === 'ช3B') return 'ช3B';
    if (code === 'ช9' || code === 'ช9-MT' || code === 'ช9-เคิก') return 'ช9';
    if (code === 'ช4' || code === 'ช4A' || code === 'ช4B') return 'ช4';
    return code || '-';
  }
  function staffTypeForRate(staffId, dutyCode=''){
    const st = staffById(staffId);
    if (!st) return 'MT';
    if (['ช4A','ช4B','ช4'].includes(String(dutyCode || '')) && st.nickname === 'แตง') return 'MT';
    return st.staff_type === 'เคิก' ? 'เคิก' : 'MT';
  }
  function rateFor(staffId, date, dutyCode=''){
    if (typeof dutyRatePerHour === 'function') return safe(() => dutyRatePerHour(staffId, date, dutyCode), 0);
    const type = staffTypeForRate(staffId, dutyCode);
    const special = isWeekendOrHoliday(date);
    if (type === 'เคิก') return special ? 120 : 90;
    return special ? 160 : 130;
  }
  function hoursFor(date, dutyCode=''){
    if (typeof dutyHoursForCode === 'function') return safe(() => dutyHoursForCode(date, dutyCode), 0);
    const code = String(dutyCode || '');
    if (code === 'ช9' || code === 'ช9-MT' || code === 'ช9-เคิก') return 8;
    if (code === 'ช3A' || code === 'ช3B') return 8;
    if (code === 'ช4' || code === 'ช4A' || code === 'ช4B') return 0;
    if (GROUP_A.has(code)) return isWeekendOrHoliday(date) ? 24 : 16;
    return isWeekendOrHoliday(date) ? 24 : 16;
  }
  function unitsFor(date, dutyCode=''){
    if (typeof dutyUnitsForCode === 'function') return safe(() => dutyUnitsForCode(date, dutyCode), 0);
    const code = String(dutyCode || '');
    if (code === 'ช3A' || code === 'ช3B') return 1;
    if (code === 'ช4' || code === 'ช4A' || code === 'ช4B') return 0;
    return hoursFor(date, dutyCode) / 8;
  }
  function allHolidayDatesForMonth(key){
    const mr = monthRange(key);
    if (!mr) return [];
    const { y, m } = mr;
    const last = new Date(y, m, 0).getDate();
    const out = [];
    for (let day=1; day<=last; day++) {
      const d = `${y}-${pad2(m)}-${pad2(day)}`;
      if (isWeekendOrHoliday(d)) out.push(d);
    }
    return out;
  }
  function emptyStats(){
    return {
      hours:0, pay:0, units:0, weekend:0, weekday:0, bb:0, donor:0,
      offDays:0, holidayWorkedDates:new Set(),
      chbd1:0, chbd2:0, chbd3:0, ch3A:0, ch3B:0, ch9:0, ch4:0
    };
  }
  function addToStats(stats, staffId, slot){
    if (!staffId || !slot) return;
    const r = stats[staffId] = stats[staffId] || emptyStats();
    const code = String(slot.duty_code || '');
    const bucket = dutyBucket(code);
    const h = Number(hoursFor(slot.duty_date, code) || 0);
    const u = Number(unitsFor(slot.duty_date, code) || 0);
    r.hours += h;
    r.pay += h * Number(rateFor(staffId, slot.duty_date, code) || 0);
    r.units += u;
    if (bucket === 'ชบด1') { r.chbd1 += 1; r.bb += 1; }
    else if (bucket === 'ชบด2') { r.chbd2 += 1; r.bb += 1; }
    else if (bucket === 'ชบด3') { r.chbd3 += 1; r.bb += 1; }
    else if (bucket === 'ช3A') { r.ch3A += 1; r.donor += 1; }
    else if (bucket === 'ช3B') { r.ch3B += 1; r.donor += 1; }
    else if (bucket === 'ช9') { r.ch9 += 1; r.donor += 1; }
    else if (bucket === 'ช4') { r.ch4 += 1; }
    if (isWeekendOrHoliday(slot.duty_date)) { r.weekend += 1; r.holidayWorkedDates.add(slot.duty_date); }
    else r.weekday += 1;
  }
  function normalizeStatsObject(stats, key){
    const totalHoliday = allHolidayDatesForMonth(key).length;
    Object.values(stats || {}).forEach(r => {
      r.chbd1 = Number(r.chbd1 || 0);
      r.chbd2 = Number(r.chbd2 || 0);
      r.chbd3 = Number(r.chbd3 || 0);
      r.ch3A = Number(r.ch3A || 0);
      r.ch3B = Number(r.ch3B || 0);
      r.ch9 = Number(r.ch9 || 0);
      r.ch4 = Number(r.ch4 || 0);
      if (typeof r.offDays === 'undefined' || r.offDays === null) {
        const workedHolidayDays = r.holidayWorkedDates instanceof Set ? r.holidayWorkedDates.size : Number(r.holidayWorkedDateCount || 0);
        r.offDays = Math.max(0, totalHoliday - workedHolidayDays);
      }
    });
    return stats;
  }
  function buildStats(assignments, key){
    if (typeof calcFairness === 'function') {
      const r = safe(() => calcFairness(assignments || []), null);
      if (r) return normalizeStatsObject(r, key);
    }
    const stats = {};
    (S()?.staff || []).filter(isRosterStaff).forEach(st => stats[st.id] = emptyStats());
    (assignments || []).forEach(a => addToStats(stats, a.staff_id, a));
    const totalHoliday = allHolidayDatesForMonth(key).length;
    Object.values(stats).forEach(r => { r.offDays = Math.max(0, totalHoliday - (r.holidayWorkedDates?.size || 0)); });
    return stats;
  }
  function getMonthAssignments(){
    const key = S()?.monthKey;
    if (typeof getAssignmentsForMonth === 'function') return safe(() => getAssignmentsForMonth(key), []).filter(x => x.staff_id);
    return (S()?.rosterAssignments || []).filter(x => x.staff_id && String(x.duty_date || '').slice(0,7) === key);
  }
  function pill(st){
    if (typeof staffPill === 'function') return safe(() => staffPill(st), esc(st?.nickname || st?.full_name || st));
    if (typeof st === 'string') st = staffById(st) || { nickname: st };
    return `<span class="staff-pill">${esc(st?.nickname || st?.full_name || '-')}</span>`;
  }
  function cellNum(v){ return Number(v || 0).toLocaleString(); }

  window.showFairness = showFairness = function(){
    const key = S()?.monthKey || '';
    const assignments = getMonthAssignments();
    const stats = buildStats(assignments, key);
    const active = ordered((S()?.staff || []).filter(isRosterStaff));
    const html = `<h2>ตรวจสมดุลการกระจายเวร ${esc(key)}</h2>
      <div class="table-wrap fairness-wide-wrap"><table class="fairness-wide-table"><thead><tr>
        <th>ชื่อ</th>
        <th>ชม.รวม</th>
        <th>เงิน<br>ประมาณ</th>
        <th>เวรวัน ส.-อ./นักขัตฯ</th>
        <th>เวรวันทำงาน<br>ราชการ</th>
        <th>เวรห้อง<br>BB</th>
        <th>เวรห้อง<br>Donor</th>
        <th>จำนวนวันที่<br>ได้หยุด</th>
        <th>รวม<br>เวร</th>
        <th>ชบด1</th>
        <th>ชบด2</th>
        <th>ชบด3</th>
        <th>ช3A</th>
        <th>ช3B</th>
        <th>ช9</th>
        <th>ช4</th>
      </tr></thead><tbody>
        ${active.map(s => { const r = stats[s.id] || emptyStats(); return `<tr>
          <td class="fairness-name-cell">${pill(s)}</td>
          <td>${Number(r.hours||0).toFixed(1)}</td>
          <td>${Math.round(r.pay||0).toLocaleString()}</td>
          <td>${cellNum(r.weekend)}</td>
          <td>${cellNum(r.weekday)}</td>
          <td>${cellNum(r.bb)}</td>
          <td>${cellNum(r.donor)}</td>
          <td>${cellNum(r.offDays)}</td>
          <td>${Number(r.units||0).toFixed(0)}</td>
          <td>${cellNum(r.chbd1)}</td>
          <td>${cellNum(r.chbd2)}</td>
          <td>${cellNum(r.chbd3)}</td>
          <td>${cellNum(r.ch3A)}</td>
          <td>${cellNum(r.ch3B)}</td>
          <td>${cellNum(r.ch9)}</td>
          <td>${cellNum(r.ch4)}</td>
        </tr>`; }).join('')}
      </tbody></table></div>`;
    if (typeof showModal === 'function') return showModal(html);
    console.table(active.map(s => ({ name:s.nickname, ...(stats[s.id]||{}) })));
  };

  window.showStaffStats = showStaffStats = function(staffId){
    const key = S()?.monthKey || '';
    const assignments = getMonthAssignments().filter(x => String(x.staff_id) === String(staffId));
    const s = (buildStats(assignments, key)[staffId]) || emptyStats();
    const detail = assignments.slice().sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date))).map(a => {
      const h = hoursFor(a.duty_date, a.duty_code);
      const pay = h * rateFor(staffId, a.duty_date, a.duty_code);
      const dateLabel = (typeof formatThaiDate === 'function') ? safe(() => formatThaiDate(a.duty_date), a.duty_date) : a.duty_date;
      return `<tr><td>${esc(dateLabel)}</td><td>${esc(a.duty_code || '-')}</td><td>${Number(h||0).toFixed(0)} ชม.</td><td>${Math.round(pay||0).toLocaleString()} บ.</td></tr>`;
    }).join('');
    const card = (title, val) => (typeof statCard === 'function') ? safe(() => statCard(title, val), `<div class="card"><b>${esc(title)}</b><br>${esc(val)}</div>`) : `<div class="card"><b>${esc(title)}</b><br>${esc(val)}</div>`;
    const title = pill(staffById(staffId) || staffId);
    const html = `<h2>${title}</h2><div class="grid grid-2 modal-stat-grid">
      ${card('ชม.รวม', Number(s.hours||0).toFixed(1))}
      ${card('เงินประมาณ', Math.round(s.pay||0).toLocaleString())}
      ${card('เวรวัน ส.-อ./นักขัตฯ', s.weekend||0)}
      ${card('เวรวันทำงานราชการ', s.weekday||0)}
      ${card('เวรห้อง BB', s.bb||0)}
      ${card('เวรห้อง Donor', s.donor||0)}
      ${card('จำนวนวันที่ได้หยุด', s.offDays||0)}
      ${card('รวมเวร', Number(s.units||0).toFixed(0))}
      ${card('ชบด1', s.chbd1||0)}
      ${card('ชบด2', s.chbd2||0)}
      ${card('ชบด3', s.chbd3||0)}
      ${card('ช3A', s.ch3A||0)}
      ${card('ช3B', s.ch3B||0)}
      ${card('ช9', s.ch9||0)}
      ${card('ช4', s.ch4||0)}
    </div><div class="compact-detail-table"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ชม.</th><th>เงิน</th></tr></thead><tbody>${detail || '<tr><td colspan="4">ยังไม่มีเวรในเดือนนี้</td></tr>'}</tbody></table></div>`;
    if (typeof showModal === 'function') return showModal(html);
  };

  function injectStyle(){
    if (document.getElementById('cnmi-v98-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v98-style';
    style.textContent = `
      .fairness-wide-wrap { overflow-x: auto; max-width: 100%; }
      .fairness-wide-table { min-width: 1160px; border-collapse: collapse; }
      .fairness-wide-table th, .fairness-wide-table td { white-space: nowrap; text-align: center; }
      .fairness-wide-table .fairness-name-cell { text-align: left; position: sticky; left: 0; background: #fff; z-index: 1; }
      .fairness-wide-table thead th:first-child { position: sticky; left: 0; background: #f7fbff; z-index: 2; }
      @media (max-width: 700px) {
        .fairness-wide-table { min-width: 1080px; font-size: 13px; }
        .fairness-wide-table th, .fairness-wide-table td { padding: 9px 10px; }
      }
    `;
    document.head.appendChild(style);
  }
  injectStyle();
  setTimeout(injectStyle, 500);
  console.log('[CNMI]', PATCH, 'loaded');
})();
