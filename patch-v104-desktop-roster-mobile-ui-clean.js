/* patch-v104-desktop-roster-mobile-ui-clean.js
   CNMI Staff Planner patch-only
   Scope:
   1) Desktop ตารางเวรประจำเดือน: เพิ่มมุมมอง 4 แบบเหมือนมือถือ (ดูตามวัน / ดูตามคน / สรุป OT / ตารางสีแบบ Google Calendar)
   2) Mobile Dashboard > เวรวันนี้: แปลงเป็น list/card ให้พอดีจอ ไม่ต้องเลื่อนซ้ายขวา
   3) Mobile Calendar กลาง: ซ่อน legend สีที่ซ้ำ เหลือชุดแรกที่ละมุนกว่า
   ไม่แตะ SQL / Supabase / Auto Assign / แลกขายเวร / ลา / ปีงบ / จัดตำแหน่งรายเดือน
*/
(function () {
  'use strict';

  const PATCH_ID = 'v104-desktop-roster-mobile-ui-clean';
  const TH_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];
  const TH_WEEKDAYS = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];
  const DUTY_ORDER = ['ชบด1', 'ชบด2', 'ชบด3', 'ช4', 'ช3A', 'ช3B', 'ช9'];

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const text = (el) => (el && el.textContent ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const isMobile = () => window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
  const pageTitle = () => text($('#pageTitle')) || '';
  const pageRoot = () => $('#pageContent') || document.body;

  function injectStyle() {
    if ($('#v104PatchStyle')) return;
    const style = document.createElement('style');
    style.id = 'v104PatchStyle';
    style.textContent = `
      .v104-roster-desktop-panel{display:none;margin:18px 0 22px 0;border:1px solid #dce9f5;border-radius:24px;background:#fff;padding:16px;box-shadow:0 10px 28px rgba(25,84,130,.06)}
      @media (min-width:769px){.v104-roster-desktop-panel{display:block}}
      .v104-roster-tabs{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center}
      .v104-roster-tab{border:1px solid #d9e8f5;background:#fff;color:#2878ad;border-radius:14px;padding:10px 16px;font-weight:700;cursor:pointer;font-family:inherit}
      .v104-roster-tab.active{background:#80caff;color:#12344d;border-color:#80caff;box-shadow:0 8px 18px rgba(37,141,206,.18)}
      .v104-roster-hint{color:#6b7b91;font-size:14px;margin:4px 0 14px 0}
      .v104-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:10px}
      .v104-weekday{font-weight:800;text-align:center;color:#536377;padding:4px 0}
      .v104-day-cell{min-height:124px;border:1px solid #e0ebf5;border-radius:16px;background:#fbfdff;padding:8px;overflow:hidden;cursor:pointer;transition:.15s ease}
      .v104-day-cell:hover{border-color:#80caff;box-shadow:0 8px 20px rgba(37,141,206,.10)}
      .v104-day-cell.is-weekend{background:#fffaf0}
      .v104-day-cell.is-other-month{opacity:.42;background:#f6f8fb}
      .v104-day-num{font-weight:800;color:#26384c;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between;gap:6px}
      .v104-day-more{font-size:12px;color:#6d8096;margin-top:3px}
      .v104-duty-bar{height:24px;line-height:24px;border-radius:8px;padding:0 8px;margin:3px 0;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;border:1px solid rgba(0,0,0,.08)}
      .v104-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .v104-card{border:1px solid #e0ebf5;border-radius:18px;padding:12px;background:#fbfdff}
      .v104-card-title{font-weight:800;margin-bottom:8px;color:#1d3348}
      .v104-chip{display:inline-flex;align-items:center;gap:5px;border-radius:999px;padding:5px 10px;margin:3px;font-weight:800;font-size:13px;border:1px solid rgba(0,0,0,.08)}
      .v104-select-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px}
      .v104-select-row select{border:1px solid #d9e8f5;border-radius:12px;padding:9px 12px;background:#fff;font-family:inherit;font-weight:700;color:#24435c}
      .v104-mini-table{width:100%;border-collapse:collapse;border:1px solid #e0ebf5;border-radius:16px;overflow:hidden}
      .v104-mini-table th,.v104-mini-table td{border-bottom:1px solid #e0ebf5;padding:10px;text-align:left;vertical-align:top}
      .v104-mini-table th{background:#f4f8fc;color:#40536a;font-weight:800}
      .v104-empty{border:1px dashed #cbdceb;background:#f8fbff;border-radius:18px;padding:18px;color:#6b7b91;text-align:center;font-weight:700}

      @media (max-width:768px){
        .v104-hide-mobile-duty-table{display:none!important}
        .v104-mobile-duty-list{display:grid;gap:10px;width:100%;overflow:hidden}
        .v104-mobile-duty-row{display:grid;grid-template-columns:minmax(76px, .72fr) minmax(0, 1fr);gap:10px;align-items:center;border:1px solid #dfeaf5;border-radius:18px;background:#fff;padding:12px 14px;width:100%;box-sizing:border-box}
        .v104-mobile-duty-role{font-weight:800;color:#23364a;white-space:nowrap}
        .v104-mobile-duty-person{justify-self:end;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .v104-mobile-duty-person .v104-chip{margin:0;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
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
    const candidates = [el, ...$$('*', el).slice(0, 20)];
    for (const node of candidates) {
      const cs = getComputedStyle(node);
      const bg = cs.backgroundColor;
      const rgb = colorToRgb(bg);
      if (!rgb) continue;
      const [r, g, b] = rgb;
      if (!(r > 245 && g > 245 && b > 245) && !(r < 10 && g < 10 && b < 10)) return bg;
    }
    return '';
  }

  function extractStaffFromCell(cell) {
    if (!cell) return '';
    const priority = $$('[class*="pill"], [class*="badge"], [class*="chip"], button, span', cell)
      .map(n => text(n))
      .filter(Boolean)
      .filter(t => !/แลก|ขาย|ยก|ล้าง|เลือก|ปลดล็อก|MT_OR_TANG|MT|เคิก|locked|ไม่ต้องจัด|ออกหน่วย/i.test(t));
    if (priority.length) return priority[0].trim();

    const clone = cell.cloneNode(true);
    $$('button, select, option, script, style', clone).forEach(n => n.remove());
    let t = text(clone);
    t = t.replace(/แลก\s*\/\s*ขาย\s*\/\s*ยก/g, '');
    t = t.replace(/แลก\s*\/\s*ขาย/g, '');
    t = t.replace(/MT_OR_TANG|MT|เคิก|locked|ล้าง|เลือก|ปลดล็อก/g, '');
    t = t.replace(/[-–—]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!t || /^(ยังไม่จัด|ไม่ต้องจัดตำแหน่ง|WEEKEND|HOLIDAY)$/i.test(t)) return '';
    const parts = t.split(/\s+/).filter(Boolean);
    return parts[0] || '';
  }

  function findRosterTable() {
    const root = pageRoot();
    const tables = $$('table', root);
    return tables.find(tbl => {
      const t = text(tbl);
      return /ชบด1/.test(t) && /ชบด2/.test(t) && /ชบด3/.test(t) && /วันที่/.test(t);
    }) || null;
  }

  function getStaffColorMap(root = pageRoot()) {
    const map = new Map();
    const possible = $$('[class*="staff"], [class*="person"], [class*="summary"], [class*="card"], [class*="pill"], [class*="badge"], [class*="chip"]', root);
    for (const el of possible) {
      const name = text(el).split(/\s+/)[0];
      if (!name || name.length > 16 || /เวร|บาท|ชม|ทั้งหมด|Export|เดือน|ตาราง|สรุป|MT|เคิก/.test(name)) continue;
      const bg = getUsefulBg(el);
      if (bg && !map.has(name)) map.set(name, bg);
    }
    return map;
  }

  function getRosterYearMonth() {
    const root = pageRoot();
    const combined = `${pageTitle()} ${text(root).slice(0, 1000)}`;
    for (let i = 0; i < TH_MONTHS.length; i++) {
      const re = new RegExp(`${TH_MONTHS[i]}\\s*(25\\d{2}|20\\d{2})`);
      const m = combined.match(re);
      if (m) {
        let y = Number(m[1]);
        if (y > 2400) y -= 543;
        return { year: y, monthIndex: i, monthName: TH_MONTHS[i] };
      }
    }
    const inputMonth = $('input[type="month"]', root);
    if (inputMonth && inputMonth.value) {
      const [y, m] = inputMonth.value.split('-').map(Number);
      if (y && m) return { year: y, monthIndex: m - 1, monthName: TH_MONTHS[m - 1] };
    }
    const now = new Date();
    return { year: now.getFullYear(), monthIndex: now.getMonth(), monthName: TH_MONTHS[now.getMonth()] };
  }

  function parseRosterData() {
    const table = findRosterTable();
    if (!table) return null;
    const staffColors = getStaffColorMap();
    const headerCells = $$('thead th, tr:first-child th, tr:first-child td', table).map(th => normalizeDuty(text(th)) || text(th));
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
      const dateTxt = text(cells[0]);
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

  function makeChip(item, extraText = '') {
    const span = document.createElement('span');
    span.className = 'v104-chip';
    span.style.background = item.color || '#dbeafe';
    span.style.color = readableTextColor(item.color || '#dbeafe');
    span.textContent = extraText || `${item.duty}: ${item.staff}`;
    return span;
  }

  function renderCalendarView(data) {
    const wrap = document.createElement('div');
    const grid = document.createElement('div');
    grid.className = 'v104-calendar-grid';
    TH_WEEKDAYS.forEach(w => {
      const h = document.createElement('div');
      h.className = 'v104-weekday';
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
      cell.className = 'v104-day-cell';
      let day;
      let other = false;
      if (i < startOffset) {
        day = prevLast - startOffset + i + 1;
        other = true;
      } else if (i >= startOffset + lastDate) {
        day = i - (startOffset + lastDate) + 1;
        other = true;
      } else {
        day = i - startOffset + 1;
      }
      if (other) cell.classList.add('is-other-month');
      const dow = i % 7;
      if (dow === 0 || dow === 6) cell.classList.add('is-weekend');
      const head = document.createElement('div');
      head.className = 'v104-day-num';
      head.textContent = day;
      cell.appendChild(head);
      const dayEntries = other ? [] : (data.days.get(day)?.entries || []);
      dayEntries.slice(0, 4).forEach(item => {
        const bar = document.createElement('div');
        bar.className = 'v104-duty-bar';
        bar.style.background = item.color || '#dbeafe';
        bar.style.color = readableTextColor(item.color || '#dbeafe');
        bar.textContent = `${item.duty} ${item.staff}`;
        cell.appendChild(bar);
      });
      if (dayEntries.length > 4) {
        const more = document.createElement('div');
        more.className = 'v104-day-more';
        more.textContent = `+${dayEntries.length - 4}`;
        cell.appendChild(more);
      }
      if (!other && dayEntries.length) {
        cell.addEventListener('click', () => showRosterDayModal(data, day));
      }
      grid.appendChild(cell);
    }
    wrap.appendChild(grid);
    return wrap;
  }

  function showRosterDayModal(data, day) {
    const modal = $('#modal');
    const body = $('#modalBody');
    if (!modal || !body) return;
    const entries = data.days.get(day)?.entries || [];
    body.innerHTML = `<h2>${String(day).padStart(2, '0')} ${data.monthName} ${data.year + 543}</h2>`;
    const box = document.createElement('div');
    box.className = 'v104-grid-2';
    entries.forEach(item => {
      const card = document.createElement('div');
      card.className = 'v104-card';
      const title = document.createElement('div');
      title.className = 'v104-card-title';
      title.textContent = item.duty;
      card.appendChild(title);
      card.appendChild(makeChip(item, item.staff));
      box.appendChild(card);
    });
    if (!entries.length) box.innerHTML = '<div class="v104-empty">ไม่มีเวรในวันนี้</div>';
    body.appendChild(box);
    modal.classList.remove('hidden');
  }

  function renderDayView(data) {
    const wrap = document.createElement('div');
    const row = document.createElement('div');
    row.className = 'v104-select-row';
    const label = document.createElement('b');
    label.textContent = 'เลือกวันที่';
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
    row.append(label, sel);
    const result = document.createElement('div');
    result.className = 'v104-grid-2';
    function paint() {
      result.innerHTML = '';
      const d = Number(sel.value);
      const entries = data.days.get(d)?.entries || [];
      if (!entries.length) {
        result.innerHTML = '<div class="v104-empty">ไม่มีเวรในวันที่เลือก</div>';
        return;
      }
      entries.forEach(item => {
        const card = document.createElement('div');
        card.className = 'v104-card';
        card.innerHTML = `<div class="v104-card-title">${item.duty}</div>`;
        card.appendChild(makeChip(item, item.staff));
        result.appendChild(card);
      });
    }
    sel.addEventListener('change', paint);
    paint();
    wrap.append(row, result);
    return wrap;
  }

  function renderPersonView(data) {
    const wrap = document.createElement('div');
    wrap.className = 'v104-grid-2';
    const byPerson = new Map();
    data.entries.forEach(item => {
      if (!byPerson.has(item.staff)) byPerson.set(item.staff, []);
      byPerson.get(item.staff).push(item);
    });
    Array.from(byPerson.entries()).sort((a, b) => a[0].localeCompare(b[0], 'th')).forEach(([staff, items]) => {
      const card = document.createElement('div');
      card.className = 'v104-card';
      const first = items[0] || {};
      card.appendChild(makeChip(first, staff));
      const detail = document.createElement('div');
      detail.style.marginTop = '8px';
      detail.style.color = '#52657b';
      detail.style.fontWeight = '700';
      detail.textContent = items.map(x => `${x.day}: ${x.duty}`).join(' • ');
      card.appendChild(detail);
      wrap.appendChild(card);
    });
    if (!byPerson.size) wrap.innerHTML = '<div class="v104-empty">ยังไม่มีข้อมูลเวรในเดือนนี้</div>';
    return wrap;
  }

  function renderSummaryView(data) {
    const wrap = document.createElement('div');
    const byPerson = new Map();
    data.entries.forEach(item => {
      if (!byPerson.has(item.staff)) byPerson.set(item.staff, { color: item.color, total: 0, counts: {} });
      const row = byPerson.get(item.staff);
      row.total += 1;
      row.counts[item.duty] = (row.counts[item.duty] || 0) + 1;
    });
    const table = document.createElement('table');
    table.className = 'v104-mini-table';
    table.innerHTML = `<thead><tr><th>ชื่อ</th><th>รวมเวร</th><th>รายละเอียด</th></tr></thead><tbody></tbody>`;
    const tbody = $('tbody', table);
    Array.from(byPerson.entries()).sort((a, b) => b[1].total - a[1].total).forEach(([staff, row]) => {
      const tr = document.createElement('tr');
      const chipItem = { staff, color: row.color, duty: '' };
      const detail = DUTY_ORDER.map(d => row.counts[d] ? `${d} ${row.counts[d]}` : '').filter(Boolean).join(' • ');
      tr.innerHTML = `<td></td><td>${row.total}</td><td>${detail || '-'}</td>`;
      tr.children[0].appendChild(makeChip(chipItem, staff));
      tbody.appendChild(tr);
    });
    wrap.appendChild(table);
    if (!byPerson.size) wrap.innerHTML = '<div class="v104-empty">ยังไม่มีข้อมูลสำหรับสรุป</div>';
    return wrap;
  }

  function setupDesktopRosterViews() {
    if (isMobile()) return;
    if (!/ตารางเวรประจำเดือน/.test(pageTitle())) return;
    const data = parseRosterData();
    if (!data || !data.entries.length) return;
    const root = pageRoot();
    let panel = $('#v104RosterDesktopPanel', root);
    if (!panel) {
      panel = document.createElement('section');
      panel.id = 'v104RosterDesktopPanel';
      panel.className = 'v104-roster-desktop-panel';
      const table = data.table;
      const parentCard = table.closest('.card, .panel, section, div') || root;
      parentCard.parentNode.insertBefore(panel, parentCard);
    }

    const active = panel.getAttribute('data-active') || 'calendar';
    const tabs = [
      ['day', 'ดูตามวัน'],
      ['person', 'ดูตามคน'],
      ['summary', 'สรุป OT'],
      ['calendar', 'ตารางทั้งเดือน']
    ];
    panel.innerHTML = `
      <div class="v104-roster-tabs"></div>
      <div class="v104-roster-hint">มุมมองเวอร์ชันคอมแบบเดียวกับมือถือ แสดงสีตามเจ้าหน้าที่ กดวันที่ในตารางเพื่อดูรายละเอียด</div>
      <div class="v104-roster-content"></div>
    `;
    const tabsEl = $('.v104-roster-tabs', panel);
    const content = $('.v104-roster-content', panel);
    function paint(mode) {
      panel.setAttribute('data-active', mode);
      $$('.v104-roster-tab', panel).forEach(btn => btn.classList.toggle('active', btn.dataset.mode === mode));
      content.innerHTML = '';
      if (mode === 'day') content.appendChild(renderDayView(data));
      else if (mode === 'person') content.appendChild(renderPersonView(data));
      else if (mode === 'summary') content.appendChild(renderSummaryView(data));
      else content.appendChild(renderCalendarView(data));
    }
    tabs.forEach(([mode, label]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'v104-roster-tab';
      btn.dataset.mode = mode;
      btn.textContent = label;
      btn.addEventListener('click', () => paint(mode));
      tabsEl.appendChild(btn);
    });
    paint(active);
  }

  function setupMobileDashboardDuty() {
    if (!isMobile()) return;
    if (!/ภาพรวมวันนี้|Dashboard/.test(pageTitle())) return;
    const root = pageRoot();
    const tables = $$('table', root);
    const dutyTable = tables.find(tbl => {
      const t = text(tbl);
      return /เวรวันนี้/.test(text(tbl.closest('.card, section, div') || tbl)) && /ผู้รับผิด|ผู้รับผิดชอบ/.test(t) && /ชบด|ช4|ช9/.test(t);
    }) || tables.find(tbl => /ผู้รับผิด|ผู้รับผิดชอบ/.test(text(tbl)) && /ชบด/.test(text(tbl)));
    if (!dutyTable || dutyTable.dataset.v104MobileDone === '1') return;

    const rows = $$('tbody tr', dutyTable);
    const useRows = rows.length ? rows : $$('tr', dutyTable).slice(1);
    const list = document.createElement('div');
    list.className = 'v104-mobile-duty-list';
    useRows.forEach(row => {
      const cells = $$('td, th', row);
      if (cells.length < 2) return;
      const role = text(cells[0]);
      const personCell = cells[1];
      const person = extractStaffFromCell(personCell) || text(personCell) || '-';
      const color = getUsefulBg(personCell) || '#dbeafe';
      const item = { duty: role, staff: person, color };
      const div = document.createElement('div');
      div.className = 'v104-mobile-duty-row';
      const left = document.createElement('div');
      left.className = 'v104-mobile-duty-role';
      left.textContent = role;
      const right = document.createElement('div');
      right.className = 'v104-mobile-duty-person';
      right.appendChild(makeChip(item, person));
      div.append(left, right);
      list.appendChild(div);
    });
    if (!list.children.length) return;
    dutyTable.classList.add('v104-hide-mobile-duty-table');
    dutyTable.dataset.v104MobileDone = '1';
    dutyTable.parentNode.insertBefore(list, dutyTable.nextSibling);
  }

  function setupCalendarLegendCleanup() {
    if (!isMobile()) return;
    if (!/Calendar กลาง|ปฏิทิน|Calendar/.test(pageTitle())) return;
    const root = pageRoot();
    const labels = ['ลาพักร้อน', 'ลากิจ', 'ลาป่วย', 'อบรม', 'ประชุม', 'ออกหน่วย'];
    const candidates = $$('div, section, ul', root).filter(el => {
      const t = text(el);
      if (t.length < 35 || t.length > 260) return false;
      const hit = labels.filter(l => t.includes(l)).length;
      return hit >= 5;
    });
    const final = candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
    if (final.length <= 1) return;
    final.slice(1).forEach(el => {
      el.setAttribute('data-v104-hidden-duplicate-legend', '1');
      el.style.display = 'none';
    });
  }

  let scheduled = false;
  function runPatch() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      injectStyle();
      try { setupDesktopRosterViews(); } catch (err) { console.warn(`[${PATCH_ID}] roster view skipped`, err); }
      try { setupMobileDashboardDuty(); } catch (err) { console.warn(`[${PATCH_ID}] dashboard duty skipped`, err); }
      try { setupCalendarLegendCleanup(); } catch (err) { console.warn(`[${PATCH_ID}] calendar legend skipped`, err); }
    });
  }

  function boot() {
    injectStyle();
    runPatch();
    setTimeout(runPatch, 400);
    setTimeout(runPatch, 1200);
    window.addEventListener('resize', runPatch, { passive: true });
    window.addEventListener('hashchange', runPatch, { passive: true });
    document.addEventListener('click', () => setTimeout(runPatch, 80), true);
    const target = $('#pageContent') || document.body;
    const mo = new MutationObserver(runPatch);
    mo.observe(target, { childList: true, subtree: true });
    console.info(`[${PATCH_ID}] loaded`);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
