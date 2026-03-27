// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// โหลด Environment Variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Healthcheck Route สำหรับ Monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start Server
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});