/* CNMI Staff Planner Patch V60
   - ปรับ Responsive Layout ให้ใช้งานบนคอมที่ Browser Zoom 100% ได้พอดีขึ้น
   - ลดอาการเมนูซ้าย/ปุ่ม Log Out ตกขอบ
   - จำกัด horizontal scroll ให้อยู่เฉพาะในกล่องตาราง ไม่ดันทั้งหน้า
   - ปรับหน้าข้อมูลส่วนตัวไม่ให้ตัวหนังสือและปุ่มขี่กัน
   - ไม่ต้อง Run SQL เพิ่ม
*/
(function(){
  const PATCH = 'V60_RESPONSIVE_100_PERCENT';
  function injectStyle(){
    if (document.getElementById('v60ResponsiveStyle')) return;
    const st = document.createElement('style');
    st.id = 'v60ResponsiveStyle';
    st.textContent = `
      html, body { width:100% !important; max-width:100% !important; overflow-x:hidden !important; }
      body { font-size:15px !important; }
      *, *::before, *::after { box-sizing:border-box !important; }

      /* โครงหลัก: ไม่ให้หน้าเว็บถูกดันกว้างเกินจอ */
      .app-view{
        width:100% !important;
        max-width:100vw !important;
        min-height:100dvh !important;
        grid-template-columns:272px minmax(0,1fr) !important;
        overflow-x:hidden !important;
      }
      .main-panel{
        min-width:0 !important;
        width:100% !important;
        max-width:100% !important;
        overflow-x:hidden !important;
      }
      .page-content{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        overflow-x:hidden !important;
        padding:18px clamp(14px, 1.6vw, 24px) !important;
        gap:16px !important;
      }
      .topbar{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        padding:14px clamp(14px, 1.6vw, 24px) !important;
        overflow:hidden !important;
      }
      .topbar h2{font-size:22px !important; line-height:1.28 !important;}
      .topbar p{font-size:14px !important; line-height:1.35 !important;}
      .topbar > div:nth-child(2){min-width:0 !important;}
      .topbar-actions{flex-shrink:0 !important;}

      /* Sidebar: ให้เป็นแถบเมนูแบบแอพ ไม่เกิด scroll แนวนอน */
      .sidebar{
        width:272px !important;
        min-width:272px !important;
        max-width:272px !important;
        height:100dvh !important;
        padding:14px 14px 12px !important;
        overflow:hidden !important;
        display:flex !important;
        flex-direction:column !important;
      }
      .sidebar-head{gap:10px !important; margin-bottom:12px !important; flex-shrink:0 !important; min-width:0 !important;}
      .brand-icon{width:44px !important; height:44px !important; border-radius:16px !important; flex:0 0 auto !important;}
      .sidebar-head > div:last-child{min-width:0 !important;}
      .app-title{font-size:18px !important; line-height:1.15 !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important;}
      .app-subtitle{font-size:12px !important; white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important;}
      .main-nav{
        flex:1 1 auto !important;
        min-height:0 !important;
        overflow-y:auto !important;
        overflow-x:hidden !important;
        padding-right:3px !important;
        gap:4px !important;
      }
      .nav-section{gap:4px !important; margin-bottom:10px !important; min-width:0 !important;}
      .nav-section-head{font-size:13px !important; gap:8px !important; min-width:0 !important;}
      .nav-section-head span{white-space:nowrap !important; overflow:hidden !important; text-overflow:ellipsis !important;}
      .nav-btn{
        min-width:0 !important;
        width:100% !important;
        min-height:40px !important;
        padding:9px 10px !important;
        gap:8px !important;
        border-radius:14px !important;
        font-size:14.5px !important;
        line-height:1.25 !important;
        white-space:nowrap !important;
        overflow:hidden !important;
      }
      .nav-emoji{width:20px !important; min-width:20px !important; flex:0 0 20px !important;}
      .nav-btn span:last-child,
      .nav-btn .nav-title{
        min-width:0 !important;
        display:block !important;
        white-space:nowrap !important;
        overflow:hidden !important;
        text-overflow:ellipsis !important;
        -webkit-line-clamp:unset !important;
        -webkit-box-orient:initial !important;
      }
      .sidebar-foot{
        flex:0 0 auto !important;
        margin-top:10px !important;
        padding-top:10px !important;
        display:grid !important;
        gap:10px !important;
        background:linear-gradient(180deg, rgba(238,248,255,.35), rgba(238,248,255,.95)) !important;
      }
      .user-mini{padding:10px !important; border-radius:18px !important; font-size:13.5px !important; line-height:1.35 !important; min-width:0 !important; overflow:hidden !important;}
      .mini-profile{min-width:0 !important; overflow:hidden !important; text-overflow:ellipsis !important;}
      #logoutBtn{min-height:42px !important; width:100% !important; flex-shrink:0 !important;}

      /* ปุ่มสามขีด: ทั้ง class เก่าและใหม่ต้องมีผล */
      body.sidebar-collapsed .app-view,
      body.cnmi-sidebar-collapsed .app-view{grid-template-columns:1fr !important;}
      body.sidebar-collapsed .sidebar,
      body.cnmi-sidebar-collapsed .sidebar{display:none !important;}
      body.sidebar-collapsed .main-panel,
      body.cnmi-sidebar-collapsed .main-panel{width:100% !important; max-width:100vw !important;}

      /* การ์ด/กริด/ตาราง: ให้ย่อในพื้นที่ ไม่ดันจอ */
      .card, .grid, .grid-2, .grid-3, .grid-4, .form-grid, .toolbar,
      .roster-board, .eligibility-page, .position-card-grid,
      .schedule-page-card, .monthly-matrix-wrap, .month-position-matrix,
      .calendar-shell, .activities-v57, .leave-list-card, .activity-list-card{
        min-width:0 !important;
        max-width:100% !important;
      }
      .card{padding:16px !important; overflow:hidden !important;}
      .section-title{gap:10px !important; flex-wrap:wrap !important; align-items:flex-start !important;}
      .toolbar{gap:8px !important; flex-wrap:wrap !important;}
      .toolbar label{min-width:170px !important; max-width:100% !important;}
      .toolbar input,.toolbar select,.toolbar button{max-width:100% !important;}
      input, select, textarea, button{max-width:100% !important;}
      .primary-btn,.ghost-btn,.soft-btn,.danger-ghost{min-height:40px !important; padding:8px 13px !important; line-height:1.25 !important;}
      .table-wrap,
      .month-position-matrix,
      .mobile-schedule-matrix-wrap,
      .roster-table-wrap{
        width:100% !important;
        max-width:100% !important;
        min-width:0 !important;
        overflow:auto !important;
        overscroll-behavior-x:contain !important;
      }
      table{max-width:none !important;}
      th,td{padding:10px 12px !important; line-height:1.35 !important;}
      .month-position-matrix table{min-width:1320px !important;}
      .schedule-person-matrix{min-width:860px !important;}
      .roster-table{min-width:720px !important;}
      .eligibility-table th,.eligibility-table td{min-width:96px !important;}
      .eligibility-table .sticky-col{min-width:142px !important;}

      /* หน้าใหญ่ที่มี 2 คอลัมน์: ลดการเบียดบนจอคอม/โน้ตบุ๊ก */
      @media (max-width:1280px){
        .grid-4{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
        .activities-v57{grid-template-columns:1fr !important;}
        .activity-list-card,.leave-list-card{max-height:none !important;}
      }
      @media (max-width:1180px){
        .grid-3{grid-template-columns:repeat(2,minmax(0,1fr)) !important;}
        .roster-board{grid-template-columns:220px minmax(0,1fr) !important;}
      }
      @media (max-width:1080px){
        .grid-2,.profile-page-grid{grid-template-columns:1fr !important;}
        .roster-board,.eligibility-page{grid-template-columns:1fr !important;}
      }

      /* ข้อมูลส่วนตัว: แก้ตัวหนังสือชิด/ปุ่มขี่กัน */
      #myProfilePage .profile-card-readable,
      #myProfilePage .card{min-width:0 !important;}
      #myProfilePage .profile-info-list,
      #myProfilePage .profile-info-grid{display:grid !important; gap:0 !important; margin:12px 0 18px !important;}
      #myProfilePage .profile-info-list > div,
      #myProfilePage .profile-info-grid > div,
      #myProfilePage .profile-info-row{
        display:grid !important;
        grid-template-columns:118px minmax(0,1fr) !important;
        gap:8px 16px !important;
        align-items:start !important;
        padding:10px 0 !important;
        border-bottom:1px solid rgba(148,163,184,.22) !important;
        line-height:1.55 !important;
      }
      #myProfilePage .profile-info-list span,
      #myProfilePage .profile-info-grid span,
      #myProfilePage .profile-info-row span{color:#64748b !important; white-space:nowrap !important;}
      #myProfilePage .profile-info-list b,
      #myProfilePage .profile-info-grid b,
      #myProfilePage .profile-info-row b{display:block !important; min-width:0 !important; overflow-wrap:anywhere !important; word-break:break-word !important; line-height:1.55 !important;}
      #profileChangeForm.compact-form,
      #myProfilePage .compact-form{
        display:grid !important;
        grid-template-columns:1fr !important;
        gap:12px !important;
        align-items:stretch !important;
        margin-top:12px !important;
      }
      #myProfilePage .compact-form .two-cols,
      #profileChangeForm .two-cols{
        display:grid !important;
        grid-template-columns:minmax(160px,220px) minmax(0,1fr) !important;
        gap:12px !important;
        width:100% !important;
        grid-column:1/-1 !important;
      }
      #profileChangeForm label,
      #profileChangeForm input,
      #profileChangeForm select,
      #profileChangeForm textarea,
      #profileChangeForm button{min-width:0 !important; width:100% !important;}
      #profileChangeForm textarea{min-height:90px !important;}
      #profileChangeForm .primary-btn{min-height:48px !important; white-space:normal !important;}

      /* List card ของลา/กิจกรรม ให้ดูเป็นแอพและไม่ยาวหลุดกรอบ */
      .v59-filter-grid{grid-template-columns:repeat(auto-fit,minmax(150px,1fr)) !important; gap:8px !important;}
      .v59-filter-grid label{min-width:0 !important;}
      .v59-filter-grid .ghost-btn{height:40px !important; align-self:end !important;}
      .activity-row-card,.mobile-card,.v57-request-card{min-width:0 !important; overflow:hidden !important;}
      .activity-row-head,.request-head{min-width:0 !important;}
      .activity-row-detail{grid-template-columns:82px minmax(0,1fr) !important;}
      .activity-row-detail b{overflow-wrap:anywhere !important; word-break:break-word !important;}

      @media (max-width:820px){
        body{font-size:15px !important;}
        .app-view{display:block !important; max-width:100vw !important;}
        .sidebar{
          width:min(84vw, 292px) !important;
          min-width:0 !important;
          max-width:84vw !important;
          position:fixed !important;
          inset:0 auto 0 0 !important;
          z-index:80 !important;
          transform:translateX(-105%) !important;
          transition:.22s ease !important;
        }
        .sidebar.open{transform:translateX(0) !important;}
        .topbar{padding:12px 14px !important; gap:10px !important;}
        .topbar h2{font-size:21px !important;}
        .sync-status{display:none !important;}
        .page-content{padding:12px !important;}
        .card{padding:14px !important; border-radius:20px !important;}
        .grid-2,.grid-3,.grid-4,.profile-page-grid,.form-grid{grid-template-columns:1fr !important;}
        #myProfilePage .profile-info-list > div,
        #myProfilePage .profile-info-grid > div,
        #myProfilePage .profile-info-row{grid-template-columns:88px minmax(0,1fr) !important; gap:6px 10px !important;}
        #myProfilePage .compact-form .two-cols,
        #profileChangeForm .two-cols{grid-template-columns:1fr !important;}
        .toolbar label{min-width:0 !important; width:100% !important;}
        .v59-filter-grid{grid-template-columns:1fr !important;}
        #logoutBtn{min-height:44px !important;}
      }
      @media (max-width:420px){
        #myProfilePage .profile-info-list > div,
        #myProfilePage .profile-info-grid > div,
        #myProfilePage .profile-info-row{grid-template-columns:1fr !important;}
        .topbar-actions .ghost-btn{padding-inline:10px !important;}
      }
    `;
    document.head.appendChild(st);
  }

  function markLoaded(){
    try { console.info(`CNMI Staff Planner ${PATCH} loaded`); } catch(e) {}
  }

  injectStyle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { injectStyle(); markLoaded(); });
  } else {
    markLoaded();
  }
})();
