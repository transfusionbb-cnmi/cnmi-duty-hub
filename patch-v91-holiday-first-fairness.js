/* CNMI Duty Hub V91: holiday-first roster fairness
   Patch-only. Load after v89/v90.
   Fixes:
   - Fairness modal shows only Excel-style table, no long summary/hint lines.
   - Auto Assign regenerates all unlocked slots while preserving locked preset slots.
   - Day-off fairness is priority #1: weekend/public-holiday work is distributed first so "จำนวนวันที่ได้หยุด" is as equal as possible.
   - Only ชบด1/ชบด2/ชบด3 are prohibited from being adjacent to another ชบด. ชบด can touch ช4/ช3A/ช3B/ช9, and B group can touch B group.
*/
(function(){
  const PATCH = 'v91-holiday-first-fairness';
  const GROUP_A = new Set(['ชบด1','ชบด2','ชบด3']);

  function safe(fn, fallback){ try { return fn(); } catch(e) { console.warn('[CNMI]', PATCH, e); return fallback; } }
  function S(){ return (typeof state !== 'undefined') ? state : null; }
  function pad2(n){ return String(n).padStart(2,'0'); }
  function esc(v){ return safe(() => escapeHtml(v), String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))); }
  function parseD(d){ return safe(() => parseDate(d), new Date(String(d || '').slice(0,10))); }
  function dateInput(d){ return safe(() => toDateInput(d), `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`); }
  function toast(msg){ return safe(() => showToast(msg), console.log(msg)); }
  function render(){ return safe(() => renderPage(), null); }
  function isAdminX(){ return !!safe(() => isAdmin(), false); }
  function staffById(id){ return S()?.staff?.find(s => String(s.id) === String(id)) || null; }
  function staffOrd(st){ return safe(() => staffOrderIndex(st), 9999); }
  function compareStaff(a,b){ return safe(() => compareStaffOrder(a,b), staffOrd(a)-staffOrd(b)); }
  function ordered(list){ return safe(() => orderedStaff(list), [...(list||[])].sort(compareStaff)); }
  function isRosterStaff(st){ return !!safe(() => isRosterEnabled(st), !!(st?.is_active && st?.staff_type !== 'แพทย์')); }
  function roleOk(st, role){ return !!safe(() => supportsRequiredRole(st, role), true); }
  function slotId(slot){ return slot?.id || slot?._temp_id || `${slot?.duty_date}|${slot?.duty_code}`; }
  function isGroupA(code){ return GROUP_A.has(String(code || '')); }
  function monthRange(key){
    return safe(() => getMonthRange(key), (() => {
      const [y,m] = String(key || '').split('-').map(Number);
      const last = new Date(y, m, 0).getDate();
      return { y, m, start:`${y}-${pad2(m)}-01`, end:`${y}-${pad2(m)}-${pad2(last)}` };
    })());
  }
  function isWeekendOrHoliday(date){ return !!(safe(() => isWeekend(date), false) || safe(() => isHolidayDate(date), false)); }
  function dutyBucket(code){
    code = String(code || '');
    if (code === 'ชบด1' || code === 'ชบด2' || code === 'ชบด3') return code;
    if (code === 'ช4A' || code === 'ช4B' || code === 'ช4') return 'ช4';
    if (code === 'ช3A') return 'ช3A';
    if (code === 'ช3B') return 'ช3B';
    if (code === 'ช9-เคิก' || code === 'ช9-MT' || code === 'ช9') return 'ช9';
    return code || '-';
  }
  function dayBucket(date){
    if (isWeekendOrHoliday(date)) return 'วันหยุด/นักขัต';
    const dow = parseD(date).getDay();
    if (dow === 1) return 'จันทร์';
    if (dow === 5) return 'ศุกร์';
    return 'วันทำงานราชการ';
  }
  function allHolidayDatesForMonth(key){
    const { y, m } = monthRange(key);
    const last = new Date(y, m, 0).getDate();
    const out = [];
    for (let day=1; day<=last; day++) {
      const d = `${y}-${pad2(m)}-${pad2(day)}`;
      if (isWeekendOrHoliday(d)) out.push(d);
    }
    return out;
  }
  function staffTypeForRate(staffId, dutyCode=''){
    const st = staffById(staffId);
    if (!st) return 'MT';
    // แตงขึ้นเวร ช4 เป็น MT ตาม logic เดิม
    if (['ช4A','ช4B','ช4'].includes(String(dutyCode || '')) && st.nickname === 'แตง') return 'MT';
    return st.staff_type === 'เคิก' ? 'เคิก' : 'MT';
  }
  function rateFor(staffId, date, dutyCode=''){
    const type = staffTypeForRate(staffId, dutyCode);
    const special = isWeekendOrHoliday(date);
    if (type === 'เคิก') return special ? 120 : 90;
    return special ? 160 : 130;
  }
  function hoursFor(date, dutyCode=''){
    const code = String(dutyCode || '');
    if (code === 'ช9-เคิก' || code === 'ช9-MT' || code === 'ช9') return 8;
    if (code === 'ช3A' || code === 'ช3B') return 8;
    if (code === 'ช4A' || code === 'ช4B' || code === 'ช4') return 0;
    if (isGroupA(code)) return isWeekendOrHoliday(date) ? 24 : 16;
    return isWeekendOrHoliday(date) ? 24 : 16;
  }
  function unitsFor(date, dutyCode=''){
    const h = hoursFor(date, dutyCode);
    const code = String(dutyCode || '');
    if (code === 'ช3A' || code === 'ช3B') return 1;
    if (code === 'ช4A' || code === 'ช4B' || code === 'ช4') return 0;
    return h / 8;
  }
  function metric(slot, staffIdOverride=null){
    const date = slot?.duty_date || slot;
    const code = slot?.duty_code || '';
    const staffId = staffIdOverride || slot?.staff_id || null;
    const hours = hoursFor(date, code);
    const rate = staffId ? rateFor(staffId, date, code) : 0;
    return { hours, rate, pay: hours * rate, units: unitsFor(date, code), code };
  }

  // Keep global calculations aligned with Excel rate rule.
  window.dutyStaffTypeForRate = dutyStaffTypeForRate = staffTypeForRate;
  window.dutyRatePerHour = dutyRatePerHour = rateFor;
  window.dutyHoursForCode = dutyHoursForCode = hoursFor;
  window.dutyUnitsForCode = dutyUnitsForCode = unitsFor;
  window.dutyMetrics = dutyMetrics = metric;
  window.dutyHours = dutyHours = function(date, dutyCode=''){ return hoursFor(date, dutyCode); };
  window.dutyAmount = dutyAmount = function(staffId, date, dutyCode=''){ return hoursFor(date, dutyCode) * rateFor(staffId, date, dutyCode); };
  window.dutyRateByType = dutyRateByType = function(type, date){
    const special = isWeekendOrHoliday(date);
    return type === 'เคิก' ? (special ? 120 : 90) : (special ? 160 : 130);
  };

  function sameDayDuty(staffId, date, assignments, excludeSlot){
    const ex = excludeSlot ? slotId(excludeSlot) : null;
    const draft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || slotId(a) !== ex));
    const saved = (S()?.rosterAssignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || slotId(a) !== ex));
    return draft || saved;
  }
  function hasGroupAOnDate(staffId, date, assignments, excludeSlot){
    const ex = excludeSlot ? slotId(excludeSlot) : null;
    const draft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && isGroupA(a.duty_code) && (!ex || slotId(a) !== ex));
    const saved = (S()?.rosterAssignments || []).some(a => a.staff_id === staffId && a.duty_date === date && isGroupA(a.duty_code) && (!ex || slotId(a) !== ex));
    return draft || saved;
  }
  function isRosterBlocked(staffId, date){
    return !!(S()?.leaves || []).some(l => l.staff_id === staffId && l.status !== 'cancelled' && safe(() => overlapsDate(l, date), String(l.start_date || '') <= date && String(l.end_date || '') >= date));
  }
  window.hasAdjacentDuty = hasAdjacentDuty = function(staffId, date, assignments = [], excludeSlot = null){
    // Only ชบด vs ชบด is prohibited. Group B never creates adjacent-duty blocks.
    if (excludeSlot && !isGroupA(excludeSlot.duty_code)) return false;
    const d = parseD(date);
    const prev = new Date(d); prev.setDate(d.getDate() - 1);
    const next = new Date(d); next.setDate(d.getDate() + 1);
    return hasGroupAOnDate(staffId, dateInput(prev), assignments, excludeSlot)
        || hasGroupAOnDate(staffId, dateInput(next), assignments, excludeSlot);
  };
  window.canStaffWorkSlot = canStaffWorkSlot = function(staffId, slot, assignments = safe(() => getAssignmentsForMonth(S()?.monthKey), [])){
    const st = staffById(staffId);
    if (!isRosterStaff(st)) return false;
    if (!roleOk(st, slot?.required_role)) return false;
    if (isRosterBlocked(staffId, slot?.duty_date)) return false;
    if (sameDayDuty(staffId, slot?.duty_date, assignments, slot)) return false;
    if (isGroupA(slot?.duty_code) && hasAdjacentDuty(staffId, slot?.duty_date, assignments, slot)) return false;
    return true;
  };

  function emptyStats(){
    return {
      total:0, units:0, hours:0, pay:0,
      chbd1:0, chbd2:0, chbd3:0, ch4:0, ch3A:0, ch3B:0, ch9:0,
      bb:0, donor:0, weekend:0, weekday:0, holidayWorkedDates:new Set(),
      holidayWorkedDateCount:0, offDays:0, mon:0, fri:0, bucket:{}, day:{}, carry:0
    };
  }
  function addToStats(stats, staffId, slot){
    if (!staffId || !slot) return;
    const r = stats[staffId] = stats[staffId] || emptyStats();
    const code = String(slot.duty_code || '');
    const b = dutyBucket(code);
    const d = dayBucket(slot.duty_date);
    const dm = metric(slot, staffId);
    r.total += 1;
    r.units += Number(dm.units || 0);
    r.hours += Number(dm.hours || 0);
    r.pay += Number(dm.pay || 0);
    r.bucket[b] = (r.bucket[b] || 0) + 1;
    r.day[d] = (r.day[d] || 0) + 1;
    if (code === 'ชบด1') { r.chbd1 += 1; r.bb += 1; }
    if (code === 'ชบด2') { r.chbd2 += 1; r.bb += 1; }
    if (code === 'ชบด3') { r.chbd3 += 1; r.bb += 1; }
    if (code === 'ช9-เคิก' || code === 'ช9-MT' || code === 'ช9') { r.ch9 += 1; r.donor += 1; }
    if (code === 'ช3A') { r.ch3A += 1; r.donor += 1; }
    if (code === 'ช3B') { r.ch3B += 1; r.donor += 1; }
    if (code === 'ช4A' || code === 'ช4B' || code === 'ช4') r.ch4 += 1;
    if (isWeekendOrHoliday(slot.duty_date)) { r.weekend += 1; r.holidayWorkedDates.add(slot.duty_date); }
    else r.weekday += 1;
    const dow = parseD(slot.duty_date).getDay();
    if (dow === 1) r.mon += 1;
    if (dow === 5) r.fri += 1;
  }
  function finalizeStats(stats, key){
    const totalHolidayDates = allHolidayDatesForMonth(key || S()?.monthKey).length;
    Object.values(stats).forEach(r => {
      const workedHolidayDays = r.holidayWorkedDates instanceof Set ? r.holidayWorkedDates.size : 0;
      r.holidayWorkedDateCount = workedHolidayDays;
      r.offDays = Math.max(0, totalHolidayDates - workedHolidayDays);
    });
    return stats;
  }
  function buildStats(assignments, key){
    const stats = {};
    (S()?.staff || []).filter(isRosterStaff).forEach(st => stats[st.id] = emptyStats());
    (assignments || []).forEach(a => { if (a.staff_id) addToStats(stats, a.staff_id, a); });
    return finalizeStats(stats, key);
  }
  window.calcFairness = calcFairness = function(assignments){ return buildStats(assignments || [], S()?.monthKey); };

  function prevMonthKey(key){
    const [y0,m0] = String(key || '').split('-').map(Number);
    let y = y0, m = m0 - 1;
    if (m < 1) { m = 12; y -= 1; }
    return `${y}-${pad2(m)}`;
  }
  function useCarryForKey(key){ return String(key || '') > '2026-07'; }
  function carryFromPreviousMonth(key){
    const out = {};
    if (!useCarryForKey(key)) return out;
    const prev = prevMonthKey(key);
    const rows = safe(() => getAssignmentsForMonth(prev), []).filter(a => a.staff_id);
    if (!rows.length) return out;
    const stats = buildStats(rows, prev);
    const ids = Object.keys(stats).filter(id => isRosterStaff(staffById(id)) && (stats[id].total || 0) > 0);
    if (!ids.length) return out;
    const avgHours = ids.reduce((s,id)=>s+(stats[id].hours||0),0) / ids.length;
    const avgOff = ids.reduce((s,id)=>s+(stats[id].offDays||0),0) / ids.length;
    const avgPay = ids.reduce((s,id)=>s+(stats[id].pay||0),0) / ids.length;
    ids.forEach(id => {
      const r = stats[id] || emptyStats();
      // Prioritize compensating fewer days off from previous month before money.
      out[id] = ((avgOff - (r.offDays || 0)) * 160000000)
        + ((r.hours || 0) - avgHours) * 2500
        + ((r.pay || 0) - avgPay) * 0.3;
    });
    return out;
  }
  function initializeStats(assignments, key){
    const stats = buildStats(assignments, key);
    const carry = carryFromPreviousMonth(key || S()?.monthKey);
    Object.keys(carry).forEach(id => {
      stats[id] = stats[id] || emptyStats();
      stats[id].carry = carry[id] || 0;
    });
    return stats;
  }
  function scoreCandidate(staff, slot, stats, allCandidates){
    const r = stats[staff.id] || emptyStats();
    const b = dutyBucket(slot.duty_code);
    const d = dayBucket(slot.duty_date);
    const holiday = d === 'วันหยุด/นักขัต';
    const dm = metric(slot, staff.id);
    const cands = allCandidates || [];
    const minHolidayWorked = cands.length ? Math.min(...cands.map(c => (stats[c.id]?.holidayWorkedDateCount || 0))) : 0;
    const minBucket = cands.length ? Math.min(...cands.map(c => (stats[c.id]?.bucket?.[b] || 0))) : 0;
    const minUnits = cands.length ? Math.min(...cands.map(c => (stats[c.id]?.units || 0))) : 0;

    if (holiday) {
      // Hard priority: equalize holiday off-days first. Money/OT is intentionally later.
      return ((r.holidayWorkedDateCount || 0) - minHolidayWorked) * 1_000_000_000
        + ((r.weekend || 0) * 30_000_000)
        + (((r.bucket[b] || 0) - minBucket) * 8_000_000)
        + (((r.units || 0) - minUnits) * 1_500_000)
        + ((r.hours || 0) * 800)
        + ((r.pay || 0) * 0.05)
        + (r.carry || 0)
        + (staffOrd(staff) * 0.01);
    }
    return (((r.bucket[b] || 0) - minBucket) * 8_000_000)
      + ((d === 'จันทร์' ? (r.mon || 0) * 5_000_000 : 0))
      + ((d === 'ศุกร์' ? (r.fri || 0) * 5_000_000 : 0))
      + (((r.units || 0) - minUnits) * 1_500_000)
      + ((r.weekday || 0) * 1_000_000)
      + ((r.hours || 0) * 800)
      + ((r.pay || 0) * 0.05)
      + (r.carry || 0)
      + (staffOrd(staff) * 0.01);
  }
  function candidatesFor(slot, assignments, stats){
    const list = ordered((S()?.staff || []).filter(st => canStaffWorkSlot(st.id, slot, assignments)));
    list.sort((a,b) => scoreCandidate(a, slot, stats, list) - scoreCandidate(b, slot, stats, list) || compareStaff(a,b));
    return list;
  }
  function slotPriority(slot){
    const d = dayBucket(slot.duty_date);
    const b = dutyBucket(slot.duty_code);
    const dutyRank = isGroupA(slot.duty_code) ? 0 : (b === 'ช9' ? 1 : b === 'ช4' ? 2 : 3);
    // Holiday slots must be assigned before weekdays so days off can be equalized.
    const dayRank = d === 'วันหยุด/นักขัต' ? 0 : d === 'ศุกร์' ? 1 : d === 'จันทร์' ? 2 : 3;
    return `${dayRank}${dutyRank}${slot.duty_date}${slot.duty_code}`;
  }
  function ensureDraft(useEmptyIfNoExisting=true){
    const st = S();
    if (!st) return [];
    if (!st.rosterDraft || st.rosterDraft.monthKey !== st.monthKey) {
      const existing = safe(() => getAssignmentsForMonth(st.monthKey), []);
      const base = existing.length ? existing.map(a => ({...a})) : (useEmptyIfNoExisting ? safe(() => generateEmptyAssignments(st.monthKey), []) : []);
      st.rosterDraft = { monthKey: st.monthKey, assignments: base };
    }
    return st.rosterDraft.assignments || [];
  }
  function clearUnlocked(assignments){
    let cleared = 0;
    (assignments || []).forEach(a => {
      if (!a.is_locked && a.staff_id) { a.staff_id = null; cleared++; }
    });
    return cleared;
  }
  function fillTargets(targets, assignments, stats){
    let filled = 0;
    const failed = [];
    targets.forEach(slot => {
      const cands = candidatesFor(slot, assignments, stats);
      if (!cands.length) { failed.push(slot); return; }
      slot.staff_id = cands[0].id;
      addToStats(stats, cands[0].id, slot);
      finalizeStats(stats, S()?.monthKey);
      filled++;
    });
    return { filled, failed };
  }
  function runAutoAssignRegenerate(){
    if (!isAdminX()) return toast('เฉพาะ Admin เท่านั้น');
    const assignments = ensureDraft(true);
    const locked = assignments.filter(a => a.is_locked && a.staff_id).length;
    const cleared = clearUnlocked(assignments);
    const targets = assignments.filter(a => !a.is_locked && !a.staff_id).sort((a,b) => slotPriority(a).localeCompare(slotPriority(b)));
    const stats = initializeStats(assignments, S()?.monthKey);
    const { filled, failed } = fillTargets(targets, assignments, stats);
    render();
    if (failed.length) toast(`สร้างร่างแล้ว เติมได้ ${filled} ช่อง เหลือ ${failed.length} ช่องที่ติดเงื่อนไขจริง`);
    else toast(`สร้างร่างแล้ว ${filled} ช่อง • ล็อกเดิม ${locked} ช่อง • จัดใหม่ช่องไม่ล็อก ${cleared + filled} ช่อง`);
  }
  window.autoAssignRoster = autoAssignRoster = runAutoAssignRegenerate;
  window.cnmiV91AutoAssignRegenerate = runAutoAssignRegenerate;
  window.cnmiV89RebalanceEmptyMonth = function(){
    // Keep the older button useful: rebalance all unlocked slots, not only blanks.
    return runAutoAssignRegenerate();
  };

  window.showFairness = showFairness = function(){
    const assignments = safe(() => getAssignmentsForMonth(S()?.monthKey), []).filter(x => x.staff_id);
    const stats = buildStats(assignments, S()?.monthKey);
    const active = ordered((S()?.staff || []).filter(isRosterStaff));
    showModal(`<h2>ตรวจสมดุลการกระจายเวร ${esc(S()?.monthKey || '')}</h2>
      <div class="table-wrap"><table><thead><tr>
        <th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>เวรวัน ส.-อ./นักขัตฯ</th><th>เวรวันทำงานราชการ</th><th>เวรห้อง BB</th><th>เวรห้อง Donor</th><th>จำนวนวันที่ได้หยุด</th><th>รวมเวร</th>
      </tr></thead><tbody>
        ${active.map(s => { const r = stats[s.id] || emptyStats(); return `<tr>
          <td>${safe(() => staffPill(s), esc(s.nickname || s.full_name || '-'))}</td>
          <td>${(r.hours||0).toFixed(1)}</td>
          <td>${Math.round(r.pay||0).toLocaleString()}</td>
          <td>${r.weekend||0}</td>
          <td>${r.weekday||0}</td>
          <td>${r.bb||0}</td>
          <td>${r.donor||0}</td>
          <td>${r.offDays||0}</td>
          <td>${(r.units||0).toFixed(0)}</td>
        </tr>`; }).join('')}
      </tbody></table></div>`);
  };

  window.showStaffStats = showStaffStats = function(staffId){
    const assignments = safe(() => getAssignmentsForMonth(S()?.monthKey), []).filter(x => x.staff_id === staffId);
    const s = (buildStats(assignments, S()?.monthKey)[staffId]) || emptyStats();
    const detail = assignments.slice().sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date))).map(a => `<tr><td>${safe(() => formatThaiDate(a.duty_date), esc(a.duty_date))}</td><td>${esc(a.duty_code || '-')}</td><td>${metric(a, staffId).hours.toFixed(0)} ชม.</td><td>${metric(a, staffId).pay.toLocaleString()} บ.</td></tr>`).join('');
    showModal(`<h2>${safe(() => staffPill(staffId), esc(staffId))}</h2><div class="grid grid-2 modal-stat-grid">
      ${safe(() => statCard('ชม.รวม', (s.hours||0).toFixed(1)), '')}
      ${safe(() => statCard('เงินประมาณ', Math.round(s.pay||0).toLocaleString()), '')}
      ${safe(() => statCard('เวรวัน ส.-อ./นักขัตฯ', s.weekend||0), '')}
      ${safe(() => statCard('เวรวันทำงานราชการ', s.weekday||0), '')}
      ${safe(() => statCard('เวรห้อง BB', s.bb||0), '')}
      ${safe(() => statCard('เวรห้อง Donor', s.donor||0), '')}
      ${safe(() => statCard('จำนวนวันที่ได้หยุด', s.offDays||0), '')}
      ${safe(() => statCard('รวมเวร', (s.units||0).toFixed(0)), '')}
    </div><div class="compact-detail-table"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ชม.</th><th>เงิน</th></tr></thead><tbody>${detail || '<tr><td colspan="4">ยังไม่มีเวรในเดือนนี้</td></tr>'}</tbody></table></div>`);
  };

  function injectStyle(){
    if (document.getElementById('cnmi-v91-style')) return;
    const style = document.createElement('style');
    style.id = 'cnmi-v91-style';
    style.textContent = `
      .modal-content h2 + .table-wrap { margin-top: 14px; }
      [data-v89-rebalance-empty-month] { font-weight: 800; }
    `;
    document.head.appendChild(style);
  }
  injectStyle();
  setTimeout(injectStyle, 500);
  console.log('[CNMI]', PATCH, 'loaded');
})();
