// patch-v103-leave-list-confirmed-filters.js
// Scope: เฉพาะเมนู "แจ้งลา / ไม่รับเวร" เท่านั้น
// Adds UI-only filters to the existing leave list.
// Does NOT change save/edit/cancel/delete/fiscal-year logic or any other page logic.
(function () {
  'use strict';

  const PATCH_ID = 'patch-v103-leave-list-confirmed-filters';
  if (window[PATCH_ID]) return;
  window[PATCH_ID] = true;

  const TH_MONTHS = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
  };

  const KNOWN_TYPES = [
    'ลาพักร้อน', 'ลากิจ', 'ลาป่วย', 'ลาคลอด', 'อบรม', 'ประชุม', 'ออกหน่วย', 'ไม่รับเวร'
  ];

  const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim();
  const qs = (root, sel) => root ? root.querySelector(sel) : null;
  const qsa = (root, sel) => Array.from(root ? root.querySelectorAll(sel) : []);

  function isLeavePage() {
    const title = norm(document.getElementById('pageTitle')?.textContent || '');
    const sub = norm(document.getElementById('pageSubtitle')?.textContent || '');
    const content = document.getElementById('pageContent');
    const text = norm(content?.textContent || '');
    return title.includes('แจ้งลา') || sub.includes('ลา') || text.includes('รายการของทุกคน') || text.includes('รายการของฉัน');
  }

  function findListHeading(content) {
    const nodes = qsa(content, 'h1,h2,h3,h4,h5,strong,b,div,span');
    return nodes.find(el => {
      const t = norm(el.textContent);
      return t === 'รายการของทุกคน' || t === 'รายการของฉัน' || /^รายการของ(ทุกคน|ฉัน)/.test(t);
    }) || null;
  }

  function findListRoot(content) {
    const heading = findListHeading(content);
    if (!heading) return null;

    const preferred = heading.closest('.card, .panel, .section-card, .content-card, .glass-card, .surface-card, .list-card');
    if (preferred) return preferred;

    // climb to a parent that contains the list actions but does not swallow the whole page when avoidable
    let cur = heading.parentElement;
    let best = cur;
    while (cur && cur !== content && cur.parentElement) {
      const t = norm(cur.textContent);
      if ((t.includes('แก้ไข') || t.includes('ยกเลิก') || t.includes('ลบ')) && (t.includes('รายการของทุกคน') || t.includes('รายการของฉัน'))) {
        best = cur;
      }
      cur = cur.parentElement;
    }
    return best || heading.parentElement;
  }

  function getRows(root) {
    let rows = qsa(root, 'tbody tr').filter(tr => norm(tr.textContent));
    if (rows.length) return rows;

    rows = qsa(root, '[data-leave-id], [data-request-id], .leave-row, .leave-card, .request-row, .request-card, .record-row, .list-row')
      .filter(el => norm(el.textContent));
    if (rows.length) return rows;

    // fallback for custom div list: choose block elements that include row actions/status
    rows = qsa(root, 'div')
      .filter(el => {
        if (el.id === 'v103LeaveFilters') return false;
        const t = norm(el.textContent);
        const childBlocks = qsa(el, 'div').filter(c => norm(c.textContent)).length;
        return childBlocks <= 8 &&
          (t.includes('active') || t.includes('แก้ไข') || t.includes('ยกเลิก') || t.includes('ลบ')) &&
          KNOWN_TYPES.some(type => t.includes(type));
      });
    return rows;
  }

  function rowText(row) {
    return norm(row.textContent || '');
  }

  function detectType(row) {
    const t = rowText(row);
    return KNOWN_TYPES.find(type => t.includes(type)) || '';
  }

  function detectStaff(row) {
    const cells = qsa(row, 'td, .cell, [role="cell"]');
    const first = norm((cells[0] || row).textContent || '');
    let cleaned = first
      .replace(/Admin\s*บันทึกแทน/gi, ' ')
      .replace(/active|inactive|pending|cancelled/gi, ' ')
      .replace(new RegExp(KNOWN_TYPES.join('|'), 'g'), ' ')
      .replace(/แก้ไข|ยกเลิก|ลบ|ลบทั้ง/g, ' ')
      .replace(/\d{1,2}\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*\d{4}/g, ' ');
    cleaned = norm(cleaned);
    return cleaned.split(' ')[0] || '';
  }

  function parseThaiDates(text) {
    const out = [];
    const re = /(\d{1,2})\s*(ม\.ค\.|ก\.พ\.|มี\.ค\.|เม\.ย\.|พ\.ค\.|มิ\.ย\.|ก\.ค\.|ส\.ค\.|ก\.ย\.|ต\.ค\.|พ\.ย\.|ธ\.ค\.)\s*(\d{4})/g;
    let m;
    while ((m = re.exec(text))) {
      const day = Number(m[1]);
      const month = TH_MONTHS[m[2]];
      let year = Number(m[3]);
      if (year > 2400) year -= 543;
      if (day && month && year) out.push(new Date(year, month - 1, day));
    }
    return out;
  }

  function parseIsoDateInput(value) {
    if (!value) return null;
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function sameOrInsideRange(target, dates) {
    if (!target) return true;
    if (!dates.length) return true; // if row has no readable date, don't hide it aggressively
    const start = dates[0];
    const end = dates[1] || dates[0];
    const t = +new Date(target.getFullYear(), target.getMonth(), target.getDate());
    const a = +new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const b = +new Date(end.getFullYear(), end.getMonth(), end.getDate());
    return t >= Math.min(a, b) && t <= Math.max(a, b);
  }

  function monthOverlaps(value, dates) {
    if (!value) return true;
    if (!dates.length) return true;
    const [y, m] = value.split('-').map(Number);
    if (!y || !m) return true;
    const monthStart = new Date(y, m - 1, 1);
    const monthEnd = new Date(y, m, 0);
    const start = dates[0];
    const end = dates[1] || dates[0];
    return +start <= +monthEnd && +end >= +monthStart;
  }

  function createSelect(id, labelText, options) {
    const wrap = document.createElement('label');
    wrap.className = 'v103-filter-label';
    wrap.innerHTML = `<span>${labelText}</span>`;
    const select = document.createElement('select');
    select.id = id;
    select.className = 'v103-filter-control';
    options.forEach(([value, text]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = text;
      select.appendChild(opt);
    });
    wrap.appendChild(select);
    return wrap;
  }

  function createInput(id, labelText, type) {
    const wrap = document.createElement('label');
    wrap.className = 'v103-filter-label';
    wrap.innerHTML = `<span>${labelText}</span>`;
    const input = document.createElement('input');
    input.id = id;
    input.type = type;
    input.className = 'v103-filter-control';
    wrap.appendChild(input);
    return wrap;
  }

  function uniqueSorted(arr) {
    return Array.from(new Set(arr.filter(Boolean))).sort((a, b) => a.localeCompare(b, 'th'));
  }

  function updateCount(root, rows) {
    const visible = rows.filter(r => r.style.display !== 'none').length;
    const badges = qsa(root, 'span,div,b,strong').filter(el => /^\d+\s*รายการ$/.test(norm(el.textContent)));
    if (badges[0]) badges[0].textContent = `${visible} รายการ`;
  }

  function applyFilters(root, isAdmin) {
    const rows = getRows(root);
    const typeVal = document.getElementById('v103LeaveTypeFilter')?.value || '';
    const staffVal = document.getElementById('v103LeaveStaffFilter')?.value || '';
    const dateVal = document.getElementById('v103LeaveDateFilter')?.value || '';
    const monthVal = document.getElementById('v103LeaveMonthFilter')?.value || '';
    const targetDate = parseIsoDateInput(dateVal);

    rows.forEach(row => {
      const text = rowText(row);
      const typeOk = !typeVal || text.includes(typeVal);
      const staffOk = !isAdmin || !staffVal || detectStaff(row) === staffVal || text.includes(staffVal);
      const dates = parseThaiDates(text);
      const dateOk = !isAdmin || !dateVal || sameOrInsideRange(targetDate, dates);
      const monthOk = isAdmin || !monthVal || monthOverlaps(monthVal, dates);
      row.style.display = (typeOk && staffOk && dateOk && monthOk) ? '' : 'none';
    });
    updateCount(root, rows);
  }

  function injectFilters() {
    if (!isLeavePage()) return;
    const content = document.getElementById('pageContent');
    if (!content) return;
    const root = findListRoot(content);
    if (!root || root.querySelector('#v103LeaveFilters')) return;

    const fullText = norm(root.textContent || content.textContent || '');
    const isAdmin = fullText.includes('รายการของทุกคน');
    const isStaff = fullText.includes('รายการของฉัน') && !isAdmin;
    if (!isAdmin && !isStaff) return;

    const rows = getRows(root);
    const detectedTypes = uniqueSorted(rows.map(detectType));
    const typeOptions = [['', 'ทุกประเภท']].concat((detectedTypes.length ? detectedTypes : KNOWN_TYPES).map(t => [t, t]));
    const staffOptions = [['', 'ทุกคน']].concat(uniqueSorted(rows.map(detectStaff)).map(n => [n, n]));

    const box = document.createElement('div');
    box.id = 'v103LeaveFilters';
    box.className = 'v103-leave-filters';

    box.appendChild(createSelect('v103LeaveTypeFilter', 'ประเภทลา', typeOptions));
    if (isAdmin) {
      box.appendChild(createSelect('v103LeaveStaffFilter', 'ชื่อเจ้าหน้าที่', staffOptions));
      box.appendChild(createInput('v103LeaveDateFilter', 'วันที่-เดือน-ปี', 'date'));
    } else {
      box.appendChild(createInput('v103LeaveMonthFilter', 'เดือน', 'month'));
    }

    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'ghost-btn v103-clear-btn';
    clearBtn.textContent = 'ล้างตัวกรอง';
    clearBtn.addEventListener('click', () => {
      qsa(box, 'select,input').forEach(el => { el.value = ''; });
      applyFilters(root, isAdmin);
    });
    box.appendChild(clearBtn);

    qsa(box, 'select,input').forEach(el => {
      el.addEventListener('change', () => applyFilters(root, isAdmin));
      el.addEventListener('input', () => applyFilters(root, isAdmin));
    });

    const heading = findListHeading(root) || findListHeading(content);
    const insertAfter = heading?.closest('h1,h2,h3,h4,h5,strong,b,div') || heading;
    if (insertAfter && insertAfter.parentElement) {
      insertAfter.insertAdjacentElement('afterend', box);
    } else {
      root.prepend(box);
    }

    if (!document.getElementById('v103LeaveFilterStyle')) {
      const style = document.createElement('style');
      style.id = 'v103LeaveFilterStyle';
      style.textContent = `
        #v103LeaveFilters.v103-leave-filters{
          display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:10px; align-items:end;
          margin:10px 0 14px; padding:10px; border:1px solid rgba(148,163,184,.28);
          border-radius:16px; background:rgba(239,248,255,.65);
        }
        .v103-filter-label{display:flex; flex-direction:column; gap:5px; font-size:12px; color:#64748b; font-weight:700;}
        .v103-filter-control{min-height:40px; border:1px solid #dbe7f2; border-radius:12px; padding:8px 10px; background:white; color:#0f172a; font:inherit;}
        .v103-clear-btn{min-height:40px; align-self:end;}
      `;
      document.head.appendChild(style);
    }

    applyFilters(root, isAdmin);
  }

  function scheduleInject() {
    window.clearTimeout(window.__v103LeaveFilterTimer);
    window.__v103LeaveFilterTimer = window.setTimeout(injectFilters, 120);
  }

  const observer = new MutationObserver(scheduleInject);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', scheduleInject, true);
  document.addEventListener('change', scheduleInject, true);
  scheduleInject();
})();
