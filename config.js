// คัดลอกไฟล์นี้เป็น config.js แล้วใส่ค่าจาก Supabase / Apps Script ของจริง
window.CNMI_CONFIG = {
  APP_NAME: 'CNMI Duty Hub',
  ORG_NAME: 'หน่วยเวชศาสตร์บริการโลหิต',
  ALLOWED_DOMAIN: 'mahidol.ac.th',

  // Supabase Project Settings > API
  SUPABASE_URL: 'https://tpjhwmtctejhehutpzov.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwamh3bXRjdGVqaGVodXRwem92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2OTY0OTMsImV4cCI6MjA5NjI3MjQ5M30.WG7PO2xbp_11VhZRPaEgFTQaV5lIdi1D4_-zqRiQETQ',

  // Apps Script Web App URL ใช้เฉพาะงาน admin/backup ที่ต้องถือ secret ฝั่ง server
  APP_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbz6VKNkIM4vf0XbjebrBSNXun_WTyA0qOyNO6OphGCb3NQ7V3_ORrDMN-100taNSfFUsw/exec',

  // พิกัดโรงพยาบาลรามาธิบดีจักรีนฤบดินทร์ สำหรับยืนยันวันอยู่เวร / ขอ OT เพิ่ม / ถ้ายังทดสอบนอกโรงพยาบาล ให้ใช้:enabled: false แทน แต่ถ้าจะใช้จริงในพื้นที่โรงพยาบาล ให้เป็น true ได้เลย
  GEOFENCE: {
    enabled: true,
    lat: 13.52646,
    lng: 100.76085,
    radiusMeters: 500
  },

  // Staff ปิดรับแก้ลา/ไม่รับเวรของเดือนปัจจุบัน ตั้งแต่วันที่ 5 เวลา 23:59
  CURRENT_MONTH_CLOSE_DAY: 5,

  // Admin สามารถเพิ่ม/แก้/ยกเลิก/ลบ รายการลาแทน staff ได้เสมอ
  ADMIN_BYPASS_LEAVE_CLOSE_RULE: true
};

