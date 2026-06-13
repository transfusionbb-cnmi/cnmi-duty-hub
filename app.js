/* CNMI Staff Planner V64 - v59 stable + profile/trade/GPS polish */
const CFG = window.CNMI_CONFIG || {};
window.__CNMI_CLEAN_COMPONENTS_IN_APP__ = true;
const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', title: 'ภาพรวมวันนี้', subtitle: 'สรุปภาพรวมทั้งหมดของวันนี้', group: 'staff' },
  { id: 'calendar', icon: '📅', title: 'Calendar กลาง', subtitle: 'รวมลา อบรม ประชุม ออกหน่วย วันหยุด และเวร', group: 'staff' },
  { id: 'leave', icon: '🌿', title: 'แจ้งลา / ไม่รับเวร', subtitle: 'บันทึก แก้ไข ยกเลิก และแนบไฟล์', group: 'staff' },
  { id: 'myProfile', icon: '👤', title: 'ข้อมูลส่วนตัว', subtitle: 'ดูข้อมูลและขอแก้ไขชื่อ/เบอร์โทร', group: 'staff' },
  { id: 'activities', icon: '🗂️', title: 'กิจกรรมหน่วยงาน', subtitle: 'ประชุม อบรม ออกหน่วย ตรวจมาตรฐาน ซ้อม CODE และอื่นๆ', group: 'staff' },
  { id: 'schedule', icon: '📋', title: 'ตารางเวรประจำเดือน', subtitle: 'ดูรายเดือน Export Excel / PDF / Print', group: 'staff' },
  { id: 'tradeRequests', icon: '🔁', title: 'คำขอแลก/ขาย/ยกเวร', subtitle: 'รอฉันยืนยัน / รอ Admin บันทึก', group: 'staff' },
  { id: 'positionMonthView', icon: '🗓️', title: 'ตารางตำแหน่งรายเดือน', subtitle: 'ดูแผนตำแหน่งรายเดือนที่ประกาศแล้ว', group: 'staff' },
  { id: 'positions', icon: '🧪', title: 'ตารางตำแหน่งรายวัน', subtitle: 'ดู/ปรับตำแหน่งประจำวันก่อนเริ่มงาน', group: 'staff' },
  { id: 'ot', icon: '⏱️', title: 'ลงชื่ออยู่เวร / ขอ OT เพิ่ม', subtitle: 'ยืนยันอยู่เวร ขอ OT เพิ่ม และสรุป OT', group: 'staff' },
  { id: 'audit', icon: '🕵️', title: 'Audit Log ล่าสุด', subtitle: 'ประวัติการใช้งานแบบอ่านง่าย กรองรายวันได้', group: 'staff' },
  { id: 'hr', icon: '🧾', title: 'ตรวจสอบ HR', subtitle: 'Admin ตรวจว่าแจ้งใน HR แล้วหรือยัง', group: 'admin' },
  { id: 'hrSummary', icon: '✅', title: 'สรุปตรวจสอบ HR แล้ว', subtitle: 'รายการที่ Admin ตรวจสอบ HR แล้ว ย้อนกลับมาดูได้', group: 'admin' },
  { id: 'scheduler', icon: '🧩', title: 'จัดตารางเวร', subtitle: 'สร้างร่าง Auto Assign และบันทึกตาราง', group: 'admin' },
  { id: 'positionMonth', icon: '🗓️', title: 'จัดตำแหน่งรายเดือน', subtitle: 'Admin วางแผนรายเดือนก่อนให้อินชาร์จปรับรายวัน', group: 'admin' },
  { id: 'profileRequests', icon: '📝', title: 'คำขอแก้ไขข้อมูลส่วนตัว', subtitle: 'Admin อนุมัติชื่อ/ชื่อเล่น/เบอร์โทร', group: 'admin' },
  { id: 'users', icon: '👥', title: 'ผู้ใช้งานและสิทธิ์', subtitle: 'เพิ่ม/แก้ไขเจ้าหน้าที่ เฉพาะ Admin', group: 'admin' },
  { id: 'eligibility', icon: '✅', title: 'สิทธิ์ตำแหน่งรายวัน', subtitle: 'กำหนดว่าแต่ละคนขึ้นตำแหน่งไหนได้', group: 'admin' }
];
const NAV_GROUPS = [
  { id: 'staff', title: 'เมนู Staff', hint: 'ใช้ประจำวัน', adminOnly: false },
  { id: 'admin', title: 'เมนู Admin', hint: 'ตั้งค่าและจัดการระบบ', adminOnly: true }
];

const LEAVE_TYPES = ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด','ไม่รับเวร','อื่นๆ'];
const ACTIVITY_TYPES = ['ประชุม','อบรม','ออกหน่วย','ตรวจมาตรฐาน','ซ้อม CODE','อื่นๆ'];
const ACTIVITY_LOCATIONS = ['ห้องบริจาคโลหิต','คลังเลือด','ห้องบริจาคโลหิต/คลังเลือด','ห้องประชุม 3D','ห้องประชุม ER'];
const OT_REASONS = ['เวรปั่นเลือดหลังเวลา (รอเทียบ LIS)','มาช่วยปั่นเลือด','มาช่วยจ่ายเลือด','มาช่วยออกหน่วย','อยู่ต่อเคลียร์งาน','มาช่วยงาน CQI','อื่นๆ'];
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
  profileChangeRequests: [],
  eligibilityStaffId: null,
  usersStaffId: null,
  auditDate: todayStr(),
  otApprovalMonthFilter: '',
  otApprovalStatusFilter: 'รออนุมัติ',
  otApprovalSearch: '',
  calendarDate: new Date(),
  calendarView: 'month',
  scheduleMobileView: 'day',
  tradeFilterStaff: '',
  hrFilterStaff: '',
  hrFilterMonth: '',
  hrSummaryFilterStaff: '',
  hrSummaryFilterMonth: '',
  monthKey: monthKey(new Date()),
  positionMonthKey: monthKey(new Date()),
  positionMonthViewKey: monthKey(new Date()),
  monthPositionDraft: null,
  rosterDraft: null,
  editingLeaveId: null,
  editingActivityId: null,
  busy: false
};


function isMobileView() { return window.matchMedia && window.matchMedia('(max-width: 820px)').matches; }
function niceRoleRateLabel(value) {
  return ({ mt:'เรท MT', kerk:'เรทเคิก', custom:'ตกลงกันเอง', receiver:'ตามเรทคนรับเวร', owner:'ตามเรทเจ้าของเวรเดิม' }[value] || value || '-');
}

function isSelfPaidTrade(r) {
  return r && String(r.rate_mode || '').toLowerCase() === 'custom';
}
function selfPaidDutyProxyOptions(date=todayStr()) {
  const me = currentStaffId();
  if (!me) return [];
  const rows = state.tradeRequests.filter(r => {
    if (!isSelfPaidTrade(r)) return false;
    if (r.receiver_id !== me) return false;
    if (!['confirmed','completed'].includes(r.status)) return false;
    const from = state.rosterAssignments.find(a => a.id === r.from_assignment_id);
    return from && from.duty_date === date && from.staff_id;
  });
  return rows.map(r => ({ request: r, assignment: state.rosterAssignments.find(a => a.id === r.from_assignment_id) })).filter(x => x.assignment);
}
function selfPaidTradeNotice() {
  return `<div class="notice soft-notice wide"><b>กรณีตกลงกันเอง / จ่ายกันเอง</b><br>ตารางเวรหลักและผู้มีสิทธิ์ OT ไม่เปลี่ยน ระบบบันทึกไว้ว่าใครมาทำแทนจริงเท่านั้น คนรับเวรสามารถกด “ยืนยันวันอยู่เวร” แบบลงชื่อแทนเจ้าของเวรเดิมได้</div>`;
}

function $(id) { return document.getElementById(id); }
function pad(n) { return String(n).padStart(2, '0'); }
function todayStr() { return toDateInput(new Date()); }
function toDateInput(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`; }
function monthKey(d) { return `${d.getFullYear()}-${pad(d.getMonth()+1)}`; }
function parseDate(s) { const [y,m,d] = String(s).split('-').map(Number); return new Date(y, (m||1)-1, d||1); }
function formatThaiDate(s) { if (!s) return '-'; const d = typeof s === 'string' ? parseDate(s.slice(0,10)) : s; return d.toLocaleDateString('th-TH', { day:'2-digit', month:'short', year:'numeric' }); }

function datesBetween(startDate, endDate) {
  const result = [];
  if (!startDate || !endDate) return result;
  const start = parseDate(String(startDate).slice(0, 10));
  const end = parseDate(String(endDate).slice(0, 10));
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return result;
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const cur = new Date(start);
  while (cur <= end) {
    result.push(toDateInput(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}
function formatThaiDateTime(s) { if (!s) return '-'; return new Date(s).toLocaleString('th-TH', { dateStyle:'medium', timeStyle:'short' }); }
function escapeHtml(v) { return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function asArray(v) { return Array.isArray(v) ? v : []; }
function currentStaffId() { return state.profile?.id || null; }
function isAdmin() { return state.profile?.role === 'admin'; }
function staffName(id) { const s = state.staff.find(x => x.id === id); return s ? `${s.nickname || s.full_name || ''}${s.nickname && s.full_name ? ` (${s.full_name})` : ''}` : '-'; }
function staffNick(id) { const s = state.staff.find(x => x.id === id); return s?.nickname || s?.full_name || '-'; }
function staffPhone(id) { const s = state.staff.find(x => x.id === id); return s?.phone || s?.contact_phone || ''; }
function defaultStaffColor(nick) { return DEFAULT_STAFF_COLORS[String(nick || '').trim()] || '#e8f3ff'; }
function staffColor(staffOrId) {
  const s = typeof staffOrId === 'object' ? staffOrId : state.staff.find(x => x.id === staffOrId);
  return s?.color || s?.staff_color || defaultStaffColor(s?.nickname || s?.full_name);
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

// Capture Supabase Auth redirect intent BEFORE Supabase reads/cleans the URL hash.
// V132: GitHub Pages may receive invite/recovery links with #access_token, ?code, or error_description.
// We detect the link at the first page, let Supabase restore the session, then clean the URL back to the app root.
const INITIAL_AUTH_URL = `${window.location.search || ''}${window.location.hash || ''}`;
function appBaseUrl() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (window.location.hostname.endsWith('github.io') && parts[0]) return `${window.location.origin}/${parts[0]}/`;
  if (window.location.pathname.includes('/cnmi-saff-planner/')) return `${window.location.origin}/cnmi-saff-planner/`;
  return `${window.location.origin}/`;
}
function getAuthRedirectInfo(raw = INITIAL_AUTH_URL) {
  const text = String(raw || `${window.location.search || ''}${window.location.hash || ''}`);

  // V133: parse query and hash separately. Supabase links can arrive as
  // ?code=..., #access_token=..., #type=recovery, or mixed forms after GitHub Pages 404 fallback.
  const searchParams = new URLSearchParams(window.location.search || '');
  const hashText = String(window.location.hash || '').replace(/^#/, '');
  const hashParams = new URLSearchParams(hashText);
  const rawParams = new URLSearchParams(text.replace(/^#/, '').replace(/^\?/, '').replace('#', '&'));

  const get = (k) => rawParams.get(k) || searchParams.get(k) || hashParams.get(k) || '';
  const type = get('type');
  const mode = get('mode');
  const hasToken = /(^|[?#&])(access_token|refresh_token|code|token_hash)=/i.test(text);
  const isRecovery = /^(recovery|password_recovery|invite)$/i.test(type)
    || /^(recovery|set-password|update-password)$/i.test(mode)
    || hasToken;
  const error = get('error') || get('error_code') || '';
  const errorDescription = get('error_description') || '';
  return { text, type, mode, hasToken, isRecovery, error, errorDescription, hasError: Boolean(error || errorDescription) };
}
const INITIAL_AUTH_INFO = getAuthRedirectInfo();

// V134: Force password setup mode as early as possible.
// Supabase email links may temporarily create a valid session (SIGNED_IN) before PASSWORD_RECOVERY fires.
// Without this flag, the normal auth guard can treat the session as a complete login and enter the app.
const PASSWORD_SETUP_FORCE_KEY = 'cnmi.forcePasswordSetup.v134';
function setPasswordSetupForced(reason='auth-link') {
  try { window.sessionStorage.setItem(PASSWORD_SETUP_FORCE_KEY, JSON.stringify({ reason, at: Date.now() })); } catch (_) {}
}
function clearPasswordSetupForced() {
  try { window.sessionStorage.removeItem(PASSWORD_SETUP_FORCE_KEY); } catch (_) {}
}
function isPasswordSetupForced() {
  try { return window.sessionStorage.getItem(PASSWORD_SETUP_FORCE_KEY) === '1' || !!window.sessionStorage.getItem(PASSWORD_SETUP_FORCE_KEY); } catch (_) { return false; }
}
if (INITIAL_AUTH_INFO.isRecovery && !INITIAL_AUTH_INFO.hasError) setPasswordSetupForced('initial-auth-url');

let RECOVERY_INTENT = (INITIAL_AUTH_INFO.isRecovery || isPasswordSetupForced()) && !INITIAL_AUTH_INFO.hasError;
// V133: True while Supabase is still converting the email-link hash/query into a session.
// Auth guard must not send the user to normal login during this window.
let AUTH_LINK_PROCESSING = RECOVERY_INTENT;
let AUTH_URL_CLEANED = false;
function cleanAuthUrl(keepRecoveryMode=false) {
  if (!window.history?.replaceState) return;
  const clean = keepRecoveryMode ? `${appBaseUrl()}?mode=recovery` : appBaseUrl();
  window.history.replaceState({}, document.title, clean);
}
async function handleInitialAuthRedirectOnce() {
  const info = getAuthRedirectInfo();
  if (!info.text) return true;

  if (info.hasError) {
    clearCachedAppSession();
    try { await sb?.auth?.signOut(); } catch (_) {}
    RECOVERY_INTENT = false;
    AUTH_LINK_PROCESSING = false;
    cleanAuthUrl(false);
    const msg = decodeURIComponent(String(info.errorDescription || info.error || 'ลิงก์เข้าสู่ระบบหมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ใหม่อีกครั้ง').replace(/\+/g, ' '));
    showLoginPanel();
    showToast(msg.includes('expired') ? 'ลิงก์หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง' : msg, { tone:'error' });
    return false;
  }

  if (info.isRecovery || info.hasToken) {
    setPasswordSetupForced('auth-link-detected');
    RECOVERY_INTENT = true;
    AUTH_LINK_PROCESSING = true;
    // V133 IMPORTANT: do NOT clean URL here. Supabase must read #access_token / ?code first.
    // The URL is cleaned only after getSession/onAuthStateChange has had time to restore the session.
    if (typeof showResetPasswordPanel === 'function') showResetPasswordPanel();
  }
  return true;
}

async function waitForAuthLinkSession(maxMs = 3500) {
  const started = Date.now();
  const waits = [0, 150, 300, 500, 800, 1200, 1600, 2200, 3000];
  let last = null;
  for (const ms of waits) {
    if (Date.now() - started > maxMs) break;
    if (ms) await new Promise(resolve => setTimeout(resolve, ms));
    try {
      const res = await sb.auth.getSession();
      last = res.data;
      if (res.data?.session) return res.data;
    } catch (_) {}
  }
  return last || { session: null };
}

function finishAuthLinkUrlCleanup() {
  if (!RECOVERY_INTENT || AUTH_URL_CLEANED) return;
  AUTH_URL_CLEANED = true;
  cleanAuthUrl(true);
}

// V39: keep login stable after refresh / mobile sleep.
// Supabase already persists its own token, but this app-level cache prevents a temporary
// profile lookup hiccup from forcing a logout and gives us a safe profile fallback.
const APP_SESSION_CACHE_KEY = 'cnmiDutyAppSession.v39';
const APP_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
function safeStorage() {
  try {
    const k = '__cnmi_storage_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return window.localStorage;
  } catch (_) {
    return null;
  }
}
function cacheAppSession() {
  const storage = safeStorage();
  if (!storage || !state.session?.user || !state.profile) return;
  const payload = {
    saved_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + APP_SESSION_TTL_MS).toISOString(),
    user_id: state.session.user.id,
    email: state.session.user.email || state.profile.email || '',
    profile: state.profile
  };
  try { storage.setItem(APP_SESSION_CACHE_KEY, JSON.stringify(payload)); } catch (_) {}
}
function readCachedAppSession(user) {
  const storage = safeStorage();
  if (!storage || !user?.id) return null;
  try {
    const raw = storage.getItem(APP_SESSION_CACHE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw);
    if (!payload?.expires_at || new Date(payload.expires_at).getTime() < Date.now()) {
      storage.removeItem(APP_SESSION_CACHE_KEY);
      return null;
    }
    if (payload.user_id !== user.id) return null;
    return payload;
  } catch (_) {
    return null;
  }
}
function clearCachedAppSession() {
  const storage = safeStorage();
  try { storage?.removeItem(APP_SESSION_CACHE_KEY); } catch (_) {}
}

function authRedirectUrl(mode='') {
  // V132: Always redirect Supabase Auth links back to the GitHub Pages app root.
  // This avoids /update-password/ or other deep paths becoming 404 on GitHub Pages.
  const base = appBaseUrl();
  return mode ? `${base}?mode=${encodeURIComponent(mode)}` : base;
}

function showToast(msg, opts={}) {
  // V51: ใช้ Pop-up กลางจอแทน toast ล่างจอ เพื่อให้ผู้ใช้งานรู้ชัดว่าระบบบันทึก/แจ้งผลแล้ว
  const text = String(msg || 'ดำเนินการเรียบร้อย');
  const tone = opts.tone || (/(ไม่สำเร็จ|ผิดพลาด|error|กรุณา|ไม่ได้|ไม่พบ|สิทธิ์ไม่พอ|ล้มเหลว)/i.test(text) ? 'error' : 'success');
  const title = opts.title || (tone === 'error' ? 'แจ้งเตือน' : 'สำเร็จ');
  showModal(`
    <div class="app-alert ${tone}">
      <div class="app-alert-icon">${tone === 'error' ? '!' : '✓'}</div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
      <div class="confirm-actions"><button class="primary-btn" data-app-alert-ok>ตกลง</button></div>
    </div>
  `, { small:true });
}
function friendlyDbError(error) {
  const msg = String(error?.message || error || '');
  if (msg.includes('null value') && msg.includes('roster_assignments') && msg.includes('id')) return 'บันทึกตารางเวรไม่สำเร็จ เพราะระบบกำลังส่งรหัสรายการเวรว่างอยู่ กรุณารีเฟรชหน้าแล้วกดสร้างร่าง/บันทึกใหม่อีกครั้ง';
  if (msg.includes('violates not-null constraint')) return 'บันทึกไม่สำเร็จ เพราะมีข้อมูลจำเป็นบางช่องว่างอยู่ กรุณาตรวจช่องที่ยังไม่ได้เลือก';
  if (msg.includes('duplicate key')) return 'บันทึกซ้ำกับข้อมูลเดิม กรุณารีเฟรชแล้วลองใหม่';
  if (msg.includes('roster_trade_requests_rate_mode_check') || msg.includes('rate_mode_check') || msg.includes('roster_trade_requests_t_mode_check') || msg.includes('trade_type_check')) return 'ยังส่งคำขอแลก/ขาย/ยกเวรไม่ได้ เพราะฐานข้อมูลยังไม่รองรับรูปแบบคำขอ/เรทที่เลือก กรุณา Run SQL Patch V40 ก่อน';
  if (msg.includes('row-level security')) return 'สิทธิ์ไม่พอสำหรับบันทึกข้อมูลนี้ กรุณาใช้บัญชี Admin หรืออินชาร์จที่ได้รับสิทธิ์';
  if (msg.includes('admin_upsert_leave_v32') || msg.includes('admin_upsert_leave_v31') || msg.includes('function public.admin_upsert_leave_v32') || msg.includes('function public.admin_upsert_leave_v31')) return 'ยังบันทึกลาแทนไม่ได้ เพราะยังไม่ได้ Run SQL Patch V32 ใน Supabase';
  if (msg.includes('admin_save_leave') || msg.includes('function public.admin_save_leave') || msg.includes('Could not find the function')) return 'ยังบันทึกลาแทนไม่ได้ เพราะยังไม่ได้ Run SQL Patch V32 ใน Supabase';
  if (msg.includes('admin_record_reason') || msg.includes('recorded_by_admin')) return 'ยังบันทึกลาแทนไม่ได้ เพราะฐานข้อมูลยังไม่มีช่องสำหรับ Admin บันทึกแทน กรุณา Run SQL Patch V32';
  return msg || 'เกิดข้อผิดพลาดขณะบันทึกข้อมูล';
}
function setBusy(on, msg='กำลังโหลด') {
  state.busy = on;
  const sync = $('syncStatus');
  if (sync) sync.textContent = on ? msg : 'พร้อมใช้งาน';
}
function showModal(html, opts={}) {
  const modal = $('modal');
  const body = $('modalBody');
  body.innerHTML = html;
  modal.classList.toggle('modal-sm', !!opts.small);
  modal.classList.toggle('modal-lg', !!opts.large);
  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
  requestAnimationFrame(() => {
    const card = modal.querySelector('.modal-card');
    if (card) card.scrollTop = 0;
  });
}
function closeModal() { $('modal').classList.add('hidden'); $('modal').classList.remove('modal-sm','modal-lg'); $('modalBody').innerHTML = ''; document.body.classList.remove('modal-open'); }
function confirmDialog(message, title='ยืนยันการทำรายการ') {
  return new Promise(resolve => {
    showModal(`<div class="confirm-box app-confirm"><div class="app-alert-icon warn">?</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><div class="confirm-actions"><button class="ghost-btn" data-confirm-no>ยกเลิก</button><button class="primary-btn" data-confirm-yes>ตกลง</button></div></div>`, { small:true });
    const modal = $('modal');
    const cleanup = (answer) => { modal.removeEventListener('click', onClick); closeModal(); resolve(answer); };
    const onClick = (e) => {
      if (e.target.closest('[data-confirm-yes]')) cleanup(true);
      if (e.target.closest('[data-confirm-no]') || e.target.id === 'modalClose') cleanup(false);
    };
    modal.addEventListener('click', onClick);
  });
}
function promptDialog(message, title='กรอกข้อมูลเพิ่มเติม', defaultValue='') {
  return new Promise(resolve => {
    showModal(`<div class="confirm-box app-confirm"><h2>${escapeHtml(title)}</h2><p>${escapeHtml(message)}</p><textarea id="promptDialogInput" class="dialog-textarea" placeholder="ถ้ามี">${escapeHtml(defaultValue || '')}</textarea><div class="confirm-actions"><button class="ghost-btn" data-prompt-cancel>ยกเลิก</button><button class="primary-btn" data-prompt-ok>บันทึก</button></div></div>`, { small:true });
    const modal = $('modal');
    const input = $('promptDialogInput');
    setTimeout(() => input?.focus(), 50);
    const cleanup = (value) => { modal.removeEventListener('click', onClick); closeModal(); resolve(value); };
    const onClick = (e) => {
      if (e.target.closest('[data-prompt-ok]')) cleanup(input?.value || '');
      if (e.target.closest('[data-prompt-cancel]') || e.target.id === 'modalClose') cleanup(null);
    };
    modal.addEventListener('click', onClick);
  });
}
function configReady() {
  return CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && !CFG.SUPABASE_URL.includes('YOUR_PROJECT_REF') && !CFG.SUPABASE_ANON_KEY.includes('YOUR_SUPABASE');
}
function requireMahidolEmail(email) {
  const domain = CFG.ALLOWED_DOMAIN || 'mahidol.ac.th';
  return String(email || '').toLowerCase().endsWith('@' + domain.toLowerCase());
}

async function resolveLoginIdentifier(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');

  // ถ้ากรอกเป็นอีเมล ให้ใช้ Login ได้ทันที แต่ยังบังคับโดเมน Mahidol
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    if (!requireMahidolEmail(email)) throw new Error('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    return email;
  }

  // ถ้ากรอกเป็นชื่อผู้ใช้สั้น ๆ ให้ไปหา email จริงจาก staff_profiles
  const username = raw.toLowerCase();
  if (!/^[a-zA-Z0-9._-]{2,30}$/.test(username)) {
    throw new Error('ชื่อผู้ใช้ควรเป็นอังกฤษ/ตัวเลข 2–30 ตัว หรือใช้อีเมล Mahidol');
  }

  const { data, error } = await sb
    .from('staff_profiles')
    .select('email, login_name, is_active')
    .ilike('login_name', username)
    .maybeSingle();

  if (error) throw new Error(error.message || 'ค้นหาชื่อผู้ใช้ไม่สำเร็จ');
  if (!data || !data.email) throw new Error('ไม่พบชื่อผู้ใช้นี้ กรุณาตรวจสอบกับ Admin');
  if (data.is_active === false) throw new Error('บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อ Admin');
  if (!requireMahidolEmail(data.email)) throw new Error('บัญชีนี้ไม่ได้ใช้อีเมล Mahidol กรุณาติดต่อ Admin');
  return String(data.email).toLowerCase();
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

  // V133: Early Hash Check. This runs before any route guard / enterApp decision.
  const recoveryAtPageOpen = RECOVERY_INTENT || getAuthRedirectInfo().isRecovery;

  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      flowType: 'implicit'
    }
  });

  const continueInit = await handleInitialAuthRedirectOnce();
  if (!continueInit) { setBusy(false); return; }

  sb.auth.onAuthStateChange(async (event, session) => {
    state.session = session;

    // V134: Auth email links often emit SIGNED_IN first. During forced password setup,
    // never allow normal enterApp/login routing until the user actually saves a new password.
    if (isPasswordSetupForced() && event !== 'SIGNED_OUT') {
      RECOVERY_INTENT = true;
      AUTH_LINK_PROCESSING = false;
      showResetPasswordPanel();
      finishAuthLinkUrlCleanup();
      setBusy(false);
      return;
    }

    if (event === 'SIGNED_OUT') {
      if (AUTH_LINK_PROCESSING || RECOVERY_INTENT) {
        // Do not let a transient SIGNED_OUT during email-link parsing kick the user back to login.
        showResetPasswordPanel();
        setBusy(false);
        return;
      }
      RECOVERY_INTENT = false;
      exitApp();
      setBusy(false);
      return;
    }

    if (event === 'PASSWORD_RECOVERY' || RECOVERY_INTENT || recoveryAtPageOpen || isPasswordRecoveryUrl()) {
      RECOVERY_INTENT = true;
      AUTH_LINK_PROCESSING = false;
      showResetPasswordPanel();
      finishAuthLinkUrlCleanup();
      setBusy(false);
      return;
    }

    if (session?.user) await enterApp();
  });

  let data = null;
  if (recoveryAtPageOpen || RECOVERY_INTENT || isPasswordRecoveryUrl() || isPasswordSetupForced()) {
    setPasswordSetupForced('init-recovery-branch');
    RECOVERY_INTENT = true;
    AUTH_LINK_PROCESSING = true;
    showResetPasswordPanel();
    data = await waitForAuthLinkSession();
    state.session = data?.session || null;
    AUTH_LINK_PROCESSING = false;
    finishAuthLinkUrlCleanup();
    showResetPasswordPanel();
    setBusy(false);
    return;
  }

  let sessionRes = await sb.auth.getSession();
  data = sessionRes.data;
  if (!data?.session) {
    for (const waitMs of [200, 500, 900, 1300]) {
      await new Promise(resolve => setTimeout(resolve, waitMs));
      const retry = await sb.auth.getSession();
      if (retry.data?.session) { data = retry.data; break; }
    }
  }
  state.session = data.session;

  if (state.session?.user) await enterApp();
}

document.addEventListener('DOMContentLoaded', init);

function bindGlobalEvents() {
  $('modalClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('mobileMenuBtn').addEventListener('click', () => { $('sidebar').classList.toggle('open'); document.body.classList.toggle('sidebar-open', $('sidebar').classList.contains('open')); });
  document.addEventListener('click', e => {
    if (window.innerWidth > 820) return;
    const sidebar = $('sidebar');
    const btn = $('mobileMenuBtn');
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  });
  $('reloadBtn').addEventListener('click', async () => { await loadAllData(); renderPage(); });
  $('logoutBtn').addEventListener('click', async () => {
    if (sb) {
      await logAuth('LOGOUT');
      sessionStorage.removeItem('cnmi_login_audit_' + (state.session?.user?.id || ''));
      clearCachedAppSession();
      await sb.auth.signOut();
    }
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const loginId = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    setBusy(true, 'กำลังเข้าสู่ระบบ');
    let email = '';
    try {
      email = await resolveLoginIdentifier(loginId);
    } catch (err) {
      setBusy(false);
      return showToast(err.message || 'ไม่พบชื่อผู้ใช้');
    }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('invalid login credentials')) {
        return showToast('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน');
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
    const loginName = String($('recoveryLoginName')?.value || '').trim();
    const password = $('newPassword').value;
    if (!loginName) return showToast('กรุณาตั้งชื่อผู้ใช้');
    if (!/^[a-zA-Z0-9._-]+$/.test(loginName)) return showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
    if (!password) return showToast('กรุณากรอกรหัสผ่านใหม่');

    const { data: beforeUpdate } = await sb.auth.getSession();
    const recoveryEmail = beforeUpdate?.session?.user?.email || state.session?.user?.email || '';
    if (!recoveryEmail) return showToast('ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง');

    setBusy(true, 'กำลังบันทึกชื่อผู้ใช้และรหัสผ่าน');
    try {
      const r = await sb.rpc('set_initial_login_name_v44', { p_email: recoveryEmail, p_login_name: loginName });
      if (r.error) throw r.error;
      // Consume recovery mode before updateUser emits USER_UPDATED, otherwise this tab may keep showing the reset form.
      RECOVERY_INTENT = false;
      cleanAuthUrl(false);
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      clearPasswordSetupForced();
      RECOVERY_INTENT = false;
      AUTH_LINK_PROCESSING = false;
      $('resetPasswordForm').classList.add('hidden');
      const { data } = await sb.auth.getSession();
      state.session = data.session;
      showToast('บันทึกชื่อผู้ใช้และรหัสผ่านแล้ว');
      await enterApp();
    } catch (err) {
      setPasswordSetupForced('password-update-failed');
      RECOVERY_INTENT = true;
      showToast(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
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
  if ($('recoveryLoginName')) $('recoveryLoginName').value = '';
  if ($('newPassword')) $('newPassword').value = '';
}

async function enterApp() {
  // V134 failsafe: if this tab came from an invite/reset link, do not enter the app
  // until the resetPasswordForm submits successfully.
  if (isPasswordSetupForced() || RECOVERY_INTENT || isPasswordRecoveryUrl()) {
    showResetPasswordPanel();
    setBusy(false);
    return;
  }
  setBusy(true, 'กำลังโหลดข้อมูล');
  try {
    await loadProfile();
  } catch (err) {
    console.warn('loadProfile failed, trying cached session', err);
    const cached = readCachedAppSession(state.session?.user);
    if (cached?.profile) state.profile = cached.profile;
    else {
      showToast('โหลดข้อมูลผู้ใช้ไม่สำเร็จ แต่ระบบยังไม่ออกจากบัญชีให้เอง กรุณากดรีเฟรชอีกครั้ง');
      setBusy(false);
      return;
    }
  }

  if (state.profile && state.profile.is_active === false) {
    clearCachedAppSession();
    await sb.auth.signOut();
    showToast('บัญชีนี้ถูกปิดใช้งาน กรุณาให้ Admin ตรวจผู้ใช้งานและสิทธิ์');
    setBusy(false);
    return;
  }
  if (!state.profile) {
    const cached = readCachedAppSession(state.session?.user);
    if (cached?.profile) state.profile = cached.profile;
  }
  if (!state.profile) {
    showToast('ไม่พบข้อมูลผู้ใช้ในระบบ กรุณาให้ Admin ตรวจผู้ใช้งานและสิทธิ์');
    setBusy(false);
    return;
  }

  cacheAppSession();
  $('authView').classList.add('hidden');
  $('appView').classList.remove('hidden');
  renderNav();
  try {
    await loadAllData();
  } catch (err) {
    console.warn('loadAllData failed after session restore', err);
    showToast('โหลดข้อมูลบางส่วนไม่สำเร็จ กรุณากดรีเฟรชอีกครั้ง');
  }
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
  let { data, error } = await sb.from('staff_profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error(error.message);

  // Some older staff rows were linked by email before user_id was filled.
  // Do not sign out on refresh just because user_id lookup misses once.
  if (!data && user.email) {
    const byEmail = await sb.from('staff_profiles').select('*').ilike('email', user.email).maybeSingle();
    if (byEmail.error) throw new Error(byEmail.error.message);
    data = byEmail.data;
  }

  // V132: older staff rows may have user_id = NULL. Link by authenticated email via SECURITY DEFINER RPC.
  if (data && !data.user_id && user.email) {
    try {
      const linked = await sb.rpc('link_my_staff_profile_v132');
      if (!linked.error && linked.data) data = linked.data;
      else {
        const retry = await sb.from('staff_profiles').select('*').eq('user_id', user.id).maybeSingle();
        if (!retry.error && retry.data) data = retry.data;
      }
    } catch (err) {
      console.warn('link_my_staff_profile_v132 failed', err);
    }
  }

  state.profile = data;
  if (state.profile) cacheAppSession();
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
  await loadProfileChangeRequests();
}

async function loadProfileChangeRequests() {
  const staffId = currentStaffId();
  const email = state.profile?.email || state.session?.user?.email || null;
  const userId = state.session?.user?.id || null;
  const rows = [];
  const seen = new Set();
  const addRows = (arr) => (arr || []).forEach(r => {
    if (!r) return;
    const key = r.id || `${r.staff_id || ''}|${r.requested_by || ''}|${r.field_name || ''}|${r.new_value || ''}|${r.created_at || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(r);
  });

  // V52: ใช้ RPC ใหม่ก่อน แล้วค่อย fallback รุ่นเก่า/direct query
  // สาเหตุที่แก้: บางฐานมีข้อมูลใน profile_change_requests แล้ว แต่หน้าเว็บไม่แสดง เพราะ RLS/RPC รุ่นเก่าคืนค่าว่าง
  const attempts = [
    () => sb.rpc('list_profile_change_requests_v52', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v51', { p_staff_id: staffId, p_user_email: email, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v50', { p_staff_id: staffId, p_user_email: email, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v49', { p_staff_id: staffId, p_user_email: email, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v47', { p_staff_id: staffId, p_is_admin: isAdmin() }),
    () => isAdmin()
      ? sb.from('profile_change_requests').select('*').order('created_at', { ascending:false })
      : sb.from('profile_change_requests').select('*').or(`staff_id.eq.${staffId},requested_by.eq.${staffId}`).order('created_at', { ascending:false })
  ];

  for (const fn of attempts) {
    try {
      const res = await fn();
      if (res?.error) {
        console.warn('profile change request load skipped:', res.error.message || res.error);
        continue;
      }
      addRows(res.data || []);
      if ((res.data || []).length) break;
    } catch (err) {
      console.warn('profile change request load attempt failed', err);
    }
  }

  rows.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  state.profileChangeRequests = isAdmin() ? rows : rows.filter(r => String(r.staff_id) === String(staffId) || String(r.requested_by) === String(staffId));
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
    myProfile: renderMyProfilePage,
    activities: renderActivitiesPage,
    hr: renderHrPage,
    hrSummary: renderHrSummaryPage,
    scheduler: renderSchedulerPage,
    schedule: renderMonthlySchedulePage,
    tradeRequests: renderTradeRequestsPage,
    positions: renderPositionsPage,
    ot: renderOtPage,
    audit: renderAuditPage,
    profileRequests: renderProfileRequestsPage,
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

function normalizeDateKey(value) {
  if (!value) return '';
  if (typeof value === 'string') {
    const text = value.trim();
    const iso = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
    const th = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (th) return `${th[3]}-${pad(th[2])}-${pad(th[1])}`;
  }
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return toDateInput(d);
}
function holidayDateKey(row) {
  if (!row) return '';
  if (typeof row === 'string' || row instanceof Date) return normalizeDateKey(row);
  return normalizeDateKey(row.holiday_date || row.date || row.work_date || row.day || row.start_date);
}
function holidayRows() { return Array.isArray(state.holidays) ? state.holidays : []; }
function holidayKeySet() {
  return new Set(holidayRows().map(holidayDateKey).filter(Boolean));
}
function isHolidayDate(date) {
  const key = normalizeDateKey(date);
  return !!key && holidayKeySet().has(key);
}
function holidayName(date) {
  const key = normalizeDateKey(date);
  const row = holidayRows().find(h => holidayDateKey(h) === key);
  if (!row || typeof row === 'string') return row || 'วันหยุดราชการ';
  return String(row.title || row.name || row.holiday_name || 'วันหยุดราชการ').split(':::')[0].trim();
}
function activeLeaveRecordOn(staffId, date) {
  const key = normalizeDateKey(date);
  return state.leaves.find(l => {
    if (String(l?.staff_id) !== String(staffId)) return false;
    const status = String(l?.status || l?.approval_status || 'active').toLowerCase();
    if (/(cancel|reject|delete|ยกเลิก|ไม่อนุมัติ)/i.test(status)) return false;
    return overlapsDate(l, key);
  }) || null;
}
function isActiveLeaveOn(staffId, date) {
  return !!activeLeaveRecordOn(staffId, date);
}
function isNoDutyLeaveType(type) {
  return String(type || '').trim() === 'ไม่รับเวร';
}
function leaveDisplayType(l) {
  return String(l?.type || l?.leave_type || l?.reason_type || 'ลาอื่นๆ').split(':::')[0].trim();
}
function leaveCellClass(type) {
  const t = leaveDisplayType({ type });
  if (t === 'ลากิจ') return 'leave-personal';
  if (t === 'ลาป่วย') return 'leave-sick';
  if (t === 'ลาพักผ่อน' || t === 'ลาพักร้อน') return 'leave-vacation';
  if (t === 'ไม่รับเวร') return 'leave-no-duty';
  return 'leave-other';
}
function leaveCellBadge(l) {
  if (!l) return '';
  const t = leaveDisplayType(l);
  return `<span class="mini-status ${leaveCellClass(t)}">${escapeHtml(t)}</span>`;
}
function isActiveStaff(s) {
  if (!s) return false;
  if (Object.prototype.hasOwnProperty.call(s, 'active')) return s.active === true || String(s.active).toLowerCase() === 'true';
  return s.is_active === true || String(s.is_active).toLowerCase() === 'true';
}
function isRosterStatusEnabled(s) {
  if (!s) return false;
  const v = s.roster_enabled ?? s.duty_enabled ?? s.can_roster ?? s.is_roster_enabled ?? s['สถานะจัดเวร'];
  return v === true || String(v).toLowerCase() === 'true';
}
function isActiveRosterStaff(s) {
  return isActiveStaff(s) && isRosterStatusEnabled(s) && s?.staff_type !== 'แพทย์' && !s?.maternity_status;
}
function isLongTermLeaveStaff(s) {
  if (!s) return false;
  const target = s.targetShifts ?? s.target_shifts ?? s.target_shift_count;
  return s.is_long_term_leave === true || String(s.is_long_term_leave).toLowerCase() === 'true' || Number(target) === 0;
}
function activeRosterStaffIds() {
  return new Set((state.staff || []).filter(isActiveRosterStaff).map(s => String(s.id)));
}
function assignmentBelongsToActiveStaff(a) {
  return !a?.staff_id || activeRosterStaffIds().has(String(a.staff_id));
}
function isDailyPositionEnabled(s) { return s?.daily_position_enabled !== false && isActiveStaff(s) && s?.staff_type !== 'แพทย์' && !s?.maternity_status && s?.position_training_status !== 'งดจัดชั่วคราว' && s?.position_training_status !== 'น้องใหม่ / ยังไม่จัดอัตโนมัติ'; }
function isRosterEnabled(s) { return isActiveRosterStaff(s); }
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
  if (['ช3A','ช3B'].includes(dutyCode)) return 8; // อีก 4 ชม. ต้องรอเทียบ LIS ก่อน ไม่คิดอัตโนมัติ
  if (['ช4A','ช4B'].includes(dutyCode)) return 0; // ช4 ต้องยืนยันเวลาจริงและเทียบ LIS ก่อนคิด OT
  if (['ชบด1','ชบด2','ชบด3'].includes(dutyCode)) return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
  return (isWeekend(date) || isHolidayDate(date)) ? 24 : 16;
}
function dutyUnitsForCode(date, dutyCode='') {
  const h = dutyHoursForCode(date, dutyCode);
  if (['ช3A','ช3B'].includes(dutyCode)) return 1;
  if (['ช4A','ช4B'].includes(dutyCode)) return 0;
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

function dashboardDutySortOrder(date) {
  // หน้า “ภาพรวมวันนี้”: เรียงให้คนหน้างานอ่านตามลำดับเวรจริง
  // วันธรรมดาแสดงกลุ่ม ชบด1/2/3 แล้วตามด้วย ช4/ช4
  // วันเสาร์-อาทิตย์/วันหยุด ถ้ามีเวรพิเศษ ให้เรียง ช3A, ช3B, ช9, ช9 ต่อท้าย
  if (!isWeekend(date) && !isHolidayDate(date)) {
    return ['ชบด1', 'ชบด2', 'ชบด3', 'ช4A', 'ช4B', 'ช3A', 'ช3B', 'ช9-เคิก', 'ช9-MT'];
  }
  return ['ชบด1', 'ชบด2', 'ชบด3', 'ช3A', 'ช3B', 'ช9-เคิก', 'ช9-MT', 'ช4A', 'ช4B'];
}
function sortDashboardDuties(rows, date) {
  const order = dashboardDutySortOrder(date);
  return [...rows].sort((a, b) => {
    const ai = order.indexOf(a.duty_code);
    const bi = order.indexOf(b.duty_code);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
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
  const todayDuties = sortDashboardDuties(state.rosterAssignments.filter(x => x.duty_date === d), d);
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
function leaveReasonText(l) {
  return String(l?.note || l?.admin_record_reason || '').trim();
}
function calendarEventDetail(e) {
  if (e.type === 'activity' || ['training','meeting','outing','standard','code'].includes(e.type)) {
    const a = e.raw || {};
    const participants = asArray(a.participant_ids).map(id => staffNick(id)).filter(Boolean).join(', ');
    return `${a.note ? `<br><span class="muted">${escapeHtml(a.note)}</span>` : ''}${participants ? `<br><span class="muted">ผู้เข้าร่วม: ${escapeHtml(participants)}</span>` : ''}`;
  }
  const reason = e.reason || (e.raw && (e.raw.note || e.raw.admin_record_reason)) || '';
  return reason ? `<br><span class="muted">เหตุผล: ${escapeHtml(reason)}</span>` : '';
}
function calendarEventColor(e) {
  if (e.type === 'duty') return staffColor(e.raw?.staff_id);
  const map = {
    'leave-vacation':'#dff7ce', 'leave-personal':'#eadbff', 'leave-sick':'#fff3bd', 'leave-other':'#dff0ff', noduty:'#e8edf3',
    training:'#dff0ff', meeting:'#ffe7bd', outing:'#ffd3d8', standard:'#eadbff', code:'#fff3bd', holiday:'#fff3bd', activity:'#edf2f7'
  };
  return map[e.type] || '#edf2f7';
}
function renderCalendarModalRow(e) {
  const bg = calendarEventColor(e);
  const fg = textColorFor(bg);
  const isActivity = ['activity','training','meeting','outing','standard','code'].includes(e.type);
  const isDuty = e.type === 'duty';
  const label = isDuty ? (DUTY_LABEL[e.raw?.duty_code] || e.raw?.duty_code || '') : isActivity ? (e.raw?.event_type || eventText(e.type)) : eventText(e.type);
  const title = isDuty ? `${DUTY_LABEL[e.raw?.duty_code] || e.raw?.duty_code || ''}: ${staffNick(e.raw?.staff_id)}` : e.title;
  return `<div class="calendar-modal-row" style="--event-bg:${bg};--event-fg:${fg}"><div class="event-title"><b>${escapeHtml(title)}</b>${e.hrChecked ? '<span class="badge green hr-checked-badge">✓ ตรวจสอบ HR แล้ว</span>' : ''}</div>${calendarEventDetail(e)}<div><span class="badge event-color-badge" style="background:${bg};color:${fg}">${escapeHtml(label)}</span></div></div>`;
}
function collectCalendarEvents() {
  const events = [];
  state.leaves.filter(x => x.status !== 'cancelled').forEach(l => {
    const days = daysBetween(l.start_date, l.end_date);
    const hrChecked = isLeaveHrChecked(l.id);
    days.forEach(date => {
      const lt = l.type === 'ลาพักร้อน' ? 'leave-vacation' : l.type === 'ลากิจ' ? 'leave-personal' : (l.type === 'ลาป่วย' || l.type === 'ลาคลอด') ? 'leave-sick' : l.type === 'ไม่รับเวร' ? 'noduty' : 'leave-other';
      const reason = leaveReasonText(l);
      const reasonSuffix = reason ? ` — ${reason}` : '';
      events.push({ date, type: lt, title: `${l.type}: ${staffNick(l.staff_id)}${reasonSuffix}${hrChecked ? ' ✓ ตรวจ HR แล้ว' : ''}`, raw: l, hrChecked, reason });
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
  if (window.innerWidth <= 820) return renderCalendarMobileMonth(events, d);
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
function renderCalendarMobileMonth(events, monthDate) {
  const y = monthDate.getFullYear();
  const m = monthDate.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  const all = !!state.mobileCalendarAll;
  const rows = [];
  for (let day=1; day<=last; day++) {
    const ds = `${y}-${pad(m)}-${pad(day)}`;
    const evs = events.filter(e => e.date === ds);
    if (!all && !evs.length && ds !== todayStr()) continue;
    rows.push(`<div class="mobile-day-card ${ds===todayStr()?'today':''}" data-day-detail="${ds}">
      <div class="mobile-day-head"><b>${day}</b><span>${parseDate(ds).toLocaleDateString('th-TH', { weekday:'short' })}</span><button class="tiny-btn" data-day-detail="${ds}">ดู</button></div>
      ${evs.length ? evs.slice(0,6).map(e => `<button class="event-pill event-${e.type}" data-day-detail="${ds}">${escapeHtml(e.title)}</button>`).join('') : '<span class="hint">ไม่มีรายการ</span>'}
      ${evs.length > 6 ? `<span class="hint">+${evs.length - 6} รายการ</span>` : ''}
    </div>`);
  }
  return `<div class="mobile-calendar-tools"><button class="soft-btn" data-toggle-mobile-calendar>${all ? 'ซ่อนวันที่ไม่มีรายการ' : 'แสดงทุกวัน'}</button><span class="hint">มือถือแสดงแบบรายการเพื่อลดการไถยาว</span></div><div class="mobile-calendar-list">${rows.length ? rows.join('') : empty('เดือนนี้ยังไม่มีรายการ')}</div>`;
}
function renderCalendarWeek() {
  const start = new Date(state.calendarDate); start.setDate(start.getDate() - start.getDay());
  return `<div class="week-list">${Array.from({length:7},(_,i)=>{ const d=new Date(start); d.setDate(start.getDate()+i); return renderDayTimeline(toDateInput(d)); }).join('')}</div>`;
}
function renderCalendarDay() { return `<div class="day-list">${renderDayTimeline(toDateInput(state.calendarDate))}</div>`; }
function renderDayTimeline(date) {
  const evs = collectCalendarEvents().filter(e => e.date === date);
  return `<div class="card"><div class="section-title"><h3>${formatThaiDate(date)}</h3><button class="tiny-btn" data-day-detail="${date}">รายละเอียด</button></div>${evs.length ? evs.map(e => `<div class="timeline-item"><span>${escapeHtml(e.title)}${calendarEventDetail(e)}</span><span>${badge(eventText(e.type), eventBadge(e.type))}</span></div>`).join('') : empty('ไม่มีรายการ')}</div>`;
}
function eventText(type) { return ({'leave-vacation':'ลาพักร้อน','leave-personal':'ลากิจ','leave-sick':'ลาป่วย/ลาคลอด','leave-other':'ลา', noduty:'ไม่รับเวร', training:'อบรม', meeting:'ประชุม', outing:'ออกหน่วย', standard:'ตรวจมาตรฐาน', code:'ซ้อม CODE', holiday:'วันหยุด', duty:'เวร'}[type] || type); }
function eventBadge(type) { return ({'leave-vacation':'green','leave-personal':'purple','leave-sick':'yellow','leave-other':'blue', noduty:'black', training:'blue', meeting:'orange', outing:'red', standard:'purple', code:'yellow', holiday:'yellow', duty:'black'}[type] || 'black'); }
function showDayDetail(date) {
  const evs = collectCalendarEvents().filter(e => e.date === date);
  showModal(`<h2>${formatThaiDate(date)}</h2><div class="calendar-modal-list">${evs.length ? evs.map(renderCalendarModalRow).join('') : empty('ไม่มีรายการในวันนี้')}</div>`);
}

function renderLeavePage() {
  const rows = state.leaves.filter(x => isAdmin() || x.staff_id === currentStaffId());
  const editing = state.editingLeaveId ? state.leaves.find(x => x.id === state.editingLeaveId) : null;
  const selectedStaff = editing?.staff_id || currentStaffId();
  const selectedPhone = editing?.contact_phone || staffPhone(selectedStaff);
  return `
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขรายการ' : 'แจ้งลา / ไม่รับเวร'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-leave>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="leaveForm" class="form-grid">
          ${isAdmin() ? `<label class="wide">บันทึกให้เจ้าหน้าที่ <select name="staff_id" id="leaveStaffSelect" required>${staffOptions(selectedStaff)}</select><span class="hint">Admin เพิ่ม/แก้ไข/ยกเลิกแทน staff ได้ รวมถึงลาย้อนหลัง กรณีเจ้าหน้าที่ไม่สะดวกบันทึกเอง</span></label>` : ''}
          
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
          <label>เบอร์ติดต่อระหว่างลา <input name="contact_phone" id="leaveContactPhone" value="${escapeHtml(selectedPhone || '')}" placeholder="ระบบเติมจากข้อมูลเจ้าหน้าที่ให้อัตโนมัติ"></label>
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
  const table = `<div class="table-wrap desktop-table leave-desktop-table"><table><thead><tr><th>ชื่อ</th><th>ประเภท</th><th>ช่วงวันที่</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${escapeHtml(staffNick(r.staff_id))}${r.recorded_by_admin ? '<br><span class="badge purple">Admin บันทึกแทน</span>' : ''}${leaveCancellationBadge(r)}</td><td>${badge(r.type, leaveBadgeClass(r.type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="badge blue">${escapeHtml(r.leave_period || 'เต็มวัน')}</span><br><span class="muted">${escapeHtml(r.note || '')}</span>${r.admin_record_reason ? `<br><span class="muted">เหตุผล Admin: ${escapeHtml(r.admin_record_reason)}</span>` : ''}</td><td>${leaveStatusBadge(r)}</td><td><div class="actions">${renderLeaveActions(r)}</div></td></tr>`).join('')}
  </tbody></table></div>`;
  const cards = `<div class="mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="section-title"><h3>${escapeHtml(staffNick(r.staff_id))}</h3>${badge(r.type, leaveBadgeClass(r.type))}</div><div><b>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}</b><br>${badge(r.leave_period || 'เต็มวัน','blue')} ${leaveStatusBadge(r)}</div>${r.recorded_by_admin ? '<span class="badge purple">Admin บันทึกแทน</span>' : ''}${leaveCancellationBadge(r)}<span class="muted">${escapeHtml(r.note || '')}</span><div class="actions">${renderLeaveActions(r)}</div></div>`).join('')}</div>`;
  return table + cards;
}
function isLeaveCancellationRequested(row) {
  const st = String(row?.status || '').trim();
  return row?.cancellation_requested === true || st === 'รออนุมัติยกเลิก' || st === 'cancel_requested' || st === 'pending_cancel';
}
function leaveStatusBadge(row) {
  if (isLeaveCancellationRequested(row)) return badge('รออนุมัติยกเลิก', 'orange');
  return badge(row?.status || 'active', row?.status === 'cancelled' ? 'red' : 'green');
}
function leaveCancellationBadge(row) {
  return isLeaveCancellationRequested(row) ? '<br><span class="badge orange">พนักงานขอยกเลิก</span>' : '';
}
function renderLeaveActions(row) {
  if (isAdmin()) {
    return `${canEditOwn(row) ? `<button class="tiny-btn" data-edit-leave="${row.id}">แก้ไข</button>` : ''}<button class="tiny-btn danger" data-delete-leave="${row.id}">ลบ</button>`;
  }
  if (row?.staff_id !== currentStaffId() || row?.status === 'cancelled') return '<span class="muted">แก้ไม่ได้</span>';
  if (isLeaveCancellationRequested(row)) return '<span class="badge orange">ส่งคำขอยกเลิกแล้ว</span>';
  const editBtn = canEditOwn(row) ? `<button class="tiny-btn" data-edit-leave="${row.id}">แก้ไข</button>` : '';
  return `${editBtn}<button class="tiny-btn warn" data-request-cancel-leave="${row.id}">ส่งคำขอยกเลิกวันลา</button>`;
}
function canEditOwn(row) {
  if (isAdmin() && CFG.ADMIN_BYPASS_LEAVE_CLOSE_RULE !== false) return true;
  return row.staff_id === currentStaffId() && row.status !== 'cancelled' && !isBackdatedForStaff(row.start_date) && (row.type !== 'ไม่รับเวร' || !isNoDutyLockedForDate(row.start_date));
}
function isNoDutyLockedForDate(date) {
  if (isAdmin() && CFG.ADMIN_BYPASS_LEAVE_CLOSE_RULE !== false) return false;
  const d = parseDate(date);
  const now = new Date();
  const isCurrentMonth = d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (!isCurrentMonth) return false;
  const closeDay = Number(CFG.CURRENT_MONTH_CLOSE_DAY || CFG.ROSTER_CLOSE_DAY || 5);
  const close = new Date(d.getFullYear(), d.getMonth(), closeDay, 23, 59, 59);
  return now > close;
}
function isRosterLockedForDate(date) { return isNoDutyLockedForDate(date); }
function isBackdatedForStaff(date) {
  const d = parseDate(date);
  const today = parseDate(todayStr());
  return d < today;
}


function renderMyProfilePage() {
  const p = state.profile || {};
  const myId = currentStaffId();
  const myReqs = (state.profileChangeRequests || []).filter(r => r.staff_id === myId || r.requested_by === myId).slice(0, 10);
  return `<div class="grid grid-2">
    <div class="card">
      <div class="section-title"><div><h3>ข้อมูลส่วนตัว</h3><p class="hint">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p></div></div>
      <div class="profile-info-grid">
        <div><span class="muted">ชื่อเล่น</span><b>${escapeHtml(p.nickname || '-')}</b></div>
        <div><span class="muted">ชื่อ-สกุล</span><b>${escapeHtml(p.full_name || '-')}</b></div>
        <div><span class="muted">เบอร์โทร</span><b>${escapeHtml(p.phone || '-')}</b></div>
        <div><span class="muted">Email</span><b>${escapeHtml(p.email || '-')}</b></div>
        <div><span class="muted">ชื่อผู้ใช้</span><b>${escapeHtml(p.login_name || '-')}</b></div>
      </div>
      <form id="profileChangeForm" class="form-grid compact-form">
        <label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="login_name">ชื่อผู้ใช้</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label>
        <label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label>
        <label class="wide">เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label>
        <button class="primary-btn wide" type="submit">ส่งคำขอให้ Admin อนุมัติ</button>
      </form>
    </div>
    <div class="card">
      <div class="section-title"><h3>คำขอล่าสุดของฉัน</h3></div>
      ${myReqs.length ? `<div class="mobile-cards always-cards">${myReqs.map(r => `<div class="mobile-card"><div class="mobile-day-head"><b>${profileFieldLabel(r.field_name)}</b>${badge(profileRequestStatusText(r.status), profileRequestBadge(r.status))}</div><div><b>ค่าเดิม:</b> ${escapeHtml(r.old_value || '-')}</div><div><b>ค่าใหม่:</b> ${escapeHtml(r.new_value || '-')}</div><div class="muted">${formatThaiDateTime(r.created_at)}</div>${r.review_note ? `<div><b>หมายเหตุ Admin:</b> ${escapeHtml(r.review_note)}</div>` : ''}</div>`).join('')}</div>` : empty('ยังไม่มีคำขอ')}
    </div>
  </div>`;
}
function profileFieldLabel(f) { return ({ phone:'เบอร์โทร', login_name:'ชื่อผู้ใช้', nickname:'ชื่อเล่น', full_name:'ชื่อ-สกุล' }[f] || f || '-'); }
function profileRequestStatusText(s) { return ({ pending:'รออนุมัติ', approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ' }[s] || s || '-'); }
function profileRequestBadge(s) { return s === 'approved' ? 'green' : s === 'rejected' ? 'red' : 'orange'; }
function renderProfileRequestsPage() {
  if (!isAdmin()) return noPermission();
  const rows = state.profileChangeRequests || [];
  return `<div class="card">
    <div class="section-title"><div><h3>คำขอแก้ไขข้อมูลส่วนตัว</h3><p class="hint">Admin ตรวจคำขอจาก staff ก่อนเปลี่ยนข้อมูลจริงในระบบ</p></div></div>
    ${rows.length ? `<div class="mobile-cards always-cards">${rows.map(r => {
      const st = state.staff.find(s => s.id === r.staff_id) || {};
      return `<div class="mobile-card"><div class="mobile-day-head"><h3>${staffPill(st)}</h3>${badge(profileRequestStatusText(r.status), profileRequestBadge(r.status))}</div>
        <div><b>ขอแก้:</b> ${profileFieldLabel(r.field_name)}</div>
        <div><b>ค่าเดิม:</b> ${escapeHtml(r.old_value || '-')}</div>
        <div><b>ค่าใหม่:</b> ${escapeHtml(r.new_value || '-')}</div>
        <div><b>เหตุผล:</b> ${escapeHtml(r.note || '-')}</div>
        <div class="muted">ส่งเมื่อ ${formatThaiDateTime(r.created_at)}</div>
        ${r.status === 'pending' ? `<div class="actions"><button class="primary-btn" data-approve-profile-request="${r.id}">อนุมัติ</button><button class="ghost-btn danger" data-reject-profile-request="${r.id}">ไม่อนุมัติ</button></div>` : `<div><b>ผู้ตรวจ:</b> ${staffPill(r.reviewed_by)} <span class="muted">${formatThaiDateTime(r.reviewed_at)}</span></div>${r.review_note ? `<div><b>หมายเหตุ:</b> ${escapeHtml(r.review_note)}</div>` : ''}`}
      </div>`;
    }).join('')}</div>` : empty('ยังไม่มีคำขอ')}
  </div>`;
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
          <label>สถานที่ <input name="location" list="activityLocationList" value="${escapeHtml(editing?.location || '')}" placeholder="เลือกหรือพิมพ์เอง" required></label><datalist id="activityLocationList">${ACTIVITY_LOCATIONS.map(x => `<option value="${escapeHtml(x)}"></option>`).join('')}</datalist>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เวลาเริ่ม <input name="start_time" type="time" value="${editing?.start_time || ''}" required></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" value="${editing?.end_time || ''}" required></label>
          <label>ผู้รับผิดชอบ <select name="owner_id" required><option value="">เลือกผู้รับผิดชอบ</option>${staffOptions(editing?.owner_id || currentStaffId())}</select></label>
          <label>เอกสารแนบ <input name="file" type="file"></label>
          <div class="wide"><div class="field-label">ผู้เข้าร่วม</div>${renderParticipantCheckboxes(asArray(editing?.participant_ids))}</div>
          <label class="wide">หมายเหตุเพิ่มเติม <textarea name="note" placeholder="ถ้ามี เช่น จำนวนคน / รายละเอียดเสริม">${escapeHtml(editing?.note || '')}</textarea></label>
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
  const table = `<div class="table-wrap desktop-table"><table><thead><tr><th>รายละเอียดกิจกรรม</th><th>วันเวลา</th><th>สถานที่</th><th>ผู้รับผิดชอบ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${escapeHtml(r.title)}</b><br>${badge(r.event_type, activityClass(r.event_type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="muted">${escapeHtml([r.start_time, r.end_time].filter(Boolean).join(' - '))}</span></td><td>${escapeHtml(r.location || '-')}</td><td>${escapeHtml(staffNick(r.owner_id))}</td><td><div class="actions">
      ${(isAdmin() || r.created_by === currentStaffId() || r.owner_id === currentStaffId()) ? `<button class="tiny-btn" data-edit-activity="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${r.id}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}
    </div></td></tr>`).join('')}
  </tbody></table></div>`;
  const cards = `<div class="mobile-cards">${rows.map(r => `<div class="mobile-card"><div class="section-title"><h3>${escapeHtml(r.title)}</h3>${badge(r.event_type, activityClass(r.event_type))}</div><div>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="muted">${escapeHtml([r.start_time, r.end_time].filter(Boolean).join(' - '))}</span></div><div><b>สถานที่:</b> ${escapeHtml(r.location || '-')}</div><div><b>ผู้รับผิดชอบ:</b> ${escapeHtml(staffNick(r.owner_id))}</div><div class="actions">${(isAdmin() || r.created_by === currentStaffId() || r.owner_id === currentStaffId()) ? `<button class="tiny-btn" data-edit-activity="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${r.id}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}</div></div>`).join('')}</div>`;
  return table + cards;
}

function isLeaveHrChecked(leaveId) {
  return state.hrChecks.some(h => h.leave_request_id === leaveId && h.status === 'ตรวจสอบแล้ว');
}
function hrCheckBadgeForLeave(leaveId) {
  return isLeaveHrChecked(leaveId) ? '<span class="badge green">✓ ตรวจสอบ HR แล้ว</span>' : '';
}

function renderHrPage() {
  if (!isAdmin()) return noPermission();
  const staffFilter = state.hrFilterStaff || '';
  const monthFilter = state.hrFilterMonth || state.monthKey;
  const leaveRows = state.leaves
    .filter(x => x.type !== 'ไม่รับเวร' && x.status !== 'cancelled' && !isLeaveHrChecked(x.id))
    .filter(x => !staffFilter || x.staff_id === staffFilter)
    .filter(x => !monthFilter || String(x.start_date || '').startsWith(monthFilter) || String(x.end_date || '').startsWith(monthFilter));
  return `<div class="card">
    <div class="section-title"><h3>ตรวจสอบ HR</h3><span class="muted">รายการลาที่ยังไม่ได้ติ๊กว่าแจ้ง HR แล้ว</span></div>
    <div class="toolbar compact-filter">
      <label>คน <select id="hrFilterStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff).map(s => `<option value="${s.id}" ${staffFilter===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)}</option>`).join('')}</select></label>
      <label>เดือน <input type="month" id="hrFilterMonth" value="${monthFilter || ''}"></label>
    </div>
    ${leaveRows.length ? `<div class="table-wrap"><table><thead><tr><th>ผู้ลา</th><th>ประเภท/วันที่</th><th>สถานะ HR</th><th>บันทึกตรวจสอบ</th></tr></thead><tbody>
      ${leaveRows.map(l => { const h = state.hrChecks.find(x => x.leave_request_id === l.id) || {}; return `<tr>
        <td>${escapeHtml(staffName(l.staff_id))}</td>
        <td>${badge(l.type, leaveBadgeClass(l.type))}<br>${formatThaiDate(l.start_date)} - ${formatThaiDate(l.end_date)}<br><span class="muted">เหตุผล: ${escapeHtml(leaveReasonText(l) || '-')}</span></td>
        <td>${badge(h.status || 'รอตรวจสอบ', h.status === 'ตรวจสอบแล้ว' ? 'green' : 'orange')}<br><span class="muted">ผู้ตรวจ: ${h.checked_by ? staffNick(h.checked_by) : '-'}</span></td>
        <td><form class="hr-form form-grid" data-leave-id="${l.id}">
          <label>สถานะ <select name="status">${HR_STATUSES.map(st => `<option ${st===(h.status||'รอตรวจสอบ')?'selected':''}>${st}</option>`).join('')}</select></label>
          <label>วันที่แจ้งใน HR <input type="date" name="hr_reported_date" value="${h.hr_reported_date || ''}"></label>
          <label class="wide">หมายเหตุ <input name="note" value="${escapeHtml(h.note || '')}"></label>
          <button class="primary-btn wide" type="submit">บันทึก</button>
        </form></td>
      </tr>`; }).join('')}
    </tbody></table></div>` : empty('ไม่มีรายการค้างตรวจตามตัวกรองนี้')}
  </div>`;
}

function renderHrSummaryPage() {
  if (!isAdmin()) return noPermission();
  const staffFilter = state.hrSummaryFilterStaff || '';
  const monthFilter = state.hrSummaryFilterMonth || state.monthKey;
  const checkedRows = state.hrChecks
    .filter(h => h.status === 'ตรวจสอบแล้ว')
    .map(h => ({ h, l: state.leaves.find(x => x.id === h.leave_request_id) }))
    .filter(x => x.l)
    .filter(x => !staffFilter || x.l.staff_id === staffFilter)
    .filter(x => !monthFilter || String(x.l.start_date || '').startsWith(monthFilter) || String(x.l.end_date || '').startsWith(monthFilter) || String(x.h.hr_reported_date || '').startsWith(monthFilter));
  return `<div class="card">
    <div class="section-title"><h3>สรุปตรวจสอบ HR แล้ว</h3><span class="muted">ค้นย้อนหลังได้ตามคนหรือเดือน</span></div>
    <div class="toolbar compact-filter">
      <label>คน <select id="hrSummaryFilterStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff).map(s => `<option value="${s.id}" ${staffFilter===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)}</option>`).join('')}</select></label>
      <label>เดือน <input type="month" id="hrSummaryFilterMonth" value="${monthFilter || ''}"></label>
    </div>
    ${checkedRows.length ? `<div class="table-wrap desktop-table"><table><thead><tr><th>ผู้ลา</th><th>ประเภท/ช่วงวันที่</th><th>วันที่แจ้งใน HR</th><th>ผู้ตรวจ/เวลาตรวจ</th><th>หมายเหตุ</th><th>ย้อนกลับ</th></tr></thead><tbody>
      ${checkedRows.map(({h,l}) => `<tr><td>${escapeHtml(staffName(l.staff_id))}</td><td>${badge(l.type, leaveBadgeClass(l.type))}<br>${formatThaiDate(l.start_date)} - ${formatThaiDate(l.end_date)}<br><span class="muted">${escapeHtml(leaveReasonText(l) || '')}</span></td><td>${h.hr_reported_date ? formatThaiDate(h.hr_reported_date) : '-'}</td><td>${staffPill(h.checked_by)}<br><span class="muted">${formatThaiDateTime(h.checked_at)}</span></td><td>${escapeHtml(h.note || '-')}</td><td><button class="tiny-btn danger" data-hr-revert="${h.id}">ย้อนกลับ</button></td></tr>`).join('')}
    </tbody></table></div>
    <div class="mobile-cards">${checkedRows.map(({h,l}) => `<div class="mobile-card"><div class="section-title"><h3>${escapeHtml(staffNick(l.staff_id))}</h3>${badge(l.type, leaveBadgeClass(l.type))}</div><div>${formatThaiDate(l.start_date)} - ${formatThaiDate(l.end_date)}</div><div><b>เหตุผล:</b> ${escapeHtml(leaveReasonText(l) || '-')}</div><div><b>แจ้งใน HR:</b> ${h.hr_reported_date ? formatThaiDate(h.hr_reported_date) : '-'}</div><div><b>ผู้ตรวจ:</b> ${staffPill(h.checked_by)}<br><span class="muted">${formatThaiDateTime(h.checked_at)}</span></div><div><b>หมายเหตุ:</b> ${escapeHtml(h.note || '-')}</div><div class="actions"><button class="tiny-btn danger" data-hr-revert="${h.id}">ย้อนกลับไปตรวจสอบใหม่</button></div></div>`).join('')}</div>` : empty('ยังไม่มีรายการที่ตรวจสอบ HR แล้วตามตัวกรองนี้')}
  </div>`;
}

function renderSchedulerPage() {
  if (!isAdmin()) return noPermission();
  const { y, m } = getMonthRange(state.monthKey);
  const month = state.rosterMonths.find(x => x.year === y && x.month === m);
  const assignments = getAssignmentsForMonth(state.monthKey).filter(assignmentBelongsToActiveStaff);
  const monthHolidays = state.holidays.filter(h => h.holiday_date?.startsWith(state.monthKey));
  return `<div class="grid">
    <div class="card">
      <div class="toolbar">
        <label>เดือน <input type="month" id="rosterMonthInput" value="${state.monthKey}"></label>
        <button class="ghost-btn" data-generate-roster>สร้างตารางเปล่า</button>
        <button class="soft-btn" data-auto-assign>สร้างร่าง Auto Assign</button>
        <button class="primary-btn" data-save-roster>บันทึก</button>
        <button class="ghost-btn danger" data-clear-roster-month>ล้างข้อมูลเดือนนี้</button>
        <button class="ghost-btn" data-restore-roster-month>ย้อนกลับข้อมูลล่าสุด</button>
        <span>${badge(month?.status || 'ยังไม่สร้าง', month?.status==='published'?'green':month?.status==='locked'?'red':'black')}</span>
      </div>
      <form id="holidayForm" class="form-grid compact-form">
        <label>เพิ่มวันหยุดราชการ <input name="holiday_date" type="date" value="${state.monthKey}-01" required></label>
        <label>ชื่อวันหยุด <input name="title" placeholder="เช่น วันเฉลิมฯ" required></label>
        <button class="soft-btn" type="submit">บันทึกวันหยุด</button>
      </form>
      <div class="hint">Auto Assign จะช่วยเกลี่ยเวรตามกติกาและไม่แตะช่องที่ล็อกไว้</div>
      ${monthHolidays.length ? `<div class="chip-line">${monthHolidays.map(h => `<span class="badge yellow">${formatThaiDate(h.holiday_date)} ${escapeHtml(String(h.title || h.name || h.holiday_name || 'วันหยุดราชการ').split(':::')[0].trim())}</span>`).join('')}</div>` : ''}
    </div>
    <div class="roster-board">
      <div class="card">
        <h3>รายชื่อเจ้าหน้าที่</h3>
        <p class="hint">ลากชื่อไปวางในช่องเวรได้เลย / คนที่ปิดจัดเวรจะไม่ถูก Auto Assign</p>
        <div class="staff-pool">
          ${orderedStaff(state.staff.filter(s => isRosterEnabled(s))).map(s => `<div class="staff-chip" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" draggable="true" data-drag-staff="${s.id}" data-staff-stat="${s.id}" title="กดเพื่อดูสถิติเวร"><span>${escapeHtml(s.nickname || s.full_name)}</span><span>${badge(s.staff_type || '-', s.staff_type==='MT'?'blue':'orange')}</span></div>`).join('')}
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
  if (!assignments.length) return empty('กด “สร้างร่าง Auto Assign” เพื่อเริ่มจัดเวร');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  const desktopTable = `<div class="table-wrap roster-table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
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
          <select class="mobile-roster-select" data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${staffOptionList(slot.staff_id, st => canStaffWorkSlot(st.id, slot))}</select>
          <div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div>
        </div></td>`;
      }).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
  return desktopTable + renderRosterMobileGrid(assignments, y, m, last);
}
function renderRosterMobileGrid(assignments, y, m, last) {
  return `<div class="mobile-roster-cards">${Array.from({length:last}, (_,i)=>i+1).map(day => {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const dow = parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
    const slots = DUTY_COLUMNS.filter(code => allowedDutyCodesForDate(date).includes(code)).map(code => assignments.find(a => a.duty_date === date && a.duty_code === code)).filter(Boolean);
    return `<div class="mobile-card roster-day-card"><div class="mobile-day-head"><b>${day}</b><span>${dow}</span>${isHolidayDate(date) ? `<span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</div>${slots.map(slot => {
      const id = slot.id || slot._temp_id;
      return `<div class="mobile-roster-slot"><div><b>${escapeHtml(DUTY_LABEL[slot.duty_code] || slot.duty_code)}</b><br><span class="muted">${escapeHtml(slot.required_role)} ${slot.is_locked?'• locked':''}</span></div><select data-roster-slot-select="${id}" ${slot.is_locked?'disabled':''}><option value="">ยังไม่จัด</option>${staffOptionList(slot.staff_id, st => canStaffWorkSlot(st.id, slot))}</select><div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked?'ปลดล็อก':'ล็อก'}</button></div></div>`;
    }).join('')}</div>`;
  }).join('')}</div>`;
}
function showFairness() {
  const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id);
  const stats = calcFairness(assignments);
  const hours = Object.values(stats).map(x => x.hours || 0);
  const pays = Object.values(stats).map(x => x.pay || 0);
  const diff = hours.length ? Math.max(...hours) - Math.min(...hours) : 0;
  const payDiff = pays.length ? Math.max(...pays) - Math.min(...pays) : 0;
  showModal(`<h2>ตรวจสมดุลการกระจายเวร ${state.monthKey}</h2><p class="hint">คิดตามเวรตั้งต้น: ชบด วันธรรมดา 16 ชม., ชบด เสาร์/อาทิตย์/นักขัต 24 ชม., ช9 8 ชม., ช3A/ช3B คิดตั้งต้น 8 ชม. ส่วนช4 และชั่วโมงปั่นเลือดเพิ่มให้ยืนยันเวลาแล้วเทียบ LIS ก่อน</p><p class="hint">ส่วนต่างชั่วโมง ${diff.toFixed(1)} ชม. • ส่วนต่างเงินโดยประมาณ ${payDiff.toLocaleString()} บาท</p><div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>ชม.รวม</th><th>เงินประมาณ</th><th>หน่วยเวร</th><th>ชบด</th><th>ช9</th><th>ช3A/B</th><th>ช4</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด/นักขัต</th></tr></thead><tbody>
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

function renderTradeRequestsPage() {
  const assignments = getAssignmentsForMonth(state.monthKey);
  const staffFilter = state.tradeFilterStaff || '';
  const related = state.tradeRequests;
  const pendingMine = related.filter(r => r.status === 'pending' && r.receiver_id === currentStaffId()).length;
  const waitingAdmin = related.filter(r => r.status === 'confirmed').length;
  return `<div class="card"><div class="toolbar compact-filter"><label>เดือน <input type="month" id="scheduleMonthInput" value="${state.monthKey}"></label><label>คน <select id="tradeFilterStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff).map(s => `<option value="${s.id}" ${staffFilter===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)}</option>`).join('')}</select></label>${badge(`รอฉันยืนยัน ${pendingMine}`, pendingMine ? 'orange' : 'black')}${badge(`รอ Admin ${waitingAdmin}`, waitingAdmin ? 'blue' : 'black')}</div><div class="notice soft-notice">ทุกคนเห็นคำขอของทุกคนได้ ใช้ตัวกรองเพื่อดูเฉพาะคนหรือเดือนที่ต้องการ</div>${renderDutyTradePanel(assignments)}</div>`;
}

function scheduleMonthDates(key=state.monthKey) {
  const { y, m } = getMonthRange(key);
  const last = new Date(y, m, 0).getDate();
  return Array.from({ length: last }, (_, i) => `${y}-${pad(m)}-${pad(i + 1)}`);
}
function scheduleStaffList() {
  // ตารางเวรอ่านค่าพนักงานแบบตรงที่สุด: active/is_active === true เท่านั้น แล้วเรียงตามลำดับหน้างานเดิม
  return orderedStaff(state.staff.filter(isRosterEnabled));
}
function scheduleAssignmentsForMonth(key=state.monthKey) {
  return getAssignmentsForMonth(key).filter(a => normalizeDateKey(a?.duty_date).startsWith(key) && assignmentBelongsToActiveStaff(a));
}
function dutySortIndex(code) {
  const idx = DUTY_COLUMNS.indexOf(code);
  return idx >= 0 ? idx : 999;
}
function dutyDisplayLabel(code) {
  return DUTY_LABEL[code] || code || '-';
}
function scheduleShiftButton(slot) {
  if (!slot?.staff_id) return '';
  return `<div class="schedule-person-cell">${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}${renderTradeButton(slot)}</div>`;
}
function renderMonthlySchedulePage() {
  const key = state.monthKey;
  const staffList = scheduleStaffList();
  const assignments = scheduleAssignmentsForMonth(key);
  const active = ['day','person','balance','table'].includes(state.scheduleMobileView) ? state.scheduleMobileView : 'day';
  state.scheduleMobileView = active;
  const content = staffList.length
    ? (active === 'day' ? renderCalendarCardView(staffList, assignments, key)
      : active === 'person' ? renderPersonView(staffList, assignments, key)
      : active === 'balance' ? renderBalanceDashboard(staffList, assignments, key)
      : renderGridView(staffList, assignments, key))
    : empty('ไม่มีรายชื่อเจ้าหน้าที่ที่เปิดใช้งาน');
  return `<div class="card schedule-page-card clean-schedule-page">
    <div class="toolbar no-print">
      <label>เดือน <input type="month" id="scheduleMonthInput" value="${escapeHtml(key)}"></label>
      <button class="ghost-btn" data-export-schedule-excel>Export Excel</button>
      <button class="ghost-btn" data-print-page>Export PDF / พิมพ์</button>
    </div>
    ${renderScheduleTabs(active)}
    <h3 class="print-only">ตารางเวรประจำเดือน ${escapeHtml(key)}</h3>
    <div class="clean-schedule-content">${content}</div>
    ${renderDutyTradePanel(assignments)}
  </div>`;
}
function renderScheduleTabs(active) {
  const tabs = [
    ['day', 'ดูตามวัน'],
    ['person', 'ดูตามคน'],
    ['balance', 'สรุปสมดุลเวร'],
    ['table', 'ตารางทั้งเดือน']
  ];
  return `<div class="clean-schedule-tabs no-print">${tabs.map(([id, label]) => `<button type="button" class="${active === id ? 'primary-btn' : 'ghost-btn'}" data-schedule-mobile-view="${id}">${label}</button>`).join('')}</div>`;
}
function renderCalendarCardView(staffList, assignments, key=state.monthKey) {
  const dates = scheduleMonthDates(key);
  return `<div class="clean-calendar-cards">${dates.map(date => {
    const d = parseDate(date);
    const rows = assignments
      .filter(a => normalizeDateKey(a.duty_date) === date && a.staff_id)
      .sort((a,b) => dutySortIndex(a.duty_code) - dutySortIndex(b.duty_code));
    const dayOff = isWeekend(date) || isHolidayDate(date);
    return `<section class="clean-day-card ${dayOff ? 'is-offday' : ''}">
      <div class="clean-day-head"><b>${d.getDate()}</b><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? badge(holidayName(date), 'yellow') : ''}</div>
      ${rows.length ? rows.map(a => `<div class="clean-day-line"><span>${escapeHtml(dutyDisplayLabel(a.duty_code))}</span>${scheduleShiftButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}
    </section>`;
  }).join('')}</div>`;
}
function renderPersonView(staffList, assignments, key=state.monthKey) {
  const selectedId = state.schedulePersonFilter || staffList[0]?.id || '';
  const selected = staffList.find(st => String(st.id) === String(selectedId)) || staffList[0];
  const renderCard = (st) => {
    const rows = assignments
      .filter(a => String(a.staff_id) === String(st?.id))
      .sort((a,b) => normalizeDateKey(a?.duty_date).localeCompare(normalizeDateKey(b?.duty_date)) || dutySortIndex(a?.duty_code) - dutySortIndex(b?.duty_code));
    return `<section class="clean-person-card" style="--staff-bg:${staffColor(st)};--staff-fg:${textColorFor(staffColor(st))}">
      <button type="button" class="clean-person-head" data-staff-stat="${st?.id}"><b>${escapeHtml(st?.nickname || st?.full_name || '-')}</b><span>${rows.length} เวร</span></button>
      ${rows.length ? rows.map(a => `<div class="clean-person-duty"><span>${formatThaiDate(a?.duty_date)}</span><b>${escapeHtml(dutyDisplayLabel(a?.duty_code))}</b>${renderTradeButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}
    </section>`;
  };
  return `<div class="person-filter-mobile no-print"><label>เลือกเจ้าหน้าที่ <select id="schedulePersonFilter">${staffList.map(st => `<option value="${st.id}" ${String(selected?.id)===String(st.id)?'selected':''}>${escapeHtml(st.nickname || st.full_name || '-')}</option>`).join('')}</select></label></div>
  <div class="clean-person-mobile-result">${selected ? renderCard(selected) : empty('ไม่มีเจ้าหน้าที่')}</div>
  <div class="clean-person-list">${staffList.map(renderCard).join('')}</div>`;
}
function hasAnyDutyOn(staffId, date, assignments) {
  const key = normalizeDateKey(date);
  return assignments.some(a => String(a.staff_id) === String(staffId) && normalizeDateKey(a.duty_date) === key);
}
function calculateDaysOff(staffId, key=state.monthKey, assignments=scheduleAssignmentsForMonth(key)) {
  return scheduleMonthDates(key).reduce((sum, date) => {
    // Business Rule v157:
    // 1) Count only calendar off-days: Sat/Sun/Public Holiday.
    // 2) Count only when this staff has no roster shift on that date.
    // 3) Leave / ไม่รับเวร must NOT block counting if conditions 1-2 are true.
    const isCalendarOff = isWeekend(date) || isHolidayDate(date);
    if (!isCalendarOff) return sum;
    const hasDuty = hasAnyDutyOn(staffId, date, assignments);
    if (hasDuty) return sum;
    return sum + 1;
  }, 0);
}
function dutyBalanceGroupLabel(st) {
  return String(st?.staff_type || '').trim() === 'เคิก' ? 'เคิก' : 'MT';
}
function renderBalanceDashboard(staffList, assignments, key=state.monthKey) {
  const rowsWithDuty = (assignments || []).filter(a => a.staff_id);
  const stats = calcFairness(rowsWithDuty);
  const groupOrder = ['MT', 'เคิก'];
  const groups = groupOrder
    .map(label => ({
      label,
      staff: (staffList || []).filter(st => dutyBalanceGroupLabel(st) === label)
    }))
    .filter(g => g.staff.length);

  const renderGroup = (group) => {
    const normalStaff = group.staff.filter(st => !isLongTermLeaveStaff(st));
    const unitsList = normalStaff.map(st => Number(stats[st.id]?.units || 0));
    const avgUnits = unitsList.length ? unitsList.reduce((a,b) => a + b, 0) / unitsList.length : 0;
    const rows = group.staff.map(st => {
      const r = stats[st.id] || {};
      const longTerm = isLongTermLeaveStaff(st);
      const units = Number(r.units || 0);
      const hours = Number(r.hours || 0);
      const pay = Number(r.pay || 0);
      const gap = longTerm ? 0 : units - avgUnits;
      const daysOff = calculateDaysOff(st.id, key, assignments);
      const status = longTerm ? 'ลาระยะยาว / ไม่คิดหนี้เวร' : Math.abs(gap) <= 0.5 ? 'สมดุล' : gap > 0 ? 'เวรมากกว่าเฉลี่ย' : 'เวรน้อยกว่าเฉลี่ย';
      const color = longTerm ? 'black' : Math.abs(gap) <= 0.5 ? 'green' : gap > 0 ? 'orange' : 'blue';
      return { st, units, hours, pay, gap, daysOff, status, color };
    });
    return `<section class="balance-group-section">
      <div class="section-title balance-group-title"><h3>กลุ่ม ${escapeHtml(group.label)}</h3><span>${badge(`ค่าเฉลี่ย ${avgUnits.toFixed(1)} หน่วยเวร`, 'blue')}</span><span class="hint">คิดเฉลี่ยเฉพาะเจ้าหน้าที่ในกลุ่มนี้${normalStaff.length !== group.staff.length ? ' และไม่รวมคนลาระยะยาว' : ''}</span></div>
      <div class="table-wrap"><table class="clean-balance-table"><thead><tr><th>เจ้าหน้าที่</th><th>เวรรวม</th><th>หน่วยเวร</th><th>ชั่วโมงรวม</th><th>เงินประมาณ</th><th>Quota Gap</th><th>OT Balance</th><th>จำนวนวันหยุดสะสม</th><th>สถานะ</th></tr></thead><tbody>
        ${rows.map(r => `<tr><td>${staffPill(r.st)}</td><td>${(assignments || []).filter(a => String(a.staff_id) === String(r.st.id)).length}</td><td>${r.units.toFixed(1)}</td><td>${r.hours.toFixed(1)}</td><td>${r.pay.toLocaleString()}</td><td>${r.gap.toFixed(1)}</td><td>${isLongTermLeaveStaff(r.st) ? '0.0' : r.gap.toFixed(1)}</td><td>${r.daysOff}</td><td>${badge(r.status, r.color)}</td></tr>`).join('')}
      </tbody></table></div>
    </section>`;
  };

  return `<div class="clean-balance-dashboard grouped-balance-dashboard">
    <div class="notice soft-notice">จำนวนวันหยุดสะสม = เสาร์/อาทิตย์/นักขัตฤกษ์ที่เจ้าหน้าที่ไม่มีเวรในระบบ วันหยุดที่มีเวรจะไม่ถูกนับ • ค่าเฉลี่ยแยกตามกลุ่ม MT / เคิก ไม่เอาทุกคนมาหารรวมกัน</div>
    ${groups.length ? groups.map(renderGroup).join('') : empty('ยังไม่มีเจ้าหน้าที่สำหรับคำนวณสมดุลเวร')}
  </div>`;
}
function renderGridView(staffList, assignments, key=state.monthKey) {
  const dates = scheduleMonthDates(key);
  return `<div class="table-wrap clean-grid-wrap"><table id="scheduleTable" class="clean-schedule-grid"><thead><tr><th class="clean-sticky-col">เจ้าหน้าที่</th>${dates.map(date => {
    const d = parseDate(date);
    const off = isWeekend(date) || isHolidayDate(date);
    return `<th class="${off ? 'offday-col' : ''}">${d.getDate()}<br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`;
  }).join('')}</tr></thead><tbody>${staffList.map(st => {
    const bg = staffColor(st);
    const fg = textColorFor(bg);
    return `<tr><th class="clean-sticky-col clean-staff-cell" style="--staff-bg:${bg};--staff-fg:${fg}"><button type="button" data-staff-stat="${st.id}">${escapeHtml(st.nickname || st.full_name || '-')}</button></th>${dates.map(date => {
      const shifts = assignments
        .filter(a => String(a.staff_id) === String(st.id) && normalizeDateKey(a.duty_date) === date)
        .sort((a,b) => dutySortIndex(a.duty_code) - dutySortIndex(b.duty_code));
      const off = isWeekend(date) || isHolidayDate(date);
      const leave = activeLeaveRecordOn(st.id, date);
      const leaveCls = leave ? leaveCellClass(leaveDisplayType(leave)) : '';
      return `<td class="${off ? 'offday-col' : ''} ${leaveCls}"><div class="clean-cell-stack">${leave ? leaveCellBadge(leave) : ''}${shifts.length ? shifts.map(a => { const attrs = canRequestTrade(a) ? `data-trade-duty="${a.id}"` : `data-staff-stat="${st.id}"`; return `<button type="button" class="clean-shift-pill" style="--staff-bg:${bg};--staff-fg:${fg}" ${attrs}>${escapeHtml(dutyDisplayLabel(a.duty_code))}</button>`; }).join('') : (off && !leave ? '<span class="muted">หยุด</span>' : '')}</div></td>`;
    }).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderScheduleSummary(assignments) {
  return renderBalanceDashboard(scheduleStaffList(), assignments, state.monthKey);
}
function renderReadOnlySchedule(assignments) {
  return renderGridView(scheduleStaffList(), assignments || scheduleAssignmentsForMonth(state.monthKey), state.monthKey);
}

function canRequestTrade(slot) {
  if (!slot?.id || !slot.staff_id) return false;
  return slot.staff_id === currentStaffId() || isAdmin();
}
function renderTradeButton(slot) {
  if (!canRequestTrade(slot)) return '';
  return `<button class="tiny-btn trade-btn" data-trade-duty="${slot.id}">แลก/ขาย/ยก</button>`;
}
function renderDutyTradePanel(assignments) {
  const monthRows = state.tradeRequests.filter(r => {
    const a = assignments.find(x => x.id === r.from_assignment_id || x.id === r.to_assignment_id);
    return a || String(r.created_at || '').startsWith(state.monthKey);
  });
  const staffFilter = state.tradeFilterStaff || '';
  const visible = monthRows.filter(r => !staffFilter || r.requester_id === staffFilter || r.receiver_id === staffFilter);
  if (!visible.length) return `<div class="trade-panel"><h3>คำขอแลก/ขาย/ยกเวร</h3>${empty('ยังไม่มีคำขอแลก/ขาย/ยกเวรในเดือนนี้')}</div>`;
  return `<div class="trade-panel"><h3>คำขอแลก/ขาย/ยกเวร</h3><div class="table-wrap desktop-table"><table><thead><tr><th>ผู้ขอ</th><th>ผู้รับ/คู่แลก</th><th>รายการ</th><th>เงินโดยประมาณ</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>${visible.map(r => renderTradeRow(r, assignments)).join('')}</tbody></table></div>${renderTradeCards(visible, assignments)}</div>`;
}
function renderTradeCards(rows, assignments) {
  return `<div class="mobile-cards trade-mobile-cards">${rows.map(r => {
    const from = assignments.find(a => a.id === r.from_assignment_id) || {};
    const to = assignments.find(a => a.id === r.to_assignment_id) || null;
    const receiverActions = r.status === 'pending' && r.receiver_id === currentStaffId();
    const adminActions = r.status === 'confirmed' && isAdmin();
    return `<div class="mobile-card"><div class="section-title"><h3>${escapeHtml(r.trade_type || '-')}</h3>${badge(tradeStatusLabel(r.status, r), r.status==='confirmed'?'green':r.status==='rejected'?'red':r.status==='completed'?'blue':'orange')}</div><div><b>ผู้ขอ:</b> ${staffPill(r.requester_id)}<br><b>ผู้รับ/คู่แลก:</b> ${staffPill(r.receiver_id)}</div><div>${formatThaiDate(from.duty_date)} ${DUTY_LABEL[from.duty_code] || from.duty_code || ''}${to ? ` ↔ ${formatThaiDate(to.duty_date)} ${DUTY_LABEL[to.duty_code] || to.duty_code}` : ''}</div><div><b>เงินโดยประมาณ:</b> ${Number(r.amount_from || 0).toLocaleString()} บ.${r.amount_diff ? `<br><span class="muted">ส่วนต่าง ${Number(r.amount_diff).toLocaleString()} บ.</span>` : ''}</div><div class="actions">${receiverActions ? `<button class="tiny-btn" data-trade-status="${r.id}|confirmed">ยืนยัน</button><button class="tiny-btn danger" data-trade-status="${r.id}|rejected">ปฏิเสธ</button>` : adminActions ? `<button class="tiny-btn" data-trade-apply="${r.id}">${isSelfPaidTrade(r) ? 'Admin รับทราบข้อตกลง' : 'Admin บันทึกเปลี่ยนเวร'}</button>` : '<span class="muted">ไม่มีรายการที่ต้องกดตอนนี้</span>'}</div></div>`;
  }).join('')}</div>`;
}
function renderTradeRow(r, assignments) {
  const from = assignments.find(a => a.id === r.from_assignment_id) || {};
  const to = assignments.find(a => a.id === r.to_assignment_id) || null;
  const receiverActions = r.status === 'pending' && r.receiver_id === currentStaffId();
  const adminActions = r.status === 'confirmed' && isAdmin();
  return `<tr><td>${staffPill(r.requester_id)}</td><td>${staffPill(r.receiver_id)}</td><td>${escapeHtml(r.trade_type)} • ${escapeHtml(niceRoleRateLabel(r.rate_mode))}<br><span class="muted">${formatThaiDate(from.duty_date)} ${DUTY_LABEL[from.duty_code] || from.duty_code || ''}${to ? ` ↔ ${formatThaiDate(to.duty_date)} ${DUTY_LABEL[to.duty_code] || to.duty_code}` : ''}</span></td><td>${Number(r.amount_from || 0).toLocaleString()} บ.${r.amount_diff ? `<br><span class="muted">ส่วนต่าง ${Number(r.amount_diff).toLocaleString()} บ.</span>` : ''}</td><td>${badge(tradeStatusLabel(r.status, r), r.status==='confirmed'?'green':r.status==='rejected'?'red':r.status==='completed'?'blue':'orange')}</td><td>${receiverActions ? `<button class="tiny-btn" data-trade-status="${r.id}|confirmed">ยืนยัน</button><button class="tiny-btn danger" data-trade-status="${r.id}|rejected">ปฏิเสธ</button>` : adminActions ? `<button class="tiny-btn" data-trade-apply="${r.id}">${isSelfPaidTrade(r) ? 'Admin รับทราบข้อตกลง' : 'Admin บันทึกเปลี่ยนเวร'}</button>` : '-'}</td></tr>`;
}
function tradeStatusLabel(status, row=null) {
  if (row && isSelfPaidTrade(row)) return ({ pending:'รออีกฝ่ายยืนยัน', confirmed:'ยืนยันแล้ว รอ Admin รับทราบ', rejected:'ปฏิเสธ', completed:'รับทราบแล้ว / ไม่เปลี่ยนตาราง' }[status] || status || '-');
  return ({ pending:'รออีกฝ่ายยืนยัน', confirmed:'ยืนยันแล้ว รอ Admin บันทึก', rejected:'ปฏิเสธ', completed:'เปลี่ยนตารางแล้ว' }[status] || status || '-');
}
function renderReadOnlySchedule(assignments) {
  if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  const table = `<div class="table-wrap desktop-schedule-table"><table id="scheduleTable" class="schedule-readable"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
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
  return table + `<div class="mobile-schedule-view">${renderMobileScheduleView(assignments)}</div>`;
}
function renderMobileScheduleView(assignments) {
  if (state.scheduleMobileView === 'person') return renderMobileScheduleByPerson(assignments);
  if (state.scheduleMobileView === 'ot') return renderMobileScheduleOt(assignments);
  if (state.scheduleMobileView === 'table') return renderSchedulePersonMatrix(assignments);
  return renderMobileScheduleByDay(assignments);
}
function renderMobileScheduleByDay(assignments) {
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  return `<div class="mobile-schedule-list">${Array.from({length:last}, (_,i)=>i+1).map(day => {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const slots = DUTY_COLUMNS.map(code => ({ code, slot: assignments.find(a => a.duty_date === date && a.duty_code === code) })).filter(x => allowedDutyCodesForDate(date).includes(x.code) && x.slot?.staff_id);
    return `<div class="schedule-day-card ${isHolidayDate(date)||isWeekend(date)?'weekend-row':''}"><div class="mobile-day-head"><b>${day}</b><span>${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span>${isHolidayDate(date) ? badge(holidayName(date),'yellow') : ''}</div>${slots.length ? slots.map(({code,slot}) => `<div class="mobile-duty-line"><b>${escapeHtml(DUTY_LABEL[code] || code)}</b><span>${staffPill(slot.staff_id, { button:true, attrs:`data-staff-stat="${slot.staff_id}" type="button"` })}</span>${renderTradeButton(slot)}</div>`).join('') : '<span class="muted">ไม่มีเวร</span>'}</div>`;
  }).join('')}</div>`;
}
function renderMobileScheduleByPerson(assignments) {
  const active = orderedStaff(state.staff.filter(s => isRosterEnabled(s)));
  return `<div class="mobile-schedule-person-list">${active.map(s => {
    const rows = assignments.filter(a => a.staff_id === s.id).sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date)));
    return `<div class="schedule-person-card" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}"><div class="person-card-head"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${rows.length} เวร</span></div>${rows.length ? rows.map(a => `<div class="person-duty-line"><span>${formatThaiDate(a.duty_date)}</span><b>${escapeHtml(DUTY_LABEL[a.duty_code] || a.duty_code)}</b>${renderTradeButton(a)}</div>`).join('') : '<span class="muted">ไม่มีเวรเดือนนี้</span>'}</div>`;
  }).join('')}</div>`;
}
function renderMobileScheduleOt(assignments) {
  const stats = calcFairness(assignments.filter(x => x.staff_id));
  const active = orderedStaff(state.staff.filter(s => isRosterEnabled(s)));
  return `<div class="mobile-ot-summary-list">${active.map(s => {
    const r = stats[s.id] || {};
    return `<button class="ot-summary-card" style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}" data-staff-stat="${s.id}" type="button"><b>${escapeHtml(s.nickname || s.full_name)}</b><span>${(r.units||0).toFixed(1)} หน่วย</span><span>${(r.hours||0).toFixed(0)} ชม.</span><span>${(r.pay||0).toLocaleString()} บ.</span></button>`;
  }).join('')}</div>`;
}
function renderSchedulePersonMatrix(assignments) {
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  const active = orderedStaff(state.staff.filter(s => isRosterEnabled(s)));
  const days = Array.from({length:last}, (_,i)=>i+1);
  return `<div class="table-wrap mobile-schedule-matrix-wrap"><table class="schedule-person-matrix"><thead><tr><th>เจ้าหน้าที่</th>${days.map(day => `<th>${day}<br><span>${parseDate(`${y}-${pad(m)}-${pad(day)}`).toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`).join('')}</tr></thead><tbody>${active.map(s => `<tr><th style="--staff-bg:${staffColor(s)};--staff-fg:${textColorFor(staffColor(s))}">${escapeHtml(s.nickname || s.full_name)}</th>${days.map(day => {
    const date = `${y}-${pad(m)}-${pad(day)}`;
    const row = assignments.find(a => a.staff_id === s.id && a.duty_date === date);
    const cls = isHolidayDate(date) ? 'holiday-cell' : isWeekend(date) ? 'weekend-cell' : '';
    return `<td class="${cls}">${row ? `<b>${escapeHtml(DUTY_LABEL[row.duty_code] || row.duty_code)}</b>${renderTradeButton(row)}` : (isWeekend(date) ? 'WEEKEND' : isHolidayDate(date) ? 'HOLIDAY' : '')}</td>`;
  }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
function showStaffStats(staffId) {
  const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id === staffId);
  const s = calcFairness(assignments)[staffId] || {};
  const countCode = code => assignments.filter(a => a.duty_code === code).length;
  const countGroup = pred => assignments.filter(pred).length;
  const detail = assignments.slice().sort((a,b)=>String(a.duty_date).localeCompare(String(b.duty_date))).map(a => `<tr><td>${formatThaiDate(a.duty_date)}</td><td>${escapeHtml(DUTY_LABEL[a.duty_code] || a.duty_code)}</td><td>${dutyMetrics(a).hours.toFixed(0)} ชม.</td></tr>`).join('');
  showModal(`<h2>${staffPill(staffId)}</h2><div class="grid grid-2 modal-stat-grid">${statCard('เวรรวม', s.total||0)}${statCard('ชม.รวม', (s.hours||0).toFixed(1))}${statCard('เงินประมาณ', (s.pay||0).toLocaleString())}${statCard('วันหยุดสะสม', calculateDaysOff(staffId, state.monthKey, getAssignmentsForMonth(state.monthKey)))}${statCard('ชบด1', countCode('ชบด1'))}${statCard('ชบด2', countCode('ชบด2'))}${statCard('ชบด3', countCode('ชบด3'))}${statCard('ช3A/ช3B', countGroup(a => a.duty_code === 'ช3A' || a.duty_code === 'ช3B'))}${statCard('ช4', countGroup(a => a.duty_code === 'ช4A' || a.duty_code === 'ช4B'))}${statCard('ช9', countGroup(a => String(a.duty_code).startsWith('ช9')))}</div><div class="compact-detail-table"><table><thead><tr><th>วันที่</th><th>เวร</th><th>ชม.ตั้งต้น</th></tr></thead><tbody>${detail || '<tr><td colspan="3">ยังไม่มีเวรในเดือนนี้</td></tr>'}</tbody></table></div>`);
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
      ${canManage && !noPosition ? '<button class="primary-btn" data-save-positions>บันทึกตำแหน่งวันนี้</button>' : ''}
    </div>
    <div class="notice soft-notice">ตรวจตำแหน่งของวันนี้ให้ตรงกับคนลาและงานจริง แล้วกดบันทึกตำแหน่งวันนี้ หากมีคนลาหลังจากบันทึกแล้ว ให้ปรับหน้างานและบันทึกใหม่อีกครั้ง</div>
    ${noPosition ? `<div class="notice">วันนี้เป็น${isHolidayDate(date) ? 'วันหยุดราชการ' : 'วันเสาร์-อาทิตย์'} จึงไม่ต้องจัดตำแหน่งรายวัน</div>` : ''}
    ${!noPosition && hasOuting(date) ? `<div class="notice">วันนี้มีออกหน่วย: คนที่ถูกติ๊กในกิจกรรมจะถูกจัดลงชุดออกหน่วย ส่วนคนที่เหลือจะถูกเกลี่ยไปตำแหน่งห้อง Blood Bank</div>` : ''}
    ${noPosition ? empty('ไม่มีตารางตำแหน่งรายวันสำหรับวันนี้') : renderDailyPositionList(rows, date, canManage)}
  </div>`;
}
function renderDailyPositionList(rows, date, canManage) {
  const table = `<div class="table-wrap daily-position-table desktop-table"><table><thead><tr><th>โซน</th><th>ตำแหน่ง</th><th>เวลาพัก</th><th>ผู้รับผิดชอบ</th><th>ผู้ปฏิบัติหลัก</th><th>หน้าที่โดยย่อ</th></tr></thead><tbody>
    ${rows.map((r,idx) => {
      const baseCode = positionBaseCode(r.position_code || r.code);
      const base = positionTemplateByCode(baseCode, date) || r;
      return `<tr><td>${escapeHtml(r.zone || base.zone || '')}</td><td><b>${escapeHtml(positionLabelForCell(r.position_code || base.code))}</b></td><td>${escapeHtml(r.break_time || base.break_time || '')}</td><td>${canManage ? `<select data-position-row="${idx}" data-position-code="${escapeHtml(base.code || r.position_code)}" data-position-zone="${escapeHtml(r.zone || base.zone || '')}" data-position-break="${escapeHtml(r.break_time || base.break_time || '')}" data-position-rule="${escapeHtml(r.main_rule || base.main_rule || '')}" data-position-job="${escapeHtml(r.job_desc || base.job_desc || '')}"><option value="">-</option>${staffOptionList(r.staff_id, s => positionBaseCode(r.position_code)==='รอตรวจสอบ' || positionCandidateOk(s, { ...base, code: base.code || r.position_code, position_code: base.code || r.position_code, main_rule: r.main_rule || base.main_rule }, date))}</select>` : `${staffPill(r.staff_id)}`}</td><td>${escapeHtml(r.main_rule || base.main_rule || '')}</td><td>${escapeHtml(r.job_desc || base.job_desc || '')}</td></tr>`;
    }).join('')}
  </tbody></table></div>`;
  const cards = `<div class="mobile-position-list">${rows.map((r,idx) => {
    const baseCode = positionBaseCode(r.position_code || r.code);
    const base = positionTemplateByCode(baseCode, date) || r;
    const select = canManage ? `<select data-position-row="${idx}" data-position-code="${escapeHtml(base.code || r.position_code)}" data-position-zone="${escapeHtml(r.zone || base.zone || '')}" data-position-break="${escapeHtml(r.break_time || base.break_time || '')}" data-position-rule="${escapeHtml(r.main_rule || base.main_rule || '')}" data-position-job="${escapeHtml(r.job_desc || base.job_desc || '')}"><option value="">-</option>${staffOptionList(r.staff_id, s => positionBaseCode(r.position_code)==='รอตรวจสอบ' || positionCandidateOk(s, { ...base, code: base.code || r.position_code, position_code: base.code || r.position_code, main_rule: r.main_rule || base.main_rule }, date))}</select>` : `${staffPill(r.staff_id)}`;
    return `<div class="position-mobile-card"><div class="section-title"><h3>${escapeHtml(positionLabelForCell(r.position_code || base.code))}</h3>${badge(r.zone || base.zone || '-', r.zone === 'ออกหน่วย' ? 'red' : 'blue')}</div><div class="muted">พัก ${escapeHtml(r.break_time || base.break_time || '-')} • ${escapeHtml(r.main_rule || base.main_rule || '')}</div><label>ผู้รับผิดชอบ ${select}</label><p>${escapeHtml(r.job_desc || base.job_desc || '')}</p></div>`;
  }).join('')}</div>`;
  return table + cards;
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
    <div class="section-title"><div><h3>จัดตำแหน่งรายเดือน ${key}</h3></div></div>
    <div class="toolbar">
      <label>เดือน <input type="month" id="positionMonthInput" value="${key}"></label>
      <button class="soft-btn" data-generate-month-positions>สร้างแผนทั้งเดือน</button>
      <button class="primary-btn" data-save-month-positions>บันทึกแผนทั้งเดือน</button>
      <button class="ghost-btn danger" data-clear-month-positions>ล้างข้อมูลเดือนนี้</button>
      <button class="ghost-btn" data-restore-month-positions>ย้อนกลับข้อมูลล่าสุด</button>
      <span>${badge(`มีข้อมูล ${savedCount} รายการ`, savedCount ? 'green' : 'black')}</span>
      <span>${badge(`วันทำงาน ${workingDays} วัน`, 'blue')}</span>
    </div>
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
    <div class="section-title"><div><h3>ตารางตำแหน่งรายเดือน ${key}</h3><p class="hint">ดูแผนตำแหน่งรายเดือนที่ประกาศไว้</p></div></div>
    <div class="toolbar">
      <label>เดือน <input type="month" id="positionMonthViewInput" value="${key}"></label>
      <span>${badge(`ข้อมูล ${savedCount} รายการ`, savedCount ? 'green' : 'black')}</span>
      <span>${badge('อ่านอย่างเดียว', 'blue')}</span>
    </div>
    ${renderMonthPositionSummaryHint(rows, dates)}${renderMonthPositionMatrix(rows, dates)}
  </div>`;
}
function renderMonthPositionSummaryHint(rows, dates) {
  if (!rows.length) return '';
  const stats = buildMonthPositionSummary(rows, dates);
  const staffCount = Object.keys(stats).length;
  return `<div class="month-position-summary-hint compact-summary">
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
  if (!rows.length) return empty('ยังไม่มีแผนรายเดือน กด “สร้างแผนทั้งเดือน” ก่อน');
  const byCell = {};
  rows.forEach((r, idx) => {
    if (!r.staff_id || !r.work_date) return;
    const key = `${r.staff_id}|${r.work_date}`;
    byCell[key] = byCell[key] || [];
    byCell[key].push({ ...r, _idx: idx });
  });
  const canEdit = isAdmin() && state.page === 'positionMonth';
  const displayStaff = orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) || rows.some(r => r.staff_id === s.id)));
  return `<div class="monthly-matrix-wrap">
    <div class="matrix-legend"><span class="legend-box weekend"></span> WEEKEND/HOLIDAY = ไม่จัดตำแหน่ง <span class="legend-box outing"></span> ออกหน่วย <span class="legend-box leave"></span> มีลา/ไม่รับเวร ${canEdit ? '<span class="hint">Admin เลือกตำแหน่งในช่องได้ แล้วกดบันทึกแผนทั้งเดือน</span>' : ''}</div>
    <div class="table-wrap month-position-matrix"><table><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${dates.map(date => {
      const d = parseDate(date);
      const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : hasOuting(date) ? 'outing-head' : '';
      return `<th class="date-head ${cls}"><b>${d.getDate()}</b><br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`;
    }).join('')}</tr></thead><tbody>
      ${displayStaff.map(st => `<tr><td class="sticky-col staff-col staff-color-cell" style="background:${staffColor(st)};color:${textColorFor(staffColor(st))}"><button class="staff-summary-trigger" data-month-position-stat="${st.id}" type="button" title="ดูสรุปตำแหน่งรายเดือนของ ${escapeHtml(st.nickname || st.full_name)}"><b>${escapeHtml(st.nickname || st.full_name)}</b><br><small>${escapeHtml(st.staff_type || '')}</small><span>ดูสรุป</span></button></td>${dates.map(date => renderMonthPositionCell(st, date, byCell[`${st.id}|${date}`] || [], canEdit)).join('')}</tr>`).join('')}
    </tbody></table></div>
  </div>`;
}
function renderMonthPositionCell(staff, date, cellRows, canEdit=false) {
  const key = normalizeDateKey(date);
  const isWeekendDay = isWeekend(key);
  const isHolidayDay = isHolidayDate(key);
  if (isWeekendDay || isHolidayDay) {
    return `<td class="matrix-cell no-position-day ${isHolidayDay ? 'holiday-cell' : 'weekend-cell'}"><span>${isHolidayDay ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
  }
  const leaveRow = activeLeaveRecordOn(staff.id, key);
  const leaveType = leaveDisplayType(leaveRow);
  const leave = !!leaveRow && !isNoDutyLeaveType(leaveType);
  const outing = hasOuting(key);
  const row = cellRows[0] || null;
  const cleanCodes = cellRows.map(r => positionLabelForCell(r.position_code || r.code)).filter(Boolean);
  const cls = `${outing ? 'outing-cell' : ''} ${leave ? 'leave-cell ' + leaveCellClass(leaveType) : ''} ${!cleanCodes.length && !leave ? 'needs-review-cell' : ''}`.trim();
  if (canEdit && !leave) {
    const current = row?.position_code || '';
    return `<td class="matrix-cell ${cls}"><select class="month-position-select" data-month-position-edit="${key}|${staff.id}"><option value="">รอตรวจสอบ</option>${ALL_POSITION_TEMPLATES.map(t => `<option value="${escapeHtml(t.code)}" ${current===t.code?'selected':''}>${escapeHtml(positionLabelForCell(t.code))}</option>`).join('')}</select>${outing ? '<div class="cell-note">ออกหน่วย</div>' : ''}</td>`;
  }
  const text = cleanCodes.length ? cleanCodes.join('<br>') : (leave ? escapeHtml(leaveType) : 'รอตรวจสอบ');
  const leaveMark = leave ? '<div class="cell-note">ลางาน</div>' : '';
  const outingMark = outing && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : '';
  return `<td class="matrix-cell ${cls}"><span>${text}</span>${leaveMark}${outingMark}</td>`;
}
function ensureMonthPositionDraftForEdit() {
  const key = state.positionMonthKey || state.monthKey;
  if (state.monthPositionDraft?.monthKey === key) return;
  const existing = state.positions.filter(x => x.work_date?.startsWith(key));
  state.monthPositionDraft = { monthKey: key, rows: existing.map(r => ({ ...r })) };
}
function makeMonthPositionRow(date, staffId, code) {
  const base = positionTemplateByCode(code, date) || ALL_POSITION_TEMPLATES.find(t => t.code === code) || {};
  return { work_date: date, position_code: code, zone: base.zone || 'รอตรวจสอบ', break_time: base.break_time || '-', main_rule: base.main_rule || '', job_desc: base.job_desc || '', staff_id: staffId, updated_by: currentStaffId() };
}
function applyMonthPositionEdit(value, encoded) {
  if (!isAdmin()) return;
  const [date, staffId] = String(encoded || '').split('|');
  if (!date || !staffId) return;
  ensureMonthPositionDraftForEdit();
  let rows = state.monthPositionDraft.rows || [];
  const oldRow = rows.find(r => r.work_date === date && r.staff_id === staffId);
  const oldCode = oldRow?.position_code || '';
  const otherRow = value ? rows.find(r => r.work_date === date && r.position_code === value && r.staff_id && r.staff_id !== staffId) : null;
  rows = rows.filter(r => !(r.work_date === date && r.staff_id === staffId));
  if (otherRow && oldCode) {
    rows = rows.filter(r => r !== otherRow);
    rows.push(makeMonthPositionRow(date, otherRow.staff_id, oldCode));
  }
  if (value) rows.push(makeMonthPositionRow(date, staffId, value));
  state.monthPositionDraft.rows = rows;
  rebalanceMonthPositionDraft();
  renderPage();
  showToast(otherRow ? 'สลับตำแหน่งให้แล้ว กดบันทึกแผนทั้งเดือนเพื่อบันทึกจริง' : 'ปรับตำแหน่งในร่างแล้ว กดบันทึกแผนทั้งเดือนเพื่อบันทึกจริง');
}
function rebalanceMonthPositionDraft() {
  if (!state.monthPositionDraft?.rows) return;
  // เวอร์ชันนี้ยังไม่สลับตำแหน่งที่ Admin แก้เองทิ้ง แต่จะเติม/คงสถานะ “รอตรวจสอบ” เพื่อให้ Admin เห็นช่องที่ยังไม่สมดุลชัดเจน
  // รอบถัดไปสามารถต่อยอดเป็น swap อัตโนมัติได้โดยไม่กระทบข้อมูลเดิม
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
  const proxyOptions = selfPaidDutyProxyOptions(todayStr());
  const myDuty = state.rosterAssignments.some(x => x.duty_date === todayStr() && x.staff_id === currentStaffId());
  const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
  const mine = state.otRequests.filter(x => x.staff_id === currentStaffId());
  const rows = isAdmin() ? state.otRequests : mine;
  const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${DUTY_LABEL[x.assignment.duty_code] || x.assignment.duty_code}`).join('<br>')}</div>` : '';
  return `<div class="grid grid-2 ot-page">
    <div class="card ot-card">
      <h3>ส่วนที่ 1 ยืนยันวันอยู่เวร</h3>
      <p class="muted">${myDuty ? 'วันนี้มีชื่อคุณในตารางเวร' : proxyOptions.length ? 'วันนี้คุณเป็นผู้มาทำเวรแทนตามข้อตกลงกันเอง / จ่ายกันเอง' : 'วันนี้ยังไม่พบชื่อคุณในตารางเวร ถ้าลงจริงให้ Admin ตรวจตารางก่อน'}</p>
      ${proxyBox}
      <button class="primary-btn" data-check-in ${(!canCheckIn) ? 'disabled' : ''}>ยืนยันรับ OT / อยู่เวร</button>
      <p class="hint gps-help compact">ใช้ GPS เพื่อตรวจว่าอยู่ในพื้นที่โรงพยาบาลก่อนยืนยัน</p>
    </div>
    <div class="card ot-card">
      <h3>ส่วนที่ 2 ขอ OT เพิ่ม / เวรปั่นเลือด</h3>
      <p class="hint compact">ช4 และชั่วโมงเพิ่มของ ช3A/ช3B จะยังไม่คิดอัตโนมัติ ให้บันทึกเวลาจริง แล้ว Admin เทียบ LIS ก่อนอนุมัติ</p>
      <form id="otForm" class="form-grid">
        <label>วันที่ <input name="work_date" type="date" value="${todayStr()}" required></label>
        <label>เวลาสิ้นสุด <input name="end_time" type="time" required></label>
        <label>เหตุผล <select name="reason">${OT_REASONS.map(r => `<option>${r}</option>`).join('')}</select></label>
        <label>รายละเอียด <input name="note" placeholder="เช่น ปั่นเลือดถึง 18:20 / รอเทียบ LIS"></label>
        <button class="primary-btn wide" type="submit">ยืนยันขอ OT เพิ่ม</button>
      </form>
    </div>
    <div class="card wide-card" style="grid-column:1/-1;">
      <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div>
      ${renderOtTable(rows)}
    </div>
    <div class="card" style="grid-column:1/-1;">
      <h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว</p>${renderOtSummary()}
    </div>
  </div>`;
}

function otReportMonth() {
  return state.otApprovalMonthFilter || state.monthKey || monthKey(new Date());
}
function renderOtFilters() {
  const month = otReportMonth();
  const status = state.otApprovalStatusFilter || 'รออนุมัติ';
  const search = state.otApprovalSearch || '';
  return `<div class="ot-approval-filter no-print">
    <label>ค้นหา <input id="otApprovalSearch" type="search" value="${escapeHtml(search)}" placeholder="ชื่อ / วันที่ / เหตุผล"></label>
    <label>เดือน <input id="otApprovalMonthFilter" type="month" value="${escapeHtml(month)}"></label>
    <label>สถานะ <select id="otApprovalStatusFilter">
      <option value="รออนุมัติ" ${status==='รออนุมัติ'?'selected':''}>รออนุมัติ</option>
      <option value="อนุมัติ" ${status==='อนุมัติ'?'selected':''}>อนุมัติ</option>
      <option value="ไม่อนุมัติ" ${status==='ไม่อนุมัติ'?'selected':''}>ไม่อนุมัติ</option>
      <option value="ส่งกลับแก้ไข" ${status==='ส่งกลับแก้ไข'?'selected':''}>ส่งกลับแก้ไข</option>
      <option value="all" ${status==='all'?'selected':''}>ทั้งหมด</option>
    </select></label>
  </div>`;
}
function filteredOtRows(rows) {
  const month = otReportMonth();
  const status = state.otApprovalStatusFilter || 'รออนุมัติ';
  const search = String(state.otApprovalSearch || '').trim().toLowerCase();
  return rows.filter(r => {
    const workDate = normalizeDateKey(r.work_date);
    if (month && !workDate.startsWith(month)) return false;
    if (status !== 'all' && r.status !== status) return false;
    if (search) {
      const st = state.staff.find(s => String(s.id) === String(r.staff_id));
      const text = `${workDate} ${r.end_time || ''} ${r.reason || ''} ${r.note || ''} ${st?.nickname || ''} ${st?.full_name || ''}`.toLowerCase();
      if (!text.includes(search)) return false;
    }
    return true;
  }).sort((a,b) => normalizeDateKey(b.work_date).localeCompare(normalizeDateKey(a.work_date)) || String(b.created_at || '').localeCompare(String(a.created_at || '')));
}
function renderOtTable(rows) {
  const visible = (isAdmin() ? filteredOtRows(rows) : rows.slice().sort((a,b) => normalizeDateKey(b.work_date).localeCompare(normalizeDateKey(a.work_date)) || String(b.created_at || '').localeCompare(String(a.created_at || ''))));
  const filters = isAdmin() ? renderOtFilters() : '';
  if (!visible.length) return filters + empty(isAdmin() ? 'ยังไม่มีรายการ OT ตามตัวกรองนี้' : 'ยังไม่มีรายการ OT');
  const actionButtons = r => isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-';
  const statusBadge = r => badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black');
  const table = `<div class="table-wrap ot-desktop-table"><table><thead><tr><th>ชื่อ</th><th>วันที่ทำงาน</th><th>เวลาสิ้นสุด</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
    ${visible.map(r => `<tr><td>${staffPill(r.staff_id)}</td><td>${formatThaiDate(r.work_date)}</td><td>${escapeHtml(r.end_time || '-')}</td><td>${escapeHtml(r.reason || '')}<br><span class="muted">${escapeHtml(r.note || '')}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${statusBadge(r)}</td><td>${actionButtons(r)}</td></tr>`).join('')}
  </tbody></table></div>`;
  const cards = `<div class="mobile-cards ot-mobile-cards">${visible.map(r => `<div class="mobile-card"><div class="mobile-day-head">${staffPill(r.staff_id)}${statusBadge(r)}</div><div><b>${formatThaiDate(r.work_date)}</b><br><span class="muted">สิ้นสุด ${escapeHtml(r.end_time || '-')}</span></div><div><b>เหตุผล:</b> ${escapeHtml(r.reason || '')}<br><span class="muted">${escapeHtml(r.note || '')}</span></div><div><b>ชั่วโมง:</b> ${calcOtHours(r).toFixed(1)}</div>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : ''}</div>`).join('')}</div>`;
  return filters + table + cards;
}
function renderOtSummary() {
  const key = otReportMonth();
  const approved = state.otRequests.filter(x => normalizeDateKey(x.work_date).startsWith(key) && x.status === 'อนุมัติ');
  const map = {};
  approved.forEach(r => {
    const hours = calcOtHours(r);
    if (!Number.isFinite(hours) || hours <= 0) return;
    map[r.staff_id] = map[r.staff_id] || { hours:0, count:0 };
    map[r.staff_id].hours += hours;
    map[r.staff_id].count += 1;
  });
  const rows = Object.entries(map).sort((a,b) => staffNick(a[0]).localeCompare(staffNick(b[0]), 'th'));
  if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
  return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมง OT</th><th>จำนวนครั้ง</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${staffPill(id)}</td><td>${Number(r.hours || 0).toFixed(1)}</td><td>${r.count}</td></tr>`).join('')}</tbody></table></div>`;
}
function otStartHourForDate(date) {
  return (isWeekend(date) || isHolidayDate(date)) ? 17 : 16;
}
function calcOtHours(r) {
  const workDate = normalizeDateKey(r?.work_date);
  if (!workDate) return 0;
  if (String(r?.reason || '').includes('ยืนยันอยู่เวร')) {
    if (String(currentInchargeForMonth(workDate.slice(0,7))) === String(r?.staff_id)) return 8;
    const duties = (state.rosterAssignments || []).filter(a => String(a.staff_id) === String(r?.staff_id) && normalizeDateKey(a.duty_date) === workDate);
    if (duties.length) return duties.reduce((sum, a) => sum + Number(dutyMetrics(a)?.hours || 0), 0);
  }
  const endTime = String(r?.end_time || '').trim();
  if (!endTime) return 0;
  const time = endTime.length === 5 ? `${endTime}:00` : endTime;
  const start = new Date(`${workDate}T${pad(otStartHourForDate(workDate))}:00:00`);
  const end = new Date(`${workDate}T${time}`);
  const hours = (end - start) / 36e5;
  if (!Number.isFinite(hours) || hours < 0) return 0;
  return Math.round(hours * 10) / 10;
}

function getFilteredAuditLogs() {
  if (!state.auditDate) return state.auditLogs;
  return state.auditLogs.filter(a => toDateInput(new Date(a.created_at)) === state.auditDate);
}
function renderAuditPage() {
  const rows = getFilteredAuditLogs();
  const table = rows.length ? `<div class="table-wrap audit-desktop-table"><table><thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>เหตุการณ์</th><th>รายละเอียด</th></tr></thead><tbody>
      ${rows.map(a => `<tr><td>${formatThaiDateTime(a.created_at)}</td><td>${a.actor_id ? staffPill(a.actor_id) : '-'}</td><td>${badge(auditActionLabel(a), auditBadge(a))}</td><td>${escapeHtml(auditSummary(a))}<br><button class="tiny-btn" data-audit-detail="${a.id}">ดูรายละเอียด</button></td></tr>`).join('')}
    </tbody></table></div>` : empty('ยังไม่มี Audit Log ในวันที่เลือก');
  const cards = rows.length ? `<div class="mobile-cards audit-mobile-cards">${rows.map(a => `<div class="mobile-card audit-mobile-card"><div class="mobile-day-head"><b>${formatThaiDateTime(a.created_at)}</b>${badge(auditActionLabel(a), auditBadge(a))}</div><div><b>ผู้ทำ:</b> ${a.actor_id ? staffPill(a.actor_id) : '-'}</div><p>${escapeHtml(auditSummary(a))}</p><button class="tiny-btn" data-audit-detail="${a.id}">ดูรายละเอียด</button></div>`).join('')}</div>` : '';
  return `<div class="card audit-page-card">
    <div class="section-title"><div><h3>Audit Log ล่าสุด</h3><p class="hint">กรองเป็นรายวัน อ่านเป็นภาษาหน้างาน ไม่โชว์ข้อมูลหลังบ้านยาว ๆ ในตารางหลัก</p></div><button class="ghost-btn" data-export-audit-excel>Export Excel</button></div>
    <div class="toolbar audit-toolbar">
      <label>วันที่ <input type="date" id="auditDateInput" value="${state.auditDate || ''}"></label>
      <button class="soft-btn" data-audit-today>วันนี้</button>
      <button class="ghost-btn" data-audit-all>แสดงทั้งหมด</button>
    </div>
    ${table}${cards}
  </div>`;
}

function renderUsersPage() {
  if (!isAdmin()) return noPermission();
  const staffRows = orderedStaff(state.staff);
  if (!staffRows.length) return empty('ยังไม่มีผู้ใช้งาน');
  if (!state.usersStaffId || !staffRows.some(s => s.id === state.usersStaffId)) state.usersStaffId = staffRows[0].id;
  const selected = staffRows.find(s => s.id === state.usersStaffId) || staffRows[0];
  const userForm = (s) => `<div class="admin-user-card admin-user-single-card" data-staff-row="${s.id}">
    <div class="admin-user-head">
      <div class="admin-user-title">${staffPill(s)}<span>${escapeHtml(s.full_name || '')}</span></div>
      <button class="tiny-btn" data-reset-user-email="${escapeHtml(s.email || '')}">ส่ง reset</button>
    </div>
    <div class="admin-user-form">
      <label>สี <input class="color-input" type="color" data-field="staff_color" value="${escapeHtml(staffColor(s))}"></label>
      <label>ชื่อเล่น <input data-field="nickname" value="${escapeHtml(s.nickname || '')}"></label>
      <label>ชื่อ-สกุล <input data-field="full_name" value="${escapeHtml(s.full_name || '')}"></label>
      <label>Email <input data-field="email" value="${escapeHtml(s.email || '')}" placeholder="name@mahidol.ac.th"></label>
      <label>รหัสพนักงาน <input data-field="employee_code" value="${escapeHtml(s.employee_code || '')}"></label>
      <label>เบอร์โทร <input data-field="phone" value="${escapeHtml(s.phone || '')}" placeholder="เบอร์โทร"></label>
      <label>ชื่อผู้ใช้ <input data-field="login_name" value="${escapeHtml(s.login_name || '')}" placeholder="เว้นว่างได้"></label>
      <label>ประเภท <select data-field="staff_type"><option value="">-</option><option ${s.staff_type==='MT'?'selected':''}>MT</option><option ${s.staff_type==='เคิก'?'selected':''}>เคิก</option><option ${s.staff_type==='แพทย์'?'selected':''}>แพทย์</option></select></label>
      <label>ตำแหน่ง <input data-field="position" value="${escapeHtml(s.position || '')}"></label>
      <label>Role <select data-field="role"><option ${s.role==='staff'?'selected':''}>staff</option><option ${s.role==='admin'?'selected':''}>admin</option></select></label>
      <label>Active <select data-field="is_active"><option value="true" ${s.is_active?'selected':''}>true</option><option value="false" ${!s.is_active?'selected':''}>false</option></select></label>
      <label>สถานะจัดเวร <select data-field="roster_enabled"><option value="true" ${s.roster_enabled!==false?'selected':''}>true</option><option value="false" ${s.roster_enabled===false?'selected':''}>false</option></select></label>
      <label class="long-leave-field">สถานะลาระยะยาว <select data-field="is_long_term_leave"><option value="false" ${s.is_long_term_leave===true?'':'selected'}>ปิด / ใช้งานปกติ</option><option value="true" ${s.is_long_term_leave===true?'selected':''}>เปิด / ลาระยะยาว</option></select></label>
      <label>สถานะตำแหน่งรายวัน <select data-field="position_training_status">${POSITION_TRAINING_STATUSES.map(v => `<option value="${escapeHtml(v)}" ${(s.position_training_status || 'ใช้งานปกติ')===v?'selected':''}>${escapeHtml(v)}</option>`).join('')}</select></label>
      <label>Auto ตำแหน่ง <select data-field="daily_position_enabled"><option value="true" ${s.daily_position_enabled!==false?'selected':''}>true</option><option value="false" ${s.daily_position_enabled===false?'selected':''}>false</option></select></label>
      <input type="hidden" data-field="maternity_status" value="${s.maternity_status ? 'true' : 'false'}">
    </div>
    <div class="long-leave-admin-actions">
      <button type="button" class="soft-btn warning" data-v140-reset-balance="${escapeHtml(s.id)}">รีเซ็ตยอดสะสมเป็น 0</button>
      <span class="hint">ใช้ตอนกลับจากลาคลอด/ลาระยะยาว หรือรับพนักงานใหม่ เพื่อเริ่มยอดชดเชยใหม่ที่ 0</span>
    </div>
  </div>`;
  return `<div class="grid eligibility-page users-page-v49">
    <div class="card eligibility-staff-panel">
      <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
      <label>เจ้าหน้าที่
        <select id="usersStaffSelect">${staffRows.map(s => `<option value="${s.id}" ${selected.id===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select>
      </label>
      <div class="selected-staff-card" style="--staff-bg:${staffColor(selected)};--staff-fg:${textColorFor(staffColor(selected))}">
        <div class="big-staff-name">${escapeHtml(selected.nickname || selected.full_name)}</div>
        <div>${escapeHtml(selected.full_name || '')}</div>
        <small>${escapeHtml(selected.staff_type || '-')} • ${escapeHtml(selected.role || '-')} • ${selected.is_active ? 'Active' : 'Inactive'}</small>
      </div>
      <details class="add-user-details">
        <summary>เพิ่มผู้ใช้งานใหม่</summary>
        <form id="newStaffForm" class="form-grid compact-form">
          <label>ชื่อเล่น <input name="nickname" required></label>
          <label>ชื่อ-สกุล <input name="full_name" required></label>
          <label>Email Mahidol <input name="email" placeholder="name@mahidol.ac.th" required></label>
          <label>ชื่อผู้ใช้ <input name="login_name" placeholder="เว้นว่างไว้ ให้เจ้าหน้าที่มาตั้งเอง"></label>
          <label>รหัสพนักงาน <input name="employee_code"></label>
          <label>ประเภท <select name="staff_type"><option>MT</option><option>เคิก</option><option>แพทย์</option></select></label>
          <label>ตำแหน่ง <input name="position" value="MT"></label>
          <label>เบอร์โทร <input name="phone" placeholder="เช่น 085-xxx-xxxx"></label>
          <label>Role <select name="role"><option>staff</option><option>admin</option></select></label>
          <label>สีประจำตัว <input name="staff_color" type="color" value="#e8f3ff"></label>
          <button class="primary-btn" type="submit">เพิ่มผู้ใช้งาน</button>
        </form>
      </details>
    </div>
    <div class="card eligibility-position-panel">
      <div class="section-title users-save-title"><div><h3>ข้อมูลและสิทธิ์ของ ${escapeHtml(selected.nickname || selected.full_name)}</h3></div><button class="primary-btn" data-save-staff-users>บันทึกข้อมูลผู้ใช้งาน</button></div>
      ${userForm(selected)}
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
      <div class="section-title"><h3>เลือกเจ้าหน้าที่</h3></div>
      <label>เจ้าหน้าที่
        <select id="eligibilityStaffSelect">${activeStaff.map(s => `<option value="${s.id}" ${selected.id===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select>
      </label>
      <div class="selected-staff-card" style="--staff-bg:${staffColor(selected)};--staff-fg:${textColorFor(staffColor(selected))}">
        <div class="big-staff-name">${escapeHtml(selected.nickname || selected.full_name)}</div>
        <div>${escapeHtml(selected.full_name || '')}</div>
        <small>${escapeHtml(selected.staff_type || '-')} • ${escapeHtml(selected.position_training_status || 'ใช้งานปกติ')}</small>
      </div>
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

function handleGlobalChromeClick(e) {
  if (isMobileView() && document.body.classList.contains('sidebar-open')) {
    const sidebar = $('sidebar');
    const btn = $('mobileMenuBtn');
    if (sidebar && !sidebar.contains(e.target) && btn && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  }
}
async function handleSubmit(e) {
  if (e.target.id === 'leaveForm') { e.preventDefault(); await saveLeave(e.target); }
  if (e.target.id === 'activityForm') { e.preventDefault(); await saveActivity(e.target); }
  if (e.target.classList.contains('hr-form')) { e.preventDefault(); await saveHrCheck(e.target); }
  if (e.target.id === 'otForm') { e.preventDefault(); await saveOtRequest(e.target); }
  if (e.target.id === 'dutyTradeForm') { e.preventDefault(); await saveTradeRequest(e.target); }
  if (e.target.id === 'newStaffForm') { e.preventDefault(); await saveNewStaff(e.target); }
  if (e.target.id === 'profileChangeForm') { e.preventDefault(); await saveProfileChangeRequest(e.target); }
  if (e.target.id === 'holidayForm') { e.preventDefault(); await saveHoliday(e.target); }
}
async function handleClick(e) {
  const t = e.target.closest('button, [data-day-detail], [data-staff-stat]');
  if (!t) return;
  if (t.hasAttribute('data-app-alert-ok')) { closeModal(); return; }
  if (t.dataset.page) { state.page = t.dataset.page; $('sidebar').classList.remove('open'); document.body.classList.remove('sidebar-open'); renderPage(); return; }
  if (t.dataset.calView) { state.calendarView = t.dataset.calView; renderPage(); return; }
  if (t.dataset.calNav) { calendarNav(t.dataset.calNav); renderPage(); return; }
  if (t.dataset.dayDetail) { showDayDetail(t.dataset.dayDetail); return; }
  if (t.hasAttribute('data-toggle-mobile-calendar')) { state.mobileCalendarAll = !state.mobileCalendarAll; renderPage(); return; }
  if (t.dataset.editLeave) { state.editingLeaveId = t.dataset.editLeave; renderPage(); return; }
  if (t.hasAttribute('data-cancel-edit-leave')) { state.editingLeaveId = null; renderPage(); return; }
  if (t.dataset.cancelLeave) { await cancelLeave(t.dataset.cancelLeave); return; }
  if (t.dataset.requestCancelLeave) { await requestCancelLeave(t.dataset.requestCancelLeave); return; }
  if (t.dataset.deleteLeave) { await deleteLeave(t.dataset.deleteLeave); return; }
  if (t.dataset.editActivity) { state.editingActivityId = t.dataset.editActivity; renderPage(); return; }
  if (t.hasAttribute('data-cancel-edit-activity')) { state.editingActivityId = null; renderPage(); return; }
  if (t.dataset.deleteActivity) { await deleteActivity(t.dataset.deleteActivity); return; }
  if (t.hasAttribute('data-generate-roster')) { state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) }; renderPage(); return; }
  if (t.hasAttribute('data-auto-assign')) { autoAssignRoster(); renderPage(); return; }
  if (t.hasAttribute('data-save-roster')) { await saveRosterDraft('draft'); return; }
  if (t.hasAttribute('data-clear-roster-month')) { await clearRosterMonth(); return; }
  if (t.hasAttribute('data-restore-roster-month')) { state.rosterDraft = null; await loadAllData(); renderPage(); showToast('ย้อนกลับข้อมูลล่าสุดแล้ว'); return; }
  if (t.hasAttribute('data-publish-roster')) { await saveRosterDraft('published'); return; }
  if (t.hasAttribute('data-lock-roster')) { await saveRosterDraft('locked'); return; }
  if (t.dataset.clearSlot) { updateDraftSlot(t.dataset.clearSlot, { staff_id:null }); renderPage(); return; }
  if (t.dataset.toggleLockSlot) { const slot = findDraftSlot(t.dataset.toggleLockSlot); updateDraftSlot(t.dataset.toggleLockSlot, { is_locked: !slot?.is_locked }); renderPage(); return; }
  if (t.dataset.scheduleMobileView) { state.scheduleMobileView = t.dataset.scheduleMobileView; renderPage(); return; }
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
  if (t.hasAttribute('data-generate-month-positions')) { state.monthPositionDraft = buildMonthlyPositionDraft(state.positionMonthKey || state.monthKey); renderPage(); showToast('สร้างแผนตำแหน่งรายเดือนแล้ว ตรวจทานก่อนบันทึก'); return; }
  if (t.hasAttribute('data-save-month-positions')) { await saveMonthlyPositions(); return; }
  if (t.hasAttribute('data-clear-month-positions')) { await clearMonthlyPositions(); return; }
  if (t.hasAttribute('data-restore-month-positions')) { state.monthPositionDraft = null; await loadAllData(); renderPage(); showToast('ย้อนกลับข้อมูลล่าสุดแล้ว'); return; }
  if (t.hasAttribute('data-check-in')) { await checkIn(); return; }
  if (t.dataset.otStatus) { const [id,status] = t.dataset.otStatus.split('|'); await updateOtStatus(id,status); return; }
  if (t.hasAttribute('data-export-ot-excel')) { exportTable('otSummaryTable', `OT_${state.monthKey}.xlsx`); return; }
  if (t.hasAttribute('data-export-audit-excel')) { exportAuditExcel(); return; }
  if (t.hasAttribute('data-audit-today')) { state.auditDate = todayStr(); renderPage(); return; }
  if (t.hasAttribute('data-audit-all')) { state.auditDate = ''; renderPage(); return; }
  if (t.hasAttribute('data-save-staff-users')) { await saveStaffUsers(); return; }
  if (t.hasAttribute('data-save-position-eligibility')) { await savePositionEligibility(); return; }
  if (t.dataset.resetUserEmail !== undefined) { await resetUserPassword(t.dataset.resetUserEmail); return; }
  if (t.dataset.approveProfileRequest) { await reviewProfileChangeRequest(t.dataset.approveProfileRequest, 'approved'); return; }
  if (t.dataset.rejectProfileRequest) { await reviewProfileChangeRequest(t.dataset.rejectProfileRequest, 'rejected'); return; }
  if (t.dataset.hrRevert) { await revertHrCheck(t.dataset.hrRevert); return; }
  if (t.dataset.auditDetail) { showAuditDetail(t.dataset.auditDetail); return; }
}
function handleChange(e) {
  if (e.target.id === 'rosterMonthInput' || e.target.id === 'scheduleMonthInput') { state.monthKey = e.target.value; state.rosterDraft = null; renderPage(); }
  if (e.target.id === 'positionDateInput') { state.positionDate = e.target.value; renderPage(); }
  if (e.target.id === 'auditDateInput') { state.auditDate = e.target.value; renderPage(); }
  if (e.target.id === 'eligibilityStaffSelect') { state.eligibilityStaffId = e.target.value; renderPage(); }
  if (e.target.id === 'usersStaffSelect') { state.usersStaffId = e.target.value; renderPage(); }
  if (e.target.id === 'positionMonthInput') { state.positionMonthKey = e.target.value; state.monthPositionDraft = null; renderPage(); }
  if (e.target.id === 'positionMonthViewInput') { state.positionMonthViewKey = e.target.value; renderPage(); }
  if (e.target.id === 'tradeFilterStaff') { state.tradeFilterStaff = e.target.value; renderPage(); }
  if (e.target.id === 'schedulePersonFilter') { state.schedulePersonFilter = e.target.value; renderPage(); }
  if (e.target.id === 'hrFilterStaff') { state.hrFilterStaff = e.target.value; renderPage(); }
  if (e.target.id === 'hrFilterMonth') { state.hrFilterMonth = e.target.value; renderPage(); }
  if (e.target.id === 'hrSummaryFilterStaff') { state.hrSummaryFilterStaff = e.target.value; renderPage(); }
  if (e.target.id === 'hrSummaryFilterMonth') { state.hrSummaryFilterMonth = e.target.value; renderPage(); }
  if (e.target.id === 'otApprovalSearch') { state.otApprovalSearch = e.target.value || ''; renderPage(); }
  if (e.target.id === 'otApprovalMonthFilter') { state.otApprovalMonthFilter = e.target.value || state.monthKey; renderPage(); }
  if (e.target.id === 'otApprovalStatusFilter') { state.otApprovalStatusFilter = e.target.value || 'รออนุมัติ'; renderPage(); }
  if (e.target.id === 'leaveStaffSelect') { const inp = document.getElementById('leaveContactPhone'); if (inp && !state.editingLeaveId) inp.value = staffPhone(e.target.value) || ''; }
  if (e.target.dataset.monthPositionEdit) { applyMonthPositionEdit(e.target.value, e.target.dataset.monthPositionEdit); return; }
  if (e.target.id === 'tradeTypeSelect') { updateTradeSwapVisibility(); }
  if (e.target.id === 'tradeReceiverSelect') {
    const sel = document.getElementById('tradeSwapSelect');
    if (sel) Array.from(sel.options).forEach(opt => { if (!opt.value) return; opt.hidden = opt.dataset.owner !== e.target.value; });
    if (sel) sel.value = '';
  }
  if (e.target.dataset.rosterSlotSelect) {
    const id = e.target.dataset.rosterSlotSelect;
    const slot = findDraftSlot(id);
    const staffId = e.target.value || null;
    if (slot?.is_locked) return showToast('ช่องนี้ล็อกอยู่');
    if (staffId && !canStaffWorkSlot(staffId, slot)) {
      if (isConsecutiveRestrictedDuty(slot?.duty_code) && hasAdjacentDuty(staffId, slot.duty_date, getAssignmentsForMonth(state.monthKey), slot)) showToast('คนนี้มีเวร ชบด ติดกับวันก่อน/วันถัดไปแล้ว กรุณาเลือกคนอื่น');
      else showToast('คนนี้ติดลา/ไม่รับเวร หรือประเภทไม่ตรงกับเวร');
      renderPage();
      return;
    }
    updateDraftSlot(id, { staff_id: staffId });
    renderPage();
    return;
  }
}

function handleInput(e) {
  if (e.target.id === 'otApprovalSearch') {
    state.otApprovalSearch = e.target.value || '';
    clearTimeout(state.otApprovalSearchTimer);
    state.otApprovalSearchTimer = setTimeout(() => renderPage(), 180);
  }
}
document.addEventListener('input', handleInput, true);

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
  if (!isAdmin()) {
    if (row.start_date < todayStr()) return showToast('Staff ไม่สามารถบันทึกย้อนหลังได้ กรุณาให้ Admin บันทึกแทน');
    if (row.type === 'ไม่รับเวร' && requestedDates.some(isNoDutyLockedForDate)) {
      return showToast('พ้นกำหนดแก้ไข “ไม่รับเวร” ของเดือนนี้แล้ว กรุณาแจ้งอินชาร์จหรือหัวหน้าให้บันทึกแทน');
    }
  }
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
    res = await sb.rpc('admin_upsert_leave_v32', {
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
      p_recorded_by_admin: true
    });
    // เผื่อยังไม่ได้ Run patch V32 หรือ RPC มีปัญหา ให้ลองบันทึกตรงผ่าน policy admin เป็น fallback
    if (res.error && (String(res.error.message || '').includes('admin_upsert_leave_v32') || String(res.error.message || '').includes('Could not find the function') || String(res.error.message || '').includes('schema cache'))) {
      const directRow = { ...row, recorded_by_admin: true, admin_record_reason: adminReason || row.admin_record_reason || 'Admin บันทึกแทน', updated_by: currentStaffId() };
      res = id
        ? await sb.from('leave_requests').update(directRow).eq('id', id)
        : await sb.from('leave_requests').insert({ ...directRow, created_by: currentStaffId(), status: 'active' });
    }
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
  if (!isAdmin()) return showToast('Staff ไม่สามารถยกเลิกรายการลาเองได้ กรุณาส่งคำขอยกเลิกวันลา');
  if (!(await confirmDialog('ยืนยันยกเลิกรายการนี้?', 'ยืนยันการยกเลิก'))) return;
  const { error } = await sb.from('leave_requests').update({ status:'cancelled', updated_by: currentStaffId() }).eq('id', id);
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast('ยกเลิกแล้ว');
}
async function requestCancelLeave(id) {
  const row = state.leaves.find(x => String(x.id) === String(id));
  if (!row || String(row.staff_id) !== String(currentStaffId())) return showToast('ส่งคำขอยกเลิกได้เฉพาะรายการของตัวเอง');
  if (row.status === 'cancelled') return showToast('รายการนี้ถูกยกเลิกแล้ว');
  if (isLeaveCancellationRequested(row)) return showToast('ส่งคำขอยกเลิกไว้แล้ว รอ Admin พิจารณา');
  if (!(await confirmDialog('ระบบจะไม่ลบรายการลา แต่จะส่งคำขอให้ Admin พิจารณายกเลิก ต้องการดำเนินการใช่ไหม?', 'ส่งคำขอยกเลิกวันลา'))) return;
  const { error } = await sb.from('leave_requests').update({ status:'รออนุมัติยกเลิก', updated_by: currentStaffId() }).eq('id', id).eq('staff_id', currentStaffId());
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast('ส่งคำขอยกเลิกวันลาแล้ว');
}
async function deleteLeave(id) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้นที่ลบทิ้งได้');
  if (!(await confirmDialog('ลบทิ้งจะหายจากรายการใช้งานทันที แต่ Audit Log ยังเก็บประวัติไว้ ต้องการลบทิ้งใช่ไหม?', 'ยืนยันลบทิ้ง'))) return;
  const { error } = await sb.from('leave_requests').delete().eq('id', id);
  if (error) return showToast(friendlyDbError(error));
  state.editingLeaveId = null;
  await loadAllData(); renderPage(); showToast('ลบทิ้งแล้ว');
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
  if (row.event_type === 'ออกหน่วย' && !participants.length) requiredMissing.push('ผู้เข้าร่วมสำหรับออกหน่วย');
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
  if (!(await confirmDialog('ลบกิจกรรมนี้?'))) return;
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
async function revertHrCheck(id) {
  if (!(await confirmDialog('ย้อนกลับรายการนี้ให้กลับไปตรวจสอบ HR ใหม่?'))) return;
  const { error } = await sb.from('hr_checks').update({ status:'รอตรวจสอบ', checked_by: currentStaffId(), checked_at: new Date().toISOString(), note:'ย้อนกลับให้ตรวจสอบใหม่' }).eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ย้อนกลับแล้ว');
}

function handleDragStart(e) { const chip = e.target.closest('[data-drag-staff]'); if (chip) e.dataTransfer.setData('staffId', chip.dataset.dragStaff); }
function handleDragOver(e) { const slot = e.target.closest('[data-drop-slot]'); if (slot) { e.preventDefault(); slot.classList.add('drag-over'); } }
function handleDragLeave(e) { const slot = e.target.closest('[data-drop-slot]'); if (slot) slot.classList.remove('drag-over'); }
function handleDrop(e) {
  const slotEl = e.target.closest('[data-drop-slot]');
  if (!slotEl) return;
  e.preventDefault();
  slotEl.classList.remove('drag-over');

  const staffId = e.dataTransfer?.getData('staffId');
  const slotId = slotEl.dataset.dropSlot;
  if (!staffId || !slotId) return;

  const target = findDraftSlot(slotId);
  if (!target) return;
  if (target.is_locked) return showToast('ช่องนี้ล็อกอยู่');
  if (isRosterDropBlocked(target)) return showToast('ช่องนี้เป็นวันหยุด/WEEKEND ที่ปิดไว้ จึงไม่รับการลากวาง');

  const currentAssignments = cloneRosterAssignmentsForDraft();
  const targetForValidation = currentAssignments.find(x => (x.id || x._temp_id) === slotId) || target;
  if (!canStaffWorkSlot(staffId, targetForValidation, currentAssignments)) {
    if (isConsecutiveRestrictedDuty(targetForValidation?.duty_code) && hasAdjacentDuty(staffId, targetForValidation.duty_date, currentAssignments, targetForValidation)) return showToast('คนนี้มีเวร ชบด ติดกับวันก่อน/วันถัดไปแล้ว กรุณาเลือกคนอื่น');
    return showToast('คนนี้ติดลา/ไม่รับเวร หรือประเภทไม่ตรงกับเวร');
  }

  const scrollSnapshot = captureRosterScroll(slotEl);
  updateDraftSlot(slotId, { staff_id: staffId }, currentAssignments);
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
function cloneDeepPlain(value) {
  try { return structuredClone(value || []); }
  catch (err) { return JSON.parse(JSON.stringify(value || [])); }
}
function cloneRosterAssignmentsForDraft() {
  const source = state.rosterDraft?.monthKey === state.monthKey ? state.rosterDraft.assignments : getAssignmentsForMonth(state.monthKey);
  return cloneDeepPlain(source || []);
}
function findDraftSlot(id) { const a = getAssignmentsForMonth(state.monthKey) || []; return a.find(x => (x.id || x._temp_id) === id); }
function isRosterDropBlocked(slot) {
  if (!slot) return true;
  if (slot.is_locked || slot.is_closed || slot.closed || slot.disabled) return true;
  const allowed = allowedDutyCodesForDate(slot.duty_date || '') || [];
  return !allowed.includes(slot.duty_code);
}
function updateDraftSlot(id, patch, clonedAssignments = null) {
  const assignments = clonedAssignments || cloneRosterAssignmentsForDraft();
  const idx = assignments.findIndex(x => (x.id || x._temp_id) === id);
  if (idx < 0) return false;
  assignments[idx] = { ...assignments[idx], ...patch };
  state.rosterDraft = { monthKey: state.monthKey, assignments };
  return true;
}
function rebalanceRosterAfterManualChange(changedSlotId) {
  if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) return;
  const assignments = state.rosterDraft.assignments || [];
  const changed = assignments.find(x => (x.id || x._temp_id) === changedSlotId);
  if (!changed?.staff_id) return;
  // ปรับสมดุลแบบไม่ลบสิ่งที่ Admin เพิ่งวาง: ดูช่องว่าง/ช่องที่ยังไม่ล็อก แล้วเติมคนที่ภาระรวมต่ำก่อน
  const counts = calcFairness(assignments.filter(x => x.staff_id));
  assignments.forEach(slot => {
    if (slot.is_locked || slot.staff_id) return;
    const candidates = state.staff
      .filter(s => isRosterEnabled(s) && supportsRequiredRole(s, slot.required_role))
      .filter(s => !state.leaves.some(l => l.staff_id === s.id && overlapsDate(l, slot.duty_date)))
      .filter(s => !hasSameDayDuty(s.id, slot.duty_date, assignments, slot))
      .filter(s => !hasAdjacentDuty(s.id, slot.duty_date, assignments, slot));
    candidates.sort((a,b) => {
      const ca = counts[a.id] || { total:0, hours:0, pay:0, weekend:0 };
      const cb = counts[b.id] || { total:0, hours:0, pay:0, weekend:0 };
      return ((ca.pay||0)-(cb.pay||0)) || ((ca.hours||0)-(cb.hours||0)) || ((ca.weekend||0)-(cb.weekend||0)) || ((ca.total||0)-(cb.total||0)) || compareStaffOrder(a,b);
    });
    if (candidates[0]) {
      slot.staff_id = candidates[0].id;
      const dm = dutyMetrics(slot, candidates[0].id);
      const c = counts[candidates[0].id] = counts[candidates[0].id] || { total:0, hours:0, pay:0, weekend:0 };
      c.total++; c.hours = (c.hours||0)+dm.hours; c.pay = (c.pay||0)+dm.pay;
      if (isWeekend(slot.duty_date) || isHolidayDate(slot.duty_date)) c.weekend = (c.weekend||0)+1;
    }
  });
}

function autoAssignRoster() {
  if (!state.rosterDraft || state.rosterDraft.monthKey !== state.monthKey) state.rosterDraft = { monthKey: state.monthKey, assignments: generateEmptyAssignments(state.monthKey) };
  const assignments = state.rosterDraft.assignments;
  const counts = calcFairness(assignments.filter(x => x.staff_id));
  let blockedByConsecutive = 0;
  let unfilled = 0;
  assignments.forEach(slot => {
    if (slot.is_locked || slot.staff_id) return;
    const wk = weekKeyOf(slot.duty_date);
    const baseCandidates = state.staff.filter(s => isRosterEnabled(s) && supportsRequiredRole(s, slot.required_role) && !state.leaves.some(l => l.staff_id === s.id && overlapsDate(l, slot.duty_date)) && !hasSameDayDuty(s.id, slot.duty_date, assignments, slot));
    const candidates = baseCandidates.filter(s => !hasAdjacentDuty(s.id, slot.duty_date, assignments, slot));
    if (!candidates.length && baseCandidates.length) blockedByConsecutive++;
    candidates.sort((a,b) => {
      const ca = counts[a.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
      const cb = counts[b.id] || { total:0, weekend:0, hours:0, weekCounts:{} };
      return ((ca.pay || 0) - (cb.pay || 0)) || (ca.hours - cb.hours) || ((ca.weekCounts[wk]||0) - (cb.weekCounts[wk]||0)) || (ca.weekend - cb.weekend) || (ca.total - cb.total);
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
    } else {
      unfilled++;
    }
  });
  if (unfilled) showToast(`Auto Assign แล้ว แต่เหลือ ${unfilled} ช่องที่ยังจัดไม่ได้ เพราะติดเงื่อนไขลา/ประเภทเวร/ห้าม ชบด ติดกัน`);
  else showToast('Auto Assign แล้ว โดยกันไม่ให้ ชบด1/ชบด2/ชบด3 ติดกัน ส่วน ช4 จัดติดกันได้ตามปกติ');
}
function hasSameDayDuty(staffId, date, assignments = [], excludeSlot = null) {
  const ex = excludeSlot ? (excludeSlot.id || excludeSlot._temp_id) : null;
  const inDraft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || (a.id || a._temp_id) !== ex));
  const inSaved = state.rosterAssignments.some(a => a.staff_id === staffId && a.duty_date === date && (!ex || (a.id || a._temp_id) !== ex));
  return inDraft || inSaved;
}
function isConsecutiveRestrictedDuty(code) { return ['ชบด1','ชบด2','ชบด3'].includes(String(code || '')); }
function hasAdjacentDuty(staffId, date, assignments = [], excludeSlot = null) {
  if (excludeSlot && !isConsecutiveRestrictedDuty(excludeSlot.duty_code)) return false;
  const d = parseDate(date);
  const prev = new Date(d); prev.setDate(d.getDate() - 1);
  const next = new Date(d); next.setDate(d.getDate() + 1);
  const prevStr = toDateInput(prev), nextStr = toDateInput(next);
  return hasRestrictedDutyOnDate(staffId, prevStr, assignments, excludeSlot) || hasRestrictedDutyOnDate(staffId, nextStr, assignments, excludeSlot);
}
function hasDutyOnDate(staffId, date, assignments = [], excludeSlot = null) {
  const ex = excludeSlot ? (excludeSlot.id || excludeSlot._temp_id) : null;
  const inDraft = (assignments || []).some(a => a.staff_id === staffId && a.duty_date === date && (!ex || (a.id || a._temp_id) !== ex));
  const inSaved = state.rosterAssignments.some(a => a.staff_id === staffId && a.duty_date === date && (!ex || (a.id || a._temp_id) !== ex));
  return inDraft || inSaved;
}
function hasRestrictedDutyOnDate(staffId, date, assignments = [], excludeSlot = null) {
  const ex = excludeSlot ? (excludeSlot.id || excludeSlot._temp_id) : null;
  const isMatch = a => a && String(a.staff_id) === String(staffId) && normalizeDateKey(a.duty_date) === date && isConsecutiveRestrictedDuty(a.duty_code) && (!ex || (a.id || a._temp_id) !== ex);
  return (assignments || []).some(isMatch) || (state.rosterAssignments || []).some(isMatch);
}
function canStaffWorkSlot(staffId, slot, assignments = getAssignmentsForMonth(state.monthKey)) {
  const s = state.staff.find(x => x.id === staffId);
  if (!isRosterEnabled(s)) return false;
  if (!supportsRequiredRole(s, slot.required_role)) return false;
  const blocked = !!activeLeaveRecordOn(staffId, slot.duty_date);
  if (blocked) return false;
  if (hasSameDayDuty(staffId, slot.duty_date, assignments, slot)) return false;
  if (isConsecutiveRestrictedDuty(slot?.duty_code) && hasAdjacentDuty(staffId, slot.duty_date, assignments, slot)) return false;
  return true;
}
function adjacentDutyPenalty(staffId, date, assignments) {
  return hasAdjacentDuty(staffId, date, assignments) ? 1 : 0;
}
function isWeekend(date) { const d = parseDate(date).getDay(); return d === 0 || d === 6; }

async function clearRosterMonth() {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const key = state.monthKey;
  if (!(await confirmDialog(`ล้างตารางเวรเดือน ${key} ทั้งหมดหรือไม่?`, 'ยืนยันล้างข้อมูล'))) return;
  const { y, m } = getMonthRange(key);
  const month = state.rosterMonths.find(x => x.year === y && x.month === m);
  if (month?.id) {
    const delA = await sb.from('roster_assignments').delete().eq('roster_month_id', month.id);
    if (delA.error) return showToast(friendlyDbError(delA.error));
    const delM = await sb.from('roster_months').delete().eq('id', month.id);
    if (delM.error) return showToast(friendlyDbError(delM.error));
  }
  state.rosterDraft = null;
  await loadAllData();
  renderPage();
  showToast('ล้างตารางเวรเดือนนี้แล้ว');
}

async function clearMonthlyPositions() {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const key = state.positionMonthKey || state.monthKey;
  if (!(await confirmDialog(`ล้างแผนตำแหน่งรายเดือน ${key} ทั้งหมดหรือไม่?`, 'ยืนยันล้างข้อมูล'))) return;
  const { start, end } = getMonthRange(key);
  const del = await sb.from('daily_positions').delete().gte('work_date', start).lte('work_date', end);
  if (del.error) return showToast(friendlyDbError(del.error));
  const st = await sb.from('daily_position_day_status').delete().gte('work_date', start).lte('work_date', end);
  if (st.error) return showToast(friendlyDbError(st.error));
  state.monthPositionDraft = null;
  await loadAllData();
  renderPage();
  showToast('ล้างแผนตำแหน่งเดือนนี้แล้ว');
}

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
  renderPage(); showToast('บันทึกแผนตำแหน่งรายเดือนแล้ว ข้อมูลหลังบันทึกจะตรงกับร่างที่เห็นก่อนกดบันทึก');
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
  if (!pos.ok) return showGpsHelp(pos.message);
  if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
  const proxyOptions = selfPaidDutyProxyOptions(todayStr());
  let staffIdToLog = currentStaffId();
  let proxyText = '';
  if (!state.rosterAssignments.some(x => x.duty_date === todayStr() && x.staff_id === currentStaffId()) && proxyOptions.length) {
    const pick = proxyOptions[0];
    staffIdToLog = pick.assignment.staff_id;
    proxyText = ` | ลงชื่อแทนโดย ${staffNick(currentStaffId())} จากข้อตกลงจ่ายกันเอง request:${pick.request.id}`;
  }
  const device = (navigator.userAgent + proxyText).slice(0, 250);
  const { error } = await sb.from('attendance_logs').insert({ staff_id: staffIdToLog, duty_date: todayStr(), check_in_at: new Date().toISOString(), lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device });
  if (error) return showToast(error.message);
  const alreadyRequested = (state.otRequests || []).some(r => String(r.staff_id) === String(staffIdToLog) && normalizeDateKey(r.work_date) === todayStr() && String(r.reason || '').includes('ยืนยันอยู่เวร'));
  if (!alreadyRequested) {
    const isIncharge = String(currentInchargeForMonth(todayStr().slice(0,7))) === String(staffIdToLog);
    const otRow = { staff_id: staffIdToLog, work_date: todayStr(), end_time: '', reason: 'ยืนยันอยู่เวรตามตาราง', note: isIncharge ? 'ระบบคิด OT อินชาร์จประจำเดือน 8 ชั่วโมงอัตโนมัติ' : 'สร้างจากส่วนที่ 1 ยืนยันอยู่เวร', status: 'รออนุมัติ', lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device };
    const ot = await sb.from('ot_requests').insert(otRow);
    if (ot.error) showToast(`ลงชื่อสำเร็จ แต่สร้างรายการ OT ไม่สำเร็จ: ${ot.error.message}`, { tone:'error' });
  }
  await loadAllData(); renderPage();
  showToast(proxyText ? 'ยืนยันวันอยู่เวรแทนเจ้าของเวรเดิมและส่งรายการ OT แล้ว' : 'ยืนยันวันอยู่เวรและส่งรายการ OT แล้ว');
}
async function saveOtRequest(form) {
  const pos = await getGps();
  if (!pos.ok) return showGpsHelp(pos.message);
  if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
  const fd = new FormData(form);
  const row = { staff_id: currentStaffId(), work_date: fd.get('work_date'), end_time: fd.get('end_time'), reason: fd.get('reason'), note: fd.get('note'), status: 'รออนุมัติ', lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
  const { error } = await sb.from('ot_requests').insert(row);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ส่งคำขอ OT เพิ่มแล้ว');
}
async function updateOtStatus(id, status) {
  const { error } = await sb.from('ot_requests').update({ status, reviewed_by: currentStaffId(), reviewed_at: new Date().toISOString() }).eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('อัปเดต OT แล้ว');
}
function showGpsHelp(message) {
  showModal(`<div class="modal-status-icon error">!</div><h2>แจ้งเตือน</h2>
    <p class="modal-message">${escapeHtml(message || 'ไม่ได้อยู่ในพื้นที่โรงพยาบาล')}</p>`);
}
function getGps() {
  return new Promise(resolve => {
    if (!navigator.geolocation) return resolve({ ok:false, message:'อุปกรณ์นี้ไม่รองรับ GPS' });
    navigator.geolocation.getCurrentPosition(
      p => resolve({ ok:true, lat:p.coords.latitude, lng:p.coords.longitude, accuracy:p.coords.accuracy }),
      err => resolve({ ok:false, message: gpsErrorMessage(err) }),
      { enableHighAccuracy:true, timeout:12000, maximumAge:0 }
    );
  });
}
function gpsErrorMessage(err) {
  if (!err) return 'ไม่ได้อยู่ในพื้นที่โรงพยาบาล';
  if (err.code === 1) return 'ยังไม่ได้อนุญาตให้ใช้ตำแหน่ง กรุณาเปิด Location Permission ให้เว็บนี้ก่อน';
  if (err.code === 2) return 'ไม่ได้อยู่ในพื้นที่โรงพยาบาล';
  if (err.code === 3) return 'อ่านตำแหน่งไม่ทันเวลา กรุณาลองใหม่อีกครั้ง';
  return 'ไม่ได้อยู่ในพื้นที่โรงพยาบาล';
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



async function saveProfileChangeRequest(form) {
  const fd = new FormData(form);
  const field = fd.get('field_name');
  const newValue = String(fd.get('new_value') || '').trim();
  if (!['phone','login_name','nickname','full_name'].includes(field)) return showToast('เลือกข้อมูลที่ต้องการแก้ไขไม่ถูกต้อง');
  if (field === 'login_name' && !/^[a-zA-Z0-9._-]{1,30}$/.test(newValue)) return showToast('ชื่อผู้ใช้ควรเป็นอังกฤษ/ตัวเลข เช่น user หรือ gift123 หรือ 012345');
  if (!newValue) return showToast('กรุณากรอกข้อมูลใหม่');
  const oldValue = state.profile?.[field] || '';
  if (String(oldValue) === newValue) return showToast('ข้อมูลใหม่เหมือนข้อมูลเดิม');
  setBusy(true, 'กำลังส่งคำขอ');
  const { data, error } = await sb.rpc('submit_profile_change_request_v47', {
    p_field_name: field,
    p_new_value: newValue,
    p_note: fd.get('note') || null
  });
  setBusy(false);
  if (error) return showToast(friendlyDbError(error));
  form.reset();
  await loadAllData();
  if (data && !state.profileChangeRequests.some(r => r.id === data.id)) state.profileChangeRequests.unshift(data);
  renderPage(); showToast('ส่งคำขอให้ Admin แล้ว');
}
async function reviewProfileChangeRequest(id, status) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const req = state.profileChangeRequests.find(r => r.id === id);
  if (!req) return showToast('ไม่พบคำขอ');
  let note = '';
  if (status === 'rejected') {
    note = await promptDialog('เหตุผลที่ไม่อนุมัติ (ถ้ามี)', 'ไม่อนุมัติคำขอ') || '';
  }
  setBusy(true, 'กำลังบันทึกผลตรวจ');
  const { error } = await sb.rpc('review_profile_change_request_v47', {
    p_request_id: id,
    p_status: status,
    p_review_note: note || null
  });
  setBusy(false);
  if (error) return showToast(friendlyDbError(error));
  await loadProfile(); await loadAllData(); renderPage(); showToast(status === 'approved' ? 'อนุมัติและอัปเดตข้อมูลแล้ว' : 'บันทึกไม่อนุมัติแล้ว');
}

async function saveStaffUsers() {
  const rowsById = new Map();
  Array.from(document.querySelectorAll('[data-staff-row]')).forEach(tr => {
    const id = tr.dataset.staffRow;
    if (!id || rowsById.has(id)) return;
    const original = state.staff.find(s => String(s.id) === String(id)) || {};
    const get = field => tr.querySelector(`[data-field="${field}"]`)?.value;
    const valueOr = (field, fallback='') => {
      const v = get(field);
      return v === undefined ? fallback : v;
    };
    rowsById.set(id, {
      id,
      nickname: valueOr('nickname', original.nickname || '') || null,
      full_name: valueOr('full_name', original.full_name || '') || null,
      email: valueOr('email', original.email || '') || null,
      employee_code: valueOr('employee_code', original.employee_code || '') || null,
      phone: valueOr('phone', original.phone || '') || null,
      login_name: valueOr('login_name', original.login_name || '') || null,
      staff_color: valueOr('staff_color', original.staff_color || defaultStaffColor(original.nickname)) || null,
      staff_type: valueOr('staff_type', original.staff_type || '') || null,
      position: valueOr('position', original.position || '') || null,
      role: valueOr('role', original.role || 'staff') || 'staff',
      is_active: valueOr('is_active', original.is_active ? 'true' : 'false') === 'true',
      maternity_status: valueOr('maternity_status', original.maternity_status ? 'true' : 'false') === 'true',
      is_long_term_leave: valueOr('is_long_term_leave', original.is_long_term_leave ? 'true' : 'false') === 'true',
      roster_enabled: valueOr('roster_enabled', original.roster_enabled === false ? 'false' : 'true') !== 'false',
      daily_position_enabled: valueOr('daily_position_enabled', original.daily_position_enabled === false ? 'false' : 'true') !== 'false',
      position_training_status: valueOr('position_training_status', original.position_training_status || 'ใช้งานปกติ') || 'ใช้งานปกติ'
    });
  });
  const rows = Array.from(rowsById.values());
  if (!rows.length) return showToast('ไม่พบข้อมูลผู้ใช้งานให้บันทึก');
  const { error } = await sb.from('staff_profiles').upsert(rows, { onConflict: 'id' });
  if (error) return showToast(friendlyDbError(error));
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
    phone: fd.get('phone') || null,
    login_name: String(fd.get('login_name') || '').trim() || null,
    staff_color: fd.get('staff_color') || defaultStaffColor(fd.get('nickname')),
    staff_type: fd.get('staff_type') || null,
    position: fd.get('position') || null,
    role: fd.get('role') || 'staff',
    is_active: true,
    is_long_term_leave: false,
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
  if (!(await confirmDialog(`ส่งลิงก์ reset password ไปที่ ${email}?`, 'ส่งลิงก์ตั้งรหัสผ่าน'))) return;
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
  showModal(`<h2>ขอแลก/ขาย/ยกเวร</h2><p class="hint">${formatThaiDate(slot.duty_date)} ${DUTY_LABEL[slot.duty_code] || slot.duty_code} • เจ้าของเวรเดิม ${staffPill(slot.staff_id)} • มูลค่าเวรเดิมประมาณ ${myAmount.toLocaleString()} บาท</p>
    <form id="dutyTradeForm" class="form-grid">
      <input type="hidden" name="from_assignment_id" value="${slot.id}">
      <label>ประเภท <select name="trade_type" id="tradeTypeSelect"><option value="ขายเวร">ขายเวร / เบิก OT ผ่าน HR</option><option value="ยกเวร">ยกเวร / ให้เวรอีกคนไปเลย</option><option value="แลกเวร">แลกเวร</option></select></label>
      <label>คนที่จะรับ/คู่แลก <select name="receiver_id" id="tradeReceiverSelect" required><option value="">เลือกคน</option>${possibleReceiver.map(s => `<option value="${s.id}">${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join('')}</select></label>
      <label class="wide trade-swap-only" id="tradeSwapWrap" style="display:none">กรณีแลกเวรเท่านั้น: เลือกเวรของคู่แลก <select name="to_assignment_id" id="tradeSwapSelect"><option value="">เลือกเวรของคู่แลก</option>${otherDutyOptions}</select><span class="hint">ถ้าเป็นขายเวร/ยกเวร ไม่ต้องเลือกวันที่/เวรซ้ำ ระบบใช้เวรที่กดมาให้อัตโนมัติ</span></label>
      <label id="tradeRateWrap">คิดเรท <select name="rate_mode"><option value="mt">เรท MT</option><option value="kerk">เรทเคิก</option><option value="custom">ตกลงกันเอง / จ่ายกันเอง</option></select><span class="hint">ถ้าเลือกตกลงกันเอง ระบบจะไม่เปลี่ยนตารางเวรหลักและไม่เปลี่ยนผู้มีสิทธิ์ OT</span></label>
      <label id="tradeCustomWrap">จำนวนเงินตกลงเอง (ถ้ามี) <input name="custom_amount" type="number" min="0" step="1" placeholder="ไม่บังคับ"></label>
      ${selfPaidTradeNotice()}<label class="wide">รายละเอียดข้อตกลง <textarea name="note" placeholder="เช่น เบิกผ่าน HR / ยกให้อีกคน / แลกเวรกับเพื่อน / จ่ายกันเองแล้ว"></textarea></label>
      <button class="primary-btn wide" type="submit">ส่งคำขอให้อีกฝ่ายยืนยัน</button>
    </form>`);
  updateTradeSwapVisibility();
}
function updateTradeSwapVisibility() {
  const type = document.getElementById('tradeTypeSelect')?.value || '';
  const wrap = document.getElementById('tradeSwapWrap');
  const rateWrap = document.getElementById('tradeRateWrap');
  const customWrap = document.getElementById('tradeCustomWrap');
  if (!wrap) return;
  wrap.style.display = type === 'แลกเวร' ? '' : 'none';
  if (rateWrap) rateWrap.style.display = type === 'ยกเวร' ? 'none' : '';
  if (customWrap) customWrap.style.display = type === 'ยกเวร' ? 'none' : '';
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
  const tradeType = fd.get('trade_type') || 'ขายเวร';
  if (tradeType === 'แลกเวร' && !fd.get('to_assignment_id')) return showToast('ถ้าเลือกแลกเวร กรุณาเลือกเวรของคู่แลกด้วย');
  const rateMode = fd.get('rate_mode') || 'mt';
  const custom = Number(fd.get('custom_amount') || 0);
  const amountFrom = tradeType === 'ยกเวร' ? 0 : (rateMode === 'custom' ? custom : tradeRateAmount(from, receiverId, rateMode));
  const amountTo = to ? (rateMode === 'custom' ? 0 : dutyMetrics(to, from.staff_id).pay) : 0;
  const row = {
    requester_id: currentStaffId(), receiver_id: receiverId, from_assignment_id: fromId, to_assignment_id: to?.id || null,
    trade_type: tradeType, rate_mode: rateMode, amount_from: amountFrom, amount_to: amountTo, amount_diff: amountFrom - amountTo,
    status: 'pending', note: fd.get('note') || null, created_by: currentStaffId(), updated_by: currentStaffId()
  };
  const { error } = await sb.from('roster_trade_requests').insert(row);
  if (error) return showToast(friendlyDbError(error));
  closeModal(); await loadAllData(); renderPage(); showToast('ส่งคำขอแล้ว รออีกฝ่ายกดยืนยัน');
}
async function updateTradeStatus(id, status) {
  const { error } = await sb.from('roster_trade_requests').update({ status, updated_by: currentStaffId(), confirmed_at: status==='confirmed' ? new Date().toISOString() : null }).eq('id', id);
  if (error) return showToast(friendlyDbError(error));
  await loadAllData(); renderPage(); showToast(status === 'confirmed' ? 'ยืนยันคำขอแล้ว' : 'ปฏิเสธคำขอแล้ว');
}
async function applyTradeRequest(id) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const r = state.tradeRequests.find(x => x.id === id);
  if (!r || r.status !== 'confirmed') return showToast('คำขอนี้ยังไม่พร้อมให้บันทึก');
  const from = state.rosterAssignments.find(a => a.id === r.from_assignment_id);
  const to = r.to_assignment_id ? state.rosterAssignments.find(a => a.id === r.to_assignment_id) : null;
  if (!from) return showToast('ไม่พบเวรต้นทาง');

  if (isSelfPaidTrade(r)) {
    const { error } = await sb.from('roster_trade_requests').update({ status: 'completed', updated_by: currentStaffId() }).eq('id', id);
    if (error) return showToast(friendlyDbError(error));
    await loadAllData(); renderPage(); showToast('รับทราบข้อตกลงแล้ว ตารางเวรและผู้มีสิทธิ์ OT ไม่เปลี่ยน');
    return;
  }

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
    attendance_logs: 'ลงชื่อเข้าเวร', ot_requests: 'OT', public_holidays: 'วันหยุดราชการ', monthly_incharges: 'อินชาร์จประจำเดือน', daily_position_eligibility: 'สิทธิ์ตำแหน่งรายวัน', daily_position_day_status: 'ประกาศตำแหน่งรายวัน', roster_trade_requests: 'คำขอแลก/ขาย/ยกเวร'
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
  if (a.table_name === 'roster_trade_requests') return `${tableLabel(a.table_name)}: ${staffNick(n.requester_id || o.requester_id)} → ${staffNick(n.receiver_id || o.receiver_id)} ${n.trade_type || o.trade_type || ''} = ${tradeStatusLabel(n.status || o.status, n.id ? n : o)}`;
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


/* =========================================================
   V56 hotfix: login username, profile request visibility,
   no-duty limits, safer popups, mobile sidebar polish
   ========================================================= */

function showToast(msg, opts={}) {
  const text = String(msg || 'ดำเนินการเรียบร้อย');
  const errorWords = /(ไม่สำเร็จ|ผิดพลาด|error|กรุณา|ไม่ได้|ไม่พบ|สิทธิ์ไม่พอ|ล้มเหลว|ไม่ถูกต้อง|หมดอายุ|ไม่สมบูรณ์|ปฏิเสธ|denied|invalid|failed|ครบ\s*\d+\s*วัน)/i;
  const tone = opts.tone || (errorWords.test(text) ? 'error' : 'success');
  const title = opts.title || (tone === 'error' ? 'แจ้งเตือน' : 'สำเร็จ');
  showModal(`
    <div class="app-alert ${tone}">
      <div class="app-alert-icon">${tone === 'error' ? '!' : '✓'}</div>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(text)}</p>
      <div class="confirm-actions"><button class="primary-btn" data-app-alert-ok>ตกลง</button></div>
    </div>
  `, { small:true });
}

function authUrlHasExpiredOtp() {
  const raw = `${window.location.search || ''}${window.location.hash || ''}`;
  return /error_code=otp_expired|error=access_denied/i.test(raw);
}

async function resolveLoginIdentifier(loginId) {
  const raw = String(loginId || '').trim();
  if (!raw) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
  if (raw.includes('@')) {
    const email = raw.toLowerCase();
    if (!requireMahidolEmail(email)) throw new Error('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    return email;
  }
  const username = raw.toLowerCase();
  if (!/^[a-zA-Z0-9._-]{1,30}$/.test(username)) {
    throw new Error('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
  }
  // ใช้ RPC เป็นหลัก เพราะหน้า Login ยังไม่มี session และ RLS อาจซ่อน staff_profiles จาก anon
  try {
    const r = await sb.rpc('resolve_login_identifier_v56', { p_identifier: username });
    if (!r.error && r.data) return String(r.data).toLowerCase();
  } catch (_) {}

  const { data, error } = await sb
    .from('staff_profiles')
    .select('email, login_name, is_active')
    .ilike('login_name', username)
    .limit(2);
  if (error) throw new Error(error.message || 'ค้นหาชื่อผู้ใช้ไม่สำเร็จ');
  const rows = data || [];
  if (!rows.length || !rows[0].email) throw new Error('ไม่พบชื่อผู้ใช้นี้ กรุณาตรวจสอบกับ Admin');
  if (rows.length > 1) throw new Error('ชื่อผู้ใช้นี้ซ้ำในระบบ กรุณาให้ Admin ตรวจผู้ใช้งานและสิทธิ์');
  if (rows[0].is_active === false) throw new Error('บัญชีนี้ถูกปิดใช้งาน กรุณาติดต่อ Admin');
  if (!requireMahidolEmail(rows[0].email)) throw new Error('บัญชีนี้ไม่ได้ใช้อีเมล Mahidol กรุณาติดต่อ Admin');
  return String(rows[0].email).toLowerCase();
}

function normalizeProfileRequest(r) {
  if (!r) return r;
  return {
    ...r,
    id: r.id || r.request_id,
    staff_id: r.staff_id || r.staffId,
    requested_by: r.requested_by || r.requestedBy,
    field_name: r.field_name || r.fieldName,
    old_value: r.old_value ?? r.oldValue ?? '',
    new_value: r.new_value ?? r.newValue ?? '',
    review_note: r.review_note ?? r.reviewNote ?? '',
    reviewed_by: r.reviewed_by || r.reviewedBy,
    reviewed_at: r.reviewed_at || r.reviewedAt,
    created_at: r.created_at || r.createdAt,
    status: r.status || 'pending'
  };
}
function profileRequestBelongsToMe(r) {
  const req = normalizeProfileRequest(r);
  const staffId = String(currentStaffId() || '');
  const userId = String(state.session?.user?.id || '');
  const email = String(state.profile?.email || state.session?.user?.email || '').toLowerCase();
  const requestedByEmail = String(req.requested_by_email || req.email || '').toLowerCase();
  return String(req.staff_id || '') === staffId
    || String(req.requested_by || '') === staffId
    || String(req.requested_by || '') === userId
    || (email && requestedByEmail === email);
}
async function loadProfileChangeRequests() {
  const staffId = currentStaffId();
  const email = state.profile?.email || state.session?.user?.email || null;
  const userId = state.session?.user?.id || null;
  const rows = [];
  const seen = new Set();
  const addRows = (arr) => (arr || []).forEach(row => {
    const r = normalizeProfileRequest(row);
    if (!r) return;
    const key = r.id || `${r.staff_id || ''}|${r.requested_by || ''}|${r.field_name || ''}|${r.new_value || ''}|${r.created_at || ''}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push(r);
  });
  const attempts = [
    () => sb.rpc('list_profile_change_requests_v56', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v52', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v51', { p_staff_id: staffId, p_user_email: email, p_is_admin: isAdmin() }),
    () => sb.rpc('list_profile_change_requests_v50', { p_staff_id: staffId, p_user_email: email, p_is_admin: isAdmin() }),
    () => isAdmin()
      ? sb.from('profile_change_requests').select('*').order('created_at', { ascending:false })
      : sb.from('profile_change_requests').select('*').or(`staff_id.eq.${staffId},requested_by.eq.${staffId},requested_by.eq.${userId}`).order('created_at', { ascending:false })
  ];
  for (const fn of attempts) {
    try {
      const res = await fn();
      if (res?.error) { console.warn('profile change request load skipped:', res.error.message || res.error); continue; }
      addRows(res.data || []);
      if ((res.data || []).length) break;
    } catch (err) { console.warn('profile change request load attempt failed', err); }
  }
  rows.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  state.profileChangeRequests = isAdmin() ? rows : rows.filter(profileRequestBelongsToMe);
  console.info('[profile_change_requests v56] rows:', rows.length, 'visible:', state.profileChangeRequests.length, { staffId, userId, email, isAdmin:isAdmin() });
}

function renderMyProfilePage() {
  const p = state.profile || {};
  const myReqs = (state.profileChangeRequests || []).filter(profileRequestBelongsToMe).slice(0, 10);
  return `<div class="grid grid-2 profile-page-grid">
    <div class="card profile-card-readable">
      <div class="section-title"><div><h3>ข้อมูลส่วนตัว</h3><p class="hint">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p></div></div>
      <div class="profile-info-grid profile-info-readable">
        <div><span class="muted">ชื่อเล่น</span><b>${escapeHtml(p.nickname || '-')}</b></div>
        <div><span class="muted">ชื่อ-สกุล</span><b>${escapeHtml(p.full_name || '-')}</b></div>
        <div><span class="muted">เบอร์โทร</span><b>${escapeHtml(p.phone || '-')}</b></div>
        <div><span class="muted">Email</span><b>${escapeHtml(p.email || '-')}</b></div>
        <div><span class="muted">ชื่อผู้ใช้</span><b>${escapeHtml(p.login_name || '-')}</b></div>
      </div>
      <form id="profileChangeForm" class="form-grid compact-form">
        <label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="login_name">ชื่อผู้ใช้</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label>
        <label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label>
        <label class="wide">เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label>
        <button class="primary-btn wide" type="submit">ส่งคำขอให้ Admin อนุมัติ</button>
      </form>
    </div>
    <div class="card">
      <div class="section-title"><h3>คำขอล่าสุดของฉัน</h3><button class="ghost-btn" type="button" id="refreshProfileRequestsBtn" onclick="loadAllData().then(renderPage)">รีเฟรช</button></div>
      ${myReqs.length ? `<div class="mobile-cards always-cards">${myReqs.map(raw => { const r = normalizeProfileRequest(raw); return `<div class="mobile-card request-card"><div class="mobile-day-head"><b>${profileFieldLabel(r.field_name)}</b>${badge(profileRequestStatusText(r.status), profileRequestBadge(r.status))}</div>
        <div><b>ค่าเดิม:</b> ${escapeHtml(r.old_value || '-')}</div>
        <div><b>ค่าใหม่:</b> ${escapeHtml(r.new_value || '-')}</div>
        <div><b>เหตุผล:</b> ${escapeHtml(r.note || '-')}</div>
        <div class="muted">ส่งเมื่อ ${formatThaiDateTime(r.created_at)}</div>
        ${r.reviewed_at ? `<div class="muted">ตรวจเมื่อ ${formatThaiDateTime(r.reviewed_at)}</div>` : ''}
      </div>`; }).join('')}</div>` : empty('ยังไม่มีคำขอ')}
    </div>
  </div>`;
}

function renderProfileRequestsPage() {
  if (!isAdmin()) return noPermission();
  const rows = (state.profileChangeRequests || []).map(normalizeProfileRequest).filter(r => r.status === 'pending');
  return `<div class="card">
    <div class="section-title"><div><h3>คำขอแก้ไขข้อมูลส่วนตัว</h3><p class="hint">Admin ตรวจคำขอจาก staff ก่อนเปลี่ยนข้อมูลจริงในระบบ</p></div><button class="ghost-btn" type="button" onclick="loadAllData().then(renderPage)">รีเฟรชคำขอ</button></div>
    ${rows.length ? `<div class="mobile-cards always-cards">${rows.map(r => {
      const st = state.staff.find(s => String(s.id) === String(r.staff_id)) || {};
      return `<div class="mobile-card request-card"><div class="mobile-day-head"><h3>${staffPill(st || r.staff_id)}</h3>${badge(profileRequestStatusText(r.status), profileRequestBadge(r.status))}</div>
        <div><b>ขอแก้:</b> ${profileFieldLabel(r.field_name)}</div>
        <div><b>ค่าเดิม:</b> ${escapeHtml(r.old_value || '-')}</div>
        <div><b>ค่าใหม่:</b> ${escapeHtml(r.new_value || '-')}</div>
        <div><b>เหตุผล:</b> ${escapeHtml(r.note || '-')}</div>
        <div class="muted">ส่งเมื่อ ${formatThaiDateTime(r.created_at)}</div>
        <div class="actions"><button class="primary-btn" data-approve-profile-request="${r.id}">อนุมัติ</button><button class="ghost-btn danger" data-reject-profile-request="${r.id}">ไม่อนุมัติ</button></div>
      </div>`;
    }).join('')}</div>` : empty('ไม่มีคำขอรออนุมัติ')}
  </div>`;
}

function noDutyLimitCounts(staffId, monthKey, excludeId='') {
  const rows = (state.leaves || []).filter(l => l.type === 'ไม่รับเวร' && l.status !== 'cancelled' && String(l.staff_id) === String(staffId) && String(l.id || '') !== String(excludeId || ''));
  let weekend = 0, weekday = 0;
  rows.forEach(l => daysBetween(l.start_date, l.end_date).forEach(date => {
    if (!String(date).startsWith(monthKey)) return;
    if (isWeekend(date)) weekend += 1; else weekday += 1;
  }));
  return { weekend, weekday };
}
function noDutyRequestedCounts(start, end, monthKey) {
  let weekend = 0, weekday = 0;
  daysBetween(start, end).forEach(date => {
    if (!String(date).startsWith(monthKey)) return;
    if (isWeekend(date)) weekend += 1; else weekday += 1;
  });
  return { weekend, weekday };
}
function validateNoDutyLimit(row, excludeId='') {
  if (isAdmin()) return null;
  if (row.type !== 'ไม่รับเวร') return null;
  const months = Array.from(new Set(daysBetween(row.start_date, row.end_date).map(d => d.slice(0,7))));
  for (const m of months) {
    const oldCount = noDutyLimitCounts(row.staff_id, m, excludeId);
    const newCount = noDutyRequestedCounts(row.start_date, row.end_date, m);
    if (oldCount.weekend + newCount.weekend > 2) return 'เดือนนี้ไม่รับเวรเสาร์-อาทิตย์ครบ 2 วันแล้ว';
    if (oldCount.weekday + newCount.weekday > 5) return 'เดือนนี้ไม่รับเวรวันธรรมดาครบ 5 วันแล้ว';
  }
  return null;
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
  if (!isAdmin()) {
    if (row.start_date < todayStr()) return showToast('Staff ไม่สามารถบันทึกย้อนหลังได้ กรุณาให้ Admin บันทึกแทน');
    if (row.type === 'ไม่รับเวร' && requestedDates.some(isNoDutyLockedForDate)) return showToast('พ้นกำหนดแก้ไข “ไม่รับเวร” ของเดือนนี้แล้ว กรุณาแจ้งอินชาร์จหรือหัวหน้าให้บันทึกแทน');
    const limitMsg = validateNoDutyLimit(row, state.editingLeaveId || '');
    if (limitMsg) return showToast(limitMsg, { tone:'error' });
  }
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
      setBusy(false); return showToast('กรุณาระบุเหตุผลที่ Admin บันทึกแทน/ย้อนหลัง เพื่อให้ Audit Log ชัดเจน');
    }
    res = await sb.rpc('admin_upsert_leave_v32', { p_id: id || null, p_staff_id: row.staff_id, p_type: row.type, p_start_date: row.start_date, p_end_date: row.end_date, p_leave_period: row.leave_period, p_note: row.note || null, p_contact_phone: row.contact_phone || null, p_attachment_path: row.attachment_path || null, p_admin_record_reason: adminReason || null, p_recorded_by_admin: true });
    if (res.error && (String(res.error.message || '').includes('admin_upsert_leave_v32') || String(res.error.message || '').includes('Could not find the function') || String(res.error.message || '').includes('schema cache'))) {
      const directRow = { ...row, recorded_by_admin: true, admin_record_reason: adminReason || row.admin_record_reason || 'Admin บันทึกแทน', updated_by: currentStaffId() };
      res = id ? await sb.from('leave_requests').update(directRow).eq('id', id) : await sb.from('leave_requests').insert({ ...directRow, created_by: currentStaffId(), status: 'active' });
    }
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

async function saveProfileChangeRequest(form) {
  const fd = new FormData(form);
  const field = fd.get('field_name');
  const newValue = String(fd.get('new_value') || '').trim();
  if (!['phone','login_name','nickname','full_name'].includes(field)) return showToast('เลือกข้อมูลที่ต้องการแก้ไขไม่ถูกต้อง');
  if (field === 'login_name' && !/^[a-zA-Z0-9._-]{1,30}$/.test(newValue)) return showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
  if (!newValue) return showToast('กรุณากรอกข้อมูลใหม่');
  const oldValue = state.profile?.[field] || '';
  if (String(oldValue) === newValue) return showToast('ข้อมูลใหม่เหมือนข้อมูลเดิม');
  setBusy(true, 'กำลังส่งคำขอ');
  let res = await sb.rpc('submit_profile_change_request_v56', { p_field_name: field, p_new_value: newValue, p_note: fd.get('note') || null });
  if (res.error) res = await sb.rpc('submit_profile_change_request_v47', { p_field_name: field, p_new_value: newValue, p_note: fd.get('note') || null });
  setBusy(false);
  if (res.error) return showToast(friendlyDbError(res.error));
  form.reset();
  await loadAllData();
  if (res.data) {
    const d = Array.isArray(res.data) ? res.data[0] : res.data;
    if (d && !state.profileChangeRequests.some(r => r.id === d.id)) state.profileChangeRequests.unshift(normalizeProfileRequest(d));
  }
  renderPage(); showToast('ส่งคำขอให้ Admin แล้ว');
}

async function reviewProfileChangeRequest(id, status) {
  if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น');
  const req = state.profileChangeRequests.find(r => String(r.id) === String(id));
  if (!req) return showToast('ไม่พบคำขอ');
  let note = '';
  if (status === 'rejected') note = await promptDialog('เหตุผลที่ไม่อนุมัติ (ถ้ามี)', 'ไม่อนุมัติคำขอ') || '';
  setBusy(true, 'กำลังบันทึกผลตรวจ');
  let res = await sb.rpc('review_profile_change_request_v56', { p_request_id: id, p_status: status, p_review_note: note || null });
  if (res.error) res = await sb.rpc('review_profile_change_request_v47', { p_request_id: id, p_status: status, p_review_note: note || null });
  setBusy(false);
  if (res.error) return showToast(friendlyDbError(res.error));
  await loadProfile(); await loadAllData(); renderPage(); showToast(status === 'approved' ? 'อนุมัติและอัปเดตข้อมูลแล้ว' : 'บันทึกไม่อนุมัติแล้ว');
}

// ถ้าเปิดลิงก์ที่ Supabase แจ้งว่า token หมดอายุ ให้บอกตรง ๆ และไม่แสดงเครื่องหมายถูกผิดบริบท
if (authUrlHasExpiredOtp()) {
  setTimeout(() => showToast('ลิงก์นี้หมดอายุหรือถูกใช้ไปแล้ว กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง', { tone:'error' }), 700);
}


// V56: override global bindings so hamburger collapses sidebar on desktop and opens drawer on mobile
function bindGlobalEvents() {
  $('modalClose').addEventListener('click', closeModal);
  $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
  $('mobileMenuBtn').addEventListener('click', () => {
    const sidebar = $('sidebar');
    if (window.innerWidth > 820) {
      document.body.classList.toggle('cnmi-sidebar-hidden');
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
      return;
    }
    sidebar.classList.toggle('open');
    document.body.classList.toggle('sidebar-open', sidebar.classList.contains('open'));
  });
  document.addEventListener('click', e => {
    if (window.innerWidth > 820) return;
    const sidebar = $('sidebar');
    const btn = $('mobileMenuBtn');
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !btn.contains(e.target)) {
      sidebar.classList.remove('open');
      document.body.classList.remove('sidebar-open');
    }
  });
  $('reloadBtn').addEventListener('click', async () => { await loadAllData(); renderPage(); });
  $('logoutBtn').addEventListener('click', async () => {
    if (sb) {
      await logAuth('LOGOUT');
      sessionStorage.removeItem('cnmi_login_audit_' + (state.session?.user?.id || ''));
      clearCachedAppSession();
      await sb.auth.signOut();
    }
  });

  $('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const loginId = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    setBusy(true, 'กำลังเข้าสู่ระบบ');
    let email = '';
    try { email = await resolveLoginIdentifier(loginId); }
    catch (err) { setBusy(false); return showToast(err.message || 'ไม่พบชื่อผู้ใช้', { tone:'error' }); }
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      const msg = String(error.message || '');
      if (msg.toLowerCase().includes('invalid login credentials')) {
        const hint = loginId.includes('@')
          ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน'
          : 'ชื่อผู้ใช้นี้มีในระบบแล้ว แต่รหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน';
        return showToast(hint, { tone:'error' });
      }
      return showToast(msg, { tone:'error' });
    }
  });

  $('setupPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('setupPasswordEmail').value.trim().toLowerCase();
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th', { tone:'error' });
    setBusy(true, 'กำลังส่งลิงก์ตั้งรหัสผ่านใหม่');
    try {
      const result = await requestPasswordSetupLink(email);
      showToast(result?.sentBy === 'MailApp' ? 'ส่งอีเมลตั้งรหัสผ่านแล้ว กรุณาเช็ก Inbox / Spam' : 'ถ้าอีเมลนี้อยู่ในรายชื่อเจ้าหน้าที่ ระบบจะส่งลิงก์ให้ตั้งรหัสผ่านใหม่');
    } catch (err) { showToast(err.message || 'ส่งลิงก์ไม่สำเร็จ', { tone:'error' }); }
    finally { setBusy(false); }
  });

  $('resetPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const loginName = String($('recoveryLoginName')?.value || '').trim();
    const password = $('newPassword').value;
    if (!loginName) return showToast('กรุณาตั้งชื่อผู้ใช้', { tone:'error' });
    if (!/^[a-zA-Z0-9._-]+$/.test(loginName)) return showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง', { tone:'error' });
    if (!password) return showToast('กรุณากรอกรหัสผ่านใหม่', { tone:'error' });
    const { data: beforeUpdate } = await sb.auth.getSession();
    const recoveryEmail = beforeUpdate?.session?.user?.email || state.session?.user?.email || '';
    if (!recoveryEmail) return showToast('ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง', { tone:'error' });
    setBusy(true, 'กำลังบันทึกชื่อผู้ใช้และรหัสผ่าน');
    try {
      let r = await sb.rpc('set_initial_login_name_v56', { p_email: recoveryEmail, p_login_name: loginName });
      if (r.error) r = await sb.rpc('set_initial_login_name_v44', { p_email: recoveryEmail, p_login_name: loginName });
      if (r.error) throw r.error;
      RECOVERY_INTENT = false;
      cleanAuthUrl(false);
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      clearPasswordSetupForced();
      RECOVERY_INTENT = false;
      AUTH_LINK_PROCESSING = false;
      $('resetPasswordForm').classList.add('hidden');
      const { data } = await sb.auth.getSession();
      state.session = data.session;
      showToast('บันทึกชื่อผู้ใช้และรหัสผ่านแล้ว');
      await enterApp();
    } catch (err) {
      setPasswordSetupForced('password-update-failed');
      RECOVERY_INTENT = true;
      showToast(err.message || 'บันทึกไม่สำเร็จ', { tone:'error' });
    } finally { setBusy(false); }
  });

  document.body.addEventListener('click', handleClick);
  document.body.addEventListener('change', handleChange);
  document.body.addEventListener('submit', handleSubmit);
  // V75: keep manual drag/drop active after auth/sidebar override.
  document.body.dataset.v75DndGuard = '1';
  document.body.addEventListener('dragstart', handleDragStart);
  document.body.addEventListener('dragover', handleDragOver);
  document.body.addEventListener('dragleave', handleDragLeave);
  document.body.addEventListener('drop', handleDrop);
}

/* =========================================================
   V57 hotfix: restore profile request display, no-duty quota,
   dashboard duty order, activity list UX, sidebar/logout polish
   ========================================================= */
(function () {
  const VERSION = 'V57';
  const WEEKEND_NO_DUTY_LIMIT = 2;
  const WEEKDAY_NO_DUTY_LIMIT = 5;

  function s(v) { return String(v ?? '').trim(); }
  function low(v) { return s(v).toLowerCase(); }
  function idEq(a,b) { return s(a) && s(a) === s(b); }
  function isPending(r) { return low(r?.status || 'pending') === 'pending'; }
  function isFinal(r) { return ['approved','rejected'].includes(low(r?.status || '')); }
  function statusClass(st) { return low(st) === 'approved' ? 'green' : low(st) === 'rejected' ? 'red' : 'orange'; }
  function statusText(st) { return ({ approved:'อนุมัติแล้ว', rejected:'ไม่อนุมัติ', pending:'รออนุมัติ' }[low(st)] || st || 'รออนุมัติ'); }
  function cleanMonth(v) { return s(v || state.profileSummaryFilterMonth || state.monthKey || monthKey(new Date())); }

  function normalizeProfileStatus(status) {
    const x = low(status || 'pending');
    if (['approved','approve','อนุมัติ','อนุมัติแล้ว'].includes(x)) return 'approved';
    if (['rejected','reject','ไม่อนุมัติ','ปฏิเสธ'].includes(x)) return 'rejected';
    if (['pending','รออนุมัติ','รอตรวจ','รอตรวจสอบ'].includes(x)) return 'pending';
    return x || 'pending';
  }

  function normalizeRequest(row) {
    if (!row) return row;
    return {
      ...row,
      id: row.id || row.request_id,
      staff_id: row.staff_id || row.staffId,
      requested_by: row.requested_by || row.requestedBy,
      requested_by_email: row.requested_by_email || row.email || row.user_email || row.request_email || row.requester_email || row.staff_email,
      staff_email: row.staff_email || row.email || row.user_email || row.request_email || row.requester_email,
      staff_nickname: row.staff_nickname || row.nickname,
      staff_full_name: row.staff_full_name || row.full_name,
      field_name: row.field_name || row.fieldName,
      old_value: row.old_value ?? row.oldValue ?? '',
      new_value: row.new_value ?? row.newValue ?? '',
      note: row.note ?? '',
      status: normalizeProfileStatus(row.status || 'pending'),
      reviewed_by: row.reviewed_by || row.reviewedBy,
      reviewed_at: row.reviewed_at || row.reviewedAt,
      review_note: row.review_note || row.reviewNote || '',
      created_at: row.created_at || row.createdAt
    };
  }

  function requestStaff(row) {
    const r = normalizeRequest(row);
    const emailCandidates = [r.staff_email, r.requested_by_email].map(low).filter(Boolean);
    return (state.staff || []).find(st =>
      idEq(st.id, r.staff_id) || idEq(st.id, r.requested_by) || idEq(st.user_id, r.requested_by) ||
      emailCandidates.includes(low(st.email))
    ) || null;
  }

  function requestIsMine(row) {
    const r = normalizeRequest(row);
    const me = state.profile || {};
    const staffId = s(currentStaffId());
    const userId = s(state.session?.user?.id);
    const email = low(me.email || state.session?.user?.email);
    const st = requestStaff(r);
    return idEq(r.staff_id, staffId) || idEq(r.requested_by, staffId) || idEq(r.requested_by, userId) ||
      idEq(st?.id, staffId) || idEq(st?.user_id, userId) ||
      (!!email && [r.staff_email, r.requested_by_email, st?.email].map(low).includes(email));
  }

  async function rpcRows(name, args) {
    try {
      const res = await sb.rpc(name, args || {});
      if (!res?.error) return res.data || [];
      console.warn(`[${VERSION}] ${name} skipped:`, res.error.message || res.error);
    } catch (err) {
      console.warn(`[${VERSION}] ${name} failed:`, err);
    }
    return [];
  }

  window.loadProfileChangeRequests = async function loadProfileChangeRequestsV57() {
    const staffId = currentStaffId();
    const email = state.profile?.email || state.session?.user?.email || null;
    const userId = state.session?.user?.id || null;
    const admin = isAdmin();
    const collected = [];
    const seen = new Set();
    const add = (arr) => (arr || []).forEach(raw => {
      const r = normalizeRequest(raw);
      if (!r) return;
      const key = r.id || `${r.staff_id || ''}|${r.requested_by || ''}|${r.field_name || ''}|${r.new_value || ''}|${r.created_at || ''}`;
      if (seen.has(key)) return;
      seen.add(key);
      collected.push(r);
    });

    add(await rpcRows('list_profile_change_requests_v57', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: admin }));
    if (!collected.length) add(await rpcRows('list_profile_change_requests_v56', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: admin }));
    if (!collected.length) add(await rpcRows('list_profile_change_requests_v54', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: admin }));
    if (!collected.length) add(await rpcRows('list_profile_change_requests_v52', { p_staff_id: staffId, p_user_email: email, p_user_id: userId, p_is_admin: admin }));
    if (!collected.length) {
      try {
        const q = await sb.from('profile_change_requests').select('*').order('created_at', { ascending:false });
        if (!q.error) add(q.data || []);
        else console.warn(`[${VERSION}] direct profile_change_requests skipped:`, q.error.message || q.error);
      } catch (err) { console.warn(`[${VERSION}] direct profile_change_requests failed`, err); }
    }

    collected.sort((a,b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    state.profileChangeRequests = admin ? collected : collected.filter(requestIsMine);
    console.info(`[profile_change_requests ${VERSION}] loaded rows:`, collected.length, 'visible:', state.profileChangeRequests.length, { staffId, userId, email, admin });
  };

  function requestCard(row, adminMode=false, summaryMode=false) {
    const r = normalizeRequest(row);
    const st = requestStaff(r);
    const who = st ? staffPill(st) : `<span class="staff-color-pill">${escapeHtml(r.staff_nickname || r.staff_full_name || r.staff_email || r.requested_by_email || 'ไม่พบชื่อผู้ส่ง')}</span>`;
    const action = adminMode && isPending(r) ? `<div class="actions request-actions"><button class="primary-btn" data-approve-profile-request="${r.id}">อนุมัติ</button><button class="ghost-btn danger" data-reject-profile-request="${r.id}">ไม่อนุมัติ</button></div>` : '';
    return `<div class="mobile-card request-card v57-request-card">
      <div class="request-head"><div>${adminMode || summaryMode ? who : `<b>${profileFieldLabel(r.field_name)}</b>`}</div>${badge(statusText(r.status), statusClass(r.status))}</div>
      ${adminMode || summaryMode ? `<div><b>ขอแก้:</b> ${escapeHtml(profileFieldLabel(r.field_name))}</div>` : ''}
      <div><b>ค่าเดิม:</b> ${escapeHtml(r.old_value || '-')}</div>
      <div><b>ค่าใหม่:</b> ${escapeHtml(r.new_value || '-')}</div>
      <div><b>เหตุผล/หมายเหตุ:</b> ${escapeHtml(r.note || '-')}</div>
      <div class="muted">ส่งเมื่อ ${formatThaiDateTime(r.created_at)}</div>
      ${r.reviewed_at ? `<div class="muted">ตรวจเมื่อ ${formatThaiDateTime(r.reviewed_at)} ${r.reviewed_by ? `โดย ${staffPill(r.reviewed_by)}` : ''}</div>` : ''}
      ${r.review_note ? `<div><b>หมายเหตุ Admin:</b> ${escapeHtml(r.review_note)}</div>` : ''}
      ${action}
    </div>`;
  }

  window.renderMyProfilePage = function renderMyProfilePageV57() {
    const p = state.profile || {};
    const myReqs = (state.profileChangeRequests || []).map(normalizeRequest).filter(requestIsMine).slice(0, 20);
    return `<div class="grid grid-2 profile-page-grid v57-profile-page" id="myProfilePage">
      <div class="card profile-card-readable">
        <div class="section-title"><h3>ข้อมูลส่วนตัว</h3></div>
        <p class="hint">ข้อมูลจริงใช้จากตารางผู้ใช้งาน ถ้าต้องการแก้ ให้ส่งคำขอให้ Admin อนุมัติ</p>
        <div class="profile-info-list">
          <div><span>ชื่อเล่น</span><b>${escapeHtml(p.nickname || '-')}</b></div>
          <div><span>ชื่อ-สกุล</span><b>${escapeHtml(p.full_name || '-')}</b></div>
          <div><span>เบอร์โทร</span><b>${escapeHtml(p.phone || '-')}</b></div>
          <div><span>Email</span><b>${escapeHtml(p.email || '-')}</b></div>
          <div><span>ชื่อผู้ใช้</span><b>${escapeHtml(p.login_name || '-')}</b></div>
        </div>
        <form id="profileChangeForm" class="form-grid compact-form">
          <div class="form-grid two-cols">
            <label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="login_name">ชื่อผู้ใช้</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label>
            <label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label>
          </div>
          <label>เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label>
          <button class="primary-btn full-btn" type="submit">ส่งคำขอให้ Admin อนุมัติ</button>
        </form>
      </div>
      <div class="card">
        <div class="section-title"><h3>คำขอล่าสุดของฉัน</h3><button class="ghost-btn" type="button" onclick="loadProfileChangeRequests().then(renderPage)">รีเฟรช</button></div>
        ${myReqs.length ? `<div class="mobile-cards always-cards">${myReqs.map(r => requestCard(r, false, false)).join('')}</div>` : empty('ยังไม่มีคำขอ')}
      </div>
    </div>`;
  };

  window.renderProfileRequestsPage = function renderProfileRequestsPageV57() {
    if (!isAdmin()) return noPermission();
    const rows = (state.profileChangeRequests || []).map(normalizeRequest).filter(isPending);
    return `<div class="card">
      <div class="section-title"><div><h3>คำขอแก้ไขข้อมูลส่วนตัว</h3><p class="hint">แสดงเฉพาะรายการที่รออนุมัติ</p></div><button class="ghost-btn" type="button" onclick="loadProfileChangeRequests().then(renderPage)">รีเฟรชคำขอ</button></div>
      ${rows.length ? `<div class="mobile-cards always-cards v57-request-list">${rows.map(r => requestCard(r, true, false)).join('')}</div>` : empty('ไม่มีคำขอรออนุมัติ')}
    </div>`;
  };

  window.renderProfileRequestSummaryPage = function renderProfileRequestSummaryPageV57() {
    if (!isAdmin()) return noPermission();
    const month = cleanMonth(state.profileSummaryFilterMonth);
    const staff = state.profileSummaryFilterStaff || '';
    const rows = (state.profileChangeRequests || []).map(normalizeRequest)
      .filter(isFinal)
      .filter(r => !month || String(r.reviewed_at || r.created_at || '').slice(0,7) === month)
      .filter(r => !staff || String(r.staff_id) === String(staff) || String(requestStaff(r)?.id) === String(staff));
    return `<div class="card">
      <div class="section-title"><div><h3>สรุปคำขอแก้ไขข้อมูลส่วนตัว</h3><p class="hint">เลือกคน/เดือนก่อน ระบบจะแสดงเฉพาะรายการที่อนุมัติหรือไม่อนุมัติแล้ว</p></div><button class="ghost-btn" type="button" onclick="loadProfileChangeRequests().then(renderPage)">รีเฟรช</button></div>
      <div class="toolbar compact-filter">
        <label>คน <select id="profileSummaryFilterStaff"><option value="">ทุกคน</option>${orderedStaff(state.staff).map(st => `<option value="${st.id}" ${staff===st.id?'selected':''}>${escapeHtml(st.nickname || st.full_name)}</option>`).join('')}</select></label>
        <label>เดือน <input type="month" id="profileSummaryFilterMonth" value="${month}"></label>
      </div>
      ${rows.length ? `<div class="table-wrap"><table><thead><tr><th>คน</th><th>ขอแก้</th><th>ค่าใหม่</th><th>สถานะ</th><th>ผู้ตรวจ/เวลา</th><th>ย้อนกลับ</th></tr></thead><tbody>${rows.map(r => `<tr>
        <td>${requestStaff(r) ? staffPill(requestStaff(r)) : escapeHtml(r.staff_nickname || r.staff_email || '-')}</td>
        <td>${escapeHtml(profileFieldLabel(r.field_name))}<br><span class="muted">เดิม: ${escapeHtml(r.old_value || '-')}</span></td>
        <td>${escapeHtml(r.new_value || '-')}</td>
        <td>${badge(statusText(r.status), statusClass(r.status))}</td>
        <td>${r.reviewed_by ? staffPill(r.reviewed_by) : '-'}<br><span class="muted">${formatThaiDateTime(r.reviewed_at)}</span></td>
        <td>${low(r.status)==='approved' ? `<button class="tiny-btn danger" data-revert-profile-request="${r.id}">ย้อนกลับ</button>` : '-'}</td>
      </tr>`).join('')}</tbody></table></div>` : empty('ไม่พบข้อมูลตามตัวกรอง')}
    </div>`;
  };

  function ensureProfileSummaryNav() {
    for (let i = NAV_ITEMS.length - 1; i >= 0; i--) {
      const x = NAV_ITEMS[i] || {};
      if (x.id === 'profileRequestSummary' || x.title === 'สรุปคำขอแก้ไขข้อมูลส่วนตัว') NAV_ITEMS.splice(i, 1);
    }
    const idx = NAV_ITEMS.findIndex(x => x.id === 'profileRequests');
    NAV_ITEMS.splice(idx >= 0 ? idx + 1 : NAV_ITEMS.length, 0, { id:'profileRequestSummary', icon:'📄', title:'สรุปคำขอแก้ไขข้อมูลส่วนตัว', subtitle:'รายการที่อนุมัติ/ไม่อนุมัติแล้ว', group:'admin' });
  }
  ensureProfileSummaryNav();

  window.renderPage = function renderPageV57() {
    const item = NAV_ITEMS.find(x => x.id === state.page) || NAV_ITEMS[0];
    $('pageTitle').textContent = item.title;
    $('pageSubtitle').textContent = item.subtitle;
    renderNav();
    const pages = {
      dashboard: renderDashboard, calendar: renderCalendar, leave: renderLeavePage, myProfile: renderMyProfilePage,
      activities: renderActivitiesPage, hr: renderHrPage, hrSummary: renderHrSummaryPage, scheduler: renderSchedulerPage,
      schedule: renderMonthlySchedulePage, tradeRequests: renderTradeRequestsPage, positions: renderPositionsPage,
      ot: renderOtPage, audit: renderAuditPage, profileRequests: renderProfileRequestsPage,
      profileRequestSummary: renderProfileRequestSummaryPage, users: renderUsersPage, eligibility: renderEligibilityPage,
      positionMonth: renderPositionMonthPage, positionMonthView: renderPositionMonthViewPage
    };
    $('pageContent').innerHTML = (pages[state.page] || renderDashboard)();
  };

  window.resolveLoginIdentifier = async function resolveLoginIdentifierV57(loginId) {
    const raw = s(loginId);
    if (!raw) throw new Error('กรุณากรอกชื่อผู้ใช้หรืออีเมล');
    if (raw.includes('@')) {
      const email = low(raw);
      if (!requireMahidolEmail(email)) throw new Error('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
      return email;
    }
    if (!/^[a-zA-Z0-9._-]+$/.test(raw)) throw new Error('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง');
    for (const fn of ['resolve_login_identifier_v57', 'resolve_login_identifier_v56']) {
      try {
        const r = await sb.rpc(fn, { p_identifier: raw });
        if (!r.error && r.data) return low(r.data);
      } catch (_) {}
    }
    throw new Error('ไม่พบชื่อผู้ใช้นี้ กรุณาตรวจสอบกับ Admin');
  };

  window.dashboardDutySortOrder = function dashboardDutySortOrderV57(date) {
    if (isHolidayDate(date)) return ['ชบด1','ชบด2','ชบด3'];
    if (isWeekend(date)) return ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT'];
    return ['ชบด1','ชบด2','ชบด3','ช4A','ช4B'];
  };
  window.sortDashboardDuties = function sortDashboardDutiesV57(rows, date) {
    const order = dashboardDutySortOrder(date);
    return [...(rows || [])].filter(r => order.includes(r.duty_code)).sort((a,b) => order.indexOf(a.duty_code) - order.indexOf(b.duty_code));
  };

  window.renderActivitiesPage = function renderActivitiesPageV57() {
    const editing = state.editingActivityId ? state.activities.find(x => x.id === state.editingActivityId) : null;
    const activityMonth = state.activityFilterMonth || state.monthKey || monthKey(new Date());
    const activityType = state.activityFilterType || '';
    const rows = [...(state.activities || [])]
      .filter(r => !activityMonth || String(r.start_date || '').slice(0,7) === activityMonth || String(r.end_date || '').slice(0,7) === activityMonth)
      .filter(r => !activityType || r.event_type === activityType)
      .sort((a,b) => String(a.start_date || '').localeCompare(String(b.start_date || '')) || String(a.start_time || '').localeCompare(String(b.start_time || '')));
    return `<div class="grid grid-2 activities-v57">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขกิจกรรม' : 'เพิ่มกิจกรรมหน่วยงาน'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-activity>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="activityForm" class="form-grid">
          <label class="wide">รายละเอียดกิจกรรม <input name="title" value="${escapeHtml(editing?.title || '')}" placeholder="เช่น ประชุมทีม / ออกหน่วยที่..." required></label>
          <label>ประเภท <select name="event_type" required>${ACTIVITY_TYPES.map(t => `<option ${editing?.event_type===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>สถานที่ <input name="location" list="activityLocationList" value="${escapeHtml(editing?.location || '')}" placeholder="เลือกหรือพิมพ์เอง" required></label><datalist id="activityLocationList">${ACTIVITY_LOCATIONS.map(x => `<option value="${escapeHtml(x)}"></option>`).join('')}</datalist>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เวลาเริ่ม <input name="start_time" type="time" value="${editing?.start_time || ''}" required></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" value="${editing?.end_time || ''}" required></label>
          <label>ผู้รับผิดชอบ <select name="owner_id" required><option value="">เลือกผู้รับผิดชอบ</option>${staffOptions(editing?.owner_id || currentStaffId())}</select></label>
          <label>เอกสารแนบ <input name="file" type="file"></label>
          <div class="wide"><div class="field-label">ผู้เข้าร่วม</div>${renderParticipantCheckboxes(asArray(editing?.participant_ids))}</div>
          <label class="wide">หมายเหตุเพิ่มเติม <textarea name="note" placeholder="ถ้ามี เช่น จำนวนคน / รายละเอียดเสริม">${escapeHtml(editing?.note || '')}</textarea></label>
          <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกกิจกรรม'}</button>
        </form>
      </div>
      <div class="card activity-list-card">
        <div class="section-title"><h3>กิจกรรมทั้งหมด</h3></div>
        <div class="toolbar compact-filter">
          <label>เดือน <input type="month" id="activityFilterMonth" value="${activityMonth}"></label>
          <label>ประเภท <select id="activityFilterType"><option value="">ทุกประเภท</option>${ACTIVITY_TYPES.map(t => `<option value="${t}" ${activityType===t?'selected':''}>${t}</option>`).join('')}</select></label>
        </div>
        ${rows.length ? renderActivityTableV57(rows) : empty('ไม่พบกิจกรรมตามตัวกรอง')}
      </div>
    </div>`;
  };

  function renderActivityTableV57(rows) {
    return `<div class="activity-card-list">${rows.map(r => {
      const participants = asArray(r.participant_ids).map(staffNick).filter(Boolean).join(', ') || '-';
      return `<div class="activity-row-card">
        <div class="activity-row-head"><div><b>${escapeHtml(r.title)}</b><br>${badge(r.event_type, activityClass(r.event_type))}</div><span class="muted">${formatThaiDate(r.start_date)}</span></div>
        <div class="activity-row-detail"><span>เวลา</span><b>${escapeHtml([r.start_time, r.end_time].filter(Boolean).join(' - ') || '-')}</b></div>
        <div class="activity-row-detail"><span>สถานที่</span><b>${escapeHtml(r.location || '-')}</b></div>
        <div class="activity-row-detail"><span>ผู้รับผิดชอบ</span><b>${escapeHtml(staffNick(r.owner_id) || '-')}</b></div>
        <div class="activity-row-detail"><span>ผู้เข้าร่วม</span><b>${escapeHtml(participants)}</b></div>
        <div class="actions">${(isAdmin() || r.created_by === currentStaffId() || r.owner_id === currentStaffId()) ? `<button class="tiny-btn" data-edit-activity="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${r.id}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}</div>
      </div>`;
    }).join('')}</div>`;
  }

  function daysInRange(start, end) { return datesBetween(start, end); }
  function noDutyCountsV57(staffId, mk, excludeId='') {
    let weekend = 0, weekday = 0;
    (state.leaves || []).filter(l => l.type === 'ไม่รับเวร' && low(l.status || 'active') !== 'cancelled' && idEq(l.staff_id, staffId) && !idEq(l.id, excludeId)).forEach(l => {
      daysInRange(l.start_date, l.end_date).forEach(d => {
        if (String(d).slice(0,7) !== mk) return;
        if (isWeekend(d)) weekend += 1; else weekday += 1;
      });
    });
    return { weekend, weekday };
  }
  function requestedNoDutyCountsV57(row, mk) {
    let weekend = 0, weekday = 0;
    daysInRange(row.start_date, row.end_date).forEach(d => {
      if (String(d).slice(0,7) !== mk) return;
      if (isWeekend(d)) weekend += 1; else weekday += 1;
    });
    return { weekend, weekday };
  }
  window.validateNoDutyLimit = function validateNoDutyLimitV57(row, excludeId='') {
    if (isAdmin() || row.type !== 'ไม่รับเวร') return null;
    const months = Array.from(new Set(daysInRange(row.start_date, row.end_date).map(d => String(d).slice(0,7))));
    for (const mk of months) {
      const oldC = noDutyCountsV57(row.staff_id, mk, excludeId);
      const newC = requestedNoDutyCountsV57(row, mk);
      if (oldC.weekend + newC.weekend > WEEKEND_NO_DUTY_LIMIT) return 'เดือนนี้ไม่รับเวรเสาร์-อาทิตย์ครบ 2 วันแล้ว';
      if (oldC.weekday + newC.weekday > WEEKDAY_NO_DUTY_LIMIT) return 'เดือนนี้ไม่รับเวรวันธรรมดาครบ 5 วันแล้ว';
    }
    return null;
  };

  const oldHandleChange = window.handleChange || handleChange;
  window.handleChange = function handleChangeV57(e) {
    const t = e.target;
    if (t.id === 'profileSummaryFilterStaff') { state.profileSummaryFilterStaff = t.value; renderPage(); return; }
    if (t.id === 'profileSummaryFilterMonth') { state.profileSummaryFilterMonth = t.value; renderPage(); return; }
    if (t.id === 'activityFilterMonth') { state.activityFilterMonth = t.value; renderPage(); return; }
    if (t.id === 'activityFilterType') { state.activityFilterType = t.value; renderPage(); return; }
    return oldHandleChange(e);
  };

  const oldHandleClick = window.handleClick || handleClick;
  window.handleClick = async function handleClickV57(e) {
    const t = e.target.closest('button, [data-page], [data-revert-profile-request]');
    if (t?.dataset?.revertProfileRequest) {
      if (!isAdmin()) return showToast('เฉพาะ Admin เท่านั้น', { tone:'error' });
      const id = t.dataset.revertProfileRequest;
      const ok = await confirmDialog('ยืนยันย้อนกลับ', 'ย้อนข้อมูลกลับเป็นค่าเดิมของคำขอนี้หรือไม่?');
      if (!ok) return;
      const req = (state.profileChangeRequests || []).map(normalizeRequest).find(r => String(r.id) === String(id));
      if (!req) return showToast('ไม่พบคำขอ', { tone:'error' });
      if (!req.old_value && req.field_name !== 'login_name') return showToast('ไม่มีค่าเดิมสำหรับย้อนกลับ กรุณาแก้ในเมนูผู้ใช้งานและสิทธิ์', { tone:'error' });
      const patch = { updated_at: new Date().toISOString() };
      patch[req.field_name] = req.old_value || null;
      const { error } = await sb.from('staff_profiles').update(patch).eq('id', req.staff_id);
      if (error) return showToast(friendlyDbError(error), { tone:'error' });
      await loadAllData(); renderPage(); showToast('ย้อนกลับข้อมูลแล้ว');
      return;
    }
    return oldHandleClick(e);
  };

  window.showToast = function showToastV57(msg, opts={}) {
    const text = String(msg || 'ดำเนินการเรียบร้อย');
    const errorWords = /(ไม่สำเร็จ|ผิดพลาด|error|กรุณา|ไม่ได้|ไม่พบ|สิทธิ์ไม่พอ|ล้มเหลว|ไม่ถูกต้อง|หมดอายุ|ไม่สมบูรณ์|ปฏิเสธ|denied|invalid|failed|ครบ\s*\d+\s*วัน|ลิงก์)/i;
    const tone = opts.tone || (errorWords.test(text) ? 'error' : 'success');
    const title = opts.title || (tone === 'error' ? 'แจ้งเตือน' : 'สำเร็จ');
    showModal(`<div class="app-alert ${tone}"><div class="app-alert-icon">${tone === 'error' ? '!' : '✓'}</div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(text)}</p><div class="confirm-actions"><button class="primary-btn" data-app-alert-ok>ตกลง</button></div></div>`, { small:true });
  };

  window.bindGlobalEvents = function bindGlobalEventsV57() {
    $('modalClose').addEventListener('click', closeModal);
    $('modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
    $('mobileMenuBtn').addEventListener('click', () => {
      const sidebar = $('sidebar');
      if (window.innerWidth > 820) {
        document.body.classList.toggle('cnmi-sidebar-hidden');
        sidebar.classList.remove('collapsed');
        document.body.classList.remove('sidebar-collapsed');
      } else {
        sidebar.classList.toggle('open');
        document.body.classList.toggle('sidebar-open', sidebar.classList.contains('open'));
      }
    });
    document.addEventListener('click', e => {
      if (window.innerWidth > 820) return;
      const sidebar = $('sidebar'); const btn = $('mobileMenuBtn');
      if (sidebar?.classList.contains('open') && !sidebar.contains(e.target) && btn && !btn.contains(e.target)) {
        sidebar.classList.remove('open'); document.body.classList.remove('sidebar-open');
      }
    });
    $('reloadBtn').addEventListener('click', async () => { await loadAllData(); renderPage(); });
    $('logoutBtn').addEventListener('click', async () => { if (sb) { await logAuth('LOGOUT'); clearCachedAppSession(); await sb.auth.signOut(); } });

    $('loginForm').addEventListener('submit', async e => {
      e.preventDefault();
      const loginId = $('loginEmail').value.trim(); const password = $('loginPassword').value;
      setBusy(true, 'กำลังเข้าสู่ระบบ');
      let email = '';
      try { email = await resolveLoginIdentifier(loginId); }
      catch (err) { setBusy(false); return showToast(err.message || 'ไม่พบชื่อผู้ใช้', { tone:'error' }); }
      const { error } = await sb.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) {
        const msg = String(error.message || '');
        if (msg.toLowerCase().includes('invalid login credentials')) return showToast('ชื่อผู้ใช้/อีเมล หรือรหัสผ่านไม่ถูกต้อง ถ้ายังไม่เคยตั้งรหัสผ่าน ให้กดแท็บ Login ครั้งแรก / ลืมรหัสผ่าน', { tone:'error' });
        return showToast(msg, { tone:'error' });
      }
    });

    $('setupPasswordForm').addEventListener('submit', async e => {
      e.preventDefault();
      const email = $('setupPasswordEmail').value.trim().toLowerCase();
      if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th', { tone:'error' });
      setBusy(true, 'กำลังส่งลิงก์ตั้งรหัสผ่านใหม่');
      try {
        const result = await requestPasswordSetupLink(email);
        showToast(result?.sentBy === 'MailApp' ? 'ส่งอีเมลตั้งรหัสผ่านแล้ว กรุณาเช็ก Inbox / Spam' : 'ถ้าอีเมลนี้อยู่ในรายชื่อเจ้าหน้าที่ ระบบจะส่งลิงก์ให้ตั้งรหัสผ่านใหม่');
      } catch (err) { showToast(err.message || 'ส่งลิงก์ไม่สำเร็จ', { tone:'error' }); }
      finally { setBusy(false); }
    });

    $('resetPasswordForm').addEventListener('submit', async e => {
      e.preventDefault();
      const loginName = s($('recoveryLoginName')?.value); const password = $('newPassword').value;
      if (!loginName) return showToast('กรุณาตั้งชื่อผู้ใช้', { tone:'error' });
      if (!/^[a-zA-Z0-9._-]+$/.test(loginName)) return showToast('ชื่อผู้ใช้ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง', { tone:'error' });
      if (!password) return showToast('กรุณากรอกรหัสผ่านใหม่', { tone:'error' });
      const { data: beforeUpdate } = await sb.auth.getSession();
      const recoveryEmail = beforeUpdate?.session?.user?.email || state.session?.user?.email || '';
      if (!recoveryEmail) return showToast('ลิงก์หมดอายุหรือไม่สมบูรณ์ กรุณาขอลิงก์ตั้งรหัสผ่านใหม่อีกครั้ง', { tone:'error' });
      setBusy(true, 'กำลังบันทึกชื่อผู้ใช้และรหัสผ่าน');
      try {
        let r = await sb.rpc('set_initial_login_name_v56', { p_email: recoveryEmail, p_login_name: loginName });
        if (r.error) r = await sb.rpc('set_initial_login_name_v44', { p_email: recoveryEmail, p_login_name: loginName });
        if (r.error) throw r.error;
        RECOVERY_INTENT = false;
        cleanAuthUrl(false);
        const { error } = await sb.auth.updateUser({ password });
        if (error) throw error;
        clearPasswordSetupForced();
        RECOVERY_INTENT = false;
        AUTH_LINK_PROCESSING = false;
        $('resetPasswordForm').classList.add('hidden');
        const { data } = await sb.auth.getSession(); state.session = data.session;
        showToast('บันทึกชื่อผู้ใช้และรหัสผ่านแล้ว'); await enterApp();
      } catch (err) { setPasswordSetupForced('password-update-failed'); RECOVERY_INTENT = true; showToast(err.message || 'บันทึกไม่สำเร็จ', { tone:'error' }); }
      finally { setBusy(false); }
    });

    document.body.addEventListener('click', handleClick);
    document.body.addEventListener('change', handleChange);
    document.body.addEventListener('submit', handleSubmit);
    // V75: restore drag/drop listeners that were accidentally omitted by later sidebar/login override.
    document.body.dataset.v75DndGuard = '1';
    document.body.addEventListener('dragstart', handleDragStart);
    document.body.addEventListener('dragover', handleDragOver);
    document.body.addEventListener('dragleave', handleDragLeave);
    document.body.addEventListener('drop', handleDrop);
  };
})();
/* V153 targeted SRS patch: exact leave labels, role-position no-duty logic, days-off strict rule, sidebar hide */
(function v153TargetedFixes(){
  function truthy(v) { return v === true || ['true','1','yes','y','active','ใช้งาน','เปิด','จัดเวร'].includes(String(v ?? '').trim().toLowerCase()); }
  function pickLeaveText(row) {
    const candidates = [row?.leave_type, row?.reason_type, row?.leave_category, row?.sub_type, row?.type, row?.reason, row?.note, row?.title]
      .map(v => String(v ?? '').split(':::')[0].trim())
      .filter(Boolean);
    const known = ['ลาป่วย','ลากิจ','ลาพักผ่อน','ลาพักร้อน','ลาคลอด','ไม่รับเวร','ลาอุปสมบท','ลาอบรม','ลาอื่นๆ','อื่นๆ'];
    for (const k of known) {
      const hit = candidates.find(t => t === k || t.includes(k));
      if (hit) return k === 'อื่นๆ' ? 'ลาอื่นๆ' : k;
    }
    const generic = candidates.find(t => !['ลา/ไม่รับเวร','ลางาน','ลา'].includes(t));
    if (generic) return generic;
    return candidates.includes('ไม่รับเวร') ? 'ไม่รับเวร' : 'ลาอื่นๆ';
  }

  try {
    isActiveStaff = window.isActiveStaff = function isActiveStaffV153(s) {
      if (!s) return false;
      if (Object.prototype.hasOwnProperty.call(s, 'active')) return truthy(s.active);
      if (Object.prototype.hasOwnProperty.call(s, 'is_active')) return truthy(s.is_active);
      return false;
    };
    isRosterStatusEnabled = window.isRosterStatusEnabled = function isRosterStatusEnabledV153(s) {
      if (!s) return false;
      const keys = ['roster_enabled','duty_enabled','can_roster','is_roster_enabled','schedule_enabled','is_schedule_enabled','จัดเวร','สถานะจัดเวร'];
      const key = keys.find(k => Object.prototype.hasOwnProperty.call(s, k));
      return key ? truthy(s[key]) : false;
    };
    isActiveRosterStaff = window.isActiveRosterStaff = function isActiveRosterStaffV153(s) {
      return isActiveStaff(s) && isRosterStatusEnabled(s) && s?.staff_type !== 'แพทย์' && !s?.maternity_status;
    };
    isRosterEnabled = window.isRosterEnabled = function isRosterEnabledV153(s) { return isActiveRosterStaff(s); };
    isDailyPositionEnabled = window.isDailyPositionEnabled = function isDailyPositionEnabledV153(s) {
      return isActiveStaff(s) && s?.staff_type !== 'แพทย์' && !s?.maternity_status && s?.position_training_status !== 'งดจัดชั่วคราว' && s?.position_training_status !== 'น้องใหม่ / ยังไม่จัดอัตโนมัติ';
    };
  } catch (_) {}

  try {
    leaveDisplayType = window.leaveDisplayType = function leaveDisplayTypeV153(row) { return pickLeaveText(row); };
    isNoDutyLeaveType = window.isNoDutyLeaveType = function isNoDutyLeaveTypeV153(typeOrRow) {
      const t = typeof typeOrRow === 'object' ? leaveDisplayType(typeOrRow) : String(typeOrRow || '').split(':::')[0].trim();
      return t === 'ไม่รับเวร';
    };
    leaveCellClass = window.leaveCellClass = function leaveCellClassV153(typeOrRow) {
      const t = typeof typeOrRow === 'object' ? leaveDisplayType(typeOrRow) : String(typeOrRow || '').split(':::')[0].trim();
      if (t === 'ลากิจ') return 'leave-personal';
      if (t === 'ลาป่วย') return 'leave-sick';
      if (t === 'ลาพักผ่อน' || t === 'ลาพักร้อน') return 'leave-vacation';
      if (t === 'ลาคลอด') return 'leave-maternity';
      if (t === 'ไม่รับเวร') return 'leave-no-duty';
      return 'leave-other';
    };
    leaveCellBadge = window.leaveCellBadge = function leaveCellBadgeV153(row) {
      if (!row) return '';
      const t = leaveDisplayType(row);
      return `<span class="mini-status ${leaveCellClass(row)}">${escapeHtml(t)}</span>`;
    };
  } catch (_) {}

  try {
    calculateDaysOff = window.calculateDaysOff = function calculateDaysOffV157(staffId, key=state.monthKey, assignments=scheduleAssignmentsForMonth(key)) {
      return scheduleMonthDates(key).reduce((sum, date) => {
        // ชั้นนอกสุดต้องเป็นประเภทวันเท่านั้น: วันธรรมดาไม่ถูกนับเสมอ
        const isCalendarOff = isWeekend(date) || isHolidayDate(date);
        if (!isCalendarOff) return sum;

        // ถ้ามีเวรใดๆ ในวันหยุดนั้น ห้ามนับเป็นวันหยุดสะสม
        const hasDuty = hasAnyDutyOn(staffId, date, assignments);
        if (hasDuty) return sum;

        // สถานะ ลา / ไม่รับเวร ไม่ขัดขวางการนับ หากเป็นวันหยุดและไม่มีเวร
        return sum + 1;
      }, 0);
    };
  } catch (_) {}

  try {
    renderGridView = window.renderGridView = function renderGridViewV153(staffList, assignments, key=state.monthKey) {
      const dates = scheduleMonthDates(key);
      return `<div class="table-wrap clean-grid-wrap"><table id="scheduleTable" class="clean-schedule-grid"><thead><tr><th class="clean-sticky-col">เจ้าหน้าที่</th>${dates.map(date => {
        const d = parseDate(date);
        const off = isWeekend(date) || isHolidayDate(date);
        const hname = isHolidayDate(date) ? `<br><small>${escapeHtml(holidayName(date))}</small>` : '';
        return `<th class="${off ? 'offday-col' : ''}">${d.getDate()}<br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span>${hname}</th>`;
      }).join('')}</tr></thead><tbody>${(staffList || []).filter(isRosterEnabled).map(st => {
        const bg = staffColor(st);
        const fg = textColorFor(bg);
        return `<tr><th class="clean-sticky-col clean-staff-cell" style="--staff-bg:${bg};--staff-fg:${fg};background:${bg};color:${fg}"><button type="button" data-staff-stat="${st.id}">${escapeHtml(st.nickname || st.full_name || '-')}</button></th>${dates.map(date => {
          const shifts = (assignments || [])
            .filter(a => String(a?.staff_id) === String(st.id) && normalizeDateKey(a?.duty_date) === date)
            .sort((a,b) => dutySortIndex(a?.duty_code) - dutySortIndex(b?.duty_code));
          const off = isWeekend(date) || isHolidayDate(date);
          const leave = activeLeaveRecordOn(st.id, date);
          const leaveCls = leave ? leaveCellClass(leave) : '';
          const leaveHtml = leave ? leaveCellBadge(leave) : '';
          const shiftHtml = shifts.length ? shifts.map(a => {
            const attrs = canRequestTrade(a) ? `data-trade-duty="${a.id}"` : `data-staff-stat="${st.id}"`;
            return `<button type="button" class="clean-shift-pill" style="--staff-bg:${bg};--staff-fg:${fg};background:${bg};color:${fg}" ${attrs}>${escapeHtml(dutyDisplayLabel(a?.duty_code))}</button>`;
          }).join('') : '';
          return `<td class="${off ? 'offday-col' : ''} ${leaveCls}"><div class="clean-cell-stack">${leaveHtml}${shiftHtml}${(!shiftHtml && off && !leave) ? '<span class="muted">หยุด</span>' : ''}</div></td>`;
        }).join('')}</tr>`;
      }).join('')}</tbody></table></div>`;
    };
  } catch (_) {}

  try {
    buildMonthPositionSummary = window.buildMonthPositionSummary = function buildMonthPositionSummaryV153(rows, dates) {
      const dateSet = new Set(dates || []);
      const summary = {};
      (rows || []).forEach(r => {
        if (!r?.staff_id || !r?.work_date || (dateSet.size && !dateSet.has(r.work_date))) return;
        if (isNoPositionDay(r.work_date)) return;
        const leave = activeLeaveRecordOn(r.staff_id, r.work_date);
        if (leave && !isNoDutyLeaveType(leave)) return;
        const st = state.staff.find(s => String(s.id) === String(r.staff_id));
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
    };


    function monthPositionExpectedTemplatesForDate(date) {
      const key = normalizeDateKey(date);
      if (!key || isWeekend(key) || isHolidayDate(key)) return [];
      const list = hasOuting(key)
        ? [...OUTING_POSITIONS, ...DEFAULT_POSITIONS.filter(p => p.zone === 'Blood Bank' || p.zone === 'Manual')]
        : DEFAULT_POSITIONS;
      const seen = new Set();
      const out = [];
      list.forEach(p => {
        const code = positionBaseCode(p?.code || '');
        if (!code || seen.has(code)) return;
        seen.add(code);
        out.push({ ...p, code });
      });
      return out;
    }

    function monthPositionAssignedCodeSet(rows, date) {
      const key = normalizeDateKey(date);
      const assigned = new Set();
      (rows || []).forEach(r => {
        if (normalizeDateKey(r?.work_date) !== key) return;
        if (!r?.staff_id) return;
        const code = positionBaseCode(r?.position_code || r?.code || '');
        if (!code || code === 'รอตรวจสอบ') return;
        assigned.add(code);
      });
      return assigned;
    }

    function monthPositionMissingRolesForDate(rows, date) {
      const expected = monthPositionExpectedTemplatesForDate(date);
      const assigned = monthPositionAssignedCodeSet(rows, date);
      return expected.filter(p => !assigned.has(positionBaseCode(p.code)));
    }

    function renderMonthPositionMissingCell(date, rows) {
      const key = normalizeDateKey(date);
      if (isWeekend(key) || isHolidayDate(key)) return `<th class="missing-role-cell no-position-day">ไม่จัด</th>`;
      const missing = monthPositionMissingRolesForDate(rows, key);
      if (!missing.length) return `<th class="missing-role-cell complete">ครบ</th>`;
      return `<th class="missing-role-cell has-missing">${missing.map(p => `<span>${escapeHtml(positionLabelForCell(p.code))}</span>`).join('')}</th>`;
    }

    renderMonthPositionMatrix = window.renderMonthPositionMatrix = function renderMonthPositionMatrixV153(rows, dates) {
      if (!(rows || []).length) return empty('ยังไม่มีแผนรายเดือน กด “สร้างแผนทั้งเดือน” ก่อน');
      const byCell = {};
      (rows || []).forEach((r, idx) => {
        if (!r?.staff_id || !r?.work_date) return;
        const key = `${r.staff_id}|${r.work_date}`;
        byCell[key] = byCell[key] || [];
        byCell[key].push({ ...r, _idx: idx });
      });
      const canEdit = isAdmin() && state.page === 'positionMonth';
      const displayStaff = orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) || (rows || []).some(r => String(r?.staff_id) === String(s.id))));
      return `<div class="monthly-matrix-wrap v153-position-matrix v158-position-matrix">
        <div class="matrix-legend"><span class="legend-box weekend"></span> WEEKEND/HOLIDAY = ไม่จัดตำแหน่ง <span class="legend-box outing"></span> ออกหน่วย <span class="legend-box leave"></span> แสดงเฉพาะลางานจริง / ไม่รับเวรยังจัดตำแหน่งได้ ${canEdit ? '<span class="hint">Admin เลือกตำแหน่งในช่องได้ แล้วกดบันทึกแผนทั้งเดือน</span>' : ''}</div>
        <div class="table-wrap month-position-matrix"><table><thead><tr><th class="sticky-col staff-col">เจ้าหน้าที่</th>${(dates || []).map(date => {
          const d = parseDate(date);
          const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : hasOuting(date) ? 'outing-head' : '';
          return `<th class="date-head ${cls}"><b>${d.getDate()}</b><br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span></th>`;
        }).join('')}</tr><tr class="missing-role-row"><th class="sticky-col staff-col missing-role-head">ยังขาด</th>${(dates || []).map(date => renderMonthPositionMissingCell(date, rows || [])).join('')}</tr></thead><tbody>
          ${displayStaff.map(st => `<tr><td class="sticky-col staff-col staff-color-cell" style="background:${staffColor(st)};color:${textColorFor(staffColor(st))}"><button class="staff-summary-trigger compact-staff-summary" data-month-position-stat="${st.id}" type="button" title="ดูสรุปตำแหน่งรายเดือนของ ${escapeHtml(st.nickname || st.full_name || '')}"><b>${escapeHtml(st.nickname || st.full_name || '-')}</b><span>(ดูสรุป)</span></button></td>${(dates || []).map(date => renderMonthPositionCell(st, date, byCell[`${st.id}|${date}`] || [], canEdit)).join('')}</tr>`).join('')}
        </tbody></table></div>
      </div>`;
    }

    renderMonthPositionCell = window.renderMonthPositionCell = function renderMonthPositionCellV153(staff, date, cellRows, canEdit=false) {
      const key = normalizeDateKey(date);
      const isWeekendDay = isWeekend(key);
      const isHolidayDay = isHolidayDate(key);
      if (isWeekendDay || isHolidayDay) {
        return `<td class="matrix-cell no-position-day ${isHolidayDay ? 'holiday-cell' : 'weekend-cell'}"><span>${isHolidayDay ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
      }
      const leaveRow = activeLeaveRecordOn(staff?.id, key);
      const leaveType = leaveDisplayType(leaveRow);
      const isRealLeave = !!leaveRow && !isNoDutyLeaveType(leaveRow);
      const outing = hasOuting(key);
      const row = (cellRows || [])[0] || null;
      const cleanCodes = (cellRows || []).map(r => positionLabelForCell(r?.position_code || r?.code)).filter(Boolean);
      const cls = `${outing ? 'outing-cell' : ''} ${isRealLeave ? 'leave-cell ' + leaveCellClass(leaveRow) : ''} ${!cleanCodes.length && !isRealLeave ? 'needs-review-cell' : ''}`.trim();
      if (canEdit && !isRealLeave) {
        const current = row?.position_code || '';
        const options = monthPositionRoleOptionsForDate(key, current);
        return `<td class="matrix-cell ${cls}"><select class="month-position-select" data-month-position-edit="${key}|${staff?.id}"><option value="">รอตรวจสอบ</option>${options.map(t => `<option value="${escapeHtml(t.code)}" ${current===t.code?'selected':''}>${escapeHtml(positionLabelForCell(t.code))}</option>`).join('')}</select>${outing ? '<div class="cell-note">ออกหน่วย</div>' : ''}</td>`;
      }
      const text = cleanCodes.length ? cleanCodes.join('<br>') : (isRealLeave ? escapeHtml(leaveType) : '');
      const leaveMark = isRealLeave ? '<div class="cell-note">ลางาน</div>' : '';
      const outingMark = outing && cleanCodes.length ? '<div class="cell-note">ออกหน่วย</div>' : '';
      return `<td class="matrix-cell ${cls}">${text ? `<span>${text}</span>` : ''}${leaveMark}${outingMark}</td>`;
    };
  } catch (_) {}

  try {
    const WEEKLY_AUTO_FILL_POSITION_CODES = new Set(['DR-Processing', 'BB-Report']);

    window.monthPositionRoleOptionsForDate = monthPositionRoleOptionsForDate = function monthPositionRoleOptionsForDateV154(date, currentCode='') {
      const isOutingDay = hasOuting(normalizeDateKey(date));
      const allowed = (isOutingDay
        ? [
            ...DEFAULT_POSITIONS.filter(p => p.zone === 'Blood Bank' || p.zone === 'Manual'),
            ...OUTING_POSITIONS
          ]
        : DEFAULT_POSITIONS.filter(p => p.zone === 'Blood Bank' || p.zone === 'Manual' || p.zone === 'Donor Room'));
      const seen = new Set();
      const options = [];
      allowed.forEach(p => {
        if (!p?.code || seen.has(p.code)) return;
        seen.add(p.code);
        options.push(p);
      });
      if (currentCode && !seen.has(currentCode)) {
        const current = positionTemplateByCode(currentCode, date) || ALL_POSITION_TEMPLATES.find(p => p.code === currentCode);
        if (current?.code) options.push(current);
      }
      return options;
    };

    window.isRealMonthlyPositionLeave = isRealMonthlyPositionLeave = function isRealMonthlyPositionLeaveV154(staffId, date) {
      const leave = activeLeaveRecordOn(staffId, normalizeDateKey(date));
      return !!leave && !isNoDutyLeaveType(leave);
    };

    window.weekdayDatesForSameWorkWeek = weekdayDatesForSameWorkWeek = function weekdayDatesForSameWorkWeekV154(date) {
      const base = parseDate(normalizeDateKey(date));
      const day = base.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(base);
      monday.setDate(base.getDate() + diffToMonday);
      return Array.from({ length: 5 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      });
    };

    window.canAutoFillMonthPositionCell = canAutoFillMonthPositionCell = function canAutoFillMonthPositionCellV154(staffId, date) {
      const key = normalizeDateKey(date);
      if (isWeekend(key) || isHolidayDate(key)) return false;
      if (isRealMonthlyPositionLeave(staffId, key)) return false;
      return true;
    };

    window.upsertMonthPositionDraftCell = upsertMonthPositionDraftCell = function upsertMonthPositionDraftCellV154(rows, date, staffId, code) {
      const d = normalizeDateKey(date);
      const sid = String(staffId || '');
      const next = (rows || []).filter(r => !(normalizeDateKey(r?.work_date) === d && String(r?.staff_id || '') === sid));
      if (code) next.push(makeMonthPositionRow(d, staffId, code));
      return next;
    };

    applyMonthPositionEdit = window.applyMonthPositionEdit = function applyMonthPositionEditV154(value, encoded) {
      if (!isAdmin()) return;
      const [dateRaw, staffId] = String(encoded || '').split('|');
      const date = normalizeDateKey(dateRaw);
      if (!date || !staffId) return;
      ensureMonthPositionDraftForEdit();
      let rows = state.monthPositionDraft?.rows || [];
      const selectedCode = String(value || '').trim();
      const isWeeklyAutoFill = WEEKLY_AUTO_FILL_POSITION_CODES.has(selectedCode);
      const targetDates = isWeeklyAutoFill ? weekdayDatesForSameWorkWeek(date) : [date];
      let changed = 0;
      let cleared = 0;
      targetDates.forEach(d => {
        if (!canAutoFillMonthPositionCell(staffId, d)) return;
        if (isWeeklyAutoFill) {
          const before = rows.length;
          rows = rows.filter(r => {
            const sameDate = normalizeDateKey(r?.work_date) === d;
            const samePosition = String(positionBaseCode(r?.position_code || r?.code || '')) === selectedCode;
            const otherStaff = String(r?.staff_id || '') !== String(staffId || '');
            return !(sameDate && samePosition && otherStaff);
          });
          cleared += before - rows.length;
        }
        rows = upsertMonthPositionDraftCell(rows, d, staffId, selectedCode);
        changed += 1;
      });
      state.monthPositionDraft.rows = rows;
      rebalanceMonthPositionDraft();
      renderPage();
      if (isWeeklyAutoFill) {
        showToast(`เติม ${positionLabelForCell(selectedCode)} ให้วันทำงานสัปดาห์นี้แล้ว ${changed} ช่อง${cleared ? ` และเคลียร์ตำแหน่งซ้ำของคนอื่น ${cleared} ช่อง` : ''}`);
      } else {
        showToast('ปรับตำแหน่งในร่างแล้ว กดบันทึกแผนทั้งเดือนเพื่อบันทึกจริง');
      }
    }
  } catch (_) {}

  try {
    const oldBind = window.bindGlobalEvents || bindGlobalEvents;
    bindGlobalEvents = window.bindGlobalEvents = function bindGlobalEventsV153() {
      oldBind();
      const btn = document.getElementById('mobileMenuBtn');
      const sidebar = document.getElementById('sidebar');
      if (!btn || !sidebar || btn.dataset.v153SidebarBound === '1') return;
      btn.dataset.v153SidebarBound = '1';
      btn.addEventListener('click', function(ev) {
        if (window.innerWidth > 820) {
          ev.stopImmediatePropagation();
          document.body.classList.toggle('cnmi-sidebar-hidden');
          sidebar.classList.remove('open','collapsed');
          document.body.classList.remove('sidebar-open','sidebar-collapsed');
          setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
        }
      }, true);
    };
  } catch (_) {}
})();

/* =========================================================
   V159 UI/Interaction patch: compact monthly positions,
   roster slot swap DnD, scroll preservation, leave filters
   ========================================================= */
(function () {
  const VERSION = 'V159';

  function normId(v) { return String(v ?? '').trim(); }
  function safeDateKey(v) { return normalizeDateKey(v || ''); }
  function getSlotId(slot) { return slot ? (slot.id || slot._temp_id || '') : ''; }

  function captureScrollState() {
    const nodes = Array.from(document.querySelectorAll('.table-wrap, .staff-pool, #sidebar'));
    return {
      x: window.scrollX || 0,
      y: window.scrollY || 0,
      nodes: nodes.map((el, idx) => ({ idx, left: el.scrollLeft || 0, top: el.scrollTop || 0 }))
    };
  }

  function restoreScrollState(snapshot) {
    if (!snapshot) return;
    requestAnimationFrame(() => {
      window.scrollTo(snapshot.x || 0, snapshot.y || 0);
      const nodes = Array.from(document.querySelectorAll('.table-wrap, .staff-pool, #sidebar'));
      (snapshot.nodes || []).forEach(s => {
        const el = nodes[s.idx];
        if (!el) return;
        el.scrollLeft = s.left || 0;
        el.scrollTop = s.top || 0;
      });
    });
  }

  function keepScrollAction(t) {
    if (!t) return false;
    const ds = t.dataset || {};
    return t.hasAttribute('data-save-roster')
      || t.hasAttribute('data-publish-roster')
      || t.hasAttribute('data-lock-roster')
      || t.hasAttribute('data-clear-roster-month')
      || t.hasAttribute('data-restore-roster-month')
      || t.hasAttribute('data-generate-roster')
      || t.hasAttribute('data-auto-assign')
      || ds.clearSlot !== undefined
      || ds.toggleLockSlot !== undefined
      || ds.rosterSlotSelect !== undefined
      || t.hasAttribute('data-save-month-positions')
      || t.hasAttribute('data-clear-month-positions')
      || t.hasAttribute('data-restore-month-positions');
  }

  function fiscalYearCE(dateStr) {
    const key = safeDateKey(dateStr);
    if (!key) return new Date().getFullYear() + (new Date().getMonth() + 1 >= 10 ? 1 : 0);
    const d = parseDate(key);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return m >= 10 ? y + 1 : y;
  }

  function fiscalYearRangeCE(fy) {
    const n = Number(fy);
    return { start: `${n - 1}-10-01`, end: `${n}-09-30` };
  }

  function leaveOverlapsFiscalYear(row, fy) {
    if (!fy) return true;
    const { start, end } = fiscalYearRangeCE(fy);
    const rs = safeDateKey(row?.start_date);
    const re = safeDateKey(row?.end_date || row?.start_date);
    if (!rs || !re) return false;
    return re >= start && rs <= end;
  }

  function fiscalYearOptions(rows) {
    const set = new Set([fiscalYearCE(todayStr())]);
    (rows || []).forEach(r => {
      const a = fiscalYearCE(r.start_date);
      const b = fiscalYearCE(r.end_date || r.start_date);
      for (let y = Math.min(a, b); y <= Math.max(a, b); y++) set.add(y);
    });
    return Array.from(set).sort((a, b) => b - a);
  }

  function filteredLeaveRows(baseRows) {
    const type = state.leaveFilterType || '';
    const fy = state.leaveFilterFiscalYear || '';
    const staffId = state.leaveFilterStaff || '';
    return (baseRows || []).filter(r => {
      if (type && leaveDisplayType(r) !== type) return false;
      if (fy && !leaveOverlapsFiscalYear(r, fy)) return false;
      if (staffId && String(r.staff_id) !== String(staffId)) return false;
      return true;
    });
  }

  function renderLeaveFilterBar(baseRows, adminMode) {
    const types = Array.from(new Set([...(LEAVE_TYPES || []), ...(baseRows || []).map(leaveDisplayType).filter(Boolean)]));
    const fyOptions = fiscalYearOptions(baseRows || []);
    const currentType = state.leaveFilterType || '';
    const currentFy = state.leaveFilterFiscalYear || '';
    const currentStaff = state.leaveFilterStaff || '';
    return `<div class="leave-filter-bar compact-filter">
      <label>ประเภทลา
        <select id="leaveFilterType"><option value="">ทั้งหมด</option>${types.map(t => `<option value="${escapeHtml(t)}" ${currentType === t ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('')}</select>
      </label>
      <label>ปีงบประมาณ
        <select id="leaveFilterFiscalYear"><option value="">ทั้งหมด</option>${fyOptions.map(y => `<option value="${y}" ${String(currentFy) === String(y) ? 'selected' : ''}>ปีงบประมาณ ${y + 543}</option>`).join('')}</select>
      </label>
      ${adminMode ? `<label>ชื่อเจ้าหน้าที่
        <select id="leaveFilterStaff"><option value="">ทุกคน</option>${staffOptionList(currentStaff, s => isActiveStaff(s))}</select>
      </label>` : ''}
    </div>`;
  }

  renderLeavePage = window.renderLeavePage = function renderLeavePageV159() {
    const adminMode = isAdmin();
    const baseRows = state.leaves.filter(x => adminMode || x.staff_id === currentStaffId());
    const rows = filteredLeaveRows(baseRows);
    const editing = state.editingLeaveId ? state.leaves.find(x => x.id === state.editingLeaveId) : null;
    const selectedStaff = editing?.staff_id || currentStaffId();
    const selectedPhone = editing?.contact_phone || staffPhone(selectedStaff);
    return `
      <div class="grid grid-2">
        <div class="card">
          <div class="section-title"><h3>${editing ? 'แก้ไขรายการ' : 'แจ้งลา / ไม่รับเวร'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-leave>ยกเลิกแก้ไข</button>' : ''}</div>
          <form id="leaveForm" class="form-grid">
            ${adminMode ? `<label class="wide">บันทึกให้เจ้าหน้าที่ <select name="staff_id" id="leaveStaffSelect" required>${staffOptions(selectedStaff)}</select><span class="hint">Admin เพิ่ม/แก้ไข/ยกเลิกแทน staff ได้ รวมถึงลาย้อนหลัง กรณีเจ้าหน้าที่ไม่สะดวกบันทึกเอง</span></label>` : ''}
            <label>ประเภท
              <select name="type" required>${LEAVE_TYPES.map(t => `<option ${editing?.type === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
            </label>
            <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
            <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
            <label>ช่วงเวลา
              <select name="leave_period">
                ${['เต็มวัน','ครึ่งเช้า 08:00-12:30','ครึ่งบ่าย 11:30-16:00'].map(v => `<option value="${v}" ${(editing?.leave_period || 'เต็มวัน') === v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </label>
            <label>เบอร์ติดต่อระหว่างลา <input name="contact_phone" id="leaveContactPhone" value="${escapeHtml(selectedPhone || '')}" placeholder="ระบบเติมจากข้อมูลเจ้าหน้าที่ให้อัตโนมัติ"></label>
            <label>แนบไฟล์ (ถ้ามี) <input name="file" type="file"><span class="hint">ไม่บังคับแนบไฟล์ ถ้ามีเอกสารค่อยแนบได้</span></label>
            ${adminMode ? `<label class="wide">เหตุผลที่ Admin บันทึกแทน / ย้อนหลัง <textarea name="admin_record_reason" placeholder="เช่น น้องไม่สะดวกเข้าระบบ / บันทึกย้อนหลังตามใบลา / แจ้งทางโทรศัพท์">${escapeHtml(editing?.admin_record_reason || '')}</textarea></label>` : ''}
            <label class="wide">หมายเหตุ <textarea name="note" placeholder="ระบุรายละเอียดเพิ่มเติม">${escapeHtml(editing?.note || '')}</textarea></label>
            <div class="notice soft-notice wide">ถ้าวันที่ขอลามีการประกาศตารางตำแหน่งรายวันแล้ว ระบบยังบันทึกได้ แต่จะแจ้งเตือนให้ติดต่ออินชาร์จหรือหัวหน้า เพื่อให้ปรับตำแหน่งหน้างานทันที</div>
            <button class="primary-btn wide" type="submit">${editing ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}</button>
          </form>
        </div>
        <div class="card leave-list-card">
          <div class="section-title"><h3>${adminMode ? 'รายการของทุกคน' : 'ประวัติของฉัน'}</h3><span class="muted">แสดง ${rows.length} / ${baseRows.length} รายการ</span></div>
          ${renderLeaveFilterBar(baseRows, adminMode)}
          ${renderLeaveTable(rows)}
        </div>
      </div>`;
  };

  renderRosterGrid = window.renderRosterGrid = function renderRosterGridV159(assignments) {
    if (!assignments.length) return empty('กด “สร้างร่าง Auto Assign” เพื่อเริ่มจัดเวร');
    const { y, m } = getMonthRange(state.monthKey);
    const last = new Date(y, m, 0).getDate();
    const desktopTable = `<div class="table-wrap roster-table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
      ${Array.from({ length: last }, (_, i) => i + 1).map(day => {
        const date = `${y}-${pad(m)}-${pad(day)}`;
        const dow = parseDate(date).toLocaleDateString('th-TH', { weekday: 'short' });
        return `<tr><td><b>${day}</b><br><span class="muted">${dow}</span>${isHolidayDate(date) ? `<br><span class="badge yellow">${escapeHtml(holidayName(date))}</span>` : ''}</td>${DUTY_COLUMNS.map(code => {
          if (!allowedDutyCodesForDate(date).includes(code)) return '<td class="muted">-</td>';
          const slot = assignments.find(a => a.duty_date === date && a.duty_code === code);
          if (!slot) return '<td class="muted">-</td>';
          const id = getSlotId(slot);
          const canDrag = slot.staff_id && !slot.is_locked && !isRosterDropBlocked(slot);
          return `<td><div class="roster-slot ${slot.is_locked ? 'locked' : ''} ${slot.staff_id ? 'has-staff' : ''}" data-drop-slot="${id}" ${canDrag ? `draggable="true" data-drag-slot-source="${id}"` : ''}>
            <div class="assigned-name">${slot.staff_id ? staffPill(slot.staff_id) : 'ยังไม่จัด'}</div>
            <div class="slot-meta">${escapeHtml(slot.required_role)} ${slot.is_locked ? '• locked' : ''}${slot.staff_id ? ' • ลากสลับในวันเดียวกันได้' : ''}</div>
            <select class="mobile-roster-select" data-roster-slot-select="${id}" ${slot.is_locked ? 'disabled' : ''}><option value="">ยังไม่จัด</option>${staffOptionList(slot.staff_id, st => canStaffWorkSlot(st.id, slot))}</select>
            <div class="actions"><button class="tiny-btn" data-clear-slot="${id}">ล้าง</button><button class="tiny-btn" data-toggle-lock-slot="${id}">${slot.is_locked ? 'ปลดล็อก' : 'ล็อก'}</button></div>
          </div></td>`;
        }).join('')}</tr>`;
      }).join('')}
    </tbody></table></div>`;
    return desktopTable + renderRosterMobileGrid(assignments, y, m, last);
  };

  function canSwapStaffToSlot(staffId, slot, assignments) {
    if (!staffId) return true;
    const st = state.staff.find(x => String(x.id) === String(staffId));
    if (!isRosterEnabled(st)) return false;
    if (!supportsRequiredRole(st, slot.required_role)) return false;
    if (activeLeaveRecordOn(staffId, slot.duty_date)) return false;
    if (isConsecutiveRestrictedDuty(slot?.duty_code) && hasAdjacentDuty(staffId, slot.duty_date, assignments, slot)) return false;
    return true;
  }

  function swapRosterSlots(sourceId, targetId, targetEl) {
    if (!sourceId || !targetId || String(sourceId) === String(targetId)) return;
    const source = findDraftSlot(sourceId);
    const target = findDraftSlot(targetId);
    if (!source || !target) return;
    if (source.is_locked || target.is_locked) return showToast('ช่องต้นทางหรือปลายทางล็อกอยู่');
    if (isRosterDropBlocked(source) || isRosterDropBlocked(target)) return showToast('ช่องนี้ปิดใช้งาน จึงไม่รับการสลับเวร');
    if (safeDateKey(source.duty_date) !== safeDateKey(target.duty_date)) return showToast('สลับเวรได้เฉพาะช่องที่อยู่วันเดียวกัน');

    const assignments = cloneRosterAssignmentsForDraft();
    const src = assignments.find(x => getSlotId(x) === String(sourceId));
    const dst = assignments.find(x => getSlotId(x) === String(targetId));
    if (!src || !dst) return;
    const sourceStaff = src.staff_id || null;
    const targetStaff = dst.staff_id || null;
    const candidate = assignments.map(a => {
      const id = getSlotId(a);
      if (id === String(sourceId)) return { ...a, staff_id: targetStaff };
      if (id === String(targetId)) return { ...a, staff_id: sourceStaff };
      return { ...a };
    });
    const srcAfter = candidate.find(x => getSlotId(x) === String(sourceId));
    const dstAfter = candidate.find(x => getSlotId(x) === String(targetId));
    if (!canSwapStaffToSlot(sourceStaff, dstAfter, candidate)) return showToast('สลับไม่ได้: เจ้าหน้าที่ต้นทางไม่ตรงประเภทเวร/ติดลา/ติดเวรต่อเนื่อง');
    if (!canSwapStaffToSlot(targetStaff, srcAfter, candidate)) return showToast('สลับไม่ได้: เจ้าหน้าที่ปลายทางไม่ตรงประเภทเวร/ติดลา/ติดเวรต่อเนื่อง');

    const snap = captureRosterScroll(targetEl || document.querySelector(`[data-drop-slot="${targetId}"]`));
    state.rosterDraft = { monthKey: state.monthKey, assignments: candidate };
    renderPage();
    restoreRosterScroll(snap);
    showToast(targetStaff ? 'สลับเวรในวันเดียวกันแล้ว กดบันทึกเพื่อบันทึกจริง' : 'ย้ายเวรไปช่องใหม่แล้ว กดบันทึกเพื่อบันทึกจริง');
  }

  handleDragStart = window.handleDragStart = function handleDragStartV159(e) {
    if (e.target.closest('select, button, input, textarea, a')) return;
    const slot = e.target.closest('[data-drag-slot-source]');
    if (slot) {
      e.dataTransfer.setData('sourceSlotId', slot.dataset.dragSlotSource);
      e.dataTransfer.effectAllowed = 'move';
      slot.classList.add('dragging');
      return;
    }
    const chip = e.target.closest('[data-drag-staff]');
    if (chip) {
      e.dataTransfer.setData('staffId', chip.dataset.dragStaff);
      e.dataTransfer.effectAllowed = 'copyMove';
    }
  };

  handleDragOver = window.handleDragOver = function handleDragOverV159(e) {
    const slot = e.target.closest('[data-drop-slot]');
    if (!slot) return;
    e.preventDefault();
    slot.classList.add('drag-over');
  };

  handleDragLeave = window.handleDragLeave = function handleDragLeaveV159(e) {
    const slot = e.target.closest('[data-drop-slot]');
    if (slot) slot.classList.remove('drag-over');
  };

  handleDrop = window.handleDrop = function handleDropV159(e) {
    const slotEl = e.target.closest('[data-drop-slot]');
    if (!slotEl) return;
    e.preventDefault();
    document.querySelectorAll('.roster-slot.drag-over, .roster-slot.dragging').forEach(el => el.classList.remove('drag-over', 'dragging'));
    const slotId = slotEl.dataset.dropSlot;
    const sourceSlotId = e.dataTransfer?.getData('sourceSlotId');
    if (sourceSlotId) {
      swapRosterSlots(sourceSlotId, slotId, slotEl);
      return;
    }

    const staffId = e.dataTransfer?.getData('staffId');
    if (!staffId || !slotId) return;
    const target = findDraftSlot(slotId);
    if (!target) return;
    if (target.is_locked) return showToast('ช่องนี้ล็อกอยู่');
    if (isRosterDropBlocked(target)) return showToast('ช่องนี้เป็นวันหยุด/WEEKEND ที่ปิดไว้ จึงไม่รับการลากวาง');
    const currentAssignments = cloneRosterAssignmentsForDraft();
    const targetForValidation = currentAssignments.find(x => getSlotId(x) === String(slotId)) || target;
    if (!canStaffWorkSlot(staffId, targetForValidation, currentAssignments)) {
      if (isConsecutiveRestrictedDuty(targetForValidation?.duty_code) && hasAdjacentDuty(staffId, targetForValidation.duty_date, currentAssignments, targetForValidation)) return showToast('คนนี้มีเวร ชบด ติดกับวันก่อน/วันถัดไปแล้ว กรุณาเลือกคนอื่น');
      return showToast('คนนี้ติดลา/ไม่รับเวร หรือประเภทไม่ตรงกับเวร');
    }
    const snap = captureRosterScroll(slotEl);
    updateDraftSlot(slotId, { staff_id: staffId }, currentAssignments);
    renderPage();
    restoreRosterScroll(snap);
  };

  function expectedMonthPositionTemplatesV159(date) {
    const key = safeDateKey(date);
    if (!key || isWeekend(key) || isHolidayDate(key)) return [];
    const source = hasOuting(key)
      ? [...OUTING_POSITIONS, ...DEFAULT_POSITIONS.filter(p => p.zone === 'Blood Bank' || p.zone === 'Manual')]
      : DEFAULT_POSITIONS;
    const seen = new Set();
    const out = [];
    (source || []).forEach(p => {
      const code = positionBaseCode(p?.code || '');
      if (!code || seen.has(code)) return;
      seen.add(code);
      out.push({ ...p, code });
    });
    return out;
  }

  function assignedMonthPositionCodesV159(rows, date) {
    const key = safeDateKey(date);
    const assigned = new Set();
    (rows || []).forEach(r => {
      if (safeDateKey(r?.work_date) !== key || !r?.staff_id) return;
      const code = positionBaseCode(r?.position_code || r?.code || '');
      if (!code || code === 'รอตรวจสอบ') return;
      assigned.add(code);
    });
    return assigned;
  }

  function renderMonthPositionMissingCellV159(date, rows) {
    const key = safeDateKey(date);
    if (isWeekend(key) || isHolidayDate(key)) return `<th class="missing-role-cell no-position-day">ไม่จัด</th>`;
    const assigned = assignedMonthPositionCodesV159(rows, key);
    const missing = expectedMonthPositionTemplatesV159(key).filter(p => !assigned.has(positionBaseCode(p.code)));
    if (!missing.length) return `<th class="missing-role-cell complete">ครบ</th>`;
    return `<th class="missing-role-cell has-missing">${missing.map(p => `<span>${escapeHtml(positionLabelForCell(p.code))}</span>`).join('')}</th>`;
  }

  renderMonthPositionMatrix = window.renderMonthPositionMatrix = function renderMonthPositionMatrixV159(rows, dates) {
    if (!(rows || []).length) return empty('ยังไม่มีแผนรายเดือน กด “สร้างแผนทั้งเดือน” ก่อน');
    const byCell = {};
    (rows || []).forEach((r, idx) => {
      if (!r?.staff_id || !r?.work_date) return;
      const key = `${r.staff_id}|${r.work_date}`;
      byCell[key] = byCell[key] || [];
      byCell[key].push({ ...r, _idx: idx });
    });
    const canEdit = isAdmin() && state.page === 'positionMonth';
    const displayStaff = orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) || (rows || []).some(r => String(r?.staff_id) === String(s.id))));
    const dateHeads = (dates || []).map(date => {
      const d = parseDate(date);
      const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : hasOuting(date) ? 'outing-head' : '';
      return `<th class="date-head ${cls}"><b>${d.getDate()}</b><br><span>${d.toLocaleDateString('th-TH', { weekday: 'short' })}</span></th>`;
    }).join('');
    const missingCells = (dates || []).map(date => renderMonthPositionMissingCellV159(date, rows || [])).join('');
    return `<div class="monthly-matrix-wrap v153-position-matrix v158-position-matrix v159-position-matrix">
      <div class="matrix-legend"><span class="legend-box weekend"></span> WEEKEND/HOLIDAY = ไม่จัดตำแหน่ง <span class="legend-box outing"></span> ออกหน่วย <span class="legend-box leave"></span> แสดงเฉพาะลางานจริง / ไม่รับเวรยังจัดตำแหน่งได้ ${canEdit ? '<span class="hint">Admin เลือกตำแหน่งในช่องได้ แล้วกดบันทึกแผนทั้งเดือน</span>' : ''}</div>
      <div class="table-wrap month-position-matrix"><table><thead>
        <tr><th class="sticky-col staff-col">เจ้าหน้าที่</th><th class="sticky-col summary-col">สรุป</th>${dateHeads}</tr>
        <tr class="missing-role-row"><th class="sticky-col staff-col missing-role-head">ยังขาด</th><th class="sticky-col summary-col missing-role-head">-</th>${missingCells}</tr>
      </thead><tbody>
        ${displayStaff.map(st => {
          const bg = staffColor(st);
          const fg = textColorFor(bg);
          return `<tr>
            <td class="sticky-col staff-col staff-color-cell" style="background:${bg};color:${fg}"><div class="matrix-staff-name"><b>${escapeHtml(st.nickname || st.full_name || '-')}</b><small>${escapeHtml(st.staff_type || '')}</small></div></td>
            <td class="sticky-col summary-col summary-action-cell"><button class="tiny-btn staff-summary-trigger compact-staff-summary" data-month-position-stat="${st.id}" type="button" title="ดูสรุปตำแหน่งรายเดือนของ ${escapeHtml(st.nickname || st.full_name || '')}">ดูสรุป</button></td>
            ${(dates || []).map(date => renderMonthPositionCell(st, date, byCell[`${st.id}|${date}`] || [], canEdit)).join('')}
          </tr>`;
        }).join('')}
      </tbody></table></div>
    </div>`;
  };

  renderMonthPositionCell = window.renderMonthPositionCell = function renderMonthPositionCellV159(staff, date, cellRows, canEdit = false) {
    const key = safeDateKey(date);
    const isWeekendDay = isWeekend(key);
    const isHolidayDay = isHolidayDate(key);
    if (isWeekendDay || isHolidayDay) {
      return `<td class="matrix-cell no-position-day ${isHolidayDay ? 'holiday-cell' : 'weekend-cell'}"><span>${isHolidayDay ? 'HOLIDAY' : 'WEEKEND'}</span></td>`;
    }
    const leaveRow = activeLeaveRecordOn(staff?.id, key);
    const leaveType = leaveDisplayType(leaveRow);
    const isRealLeave = !!leaveRow && !isNoDutyLeaveType(leaveRow);
    const outing = hasOuting(key);
    const row = (cellRows || [])[0] || null;
    const cleanCodes = (cellRows || []).map(r => positionLabelForCell(r?.position_code || r?.code)).filter(Boolean);
    const cls = `${outing ? 'outing-cell' : ''} ${isRealLeave ? 'leave-cell ' + leaveCellClass(leaveRow) : ''} ${!cleanCodes.length && !isRealLeave ? 'needs-review-cell' : ''}`.trim();
    if (canEdit && !isRealLeave) {
      const current = row?.position_code || '';
      const options = monthPositionRoleOptionsForDate(key, current);
      return `<td class="matrix-cell ${cls}"><select class="month-position-select" data-month-position-edit="${key}|${staff?.id}"><option value="">รอตรวจสอบ</option>${options.map(t => `<option value="${escapeHtml(t.code)}" ${current === t.code ? 'selected' : ''}>${escapeHtml(positionLabelForCell(t.code))}</option>`).join('')}</select></td>`;
    }
    const text = cleanCodes.length ? cleanCodes.join('<br>') : (isRealLeave ? escapeHtml(leaveType) : '');
    return `<td class="matrix-cell ${cls}">${text ? `<span>${text}</span>` : ''}</td>`;
  };

  showMonthPositionStaffSummary = window.showMonthPositionStaffSummary = function showMonthPositionStaffSummaryV159(staffId) {
    const { key, rows, dates } = currentMonthPositionContext();
    const st = state.staff.find(s => String(s.id) === String(staffId));
    if (!st) return;
    const stats = buildMonthPositionSummary(rows, dates)[staffId] || { zones: {}, positions: {}, dates: new Set(), rows: [] };
    const line = obj => Object.entries(obj).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'th'));
    const zoneRows = line(stats.zones);
    const positionRows = line(stats.positions);
    const leaveDays = (dates || []).filter(d => (typeof isRealMonthlyPositionLeave === 'function') ? isRealMonthlyPositionLeave(staffId, d) : !!activeLeaveRecordOn(staffId, d)).length;
    const noPositionDays = (dates || []).filter(d => isNoPositionDay(d)).length;
    const detailRows = stats.rows.slice().sort((a, b) => a.work_date.localeCompare(b.work_date)).map(r => `<tr><td>${formatThaiDate(r.work_date)}</td><td>${escapeHtml(r.zone || '-')}</td><td>${escapeHtml(positionLabelForCell(r.position_code || '-'))}</td></tr>`).join('');
    showModal(`<h2>สรุปตำแหน่งรายเดือน ${key}</h2>
      <div class="staff-summary-head">${staffPill(st)}<span class="muted">คำนวณจากตารางล่าสุด และหักเฉพาะวันที่ลางานจริงแล้ว</span></div>
      <div class="grid grid-3 modal-stat-grid">
        ${statCard('วันที่มีตำแหน่ง', stats.dates.size || 0)}
        ${statCard('จำนวนครั้งรวม', stats.rows.length || 0)}
        ${statCard('วันที่ลางานจริง', leaveDays || 0)}
      </div>
      <div class="grid grid-2 modal-summary-grid">
        <div class="card-lite"><h4>แยกตามห้อง/โซน</h4>${zoneRows.length ? `<table><tbody>${zoneRows.map(([k, v]) => `<tr><td>${escapeHtml(k)}</td><td>${v} ครั้ง</td></tr>`).join('')}</tbody></table>` : empty('ยังไม่มีตำแหน่งในเดือนนี้')}</div>
        <div class="card-lite"><h4>แยกตามตำแหน่ง</h4>${positionRows.length ? `<table><tbody>${positionRows.map(([k, v]) => `<tr><td>${escapeHtml(positionLabelForCell(k))}</td><td>${v} ครั้ง</td></tr>`).join('')}</tbody></table>` : empty('ยังไม่มีตำแหน่งในเดือนนี้')}</div>
      </div>
      <div class="card-lite"><h4>รายละเอียดรายวัน</h4>${detailRows ? `<div class="table-wrap compact-detail-table"><table><thead><tr><th>วันที่</th><th>โซน</th><th>ตำแหน่ง</th></tr></thead><tbody>${detailRows}</tbody></table></div>` : empty('ไม่มีรายการตำแหน่งหลังหักวันลา/วันหยุด')}</div>
      <p class="hint">หมายเหตุ: เดือนนี้มีวัน WEEKEND/HOLIDAY ${noPositionDays} วัน ไม่นับในจำนวนตำแหน่งรายเดือน</p>`);
  };

  const oldHandleChange = window.handleChange || handleChange;
  handleChange = window.handleChange = function handleChangeV159(e) {
    const t = e.target;
    if (t.id === 'leaveFilterType') { state.leaveFilterType = t.value || ''; renderPage(); return; }
    if (t.id === 'leaveFilterFiscalYear') { state.leaveFilterFiscalYear = t.value || ''; renderPage(); return; }
    if (t.id === 'leaveFilterStaff') { state.leaveFilterStaff = t.value || ''; renderPage(); return; }
    if (t?.dataset?.rosterSlotSelect !== undefined) {
      const snap = captureScrollState();
      const out = oldHandleChange(e);
      restoreScrollState(snap);
      return out;
    }
    return oldHandleChange(e);
  };

  const oldHandleClick = window.handleClick || handleClick;
  handleClick = window.handleClick = async function handleClickV159(e) {
    const t = e.target.closest('button, [data-page], [data-day-detail], [data-staff-stat], [data-revert-profile-request]');
    if (keepScrollAction(t)) {
      e.preventDefault();
      const snap = captureScrollState();
      const out = await oldHandleClick(e);
      restoreScrollState(snap);
      return out;
    }
    return oldHandleClick(e);
  };

  console.info(`[${VERSION}] monthly position compact UI, roster swap DnD, scroll keep, leave filters loaded`);
})();

/* V160 targeted UI + newcomer account settings patch */
(function(){
  const DUTY_MODAL_ORDER_V160 = ['ชบด1','ชบด2','ชบด3','ช4','ช3A','ช3B','ช9-เคิก','ช9-MT','ช9'];
  function dutySortV160(e){
    if (!e || e.type !== 'duty') return 999;
    const code = String(e.raw?.duty_code || '').trim();
    const idx = DUTY_MODAL_ORDER_V160.findIndex(x => code === x || code.startsWith(x));
    return idx < 0 ? 998 : idx;
  }
  const oldShowDayDetail = window.showDayDetail || showDayDetail;
  window.showDayDetail = showDayDetail = function showDayDetailV160(date) {
    const evs = collectCalendarEvents().filter(e => e.date === date).sort((a,b) => dutySortV160(a) - dutySortV160(b));
    showModal(`<h2>${formatThaiDate(date)}</h2><div class="calendar-modal-list">${evs.length ? evs.map(renderCalendarModalRow).join('') : empty('ไม่มีรายการในวันนี้')}</div>`);
  };
  window.renderCalendarMonth = renderCalendarMonth = function renderCalendarMonthV160() {
    const events = collectCalendarEvents();
    const d = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth(), 1);
    const first = new Date(d); first.setDate(1 - first.getDay());
    const cells = [];
    for (let i=0;i<42;i++) {
      const cur = new Date(first); cur.setDate(first.getDate()+i);
      const ds = toDateInput(cur);
      const dayEvents = events.filter(e => e.date === ds);
      const evs = dayEvents.slice().sort((a,b) => dutySortV160(a) - dutySortV160(b)).slice(0,5);
      cells.push(`<button type="button" class="calendar-cell calendar-card-cell ${cur.getMonth()!==state.calendarDate.getMonth()?'other-month':''} ${ds===todayStr()?'today':''}" data-day-detail="${ds}">
        <div class="day-num"><span>${cur.getDate()}</span><span class="tiny-btn fake-btn">ดู</span></div>
        ${evs.map(e => `<span class="event-pill event-${e.type}" style="background:${calendarEventColor(e)};color:${textColorFor(calendarEventColor(e))}">${escapeHtml(e.title)}</span>`).join('')}
        ${dayEvents.length > 5 ? `<span class="hint">+${dayEvents.length - 5} รายการ</span>` : ''}
      </button>`);
    }
    return `<div class="calendar-grid calendar-card-grid">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(x => `<div class="calendar-dayname">${x}</div>`).join('')}${cells.join('')}</div>`;
  };

  window.renderOtPage = renderOtPage = function renderOtPageV160() {
    const proxyOptions = selfPaidDutyProxyOptions(todayStr());
    const myDuty = state.rosterAssignments.some(x => x.duty_date === todayStr() && x.staff_id === currentStaffId());
    const canCheckIn = myDuty || isAdmin() || proxyOptions.length > 0;
    const mine = state.otRequests.filter(x => x.staff_id === currentStaffId());
    const rows = isAdmin() ? state.otRequests : mine;
    const proxyBox = proxyOptions.length ? `<div class="notice soft-notice compact"><b>วันนี้มีข้อตกลงจ่ายกันเองที่คุณเป็นคนมาทำแทน</b><br>${proxyOptions.map(x => `ลงชื่อแทนเวรของ ${staffPill(x.assignment.staff_id)} • ${DUTY_LABEL[x.assignment.duty_code] || x.assignment.duty_code}`).join('<br>')}</div>` : '';
    return `<div class="grid grid-2 ot-page">
      <div class="card ot-card">
        <h3>ส่วนที่ 1 ยืนยันวันอยู่เวร</h3>
        <p class="muted">${myDuty ? 'วันนี้มีชื่อคุณในตารางเวร' : proxyOptions.length ? 'วันนี้คุณเป็นผู้มาทำเวรแทนตามข้อตกลงกันเอง / จ่ายกันเอง' : 'วันนี้ยังไม่พบชื่อคุณในตารางเวร ถ้าลงจริงให้ Admin ตรวจตารางก่อน'}</p>
        ${proxyBox}
        <button class="primary-btn" data-check-in ${(!canCheckIn) ? 'disabled' : ''}>ยืนยันรับ OT / อยู่เวร</button>
      </div>
      <div class="card ot-card">
        <h3>ส่วนที่ 2 ขอ OT เพิ่ม / เวรปั่นเลือด</h3>
        <p class="hint compact">ช4 และชั่วโมงเพิ่มของ ช3A/ช3B จะยังไม่คิดอัตโนมัติ ให้บันทึกเวลาจริง แล้ว Admin เทียบ LIS ก่อนอนุมัติ</p>
        <form id="otForm" class="form-grid">
          <label>วันที่ <input name="work_date" type="date" value="${todayStr()}" required></label>
          <label>ตั้งแต่เวลา (Start time) <input name="start_time" type="time" value="${pad(otStartHourForDate(todayStr()))}:00" required></label>
          <label>ถึงเวลา (End time) <input name="end_time" type="time" required></label>
          <label>เหตุผล <select name="reason">${OT_REASONS.map(r => `<option>${r}</option>`).join('')}</select></label>
          <label class="wide">รายละเอียด <input name="note" placeholder="เช่น ปั่นเลือดถึง 18:20 / รอเทียบ LIS"></label>
          <button class="primary-btn wide" type="submit">ยืนยันขอ OT เพิ่ม</button>
        </form>
      </div>
      <div class="card wide-card" style="grid-column:1/-1;">
        <div class="section-title"><h3>${isAdmin() ? 'ส่วนที่ 3 อนุมัติ OT' : 'รายการ OT ของฉัน'}</h3>${isAdmin() ? '<button class="ghost-btn" data-export-ot-excel>Export Excel สรุปเดือนนี้</button>' : ''}</div>
        ${renderOtTable(rows)}
      </div>
      <div class="card" style="grid-column:1/-1;">
        <h3>ส่วนที่ 4 สรุป OT รายเดือน</h3><p class="hint">สรุปเฉพาะรายการที่อนุมัติแล้ว</p>${renderOtSummary()}
      </div>
    </div>`;
  };
  function noteStartTimeV160(note){ const m = String(note || '').match(/เวลาเริ่ม\s*([0-2]?\d:[0-5]\d)/); return m ? m[1] : ''; }
  window.calcOtHours = calcOtHours = function calcOtHoursV160(r) {
    const workDate = normalizeDateKey(r?.work_date); if (!workDate) return 0;
    if (String(r?.reason || '').includes('ยืนยันอยู่เวร')) {
      if (String(currentInchargeForMonth(workDate.slice(0,7))) === String(r?.staff_id)) return 8;
      const duties = (state.rosterAssignments || []).filter(a => String(a.staff_id) === String(r?.staff_id) && normalizeDateKey(a.duty_date) === workDate);
      if (duties.length) return duties.reduce((sum, a) => sum + Number(dutyMetrics(a)?.hours || 0), 0);
    }
    const endTime = String(r?.end_time || '').trim(); if (!endTime) return 0;
    const startTime = String(r?.start_time || noteStartTimeV160(r?.note) || `${pad(otStartHourForDate(workDate))}:00`).trim();
    const end = new Date(`${workDate}T${endTime.length === 5 ? `${endTime}:00` : endTime}`);
    const start = new Date(`${workDate}T${startTime.length === 5 ? `${startTime}:00` : startTime}`);
    const hours = (end - start) / 36e5;
    if (!Number.isFinite(hours) || hours < 0) return 0;
    return Math.round(hours * 10) / 10;
  };
  window.saveOtRequest = saveOtRequest = async function saveOtRequestV160(form) {
    const pos = await getGps();
    if (!pos.ok) return showGpsHelp(pos.message);
    if (!isInsideGeofence(pos) && CFG.GEOFENCE?.enabled) return showGpsHelp('ไม่ได้อยู่ในพื้นที่โรงพยาบาล');
    const fd = new FormData(form);
    const noteRaw = String(fd.get('note') || '').trim();
    const startTime = String(fd.get('start_time') || '').trim();
    const base = { staff_id: currentStaffId(), work_date: fd.get('work_date'), start_time: startTime, end_time: fd.get('end_time'), reason: fd.get('reason'), note: noteRaw, status: 'รออนุมัติ', lat: pos.lat, lng: pos.lng, accuracy: pos.accuracy, device: navigator.userAgent.slice(0, 250) };
    let res = await sb.from('ot_requests').insert(base);
    if (res.error && /start_time|column|schema/i.test(res.error.message || '')) {
      const fallback = { ...base, note: `เวลาเริ่ม ${startTime}${noteRaw ? ' | ' + noteRaw : ''}` };
      delete fallback.start_time;
      res = await sb.from('ot_requests').insert(fallback);
    }
    if (res.error) return showToast(res.error.message, { tone:'error' });
    await loadAllData(); renderPage(); showToast('ส่งคำขอ OT เพิ่มแล้ว');
  };

  window.renderMonthPositionMatrix = renderMonthPositionMatrix = function renderMonthPositionMatrixV160(rows, dates) {
    if (!(rows || []).length) return empty('ยังไม่มีแผนรายเดือน กด “สร้างแผนทั้งเดือน” ก่อน');
    const byCell = {}; (rows || []).forEach((r, idx) => { if (!r?.staff_id || !r?.work_date) return; const key = `${r.staff_id}|${r.work_date}`; (byCell[key] ||= []).push({ ...r, _idx: idx }); });
    const canEdit = isAdmin() && state.page === 'positionMonth';
    const displayStaff = orderedStaff(state.staff.filter(s => isDailyPositionEnabled(s) || (rows || []).some(r => String(r?.staff_id) === String(s.id))));
    const dateHeads = (dates || []).map(date => { const d = parseDate(date); const cls = isHolidayDate(date) ? 'holiday-head' : isWeekend(date) ? 'weekend-head' : hasOuting(date) ? 'outing-head' : ''; return `<th class="date-head ${cls}"><b>${d.getDate()}</b><br><span>${d.toLocaleDateString('th-TH', { weekday: 'short' })}</span></th>`; }).join('');
    const missingCells = (dates || []).map(date => renderMonthPositionMissingCellV159(date, rows || [])).join('');
    return `<div class="monthly-matrix-wrap v153-position-matrix v158-position-matrix v159-position-matrix v160-position-matrix">
      <div class="matrix-legend"><span class="legend-box weekend"></span> WEEKEND/HOLIDAY = ไม่จัดตำแหน่ง <span class="legend-box outing"></span> ออกหน่วย <span class="legend-box leave"></span> แสดงเฉพาะประเภทลา / ไม่รับเวรยังจัดตำแหน่งได้ ${canEdit ? '<span class="hint">Admin เลือกตำแหน่งในช่องได้ แล้วกดบันทึกแผนทั้งเดือน</span>' : ''}</div>
      <div class="table-wrap month-position-matrix"><table><thead>
        <tr><th class="sticky-col staff-col">เจ้าหน้าที่</th><th class="sticky-col summary-col">สรุป</th>${dateHeads}</tr>
        <tr class="missing-role-row"><th class="sticky-col staff-col missing-role-head">ยังขาด</th><th class="sticky-col summary-col missing-role-head">-</th>${missingCells}</tr>
      </thead><tbody>${displayStaff.map(st => { const bg = staffColor(st); const fg = textColorFor(bg); return `<tr><td class="sticky-col staff-col staff-color-cell" style="background:${bg};color:${fg}"><div class="matrix-staff-name"><b>${escapeHtml(st.nickname || st.full_name || '-')}</b><small>${escapeHtml(st.staff_type || '')}</small></div></td><td class="sticky-col summary-col summary-action-cell"><button class="tiny-btn staff-summary-trigger compact-staff-summary" data-month-position-stat="${st.id}" type="button">ดูสรุป</button></td>${(dates || []).map(date => renderMonthPositionCell(st, date, byCell[`${st.id}|${date}`] || [], canEdit)).join('')}</tr>`; }).join('')}</tbody></table></div></div>`;
  };

  const oldGrid = window.renderGridView || renderGridView;
  window.renderGridView = renderGridView = function renderGridViewV160(staffList, assignments, key=state.monthKey) {
    const dates = scheduleMonthDates(key);
    return `<div class="table-wrap clean-grid-wrap"><table id="scheduleTable" class="clean-schedule-grid v160-schedule-grid"><thead><tr><th class="clean-sticky-col clean-staff-head">เจ้าหน้าที่</th><th class="clean-sticky-col clean-summary-head">สรุป</th>${dates.map(date => { const d = parseDate(date); const off = isWeekend(date) || isHolidayDate(date); const hname = isHolidayDate(date) ? `<br><small>${escapeHtml(holidayName(date))}</small>` : ''; return `<th class="${off ? 'offday-col' : ''}">${d.getDate()}<br><span>${d.toLocaleDateString('th-TH', { weekday:'short' })}</span>${hname}</th>`; }).join('')}</tr></thead><tbody>${(staffList || []).filter(isRosterEnabled).map(st => { const bg = staffColor(st); const fg = textColorFor(bg); return `<tr><th class="clean-sticky-col clean-staff-cell" style="--staff-bg:${bg};--staff-fg:${fg};background:${bg};color:${fg}"><b>${escapeHtml(st.nickname || st.full_name || '-')}</b></th><td class="clean-sticky-col clean-summary-cell"><button class="tiny-btn" type="button" data-staff-stat="${st.id}">ดูสรุป</button></td>${dates.map(date => { const shifts = (assignments || []).filter(a => String(a?.staff_id) === String(st.id) && normalizeDateKey(a?.duty_date) === date).sort((a,b) => dutySortIndex(a?.duty_code) - dutySortIndex(b?.duty_code)); const off = isWeekend(date) || isHolidayDate(date); const leave = activeLeaveRecordOn(st.id, date); const leaveCls = leave ? leaveCellClass(leave) : ''; const leaveHtml = leave ? leaveCellBadge(leave) : ''; const shiftHtml = shifts.length ? shifts.map(a => { const attrs = canRequestTrade(a) ? `data-trade-duty="${a.id}"` : `data-staff-stat="${st.id}"`; return `<button type="button" class="clean-shift-pill" style="--staff-bg:${bg};--staff-fg:${fg};background:${bg};color:${fg}" ${attrs}>${escapeHtml(dutyDisplayLabel(a?.duty_code))}</button>`; }).join('') : ''; return `<td class="${off ? 'offday-col' : ''} ${leaveCls}"><div class="clean-cell-stack">${leaveHtml}${shiftHtml}${(!shiftHtml && off && !leave) ? '<span class="muted">หยุด</span>' : ''}</div></td>`; }).join('')}</tr>`; }).join('')}</tbody></table></div>`;
  };

  window.renderMyProfilePage = renderMyProfilePage = function renderMyProfilePageV160() {
    const p = state.profile || {};
    const myReqs = (state.profileChangeRequests || []).map(typeof normalizeRequest === 'function' ? normalizeRequest : x => x).filter(typeof requestIsMine === 'function' ? requestIsMine : profileRequestBelongsToMe).slice(0, 20);
    return `<div class="grid grid-2 profile-page-grid v57-profile-page v160-profile-page" id="myProfilePage">
      <div class="card profile-card-readable"><div class="section-title"><h3>ข้อมูลส่วนตัว</h3></div><div class="profile-info-list"><div><span>ชื่อเล่น</span><b>${escapeHtml(p.nickname || '-')}</b></div><div><span>ชื่อ-สกุล</span><b>${escapeHtml(p.full_name || '-')}</b></div><div><span>เบอร์โทร</span><b>${escapeHtml(p.phone || '-')}</b></div><div><span>Email</span><b>${escapeHtml(p.email || '-')}</b></div><div><span>ชื่อผู้ใช้</span><b>${escapeHtml(p.login_name || '-')}</b></div></div></div>
      <div class="card"><div class="section-title"><h3>ตั้งค่าบัญชี</h3></div><p class="hint">ใช้สำหรับพนักงานใหม่หรือผู้ที่ต้องการเปลี่ยนชื่อผู้ใช้/รหัสผ่านด้วยตัวเองหลัง Login</p><form id="directAccountForm" class="form-grid compact-form"><label>Username ใหม่ <input name="login_name" value="${escapeHtml(p.login_name || '')}" placeholder="เช่น gift123"></label><label>Password ใหม่ <input name="password" type="password" placeholder="เว้นว่างถ้าไม่เปลี่ยน"></label><label>ยืนยัน Password ใหม่ <input name="password2" type="password" placeholder="กรอกซ้ำ"></label><button class="primary-btn wide" type="submit">บันทึก Username / Password</button></form></div>
      <div class="card"><div class="section-title"><h3>ขอแก้ไขข้อมูลอื่น</h3></div><form id="profileChangeForm" class="form-grid compact-form"><div class="form-grid two-cols"><label>ต้องการแก้ไข <select name="field_name" required><option value="phone">เบอร์โทร</option><option value="nickname">ชื่อเล่น</option><option value="full_name">ชื่อ-สกุล</option></select></label><label>ข้อมูลใหม่ <input name="new_value" required placeholder="กรอกข้อมูลใหม่"></label></div><label>เหตุผล/หมายเหตุ <textarea name="note" placeholder="เช่น เปลี่ยนเบอร์โทร / สะกดชื่อผิด"></textarea></label><button class="primary-btn full-btn" type="submit">ส่งคำขอให้ Admin อนุมัติ</button></form></div>
      <div class="card"><div class="section-title"><h3>คำขอล่าสุดของฉัน</h3><button class="ghost-btn" type="button" onclick="loadProfileChangeRequests().then(renderPage)">รีเฟรช</button></div>${myReqs.length ? `<div class="mobile-cards always-cards">${myReqs.map(r => (typeof requestCard === 'function' ? requestCard(r, false, false) : `<div class="mobile-card"><b>${escapeHtml(r.field_name || '-')}</b></div>`)).join('')}</div>` : empty('ยังไม่มีคำขอ')}</div>
    </div>`;
  };
  async function saveDirectAccountV160(form){
    const fd = new FormData(form);
    const loginName = String(fd.get('login_name') || '').trim().toLowerCase();
    const password = String(fd.get('password') || '');
    const password2 = String(fd.get('password2') || '');
    if (loginName && !/^[a-zA-Z0-9._-]{1,30}$/.test(loginName)) return showToast('Username ใช้ได้เฉพาะอังกฤษ ตัวเลข จุด ขีดกลาง หรือขีดล่าง', { tone:'error' });
    if (password || password2) { if (password.length < 6) return showToast('Password อย่างน้อย 6 ตัวอักษร', { tone:'error' }); if (password !== password2) return showToast('Password ไม่ตรงกัน', { tone:'error' }); }
    if (loginName && loginName !== String(state.profile?.login_name || '').toLowerCase()) {
      let res = await sb.from('staff_profiles').update({ login_name: loginName }).eq('id', state.profile.id);
      if (res.error) {
        let r = await sb.rpc('set_initial_login_name_v56', { p_email: state.profile.email, p_login_name: loginName });
        if (r.error) r = await sb.rpc('set_initial_login_name_v44', { p_email: state.profile.email, p_login_name: loginName });
        if (r.error) return showToast(r.error.message || res.error.message, { tone:'error' });
      }
    }
    if (password) { const r = await sb.auth.updateUser({ password }); if (r.error) return showToast(r.error.message, { tone:'error' }); }
    await loadAllData(); renderPage(); showToast('บันทึกข้อมูลบัญชีแล้ว');
  }
  document.addEventListener('submit', function(e){ if (e.target && e.target.id === 'directAccountForm') { e.preventDefault(); saveDirectAccountV160(e.target); } }, true);
})();
