/*
  Patch v76: Calendar future import range
  Purpose: Load imported leave/activity events for 1 Oct 2026 - 30 Jun 2027 into the front-end state.
  Scope: Data fetching only. Does not change auth, drag-drop, roster rules, leave rules, or database schema.
*/
(function () {
  const PATCH = 'v76-calendar-future-range';
  const EXTRA_START = '2026-10-01';
  const EXTRA_END = '2027-06-30';

  function getClient() {
    try {
      if (window.sb) return window.sb;
      if (typeof sb !== 'undefined') return sb;
    } catch (_) {}
    return null;
  }

  function byIdMerge(existing, extra, sortKey) {
    const map = new Map();
    (existing || []).forEach(row => { if (row && row.id) map.set(row.id, row); });
    (extra || []).forEach(row => { if (row && row.id) map.set(row.id, row); });
    const rows = Array.from(map.values());
    if (sortKey) rows.sort((a, b) => String(a?.[sortKey] || '').localeCompare(String(b?.[sortKey] || '')));
    return rows;
  }

  const oldLoadAllData = window.loadAllData || (typeof loadAllData === 'function' ? loadAllData : null);
  if (!oldLoadAllData) {
    console.warn(`[${PATCH}] loadAllData not found`);
    return;
  }

  window.loadAllData = loadAllData = async function loadAllDataV76CalendarFutureRange() {
    await oldLoadAllData();

    const client = getClient();
    if (!client || !window.state && typeof state === 'undefined') return;

    try {
      const [leaves, activities] = await Promise.all([
        client
          .from('leave_requests')
          .select('*')
          .neq('status', 'cancelled')
          .gte('end_date', EXTRA_START)
          .lte('start_date', EXTRA_END)
          .order('start_date', { ascending: false }),
        client
          .from('activity_events')
          .select('*')
          .gte('end_date', EXTRA_START)
          .lte('start_date', EXTRA_END)
          .order('start_date', { ascending: true })
      ]);

      if (leaves.error) throw new Error(`leave_requests: ${leaves.error.message}`);
      if (activities.error) throw new Error(`activity_events: ${activities.error.message}`);

      state.leaves = byIdMerge(state.leaves, leaves.data || [], 'start_date');
      state.activities = byIdMerge(state.activities, activities.data || [], 'start_date');

      console.info(`[${PATCH}] loaded extra calendar rows`, {
        leave_requests: (leaves.data || []).length,
        activity_events: (activities.data || []).length,
        range: `${EXTRA_START} to ${EXTRA_END}`
      });
    } catch (err) {
      console.warn(`[${PATCH}] extra calendar load failed`, err?.message || err);
    }
  };
})();
