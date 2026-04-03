# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
# Copy ไฟล์ที่ Build เสร็จแล้ว (ปกติ Vite/React จะอยู่ที่ /dist, ส่วน Next.js จะเป็น /out)
COPY --from=builder /app/dist /usr/share/nginx/html

# ตัว Dockerfile ยังคง EXPOSE 80 เป็นมาตรฐานของ Nginx
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
