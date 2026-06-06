/* CNMI Duty Hub V25 - balanced monthly position assignment */
const CFG = window.CNMI_CONFIG || {};
const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', title: 'Dashboard', subtitle: 'ภาพรวมทั้งหมดของวันนี้', group: 'staff' },
  { id: 'calendar', icon: '📅', title: 'Calendar กลาง', subtitle: 'รวมลา อบรม ประชุม ออกหน่วย วันหยุด และเวร', group: 'staff' },
  { id: 'leave', icon: '🌿', title: 'แจ้งลา / ไม่รับเวร', subtitle: 'บันทึก แก้ไข ยกเลิก และแนบไฟล์', group: 'staff' },
  { id: 'activities', icon: '🗂️', title: 'กิจกรรมหน่วยงาน', subtitle: 'ประชุม อบรม ออกหน่วย ตรวจมาตรฐาน ซ้อม CODE และอื่นๆ', group: 'staff' },
  { id: 'schedule', icon: '📋', title: 'ตารางเวรประจำเดือน', subtitle: 'ดูรายเดือน Export Excel / PDF / Print', group: 'staff' },
  { id: 'positionMonthView', icon: '🗓️', title: 'ตารางตำแหน่งรายเดือน', subtitle: 'ดู default รายเดือนแบบอ่านอย่างเดียว', group: 'staff' },
  { id: 'positions', icon: '🧪', title: 'ตารางตำแหน่งรายวัน', subtitle: 'อินชาร์จปรับและประกาศตารางก่อนเริ่มงาน', group: 'staff' },
  { id: 'ot', icon: '⏱️', title: 'OT & Attendance', subtitle: 'Check-In, ขอ OT, อนุมัติ, สรุป', group: 'staff' },
  { id: 'audit', icon: '🕵️', title: 'Audit Log ล่าสุด', subtitle: 'ประวัติการใช้งานแบบอ่านง่าย กรองรายวันได้', group: 'staff' },
  { id: 'hr', icon: '🧾', title: 'ตรวจสอบ HR', subtitle: 'Admin ตรวจว่าแจ้งใน HR แล้วหรือยัง', group: 'admin' },
  { id: 'scheduler', icon: '🧩', title: 'จัดตารางเวร', subtitle: 'Auto Assign, Drag & Drop, Lock, Publish', group: 'admin' },
  { id: 'positionMonth', icon: '🗓️', title: 'จัดตำแหน่งรายเดือน', subtitle: 'Admin วาง default ทั้งเดือนก่อนให้อินชาร์จปรับรายวัน', group: 'admin' },
  { id: 'users', icon: '👥', title: 'ผู้ใช้งานและสิทธิ์', subtitle: 'เพิ่ม/แก้ไขเจ้าหน้าที่ เฉพาะ Admin', group: 'admin' },
  { id: 'eligibility', icon: '✅', title: 'สิทธิ์ตำแหน่งรายวัน', subtitle: 'กำหนดว่าแต่ละคนขึ้นตำแหน่งไหนได้', group: 'admin' }
];
const NAV_GROUPS = [
  { id: 'staff', title: 'เมนู Staff', hint: 'ใช้ประจำวัน', adminOnly: false },
  { id: 'admin', title: 'เมนู Admin', hint: 'ตั้งค่าและจัดการระบบ', adminOnly: true }
];

const LEAVE_TYPES = ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด','ไม่รับเวร','อื่นๆ'];
const ACTIVITY_TYPES = ['ประชุม','อบรม','ออกหน่วย','ตรวจมาตรฐาน','ซ้อม CODE','อื่นๆ'];
const OT_REASONS = ['มาช่วยปั่น','มาช่วยจ่ายเลือด','มาช่วยออกหน่วย','อยู่ต่อเคลียร์งาน','มาช่วยงาน CQI','อื่นๆ'];
const HR_STATUSES = ['รอตรวจสอบ','ตรวจสอบแล้ว','รอเอกสาร','ยกเลิก'];
const OT_STATUSES = ['รออนุมัติ','อนุมัติ','ไม่อนุมัติ','ส่งกลับแก้ไข'];
const DUTY_COLUMNS = ['ชบด1','ชบด2','ชบด3','ช4A','ช4B','ช3A','ช3B','ช9-เคิก','ช9-MT'];
const DUTY_LABEL = { 'ช4A': 'ช4', 'ช4B': 'ช4', 'ช9-เคิก': 'ช9', 'ช9-MT': 'ช9' };
const DUTY_SLOT_RULES = {
  weekday: [
    { code: 'ชบด1', role: 'MT' },
    { code: 'ชบด2', role: 'MT' },
    { code: 'ชบด3', role: 'เคิก' },
    { code: 'ช4A', role: 'MT_OR_TANG' },
    { code: 'ช4B', role: 'MT_OR_TANG' }
  ],
  holidayWeekday: [
    { code: 'ชบด1', role: 'MT' },
    { code: 'ชบด2', role: 'MT' },
    { code: 'ชบด3', role: 'MT' }
  ],
  saturday: [
    { code: 'ชบด1', role: 'MT' },
    { code: 'ชบด2', role: 'MT' },
    { code: 'ชบด3', role: 'เคิก' },
    { code: 'ช9-เคิก', role: 'เคิก' },
    { code: 'ช3A', role: 'MT' },
    { code: 'ช3B', role: 'MT' },
    { code: 'ช9-MT', role: 'MT' }
  ],
  sunday: [
    { code: 'ชบด1', role: 'MT' },
    { code: 'ชบด2', role: 'MT' },
    { code: 'ชบด3', role: 'MT' },
    { code: 'ช9-เคิก', role: 'เคิก' },
    { code: 'ช3A', role: 'MT' },
    { code: 'ช3B', role: 'MT' },
    { code: 'ช9-MT', role: 'MT' }
  ]
};
const DEFAULT_POSITIONS = [
  { code: 'BB-Report', zone: 'Blood Bank', break_time: '11:00', main_rule: 'MT / น้องใหม่+พี่เลี้ยง', job_desc: 'ออกผล Routine, คล้องเลือด, พิมพ์รายงาน A4, QC LDPRC (Post-storage)' },
  { code: 'BB-Approve', zone: 'Blood Bank', break_time: '12:00', main_rule: 'MT เท่านั้น', job_desc: 'อนุมัติผลใน LIS, รับเลือดเข้า Stock, จ่ายเลือดไม่ด่วน/ด่วน (OR/ER), ปลดเลือด' },
  { code: 'BB-Support', zone: 'Blood Bank', break_time: '11:00', main_rule: 'แตง / แก๊ส / เฟื่อง', job_desc: 'ปั่นเลือด, รับโทรศัพท์, ส่งเลือด, เติมของ, ทำความสะอาดเครื่องมือ, จดอุณหภูมิ' },
  { code: 'BB-Manual+IH-500 (1)', zone: 'Manual', break_time: '11:00', main_rule: 'MT เท่านั้น', job_desc: 'IH-500, เคสเด็กเล็ก, Ab ID, งาน Manual ทั้งหมด' },
  { code: 'BB-Manual+IH-500 (2)', zone: 'Manual', break_time: '12:00', main_rule: 'MT เท่านั้น', job_desc: 'IH-500, เคสเด็กเล็ก, Ab ID, งาน Manual ทั้งหมด' },
  { code: 'DR-Registration', zone: 'Donor Room', break_time: '12:00', main_rule: 'แตง / แก๊ส / เฟื่อง', job_desc: 'ลงทะเบียน, คัดกรองความดัน ชีพจร อุณหภูมิ, จดอุณหภูมิห้อง' },
  { code: 'DR-Finger 1', zone: 'Donor Room', break_time: '12:00', main_rule: 'MT / แตง', job_desc: 'คัดกรอง, สัมภาษณ์, เจาะปลายนิ้ว' },
  { code: 'DR-Finger 2', zone: 'Donor Room', break_time: '12:00', main_rule: 'MT / แตง', job_desc: 'คัดกรอง, สัมภาษณ์, เจาะปลายนิ้ว' },
  { code: 'DR-Preparation', zone: 'Donor Room', break_time: '12:00', main_rule: 'MT / น้องใหม่+พี่เลี้ยง', job_desc: 'แปะ Bag, Pool Plt., จัดการเลือด Infectious +, วัด pH & Adam' },
  { code: 'DR-Main', zone: 'Donor Room', break_time: '12:00', main_rule: 'น้องใหม่ / MT', job_desc: 'เจาะเลือดตัวหลัก ให้น้องใหม่เก็บเคสเพื่อผ่านโปรไวขึ้น' },
  { code: 'DR-Processing', zone: 'Donor Room', break_time: '12:00', main_rule: 'MT เท่านั้น', job_desc: 'Approve แปะถุง, สรุป QC รายเดือน (ถุงเลือด)' },
  { code: 'DR-Support', zone: 'Donor Room', break_time: '12:00', main_rule: 'แตง / แก๊ส / เฟื่อง / MT', job_desc: 'เตรียม Set เจาะ, เติมน้ำดื่ม/ขนม, เช็ดเตียง' }
];

const OUTING_POSITIONS = [
  { code: 'DR-Registration', eligibility_code: 'OUTING:DR-Registration', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'MT / แตง', job_desc: 'ลงทะเบียน, คัดกรองความดัน ชีพจร อุณหภูมิ' },
  { code: 'DR-Preparation', eligibility_code: 'OUTING:DR-Preparation', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'มัส', job_desc: 'เตรียม set ดูแลโปรแกรมออกหน่วย กรณีไปหน้างานแล้วเกิดปัญหา ดูแลภาพรวม กลับมาลงทะเบียน' },
  { code: 'DR-Finger 1', eligibility_code: 'OUTING:DR-Finger 1', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'MT / แตง', job_desc: 'คัดกรอง สัมภาษณ์ เจาะปลายนิ้ว กลับมาปั่นเลือด' },
  { code: 'DR-Finger 2', eligibility_code: 'OUTING:DR-Finger 2', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'MT / แตง', job_desc: 'คัดกรอง สัมภาษณ์ เจาะปลายนิ้ว กลับมาปั่นเลือด' },
  { code: 'DR-Main 1', eligibility_code: 'OUTING:DR-Main 1', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'MT / แตง', job_desc: 'เจาะเลือดตัวหลัก กลับมาปั่นเลือด' },
  { code: 'DR-Main', eligibility_code: 'OUTING:DR-Main', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'MT / แตง', job_desc: 'เจาะเลือดตัวหลัก กลับมาปั่นเลือด' },
  { code: 'DR-Support', eligibility_code: 'OUTING:DR-Support', zone: 'ออกหน่วย', break_time: 'ออกหน่วย', main_rule: 'แก๊ส / เฟื่อง', job_desc: 'เก็บเซตเจาะ เก็บเลือด เตรียมน้ำดื่ม/ขนม เช็ดเตียง เก็บถุงเลือด จดอุณหภูมิห้องก่อนออกหน่วย' }
];

const FALLBACK_POSITION_BASES = [
  { code: 'BB-Float', zone: 'Blood Bank', break_time: 'ตามอินชาร์จ', main_rule: 'MT / เคิก', job_desc: 'ช่วยงาน Blood Bank ตามที่อินชาร์จมอบหมาย' },
  { code: 'DR-Float', zone: 'Donor Room', break_time: 'ตามอินชาร์จ', main_rule: 'MT / เคิก', job_desc: 'ช่วยงาน Donor Room ตามที่อินชาร์จมอบหมาย' },
  { code: 'BB-Probation', zone: 'Blood Bank', break_time: 'ตามพี่เลี้ยง', main_rule: 'น้องใหม่+พี่เลี้ยง', job_desc: 'ฝึก/ช่วยงาน Blood Bank ภายใต้พี่เลี้ยง' },
  { code: 'DR-Probation', zone: 'Donor Room', break_time: 'ตามพี่เลี้ยง', main_rule: 'น้องใหม่+พี่เลี้ยง', job_desc: 'ฝึก/ช่วยงาน Donor Room ภายใต้พี่เลี้ยง' }
];


const ALL_POSITION_TEMPLATES = [...DEFAULT_POSITIONS, ...OUTING_POSITIONS];
const POSITION_TRAINING_STATUSES = ['ใช้งานปกติ','น้องใหม่ / ยังไม่จัดอัตโนมัติ','จัดได้บางตำแหน่ง','งดจัดชั่วคราว'];
const DEFAULT_STAFF_COLORS = {
  'มัส': '#d7f66f',
  'มายด์': '#a9ddff',
  'มาย': '#a9ddff',
  'หนิง': '#d9bdff',
  'หญิง': '#ffc89f',
  'พลอย': '#9fe36a',
  'อัน': '#ff5c9a',
  'ต้า': '#13b5dc',
  'ปอ': '#ff777d',
  'กิ๊ฟ': '#ffe89a',
  'กิ๊บ': '#ffe89a',
  'ไนซ์': '#ffbd6b',
  'บอล': '#75b8c8',
  'แตง': '#f7b8f2',
  'แก๊ส': '#b897ea',
  'เฟื่อง': '#7898e8',
  'แพ็ต': '#cce8a8',
  'อาร์ม': '#b8d3ff',
  'test': '#e8edf3'
};
const STAFF_DISPLAY_ORDER = ['มัส','มาย','มายด์','หนิง','หญิง','พลอย','อัน','ต้า','ปอ','กิ๊บ','กิ๊ฟ','กิฟ','ไนซ์','บอล','แตง','แก๊ส','เฟื่อง'];
function staffOrderIndex(staff) {
  const nick = String(staff?.nickname || '').trim();
  const i = STAFF_DISPLAY_ORDER.indexOf(nick);
  return i >= 0 ? i : 999;
}
function compareStaffOrder(a, b) {
  return staffOrderIndex(a) - staffOrderIndex(b)
    || String(a?.staff_type || '').localeCompare(String(b?.staff_type || ''), 'th')
    || String(a?.nickname || a?.full_name || '').localeCompare(String(b?.nickname || b?.full_name || ''), 'th');
}
function orderedStaff(list = state.staff) {
  return [...(list || [])].sort(compareStaffOrder);
}
let sb = null;
let state = {
  session: null,
  profile: null,
  page: 'dashboard',
  staff: [],
  leaves: [],
  activities: [],
  hrChecks: [],
  rosterMonths: [],
  rosterAssignments: [],
  positions: [],
  attendance: [],
  otRequests: [],
  tradeRequests: [],
  auditLogs: [],
  holidays: [],
  incharges: [],
  positionEligibility: [],
  positionDayStatus: [],
  eligibilityStaffId: null,
  auditDate: todayStr(),
  calendarDate: new Date(),
  calendarView: 'month',
  monthKey: monthKey(new Date()),
  positionMonthKey: monthKey(new Date()),
  positionMonthViewKey: monthKey(new Date()),
  monthPositionDraft: null,
  rosterDraft: null,
  editingLeaveId: null,
  editingActivityId: null,
  busy: false
};

function $(id) { return document.getElementById(id); }
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr() { return toDateInput(new Date()); }
function toDateInput(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function monthKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; }
function parseDate(s) { const [y,m,d] = String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); }
function formatThaiDate(s) { if (!s) return '-'; const d = typeof s === 'string' ? parseDate(s.slice(0,10)) : s; return d.toLocaleDateString('th-TH', { day:'2-digit', month:'short', year:'numeric' }); }
function formatThaiDateTime(s) { if (!s) return '-'; return new Date(s).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' }); }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function asArray(v) { return Array.isArray(v) ? v : []; }
function currentStaffId() { return state.profile?.id || null; }
function isAdmin() { return state.profile?.role === 'admin'; }
function staffName(id) { const s = state.staff.find(x => x.id === id); return s ? `${s.nickname || s.full_name || ''}${s.nickname && s.full_name ? ` (${s.full_name})` : ''}` : '-'; }
function staffNick(id) { const s = state.staff.find(x => x.id === id); return s?.nickname || s?.full_name || '-'; }
function defaultStaffColor(nick) { return DEFAULT_STAFF_COLORS[String(nick || '').trim()] || '#e8f3ff'; }
function staffColor(staffOrId) {
  const s = typeof staffOrId === 'object' ? staffOrId : state.staff.find(x => x.id === staffOrId);
  return s?.staff_color || defaultStaffColor(s?.nickname || s?.full_name);
}
function textColorFor(bg) {
  const hex = String(bg || '#e8f3ff').replace('#','');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return '#203245';
  const r = parseInt(hex.slice(0,2),16), g = parseInt(hex.slice(2,4),16), b = parseInt(hex.slice(4,6),16);
  return ((r*299 + g*587 + b*114) / 1000) > 145 ? '#203245' : '#ffffff';
}
function staffPill(staffId, opts={}) {
  const s = typeof staffId === 'object' ? staffId : state.staff.find(x => x.id === staffId);
  if (!s) return '<span class="muted">-</span>';
  const bg = staffColor(s);
  const fg = textColorFor(bg);
  const label = escapeHtml(s.nickname || s.full_name || '-');
  const cls = opts.button ? 'staff-color-pill staff-pill-btn' : 'staff-color-pill';
  const attrs = opts.attrs || '';
  const title = escapeHtml(s.full_name || s.nickname || '');
  return `<${opts.button ? 'button' : 'span'} class="${cls}" style="--staff-bg:${bg};--staff-fg:${fg}" title="${title}" ${attrs}>${label}</${opts.button ? 'button' : 'span'}>`;
}
function staffType(id) { return state.staff.find(x => x.id === id)?.staff_type || ''; }
function getMonthRange(key) { const [y,m] = key.split('-').map(Number); return { start: `${y}-${pad(m)}-01`, end: toDateInput(new Date(y, m, 0)), y, m }; }
function dateInRange(date, start, end) { return date >= start && date <= end; }
function overlapsDate(row, date) { return row.start_date <= date && row.end_date >= date && row.status !== 'cancelled'; }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function debounce(fn, wait=250) { let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }

// Capture recovery intent BEFORE Supabase reads/cleans the URL hash.
// This fixes password reset links that otherwise jump straight into Dashboard.
const INITIAL_AUTH_URL = `${window.location.search || ''}${window.location.hash || ''}`;
let RECOVERY_INTENT = /(^|[?#&])type=(recovery|password_recovery|invite)(&|$)/.test(INITIAL_AUTH_URL)
  || /(^|[?#&])mode=(recovery|set-password)(&|$)/.test(INITIAL_AUTH_URL);

function authRedirectUrl(mode='') {
  const base = window.location.origin + window.location.pathname;
  return mode ? `${base}?mode=${encodeURIComponent(mode)}` : base;
}

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2600);
}
function friendlyDbError(error) {
  const msg = String(error?.message || error || '');
  if (msg.includes('null value') && msg.includes('roster_assignments') && msg.includes('id')) return 'บันทึกตารางเวรไม่สำเร็จ เพราะระบบกำลังส่งรหัสรายการเวรว่างอยู่ กรุณารีเฟรชหน้าแล้วกดสร้างร่าง/บันทึกใหม่อีกครั้ง';
  if (msg.includes('violates not-null constraint')) return 'บันทึกไม่สำเร็จ เพราะมีข้อมูลจำเป็นบางช่องว่างอยู่ กรุณาตรวจช่องที่ยังไม่ได้เลือก';
  if (msg.includes('duplicate key')) return 'บันทึกซ้ำกับข้อมูลเดิม กรุณารีเฟรชแล้วลองใหม่';
  if (msg.includes('row-level security')) return 'สิทธิ์ไม่พอสำหรับบันทึกข้อมูลนี้ กรุณาใช้บัญชี Admin หรืออินชาร์จที่ได้รับสิทธิ์';
  if (msg.includes('admin_upsert_leave_v27') || msg.includes('function public.admin_upsert_leave_v27')) return 'ยังบันทึกลาแทนไม่ได้ เพราะยังไม่ได้ Run SQL Patch V27 ใน Supabase';
  if (msg.includes('admin_save_leave') || msg.includes('function public.admin_save_leave') || msg.includes('Could not find the function')) return 'ยังบันทึกลาแทนไม่ได้ เพราะยังไม่ได้ Run SQL Patch V27 ใน Supabase';
  if (msg.includes('admin_record_reason') || msg.includes('recorded_by_admin')) return 'ยังบันทึกลาแทนไม่ได้ เพราะฐานข้อมูลยังไม่มีช่องสำหรับ Admin บันทึกแทน กรุณา Run SQL Patch V27';
  return msg || 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล';
}
function setBusy(on, msg='กำลังโหลด') {
  state.busy = on;
  const sync = $('syncStatus');
  if (sync) sync.textContent = on ? msg : 'พร้อมใช้งาน';
}
function showModal(html) {
  $('modalBody').innerHTML = html;
  $('modal').classList.remove('hidden');
}
function closeModal() { $('modal').classList.add('hidden'); $('modalBody').innerHTML = ''; }
function configReady() {
  return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !CFG.SUPABASE_URL.includes('YOUR_PROJECT_REF') && !CFG.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
}
function requireMahidolEmail(email) {
  const domain = CFG.ALLOWED_DOMAIN || 'mahidol.ac.th';
  return String(email || '').toLowerCase().endsWith('@' + domain.toLowerCase());
}
async function requestPasswordSetupLink(email) {
  const redirectTo = authRedirectUrl('recovery');

  // Recommended flow: Apps Script holds Supabase service_role key safely, checks staff_profiles whitelist,
  // creates/invites Auth user if needed, then sends password setup/recovery link.
  if (CFG.APP_SCRIPT_URL) {
    const res = await fetch(CFG.APP_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'requestPasswordLink', email, redirectTo })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.ok === false) throw new Error(data.message || 'ส่งลิงก์ไม่สำเร็จ');
    return data;
  }

  // Fallback if Apps Script is not configured: works only when the Auth user already exists.
  // It still checks staff_profiles first so random emails do not trigger a login flow from our UI.
  const { data: profile, error: profileError } = await sb
    .from('staff_profiles')
    .select('id,email,is_active')
    .ilike('email', email)
    .maybeSingle();
  if (profileError) throw new Error(profileError.message);
  if (!profile || !profile.is_active) return { ok: true, skipped: true };

  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw error;
  return { ok: true };
}
function isPasswordRecoveryUrl() {
  const raw = `${window.location.search || ''}${window.location.hash || ''}`;
  return RECOVERY_INTENT
    || raw.includes('type=recovery')
    || raw.includes('type=password_recovery')
    || raw.includes('type=invite')
    || raw.includes('mode=recovery')
    || raw.includes('mode=set-password');
}

async function init() {
  bindGlobalEvents();
  renderAuthTabs();
  if (!configReady()) {
    $('setupWarning').classList.remove('hidden');
    return;
  }

  const recoveryAtPageOpen = RECOVERY_INTENT;

  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  sb.auth.onAuthStateChange(async (event, session) => {
    state.session = session;

    // Sign out must win even if this tab was originally opened from a recovery link.
    // Otherwise logging out after setting a password can show the reset form again.
    if (event === 'SIGNED_OUT') {
      RECOVERY_INTENT = false;
      exitApp();
      setBusy(false);
      return;
    }

    // Supabase may emit PASSWORD_RECOVERY, SIGNED_IN, or clean the URL very quickly.
    // If the page was opened from a recovery link, always show reset form first.
    if (event === 'PASSWORD_RECOVERY' || RECOVERY_INTENT || isPasswordRecoveryUrl()) {
      showResetPasswordPanel();
      setBusy(false);
      return;
    }

    if (session?.user) await enterApp();
  });

  const { data } = await sb.auth.getSession();
  state.session = data.session;

  if (RECOVERY_INTENT || isPasswordRecoveryUrl()) {
    showResetPasswordPanel();
    setBusy(false);
    return;
  }

  if (state.session?.user) await enterApp();
}

document.addEventListener('DOMContentLoaded', init);

function bindGlobalEvents() {
  $('modalClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('mobileMenuBtn').addEventListener('click', () => $('sidebar').classList.toggle('open'));
  $('reloadBtn').addEventListener('click', async () => { await loadAllData(); renderPage(); });
  $('logoutBtn').addEventListener('click', async () => { if (sb) { await logAuth('LOGOUT'); sessionStorage.removeItem('cnmi_login_audit_' + (state.session?.user?.id || '')); await sb.auth.signOut(); } });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('loginEmail').value.trim().toLowerCase();
    const password = $('loginPassword').value;
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    setBusy(true, 'กำลังเข้าสู่ระบบ');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return showToast('อีเมลหรือรหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน');
      }
      return showToast(msg);
    }
  });

  $('setupPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('setupPasswordEmail').value.trim().toLowerCase();
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    setBusy(true, 'กำลังส่งลิงก์ตั้งรหัสผ่านใหม่');
    try {
      const result = await requestPasswordSetupLink(email);
      showToast(result?.sentBy === 'MailApp' ? 'ส่งอีเมลตั้งรหัสผ่านแล้ว กรุณาเช็ก Inbox / Spam' : 'ถ้าอีเมลนี้อยู่ในรายชื่อเจ้าหน้าที่ ระบบจะส่งลิงก์ให้ตั้งรหัสผ่านใหม่');
    } catch (err) {
      showToast(err.message || 'ส่งลิงก์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  });

  $('resetPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const password = $('newPassword').value;
    if (password.length < 8) return showToast('รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร');
    // Consume recovery mode before updateUser emits USER_UPDATED, otherwise this tab may keep showing the reset form.
    RECOVERY_INTENT = false;
    if (window.history?.replaceState) window.history.replaceState({}, document.title, authRedirectUrl());
    const { error } = await sb.auth.updateUser({ password });
    if (error) {
      RECOVERY_INTENT = true;
      return showToast(error.message);
    }
    $('resetPasswordForm').classList.add('hidden');
    const { data } = await sb.auth.getSession();
    state.session = data.session;
    showToast('เปลี่ยนรหัสผ่านแล้ว');
    await enterApp();
  });

  document.body.addEventListener('click', handleClick);
  document.body.addEventListener('change', handleChange);
  document.body.addEventListener('submit', handleSubmit);
  document.body.addEventListener('dragstart', handleDragStart);
  document.body.addEventListener('dragover', handleDragOver);
  document.body.addEventListener('dragleave', handleDragLeave);
  document.body.addEventListener('drop', handleDrop);
}

function renderAuthTabs() {
  document.querySelectorAll('.auth-tab').forEach(btn => btn.addEventListener('click', () => {
    document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
    const panel = document.getElementById(btn.dataset.authTab + 'Form');
    if (panel) panel.classList.add('active');
  }));
}
function showResetPasswordPanel() {
  $('appView').classList.add('hidden');
  document.querySelectorAll('.auth-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  $('resetPasswordForm').classList.remove('hidden');
  $('resetPasswordForm').classList.add('active');
  $('authView').classList.remove('hidden');
  if ($('newPassword')) $('newPassword').value = '';
}

async function enterApp() {
  setBusy(true, 'กำลังโหลดข้อมูล');
  await loadProfile();
  if (!state.profile?.is_active) {
    await sb.auth.signOut();
    showToast('บัญชีนี้ยังไม่ได้อยู่ใน whitelist หรือยังไม่ได้เปิดใช้งาน กรุณาให้ Admin ตรวจ staff_profiles');
    setBusy(false);
    return;
  }
  $('authView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  renderNav();
  await loadAllData();
  await logAuthOnce();
  renderPage();
  setBusy(false);
}
function exitApp() {
  state.profile = null;
  $('appView').classList.add('hidden');
  showLoginPanel();
  $('authView').classList.remove('hidden');
}

function showLoginPanel() {
  document.querySelectorAll('.auth-panel').forEach(p => {
    p.classList.remove('active');
    if (p.id === 'resetPasswordForm') p.classList.add('hidden');
  });
  document.querySelectorAll('.auth-tab').forEach(b => b.classList.remove('active'));
  const loginForm = $('loginForm');
  if (loginForm) loginForm.classList.add('active');
  const loginTab = document.querySelector('.auth-tab[data-auth-tab="login"]');
  if (loginTab) loginTab.classList.add('active');
}
async function loadProfile() {
  const user = state.session?.user;
  if (!user) return;
  const { data, error } = await sb.from('staff_profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);
  state.profile = data;
}
async function logAuthOnce() {
  const key = 'cnmi_login_audit_' + (state.session?.user?.id || '');
  if (sessionStorage.getItem(key)) return;
  await logAuth('LOGIN');
  sessionStorage.setItem(key, '1');
}
async function logAuth(action) {
  try {
    if (!sb || !state.profile) return;
    await sb.rpc('write_auth_audit', { p_action: action, p_new_data: { userAgent: navigator.userAgent, at: new Date().toISOString() } });
  } catch (err) {
    console.warn('audit auth failed', err);
  }
}

async function loadAllData() {
  if (!state.profile) return;
  const now = new Date();
  const start = toDateInput(new Date(now.getFullYear(), now.getMonth()-2, 1));
  const end = toDateInput(new Date(now.getFullYear(), now.getMonth()+4, 0));
  const yearStart = `${now.getFullYear()}-01-01`;
  const [staff, leaves, activities, rosterMonths, rosterAssignments, positions, attendance, otRequests, tradeRequests, hrChecks, auditLogs, holidays, incharges, positionEligibility, positionDayStatus] = await Promise.all([
    sb.from('staff_profiles').select('*').order('staff_type').order('nickname'),
    sb.from('leave_requests').select('*').gte('end_date', yearStart).lte('start_date', end).order('start_date', { ascending: false }),
    sb.from('activity_events').select('*').gte('end_date', start).lte('start_date', end).order('start_date'),
    sb.from('roster_months').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    sb.from('roster_assignments').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date'),
    sb.from('daily_positions').select('*').gte('work_date', start).lte('work_date', end).order('work_date'),
    sb.from('attendance_logs').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date', { ascending: false }),
    sb.from('ot_requests').select('*').gte('work_date', yearStart).lte('work_date', end).order('work_date', { ascending: false }),
    sb.from('roster_trade_requests').select('*').gte('created_at', `${start}T00:00:00`).order('created_at', { ascending: false }),
    isAdmin() ? sb.from('hr_checks').select('*').order('updated_at', { ascending: false }) : Promise.resolve({ data: [], error: null }),
    sb.from('audit_logs').select('*').order('created_at', { ascending:false }).limit(250),
    sb.from('public_holidays').select('*').gte('holiday_date', start).lte('holiday_date', end).order('holiday_date'),
    sb.from('monthly_incharges').select('*').gte('month_key', start.slice(0,7)).lte('month_key', end.slice(0,7)).order('month_key', { ascending:false }),
    sb.from('daily_position_eligibility').select('*'),
    sb.from('daily_position_day_status').select('*').gte('work_date', start).lte('work_date', end).order('work_date')
  ]);
  const packs = { staff, leaves, activities, rosterMonths, rosterAssignments, positions, attendance, otRequests, tradeRequests, hrChecks, auditLogs, holidays, incharges, positionEligibility, positionDayStatus };
  Object.entries(packs).forEach(([k,v]) => { if (v.error) throw new Error(`${k}: ${v.error.message}`); });
  state.staff = orderedStaff(staff.data || []);
  state.leaves = leaves.data || [];
  state.activities = activities.data || [];
  state.rosterMonths = rosterMonths.data || [];
  state.rosterAssignments = rosterAssignments.data || [];
  state.positions = positions.data || [];
  state.attendance = attendance.data || [];
  state.otRequests = otRequests.data || [];
  state.tradeRequests = tradeRequests.data || [];
  state.hrChecks = hrChecks.data || [];
  state.auditLogs = auditLogs.data || [];
  state.holidays = holidays.data || [];
  state.incharges = incharges.data || [];
  state.positionEligibility = positionEligibility.data || [];
  state.positionDayStatus = positionDayStatus.data || [];
}

function renderNav() {
  $('mainNav').innerHTML = NAV_GROUPS.filter(g => !g.adminOnly || isAdmin()).map(group => {
    const items = NAV_ITEMS.filter(item => item.group === group.id && (!group.adminOnly || isAdmin()));
    if (!items.length) return '';
    return `<div class="nav-section"><div class="nav-section-title"><span>${escapeHtml(group.title)}</span><small>${escapeHtml(group.hint)}</small></div>${items.map(item => `
      <button class="nav-btn ${state.page === item.id ? 'active' : ''}" data-page="${item.id}">
        <span class="nav-emoji">${item.icon}</span><span>${item.title}</span>
      </button>`).join('')}</div>`;
  }).join('');
  $('userMini').innerHTML = `<div class="mini-profile">${staffPill(state.profile)}<br><span>${escapeHtml(state.profile.position || state.profile.role)} • ${escapeHtml(state.profile.role)}</span></div>`;
}
function renderPage() {
  const item = NAV_ITEMS.find(x => x.id === state.page) || NAV_ITEMS[0];
  $('pageTitle').textContent = item.title;
  $('pageSubtitle').textContent = item.subtitle;
  renderNav();
  const content = $('pageContent');
  const pages = {
    dashboard: renderDashboard,
    calendar: renderCalendar,
    leave: renderLeavePage,
    activities: renderActivitiesPage,
    hr: renderHrPage,
    scheduler: renderSchedulerPage,
    schedule: renderMonthlySchedulePage,
    positions: renderPositionsPage,
    ot: renderOtPage,
    audit: renderAuditPage,
    users: renderUsersPage,
    eligibility: renderEligibilityPage,
    positionMonth: renderPositionMonthPage,
    positionMonthView: renderPositionMonthViewPage
  };
  content.innerHTML = (pages[state.page] || renderDashboard)();
}

function badge(text, cls='') { return `<span class="badge ${cls}">${escapeHtml(text)}</span>`; }
function activityClass(type) {
  if (type === 'อบรม') return 'blue';
  if (type === 'ประชุม') return 'orange';
  if (type === 'ออกหน่วย') return 'red';
  if (type === 'ตรวจมาตรฐาน') return 'purple';
  if (type === 'ซ้อม CODE') return 'yellow';
  return 'black';
}
function leaveBadgeClass(type) {
  if (type === 'ลาพักร้อน') return 'green';
  if (type === 'ลากิจ') return 'purple';
  if (type === 'ลาป่วย' || type === 'ลาคลอด') return 'yellow';
  if (type === 'ไม่รับเวร') return 'black';
  return 'blue';
}

function isHolidayDate(date) { return state.holidays.some(h => h.holiday_date === date); }
function holidayName(date) { return state.holidays.find(h => h.holiday_date === date)?.title || 'วันหยุดราชการ'; }
function isActiveLeaveOn(staffId, date) { return state.leaves.some(l => l.staff_id === staffId && overlapsDate(l, date)); }
function isDailyPositionEnabled(s) { return s?.daily_position_enabled !== false && s?.is_active && s?.staff_type !== 'แพทย์' && !s?.maternity_status && s?.position_training_status !== 'งดจัดชั่วคราว' && s?.position_training_status !== 'น้องใหม่ / ยังไม่จัดอัตโนมัติ'; }
function isRosterEnabled(s) { return s?.roster_enabled !== false && s?.is_active && s?.staff_type !== 'แพทย์' && !s?.maternity_status; }
function eligibilityRecord(staffId, positionCode) { return state.positionEligibility.find(x => x.staff_id === staffId && x.position_code === positionCode); }
function positionEligible(staff, positionCode) {
  if (!staff || !positionCode) return false;
  const rec = eligibilityRecord(staff.id, positionCode);
  return !!rec?.is_eligible;
}
function positionCandidateOk(staff, positionRow, date=todayStr()) {
  const eligibilityKey = positionRow.eligibility_code || positionRow.code || positionRow.position_code;
  return isDailyPositionEnabled(staff)
    && !isActiveLeaveOn(staff.id, date)
    && positionRuleOk(staff, positionRow.main_rule)
    && positionEligible(staff, eligibilityKey);
}

function positionBaseCode(code='') {
  return String(code || '').replace(/\s+#\d+$/, '').trim();
}
function positionTemplateByCode(code, date=todayStr()) {
  const base = positionBaseCode(code);
  const list = hasOuting(date) ? [...OUTING_POSITIONS, ...DEFAULT_POSITIONS] : [...DEFAULT_POSITIONS, ...OUTING_POSITIONS];
  return list.find(p => p.code === base) || null;
}
function positionZoneForCode(code, fallback='') {
  return positionTemplateByCode(code)?.zone || fallback || 'รอตรวจสอบ';
}
function positionLabelForCell(code='') {
  return String(code || '').replace(/\s+#\d+$/, '').trim();
}
function rowForStaffPosition(staff, date, template, serialMap) {
  const baseCode = template.code;
  const k = `${date}|${baseCode}`;
  serialMap[k] = (serialMap[k] || 0) + 1;
  // หลัง V22 อนุญาตตำแหน่งเดียวกันมีหลายคนได้ แต่เก็บ code ซ้ำได้แล้วหลังรัน SQL patch
  return {
    work_date: date,
    position_code: baseCode,
    zone: template.zone,
    break_time: template.break_time,
    main_rule: template.main_rule,
    job_desc: template.job_desc,
    staff_id: staff?.id || null,
    updated_by: currentStaffId()
  };
}
function reviewRowForStaff(staff, date, reason='ต้องเลือกตำแหน่งจริง') {
  return {
    work_date: date,
    position_code: 'รอตรวจสอบ',
    zone: 'รอตรวจสอบ',
    break_time: '-',
    main_rule: reason,
    job_desc: 'ระบบยังจัดตำแหน่งให้ไม่ได้ กรุณาให้ Admin/อินชาร์จเลือกตำแหน่งจริง',
    staff_id: staff?.id || null,
    updated_by: currentStaffId()
  };
}
function dailyWorkingStaff(date) {
  return orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) && !isActiveLeaveOn(s.id, date)));
}
function positionSortIndex(code, date=todayStr()) {
  const base = positionBaseCode(code);
  const all = [...OUTING_POSITIONS, ...DEFAULT_POSITIONS, {code:'รอตรวจสอบ'}];
  const i = all.findIndex(p => p.code === base);
  return i >= 0 ? i : 999;
}
function sortPositionRows(rows) {
  return [...rows].sort((a,b) => {
    const da = String(a.work_date||'').localeCompare(String(b.work_date||''));
    if (da) return da;
    const pi = positionSortIndex(a.position_code, a.work_date) - positionSortIndex(b.position_code, b.work_date);
    if (pi) return pi;
    return compareStaffOrder(state.staff.find(s=>s.id===a.staff_id), state.staff.find(s=>s.id===b.staff_id));
  });
}

function positionLoadWeight(positionOrCode) {
  const code = typeof positionOrCode === 'string' ? positionBaseCode(positionOrCode) : positionBaseCode(positionOrCode?.code || positionOrCode?.position_code);
  // ใช้เป็นคะแนนภาระโดยประมาณ ไม่ใช่เงิน/OT จริง เพื่อช่วยเกลี่ยตำแหน่งที่งานหนักหรือผูก QC ไม่ให้กระจุก
  const weights = {
    'BB-Report': 1.25,
    'DR-Processing': 1.25,
    'BB-Approve': 1.15,
    'BB-Manual+IH-500 (1)': 1.15,
    'BB-Manual+IH-500 (2)': 1.15,
    'DR-Main': 1.10,
    'DR-Main 1': 1.10,
    'DR-Main 2': 1.10,
    'DR-Preparation': 1.10,
    'DR-Finger 1': 1.00,
    'DR-Finger 2': 1.00,
    'DR-Registration': 0.95,
    'DR-Support': 0.90,
    'BB-Support': 0.90
  };
  return weights[code] || 1;
}
function recentMonthPositionPenalty(rows, staffId, date, position) {
  let penalty = 0;
  const code = positionBaseCode(position?.code || position?.position_code);
  const zone = position?.zone || positionZoneForCode(code);
  const d0 = parseDate(date);
  for (let i = 1; i <= 5; i++) {
    const d = new Date(d0);
    d.setDate(d0.getDate() - i);
    const ds = toDateInput(d);
    const prev = rows.find(r => r.staff_id === staffId && r.work_date === ds);
    if (!prev) continue;
    const prevCode = positionBaseCode(prev.position_code);
    const prevZone = prev.zone || positionZoneForCode(prevCode);
    if (prevCode === code) penalty += Math.max(0, 36 - (i * 6));
    if (prevZone === zone) penalty += Math.max(0, 12 - (i * 2));
  }
  return penalty;
}
function monthPositionCandidateScore(staff, position, counts, rows, date, options={}) {
  const c = counts[staff.id] || { total:0, byCode:{}, byZone:{}, load:0 };
  const code = positionBaseCode(position.code || position.position_code);
  const zone = position.zone || positionZoneForCode(code);
  const sameCode = c.byCode?.[code] || 0;
  const sameZone = c.byZone?.[zone] || 0;
  const total = c.total || 0;
  const load = c.load || 0;
  const recent = options.ignoreRecent ? 0 : recentMonthPositionPenalty(rows, staff.id, date, position);
  const zonePreferenceBonus = options.preferBloodBank && (zone === 'Blood Bank' || zone === 'Manual') ? -18 : 0;
  const outingBalance = zone === 'ออกหน่วย' ? ((c.byZone?.['ออกหน่วย'] || 0) * 65) : 0;
  // น้ำหนักหลัก: ตำแหน่งเดิม > โซนเดิม > จำนวนวันรวม > ภาระรวม > ความถี่ติดกัน
  return (sameCode * 120) + (sameZone * 34) + (total * 18) + (load * 16) + recent + outingBalance + zonePreferenceBonus + (staffOrderIndex(staff) * 0.01);
}
function supportsRequiredRole(staff, required) {
  if (!required) return true;
  if (required === 'MT_OR_TANG') return staff.staff_type === 'MT' || staff.nickname === 'แตง';
  return staff.staff_type === required;
}
function dutyStaffTypeForRate(staffId, dutyCode='') {
  const s = state.staff.find(x => x.id === staffId);
  if (!s) return 'MT';
  if (['ช4A','ช4B'].includes(dutyCode) && s.nickname === 'แตง') return 'MT';
  return s.staff_type === 'เคิก' ? 'เคิก' : 'MT';
}
function dutyRatePerHour(staffId, date, dutyCode='') {
  const type = dutyStaffTypeForRate(staffId, dutyCode);
  const publicHoliday = isHolidayDate(date);
  if (type === 'เคิก') return publicHoliday ? 120 : 90;
  return publicHoliday ? 160 : 130;
}
function dutyHoursForCode(date, dutyCode='') {
  if (['ช9-เคิก','ช9-MT'].includes(dutyCode)) return 8;
  if (['ช3A','ช3B'].includes(dutyCode)) return 12;
  if (['ช4A','ช4B'].includes(dutyCode)) return 4;
  if (['ชบด1','ชบด2','ชบด3'].includes(dutyCode)) return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
  return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
}
function dutyUnitsForCode(date, dutyCode='') {
  const h = dutyHoursForCode(date, dutyCode);
  if (['ช3A','ช3B'].includes(dutyCode)) return 1.5;
  return h / 8;
}
function dutyMetrics(a, staffIdOverride=null) {
  const date = a?.duty_date || a;
  const code = a?.duty_code || '';
  const staffId = staffIdOverride || a?.staff_id || null;
  const hours = dutyHoursForCode(date, code);
  const rate = staffId ? dutyRatePerHour(staffId, date, code) : 0;
  const pay = hours * rate;
  return { hours, rate, pay, units: dutyUnitsForCode(date, code), code, publicHoliday: isHolidayDate(date), weekend: isWeekend(date) };
}
function dutyHours(date, dutyCode='') { return dutyHoursForCode(date, dutyCode); }
function dutyAmount(staffId, date, dutyCode='') { return dutyHoursForCode(date, dutyCode) * dutyRatePerHour(staffId, date, dutyCode); }
function dutyRateByType(type, date) {
  const publicHoliday = isHolidayDate(date);
  if (type === 'เคิก') return publicHoliday ? 120 : 90;
  return publicHoliday ? 160 : 130;
}
function tradeRateAmount(assignment, staffId, rateMode='receiver') {
  if (!assignment) return 0;
  if (rateMode === 'mt') return dutyHoursForCode(assignment.duty_date, assignment.duty_code) * dutyRateByType('MT', assignment.duty_date);
  if (rateMode === 'kerk') return dutyHoursForCode(assignment.duty_date, assignment.duty_code) * dutyRateByType('เคิก', assignment.duty_date);
  const baseStaff = rateMode === 'owner' ? assignment.staff_id : staffId;
  return baseStaff ? dutyMetrics(assignment, baseStaff).pay : 0;
}
function weekKeyOf(date) {
  const d = parseDate(date);
  const oneJan = new Date(d.getFullYear(),0,1);
  return `${d.getFullYear()}-W${Math.ceil((((d - oneJan) / 86400000) + oneJan.getDay()+1) / 7)}`;
}
function currentInchargeForMonth(key) { return state.incharges.find(x => x.month_key === key)?.staff_id || null; }
function canManagePositions(date=todayStr()) {
  const key = String(date).slice(0,7);
  return isAdmin() || currentInchargeForMonth(key) === currentStaffId();
}
function positionDayStatus(date) { return state.positionDayStatus.find(x => x.work_date === date); }
function positionDayPublished(date) { return positionDayStatus(date)?.status === 'published'; }
function isNoPositionDay(date) { return isWeekend(date) || isHolidayDate(date); }
function positionTemplateForDate(date) {
  if (isNoPositionDay(date)) return [];
  return hasOuting(date) ? OUTING_POSITIONS : DEFAULT_POSITIONS;
}
function hasOuting(date) { return state.activities.some(a => a.event_type === 'ออกหน่วย' && dateInRange(date, a.start_date, a.end_date)); }
function outingParticipants(date) {
  const act = state.activities.find(a => a.event_type === 'ออกหน่วย' && dateInRange(date, a.start_date, a.end_date));
  return act ? asArray(act.participant_ids) : [];
}
function positionRuleOk(staff, rule) {
  if (!staff) return false;
  const nick = staff.nickname || '';
  const type = staff.staff_type || '';
  const text = String(rule || '');
  if (text.includes('มัส')) return nick === 'มัส';
  if (text.includes('MT เท่านั้น')) return type === 'MT';
  // เช่น DR-Support ปกติ: แตง / แก๊ส / เฟื่อง / MT ต้องรับได้ทั้ง MT และเคิก 3 คนนี้
  if (text.includes('MT') && (text.includes('แตง') || text.includes('แก๊ส') || text.includes('เฟื่อง'))) {
    return type === 'MT' || ['แตง','แก๊ส','เฟื่อง'].includes(nick);
  }
  // เช่น DR-Registration ปกติ: แตง / แก๊ส / เฟื่อง
  if (!text.includes('MT') && (text.includes('แตง') || text.includes('แก๊ส') || text.includes('เฟื่อง'))) {
    const allowed = [];
    if (text.includes('แตง')) allowed.push('แตง');
    if (text.includes('แก๊ส')) allowed.push('แก๊ส');
    if (text.includes('เฟื่อง')) allowed.push('เฟื่อง');
    return allowed.includes(nick);
  }
  if (text.includes('เคิก')) return type === 'เคิก';
  if (text.includes('MT')) return type === 'MT';
  return true;
}
function staffOptionList(selected='', filterFn=null) {
  const rows = orderedStaff(state.staff.filter(s => s.is_active && (!filterFn || filterFn(s))));
  const selectedStaff = selected ? state.staff.find(s => s.id === selected) : null;
  if (selectedStaff && !rows.some(s => s.id === selectedStaff.id)) rows.unshift(selectedStaff);
  return rows.map(s => `<option value="${s.id}" ${selected===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('');
}
function renderParticipantCheckboxes(selected=[]) {
  return `<div class="participant-grid">${orderedStaff(state.staff.filter(s=>s.is_active)).map(s => `<label class="check-pill"><input type="checkbox" name="participant_ids" value="${s.id}" ${selected.includes(s.id)?'checked':''}> <span>${escapeHtml(s.nickname || s.full_name)} <small>${escapeHtml(s.staff_type || '')}</small></span></label>`).join('')}</div>`;
}

function renderDashboard() {
  const d = todayStr();
  const thisYear = String(new Date().getFullYear());
  const thisMonth = monthKey(new Date());
  const leavesToday = state.leaves.filter(x => overlapsDate(x, d) && x.type !== 'ไม่รับเวร');
  const noDutyToday = state.leaves.filter(x => overlapsDate(x, d) && x.type === 'ไม่รับเวร');
  const actToday = state.activities.filter(x => dateInRange(d, x.start_date, x.end_date));
  const trainings = actToday.filter(x => x.event_type === 'อบรม');
  const meetings = actToday.filter(x => x.event_type === 'ประชุม');
  const outings = actToday.filter(x => x.event_type === 'ออกหน่วย');
  const todayDuties = state.rosterAssignments.filter(x => x.duty_date === d);
  const leaveThisYear = state.leaves.filter(x => String(x.start_date).startsWith(thisYear) && x.type !== 'ไม่รับเวร' && x.status !== 'cancelled');
  const monthOt = state.otRequests.filter(x => x.work_date?.startsWith(thisMonth) && x.status === 'อนุมัติ');
  const otHours = monthOt.reduce((sum, r) => sum + calcOtHours(r), 0);
  const holidayDutyCount = state.rosterAssignments.filter(x => x.duty_date?.startsWith(thisMonth) && isWeekend(x.duty_date) && x.staff_id).length;

  return `
    <div class="grid grid-4">
      ${statCard('คนลาวันนี้', leavesToday.length)}
      ${statCard('คนอบรมวันนี้', trainings.length)}
      ${statCard('คนออกหน่วยวันนี้', outings.length)}
      ${statCard('คนไม่รับเวรวันนี้', noDutyToday.length)}
      ${statCard('กิจกรรมวันนี้', actToday.length)}
      ${statCard('ประชุมวันนี้', meetings.length)}
      ${statCard('เจ้าหน้าที่ทั้งหมด', state.staff.filter(x => x.is_active).length)}
      ${statCard('OT เดือนนี้', `${otHours.toFixed(1)} ชม.`)}
    </div>
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title"><h3>เวรวันนี้</h3><span>${formatThaiDate(d)}</span></div>
        ${todayDuties.length ? `<div class="table-wrap"><table><thead><tr><th>เวร</th><th>ผู้รับผิดชอบ</th><th>ประเภท</th></tr></thead><tbody>
          ${todayDuties.map(r => `<tr><td>${escapeHtml(DUTY_LABEL[r.duty_code] || r.duty_code)}</td><td>${staffPill(r.staff_id)}</td><td>${badge(r.required_role || '-', 'black')}</td></tr>`).join('')}
        </tbody></table></div>` : empty('ยังไม่มีตารางเวรวันนี้')}
      </div>
      <div class="card">
        <div class="section-title"><h3>สถิติ</h3><button class="soft-btn" data-page="schedule">ดูตารางเวร</button></div>
        <div class="grid grid-2">
          ${statCard('คนลาปีนี้', leaveThisYear.length)}
          ${statCard('เวรวันหยุดเดือนนี้', holidayDutyCount)}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><h3>ลา / ไม่รับเวรวันนี้</h3></div>
        ${[...leavesToday, ...noDutyToday].length ? listItems([...leavesToday, ...noDutyToday].map(x => `${staffNick(x.staff_id)} — ${x.type}`)) : empty('วันนี้ไม่มีรายการลา/ไม่รับเวร')}
      </div>
      <div class="card">
        <div class="section-title"><h3>กิจกรรมวันนี้</h3></div>
        ${actToday.length ? listItems(actToday.map(x => `${x.title} — ${x.event_type}`)) : empty('วันนี้ไม่มีกิจกรรม')}
      </div>
    </div>`;
}
function statCard(label, value) { return `<div class="card stat-card"><div class="num">${escapeHtml(value)}</div><div class="label">${escapeHtml(label)}</div></div>`; }
function listItems(items) { return `<div class="week-list">${items.map(x => `<div class="timeline-item"><span>${escapeHtml(x)}</span></div>`).join('')}</div>`; }
function empty(text) { return `<div class="empty-state">${escapeHtml(text)}</div>`; }

function renderCalendar() {
  const title = state.calendarDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
  return `
    <div class="card calendar-shell">
      <div class="toolbar">
        <button class="ghost-btn" data-cal-nav="prev">‹ ก่อนหน้า</button>
        <button class="ghost-btn" data-cal-nav="today">วันนี้</button>
        <button class="ghost-btn" data-cal-nav="next">ถัดไป ›</button>
        <b style="font-size:20px; margin-right:auto;">${escapeHtml(title)}</b>
        <button class="${state.calendarView==='day'?'primary-btn':'ghost-btn'}" data-cal-view="day">Day</button>
        <button class="${state.calendarView==='week'?'primary-btn':'ghost-btn'}" data-cal-view="week">Week</button>
        <button class="${state.calendarView==='month'?'primary-btn':'ghost-btn'}" data-cal-view="month">Month</button>
      </div>
      ${state.calendarView === 'month' ? renderCalendarMonth() : state.calendarView === 'week' ? renderCalendarWeek() : renderCalendarDay()}
      <div class="toolbar">
        ${badge('ลาพักร้อน', 'green')} ${badge('ลากิจ', 'purple')} ${badge('ลาป่วย/ลาคลอด', 'yellow')} ${badge('อบรม', 'blue')} ${badge('ประชุม', 'orange')} ${badge('ออกหน่วย', 'red')} ${badge('เวร', 'black')}
      </div>
    </div>`;
}
function collectCalendarEvents() {
  const events = [];
  state.leaves.filter(x => x.status !== 'cancelled').forEach(l => {
    const days = daysBetween(l.start_date, l.end_date);
    const hrChecked = isLeaveHrChecked(l.id);
    days.forEach(date => {
      const lt = l.type === 'ลาพักร้อน' ? 'leave-vacation' : l.type === 'ลากิจ' ? 'leave-personal' : (l.type === 'ลาป่วย' || l.type === 'ลาคลอด') ? 'leave-sick' : l.type === 'ไม่รับเวร' ? 'noduty' : 'leave-other';
      events.push({ date, type: lt, title: `${l.type}: ${staffNick(l.staff_id)}${hrChecked ? ' ✓ ตรวจ HR แล้ว' : ''}`, raw: l, hrChecked });
    });
  });
  state.activities.forEach(a => {
    const days = daysBetween(a.start_date, a.end_date);
    days.forEach(date => events.push({ date, type: a.event_type === 'อบรม' ? 'training' : a.event_type === 'ประชุม' ? 'meeting' : a.event_type === 'ออกหน่วย' ? 'outing' : a.event_type === 'ตรวจมาตรฐาน' ? 'standard' : a.event_type === 'ซ้อม CODE' ? 'code' : 'activity', title: a.title, raw: a }));
  });
  state.holidays.forEach(h => events.push({ date: h.holiday_date, type: 'holiday', title: `วันหยุดราชการ: ${h.title}`, raw: h }));
  state.rosterAssignments.filter(x => x.staff_id).forEach(r => events.push({ date: r.duty_date, type: 'duty', title: `${DUTY_LABEL[r.duty_code] || r.duty_code}: ${staffNick(r.staff_id)}`, raw: r }));
  return events;
}
function renderCalendarMonth() {
  const events = collectCalendarEvents();
  const d = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth(), 1);
  const first = new Date(d);
  first.setDate(1 - first.getDay());
  const cells = [];
  for (let i=0;i<42;i++) {
    const cur = new Date(first); cur.setDate(first.getDate()+i);
    const ds = toDateInput(cur);
    const evs = events.filter(e => e.date === ds).slice(0,4);
    cells.push(`<div class="calendar-cell ${cur.getMonth()!==state.calendarDate.getMonth()?'other-month':''} ${ds===todayStr()?'today':''}" data-day-detail="${ds}">
      <div class="day-num"><span>${cur.getDate()}</span><button class="tiny-btn" data-day-detail="${ds}">ดู</button></div>
      ${evs.map(e => `<button class="event-pill event-${e.type}" data-day-detail="${ds}">${escapeHtml(e.title)}</button>`).join('')}
      ${events.filter(e => e.date === ds).length > 4 ? `<span class="hint">+${events.filter(e => e.date === ds).length - 4} รายการ</span>` : ''}
    </div>`);
  }
  return `<div class="calendar-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(x => `<div class="calendar-dayname">${x}</div>`).join('')}${cells.join('')}</div>`;
}
function renderCalendarWeek() {
  const start = new Date(state.calendarDate); start.setDate(start.getDate() - start.getDay());
  return `<div class="week-list">${Array.from({length:7},(_,i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return renderDayTimeline(toDateInput(d)); }).join('')}</div>`;
}
function renderCalendarDay() { return `<div class="day-list">${renderDayTimeline(toDateInput(state.calendarDate))}</div>`; }
function renderDayTimeline(date) {
  const evs = collectCalendarEvents().filter(e => e.date === date);
  return `<div class="card"><div class="section-title"><h3>${formatThaiDate(date)}</h3><button class="tiny-btn" data-day-detail="${date}">รายละเอียด</button></div>${evs.length ? evs.map(e => `<div class="timeline-item"><span>${escapeHtml(e.title)}</span><span>${badge(eventText(e.type), eventBadge(e.type))}</span></div>`).join('') : empty('ไม่มีรายการ')}</div>`;
}
function eventText(type) { return ({'leave-vacation':'ลาพักร้อน','leave-personal':'ลากิจ','leave-sick':'ลาป่วย/ลาคลอด','leave-other':'ลา', noduty:'ไม่รับเวร', training:'อบรม', meeting:'ประชุม', outing:'ออกหน่วย', standard:'ตรวจมาตรฐาน', code:'ซ้อม CODE', holiday:'วันหยุด', duty:'เวร'}[type] || type); }
function eventBadge(type) { return ({'leave-vacation':'green','leave-personal':'purple','leave-sick':'yellow','leave-other':'blue', noduty:'black', training:'blue', meeting:'orange', outing:'red', standard:'purple', code:'yellow', holiday:'yellow', duty:'black'}[type] || 'black'); }
function showDayDetail(date) {
  const evs = collectCalendarEvents().filter(e => e.date === date);
  showModal(`<h2>${formatThaiDate(date)}</h2>${evs.length ? evs.map(e => `<div class="timeline-item"><div><b>${escapeHtml(e.title)}</b><br><span class="muted">${eventText(e.type)}</span> ${e.hrChecked ? '<span class="badge green">✓ ตรวจสอบ HR แล้ว</span>' : ''}</div></div>`).join('') : empty('ไม่มีรายการในวันนี้')}`);
}

function renderLeavePage() {
  const rows = state.leaves.filter(x => isAdmin() || x.staff_id === currentStaffId());
  const editing = state.editingLeaveId ? state.leaves.find(x => x.id === state.editingLeaveId) : null;
  const selectedStaff = editing?.staff_id || currentStaffId();
  return `
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขรายการ' : 'แจ้งลา / ไม่รับเวร'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-leave>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="leaveForm" class="form-grid">
          ${isAdmin() ? `<label class="wide">บันทึกให้เจ้าหน้าที่ <select name="staff_id" required>${staffOptions(selectedStaff)}</select><span class="hint">Admin เพิ่ม/แก้ไข/ยกเลิกแทน staff ได้ รวมถึงลาย้อนหลัง กรณีเจ้าหน้าที่ไม่สะดวกบันทึกเอง</span></label>` : ''}
          ${isAdmin() ? `<div class="notice soft-notice wide"><b>โหมด Admin:</b> บันทึกลาย้อนหลัง/บันทึกแทนเจ้าหน้าที่ได้ ระบบจะเก็บ Log และระบุว่า Admin เป็นผู้บันทึกแทน</div>` : ''}
          <label>ประเภท
            <select name="type" required>${LEAVE_TYPES.map(t => `<option ${editing?.type===t?'selected':''}>${t}</option>`).join('')}</select>
          </label>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>ช่วงเวลา
            <select name="leave_period">
              ${['เต็มวัน','ครึ่งเช้า 08:00-12:30','ครึ่งบ่าย 11:30-16:00'].map(v => `<option value="${v}" ${(editing?.leave_period || 'เต็มวัน')===v?'selected':''}>${v}</option>`).join('')}
            </select>
          </label>
          <label>เบอร์ติดต่อระหว่างลา <input name="contact_phone" value="${escapeHtml(editing?.contact_phone || '')}" placeholder="เบอร์ติดต่อ"></label>
          <label>แนบไฟล์ (ถ้ามี) <input name="file" type="file"><span class="hint">ไม่บังคับแนบไฟล์ ถ้ามีเอกสารค่อยแนบได้</span></label>
          ${isAdmin() ? `<label class="wide">เหตุผลที่ Admin บันทึกแทน / ย้อนหลัง <textarea name="admin_record_reason" placeholder="เช่น น้องไม่สะดวกเข้าระบบ / บันทึกย้อนหลังตามใบลา / แจ้งทางโทรศัพท์">${escapeHtml(editing?.admin_record_reason || '')}</textarea></label>` : ''}
          <label class="wide">หมายเหตุ <textarea name="note" placeholder="ระบุรายละเอียดเพิ่มเติม">${escapeHtml(editing?.note || '')}</textarea></label>
          <div class="notice soft-notice wide">ถ้าวันที่ขอลามีการประกาศตารางตำแหน่งรายวันแล้ว ระบบยังบันทึกได้ แต่จะแจ้งเตือนให้ติดต่ออินชาร์จหรือหัวหน้า เพื่อให้ปรับตำแหน่งหน้างานทันที</div>
          <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</button>
        </form>
      </div>
      <div class="card">
        <div class="section-title"><h3>รายการของ${isAdmin() ? 'ทุกคน' : 'ฉัน'}</h3></div>
        ${renderLeaveTable(rows)}
      </div>
    </div>`;
}
function renderLeaveTable(rows) {
  if (!rows.length) return empty('ยังไม่มีรายการ');
  return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ประเภท</th><th>ช่วงวันที่</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${escapeHtml(staffNick(r.staff_id))}${r.recorded_by_admin ? '<br><span class="badge purple">Admin บันทึกแทน</span>' : ''}</td><td>${badge(r.type, leaveBadgeClass(r.type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="badge blue">${escapeHtml(r.leave_period || 'เต็มวัน')}</span><br><span class="muted">${escapeHtml(r.note || '')}</span>${r.admin_record_reason ? `<br><span class="muted">เหตุผล Admin: ${escapeHtml(r.admin_record_reason)}</span>` : ''}</td><td>${badge(r.status || 'active', r.status==='cancelled'?'red':'green')}</td><td><div class="actions">
      ${canEditOwn(r) ? `<button class="tiny-btn" data-edit-leave="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-cancel-leave="${r.id}">ยกเลิก</button>` : '<span class="muted">แก้ไม่ได้</span>'}
    </div></td></tr>`).join('')}
  </tbody></table></div>`;
}
function canEditOwn(row) {
  if (isAdmin()) return true;
  return row.staff_id === currentStaffId() && row.status !== 'cancelled' && !isRosterLockedForDate(row.start_date);
}
function isRosterLockedForDate(date) {
  const d = parseDate(date);
  const m = state.rosterMonths.find(x => x.year === d.getFullYear() && x.month === d.getMonth()+1);
  if (m?.status === 'locked' || m?.status === 'published') return true;
  const closeDay = CFG.ROSTER_CLOSE_DAY || 20;
  const close = new Date(d.getFullYear(), d.getMonth()-1, closeDay, 23,59,59);
  return new Date() > close;
}

function renderActivitiesPage() {
  const rows = state.activities;
  const editing = state.editingActivityId ? state.activities.find(x => x.id === state.editingActivityId) : null;
  return `
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมหน่วยงาน'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-activity>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="activityForm" class="form-grid">
          <label class="wide">รายละเอียดกิจกรรม <input name="title" value="${escapeHtml(editing?.title || '')}" placeholder="เช่น ประชุมทีม / ออกหน่วยที่..." required></label>
          <label>ประเภท <select name="event_type" required>${ACTIVITY_TYPES.map(t => `<option ${editing?.event_type===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>สถานที่ <input name="location" value="${escapeHtml(editing?.location || '')}" required></label>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เวลาเริ่ม <input name="start_time" type="time" value="${editing?.start_time || ''}" required></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" value="${editing?.end_time || ''}" required></label>
          <label>ผู้รับผิดชอบ <select name="owner_id" required><option value="">เลือกผู้รับผิดชอบ</option>${staffOptions(editing?.owner_id || currentStaffId())}</select></label>
          <label>เอกสารแนบ <input name="file" type="file"></label>
          <div class="wide"><div class="field-label">ผู้เข้าร่วม</div>${renderParticipantCheckboxes(asArray(editing?.participant_ids))}</div>
          <label class="wide">รายละเอียด <textarea name="note" required>${escapeHtml(editing?.note || '')}</textarea></label>
          <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกกิจกรรม'}</button>
        </form>
      </div>
      <div class="card">
        <div class="section-title"><h3>กิจกรรมทั้งหมด</h3></div>
        ${renderActivityTable(rows)}
      </div>
    </div>`;
}
function renderActivityTable(rows) {
  if (!rows.length) return empty('ยังไม่มีกิจกรรม');
  return `<div class="table-wrap"><table><thead><tr><th>รายละเอียดกิจกรรม</th><th>วันเวลา</th><th>สถานที่</th><th>ผู้รับผิดชอบ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${escapeHtml(r.title)}</b><br>${badge(r.event_type, activityClass(r.event_type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="muted">${escapeHtml([r.start_time, r.end_time].filter(Boolean).join(' - '))}</span></td><td>${escapeHtml(r.location || '-')}</td><td>${escapeHtml(staffNick(r.owner_id))}</td><td><div class="actions">
      ${(isAdmin() || r.created_by === currentStaffId() || r.owner_id === currentStaffId()) ? `<button class="tiny-btn" data-edit-activity="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${r.id}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}
    </div></td></tr>`).join('')}
  </tbody></table></div>`;
}

function isLeaveHrChecked(leaveId) {
  return state.hrChecks.some(h => h.leave_request_id === leaveId && h.status === 'ตรวจสอบแล้ว');
}
function hrCheckBadgeForLeave(leaveId) {
  return isLeaveHrChecked(leaveId) ? '<span class="badge green">✓ ตรวจสอบ HR แล้ว</span>' : '';
}

function renderHrPage() {
  if (!isAdmin()) return noPermission();
  const leaveRows = state.leaves.filter(x => x.type !== 'ไม่รับเวร' && x.status !== 'cancelled' && !isLeaveHrChecked(x.id));
  return `<div class="card">
    <div class="section-title"><h3>ตรวจสอบ HR</h3><span class="muted">แก้ปัญหา “แจ้งเรา แต่ไม่ได้ลาใน HR”</span></div>
    ${leaveRows.length ? `<div class="table-wrap"><table><thead><tr><th>ผู้ลา</th><th>ประเภท/วันที่</th><th>สถานะ HR</th><th>บันทึกตรวจสอบ</th></tr></thead><tbody>
      ${leaveRows.map(l => { const h = state.hrChecks.find(x => x.leave_request_id === l.id) || {}; return `<tr>
        <td>${escapeHtml(staffName(l.staff_id))}</td>
        <td>${badge(l.type, leaveBadgeClass(l.type))}<br>${formatThaiDate(l.start_date)} - ${formatThaiDate(l.end_date)}</td>
        <td>${badge(h.status || 'รอตรวจสอบ', h.status==='ตรวจสอบแล้ว'?'green':h.status==='รอเอกสาร'?'orange':h.status==='ยกเลิก'?'red':'black')}<br><span class="muted">ผู้ตรวจ: ${escapeHtml(staffNick(h.checked_by))}</span></td>
        <td><form class="hr-form form-grid" data-leave-id="${l.id}">
          <label>สถานะ <select name="status">${HR_STATUSES.map(s => `<option ${h.status===s?'selected':''}>${s}</option>`).join('')}</select></label>
          <label>วันที่แจ้งใน HR <input type="date" name="hr_reported_date" value="${h.hr_reported_date || ''}"></label>
          <label class="wide">หมายเหตุ <input name="note" value="${escapeHtml(h.note || '')}"></label>
          <button class="primary-btn wide" type="submit">บันทึก</button>
        </form></td>
      </tr>`; }).join('')}
    </tbody></table></div>` : empty('ไม่มีรายการลาให้ตรวจ')}
  </div>`;
}
function noPermission() { return `<div class="card">${empty('หน้านี้ Staff มองเห็นเมนูได้ แต่ปุ่มทำงานสำหรับ Admin เท่านั้น')}</div>`; }

function renderSchedulerPage() {
  if (!isAdmin()) return noPermission();
  const { y, m } = getMonthRange(state.monthKey);
  const month = state.rosterMonths.find(x => x.year === y && x.month === m);
  const assignments = getAssignmentsForMonth(state.monthKey);
  const monthHolidays = state.holidays.filter(h => h.holiday_date?.startsWith(state.monthKey));
  return `<div class="grid">
    <div class="card">
      <div class="toolbar">
        <label>เดือน <input type="month" id="rosterMonthInput" value="${state.monthKey}"></label>
        <button class="primary-btn" data-generate-roster>สร้างร่าง</button>
        <button class="soft-btn" data-auto-assign>Auto Assign</button>
        <button class="ghost-btn" data-save-roster>บันทึกร่าง</button>
        <button class="ghost-btn" data-publish-roster>ประกาศตาราง</button>
        <button class="danger-ghost" data-lock-roster>ล็อกตาราง</button>
        <span>${badge(month?.status || 'ยังไม่สร้าง', month?.status==='published'?'green':month?.status==='locked'?'red':'black')}</span>
      </div>
      <form id="holidayForm" class="form-grid compact-form">
        <label>เพิ่มวันหยุดราชการ <input name="holiday_date" type="date" value="${state.monthKey}-01" required></label>
        <label>ชื่อวันหยุด <input name="title" placeholder="เช่น วันเฉลิมฯ" required></label>
        <button class="soft-btn" type="submit">บันทึกวันหยุด</button>
      </form>
      <div class="hint">วันหยุดราชการจะนับเป็นเวร 24 ชม. และ Auto Assign จะเกลี่ยใหม่โดยไม่แตะช่องที่ล็อกไว้</div>
      ${monthHolidays.length ? `<div class="chip-line">${monthHolidays.map(h => `<span class="badge yellow">${formatThaiDate(h.holiday_date)} ${escapeHtml(h.title)}</span>`).join('')}</div>` : ''}
    </div>
    <div class="roster-board">
      <div class="card">
        <h3>รายชื่อเจ้าหน้าที่</h3>
        <p class="hint">ลากชื่อไปวางในช่องเวรได้เลย / คนที่ปิดจัดเวรจะไม่ถูก Auto Assign</p>
        <div class="staff-pool">
          ${orderedStaff(state.staff.filter(s => isRosterEnabled(s))).map(s => `<div class="staff-chip" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" draggable="true" data-drag-staff="${s.id}"><span>${escapeHtml(s.nickname || s.full_name)}</span><span>${badge(s.staff_type || '-', s.staff_type==='MT'?'blue':'orange')}</span></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><h3>ตารางร่าง ${state.monthKey}</h3><button class="tiny-btn" data-show-fairness>ดูสมดุลเวร</button></div>
        ${renderRosterGrid(assignments)}
      </div>
    </div>
  </div>`;
}
function getAssignmentsForMonth(key) {
  if (state.rosterDraft?.monthKey === key) return state.rosterDraft.assignments;
  const { start, end } = getMonthRange(key);
  return state.rosterAssignments.filter(x => x.duty_date >= start && x.duty_date <= end && allowedDutyCodesForDate(x.duty_date).includes(x.duty_code));
}
function generateEmptyAssignments(key) {
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  const rows = [];
  for (let day=1; day<=last; day++) {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const rule = dutyRuleForDate(date);
    rule.forEach(slot => rows.push({ _temp_id: uid(), duty_date: date, duty_code: slot.code, required_role: slot.role, staff_id: null, is_locked: false }));
  }
  return rows;
}
function dutyRuleForDate(date) {
  const dow = parseDate(date).getDay();
  if (isHolidayDate(date)) {
    return [
      { code: 'ชบด1', role: 'MT' },
      { code: 'ชบด2', role: 'MT' },
      { code: 'ชบด3', role: dow === 0 ? 'MT' : 'เคิก' }
    ];
  }
  if (dow === 0) return DUTY_SLOT_RULES.sunday;
  if (dow === 6) return DUTY_SLOT_RULES.saturday;
  return DUTY_SLOT_RULES.weekday;
}
function allowedDutyCodesForDate(date) { return dutyRuleForDate(date).map(x => x.code); }
function renderRosterGrid(assignments) {
  if (!assignments.length) return empty('กด “สร้างร่าง” เพื่อเริ่มจัดเวร');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  return `<div class="table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const dow = parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
      return `<tr><td><b>${day}</b><br><span class="muted">${dow}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${DUTY_COLUMNS.map(code => {
        if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
        const slot = assignments.find(a => a.duty_date === date && a.duty_code === code);
        if (!slot) return '<td class="muted">-</td>';
        const id = slot.id || slot._temp_id;
        return `<td><div class="roster-slot ${slot.is_locked?'locked':''}" data-drop-slot="${id}">
          <div class="assigned-name">${slot.staff_id ? staffPill(slot.staff_id) : 'ยังไม่จัด'}</div>
          <div class="slot-meta">${escapeHtml(slot.required_role)} ${slot.is_locked?'• locked':''}</div>
          <div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div>
        </div></td>`;
      }).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
}
function showFairness() {
  const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id);
  const stats = calcFairness(assignments);
  const hours = Object.values(stats).map(x => x.hours || 0);
  const pays = Object.values(stats).map(x => x.pay || 0);
  const diff = hours.length ? Math.max(...hours) - Math.min(...hours) : 0;
  const payDiff = pays.length ? Math.max(...pays) - Math.min(...pays) : 0;
  showModal(`<h2>ตรวจสมดุลการกระจายเวร ${state.monthKey}</h2><p class="hint">คิดตามกติกาจริง: ชบด วันธรรมดา 16 ชม., ชบด เสาร์/อาทิตย์/นักขัต 24 ชม., ช9 8 ชม., ช3A/ช3B 12 ชม., ช4 4 ชม. เรท MT 130/นักขัต 160 บ./ชม. และเคิก 90/นักขัต 120 บ./ชม. ถ้ามีการขาย/แลกเวรหลังประกาศ ให้ถือเป็นข้อตกลงระหว่างเจ้าหน้าที่</p><p class="hint">ส่วนต่างชั่วโมง ${diff.toFixed(1)} ชม. • ส่วนต่างเงินโดยประมาณ ${payDiff.toLocaleString()} บาท</p><div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>
    ${orderedStaff(state.staff.filter(s=>isRosterEnabled(s))).map(s => { const r = stats[s.id] || {}; return `<tr><td>${staffPill(s)}</td><td>${(r.hours||0).toFixed(1)}</td><td>${(r.pay||0).toLocaleString()}</td><td>${(r.units||0).toFixed(1)}</td><td>${r.chbd||0}</td><td>${r.ch9||0}</td><td>${r.ch3||0}</td><td>${r.ch4||0}</td><td>${r.mon||0}</td><td>${r.fri||0}</td><td>${r.weekend||0}</td></tr>`; }).join('')}
  </tbody></table></div>`);
}
function calcFairness(assignments) {
  const stats = {};
  assignments.forEach(a => {
    if (!a.staff_id) return;
    if (!stats[a.staff_id]) stats[a.staff_id] = { total:0, units:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, pay:0, chbd:0, ch9:0, ch3:0, ch4:0, weekCounts:{} };
    const dow = parseDate(a.duty_date).getDay();
    const m = dutyMetrics(a);
    stats[a.staff_id].total++;
    stats[a.staff_id].hours += m.hours;
    stats[a.staff_id].units += m.units;
    stats[a.staff_id].pay += m.pay;
    if (String(a.duty_code || '').startsWith('ชบด')) stats[a.staff_id].chbd++;
    if (String(a.duty_code || '').startsWith('ช9')) stats[a.staff_id].ch9++;
    if (['ช3A','ช3B'].includes(a.duty_code)) stats[a.staff_id].ch3++;
    if (['ช4A','ช4B'].includes(a.duty_code)) stats[a.staff_id].ch4++;
    const wk = weekKeyOf(a.duty_date);
    stats[a.staff_id].weekCounts[wk] = (stats[a.staff_id].weekCounts[wk] || 0) + 1;
    if (dow === 1) stats[a.staff_id].mon++;
    if (dow === 5) stats[a.staff_id].fri++;
    if (dow === 0 || dow === 6 || isHolidayDate(a.duty_date)) stats[a.staff_id].weekend++;
    else stats[a.staff_id].weekday++;
  });
  return stats;
}

function renderMonthlySchedulePage() {
  const assignments = getAssignmentsForMonth(state.monthKey);
  return `<div class="card">
    <div class="toolbar no-print">
      <label>เดือน <input type="month" id="scheduleMonthInput" value="${state.monthKey}"></label>
      <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
      <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
      <button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือดูสมดุลเวร</button>
    </div>
    <h3 class="print-only">ตารางเวรประจำเดือน ${state.monthKey}</h3>
    ${renderScheduleSummary(assignments)}${renderReadOnlySchedule(assignments)}${renderDutyTradePanel(assignments)}
  </div>`;
}
function renderScheduleSummary(assignments) {
  const stats = calcFairness(assignments.filter(x => x.staff_id));
  const active = orderedStaff(state.staff.filter(s => isRosterEnabled(s)));
  if (!active.length) return '';
  return `<div class="schedule-summary">${active.map(s => { const r = stats[s.id] || {}; return `<div class="summary-chip" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${(r.units||0).toFixed(1)} หน่วย • ${(r.hours||0).toFixed(0)} ชม. • ${(r.pay||0).toLocaleString()} บ.</span></div>`; }).join('')}</div>`;
}
function canRequestTrade(slot) {
  if (!slot?.id || !slot.staff_id) return false;
  return slot.staff_id === currentStaffId() || isAdmin();
}
function renderTradeButton(slot) {
  if (!canRequestTrade(slot)) return '';
  return `<button class="tiny-btn trade-btn" data-trade-duty="${slot.id}">แลก/ขาย</button>`;
}
function renderDutyTradePanel(assignments) {
  const monthRows = state.tradeRequests.filter(r => {
    const a = assignments.find(x => x.id === r.from_assignment_id || x.id === r.to_assignment_id);
    return a || String(r.created_at || '').startsWith(state.monthKey);
  });
  const visible = isAdmin() ? monthRows : monthRows.filter(r => r.requester_id === currentStaffId() || r.receiver_id === currentStaffId());
  if (!visible.length) return `<div class="trade-panel"><h3>คำขอแลก/ขายเวร</h3>${empty('ยังไม่มีคำขอแลก/ขายเวรในเดือนนี้')}</div>`;
  return `<div class="trade-panel"><h3>คำขอแลก/ขายเวร</h3><div class="table-wrap"><table><thead><tr><th>ผู้ขอ</th><th>ผู้รับ/คู่แลก</th><th>รายการ</th><th>เงินโดยประมาณ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${visible.map(r => renderTradeRow(r, assignments)).join('')}</tbody></table></div></div>`;
}
function renderTradeRow(r, assignments) {
  const from = assignments.find(a => a.id === r.from_assignment_id) || {};
  const to = assignments.find(a => a.id === r.to_assignment_id) || null;
  const receiverActions = r.status === 'pending' && r.receiver_id === currentStaffId();
  const adminActions = r.status === 'confirmed' && isAdmin();
  return `<tr><td>${staffPill(r.requester_id)}</td><td>${staffPill(r.receiver_id)}</td><td>${escapeHtml(r.trade_type)}<br><span class="muted">${formatThaiDate(from.duty_date)} ${DUTY_LABEL[from.duty_code] || from.duty_code || ''}${to ? ` ↔ ${formatThaiDate(to.duty_date)} ${DUTY_LABEL[to.duty_code] || to.duty_code}` : ''}</span></td><td>${Number(r.amount_from || 0).toLocaleString()} บ.${r.amount_diff ? `<br><span class="muted">ส่วนต่าง ${Number(r.amount_diff).toLocaleString()} บ.</span>` : ''}</td><td>${badge(tradeStatusLabel(r.status), r.status==='confirmed'?'green':r.status==='rejected'?'red':r.status==='completed'?'blue':'orange')}</td><td>${receiverActions ? `<button class="tiny-btn" data-trade-status="${r.id}|confirmed">ยืนยัน</button><button class="tiny-btn danger" data-trade-status="${r.id}|rejected">ปฏิเสธ</button>` : adminActions ? `<button class="tiny-btn" data-trade-apply="${r.id}">Admin บันทึกเปลี่ยนเวร</button>` : '-'}</td></tr>`;
}
function tradeStatusLabel(status) { return ({ pending:'รออีกฝ่ายยืนยัน', confirmed:'ยืนยันแล้ว รอ Admin บันทึก', rejected:'ปฏิเสธ', completed:'เปลี่ยนตารางแล้ว' }[status] || status || '-'); }
function renderReadOnlySchedule(assignments) {
  if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  return `<div class="table-wrap"><table id="scheduleTable" class="schedule-readable"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const rowCls = isHolidayDate(date) ? 'holiday-row' : isWeekend(date) ? 'weekend-row' : '';
      return `<tr class="${rowCls}"><td class="date-cell"><b>${day}</b><br><span class="muted">${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${DUTY_COLUMNS.map(code => {
        if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
        const slot = assignments.find(a => a.duty_date === date && a.duty_code === code);
        return `<td>${slot?.staff_id ? `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>` : '-'}</td>`;
      }).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
}
function showStaffStats(staffId) {
  const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id === staffId);
  const s = calcFairness(assignments)[staffId] || {};
  showModal(`<h2>${staffPill(staffId)}</h2><div class="grid grid-2">${statCard('เวรรวม', s.total||0)}${statCard('ชม.รวม', (s.hours||0).toFixed(1))}${statCard('เงินประมาณ', (s.pay||0).toLocaleString())}${statCard('วันหยุด', s.weekend||0)}${statCard('จันทร์', s.mon||0)}${statCard('ศุกร์', s.fri||0)}</div>`);
}

function renderPositionsPage() {
  const date = state.positionDate || todayStr();
  const existingRows = sortPositionRows(state.positions.filter(x => x.work_date === date));
  const template = positionTemplateForDate(date);
  const rows = existingRows.length ? existingRows.map(r => {
    const base = positionTemplateByCode(r.position_code, date) || {};
    return { ...base, ...r, code: r.position_code, position_code: r.position_code || base.code };
  }) : template.map(p => ({ ...p, position_code: p.code, staff_id: null }));
  const canManage = canManagePositions(date);
  const key = date.slice(0,7);
  const incharge = currentInchargeForMonth(key);
  const dayStatus = state.positionDayStatus.find(x => x.work_date === date);
  const isPublished = dayStatus?.status === 'published';
  const noPosition = isNoPositionDay(date);
  return `<div class="card">
    <div class="toolbar">
      <label>วันที่ <input type="date" id="positionDateInput" value="${date}"></label>
      ${isAdmin() ? `<label>อินชาร์จประจำเดือน <select id="inchargeSelect"><option value="">ไม่ระบุ</option>${staffOptions(incharge)}</select></label><button class="soft-btn" data-save-incharge>บันทึกอินชาร์จ</button>` : `<span>${badge('อินชาร์จ: ' + staffNick(incharge), 'blue')}</span>`}
      ${badge(isPublished ? 'ประกาศแล้ว' : 'ยังไม่ประกาศ', isPublished ? 'green' : 'orange')}
      ${canManage && !noPosition ? '<button class="soft-btn" data-auto-positions>จัดตำแหน่งอัตโนมัติ</button><button class="primary-btn" data-save-positions>บันทึกตำแหน่งวันนี้</button><button class="soft-btn" data-publish-positions>ประกาศตารางวันนี้</button>' : ''}
    </div>
    <div class="notice soft-notice">ตารางรายวันมาจาก default รายเดือนก่อน อินชาร์จปรับได้ตามคนลา/งานจริง แล้วกดประกาศก่อน 07:30 น. หากมีคนลาหลังประกาศ ให้แจ้งอินชาร์จหรือหัวหน้าเพื่อปรับหน้างาน</div>
    ${noPosition ? `<div class="notice">วันนี้เป็น${isHolidayDate(date) ? 'วันหยุดราชการ' : 'วันเสาร์-อาทิตย์'} จึงไม่ต้องจัดตำแหน่งรายวัน</div>` : ''}
    ${!noPosition && hasOuting(date) ? `<div class="notice">วันนี้มีออกหน่วย: คนที่ถูกติ๊กในกิจกรรมจะถูกจัดลงชุดออกหน่วย ส่วนคนที่เหลือจะถูกเกลี่ยไปตำแหน่งห้อง Blood Bank</div>` : ''}
    ${noPosition ? empty('ไม่มีตารางตำแหน่งรายวันสำหรับวันนี้') : `<div class="table-wrap"><table><thead><tr><th>โซน</th><th>ตำแหน่ง</th><th>เวลาพัก</th><th>ผู้รับผิดชอบ</th><th>ผู้ปฏิบัติหลัก</th><th>หน้าที่โดยย่อ</th></tr></thead><tbody>
      ${rows.map((r,idx) => {
        const baseCode = positionBaseCode(r.position_code || r.code);
        const base = positionTemplateByCode(baseCode, date) || r;
        return `<tr><td>${escapeHtml(r.zone || base.zone || '')}</td><td><b>${escapeHtml(positionLabelForCell(r.position_code || base.code))}</b></td><td>${escapeHtml(r.break_time || base.break_time || '')}</td><td>${canManage ? `<select data-position-row="${idx}" data-position-code="${escapeHtml(base.code || r.position_code)}" data-position-zone="${escapeHtml(r.zone || base.zone || '')}" data-position-break="${escapeHtml(r.break_time || base.break_time || '')}" data-position-rule="${escapeHtml(r.main_rule || base.main_rule || '')}" data-position-job="${escapeHtml(r.job_desc || base.job_desc || '')}"><option value="">-</option>${staffOptionList(r.staff_id, s => positionBaseCode(r.position_code)==='รอตรวจสอบ' || positionCandidateOk(s, { ...base, code: base.code || r.position_code, position_code: base.code || r.position_code, main_rule: r.main_rule || base.main_rule }, date))}</select>` : `${staffPill(r.staff_id)}`}</td><td>${escapeHtml(r.main_rule || base.main_rule || '')}</td><td>${escapeHtml(r.job_desc || base.job_desc || '')}</td></tr>`;
      }).join('')}
    </tbody></table></div>`}
  </div>`;
}
function renderPositionMonthPage() {
  if (!isAdmin()) return noPermission();
  const key = state.positionMonthKey || state.monthKey;
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  const dates = Array.from({length:last}, (_,i)=>`${y}-${pad(m)}-${pad(i+1)}`);
  const rows = state.monthPositionDraft?.monthKey === key ? state.monthPositionDraft.rows : state.positions.filter(x => x.work_date?.startsWith(key));
  const savedCount = state.positions.filter(x => x.work_date?.startsWith(key)).length;
  const workingDays = dates.filter(d => !isNoPositionDay(d)).length;
  return `<div class="card monthly-position-page">
    <div class="section-title"><div><h3>จัดตำแหน่งรายเดือน ${key}</h3><p class="hint">รูปแบบ Excel: แถวเป็นเจ้าหน้าที่ คอลัมน์เป็นวันที่ และในช่องคือ “ตำแหน่งของคนนั้นในวันนั้น”</p></div></div>
    <div class="toolbar">
      <label>เดือน <input type="month" id="positionMonthInput" value="${key}"></label>
      <button class="soft-btn" data-generate-month-positions>สร้าง default ทั้งเดือน</button>
      <button class="primary-btn" data-save-month-positions>บันทึก default ทั้งเดือน</button>
      <span>${badge(`มีข้อมูล ${savedCount} รายการ`, savedCount ? 'green' : 'black')}</span>
      <span>${badge(`วันทำงาน ${workingDays} วัน`, 'blue')}</span>
    </div>
    <div class="notice soft-notice">หลักการ: เสาร์-อาทิตย์และวันหยุดราชการขึ้น WEEKEND/HOLIDAY และไม่จัดตำแหน่ง วันที่มีออกหน่วยจะจัดผู้เข้าร่วมกิจกรรมลงชุดออกหน่วย ส่วนคนที่เหลือจะถูกเกลี่ยให้อยู่ตำแหน่งห้อง Blood Bank</div>
    <div class="notice soft-notice">BB-Report และ DR-Processing จะพยายามฟิคเป็นรายสัปดาห์เพื่อเก็บ QC ต่อเนื่อง ถ้าเกลี่ยแล้วคนนั้นยังไม่มีตำแหน่ง ระบบจะแสดง “รอตรวจสอบ” ให้ Admin ปรับเอง ไม่ใส่ตำแหน่งเสริมปลอม</div>
    ${renderMonthPositionSummaryHint(rows, dates)}${renderMonthPositionMatrix(rows, dates)}
  </div>`;
}

function renderPositionMonthViewPage() {
  const key = state.positionMonthViewKey || state.monthKey;
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  const dates = Array.from({length:last}, (_,i)=>`${y}-${pad(m)}-${pad(i+1)}`);
  const rows = state.positions.filter(x => x.work_date?.startsWith(key));
  const savedCount = rows.length;
  return `<div class="card monthly-position-page readonly-month-position-page">
    <div class="section-title"><div><h3>ตารางตำแหน่งรายเดือน ${key}</h3><p class="hint">ดู default รายเดือนแบบเดียวกับหน้าจัดตำแหน่งของ Admin แต่หน้านี้เป็นโหมดอ่านอย่างเดียว</p></div></div>
    <div class="toolbar">
      <label>เดือน <input type="month" id="positionMonthViewInput" value="${key}"></label>
      <span>${badge(`ข้อมูล ${savedCount} รายการ`, savedCount ? 'green' : 'black')}</span>
      <span>${badge('อ่านอย่างเดียว', 'blue')}</span>
    </div>
    <div class="notice soft-notice">หน้านี้ให้ทุกคนเห็นแผนรายเดือนเหมือนตารางที่ Admin จัดไว้ แต่แก้ไขไม่ได้ หากมีเปลี่ยนจริงตอนเช้า ให้ดูเมนูตารางตำแหน่งรายวันหลังอินชาร์จประกาศ</div>
    ${renderMonthPositionSummaryHint(rows, dates)}${renderMonthPositionMatrix(rows, dates)}
  </div>`;
}
function renderMonthPositionSummaryHint(rows, dates) {
  if (!rows.length) return '';
  const stats = buildMonthPositionSummary(rows, dates);
  const staffCount = Object.keys(stats).length;
  return `<div class="month-position-summary-hint card-lite">
    <b>สรุปรายคนถูกย้ายไปอยู่ใน Pop-up แล้ว</b>
    <span class="hint">กดชื่อเจ้าหน้าที่ด้านซ้ายของตาราง เพื่อดูว่าเดือนนี้อยู่โซนไหนกี่วัน และขึ้นตำแหน่งอะไรบ้าง ระบบจะคำนวณจากตารางล่าสุด และไม่นับวันที่คนนั้นลา/ไม่รับเวร หรือวันที่ไม่มีการจัดตำแหน่ง</span>
    <span>${badge(`มีสรุป ${staffCount} คน`, staffCount ? 'blue' : 'black')}</span>
  </div>`;
}
function buildMonthPositionSummary(rows, dates) {
  const dateSet = new Set(dates || []);
  const summary = {};
  rows.forEach(r => {
    if (!r.staff_id || !r.work_date || (dateSet.size && !dateSet.has(r.work_date))) return;
    if (isNoPositionDay(r.work_date)) return;
    if (isActiveLeaveOn(r.staff_id, r.work_date)) return;
    const st = state.staff.find(s => s.id === r.staff_id);
    if (!st || !isDailyPositionEnabled(st)) return;
    summary[r.staff_id] = summary[r.staff_id] || { zones:{}, positions:{}, dates:new Set(), rows:[] };
    const zone = r.zone || 'ไม่ระบุห้อง';
    const code = r.position_code || 'ไม่ระบุตำแหน่ง';
    summary[r.staff_id].zones[zone] = (summary[r.staff_id].zones[zone] || 0) + 1;
    summary[r.staff_id].positions[code] = (summary[r.staff_id].positions[code] || 0) + 1;
    summary[r.staff_id].dates.add(r.work_date);
    summary[r.staff_id].rows.push(r);
  });
  return summary;
}
function currentMonthPositionContext() {
  const key = state.page === 'positionMonthView' ? (state.positionMonthViewKey || state.monthKey) : (state.positionMonthKey || state.monthKey);
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  const dates = Array.from({length:last}, (_,i)=>`${y}-${pad(m)}-${pad(i+1)}`);
  const rows = state.monthPositionDraft?.monthKey === key ? state.monthPositionDraft.rows : state.positions.filter(x => x.work_date?.startsWith(key));
  return { key, rows, dates };
}
function showMonthPositionStaffSummary(staffId) {
  const { key, rows, dates } = currentMonthPositionContext();
  const st = state.staff.find(s => s.id === staffId);
  if (!st) return;
  const stats = buildMonthPositionSummary(rows, dates)[staffId] || { zones:{}, positions:{}, dates:new Set(), rows:[] };
  const line = obj => Object.entries(obj).sort((a,b)=>b[1]-a[1] || a[0].localeCompare(b[0], 'th'));
  const zoneRows = line(stats.zones);
  const positionRows = line(stats.positions);
  const leaveDays = dates.filter(d => isActiveLeaveOn(staffId, d)).length;
  const noPositionDays = dates.filter(d => isNoPositionDay(d)).length;
  const detailRows = stats.rows.slice().sort((a,b)=>a.work_date.localeCompare(b.work_date)).map(r => `<tr><td>${formatThaiDate(r.work_date)}</td><td>${escapeHtml(r.zone || '-')}</td><td>${escapeHtml(r.position_code || '-')}</td></tr>`).join('');
  showModal(`<h2>สรุปตำแหน่งรายเดือน ${key}</h2>
    <div class="staff-summary-head">${staffPill(st)}<span class="muted">คำนวณจากตารางล่าสุด และหักวันที่ลา/ไม่รับเวรแล้ว</span></div>
    <div class="grid grid-3 modal-stat-grid">
      ${statCard('วันที่มีตำแหน่ง', stats.dates.size || 0)}
      ${statCard('จำนวนตำแหน่งรวม', stats.rows.length || 0)}
      ${statCard('วันที่ลา/ไม่รับเวร', leaveDays || 0)}
    </div>
    <div class="grid grid-2 modal-summary-grid">
      <div class="card-lite"><h4>แยกตามห้อง/โซน</h4>${zoneRows.length ? `<table><tbody>${zoneRows.map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v} วัน</td></tr>`).join('')}</tbody></table>` : empty('ยังไม่มีตำแหน่งในเดือนนี้')}</div>
      <div class="card-lite"><h4>แยกตามตำแหน่ง</h4>${positionRows.length ? `<table><tbody>${positionRows.map(([k,v]) => `<tr><td>${escapeHtml(k)}</td><td>${v} วัน</td></tr>`).join('')}</tbody></table>` : empty('ยังไม่มีตำแหน่งในเดือนนี้')}</div>
    </div>
    <div class="card-lite"><h4>รายละเอียดรายวัน</h4>${detailRows ? `<div class="table-wrap compact-detail-table"><table><thead><tr><th>วันที่</th><th>โซน</th><th>ตำแหน่ง</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : empty('ไม่มีรายการตำแหน่งหลังหักวันลา/วันหยุด')}</div>
    <p class="hint">หมายเหตุ: เดือนนี้มีวัน WEEKEND/HOLIDAY ${noPositionDays} วัน ไม่นับในจำนวนตำแหน่งรายเดือน</p>`);
}
function positionDisplayMap(rows) {
  const map = {};
  rows.forEach(r => {
    if (!r.staff_id) return;
    const key = `${r.staff_id}|${r.work_date}`;
    map[key] = map[key] || [];
    map[key].push(r.position_code || r.code);
  });
  return map;
}
function renderMonthPositionMatrix(rows, dates) {
  if (!rows.length) return empty('ยังไม่มี default รายเดือน กด “สร้าง default ทั้งเดือน” ก่อน');
  const map = positionDisplayMap(rows);
  const displayStaff = orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) || rows.some(r => r.staff_id === s.id)));
  return `<div class="monthly-matrix-wrap">
    <div class="matrix-legend"><span class="legend-box weekend"></span> WEEKEND/HOLIDAY = ไม่จัดตำแหน่ง <span class="legend-box outing"></span> ออกหน่วย <span class="legend-box leave"></span> มีลา/ไม่รับเวร</div>
    <div class="table-wrap month-position-matrix"><table><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${dates.map(date => {
      const d = parseDate(date);
      const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : hasOuting(date) ? 'outing-head' : '';
      return `<th class="date-head ${cls}"><b>${d.getDate()}</b><br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`;
    }).join('')}</tr></thead><tbody>
      ${displayStaff.map(st => `<tr><td class="sticky-col staff-col staff-color-cell" style="background:${staffColor(st)};color:${textColorFor(staffColor(st))}"><button class="staff-summary-trigger" data-month-position-stat="${st.id}" type="button" title="ดูสรุปตำแหน่งรายเดือนของ ${escapeHtml(st.nickname || st.full_name)}"><b>${escapeHtml(st.nickname || st.full_name)}</b><br><small>${escapeHtml(st.staff_type || '')}</small><span>ดูสรุป</span></button></td>${dates.map(date => renderMonthPositionCell(st, date, map[`${st.id}|${date}`] || [])).join('')}</tr>`).join('')}
    </tbody></table></div>
  </div>`;
}
function renderMonthPositionCell(staff, date, codes) {
  const noDay = isNoPositionDay(date);
  const leave = isActiveLeaveOn(staff.id, date);
  const outing = hasOuting(date);
  if (noDay) return `<td class="matrix-cell no-position-day"><span>${isHolidayDate(date) ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
  const cleanCodes = codes.map(positionLabelForCell);
  const cls = `${outing ? 'outing-cell' : ''} ${leave ? 'leave-cell' : ''} ${!cleanCodes.length && !leave ? 'needs-review-cell' : ''}`.trim();
  const text = cleanCodes.length ? cleanCodes.join('<br>') : (leave ? 'ลา/ไม่รับเวร' : 'รอตรวจสอบ');
  const leaveMark = leave ? '<div class="cell-note">ไม่ต้องจัดตำแหน่ง</div>' : '';
  const outingMark = outing && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : '';
  return `<td class="matrix-cell ${cls}"><span>${text}</span>${leaveMark}${outingMark}</td>`;
}
function workingPositionStaffIdsForDate(date) {
  return orderedStaff(state.staff)
    .filter(s => isDailyPositionEnabled(s) && !isActiveLeaveOn(s.id, date))
    .map(s => s.id);
}
function createFallbackPositionRow(staff, date, usedCodes, orderNo) {
  const isProbation = String(staff.position_training_status || '').includes('น้องใหม่');
  const isKerk = staff.staff_type === 'เคิก';
  const base = isProbation
    ? FALLBACK_POSITION_BASES[isKerk ? 3 : 2]
    : FALLBACK_POSITION_BASES[(orderNo % 2 === 0) ? 0 : 1];
  let code = base.code;
  let n = 1;
  while (usedCodes.has(code)) {
    n += 1;
    code = `${base.code} ${n}`;
  }
  usedCodes.add(code);
  return {
    work_date: date,
    position_code: code,
    zone: base.zone,
    break_time: base.break_time,
    main_rule: base.main_rule,
    job_desc: base.job_desc,
    staff_id: staff.id,
    updated_by: currentStaffId()
  };
}
function buildMonthlyPositionDraft(key) {
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  const counts = {};
  const rows = [];
  const weeklyFixed = {};
  const serialMap = {};
  const addCount = (staffId, code) => {
    if (!staffId) return;
    const base = positionBaseCode(code);
    counts[staffId] = counts[staffId] || { total:0, byCode:{}, byZone:{}, load:0 };
    counts[staffId].total++;
    counts[staffId].byCode[base] = (counts[staffId].byCode[base] || 0) + 1;
    counts[staffId].byZone[positionZoneForCode(base)] = (counts[staffId].byZone[positionZoneForCode(base)] || 0) + 1;
    counts[staffId].load = (counts[staffId].load || 0) + positionLoadWeight(base);
  };
  const chooseForPosition = (position, date, pool, used, preferredId=null) => {
    if (preferredId && !used.has(preferredId)) {
      const fs = state.staff.find(x => x.id === preferredId);
      if (pool.some(x => x.id === preferredId) && positionCandidateOk(fs, position, date)) return fs;
    }
    const candidates = pool.filter(st => !used.has(st.id) && positionCandidateOk(st, position, date));
    candidates.sort((a,b) => monthPositionCandidateScore(a, position, counts, rows, date, { ignoreRecent: !!preferredId }) - monthPositionCandidateScore(b, position, counts, rows, date, { ignoreRecent: !!preferredId }) || compareStaffOrder(a,b));
    return candidates[0] || null;
  };
  const choosePositionForStaff = (staff, date, templates, preferBloodBank=false) => {
    const usable = templates.filter(p => positionCandidateOk(staff, p, date));
    if (!usable.length) return null;
    usable.sort((a,b) => {
      const za = a.zone === 'Blood Bank' || a.zone === 'Manual' ? 0 : 1;
      const zb = b.zone === 'Blood Bank' || b.zone === 'Manual' ? 0 : 1;
      if (preferBloodBank && za !== zb) return za - zb;
      return monthPositionCandidateScore(staff, a, counts, rows, date, { preferBloodBank }) - monthPositionCandidateScore(staff, b, counts, rows, date, { preferBloodBank }) || a.code.localeCompare(b.code);
    });
    return usable[0];
  };
  const addRow = (staff, date, position) => {
    if (!staff || !position) return;
    rows.push(rowForStaffPosition(staff, date, position, serialMap));
    addCount(staff.id, position.code);
  };
  for (let day=1; day<=last; day++) {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    if (isNoPositionDay(date)) continue;
    const working = dailyWorkingStaff(date);
    if (!working.length) continue;
    const used = new Set();
    if (hasOuting(date)) {
      const participantIds = new Set(outingParticipants(date));
      const outingPool = working.filter(st => participantIds.has(st.id));
      const roomPool = working.filter(st => !participantIds.has(st.id));

      // 1) คนที่ถูกติ๊กในกิจกรรมออกหน่วย ต้องถูกเฉลี่ยลงชุดออกหน่วยก่อน
      OUTING_POSITIONS.forEach(p => {
        const staff = chooseForPosition(p, date, outingPool, used);
        if (staff) { used.add(staff.id); addRow(staff, date, p); }
      });
      // ถ้าคนออกหน่วยมากกว่าช่องหลัก ให้ยังอยู่ในชุดออกหน่วยจริง ไม่ไป BB
      outingPool.filter(st => !used.has(st.id)).forEach(st => {
        const p = choosePositionForStaff(st, date, OUTING_POSITIONS, false) || OUTING_POSITIONS.find(x => x.code === 'DR-Main') || OUTING_POSITIONS[0];
        used.add(st.id); addRow(st, date, p);
      });

      // 2) คนที่ไม่ได้ไปออกหน่วย ให้เกลี่ยอยู่ห้อง Blood Bank/Manual เท่านั้น
      const bbTemplates = DEFAULT_POSITIONS.filter(p => p.zone === 'Blood Bank' || p.zone === 'Manual');
      roomPool.forEach(st => {
        const p = choosePositionForStaff(st, date, bbTemplates, true);
        if (p) addRow(st, date, p);
        else rows.push(reviewRowForStaff(st, date, 'ไม่พบตำแหน่ง Blood Bank ที่ตรงสิทธิ์/ผู้ปฏิบัติหลัก'));
      });
      continue;
    }

    // วันทำงานปกติ: จัดตำแหน่งหลักก่อน แล้วทุกคนที่เหลือต้องได้ตำแหน่งจริง ไม่ใช้ตำแหน่งเสริมปลอม
    const wk = weekKeyOf(date);
    weeklyFixed[wk] = weeklyFixed[wk] || {};
    ['BB-Report','DR-Processing'].forEach(code => {
      const p = DEFAULT_POSITIONS.find(x => x.code === code);
      if (!p) return;
      if (!weeklyFixed[wk][code]) {
        const chosen = chooseForPosition(p, date, working, used);
        weeklyFixed[wk][code] = chosen?.id || null;
      }
      const staff = chooseForPosition(p, date, working, used, weeklyFixed[wk][code]);
      if (staff) { used.add(staff.id); addRow(staff, date, p); }
    });
    DEFAULT_POSITIONS.filter(p => !['BB-Report','DR-Processing'].includes(p.code)).forEach(p => {
      const staff = chooseForPosition(p, date, working, used);
      if (staff) { used.add(staff.id); addRow(staff, date, p); }
    });
    working.filter(st => !used.has(st.id)).forEach(st => {
      const p = choosePositionForStaff(st, date, DEFAULT_POSITIONS, false);
      if (p) addRow(st, date, p);
      else rows.push(reviewRowForStaff(st, date, 'ไม่พบตำแหน่งที่ตรงสิทธิ์/ผู้ปฏิบัติหลัก'));
    });
  }
  return { monthKey: key, rows };
}

function renderOtPage() {
  const myDuty = state.rosterAssignments.some(x => x.duty_date === todayStr() && x.staff_id === currentStaffId());
  const mine = state.otRequests.filter(x => x.staff_id === currentStaffId());
  const rows = isAdmin() ? state.otRequests : mine;
  return `<div class="grid grid-2">
    <div class="card">
      <h3>ส่วนที่ 1 ลงชื่อเข้าเวร</h3>
      <p class="muted">${myDuty ? 'วันนี้มีชื่อคุณในตารางเวร กด Check-In ได้' : 'วันนี้ยังไม่พบชื่อคุณในตารางเวร ถ้าต้องลงจริงให้ Admin ตรวจตารางก่อน'}</p>
      <button class="primary-btn" data-check-in ${(!myDuty && !isAdmin()) ? 'disabled' : ''}>Check-In ด้วย GPS</button>
    </div>
    <div class="card">
      <h3>ส่วนที่ 2 ขอ OT เพิ่มเติม</h3>
      <form id="otForm" class="form-grid">
        <label>วันที่ <input name="work_date" type="date" value="${todayStr()}" required></label>
        <label>เวลาสิ้นสุด <input name="end_time" type="time" required></label>
        <label>เหตุผล <select name="reason">${OT_REASONS.map(r => `<option>${r}</option>`).join('')}</select></label>
        <label>หมายเหตุ <input name="note"></label>
        <button class="primary-btn wide" type="submit">ส่งคำขอ OT พร้อม Check-Out GPS</button>
      </form>
    </div>
    <div class="card wide-card" style="grid-column:1/-1;">
      <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div>
      ${renderOtTable(rows)}
    </div>
    <div class="card" style="grid-column:1/-1;">
      <h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">ส่วนนี้เป็น OT ขอเพิ่มตาม Check-Out จริง ส่วนตารางเวรประจำเดือนใช้กติกาเงิน/ชั่วโมงของเวรตั้งต้นและคำขอแลก/ขายเวรแยกต่างหาก</p>${renderOtSummary()}
    </div>
  </div>`;
}
function renderOtTable(rows) {
  if (!rows.length) return empty('ยังไม่มีรายการ OT');
  return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(r.note || '')}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function renderOtSummary() {
  const key = state.monthKey;
  const approved = state.otRequests.filter(x => x.work_date?.startsWith(key) && x.status === 'อนุมัติ');
  const map = {};
  approved.forEach(r => { map[r.staff_id] = map[r.staff_id] || { hours:0, count:0 }; map[r.staff_id].hours += calcOtHours(r); map[r.staff_id].count++; });
  const rows = Object.entries(map);
  if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
  return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมง OT</th><th>จำนวนครั้ง</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${r.hours.toFixed(1)}</td><td>${r.count}</td></tr>`).join('')}</tbody></table></div>`;
}
function calcOtHours(r) {
  if (!r.end_time) return 0;
  const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
  const end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
  return Math.max(0, (end - start) / 36e5);
}

function getFilteredAuditLogs() {
  if (!state.auditDate) return state.auditLogs;
  return state.auditLogs.filter(a => toDateInput(new Date(a.created_at)) === state.auditDate);
}
function renderAuditPage() {
  const rows = getFilteredAuditLogs();
  return `<div class="card">
    <div class="section-title"><div><h3>Audit Log ล่าสุด</h3><p class="hint">กรองเป็นรายวัน อ่านเป็นภาษาหน้างาน ไม่โชว์ข้อมูลหลังบ้านยาว ๆ ในตารางหลัก</p></div><button class="ghost-btn" data-export-audit-excel>Export Excel</button></div>
    <div class="toolbar">
      <label>วันที่ <input type="date" id="auditDateInput" value="${state.auditDate || ''}"></label>
      <button class="soft-btn" data-audit-today>วันนี้</button>
      <button class="ghost-btn" data-audit-all>แสดงทั้งหมด</button>
    </div>
    ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>เหตุการณ์</th><th>รายละเอียด</th></tr></thead><tbody>
      ${rows.map(a => `<tr><td>${formatThaiDateTime(a.created_at)}</td><td>${a.actor_id ? staffPill(a.actor_id) : '-'}</td><td>${badge(auditActionLabel(a), auditBadge(a))}</td><td>${escapeHtml(auditSummary(a))}<br><button class="tiny-btn" data-audit-detail="${a.id}">ดูรายละเอียด</button></td></tr>`).join('')}
    </tbody></table></div>` : empty('ยังไม่มี Audit Log ในวันที่เลือก')}
  </div>`;
}

function renderUsersPage() {
  if (!isAdmin()) return noPermission();
  return `<div class="grid">
    <div class="card">
      <div class="section-title"><div><h3>เพิ่มผู้ใช้งานใหม่</h3><p class="hint">คนใหม่จะยังไม่ถูก Auto Assign ตารางตำแหน่งรายวัน จนกว่า Admin จะเปิดสิทธิ์ให้</p></div></div>
      <form id="newStaffForm" class="form-grid compact-form">
        <label>ชื่อเล่น <input name="nickname" required></label>
        <label>ชื่อ-สกุล <input name="full_name" required></label>
        <label>Email Mahidol <input name="email" placeholder="name@mahidol.ac.th" required></label>
        <label>รหัสพนักงาน <input name="employee_code"></label>
        <label>ประเภท <select name="staff_type"><option>MT</option><option>เคิก</option><option>แพทย์</option></select></label>
        <label>ตำแหน่ง <input name="position" value="MT"></label>
        <label>Role <select name="role"><option>staff</option><option>admin</option></select></label>
        <label>สีประจำตัว <input name="staff_color" type="color" value="#e8f3ff"></label>
        <button class="primary-btn" type="submit">เพิ่มผู้ใช้งาน</button>
      </form>
    </div>
    <div class="card">
      <div class="section-title"><div><h3>ผู้ใช้งานและสิทธิ์</h3><p class="hint">ข้อมูลบัญชี / สิทธิ์ระบบ / สีประจำตัว</p></div><button class="primary-btn" data-save-staff-users>บันทึกข้อมูลผู้ใช้งาน</button></div>
      <div class="table-wrap"><table><thead><tr><th>สี</th><th>ชื่อเล่น</th><th>ชื่อ-สกุล</th><th>Email</th><th>รหัสพนักงาน</th><th>ประเภท</th><th>ตำแหน่ง</th><th>Role</th><th>Active</th><th>ลาคลอด</th><th>จัดเวร</th><th>สถานะตำแหน่งรายวัน</th><th>Auto ตำแหน่ง</th><th>Reset</th></tr></thead><tbody>
        ${orderedStaff(state.staff).map(s => `<tr data-staff-row="${s.id}">
          <td><input class="color-input" type="color" data-field="staff_color" value="${escapeHtml(staffColor(s))}"><br>${staffPill(s)}</td>
          <td><input data-field="nickname" value="${escapeHtml(s.nickname || '')}"></td>
          <td><input data-field="full_name" value="${escapeHtml(s.full_name || '')}"></td>
          <td><input data-field="email" value="${escapeHtml(s.email || '')}" placeholder="name@mahidol.ac.th"></td>
          <td><input data-field="employee_code" value="${escapeHtml(s.employee_code || '')}"></td>
          <td><select data-field="staff_type"><option value="">-</option><option ${s.staff_type==='MT'?'selected':''}>MT</option><option ${s.staff_type==='เคิก'?'selected':''}>เคิก</option><option ${s.staff_type==='แพทย์'?'selected':''}>แพทย์</option></select></td>
          <td><input data-field="position" value="${escapeHtml(s.position || '')}"></td>
          <td><select data-field="role"><option ${s.role==='staff'?'selected':''}>staff</option><option ${s.role==='admin'?'selected':''}>admin</option></select></td>
          <td><select data-field="is_active"><option value="true" ${s.is_active?'selected':''}>true</option><option value="false" ${!s.is_active?'selected':''}>false</option></select></td>
          <td><select data-field="maternity_status"><option value="false" ${!s.maternity_status?'selected':''}>false</option><option value="true" ${s.maternity_status?'selected':''}>true</option></select></td>
          <td><select data-field="roster_enabled"><option value="true" ${s.roster_enabled!==false?'selected':''}>true</option><option value="false" ${s.roster_enabled===false?'selected':''}>false</option></select></td>
          <td><select data-field="position_training_status">${POSITION_TRAINING_STATUSES.map(v => `<option value="${escapeHtml(v)}" ${(s.position_training_status || 'ใช้งานปกติ')===v?'selected':''}>${escapeHtml(v)}</option>`).join('')}</select></td>
          <td><select data-field="daily_position_enabled"><option value="true" ${s.daily_position_enabled!==false?'selected':''}>true</option><option value="false" ${s.daily_position_enabled===false?'selected':''}>false</option></select></td>
          <td><button class="tiny-btn" data-reset-user-email="${escapeHtml(s.email || '')}">ส่ง reset</button></td>
        </tr>`).join('')}
      </tbody></table></div>
      <p class="hint">สิทธิ์ตำแหน่งรายวันแยกไปที่เมนู Admin → สิทธิ์ตำแหน่งรายวัน เพื่อให้ใช้ง่ายขึ้นและไม่ยาวเกินหน้า</p>
    </div>
  </div>`;
}

function renderEligibilityPage() {
  if (!isAdmin()) return noPermission();
  const activeStaff = orderedStaff(state.staff.filter(s => s.is_active));
  if (!activeStaff.length) return empty('ยังไม่มีเจ้าหน้าที่ active');
  if (!state.eligibilityStaffId || !activeStaff.some(s => s.id === state.eligibilityStaffId)) state.eligibilityStaffId = activeStaff[0].id;
  const selected = activeStaff.find(s => s.id === state.eligibilityStaffId) || activeStaff[0];
  const grouped = ALL_POSITION_TEMPLATES.reduce((acc, p) => { (acc[p.zone] = acc[p.zone] || []).push(p); return acc; }, {});
  return `<div class="grid eligibility-page">
    <div class="card eligibility-staff-panel">
      <div class="section-title"><div><h3>เลือกเจ้าหน้าที่</h3><p class="hint">เลือกทีละคน จะเห็นชื่อค้างไว้ ไม่ต้องเลื่อนซ้าย-ขวาหนัก ๆ</p></div></div>
      <label>เจ้าหน้าที่
        <select id="eligibilityStaffSelect">${activeStaff.map(s => `<option value="${s.id}" ${selected.id===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select>
      </label>
      <div class="selected-staff-card" style="--staff-bg:${staffColor(selected)};--staff-fg:${textColorFor(staffColor(selected))}">
        <div class="big-staff-name">${escapeHtml(selected.nickname || selected.full_name)}</div>
        <div>${escapeHtml(selected.full_name || '')}</div>
        <small>${escapeHtml(selected.staff_type || '-')} • ${escapeHtml(selected.position_training_status || 'ใช้งานปกติ')}</small>
      </div>
      <p class="hint">ถ้าคนใหม่ผ่านโปรแล้ว ให้กลับไปเมนู ผู้ใช้งานและสิทธิ์ → เปลี่ยนสถานะ และเปิด Auto ตำแหน่งก่อน จากนั้นค่อยติ๊กตำแหน่งที่ขึ้นได้ตรงหน้านี้ ตำแหน่งออกหน่วยจะแยกอยู่ในโซน “ออกหน่วย” ไม่ใช่ตำแหน่งประจำห้อง Donor</p>
    </div>
    <div class="card eligibility-position-panel">
      <div class="section-title">
        <div><h3>สิทธิ์ตำแหน่งรายวันของ ${escapeHtml(selected.nickname || selected.full_name)}</h3><p class="hint">ติ๊กเฉพาะตำแหน่งที่ขึ้นงานได้จริง ระบบ Auto Assign จะใช้ข้อมูลนี้เป็นตัวกรองหลัก</p></div>
        <button class="primary-btn" data-save-position-eligibility>บันทึกสิทธิ์ตำแหน่ง</button>
      </div>
      <div class="position-card-grid">
        ${Object.entries(grouped).map(([zone, positions]) => `<div class="position-zone-card"><h4>${escapeHtml(zone)}</h4>${positions.map(p => {
          const eligibilityKey = p.eligibility_code || p.code;
          const checked = positionEligible(selected, eligibilityKey);
          const ruleOk = positionRuleOk(selected, p.main_rule);
          return `<label class="position-check ${checked?'checked':''} ${ruleOk?'':'rule-mismatch'}">
            <input type="checkbox" data-eligibility data-staff-id="${selected.id}" data-position-code="${escapeHtml(eligibilityKey)}" ${checked?'checked':''}>
            <span><b>${escapeHtml(p.code)}</b><small>${escapeHtml(p.main_rule)}${ruleOk ? '' : ' • ไม่ตรงผู้ปฏิบัติหลัก'}</small><em>${escapeHtml(p.job_desc)}</em></span>
          </label>`;
        }).join('')}</div>`).join('')}
      </div>
    </div>
  </div>`;
}
function renderPositionEligibilityMatrix() { return renderEligibilityPage(); }

async function handleSubmit(e) {
  if (e.target.id === 'leaveForm') { e.preventDefault(); await saveLeave(e.target); }
  if (e.target.id === 'activityForm') { e.preventDefault(); await saveActivity(e.target); }
  if (e.target.classList.contains('hr-form')) { e.preventDefault(); await saveHrCheck(e.target); }
  if (e.target.id === 'otForm') { e.preventDefault(); await saveOtRequest(e.target); }
  if (e.target.id === 'dutyTradeForm') { e.preventDefault(); await saveTradeRequest(e.target); }
  if (e.target.id === 'newStaffForm') { e.preventDefault(); await saveNewStaff(e.target); }
  if (e.target.id === 'holidayForm') { e.preventDefault(); await saveHoliday(e.target); }
}
async function handleClick(e) {
  const t = e.target.closest('button, [data-day-detail]');
  if (!t) return;
  if (t.dataset.page) { state.page = t.dataset.page; $('sidebar').classList.remove('open'); renderPage(); return; }
  if (t.dataset.calView) { state.calendarView = t.dataset.calView; renderPage(); return; }
  if (t.dataset.calNav) { calendarNav(t.dataset.calNav); renderPage(); return; }
  if (t.dataset.dayDetail) { showDayDetail(t.dataset.dayDetail); return; }
  if (t.dataset.editLeave) { state.editingLeaveId = t.dataset.editLeave; renderPage(); return; }
  if (t.hasAttribute('data-cancel-edit-leave')) { state.editingLeaveId = null; renderPage(); return; }
  if (t.dataset.cancelLeave) { await cancelLeave(t.dataset.cancelLeave); return; }
  if (t.dataset.editActivity) { state.editingActivityId = t.dataset.editActivity; renderPage(); return; }
  if (t.hasAttribute('data-cancel-edit-activity')) { state.editingActivityId = null; renderPage(); return; }
  if (t.dataset.deleteActivity) { await deleteActivity(t.dataset.deleteActivity); return; }
  if (t.hasAttribute('data-generate-roster')) { state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) }; renderPage(); return; }
  if (t.hasAttribute('data-auto-assign')) { autoAssignRoster(); renderPage(); return; }
  if (t.hasAttribute('data-save-roster')) { await saveRosterDraft('draft'); return; }
  if (t.hasAttribute('data-publish-roster')) { await saveRosterDraft('published'); return; }
  if (t.hasAttribute('data-lock-roster')) { await saveRosterDraft('locked'); return; }
  if (t.dataset.clearSlot) { updateDraftSlot(t.dataset.clearSlot, { staff_id:null }); renderPage(); return; }
  if (t.dataset.toggleLockSlot) { const slot = findDraftSlot(t.dataset.toggleLockSlot); updateDraftSlot(t.dataset.toggleLockSlot, { is_locked: !slot?.is_locked }); renderPage(); return; }
  if (t.hasAttribute('data-show-fairness')) { showFairness(); return; }
  if (t.dataset.staffStat) { showStaffStats(t.dataset.staffStat); return; }
  if (t.dataset.monthPositionStat) { showMonthPositionStaffSummary(t.dataset.monthPositionStat); return; }
  if (t.dataset.tradeDuty) { showTradeModal(t.dataset.tradeDuty); return; }
  if (t.dataset.tradeStatus) { const [id,status] = t.dataset.tradeStatus.split('|'); await updateTradeStatus(id,status); return; }
  if (t.dataset.tradeApply) { await applyTradeRequest(t.dataset.tradeApply); return; }
  if (t.hasAttribute('data-export-schedule-excel')) { exportScheduleExcel(); return; }
  if (t.hasAttribute('data-print-page')) { window.print(); return; }
  if (t.hasAttribute('data-auto-positions')) { autoAssignPositions(); return; }
  if (t.hasAttribute('data-save-incharge')) { await saveIncharge(); return; }
  if (t.hasAttribute('data-save-positions')) { await savePositions(); return; }
  if (t.hasAttribute('data-publish-positions')) { await publishPositionsForDay(); return; }
  if (t.hasAttribute('data-generate-month-positions')) { state.monthPositionDraft = buildMonthlyPositionDraft(state.positionMonthKey || state.monthKey); renderPage(); showToast('สร้าง default ตำแหน่งรายเดือนแล้ว ตรวจทานก่อนบันทึก'); return; }
  if (t.hasAttribute('data-save-month-positions')) { await saveMonthlyPositions(); return; }
  if (t.hasAttribute('data-check-in')) { await checkIn(); return; }
  if (t.dataset.otStatus) { const [id,status] = t.dataset.otStatus.split('|'); await updateOtStatus(id,status); return; }
  if (t.hasAttribute('data-export-ot-excel')) { exportTable('otSummaryTable', `OT_${state.monthKey}.xlsx`); return; }
  if (t.hasAttribute('data-export-audit-excel')) { exportAuditExcel(); return; }
  if (t.hasAttribute('data-audit-today')) { state.auditDate = todayStr(); renderPage(); return; }
  if (t.hasAttribute('data-audit-all')) { state.auditDate = ''; renderPage(); return; }
  if (t.hasAttribute('data-save-staff-users')) { await saveStaffUsers(); return; }
  if (t.hasAttribute('data-save-position-eligibility')) { await savePositionEligibility(); return; }
  if (t.dataset.resetUserEmail !== undefined) { await resetUserPassword(t.dataset.resetUserEmail); return; }
  if (t.dataset.auditDetail) { showAuditDetail(t.dataset.auditDetail); return; }
}
function handleChange(e) {
  if (e.target.id === 'rosterMonthInput' || e.target.id === 'scheduleMonthInput') { state.monthKey = e.target.value; state.rosterDraft = null; renderPage(); }
  if (e.target.id === 'positionDateInput') { state.positionDate = e.target.value; renderPage(); }
  if (e.target.id === 'auditDateInput') { state.auditDate = e.target.value; renderPage(); }
  if (e.target.id === 'eligibilityStaffSelect') { state.eligibilityStaffId = e.target.value; renderPage(); }
  if (e.target.id === 'positionMonthInput') { state.positionMonthKey = e.target.value; state.monthPositionDraft = null; renderPage(); }
  if (e.target.id === 'positionMonthViewInput') { state.positionMonthViewKey = e.target.value; renderPage(); }
  if (e.target.id === 'tradeTypeSelect') { updateTradeSwapVisibility(); }
  if (e.target.id === 'tradeReceiverSelect') {
    const sel = document.getElementById('tradeSwapSelect');
    if (sel) Array.from(sel.options).forEach(opt => { if (!opt.value) return; opt.hidden = opt.dataset.owner !== e.target.value; });
    if (sel) sel.value = '';
  }
}

function calendarNav(action) {
  const d = new Date(state.calendarDate);
  if (action === 'today') state.calendarDate = new Date();
  if (action === 'prev') { if (state.calendarView === 'month') d.setMonth(d.getMonth()-1); else d.setDate(d.getDate() - (state.calendarView === 'week' ? 7 : 1)); state.calendarDate = d; }
  if (action === 'next') { if (state.calendarView === 'month') d.setMonth(d.getMonth()+1); else d.setDate(d.getDate() + (state.calendarView === 'week' ? 7 : 1)); state.calendarDate = d; }
}
async function uploadFile(file, folder) {
  if (!file) return null;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${folder}/${currentStaffId()}/${Date.now()}_${safeName}`;
  const { error } = await sb.storage.from('staff-files').upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return path;
}
async function saveLeave(form) {
  const fd = new FormData(form);
  const row = {
    staff_id: isAdmin() ? (fd.get('staff_id') || currentStaffId()) : currentStaffId(),
    type: fd.get('type'),
    start_date: fd.get('start_date'),
    end_date: fd.get('end_date'),
    leave_period: fd.get('leave_period') || 'เต็มวัน',
    note: fd.get('note'),
    contact_phone: fd.get('contact_phone'),
    updated_by: currentStaffId()
  };
  if (isAdmin()) {
    const isBackdated = row.start_date < todayStr();
    row.recorded_by_admin = row.staff_id !== currentStaffId() || isBackdated;
    row.admin_record_reason = String(fd.get('admin_record_reason') || '').trim() || null;
  }
  if (row.end_date < row.start_date) return showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
  const requestedDates = datesBetween(row.start_date, row.end_date);
  const hasPublishedDay = requestedDates.some(positionDayPublished);
  if (hasPublishedDay && !isAdmin()) {
    row.note = [row.note, '[ระบบเตือน] วันที่ขอลามีการประกาศตารางตำแหน่งแล้ว กรุณาแจ้งอินชาร์จหรือหัวหน้า'].filter(Boolean).join(' | ');
    showToast('วันที่ขอลามีการประกาศตำแหน่งแล้ว กรุณาแจ้งอินชาร์จหรือหัวหน้าเพื่อปรับหน้างาน');
  }
  if (hasPublishedDay && isAdmin()) {
    row.recorded_by_admin = true;
    row.admin_record_reason = row.admin_record_reason || 'Admin บันทึก/แก้ไขรายการหลังประกาศตารางตำแหน่งรายวัน';
  }
  const file = fd.get('file');
  if (file && file.size) row.attachment_path = await uploadFile(file, 'leave');
  setBusy(true, 'กำลังบันทึก');
  const id = state.editingLeaveId;
  let res;
  if (isAdmin()) {
    const adminReason = String(row.admin_record_reason || '').trim();
    if ((row.staff_id !== currentStaffId() || row.start_date < todayStr() || hasPublishedDay) && !adminReason) {
      setBusy(false);
      return showToast('กรุณาระบุเหตุผลที่ Admin บันทึกแทน/ย้อนหลัง เพื่อให้ Audit Log ชัดเจน');
    }
    res = await sb.rpc('admin_upsert_leave_v27', {
      p_id: id || null,
      p_staff_id: row.staff_id,
      p_type: row.type,
      p_start_date: row.start_date,
      p_end_date: row.end_date,
      p_leave_period: row.leave_period,
      p_note: row.note || null,
      p_contact_phone: row.contact_phone || null,
      p_attachment_path: row.attachment_path || null,
      p_admin_record_reason: adminReason || null,
      p_recorded_by_admin: !!row.recorded_by_admin
    });
  } else {
    res = id ? await sb.from('leave_requests').update(row).eq('id', id) : await sb.from('leave_requests').insert({ ...row, created_by: currentStaffId(), status: 'active' });
  }
  setBusy(false);
  if (res.error) return showToast(friendlyDbError(res.error));
  state.editingLeaveId = null;
  await loadAllData(); renderPage();
  const backdated = isAdmin() && row.start_date < todayStr();
  showToast(backdated ? 'บันทึกลาย้อนหลังแทนเจ้าหน้าที่แล้ว' : 'บันทึกแล้ว');
}
async function cancelLeave(id) {
  if (!confirm('ยืนยันยกเลิกรายการนี้?')) return;
  const { error } = await sb.from('leave_requests').update({ status:'cancelled', updated_by: currentStaffId() }).eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ยกเลิกแล้ว');
}
async function saveActivity(form) {
  const fd = new FormData(form);
  const participants = Array.from(form.querySelectorAll('input[name="participant_ids"]:checked')).map(o => o.value);
  const row = {
    title: String(fd.get('title') || '').trim(),
    event_type: fd.get('event_type'),
    start_date: fd.get('start_date'),
    end_date: fd.get('end_date'),
    start_time: fd.get('start_time') || null,
    end_time: fd.get('end_time') || null,
    location: String(fd.get('location') || '').trim(),
    note: String(fd.get('note') || '').trim(),
    owner_id: fd.get('owner_id') || currentStaffId(),
    participant_ids: participants,
    updated_by: currentStaffId()
  };
  const requiredMissing = [];
  if (!row.title) requiredMissing.push('รายละเอียดกิจกรรม');
  if (!row.event_type) requiredMissing.push('ประเภท');
  if (!row.location) requiredMissing.push('สถานที่');
  if (!row.start_date) requiredMissing.push('วันที่เริ่ม');
  if (!row.end_date) requiredMissing.push('วันที่สิ้นสุด');
  if (!row.start_time) requiredMissing.push('เวลาเริ่ม');
  if (!row.end_time) requiredMissing.push('เวลาสิ้นสุด');
  if (!row.owner_id) requiredMissing.push('ผู้รับผิดชอบ');
  if (!participants.length) requiredMissing.push('ผู้เข้าร่วม');
  if (!row.note) requiredMissing.push('รายละเอียด');
  if (requiredMissing.length) return showToast('กรุณากรอก/เลือกให้ครบ ยกเว้นเอกสารแนบ: ' + requiredMissing.join(', '));
  if (row.end_date < row.start_date) return showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
  if (row.start_date === row.end_date && row.end_time <= row.start_time) return showToast('เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม');
  const file = fd.get('file');
  try { if (file && file.size) row.attachment_path = await uploadFile(file, 'activities'); }
  catch (err) { return showToast('อัปโหลดไฟล์แนบไม่สำเร็จ: ' + err.message); }
  const id = state.editingActivityId;
  const res = id ? await sb.from('activity_events').update(row).eq('id', id) : await sb.from('activity_events').insert({ ...row, created_by: currentStaffId() });
  if (res.error) return showToast(friendlyDbError(res.error));
  state.editingActivityId = null;
  await loadAllData(); renderPage(); showToast('บันทึกกิจกรรมแล้ว');
}
async function deleteActivity(id) {
  if (!confirm('ลบกิจกรรมนี้?')) return;
  const { error } = await sb.from('activity_events').delete().eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ลบแล้ว');
}
async function saveHrCheck(form) {
  const fd = new FormData(form);
  const leaveId = form.dataset.leaveId;
  const existing = state.hrChecks.find(x => x.leave_request_id === leaveId);
  const row = { leave_request_id: leaveId, status: fd.get('status'), hr_reported_date: fd.get('hr_reported_date') || null, note: fd.get('note'), checked_by: currentStaffId(), checked_at: new Date().toISOString() };
  const res = existing ? await sb.from('hr_checks').update(row).eq('id', existing.id) : await sb.from('hr_checks').insert(row);
  if (res.error) return showToast(res.error.message);
  await loadAllData(); renderPage(); showToast('บันทึก HR แล้ว');
}

function handleDragStart(e) { const chip = e.target.closest('[data-drag-staff]'); if (chip) e.dataTransfer.setData('staffId', chip.dataset.dragStaff); }
function handleDragOver(e) { const slot = e.target.closest('[data-drop-slot]'); if (slot) { e.preventDefault(); slot.classList.add('drag-over'); } }
function handleDragLeave(e) { const slot = e.target.closest('[data-drop-slot]'); if (slot) slot.classList.remove('drag-over'); }
function handleDrop(e) {
  const slot = e.target.closest('[data-drop-slot]');
  if (!slot) return;
  e.preventDefault(); slot.classList.remove('drag-over');
  const staffId = e.dataTransfer.getData('staffId');
  const target = findDraftSlot(slot.dataset.dropSlot);
  if (!target) return;
  if (target.is_locked) return showToast('ช่องนี้ล็อกอยู่');
  if (!canStaffWorkSlot(staffId, target)) return showToast('คนนี้ติดลา/ไม่รับเวร หรือประเภทไม่ตรงกับเวร');

  const scrollSnapshot = captureRosterScroll(slot);
  updateDraftSlot(slot.dataset.dropSlot, { staff_id: staffId });
  renderPage();
  restoreRosterScroll(scrollSnapshot);
}
function captureRosterScroll(slotEl) {
  const wrap = slotEl?.closest('.table-wrap');
  const staffPool = document.querySelector('.staff-pool');
  return {
    windowX: window.scrollX,
    windowY: window.scrollY,
    wrapLeft: wrap ? wrap.scrollLeft : 0,
    wrapTop: wrap ? wrap.scrollTop : 0,
    poolTop: staffPool ? staffPool.scrollTop : 0
  };
}
function restoreRosterScroll(snapshot) {
  requestAnimationFrame(() => {
    window.scrollTo(snapshot.windowX || 0, snapshot.windowY || 0);
    const wrap = document.querySelector('.roster-board .table-wrap');
    if (wrap) {
      wrap.scrollLeft = snapshot.wrapLeft || 0;
      wrap.scrollTop = snapshot.wrapTop || 0;
    }
    const staffPool = document.querySelector('.staff-pool');
    if (staffPool) staffPool.scrollTop = snapshot.poolTop || 0;
  });
}
function findDraftSlot(id) { const a = getAssignmentsForMonth(state.monthKey); return a.find(x => (x.id || x._temp_id) === id); }
function updateDraftSlot(id, patch) {
  if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: structuredClone(getAssignmentsForMonth(state.monthKey)) };
  const slot = state.rosterDraft.assignments.find(x => (x.id || x._temp_id) === id);
  if (slot) Object.assign(slot, patch);
}
function autoAssignRoster() {
  if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
  const assignments = state.rosterDraft.assignments;
  const counts = calcFairness(assignments.filter(x => x.staff_id));
  assignments.forEach(slot => {
    if (slot.is_locked || slot.staff_id) return;
    const wk = weekKeyOf(slot.duty_date);
    const candidates = state.staff.filter(s => isRosterEnabled(s) && canStaffWorkSlot(s.id, slot));
    candidates.sort((a,b) => {
      const ca = counts[a.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
      const cb = counts[b.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
      const adjA = adjacentDutyPenalty(a.id, slot.duty_date, assignments);
      const adjB = adjacentDutyPenalty(b.id, slot.duty_date, assignments);
      return ((ca.pay || 0) - (cb.pay || 0)) || (ca.hours - cb.hours) || ((ca.weekCounts[wk]||0) - (cb.weekCounts[wk]||0)) || (ca.weekend - cb.weekend) || (adjA - adjB) || (ca.total - cb.total);
    });
    if (candidates[0]) {
      slot.staff_id = candidates[0].id;
      counts[candidates[0].id] = counts[candidates[0].id] || { total:0, mon:0, fri:0, weekend:0, weekday:0, hours:0, weekCounts:{} };
      const c = counts[candidates[0].id];
      c.total++;
      const dm = dutyMetrics(slot, candidates[0].id);
      c.hours += dm.hours;
      c.units = (c.units || 0) + dm.units;
      c.pay = (c.pay || 0) + dm.pay;
      const wk2 = weekKeyOf(slot.duty_date); c.weekCounts[wk2] = (c.weekCounts[wk2] || 0) + 1;
      if (isWeekend(slot.duty_date) || isHolidayDate(slot.duty_date)) c.weekend++; else c.weekday++;
    }
  });
  showToast('Auto Assign แล้ว ตรวจทานก่อนประกาศอีกทีนะ');
}
function canStaffWorkSlot(staffId, slot) {
  const s = state.staff.find(x => x.id === staffId);
  if (!isRosterEnabled(s)) return false;
  if (!supportsRequiredRole(s, slot.required_role)) return false;
  const blocked = state.leaves.some(l => l.staff_id === staffId && overlapsDate(l, slot.duty_date));
  if (blocked) return false;
  const already = getAssignmentsForMonth(state.monthKey).some(a => a.duty_date === slot.duty_date && a.staff_id === staffId && (a.id || a._temp_id) !== (slot.id || slot._temp_id));
  return !already;
}
function adjacentDutyPenalty(staffId, date, assignments) {
  const d = parseDate(date);
  const prev = new Date(d); prev.setDate(d.getDate()-1);
  const next = new Date(d); next.setDate(d.getDate()+1);
  const prevStr = toDateInput(prev), nextStr = toDateInput(next);
  return assignments.some(a => a.staff_id === staffId && (a.duty_date === prevStr || a.duty_date === nextStr)) ? 1 : 0;
}
function isWeekend(date) { const d = parseDate(date).getDay(); return d === 0 || d === 6; }
async function saveRosterDraft(status='draft') {
  if (!state.rosterDraft || !state.rosterDraft.assignments.length) return showToast('ยังไม่มีร่างตาราง');
  const { y, m } = getMonthRange(state.monthKey);
  let month = state.rosterMonths.find(x => x.year === y && x.month === m);
  const monthPayload = { year: y, month: m, status, updated_by: currentStaffId() };
  if (!month) {
    const { data, error } = await sb.from('roster_months').insert({ ...monthPayload, created_by: currentStaffId() }).select().single();
    if (error) return showToast(error.message);
    month = data;
  } else {
    const { error } = await sb.from('roster_months').update(monthPayload).eq('id', month.id);
    if (error) return showToast(error.message);
  }
  const rows = state.rosterDraft.assignments.map(a => {
    const row = { roster_month_id: month.id, duty_date: a.duty_date, duty_code: a.duty_code, required_role: a.required_role, staff_id: a.staff_id, is_locked: !!a.is_locked, updated_by: currentStaffId() };
    if (a.id) row.id = a.id;
    return row;
  });
  const { error } = await sb.from('roster_assignments').upsert(rows, { onConflict: 'roster_month_id,duty_date,duty_code' });
  if (error) return showToast(friendlyDbError(error));
  state.rosterDraft = null;
  await loadAllData(); renderPage(); showToast(status === 'published' ? 'ประกาศตารางแล้ว' : status === 'locked' ? 'ล็อกตารางแล้ว' : 'บันทึกร่างแล้ว');
}

async function savePositions() {
  const date = $('positionDateInput')?.value || state.positionDate || todayStr();
  if (!canManagePositions(date)) return showToast('เฉพาะ Admin หรืออินชาร์จประจำเดือนนี้เท่านั้น');
  const selects = Array.from(document.querySelectorAll('[data-position-row]'));
  const rows = selects.map(sel => {
    const code = sel.dataset.positionCode || 'รอตรวจสอบ';
    const base = positionTemplateByCode(code, date) || {};
    return {
      work_date: date,
      position_code: code,
      zone: sel.dataset.positionZone || base.zone || 'รอตรวจสอบ',
      break_time: sel.dataset.positionBreak || base.break_time || '-',
      main_rule: sel.dataset.positionRule || base.main_rule || '',
      job_desc: sel.dataset.positionJob || base.job_desc || '',
      staff_id: sel.value || null,
      updated_by: currentStaffId()
    };
  }).filter(r => r.position_code);
  const del = await sb.from('daily_positions').delete().eq('work_date', date);
  if (del.error) return showToast(friendlyDbError(del.error));
  const { error } = rows.length ? await sb.from('daily_positions').insert(rows) : { error:null };
  if (error) return showToast(friendlyDbError(error));
  await sb.from('daily_position_day_status').upsert({ work_date: date, month_key: date.slice(0,7), status: 'draft', updated_by: currentStaffId() }, { onConflict:'work_date' });
  await loadAllData(); renderPage(); showToast('บันทึกตำแหน่งรายวันแล้ว');
}
async function publishPositionsForDay() {
  const date = $('positionDateInput')?.value || state.positionDate || todayStr();
  if (!canManagePositions(date)) return showToast('เฉพาะ Admin หรืออินชาร์จประจำเดือนนี้เท่านั้น');
  const { error } = await sb.from('daily_position_day_status').upsert({ work_date: date, month_key: date.slice(0,7), status: 'published', published_by: currentStaffId(), published_at: new Date().toISOString(), updated_by: currentStaffId() }, { onConflict:'work_date' });
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast('ประกาศตารางตำแหน่งวันนี้แล้ว');
}
async function saveMonthlyPositions() {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const key = state.positionMonthKey || state.monthKey;
  if (!state.monthPositionDraft || state.monthPositionDraft.monthKey !== key) state.monthPositionDraft = buildMonthlyPositionDraft(key);
  const rows = state.monthPositionDraft.rows;
  const { start, end } = getMonthRange(key);
  // V22: ลบข้อมูลเดือนนั้นก่อน แล้ว insert แถวที่เห็นในหน้า draft จริง ๆ เพื่อไม่ให้หลังบันทึกกลายเป็นอีกชุดจากข้อมูลเก่าที่ค้างอยู่
  const del = await sb.from('daily_positions').delete().gte('work_date', start).lte('work_date', end);
  if (del.error) return showToast(friendlyDbError(del.error));
  const ins = rows.length ? await sb.from('daily_positions').insert(rows) : { error:null };
  if (ins.error) return showToast(friendlyDbError(ins.error));
  const dates = [...new Set(rows.map(r => r.work_date))];
  const statusRows = dates.map(date => ({ work_date: date, month_key: key, status: 'draft', updated_by: currentStaffId() }));
  const st = statusRows.length ? await sb.from('daily_position_day_status').upsert(statusRows, { onConflict:'work_date' }) : { error:null };
  if (st.error) return showToast(friendlyDbError(st.error));
  state.monthPositionDraft = { monthKey:key, rows };
  await loadAllData();
  state.monthPositionDraft = null;
  renderPage(); showToast('บันทึก default ตำแหน่งรายเดือนแล้ว ข้อมูลหลังบันทึกจะตรงกับ draft ที่เห็นก่อนกดบันทึก');
}
function autoAssignPositions() {
  const date = $('positionDateInput')?.value || state.positionDate || todayStr();
  if (!canManagePositions(date)) return showToast('เฉพาะ Admin หรืออินชาร์จประจำเดือนนี้เท่านั้น');
  const selects = Array.from(document.querySelectorAll('[data-position-row]'));
  const used = new Set(selects.map(s => s.value).filter(Boolean));
  const existing = state.positions.filter(x => x.work_date?.startsWith(date.slice(0,7)) && x.staff_id);
  const counts = {};
  existing.forEach(x => {
    counts[x.staff_id] = counts[x.staff_id] || { total:0, byCode:{} };
    counts[x.staff_id].total++;
    counts[x.staff_id].byCode[x.position_code] = (counts[x.staff_id].byCode[x.position_code] || 0) + 1;
  });
  const participants = new Set(outingParticipants(date));
  selects.forEach(sel => {
    if (sel.value) return;
    const code = sel.dataset.positionCode || 'รอตรวจสอบ';
    const row = { code, position_code: code, main_rule: sel.dataset.positionRule || '', zone: sel.dataset.positionZone || '' };
    let pool = dailyWorkingStaff(date);
    if (hasOuting(date)) {
      const isOuting = String(row.zone).includes('ออกหน่วย');
      pool = pool.filter(s => isOuting ? participants.has(s.id) : !participants.has(s.id));
    }
    const candidates = pool.filter(s => !used.has(s.id) && (code === 'รอตรวจสอบ' || positionCandidateOk(s, row, date)));
    candidates.sort((a,b) => ((counts[a.id]?.byCode?.[code] || 0) - (counts[b.id]?.byCode?.[code] || 0)) || ((counts[a.id]?.total || 0) - (counts[b.id]?.total || 0)) || compareStaffOrder(a,b));
    if (candidates[0]) { sel.value = candidates[0].id; used.add(candidates[0].id); }
  });
  showToast(hasOuting(date) ? 'จัดตำแหน่งออกหน่วยจากผู้เข้าร่วม และจัดคนที่เหลือเข้าห้อง Blood Bank แล้ว' : 'จัดตำแหน่งรายวันอัตโนมัติแล้ว');
}
async function saveIncharge() {
  const date = $('positionDateInput')?.value || todayStr();
  const month_key = date.slice(0,7);
  const staff_id = $('inchargeSelect')?.value || null;
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const { error } = await sb.from('monthly_incharges').upsert({ month_key, staff_id, updated_by: currentStaffId() }, { onConflict:'month_key' });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('บันทึกอินชาร์จประจำเดือนแล้ว');
}
async function saveHoliday(form) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const fd = new FormData(form);
  const row = { holiday_date: fd.get('holiday_date'), title: fd.get('title'), updated_by: currentStaffId() };
  const { error } = await sb.from('public_holidays').upsert(row, { onConflict:'holiday_date' });
  if (error) return showToast(friendlyDbError(error));
  state.rosterDraft = null;
  await loadAllData(); renderPage(); showToast('บันทึกวันหยุดราชการแล้ว');
}
async function checkIn() {
  const pos = await getGps();
  if (!pos.ok) return showToast(pos.message);
  if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showToast('อยู่นอกพื้นที่ที่กำหนด ไม่สามารถ Check-In ได้');
  const device = navigator.userAgent.slice(0, 250);
  const { error } = await sb.from('attendance_logs').insert({ staff_id: currentStaffId(), duty_date: todayStr(), check_in_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('Check-In แล้ว');
}
async function saveOtRequest(form) {
  const pos = await getGps();
  if (!pos.ok) return showToast(pos.message);
  if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showToast('อยู่นอกพื้นที่ที่กำหนด ไม่สามารถขอ OT ได้');
  const fd = new FormData(form);
  const row = { staff_id: currentStaffId(), work_date: fd.get('work_date'), end_time: fd.get('end_time'), reason: fd.get('reason'), note: fd.get('note'), status: 'รออนุมัติ', check_out_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
  const { error } = await sb.from('ot_requests').insert(row);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ส่งคำขอ OT แล้ว');
}
async function updateOtStatus(id, status) {
  const { error } = await sb.from('ot_requests').update({ status, reviewed_by: currentStaffId(), reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('อัปเดต OT แล้ว');
}
function getGps() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ ok:false, message:'อุปกรณ์นี้ไม่รองรับ GPS' });
    navigator.geolocation.getCurrentPosition(
      p => resolve({ ok:true, lat:p.coords.latitude, lng:p.coords.longitude, accuracy:p.coords.accuracy }),
      err => resolve({ ok:false, message: err.message || 'ไม่สามารถอ่าน GPS ได้' }),
      { enableHighAccuracy:true, timeout:12000, maximumAge:0 }
    );
  });
}
function isInsideGeofence(pos) {
  if (!CFG.GEOFENCE?.enabled) return true;
  const d = distanceMeters(pos.lat, pos.lng, CFG.GEOFENCE.lat, CFG.GEOFENCE.lng);
  return d <= (CFG.GEOFENCE.radiusMeters || 500);
}
function distanceMeters(lat1, lon1, lat2, lon2) {
  const R=6371000, toRad=x=>x*Math.PI/180;
  const dLat=toRad(lat2-lat1), dLon=toRad(lon2-lon1);
  const a=Math.sin(dLat/2)**2 + Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*Math.sin(dLon/2)**2;
  return R*2*Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}


async function saveStaffUsers() {
  const rows = Array.from(document.querySelectorAll('[data-staff-row]')).map(tr => {
    const get = field => tr.querySelector(`[data-field="${field}"]`)?.value || '';
    return {
      id: tr.dataset.staffRow,
      nickname: get('nickname') || null,
      full_name: get('full_name') || null,
      email: get('email') || null,
      employee_code: get('employee_code') || null,
      staff_color: get('staff_color') || null,
      staff_type: get('staff_type') || null,
      position: get('position') || null,
      role: get('role') || 'staff',
      is_active: get('is_active') === 'true',
      maternity_status: get('maternity_status') === 'true',
      roster_enabled: get('roster_enabled') !== 'false',
      daily_position_enabled: get('daily_position_enabled') !== 'false',
      position_training_status: get('position_training_status') || 'ใช้งานปกติ'
    };
  });
  const { error } = await sb.from('staff_profiles').upsert(rows, { onConflict: 'id' });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('บันทึกผู้ใช้งานแล้ว');
}
async function saveNewStaff(form) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const fd = new FormData(form);
  const email = String(fd.get('email') || '').trim().toLowerCase();
  if (!requireMahidolEmail(email)) return showToast('ต้องใช้อีเมล @mahidol.ac.th');
  const row = {
    nickname: fd.get('nickname'),
    full_name: fd.get('full_name'),
    email,
    employee_code: fd.get('employee_code') || null,
    staff_color: fd.get('staff_color') || defaultStaffColor(fd.get('nickname')),
    staff_type: fd.get('staff_type') || null,
    position: fd.get('position') || null,
    role: fd.get('role') || 'staff',
    is_active: true,
    roster_enabled: true,
    daily_position_enabled: false,
    position_training_status: 'น้องใหม่ / ยังไม่จัดอัตโนมัติ'
  };
  const { error } = await sb.from('staff_profiles').insert(row);
  if (error) return showToast(error.message);
  form.reset();
  await loadAllData(); renderPage(); showToast('เพิ่มผู้ใช้งานใหม่แล้ว ส่งลิงก์ตั้งรหัสผ่านได้เลย');
}

async function savePositionEligibility() {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const checks = Array.from(document.querySelectorAll('[data-eligibility]'));
  const rowMap = new Map();
  checks.forEach(cb => {
    rowMap.set(`${cb.dataset.staffId}|${cb.dataset.positionCode}`, {
      staff_id: cb.dataset.staffId,
      position_code: cb.dataset.positionCode,
      is_eligible: cb.checked,
      updated_by: currentStaffId()
    });
  });
  const rows = Array.from(rowMap.values());
  if (!rows.length) return showToast('ไม่มีข้อมูลสิทธิ์ตำแหน่งให้บันทึก');
  const { error } = await sb.from('daily_position_eligibility').upsert(rows, { onConflict: 'staff_id,position_code' });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('บันทึกสิทธิ์ตำแหน่งรายวันแล้ว');
}
async function resetUserPassword(email) {
  if (!email) return showToast('ยังไม่มีอีเมลของผู้ใช้นี้');
  if (!confirm(`ส่งลิงก์ reset password ไปที่ ${email}?`)) return;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: authRedirectUrl('recovery') });
  if (error) return showToast(error.message);
  showToast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว');
}

function showTradeModal(assignmentId) {
  const slot = getAssignmentsForMonth(state.monthKey).find(a => a.id === assignmentId);
  if (!slot) return showToast('ไม่พบเวรนี้ กรุณารีเฟรชหน้า');
  const possibleReceiver = orderedStaff(state.staff.filter(s => isRosterEnabled(s) && s.id !== slot.staff_id));
  const myAmount = dutyMetrics(slot, slot.staff_id).pay;
  const otherDutyOptions = getAssignmentsForMonth(state.monthKey)
    .filter(a => a.staff_id && a.staff_id !== slot.staff_id)
    .map(a => `<option data-owner="${a.staff_id}" value="${a.id}">${staffNick(a.staff_id)} — ${formatThaiDate(a.duty_date)} ${DUTY_LABEL[a.duty_code] || a.duty_code} (${dutyMetrics(a).pay.toLocaleString()} บ.)</option>`)
    .join('');
  showModal(`<h2>ขอแลก/ขายเวร</h2><p class="hint">${formatThaiDate(slot.duty_date)} ${DUTY_LABEL[slot.duty_code] || slot.duty_code} • เจ้าของเวรเดิม ${staffPill(slot.staff_id)} • มูลค่าเวรเดิมประมาณ ${myAmount.toLocaleString()} บาท</p>
    <form id="dutyTradeForm" class="form-grid">
      <input type="hidden" name="from_assignment_id" value="${slot.id}">
      <label>ประเภท <select name="trade_type" id="tradeTypeSelect"><option>ขายเวร</option><option>แลกเวร</option></select></label>
      <label>คนที่จะรับ/คู่แลก <select name="receiver_id" id="tradeReceiverSelect" required><option value="">เลือกคน</option>${possibleReceiver.map(s => `<option value="${s.id}">${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select></label>
      <label class="wide trade-swap-only" id="tradeSwapWrap" style="display:none">กรณีแลกเวรเท่านั้น: เลือกเวรของคู่แลก <select name="to_assignment_id" id="tradeSwapSelect"><option value="">เลือกเวรของคู่แลก</option>${otherDutyOptions}</select><span class="hint">ถ้าเป็นขายเวร ไม่ต้องเลือกวันที่/เวรซ้ำ ระบบใช้เวรที่กดมาให้อัตโนมัติ</span></label>
      <label>คิดเรท <select name="rate_mode"><option value="mt">เรท MT</option><option value="kerk">เรทเคิก</option><option value="receiver">ตามเรทคนรับเวร</option><option value="owner">ตามเรทเจ้าของเวรเดิม</option><option value="custom">ตกลงกันเอง</option></select></label>
      <label>จำนวนเงินตกลงเอง (ถ้ามี) <input name="custom_amount" type="number" min="0" step="1" placeholder="ไม่บังคับ"></label>
      <label class="wide">หมายเหตุ <textarea name="note" placeholder="เช่น ขายเป็นเรทเคิก / แลกเวรกับเพื่อน / ตกลงกันแล้ว"></textarea></label>
      <button class="primary-btn wide" type="submit">ส่งคำขอให้อีกฝ่ายยืนยัน</button>
    </form>`);
  updateTradeSwapVisibility();
}
function updateTradeSwapVisibility() {
  const type = document.getElementById('tradeTypeSelect')?.value || '';
  const wrap = document.getElementById('tradeSwapWrap');
  if (!wrap) return;
  wrap.style.display = type === 'แลกเวร' ? '' : 'none';
  if (type !== 'แลกเวร') {
    const sel = document.getElementById('tradeSwapSelect');
    if (sel) sel.value = '';
  }
}
async function saveTradeRequest(form) {
  const fd = new FormData(form);
  const fromId = fd.get('from_assignment_id');
  const receiverId = fd.get('receiver_id');
  const from = getAssignmentsForMonth(state.monthKey).find(a => a.id === fromId);
  const to = fd.get('to_assignment_id') ? getAssignmentsForMonth(state.monthKey).find(a => a.id === fd.get('to_assignment_id')) : null;
  if (!from || !receiverId) return showToast('กรุณาเลือกผู้รับ/คู่แลกให้ครบ');
  if ((fd.get('trade_type') || '') === 'แลกเวร' && !fd.get('to_assignment_id')) return showToast('ถ้าเลือกแลกเวร กรุณาเลือกเวรของคู่แลกด้วย');
  const rateMode = fd.get('rate_mode') || 'receiver';
  const custom = Number(fd.get('custom_amount') || 0);
  const amountFrom = custom > 0 ? custom : tradeRateAmount(from, receiverId, rateMode);
  const amountTo = to ? dutyMetrics(to, from.staff_id).pay : 0;
  const row = {
    requester_id: currentStaffId(), receiver_id: receiverId, from_assignment_id: fromId, to_assignment_id: to?.id || null,
    trade_type: fd.get('trade_type') || 'ขายเวร', rate_mode: rateMode, amount_from: amountFrom, amount_to: amountTo, amount_diff: amountFrom - amountTo,
    status: 'pending', note: fd.get('note') || null, created_by: currentStaffId(), updated_by: currentStaffId()
  };
  const { error } = await sb.from('roster_trade_requests').insert(row);
  if (error) return showToast(friendlyDbError(error));
  closeModal(); await loadAllData(); renderPage(); showToast('ส่งคำขอแล้ว รออีกฝ่ายกดยืนยัน');
}
async function updateTradeStatus(id, status) {
  const { error } = await sb.from('roster_trade_requests').update({ status, updated_by: currentStaffId(), confirmed_at: status==='confirmed' ? new Date().toISOString() : null }).eq('id', id);
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast(status === 'confirmed' ? 'ยืนยันคำขอแล้ว รอ Admin บันทึกเปลี่ยนเวร' : 'ปฏิเสธคำขอแล้ว');
}
async function applyTradeRequest(id) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const r = state.tradeRequests.find(x => x.id === id);
  if (!r || r.status !== 'confirmed') return showToast('คำขอนี้ยังไม่พร้อมให้บันทึกเปลี่ยนเวร');
  const from = state.rosterAssignments.find(a => a.id === r.from_assignment_id);
  const to = r.to_assignment_id ? state.rosterAssignments.find(a => a.id === r.to_assignment_id) : null;
  if (!from) return showToast('ไม่พบเวรต้นทาง');
  const updates = [];
  updates.push(sb.from('roster_assignments').update({ staff_id: r.receiver_id, updated_by: currentStaffId() }).eq('id', from.id));
  if (to) updates.push(sb.from('roster_assignments').update({ staff_id: r.requester_id, updated_by: currentStaffId() }).eq('id', to.id));
  const results = await Promise.all(updates);
  const err = results.find(x => x.error)?.error;
  if (err) return showToast(friendlyDbError(err));
  const { error } = await sb.from('roster_trade_requests').update({ status: 'completed', updated_by: currentStaffId() }).eq('id', id);
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast('บันทึกเปลี่ยนเวรแล้ว');
}

function staffOptions(selected='') { return orderedStaff(state.staff.filter(s => s.is_active)).map(s => `<option value="${s.id}" ${selected===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join(''); }
function daysBetween(start, end) { const out=[]; const d=parseDate(start); const e=parseDate(end); while(d<=e){ out.push(toDateInput(d)); d.setDate(d.getDate()+1); } return out; }
function exportTable(tableId, filename) { const table = document.getElementById(tableId); if (!table) return showToast('ไม่พบตารางสำหรับ Export'); const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' }); XLSX.writeFile(wb, filename); }
function exportScheduleExcel() { exportTable('scheduleTable', `Roster_${state.monthKey}.xlsx`); }
function auditActionLabel(a) {
  const action = String(a.action || '').toUpperCase();
  const table = a.table_name || '';
  if (table === 'auth' && action === 'LOGIN') return 'เข้าสู่ระบบ';
  if (table === 'auth' && action === 'LOGOUT') return 'ออกจากระบบ';
  if (action === 'INSERT') return 'เพิ่มข้อมูล';
  if (action === 'UPDATE') return 'แก้ไขข้อมูล';
  if (action === 'DELETE') return 'ลบข้อมูล';
  return a.action || '-';
}
function auditBadge(a) {
  const action = String(a.action || '').toUpperCase();
  if (action === 'LOGIN') return 'green';
  if (action === 'LOGOUT') return 'black';
  if (action === 'INSERT') return 'blue';
  if (action === 'UPDATE') return 'orange';
  if (action === 'DELETE') return 'red';
  return 'black';
}
function tableLabel(table) {
  return ({
    auth: 'ระบบ Login', staff_profiles: 'ผู้ใช้งานและสิทธิ์', leave_requests: 'แจ้งลา/ไม่รับเวร', activity_events: 'กิจกรรมหน่วยงาน',
    hr_checks: 'ตรวจสอบ HR', roster_months: 'สถานะตารางเวร', roster_assignments: 'ตารางเวร', daily_positions: 'ตารางตำแหน่งรายวัน',
    attendance_logs: 'ลงชื่อเข้าเวร', ot_requests: 'OT', public_holidays: 'วันหยุดราชการ', monthly_incharges: 'อินชาร์จประจำเดือน', daily_position_eligibility: 'สิทธิ์ตำแหน่งรายวัน', daily_position_day_status: 'ประกาศตำแหน่งรายวัน', roster_trade_requests: 'คำขอแลก/ขายเวร'
  }[table] || table || '-');
}
function auditSummary(a) {
  const n = a.new_data || {}, o = a.old_data || {};
  if (a.table_name === 'auth') return `${auditActionLabel(a)} ${n.at ? 'เมื่อ ' + formatThaiDateTime(n.at) : ''}`;
  if (a.table_name === 'staff_profiles') return `${tableLabel(a.table_name)}: ${n.nickname || o.nickname || n.full_name || o.full_name || '-'}`;
  if (a.table_name === 'leave_requests') return `${tableLabel(a.table_name)}: ${staffNick(n.staff_id || o.staff_id)} ${n.type || o.type || ''} ${formatThaiDate(n.start_date || o.start_date)}-${formatThaiDate(n.end_date || o.end_date)}`;
  if (a.table_name === 'activity_events') return `${tableLabel(a.table_name)}: ${n.title || o.title || '-'}`;
  if (a.table_name === 'roster_assignments') return `${tableLabel(a.table_name)}: ${formatThaiDate(n.duty_date || o.duty_date)} ${DUTY_LABEL[n.duty_code || o.duty_code] || n.duty_code || o.duty_code || ''} → ${staffNick(n.staff_id || o.staff_id)}`;
  if (a.table_name === 'daily_positions') return `${tableLabel(a.table_name)}: ${formatThaiDate(n.work_date || o.work_date)} ${n.position_code || o.position_code || ''} → ${staffNick(n.staff_id || o.staff_id)}`;
  if (a.table_name === 'public_holidays') return `${tableLabel(a.table_name)}: ${formatThaiDate(n.holiday_date || o.holiday_date)} ${n.title || o.title || ''}`;
  if (a.table_name === 'daily_position_eligibility') return `${tableLabel(a.table_name)}: ${staffNick(n.staff_id || o.staff_id)} ${n.position_code || o.position_code || ''} = ${(n.is_eligible ?? o.is_eligible) ? 'เปิด' : 'ปิด'}`;
  if (a.table_name === 'daily_position_day_status') return `${tableLabel(a.table_name)}: ${formatThaiDate(n.work_date || o.work_date)} = ${n.status || o.status || '-'}`;
  if (a.table_name === 'roster_trade_requests') return `${tableLabel(a.table_name)}: ${staffNick(n.requester_id || o.requester_id)} → ${staffNick(n.receiver_id || o.receiver_id)} ${n.trade_type || o.trade_type || ''} = ${tradeStatusLabel(n.status || o.status)}`;
  return tableLabel(a.table_name);
}
function exportAuditExcel() {
  const data = getFilteredAuditLogs().map(a => ({ เวลา: a.created_at, ผู้ทำ: staffName(a.actor_id), เหตุการณ์: auditActionLabel(a), เมนู: tableLabel(a.table_name), รายละเอียด: auditSummary(a), record_id: a.record_id }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Audit'); XLSX.writeFile(wb, `Audit_${todayStr()}.xlsx`);
}
function showAuditDetail(id) {
  const a = state.auditLogs.find(x => x.id === id);
  if (!a) return;
  showModal(`<h2>รายละเอียดประวัติ</h2><p><b>${escapeHtml(auditActionLabel(a))}</b> • ${escapeHtml(tableLabel(a.table_name))} • ${formatThaiDateTime(a.created_at)}</p><p>${escapeHtml(auditSummary(a))}</p><details><summary>ข้อมูลเทคนิคสำหรับตรวจสอบย้อนหลัง</summary><div class="grid grid-2"><div><h3>ก่อนแก้ไข</h3><pre>${escapeHtml(JSON.stringify(a.old_data, null, 2))}</pre></div><div><h3>หลังแก้ไข</h3><pre>${escapeHtml(JSON.stringify(a.new_data, null, 2))}</pre></div></div></details>`);
}
