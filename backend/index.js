const express = require('express');
const cors = require('cors');
require('dotenv').config();
const examRoutes = require('./routes/examRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.use(cors()); 
app.use(express.json({ limit: '50mb' })); 
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 1. Kimlik Doğrulama
app.use('/api/auth', authRoutes); 

// 2. Sınav işlemleri
app.use('/api/exams', examRoutes);

// Sunucuyu Başlat
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend Sunucusu ${PORT} portunda çalışıyor...`);
});