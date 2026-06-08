/*
  Patch v79: Selected-month lazy loader with rolling 1-year cap
  Purpose: Keep v77 rolling window behavior (today -> today + 1 year), and when a selected month is opened, fetch only the portion of that month inside that rolling window.
  Scope: Data fetching only. Does not change auth, reset password, drag-drop rules, duty rules, leave rules, schema, or imported data.
*/
(function () {
  const PATCH = 'v79-selected-month-loader-rolling-cap';
  const loadedRanges = new Set();
  const loadingRanges = new Set();

  function pad(n) { return String(n).padStart(2, '0'); }
  function ymd(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function monthKeyFromDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; }
  function parseYmd(s) {
    const [y, m, d] = String(s || '').split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }
  function maxYmd(a, b) {
    const da = parseYmd(a); const db = parseYmd(b);
    return da >= db ? a : b;
  }
  function minYmd(a, b) {
    const da = parseYmd(a); const db = parseYmd(b);
    return da <= db ? a : b;
  }
  function addOneYear(date) {
    const d = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
    // Guard for Feb 29 overflow behavior.
    if (d.getMonth() !== date.getMonth()) return new Date(date.getFullYear() + 1, date.getMonth() + 1, 0);
    return d;
  }
  function rollingWindow() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const max = addOneYear(today);
    max.setHours(0, 0, 0, 0);
    return { start: ymd(today), end: ymd(max) };
  }
  function parseMonthKey(key) {
    const [y, m] = String(key || '').split('-').map(Number);
    if (!y || !m || m < 1 || m > 12) return null;
    const monthStart = ymd(new Date(y, m - 1, 1));
    const monthEnd = ymd(new Date(y, m, 0));
    const win = rollingWindow();

    // Month completely outside rolling window: do not fetch.
    if (monthEnd < win.start || monthStart > win.end) {
      return { y, m, start: null, end: null, key: `${y}-${pad(m)}`, outsideWindow: true, windowStart: win.start, windowEnd: win.end };
    }

    return {
      y,
      m,
      start: maxYmd(monthStart, win.start),
      end: minYmd(monthEnd, win.end),
      key: `${y}-${pad(m)}`,
      outsideWindow: false,
      windowStart: win.start,
      windowEnd: win.end
    };
  }
  function getState() {
    try { if (typeof state !== 'undefined') return state; } catch (_) {}
    return window.state || null;
  }
  function getClient() {
    try { if (typeof sb !== 'undefined' && sb) return sb; } catch (_) {}
    return window.sb || null;
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
  function currentCalendarMonthKey() {
    const st = getState();
    const d = st?.calendarDate instanceof Date ? st.calendarDate : new Date(st?.calendarDate || new Date());
    return monthKeyFromDate(d);
  }
  function requestedVisibleMonthKeys() {
    const st = getState();
    if (!st) return [];
    const keys = new Set();
    keys.add(currentCalendarMonthKey());
    if (st.monthKey) keys.add(st.monthKey);
    if (st.positionMonthKey) keys.add(st.positionMonthKey);
    if (st.positionMonthViewKey) keys.add(st.positionMonthViewKey);
    return Array.from(keys).filter(Boolean);
  }
  function maybeRender(reasonKey) {
    try {
      if (typeof renderPage === 'function') renderPage();
      console.info(`[${PATCH}] rendered after month load`, reasonKey);
    } catch (err) {
      console.warn(`[${PATCH}] render after month load failed`, err?.message || err);
    }
  }

  async function ensureMonthLoaded(monthKey, reason = '') {
    const parsed = parseMonthKey(monthKey);
    const st = getState();
    const client = getClient();
    if (!parsed || !st || !client || !st.profile) return;

    if (parsed.outsideWindow) {
      console.info(`[${PATCH}] skipped outside rolling window`, {
        month: parsed.key,
        windowStart: parsed.windowStart,
        windowEnd: parsed.windowEnd,
        reason
      });
      return;
    }

    const rangeKey = `${parsed.key}:${parsed.start}:${parsed.end}`;
    if (loadedRanges.has(rangeKey) || loadingRanges.has(rangeKey)) return;
    loadingRanges.add(rangeKey);

    try {
      const [
        leaves,
        activities,
        rosterMonths,
        rosterAssignments,
        positions,
        attendance,
        otRequests,
        holidays,
        incharges,
        positionDayStatus
      ] = await Promise.all([
        client.from('leave_requests').select('*').neq('status', 'cancelled').gte('end_date', parsed.start).lte('start_date', parsed.end).order('start_date', { ascending: false }),
        client.from('activity_events').select('*').gte('end_date', parsed.start).lte('start_date', parsed.end).order('start_date', { ascending: true }),
        client.from('roster_months').select('*').eq('year', parsed.y).eq('month', parsed.m),
        client.from('roster_assignments').select('*').gte('duty_date', parsed.start).lte('duty_date', parsed.end).order('duty_date', { ascending: true }),
        client.from('daily_positions').select('*').gte('work_date', parsed.start).lte('work_date', parsed.end).order('work_date', { ascending: true }),
        client.from('attendance_logs').select('*').gte('duty_date', parsed.start).lte('duty_date', parsed.end).order('duty_date', { ascending: false }),
        client.from('ot_requests').select('*').gte('work_date', parsed.start).lte('work_date', parsed.end).order('work_date', { ascending: false }),
        client.from('public_holidays').select('*').gte('holiday_date', parsed.start).lte('holiday_date', parsed.end).order('holiday_date', { ascending: true }),
        client.from('monthly_incharges').select('*').eq('month_key', parsed.key),
        client.from('daily_position_day_status').select('*').gte('work_date', parsed.start).lte('work_date', parsed.end).order('work_date', { ascending: true })
      ]);

      const packs = { leaves, activities, rosterMonths, rosterAssignments, positions, attendance, otRequests, holidays, incharges, positionDayStatus };
      Object.entries(packs).forEach(([name, result]) => {
        if (result.error) throw new Error(`${name}: ${result.error.message}`);
      });

      st.leaves = mergeById(st.leaves, leaves.data || [], 'start_date', false);
      st.activities = mergeById(st.activities, activities.data || [], 'start_date', true);
      st.rosterMonths = mergeById(st.rosterMonths, rosterMonths.data || [], 'year', false);
      st.rosterAssignments = mergeById(st.rosterAssignments, rosterAssignments.data || [], 'duty_date', true);
      st.positions = mergeById(st.positions, positions.data || [], 'work_date', true);
      st.attendance = mergeById(st.attendance, attendance.data || [], 'duty_date', false);
      st.otRequests = mergeById(st.otRequests, otRequests.data || [], 'work_date', false);
      st.holidays = mergeById(st.holidays, holidays.data || [], 'holiday_date', true);
      st.incharges = mergeById(st.incharges, incharges.data || [], 'month_key', false);
      st.positionDayStatus = mergeById(st.positionDayStatus, positionDayStatus.data || [], 'work_date', true);

      loadedRanges.add(rangeKey);
      console.info(`[${PATCH}] loaded selected month within rolling cap`, {
        month: parsed.key,
        start: parsed.start,
        end: parsed.end,
        reason,
        leaves: (leaves.data || []).length,
        activities: (activities.data || []).length,
        rosterAssignments: (rosterAssignments.data || []).length,
        positions: (positions.data || []).length,
        holidays: (holidays.data || []).length
      });

      maybeRender(rangeKey);
    } catch (err) {
      loadedRanges.delete(rangeKey);
      console.warn(`[${PATCH}] selected month load failed`, parsed.key, err?.message || err);
    } finally {
      loadingRanges.delete(rangeKey);
    }
  }

  function ensureVisibleMonths(reason) {
    requestedVisibleMonthKeys().forEach(key => ensureMonthLoaded(key, reason));
  }

  const oldLoadAllData = window.loadAllData || (typeof loadAllData === 'function' ? loadAllData : null);
  if (oldLoadAllData) {
    window.loadAllData = loadAllData = async function loadAllDataV79SelectedMonth() {
      await oldLoadAllData();
      ensureVisibleMonths('after-loadAllData');
    };
  }

  const oldRenderCalendar = window.renderCalendar || (typeof renderCalendar === 'function' ? renderCalendar : null);
  if (oldRenderCalendar) {
    window.renderCalendar = renderCalendar = function renderCalendarV79() {
      ensureMonthLoaded(currentCalendarMonthKey(), 'render-calendar');
      return oldRenderCalendar.apply(this, arguments);
    };
  }

  const oldRenderSchedulerPage = window.renderSchedulerPage || (typeof renderSchedulerPage === 'function' ? renderSchedulerPage : null);
  if (oldRenderSchedulerPage) {
    window.renderSchedulerPage = renderSchedulerPage = function renderSchedulerPageV79() {
      const st = getState();
      if (st?.monthKey) ensureMonthLoaded(st.monthKey, 'render-scheduler');
      return oldRenderSchedulerPage.apply(this, arguments);
    };
  }

  const oldRenderPositionMonthPage = window.renderPositionMonthPage || (typeof renderPositionMonthPage === 'function' ? renderPositionMonthPage : null);
  if (oldRenderPositionMonthPage) {
    window.renderPositionMonthPage = renderPositionMonthPage = function renderPositionMonthPageV79() {
      const st = getState();
      ensureMonthLoaded(st?.positionMonthKey || st?.monthKey, 'render-position-month');
      return oldRenderPositionMonthPage.apply(this, arguments);
    };
  }

  const oldRenderPositionMonthViewPage = window.renderPositionMonthViewPage || (typeof renderPositionMonthViewPage === 'function' ? renderPositionMonthViewPage : null);
  if (oldRenderPositionMonthViewPage) {
    window.renderPositionMonthViewPage = renderPositionMonthViewPage = function renderPositionMonthViewPageV79() {
      const st = getState();
      ensureMonthLoaded(st?.positionMonthViewKey || st?.monthKey, 'render-position-month-view');
      return oldRenderPositionMonthViewPage.apply(this, arguments);
    };
  }

  window.cnmiLoadMonthV79 = ensureMonthLoaded;
  console.info(`[${PATCH}] installed. Rolling window is today to today + 1 year.`);
})();
