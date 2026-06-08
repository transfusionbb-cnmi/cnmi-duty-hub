/* patch-v105-desktop-roster-tabs-fix.js
   CNMI Staff Planner patch-only
   Purpose: Fix v104 desktop monthly roster UI
   - Disable the broken v104 desktop roster panel only
   - Rebuild desktop monthly roster 4 views with delegated click handlers
   - Prevent old detailed table from stacking under the colored calendar by collapsing it behind a toggle
   - Do not touch SQL / Supabase / Auto Assign / leave / fiscal year / trade workflow
*/
(function () {
  'use strict';

  const PATCH_ID = 'v105-desktop-roster-tabs-fix';
  const PANEL_ID = 'v105RosterDesktopPanel';
  const STORAGE_KEY = 'cnmi_v105_roster_view_mode';
  const TH_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const TH_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const DUTY_ORDER = ['ชบด1', 'ชบด2', 'ชบด3', 'ช4', 'ช3A', 'ช3B', 'ช9'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const cleanText = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const pageTitle = () => cleanText($('#pageTitle')) || '';
  const pageRoot = () => $('#pageContent') || document.body;

  function injectStyle() {
    if ($('#v105PatchStyle')) return;
    const style = document.createElement('style');
    style.id = 'v105PatchStyle';
    style.textContent = `
      /* Stop v104 duplicate desktop panel from showing. Leave v104 mobile fixes untouched. */
      @media (min-width:769px){#v104RosterDesktopPanel{display:none!important}}

      .v105-roster-panel{display:none;margin:18px 0 22px 0;border:1px solid #dce9f5;border-radius:26px;background:#fff;padding:18px;box-shadow:0 10px 30px rgba(22,72,116,.07);position:relative;z-index:2}
      @media (min-width:769px){.v105-roster-panel{display:block}}
      .v105-roster-top{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}
      .v105-roster-title{font-weight:900;color:#1e344a;font-size:18px}
      .v105-roster-note{font-size:13px;color:#72849a;margin-top:2px}
      .v105-roster-tabs{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0 14px 0;position:relative;z-index:5}
      .v105-roster-tab{appearance:none;border:1px solid #d9e8f5;background:#fff;color:#2b7fb8;border-radius:14px;padding:10px 16px;font-weight:800;cursor:pointer;font-family:inherit;line-height:1.15;position:relative;z-index:6;pointer-events:auto;transition:.15s ease}
      .v105-roster-tab:hover{border-color:#80caff;box-shadow:0 6px 14px rgba(37,141,206,.12)}
      .v105-roster-tab.active{background:#80caff;color:#10344f;border-color:#80caff;box-shadow:0 8px 18px rgba(37,141,206,.18)}
      .v105-roster-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
      .v105-mini-btn{border:1px solid #d9e8f5;background:#fff;color:#2b7fb8;border-radius:14px;padding:9px 12px;font-weight:800;cursor:pointer;font-family:inherit}
      .v105-roster-content{position:relative;z-index:1}
      .v105-hint{color:#6d8096;font-size:14px;margin:4px 0 14px 0}

      .v105-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:12px;align-items:stretch}
      .v105-weekday{font-weight:900;text-align:center;color:#536377;padding:3px 0 7px 0}
      .v105-day-cell{min-height:154px;border:1px solid #e0ebf5;border-radius:18px;background:#fbfdff;padding:10px;overflow:hidden;cursor:pointer;transition:.15s ease;display:flex;flex-direction:column;gap:5px}
      .v105-day-cell:hover{border-color:#80caff;box-shadow:0 8px 20px rgba(37,141,206,.10)}
      .v105-day-cell.is-weekend{background:#fffaf0}
      .v105-day-cell.is-other-month{opacity:.38;background:#f6f8fb;cursor:default}
      .v105-day-num{font-weight:900;color:#26384c;font-size:15px;margin-bottom:2px;line-height:1}
      .v105-duty-bar{min-height:28px;line-height:1.2;border-radius:10px;padding:6px 9px;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(0,0,0,.08);box-sizing:border-box;box-shadow:inset 0 -1px rgba(0,0,0,.05)}
      .v105-day-more{font-size:12px;color:#6d8096;margin-top:1px;font-weight:800}

      .v105-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:12px}
      .v105-card{border:1px solid #e0ebf5;border-radius:18px;padding:13px;background:#fbfdff;min-width:0}
      .v105-card-title{font-weight:900;margin-bottom:8px;color:#1d3348}
      .v105-card-line{color:#52657b;font-weight:750;margin-top:8px;line-height:1.55}
      .v105-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:6px 11px;margin:3px;font-weight:900;font-size:13px;border:1px solid rgba(0,0,0,.08);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;box-sizing:border-box}
      .v105-select-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
      .v105-select-row select{border:1px solid #d9e8f5;border-radius:12px;padding:9px 12px;background:#fff;font-family:inherit;font-weight:800;color:#24435c}
      .v105-table-wrap{overflow:auto;border:1px solid #e0ebf5;border-radius:18px;background:#fff}
      .v105-mini-table{width:100%;border-collapse:collapse;min-width:620px}
      .v105-mini-table th,.v105-mini-table td{border-bottom:1px solid #e0ebf5;padding:11px 12px;text-align:left;vertical-align:top}
      .v105-mini-table th{background:#f4f8fc;color:#40536a;font-weight:900}
      .v105-empty{border:1px dashed #cbdceb;background:#f8fbff;border-radius:18px;padding:18px;color:#6b7b91;text-align:center;font-weight:800}

      @media (min-width:769px){
        .v105-original-roster-wrap.v105-collapsed{display:none!important}
      }
    `;
    document.head.appendChild(style);
  }

  function normalizeDuty(s) {
    const raw = String(s || '').replace(/\s+/g, '').trim();
    if (!raw) return '';
    if (/ชบด\s*1|ชบต1|ชบด1/i.test(raw)) return 'ชบด1';
    if (/ชบด\s*2|ชบต2|ชบด2/i.test(raw)) return 'ชบด2';
    if (/ชบด\s*3|ชบต3|ชบด3/i.test(raw)) return 'ชบด3';
    if (/ช3\s*A|ช3A/i.test(raw)) return 'ช3A';
    if (/ช3\s*B|ช3B/i.test(raw)) return 'ช3B';
    if (/ช\s*9|ช9/i.test(raw)) return 'ช9';
    if (/ช\s*4|ช4/i.test(raw)) return 'ช4';
    return String(s || '').trim();
  }

  function colorToRgb(str) {
    if (!str || str === 'transparent' || str === 'rgba(0, 0, 0, 0)') return null;
    const m = String(str).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
  }

  function readableTextColor(bg) {
    const rgb = colorToRgb(bg);
    if (!rgb) return '#10263a';
    const [r, g, b] = rgb;
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 150 ? '#10263a' : '#ffffff';
  }

  function getUsefulBg(el) {
    if (!el) return '';
    const nodes = [el, ...$$('*', el).slice(0, 26)];
    for (const node of nodes) {
      const cs = getComputedStyle(node);
      const bg = cs.backgroundColor;
      const rgb = colorToRgb(bg);
      if (!rgb) continue;
      const [r, g, b] = rgb;
      const isWhiteish = r > 242 && g > 242 && b > 242;
      const isBlackish = r < 10 && g < 10 && b < 10;
      if (!isWhiteish && !isBlackish) return bg;
    }
    return '';
  }

  function staffNameFromText(raw) {
    let t = String(raw || '').replace(/\s+/g, ' ').trim();
    t = t.replace(/แลก\s*\/\s*ขาย\s*\/\s*ยก/g, '');
    t = t.replace(/แลก\s*\/\s*ขาย/g, '');
    t = t.replace(/MT_OR_TANG|MT|เคิก|locked|ล้าง|เลือก|ปลดล็อก|ไม่ต้องจัดตำแหน่ง|WEEKEND|HOLIDAY|ยังไม่จัด/g, '');
    t = t.replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t) return '';
    const first = t.split(/\s+/)[0];
    if (!first || first.length > 20) return '';
    return first;
  }

  function extractStaffFromCell(cell) {
    if (!cell) return '';
    const preferred = $$('[class*="pill"], [class*="badge"], [class*="chip"], span, button', cell)
      .map(n => staffNameFromText(cleanText(n)))
      .filter(Boolean)
      .filter(t => !/แลก|ขาย|ยก|ล้าง|เลือก|ปลด|MT|เคิก|เวร|วัน|เดือน|บาท|ชม/.test(t));
    if (preferred.length) return preferred[0];

    const clone = cell.cloneNode(true);
    $$('button, select, option, script, style', clone).forEach(n => n.remove());
    return staffNameFromText(cleanText(clone));
  }

  function findRosterTable() {
    const root = pageRoot();
    const tables = $$('table', root).filter(tbl => !tbl.closest('#' + PANEL_ID));
    return tables.find(tbl => {
      const t = cleanText(tbl);
      return /ชบด1/.test(t) && /ชบด2/.test(t) && /ชบด3/.test(t) && /วันที่/.test(t);
    }) || null;
  }

  function getStaffColorMap(root = pageRoot()) {
    const map = new Map();
    const possible = $$('[class*="staff"], [class*="person"], [class*="summary"], [class*="card"], [class*="pill"], [class*="badge"], [class*="chip"], button, span', root)
      .filter(el => !el.closest('#' + PANEL_ID));
    for (const el of possible) {
      const name = staffNameFromText(cleanText(el));
      if (!name || /เวร|บาท|ชม|ทั้งหมด|Export|เดือน|ตาราง|สรุป|MT|เคิก|วันที่/.test(name)) continue;
      const bg = getUsefulBg(el);
      if (bg && !map.has(name)) map.set(name, bg);
    }
    return map;
  }

  function getRosterYearMonth() {
    const root = pageRoot();
    const combined = `${pageTitle()} ${cleanText(root).slice(0, 1400)}`;
    for (let i = 0; i < TH_MONTHS.length; i++) {
      const re = new RegExp(`${TH_MONTHS[i]}\\s*(25\\d{2}|20\\d{2})`);
      const m = combined.match(re);
      if (m) {
        let y = Number(m[1]);
        if (y > 2400) y -= 543;
        return { year: y, monthIndex: i, monthName: TH_MONTHS[i] };
      }
    }
    const monthInputs = $$('input[type="month"], input[type="text"]', root);
    for (const input of monthInputs) {
      const v = input.value || '';
      const m1 = v.match(/(20\d{2})-(\d{2})/);
      if (m1) return { year: Number(m1[1]), monthIndex: Number(m1[2]) - 1, monthName: TH_MONTHS[Number(m1[2]) - 1] };
      for (let i = 0; i < TH_MONTHS.length; i++) {
        if (v.includes(TH_MONTHS[i])) {
          const ym = v.match(/(25\d{2}|20\d{2})/);
          let y = ym ? Number(ym[1]) : new Date().getFullYear();
          if (y > 2400) y -= 543;
          return { year: y, monthIndex: i, monthName: TH_MONTHS[i] };
        }
      }
    }
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth(), monthName: TH_MONTHS[now.getMonth()] };
  }

  function parseRosterData() {
    const table = findRosterTable();
    if (!table) return null;
    const staffColors = getStaffColorMap();
    const headerCells = $$('thead th, tr:first-child th, tr:first-child td', table).map(th => normalizeDuty(cleanText(th)) || cleanText(th));
    const dutyIndexes = [];
    headerCells.forEach((h, idx) => {
      const duty = normalizeDuty(h);
      if (DUTY_ORDER.includes(duty)) dutyIndexes.push({ idx, duty });
    });
    if (!dutyIndexes.length) return null;

    const rows = $$('tbody tr', table);
    const useRows = rows.length ? rows : $$('tr', table).slice(1);
    const entries = [];
    const days = new Map();

    for (const row of useRows) {
      const cells = $$('td, th', row);
      if (!cells.length) continue;
      const dateTxt = cleanText(cells[0]);
      const dm = dateTxt.match(/(\d{1,2})/);
      if (!dm) continue;
      const day = Number(dm[1]);
      if (!day || day > 31) continue;
      if (!days.has(day)) days.set(day, { day, dateText: dateTxt, entries: [] });

      for (const { idx, duty } of dutyIndexes) {
        const cell = cells[idx];
        if (!cell) continue;
        const staff = extractStaffFromCell(cell);
        if (!staff || /WEEKEND|HOLIDAY|ยังไม่จัด|ไม่ต้องจัด|ลา\/ไม่รับเวร/.test(staff)) continue;
        const color = staffColors.get(staff) || getUsefulBg(cell) || '#dbeafe';
        const item = { day, duty, staff, color };
        entries.push(item);
        days.get(day).entries.push(item);
      }
    }

    const ym = getRosterYearMonth();
    return { table, days, entries, ...ym };
  }

  function chip(item, label) {
    const span = document.createElement('span');
    span.className = 'v105-chip';
    const bg = item.color || '#dbeafe';
    span.style.background = bg;
    span.style.color = readableTextColor(bg);
    span.textContent = label || item.staff || '-';
    return span;
  }

  function getMode(panel) {
    const fromPanel = panel && panel.dataset.mode;
    const fromStore = localStorage.getItem(STORAGE_KEY);
    return fromPanel || fromStore || 'calendar';
  }

  function setMode(mode) {
    localStorage.setItem(STORAGE_KEY, mode);
    const panel = $('#' + PANEL_ID);
    if (panel) panel.dataset.mode = mode;
  }

  function renderCalendar(data) {
    const wrap = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'v105-calendar-grid';
    TH_WEEKDAYS.forEach(w => {
      const h = document.createElement('div');
      h.className = 'v105-weekday';
      h.textContent = w;
      grid.appendChild(h);
    });

    const first = new Date(data.year, data.monthIndex, 1);
    const lastDate = new Date(data.year, data.monthIndex + 1, 0).getDate();
    const prevLast = new Date(data.year, data.monthIndex, 0).getDate();
    const startOffset = first.getDay();
    const totalCells = Math.ceil((startOffset + lastDate) / 7) * 7;

    for (let i = 0; i < totalCells; i++) {
      const cell = document.createElement('div');
      cell.className = 'v105-day-cell';
      let day;
      let other = false;
      if (i < startOffset) { day = prevLast - startOffset + i + 1; other = true; }
      else if (i >= startOffset + lastDate) { day = i - (startOffset + lastDate) + 1; other = true; }
      else { day = i - startOffset + 1; }
      if (other) cell.classList.add('is-other-month');
      if (i % 7 === 0 || i % 7 === 6) cell.classList.add('is-weekend');

      const head = document.createElement('div');
      head.className = 'v105-day-num';
      head.textContent = String(day);
      cell.appendChild(head);

      const entries = other ? [] : (data.days.get(day)?.entries || []);
      entries.slice(0, 5).forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'v105-duty-bar';
        bar.style.background = item.color || '#dbeafe';
        bar.style.color = readableTextColor(item.color || '#dbeafe');
        bar.title = `${item.duty}: ${item.staff}`;
        bar.textContent = `${item.duty} ${item.staff}`;
        cell.appendChild(bar);
      });
      if (entries.length > 5) {
        const more = document.createElement('div');
        more.className = 'v105-day-more';
        more.textContent = `+${entries.length - 5}`;
        cell.appendChild(more);
      }
      if (!other && entries.length) {
        cell.addEventListener('click', () => showDayModal(data, day));
      }
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function showDayModal(data, day) {
    const modal = $('#modal');
    const body = $('#modalBody');
    if (!modal || !body) return;
    const entries = data.days.get(day)?.entries || [];
    body.innerHTML = '';
    const h = document.createElement('h2');
    h.textContent = `${String(day).padStart(2, '0')} ${data.monthName} ${data.year + 543}`;
    body.appendChild(h);
    const box = document.createElement('div');
    box.className = 'v105-grid-2';
    if (!entries.length) {
      box.innerHTML = '<div class="v105-empty">ไม่มีเวรในวันนี้</div>';
    } else {
      entries.forEach(item => {
        const card = document.createElement('div');
        card.className = 'v105-card';
        const title = document.createElement('div');
        title.className = 'v105-card-title';
        title.textContent = item.duty;
        card.appendChild(title);
        card.appendChild(chip(item, item.staff));
        box.appendChild(card);
      });
    }
    body.appendChild(box);
    modal.classList.remove('hidden');
  }

  function renderDay(data) {
    const wrap = document.createElement('div');
    const top = document.createElement('div');
    top.className = 'v105-select-row';
    const b = document.createElement('b');
    b.textContent = 'เลือกวันที่';
    const sel = document.createElement('select');
    const lastDate = new Date(data.year, data.monthIndex + 1, 0).getDate();
    for (let d = 1; d <= lastDate; d++) {
      const opt = document.createElement('option');
      opt.value = String(d);
      opt.textContent = `${d} ${data.monthName}`;
      sel.appendChild(opt);
    }
    const today = new Date();
    if (today.getFullYear() === data.year && today.getMonth() === data.monthIndex) sel.value = String(today.getDate());
    top.append(b, sel);
    const result = document.createElement('div');
    result.className = 'v105-grid-2';
    const paint = () => {
      result.innerHTML = '';
      const entries = data.days.get(Number(sel.value))?.entries || [];
      if (!entries.length) {
        result.innerHTML = '<div class="v105-empty">ไม่มีเวรในวันที่เลือก</div>';
        return;
      }
      entries.forEach(item => {
        const card = document.createElement('div');
        card.className = 'v105-card';
        const title = document.createElement('div');
        title.className = 'v105-card-title';
        title.textContent = item.duty;
        card.appendChild(title);
        card.appendChild(chip(item, item.staff));
        result.appendChild(card);
      });
    };
    sel.addEventListener('change', paint);
    paint();
    wrap.append(top, result);
    return wrap;
  }

  function renderPerson(data) {
    const wrap = document.createElement('div');
    wrap.className = 'v105-grid-2';
    const byPerson = new Map();
    data.entries.forEach(item => {
      if (!byPerson.has(item.staff)) byPerson.set(item.staff, { color: item.color, items: [] });
      byPerson.get(item.staff).items.push(item);
    });
    Array.from(byPerson.entries()).sort((a, b) => a[0].localeCompare(b[0], 'th')).forEach(([staff, obj]) => {
      const card = document.createElement('div');
      card.className = 'v105-card';
      card.appendChild(chip({ color: obj.color, staff }, staff));
      const detail = document.createElement('div');
      detail.className = 'v105-card-line';
      detail.textContent = obj.items.map(x => `${x.day}: ${x.duty}`).join(' • ');
      card.appendChild(detail);
      wrap.appendChild(card);
    });
    if (!byPerson.size) wrap.innerHTML = '<div class="v105-empty">ยังไม่มีข้อมูลเวรในเดือนนี้</div>';
    return wrap;
  }

  function renderSummary(data) {
    const byPerson = new Map();
    data.entries.forEach(item => {
      if (!byPerson.has(item.staff)) byPerson.set(item.staff, { color: item.color, total: 0, counts: {} });
      const row = byPerson.get(item.staff);
      row.total += 1;
      row.counts[item.duty] = (row.counts[item.duty] || 0) + 1;
    });
    const wrap = document.createElement('div');
    if (!byPerson.size) {
      wrap.innerHTML = '<div class="v105-empty">ยังไม่มีข้อมูลสำหรับสรุป</div>';
      return wrap;
    }
    const tableWrap = document.createElement('div');
    tableWrap.className = 'v105-table-wrap';
    const table = document.createElement('table');
    table.className = 'v105-mini-table';
    table.innerHTML = '<thead><tr><th>ชื่อ</th><th>รวมเวร</th><th>รายละเอียด</th></tr></thead><tbody></tbody>';
    const tbody = $('tbody', table);
    Array.from(byPerson.entries()).sort((a, b) => b[1].total - a[1].total).forEach(([staff, row]) => {
      const tr = document.createElement('tr');
      const tdName = document.createElement('td');
      tdName.appendChild(chip({ color: row.color, staff }, staff));
      const tdTotal = document.createElement('td');
      tdTotal.textContent = String(row.total);
      const tdDetail = document.createElement('td');
      tdDetail.textContent = DUTY_ORDER.map(d => row.counts[d] ? `${d} ${row.counts[d]}` : '').filter(Boolean).join(' • ') || '-';
      tr.append(tdName, tdTotal, tdDetail);
      tbody.appendChild(tr);
    });
    tableWrap.appendChild(table);
    wrap.appendChild(tableWrap);
    return wrap;
  }

  function getOriginalWrapper(table) {
    const candidates = [
      table.closest('.table-responsive'),
      table.closest('.table-wrap'),
      table.closest('[class*="table"]'),
      table.parentElement
    ].filter(Boolean);
    const ownPanel = table.closest('#' + PANEL_ID);
    return candidates.find(el => el !== ownPanel && !el.closest('#' + PANEL_ID)) || table;
  }

  function renderPanel(data) {
    const root = pageRoot();
    let panel = $('#' + PANEL_ID, root);
    const table = data.table;
    const wrapper = getOriginalWrapper(table);

    if (wrapper) {
      wrapper.classList.add('v105-original-roster-wrap');
      if (!wrapper.dataset.v105UserOpened) wrapper.classList.add('v105-collapsed');
    }

    if (!panel) {
      panel = document.createElement('section');
      panel.id = PANEL_ID;
      panel.className = 'v105-roster-panel';
      const insertBefore = wrapper && wrapper.parentNode ? wrapper : table;
      insertBefore.parentNode.insertBefore(panel, insertBefore);
    }

    const mode = getMode(panel);
    panel.dataset.mode = mode;
    panel.innerHTML = '';

    const top = document.createElement('div');
    top.className = 'v105-roster-top';
    const titleBox = document.createElement('div');
    const title = document.createElement('div');
    title.className = 'v105-roster-title';
    title.textContent = `มุมมองเวรประจำเดือน ${data.monthName} ${data.year + 543}`;
    const note = document.createElement('div');
    note.className = 'v105-roster-note';
    note.textContent = 'แสดงสีตามเจ้าหน้าที่ เลือกมุมมองได้เหมือนในมือถือ';
    titleBox.append(title, note);

    const actions = document.createElement('div');
    actions.className = 'v105-roster-actions';
    const toggleOriginal = document.createElement('button');
    toggleOriginal.type = 'button';
    toggleOriginal.className = 'v105-mini-btn';
    toggleOriginal.dataset.v105ToggleOriginal = '1';
    toggleOriginal.textContent = wrapper && !wrapper.classList.contains('v105-collapsed') ? 'ซ่อนตารางเดิม' : 'แสดงตารางเดิมสำหรับแลก/ขาย';
    actions.appendChild(toggleOriginal);
    top.append(titleBox, actions);

    const tabs = document.createElement('div');
    tabs.className = 'v105-roster-tabs';
    [
      ['day', 'ดูตามวัน'],
      ['person', 'ดูตามคน'],
      ['summary', 'สรุป OT'],
      ['calendar', 'ตารางทั้งเดือน']
    ].forEach(([m, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v105-roster-tab' + (mode === m ? ' active' : '');
      btn.dataset.v105RosterMode = m;
      btn.textContent = label;
      tabs.appendChild(btn);
    });

    const hint = document.createElement('div');
    hint.className = 'v105-hint';
    hint.textContent = mode === 'calendar'
      ? 'ตารางทั้งเดือนแบบแถบสี กดวันที่เพื่อดูรายละเอียด'
      : 'เลือกดูข้อมูลตามมุมมองที่ต้องการ';

    const content = document.createElement('div');
    content.className = 'v105-roster-content';
    if (mode === 'day') content.appendChild(renderDay(data));
    else if (mode === 'person') content.appendChild(renderPerson(data));
    else if (mode === 'summary') content.appendChild(renderSummary(data));
    else content.appendChild(renderCalendar(data));

    panel.append(top, tabs, hint, content);
  }

  function setupDesktopRoster() {
    if (isMobile()) return;
    if (!/ตารางเวรประจำเดือน/.test(pageTitle())) return;
    const data = parseRosterData();
    if (!data || !data.entries.length) return;
    renderPanel(data);
  }

  function handleClick(e) {
    const tab = e.target.closest('[data-v105-roster-mode]');
    if (tab) {
      e.preventDefault();
      e.stopPropagation();
      setMode(tab.dataset.v105RosterMode || 'calendar');
      scheduleRun(true);
      return;
    }
    const toggle = e.target.closest('[data-v105-toggle-original]');
    if (toggle) {
      e.preventDefault();
      e.stopPropagation();
      const table = findRosterTable();
      const wrapper = table ? getOriginalWrapper(table) : null;
      if (wrapper) {
        wrapper.dataset.v105UserOpened = wrapper.classList.contains('v105-collapsed') ? '1' : '';
        wrapper.classList.toggle('v105-collapsed');
      }
      scheduleRun(true);
    }
  }

  let scheduled = false;
  function scheduleRun(force) {
    if (scheduled && !force) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      injectStyle();
      try { setupDesktopRoster(); } catch (err) { console.warn(`[${PATCH_ID}] skipped`, err); }
    });
  }

  function boot() {
    injectStyle();
    document.addEventListener('click', handleClick, true);
    scheduleRun(true);
    setTimeout(() => scheduleRun(true), 500);
    setTimeout(() => scheduleRun(true), 1400);
    window.addEventListener('resize', () => scheduleRun(false), { passive: true });
    window.addEventListener('hashchange', () => scheduleRun(true), { passive: true });
    const target = $('#pageContent') || document.body;
    const mo = new MutationObserver(() => scheduleRun(false));
    mo.observe(target, { childList: true, subtree: true });
    console.info(`[${PATCH_ID}] loaded`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
