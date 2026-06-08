/*
  Patch v77: Rolling 1-year calendar/duty data window
  Purpose: Let the app load calendar, leave, roster, positions, holidays, OT, and in-charge data up to 1 year from today.
  Example: if today is 2026-06-08 (8 มิ.ย. 2569), the app loads up to 2027-06-08 (8 มิ.ย. 2570).
  Scope: Data fetching only. Does not change auth, drag-drop, duty rules, leave rules, database schema, or import data.
*/
(function () {
  const PATCH = 'v77-rolling-1year-calendar';

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  function toYmd(d) {
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  function addYearsSafe(date, years) {
    const d = new Date(date.getFullYear() + years, date.getMonth(), date.getDate());
    // Handles leap-day overflow safely.
    if (d.getMonth() !== date.getMonth()) return new Date(date.getFullYear() + years, date.getMonth() + 1, 0);
    return d;
  }

  function monthStart(date, offsetMonths) {
    return new Date(date.getFullYear(), date.getMonth() + offsetMonths, 1);
  }

  function getClient() {
    try {
      if (window.sb) return window.sb;
      if (typeof sb !== 'undefined') return sb;
    } catch (_) {}
    return null;
  }

  function mergeById(existing, extra, sortKey, ascending = true) {
    const map = new Map();
    (existing || []).forEach(row => { if (row && row.id) map.set(row.id, row); });
    (extra || []).forEach(row => { if (row && row.id) map.set(row.id, row); });
    const rows = Array.from(map.values());
    if (sortKey) {
      rows.sort((a, b) => {
        const av = String(a?.[sortKey] || '');
        const bv = String(b?.[sortKey] || '');
        return ascending ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }
    return rows;
  }

  function mergeStaff(existing, extra) {
    const merged = mergeById(existing, extra, 'nickname', true);
    try {
      if (typeof orderedStaff === 'function') return orderedStaff(merged);
    } catch (_) {}
    return merged;
  }

  const oldLoadAllData = window.loadAllData || (typeof loadAllData === 'function' ? loadAllData : null);
  if (!oldLoadAllData) {
    console.warn(`[${PATCH}] loadAllData not found`);
    return;
  }

  window.loadAllData = loadAllData = async function loadAllDataV77RollingOneYear() {
    await oldLoadAllData();

    const client = getClient();
    if (!client || !(window.state || (typeof state !== 'undefined' && state))) return;
    if (!state.profile) return;

    const now = new Date();
    const start = toYmd(monthStart(now, -2));
    const end = toYmd(addYearsSafe(now, 1));
    const yearStart = `${now.getFullYear()}-01-01`;
    const monthStartKey = start.slice(0, 7);
    const monthEndKey = end.slice(0, 7);

    try {
      const [
        leaves,
        activities,
        rosterAssignments,
        positions,
        attendance,
        otRequests,
        holidays,
        incharges,
        positionDayStatus
      ] = await Promise.all([
        client.from('leave_requests').select('*').gte('end_date', yearStart).lte('start_date', end).order('start_date', { ascending: false }),
        client.from('activity_events').select('*').gte('end_date', start).lte('start_date', end).order('start_date', { ascending: true }),
        client.from('roster_assignments').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date', { ascending: true }),
        client.from('daily_positions').select('*').gte('work_date', start).lte('work_date', end).order('work_date', { ascending: true }),
        client.from('attendance_logs').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date', { ascending: false }),
        client.from('ot_requests').select('*').gte('work_date', yearStart).lte('work_date', end).order('work_date', { ascending: false }),
        client.from('public_holidays').select('*').gte('holiday_date', start).lte('holiday_date', end).order('holiday_date', { ascending: true }),
        client.from('monthly_incharges').select('*').gte('month_key', monthStartKey).lte('month_key', monthEndKey).order('month_key', { ascending: false }),
        client.from('daily_position_day_status').select('*').gte('work_date', start).lte('work_date', end).order('work_date', { ascending: true })
      ]);

      const packs = { leaves, activities, rosterAssignments, positions, attendance, otRequests, holidays, incharges, positionDayStatus };
      Object.entries(packs).forEach(([k, v]) => {
        if (v.error) throw new Error(`${k}: ${v.error.message}`);
      });

      state.leaves = mergeById(state.leaves, leaves.data || [], 'start_date', false);
      state.activities = mergeById(state.activities, activities.data || [], 'start_date', true);
      state.rosterAssignments = mergeById(state.rosterAssignments, rosterAssignments.data || [], 'duty_date', true);
      state.positions = mergeById(state.positions, positions.data || [], 'work_date', true);
      state.attendance = mergeById(state.attendance, attendance.data || [], 'duty_date', false);
      state.otRequests = mergeById(state.otRequests, otRequests.data || [], 'work_date', false);
      state.holidays = mergeById(state.holidays, holidays.data || [], 'holiday_date', true);
      state.incharges = mergeById(state.incharges, incharges.data || [], 'month_key', false);
      state.positionDayStatus = mergeById(state.positionDayStatus, positionDayStatus.data || [], 'work_date', true);

      console.info(`[${PATCH}] loaded rolling 1-year data window`, {
        start,
        end,
        leaves: (leaves.data || []).length,
        activities: (activities.data || []).length,
        rosterAssignments: (rosterAssignments.data || []).length,
        positions: (positions.data || []).length,
        holidays: (holidays.data || []).length
      });
    } catch (err) {
      console.warn(`[${PATCH}] rolling 1-year load failed`, err?.message || err);
    }
  };
})();
