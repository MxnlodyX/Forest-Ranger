/** แปลง date string เป็นรูปแบบไทย เช่น "16 มีนาคม 2569" */
export const formatDateTH = (dateStr) =>
  new Date(dateStr).toLocaleDateString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

/** ทำให้ตัวอักษรแรกเป็นตัวพิมพ์ใหญ่ */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/** ตัดข้อความยาวเกิน maxLength ด้วย ellipsis */
export const truncate = (str, maxLength = 50) =>
  (str?.length ?? 0) > maxLength ? `${str.slice(0, maxLength)}…` : (str ?? '');

/** จัดรูปแบบตัวเลขให้มี comma เช่น 1,000,000 */
export const formatNumber = (num) =>
  new Intl.NumberFormat('th-TH').format(num);
