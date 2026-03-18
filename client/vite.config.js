import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // อนุญาตให้ Docker map port ออกมาได้
    watch: {
      usePolling: true, // จำเป็นสำหรับ Docker บน Windows (inotify ไม่ทำงาน)
    },
    proxy: {
      // เมื่อไหร่ที่ React เรียก /api ให้ชิ่งไปหา Backend
      '/api': {
        target: 'http://backend:5000', // อ้างอิงชื่อ Service ใน docker-compose
        changeOrigin: true,
      },
      // ให้ไฟล์รูปจาก backend static folder เข้าถึงได้ผ่าน dev server
      '/static': {
        target: 'http://backend:5000',
        changeOrigin: true,
      }
    }
  }
})