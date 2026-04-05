FROM node:24-alpine
WORKDIR /app

# Install dependencies แยกก่อนเพื่อใช้ประโยชน์จาก Docker Cache
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .
EXPOSE 3000

# ใช้ Node.js สำหรับ Production
CMD ["node", "src/server.js"]
