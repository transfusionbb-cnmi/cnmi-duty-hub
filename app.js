/* CNMI Duty Hub - Vanilla JS + Supabase */
const CFG = window.CNMI_CONFIG || {};
const NAV_ITEMS = [
  { id: 'dashboard', icon: '📊', title: 'Dashboard', subtitle: 'ภาพรวมทั้งหมดของวันนี้' },
  { id: 'calendar', icon: '📅', title: 'Calendar กลาง', subtitle: 'รวมลา อบรม ประชุม ออกหน่วย วันหยุด และเวร' },
  { id: 'leave', icon: '🌿', title: 'แจ้งลา / ไม่รับเวร', subtitle: 'บันทึก แก้ไข ยกเลิก และแนบไฟล์' },
  { id: 'activities', icon: '🗂️', title: 'กิจกรรมหน่วยงาน', subtitle: 'CQI HA ออกหน่วย ประชุม อบรม และกิจกรรมอื่น' },
  { id: 'hr', icon: '🧾', title: 'ตรวจสอบ HR', subtitle: 'Admin ตรวจว่าแจ้งใน HR แล้วหรือยัง' },
  { id: 'scheduler', icon: '🧩', title: 'จัดตารางเวร', subtitle: 'Auto Assign, Drag & Drop, Lock, Publish' },
  { id: 'schedule', icon: '📋', title: 'ตารางเวรประจำเดือน', subtitle: 'ดูรายเดือน Export Excel / PDF / Print' },
  { id: 'positions', icon: '🧪', title: 'ตารางตำแหน่งรายวัน', subtitle: 'เปิดดูทุกเช้า เปลี่ยนตัวแทนพร้อมเก็บ Log' },
  { id: 'ot', icon: '⏱️', title: 'OT & Attendance', subtitle: 'Check-In, ขอ OT, อนุมัติ, สรุป' },
  { id: 'audit', icon: '🕵️', title: 'Audit Log', subtitle: 'ใครทำอะไร เมื่อไร ค่าเดิม/ค่าใหม่' }
];

const LEAVE_TYPES = ['ลาพักร้อน','ลากิจ','ลาป่วย','ลาคลอด','ไม่รับเวร','อื่นๆ'];
const ACTIVITY_TYPES = ['CQI','HA','ออกหน่วย','ซ้อมอัคคีภัย','ซ้อม CPR','Journal Club','Morning Brief','Internal Audit','External Audit','ประชุม','อบรม','ซ้อมแผน','วันหยุดราชการ','อื่นๆ'];
const OT_REASONS = ['มาช่วยปั่น','มาช่วยจ่ายเลือด','มาช่วยออกหน่วย','อยู่ต่อเคลียร์งาน','มาช่วยงาน CQI','อื่นๆ'];
const HR_STATUSES = ['รอตรวจสอบ','ตรวจสอบแล้ว','รอเอกสาร','ยกเลิก'];
const OT_STATUSES = ['รออนุมัติ','อนุมัติ','ไม่อนุมัติ','ส่งกลับแก้ไข'];
const DUTY_COLUMNS = ['ชบด1','ชบด2','ชบด3','ช3A','ช3B','ช9-เคิก','ช9-MT'];
const DUTY_LABEL = { 'ช9-เคิก': 'ช9', 'ช9-MT': 'ช9' };
const DUTY_SLOT_RULES = {
  weekday: [
    { code: 'ชบด1', role: 'MT' },
    { code: 'ชบด2', role: 'MT' },
    { code: 'ชบด3', role: 'เคิก' }
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
  auditLogs: [],
  calendarDate: new Date(),
  calendarView: 'month',
  monthKey: monthKey(new Date()),
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
function staffType(id) { return state.staff.find(x => x.id === id)?.staff_type || ''; }
function getMonthRange(key) { const [y,m] = key.split('-').map(Number); return { start: `${y}-${pad(m)}-01`, end: toDateInput(new Date(y, m, 0)), y, m }; }
function dateInRange(date, start, end) { return date >= start && date <= end; }
function overlapsDate(row, date) { return row.start_date <= date && row.end_date >= date && row.status !== 'cancelled'; }
function uid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function debounce(fn, wait=250) { let t; return (...args) => { clearTimeout(t); t=setTimeout(()=>fn(...args), wait); }; }

function showToast(msg) {
  const toast = $('toast');
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), 2600);
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
function isPasswordRecoveryUrl() {
  const raw = `${window.location.hash || ''}&${window.location.search || ''}`;
  return raw.includes('type=recovery') || raw.includes('type=password_recovery');
}

async function init() {
  bindGlobalEvents();
  renderAuthTabs();
  if (!configReady()) {
    $('setupWarning').classList.remove('hidden');
    return;
  }
  sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });
  sb.auth.onAuthStateChange(async (event, session) => {
    state.session = session;
    if (event === 'PASSWORD_RECOVERY') {
      showResetPasswordPanel();
      setBusy(false);
      return;
    }
    if (session?.user) await enterApp();
    if (event === 'SIGNED_OUT') exitApp();
  });
  const { data } = await sb.auth.getSession();
  state.session = data.session;
  if (state.session?.user && !isPasswordRecoveryUrl()) await enterApp();
  if (isPasswordRecoveryUrl()) showResetPasswordPanel();
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
    const email = $('loginEmail').value.trim();
    const password = $('loginPassword').value;
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    setBusy(true, 'กำลังเข้าสู่ระบบ');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return showToast(error.message);
  });

  $('googleLoginBtn').addEventListener('click', async () => {
    const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } });
    if (error) showToast(error.message);
  });

  $('signupForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('signupEmail').value.trim();
    const password = $('signupPassword').value;
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    setBusy(true, 'กำลังสร้างบัญชี');
    const { error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + window.location.pathname } });
    setBusy(false);
    if (error) return showToast(error.message);
    showToast('ส่งคำขอยืนยันอีเมลแล้ว ถ้า Supabase เปิดยืนยันอีเมลไว้ กรุณากดยืนยันก่อนเข้าใช้');
  });

  $('forgotForm').addEventListener('submit', async e => {
    e.preventDefault();
    const email = $('forgotEmail').value.trim();
    if (!requireMahidolEmail(email)) return showToast('ใช้ได้เฉพาะอีเมล @mahidol.ac.th');
    setBusy(true, 'กำลังส่งลิงก์');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
    setBusy(false);
    if (error) return showToast(error.message);
    showToast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว');
  });

  $('resetPasswordForm').addEventListener('submit', async e => {
    e.preventDefault();
    const password = $('newPassword').value;
    if (password.length < 8) return showToast('รหัสผ่านต้องอย่างน้อย 8 ตัวอักษร');
    const { error } = await sb.auth.updateUser({ password });
    if (error) return showToast(error.message);
    $('resetPasswordForm').classList.add('hidden');
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
    showToast('บัญชีนี้ยังไม่ได้เปิดใช้งาน กรุณาให้ Admin เปิดสิทธิ์ก่อน');
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
  $('authView').classList.remove('hidden');
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
  const [staff, leaves, activities, rosterMonths, rosterAssignments, positions, attendance, otRequests, hrChecks] = await Promise.all([
    sb.from('staff_profiles').select('*').order('staff_type').order('nickname'),
    sb.from('leave_requests').select('*').gte('end_date', yearStart).lte('start_date', end).order('start_date', { ascending: false }),
    sb.from('activity_events').select('*').gte('end_date', start).lte('start_date', end).order('start_date'),
    sb.from('roster_months').select('*').order('year', { ascending: false }).order('month', { ascending: false }),
    sb.from('roster_assignments').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date'),
    sb.from('daily_positions').select('*').gte('work_date', start).lte('work_date', end).order('work_date'),
    sb.from('attendance_logs').select('*').gte('duty_date', start).lte('duty_date', end).order('duty_date', { ascending: false }),
    sb.from('ot_requests').select('*').gte('work_date', yearStart).lte('work_date', end).order('work_date', { ascending: false }),
    isAdmin() ? sb.from('hr_checks').select('*').order('updated_at', { ascending: false }) : Promise.resolve({ data: [], error: null })
  ]);
  const packs = { staff, leaves, activities, rosterMonths, rosterAssignments, positions, attendance, otRequests, hrChecks };
  Object.entries(packs).forEach(([k,v]) => { if (v.error) throw new Error(`${k}: ${v.error.message}`); });
  state.staff = staff.data || [];
  state.leaves = leaves.data || [];
  state.activities = activities.data || [];
  state.rosterMonths = rosterMonths.data || [];
  state.rosterAssignments = rosterAssignments.data || [];
  state.positions = positions.data || [];
  state.attendance = attendance.data || [];
  state.otRequests = otRequests.data || [];
  state.hrChecks = hrChecks.data || [];
  if (isAdmin()) {
    const { data } = await sb.from('audit_logs').select('*').order('created_at', { ascending:false }).limit(250);
    state.auditLogs = data || [];
  }
}

function renderNav() {
  $('mainNav').innerHTML = NAV_ITEMS.map(item => `
    <button class="nav-btn ${state.page === item.id ? 'active' : ''}" data-page="${item.id}">
      <span class="nav-emoji">${item.icon}</span><span>${item.title}</span>
    </button>`).join('');
  $('userMini').innerHTML = `<b>${escapeHtml(state.profile.nickname || state.profile.full_name || state.profile.email)}</b><br><span>${escapeHtml(state.profile.position || state.profile.role)} • ${escapeHtml(state.profile.role)}</span>`;
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
    audit: renderAuditPage
  };
  content.innerHTML = (pages[state.page] || renderDashboard)();
}

function badge(text, cls='') { return `<span class="badge ${cls}">${escapeHtml(text)}</span>`; }
function activityClass(type) {
  if (type === 'อบรม') return 'blue';
  if (type === 'ประชุม') return 'orange';
  if (type === 'ออกหน่วย') return 'red';
  if (type === 'วันหยุดราชการ') return 'yellow';
  return 'black';
}
function leaveBadgeClass(type) {
  if (type === 'ไม่รับเวร') return 'purple';
  if (type === 'ลาป่วย') return 'red';
  return 'green';
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
          ${todayDuties.map(r => `<tr><td>${escapeHtml(DUTY_LABEL[r.duty_code] || r.duty_code)}</td><td><b>${escapeHtml(staffNick(r.staff_id))}</b></td><td>${badge(r.required_role || '-', 'black')}</td></tr>`).join('')}
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
        ${badge('ลาพักร้อน/ลาอื่น', 'green')} ${badge('อบรม', 'blue')} ${badge('ประชุม', 'orange')} ${badge('ไม่รับเวร', 'purple')} ${badge('ออกหน่วย', 'red')} ${badge('วันหยุดราชการ', 'yellow')} ${badge('เวร', 'black')}
      </div>
    </div>`;
}
function collectCalendarEvents() {
  const events = [];
  state.leaves.filter(x => x.status !== 'cancelled').forEach(l => {
    const days = daysBetween(l.start_date, l.end_date);
    days.forEach(date => events.push({ date, type: l.type === 'ไม่รับเวร' ? 'noduty' : 'leave', title: `${l.type}: ${staffNick(l.staff_id)}`, raw: l }));
  });
  state.activities.forEach(a => {
    daysBetween(a.start_date, a.end_date).forEach(date => {
      let type = 'duty';
      if (a.event_type === 'อบรม') type = 'training';
      else if (a.event_type === 'ประชุม') type = 'meeting';
      else if (a.event_type === 'ออกหน่วย') type = 'outing';
      else if (a.event_type === 'วันหยุดราชการ') type = 'holiday';
      events.push({ date, type, title: `${a.event_type}: ${a.title}`, raw: a });
    });
  });
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
function eventText(type) { return ({leave:'ลา', noduty:'ไม่รับเวร', training:'อบรม', meeting:'ประชุม', outing:'ออกหน่วย', holiday:'วันหยุด', duty:'เวร'}[type] || type); }
function eventBadge(type) { return ({leave:'green', noduty:'purple', training:'blue', meeting:'orange', outing:'red', holiday:'yellow', duty:'black'}[type] || 'black'); }
function showDayDetail(date) {
  const evs = collectCalendarEvents().filter(e => e.date === date);
  showModal(`<h2>${formatThaiDate(date)}</h2>${evs.length ? evs.map(e => `<div class="timeline-item"><div><b>${escapeHtml(e.title)}</b><br><span class="muted">${eventText(e.type)}</span></div></div>`).join('') : empty('ไม่มีรายการในวันนี้')}`);
}

function renderLeavePage() {
  const rows = state.leaves.filter(x => isAdmin() || x.staff_id === currentStaffId());
  const editing = state.editingLeaveId ? state.leaves.find(x => x.id === state.editingLeaveId) : null;
  return `
    <div class="grid grid-2">
      <div class="card">
        <div class="section-title"><h3>${editing ? 'แก้ไขรายการ' : 'แจ้งลา / ไม่รับเวร'}</h3>${editing ? '<button class="ghost-btn" data-cancel-edit-leave>ยกเลิกแก้ไข</button>' : ''}</div>
        <form id="leaveForm" class="form-grid">
          <label>ประเภท
            <select name="type" required>${LEAVE_TYPES.map(t => `<option ${editing?.type===t?'selected':''}>${t}</option>`).join('')}</select>
          </label>
          <label>ต้องการสลับเวรกับใคร (ถ้ามี)
            <select name="swap_with_staff_id"><option value="">ไม่ระบุ</option>${staffOptions(editing?.swap_with_staff_id)}</select>
          </label>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เบอร์ติดต่อระหว่างลา <input name="contact_phone" value="${escapeHtml(editing?.contact_phone || '')}" placeholder="เบอร์ติดต่อ"></label>
          <label>แนบไฟล์ <input name="file" type="file"></label>
          <label class="wide">หมายเหตุ <textarea name="note" placeholder="ระบุรายละเอียดเพิ่มเติม">${escapeHtml(editing?.note || '')}</textarea></label>
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
    ${rows.map(r => `<tr><td>${escapeHtml(staffNick(r.staff_id))}</td><td>${badge(r.type, leaveBadgeClass(r.type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="muted">${escapeHtml(r.note || '')}</span></td><td>${badge(r.status || 'active', r.status==='cancelled'?'red':'green')}</td><td><div class="actions">
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
          <label class="wide">ชื่อกิจกรรม <input name="title" value="${escapeHtml(editing?.title || '')}" required></label>
          <label>ประเภท <select name="event_type" required>${ACTIVITY_TYPES.map(t => `<option ${editing?.event_type===t?'selected':''}>${t}</option>`).join('')}</select></label>
          <label>สถานที่ <input name="location" value="${escapeHtml(editing?.location || '')}"></label>
          <label>วันที่เริ่ม <input name="start_date" type="date" value="${editing?.start_date || todayStr()}" required></label>
          <label>วันที่สิ้นสุด <input name="end_date" type="date" value="${editing?.end_date || todayStr()}" required></label>
          <label>เวลาเริ่ม <input name="start_time" type="time" value="${editing?.start_time || ''}"></label>
          <label>เวลาสิ้นสุด <input name="end_time" type="time" value="${editing?.end_time || ''}"></label>
          <label>ผู้รับผิดชอบ <select name="owner_id"><option value="">ไม่ระบุ</option>${staffOptions(editing?.owner_id || currentStaffId())}</select></label>
          <label>เอกสารแนบ <input name="file" type="file"></label>
          <label class="wide">ผู้เข้าร่วม <select name="participant_ids" multiple size="6">${state.staff.map(s => `<option value="${s.id}" ${asArray(editing?.participant_ids).includes(s.id)?'selected':''}>${escapeHtml(s.nickname || s.full_name)}</option>`).join('')}</select></label>
          <label class="wide">รายละเอียด <textarea name="note">${escapeHtml(editing?.note || '')}</textarea></label>
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
  return `<div class="table-wrap"><table><thead><tr><th>กิจกรรม</th><th>วันเวลา</th><th>สถานที่</th><th>ผู้รับผิดชอบ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td><b>${escapeHtml(r.title)}</b><br>${badge(r.event_type, activityClass(r.event_type))}</td><td>${formatThaiDate(r.start_date)} - ${formatThaiDate(r.end_date)}<br><span class="muted">${escapeHtml([r.start_time, r.end_time].filter(Boolean).join(' - '))}</span></td><td>${escapeHtml(r.location || '-')}</td><td>${escapeHtml(staffNick(r.owner_id))}</td><td><div class="actions">
      ${(isAdmin() || r.created_by === currentStaffId() || r.owner_id === currentStaffId()) ? `<button class="tiny-btn" data-edit-activity="${r.id}">แก้ไข</button><button class="tiny-btn danger" data-delete-activity="${r.id}">ลบ</button>` : '<span class="muted">ดูอย่างเดียว</span>'}
    </div></td></tr>`).join('')}
  </tbody></table></div>`;
}

function renderHrPage() {
  if (!isAdmin()) return noPermission();
  const leaveRows = state.leaves.filter(x => x.type !== 'ไม่รับเวร' && x.status !== 'cancelled');
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
    </div>
    <div class="roster-board">
      <div class="card">
        <h3>รายชื่อเจ้าหน้าที่</h3>
        <p class="hint">ลากชื่อไปวางในช่องเวรได้เลย</p>
        <div class="staff-pool">
          ${state.staff.filter(s => s.is_active).map(s => `<div class="staff-chip" draggable="true" data-drag-staff="${s.id}"><span>${escapeHtml(s.nickname || s.full_name)}</span><span>${badge(s.staff_type || '-', s.staff_type==='MT'?'blue':'orange')}</span></div>`).join('')}
        </div>
      </div>
      <div class="card">
        <div class="section-title"><h3>ตารางร่าง ${state.monthKey}</h3><button class="tiny-btn" data-show-fairness>ดูความยุติธรรม</button></div>
        ${renderRosterGrid(assignments)}
      </div>
    </div>
  </div>`;
}
function getAssignmentsForMonth(key) {
  if (state.rosterDraft?.monthKey === key) return state.rosterDraft.assignments;
  const { start, end } = getMonthRange(key);
  return state.rosterAssignments.filter(x => x.duty_date >= start && x.duty_date <= end);
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
  if (dow === 0) return DUTY_SLOT_RULES.sunday;
  if (dow === 6) return DUTY_SLOT_RULES.saturday;
  return DUTY_SLOT_RULES.weekday;
}
function renderRosterGrid(assignments) {
  if (!assignments.length) return empty('กด “สร้างร่าง” เพื่อเริ่มจัดเวร');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  return `<div class="table-wrap"><table class="roster-table"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      const dow = parseDate(date).toLocaleDateString('th-TH', { weekday:'short' });
      return `<tr><td><b>${day}</b><br><span class="muted">${dow}</span></td>${DUTY_COLUMNS.map(code => {
        const slot = assignments.find(a => a.duty_date === date && a.duty_code === code);
        if (!slot) return '<td class="muted">-</td>';
        const id = slot.id || slot._temp_id;
        return `<td><div class="roster-slot ${slot.is_locked?'locked':''}" data-drop-slot="${id}">
          <div class="assigned-name">${slot.staff_id ? escapeHtml(staffNick(slot.staff_id)) : 'ยังไม่จัด'}</div>
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
  showModal(`<h2>ตรวจความยุติธรรม ${state.monthKey}</h2><div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>เวรรวม</th><th>จันทร์</th><th>ศุกร์</th><th>วันหยุด</th><th>วันธรรมดา</th></tr></thead><tbody>
    ${state.staff.filter(s=>s.is_active).map(s => { const r = stats[s.id] || {}; return `<tr><td>${escapeHtml(s.nickname || s.full_name)}</td><td>${r.total||0}</td><td>${r.mon||0}</td><td>${r.fri||0}</td><td>${r.weekend||0}</td><td>${r.weekday||0}</td></tr>`; }).join('')}
  </tbody></table></div>`);
}
function calcFairness(assignments) {
  const stats = {};
  assignments.forEach(a => {
    if (!a.staff_id) return;
    if (!stats[a.staff_id]) stats[a.staff_id] = { total:0, mon:0, fri:0, weekend:0, weekday:0 };
    const dow = parseDate(a.duty_date).getDay();
    stats[a.staff_id].total++;
    if (dow === 1) stats[a.staff_id].mon++;
    if (dow === 5) stats[a.staff_id].fri++;
    if (dow === 0 || dow === 6) stats[a.staff_id].weekend++;
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
      <button class="soft-btn" data-show-fairness>กดชื่อคนเพื่อดูสถิติ หรือกดปุ่มนี้</button>
    </div>
    <h3 class="print-only">ตารางเวรประจำเดือน ${state.monthKey}</h3>
    ${renderReadOnlySchedule(assignments)}
  </div>`;
}
function renderReadOnlySchedule(assignments) {
  if (!assignments.length) return empty('ยังไม่มีตารางเวรของเดือนนี้');
  const { y, m } = getMonthRange(state.monthKey);
  const last = new Date(y, m, 0).getDate();
  return `<div class="table-wrap"><table id="scheduleTable"><thead><tr><th>วันที่</th>${DUTY_COLUMNS.map(c => `<th>${escapeHtml(DUTY_LABEL[c] || c)}</th>`).join('')}</tr></thead><tbody>
    ${Array.from({length:last}, (_,i)=>i+1).map(day => {
      const date = `${y}-${pad(m)}-${pad(day)}`;
      return `<tr><td>${day}<br><span class="muted">${parseDate(date).toLocaleDateString('th-TH', { weekday:'short' })}</span></td>${DUTY_COLUMNS.map(code => {
        const slot = assignments.find(a => a.duty_date === date && a.duty_code === code);
        return `<td>${slot?.staff_id ? `<button class="tiny-btn" data-staff-stat="${slot.staff_id}">${escapeHtml(staffNick(slot.staff_id))}</button>` : '-'}</td>`;
      }).join('')}</tr>`;
    }).join('')}
  </tbody></table></div>`;
}
function showStaffStats(staffId) {
  const assignments = getAssignmentsForMonth(state.monthKey).filter(x => x.staff_id === staffId);
  const s = calcFairness(assignments)[staffId] || {};
  showModal(`<h2>${escapeHtml(staffName(staffId))}</h2><div class="grid grid-2">${statCard('เวรรวม', s.total||0)}${statCard('วันหยุด', s.weekend||0)}${statCard('จันทร์', s.mon||0)}${statCard('ศุกร์', s.fri||0)}</div>`);
}

function renderPositionsPage() {
  const date = state.positionDate || todayStr();
  const rows = DEFAULT_POSITIONS.map(p => {
    const saved = state.positions.find(x => x.work_date === date && x.position_code === p.code);
    return { ...p, ...(saved || {}), position_code: p.code };
  });
  return `<div class="card">
    <div class="toolbar">
      <label>วันที่ <input type="date" id="positionDateInput" value="${date}"></label>
      ${isAdmin() ? '<button class="primary-btn" data-save-positions>บันทึกตำแหน่งวันนี้</button>' : ''}
    </div>
    <div class="table-wrap"><table><thead><tr><th>โซน</th><th>ตำแหน่ง</th><th>เวลาพัก</th><th>ผู้รับผิดชอบ</th><th>ผู้ปฏิบัติหลัก</th><th>หน้าที่โดยย่อ</th></tr></thead><tbody>
      ${rows.map(r => `<tr><td>${escapeHtml(r.zone)}</td><td><b>${escapeHtml(r.position_code)}</b></td><td>${escapeHtml(r.break_time)}</td><td>${isAdmin() ? `<select data-position-staff="${escapeHtml(r.position_code)}"><option value="">-</option>${staffOptions(r.staff_id)}</select>` : `<b>${escapeHtml(staffNick(r.staff_id))}</b>`}</td><td>${escapeHtml(r.main_rule)}</td><td>${escapeHtml(r.job_desc)}</td></tr>`).join('')}
    </tbody></table></div>
  </div>`;
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
      <h3>ส่วนที่ 4 สรุป OT รายเดือน</h3>${renderOtSummary()}
    </div>
  </div>`;
}
function renderOtTable(rows) {
  if (!rows.length) return empty('ยังไม่มีรายการ OT');
  return `<div class="table-wrap"><table><thead><tr><th>ชื่อ</th><th>วันที่</th><th>เหตุผล</th><th>ชั่วโมง</th><th>สถานะ</th><th>จัดการ</th></tr></thead><tbody>
    ${rows.map(r => `<tr><td>${escapeHtml(staffNick(r.staff_id))}</td><td>${formatThaiDate(r.work_date)}<br><span class="muted">${formatThaiDateTime(r.check_out_at)}</span></td><td>${escapeHtml(r.reason)}<br><span class="muted">${escapeHtml(r.note || '')}</span></td><td>${calcOtHours(r).toFixed(1)}</td><td>${badge(r.status, r.status==='อนุมัติ'?'green':r.status==='ไม่อนุมัติ'?'red':r.status==='ส่งกลับแก้ไข'?'orange':'black')}</td><td>${isAdmin() ? `<div class="actions">${OT_STATUSES.map(s => `<button class="tiny-btn" data-ot-status="${r.id}|${s}">${s}</button>`).join('')}</div>` : '-'}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function renderOtSummary() {
  const key = state.monthKey;
  const approved = state.otRequests.filter(x => x.work_date?.startsWith(key) && x.status === 'อนุมัติ');
  const map = {};
  approved.forEach(r => { map[r.staff_id] = map[r.staff_id] || { hours:0, count:0 }; map[r.staff_id].hours += calcOtHours(r); map[r.staff_id].count++; });
  const rows = Object.entries(map);
  if (!rows.length) return empty('ยังไม่มี OT ที่อนุมัติในเดือนนี้');
  return `<div class="table-wrap"><table id="otSummaryTable"><thead><tr><th>ชื่อ</th><th>ชั่วโมง OT</th><th>จำนวนครั้ง</th></tr></thead><tbody>${rows.map(([id,r]) => `<tr><td>${escapeHtml(staffName(id))}</td><td>${r.hours.toFixed(1)}</td><td>${r.count}</td></tr>`).join('')}</tbody></table></div>`;
}
function calcOtHours(r) {
  if (!r.end_time) return 0;
  const start = r.check_in_at ? new Date(r.check_in_at) : new Date(`${r.work_date}T16:30:00`);
  const end = r.check_out_at ? new Date(r.check_out_at) : new Date(`${r.work_date}T${r.end_time}:00`);
  return Math.max(0, (end - start) / 36e5);
}

function renderAuditPage() {
  if (!isAdmin()) return noPermission();
  return `<div class="grid">
    <div class="card">
      <div class="section-title"><h3>ผู้ใช้งานและสิทธิ์</h3><button class="primary-btn" data-save-staff-users>บันทึกข้อมูลผู้ใช้งาน</button></div>
      <div class="table-wrap"><table><thead><tr><th>ชื่อเล่น</th><th>ชื่อ-สกุล</th><th>Email</th><th>รหัสพนักงาน</th><th>ประเภท</th><th>ตำแหน่ง</th><th>Role</th><th>Active</th><th>ลาคลอด</th><th>Reset</th></tr></thead><tbody>
        ${state.staff.map(s => `<tr data-staff-row="${s.id}">
          <td><input data-field="nickname" value="${escapeHtml(s.nickname || '')}"></td>
          <td><input data-field="full_name" value="${escapeHtml(s.full_name || '')}"></td>
          <td><input data-field="email" value="${escapeHtml(s.email || '')}" placeholder="name@mahidol.ac.th"></td>
          <td><input data-field="employee_code" value="${escapeHtml(s.employee_code || '')}"></td>
          <td><select data-field="staff_type"><option value="">-</option><option ${s.staff_type==='MT'?'selected':''}>MT</option><option ${s.staff_type==='เคิก'?'selected':''}>เคิก</option><option ${s.staff_type==='แพทย์'?'selected':''}>แพทย์</option></select></td>
          <td><input data-field="position" value="${escapeHtml(s.position || '')}"></td>
          <td><select data-field="role"><option ${s.role==='staff'?'selected':''}>staff</option><option ${s.role==='admin'?'selected':''}>admin</option></select></td>
          <td><select data-field="is_active"><option value="true" ${s.is_active?'selected':''}>true</option><option value="false" ${!s.is_active?'selected':''}>false</option></select></td>
          <td><select data-field="maternity_status"><option value="false" ${!s.maternity_status?'selected':''}>false</option><option value="true" ${s.maternity_status?'selected':''}>true</option></select></td>
          <td><button class="tiny-btn" data-reset-user-email="${escapeHtml(s.email || '')}">ส่ง reset</button></td>
        </tr>`).join('')}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="section-title"><h3>Audit Log ล่าสุด</h3><button class="ghost-btn" data-export-audit-excel>Export Excel</button></div>
      ${state.auditLogs.length ? `<div class="table-wrap"><table><thead><tr><th>เวลา</th><th>ผู้ทำ</th><th>Action</th><th>Table</th><th>Record</th><th>ค่าเดิม/ค่าใหม่</th></tr></thead><tbody>
        ${state.auditLogs.map(a => `<tr><td>${formatThaiDateTime(a.created_at)}</td><td>${escapeHtml(staffNick(a.actor_id))}</td><td>${escapeHtml(a.action)}</td><td>${escapeHtml(a.table_name)}</td><td>${escapeHtml(a.record_id || '')}</td><td><button class="tiny-btn" data-audit-detail="${a.id}">ดูรายละเอียด</button></td></tr>`).join('')}
      </tbody></table></div>` : empty('ยังไม่มี Audit Log')}
    </div>
  </div>`;
}

async function handleSubmit(e) {
  if (e.target.id === 'leaveForm') { e.preventDefault(); await saveLeave(e.target); }
  if (e.target.id === 'activityForm') { e.preventDefault(); await saveActivity(e.target); }
  if (e.target.classList.contains('hr-form')) { e.preventDefault(); await saveHrCheck(e.target); }
  if (e.target.id === 'otForm') { e.preventDefault(); await saveOtRequest(e.target); }
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
  if (t.hasAttribute('data-export-schedule-excel')) { exportScheduleExcel(); return; }
  if (t.hasAttribute('data-print-page')) { window.print(); return; }
  if (t.hasAttribute('data-save-positions')) { await savePositions(); return; }
  if (t.hasAttribute('data-check-in')) { await checkIn(); return; }
  if (t.dataset.otStatus) { const [id,status] = t.dataset.otStatus.split('|'); await updateOtStatus(id,status); return; }
  if (t.hasAttribute('data-export-ot-excel')) { exportTable('otSummaryTable', `OT_${state.monthKey}.xlsx`); return; }
  if (t.hasAttribute('data-export-audit-excel')) { exportAuditExcel(); return; }
  if (t.hasAttribute('data-save-staff-users')) { await saveStaffUsers(); return; }
  if (t.dataset.resetUserEmail !== undefined) { await resetUserPassword(t.dataset.resetUserEmail); return; }
  if (t.dataset.auditDetail) { showAuditDetail(t.dataset.auditDetail); return; }
}
function handleChange(e) {
  if (e.target.id === 'rosterMonthInput' || e.target.id === 'scheduleMonthInput') { state.monthKey = e.target.value; state.rosterDraft = null; renderPage(); }
  if (e.target.id === 'positionDateInput') { state.positionDate = e.target.value; renderPage(); }
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
    staff_id: currentStaffId(),
    type: fd.get('type'),
    start_date: fd.get('start_date'),
    end_date: fd.get('end_date'),
    note: fd.get('note'),
    contact_phone: fd.get('contact_phone'),
    swap_with_staff_id: fd.get('swap_with_staff_id') || null,
    updated_by: currentStaffId()
  };
  if (row.end_date < row.start_date) return showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
  const file = fd.get('file');
  if (file && file.size) row.attachment_path = await uploadFile(file, 'leave');
  setBusy(true, 'กำลังบันทึก');
  const id = state.editingLeaveId;
  const res = id ? await sb.from('leave_requests').update(row).eq('id', id) : await sb.from('leave_requests').insert({ ...row, created_by: currentStaffId(), status: 'active' });
  setBusy(false);
  if (res.error) return showToast(res.error.message);
  state.editingLeaveId = null;
  await loadAllData(); renderPage(); showToast('บันทึกแล้ว');
}
async function cancelLeave(id) {
  if (!confirm('ยืนยันยกเลิกรายการนี้?')) return;
  const { error } = await sb.from('leave_requests').update({ status:'cancelled', updated_by: currentStaffId() }).eq('id', id);
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('ยกเลิกแล้ว');
}
async function saveActivity(form) {
  const fd = new FormData(form);
  const participants = Array.from(form.elements.participant_ids.selectedOptions).map(o => o.value);
  const row = {
    title: fd.get('title'), event_type: fd.get('event_type'), start_date: fd.get('start_date'), end_date: fd.get('end_date'),
    start_time: fd.get('start_time') || null, end_time: fd.get('end_time') || null, location: fd.get('location'), note: fd.get('note'),
    owner_id: fd.get('owner_id') || currentStaffId(), participant_ids: participants, updated_by: currentStaffId()
  };
  if (row.end_date < row.start_date) return showToast('วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม');
  const file = fd.get('file');
  if (file && file.size) row.attachment_path = await uploadFile(file, 'activities');
  const id = state.editingActivityId;
  const res = id ? await sb.from('activity_events').update(row).eq('id', id) : await sb.from('activity_events').insert({ ...row, created_by: currentStaffId() });
  if (res.error) return showToast(res.error.message);
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
  updateDraftSlot(slot.dataset.dropSlot, { staff_id: staffId });
  renderPage();
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
    const candidates = state.staff.filter(s => s.is_active && canStaffWorkSlot(s.id, slot));
    candidates.sort((a,b) => (counts[a.id]?.total || 0) - (counts[b.id]?.total || 0) || (counts[a.id]?.weekend || 0) - (counts[b.id]?.weekend || 0));
    if (candidates[0]) {
      slot.staff_id = candidates[0].id;
      counts[candidates[0].id] = counts[candidates[0].id] || { total:0, mon:0, fri:0, weekend:0, weekday:0 };
      counts[candidates[0].id].total++;
      if (isWeekend(slot.duty_date)) counts[candidates[0].id].weekend++;
    }
  });
  showToast('Auto Assign แล้ว ตรวจทานก่อนประกาศอีกทีนะ');
}
function canStaffWorkSlot(staffId, slot) {
  const s = state.staff.find(x => x.id === staffId);
  if (!s || !s.is_active || s.maternity_status) return false;
  if (slot.required_role && s.staff_type !== slot.required_role) return false;
  const blocked = state.leaves.some(l => l.staff_id === staffId && overlapsDate(l, slot.duty_date));
  if (blocked) return false;
  const already = getAssignmentsForMonth(state.monthKey).some(a => a.duty_date === slot.duty_date && a.staff_id === staffId && (a.id || a._temp_id) !== (slot.id || slot._temp_id));
  return !already;
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
  const rows = state.rosterDraft.assignments.map(a => ({
    id: a.id || undefined, roster_month_id: month.id, duty_date: a.duty_date, duty_code: a.duty_code, required_role: a.required_role, staff_id: a.staff_id, is_locked: !!a.is_locked, updated_by: currentStaffId()
  }));
  const { error } = await sb.from('roster_assignments').upsert(rows, { onConflict: 'roster_month_id,duty_date,duty_code' });
  if (error) return showToast(error.message);
  state.rosterDraft = null;
  await loadAllData(); renderPage(); showToast(status === 'published' ? 'ประกาศตารางแล้ว' : status === 'locked' ? 'ล็อกตารางแล้ว' : 'บันทึกร่างแล้ว');
}

async function savePositions() {
  const date = $('positionDateInput').value;
  const rows = DEFAULT_POSITIONS.map(p => {
    const sel = Array.from(document.querySelectorAll('[data-position-staff]')).find(el => el.dataset.positionStaff === p.code);
    return { work_date: date, position_code: p.code, zone: p.zone, break_time: p.break_time, main_rule: p.main_rule, job_desc: p.job_desc, staff_id: sel?.value || null, updated_by: currentStaffId() };
  });
  const { error } = await sb.from('daily_positions').upsert(rows, { onConflict: 'work_date,position_code' });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('บันทึกตำแหน่งรายวันแล้ว');
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
      staff_type: get('staff_type') || null,
      position: get('position') || null,
      role: get('role') || 'staff',
      is_active: get('is_active') === 'true',
      maternity_status: get('maternity_status') === 'true'
    };
  });
  const { error } = await sb.from('staff_profiles').upsert(rows, { onConflict: 'id' });
  if (error) return showToast(error.message);
  await loadAllData(); renderPage(); showToast('บันทึกผู้ใช้งานแล้ว');
}
async function resetUserPassword(email) {
  if (!email) return showToast('ยังไม่มีอีเมลของผู้ใช้นี้');
  if (!confirm(`ส่งลิงก์ reset password ไปที่ ${email}?`)) return;
  const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + window.location.pathname });
  if (error) return showToast(error.message);
  showToast('ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว');
}

function staffOptions(selected='') { return state.staff.filter(s => s.is_active).map(s => `<option value="${s.id}" ${selected===s.id?'selected':''}>${escapeHtml(s.nickname || s.full_name)} (${escapeHtml(s.staff_type || '-')})</option>`).join(''); }
function daysBetween(start, end) { const out=[]; const d=parseDate(start); const e=parseDate(end); while(d<=e){ out.push(toDateInput(d)); d.setDate(d.getDate()+1); } return out; }
function exportTable(tableId, filename) { const table = document.getElementById(tableId); if (!table) return showToast('ไม่พบตารางสำหรับ Export'); const wb = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' }); XLSX.writeFile(wb, filename); }
function exportScheduleExcel() { exportTable('scheduleTable', `Roster_${state.monthKey}.xlsx`); }
function exportAuditExcel() {
  const data = state.auditLogs.map(a => ({ created_at: a.created_at, actor: staffName(a.actor_id), action: a.action, table: a.table_name, record_id: a.record_id, old_data: JSON.stringify(a.old_data || {}), new_data: JSON.stringify(a.new_data || {}) }));
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Audit'); XLSX.writeFile(wb, `Audit_${todayStr()}.xlsx`);
}
function showAuditDetail(id) {
  const a = state.auditLogs.find(x => x.id === id);
  if (!a) return;
  showModal(`<h2>Audit Detail</h2><p><b>${escapeHtml(a.action)}</b> • ${escapeHtml(a.table_name)} • ${formatThaiDateTime(a.created_at)}</p><div class="grid grid-2"><div><h3>ค่าเดิม</h3><pre>${escapeHtml(JSON.stringify(a.old_data, null, 2))}</pre></div><div><h3>ค่าใหม่</h3><pre>${escapeHtml(JSON.stringify(a.new_data, null, 2))}</pre></div></div>`);
}
