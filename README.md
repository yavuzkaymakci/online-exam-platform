# Online Exam Platform

A full-stack web application that allows instructors to create online exams and students to participate securely using access codes.

The system supports real-time exam participation, automatic grading, and detailed analytics for instructors.

---

# Features

## Instructor

* Create exams with multiple questions
* Add image-supported questions
* Define exam duration and rules
* Generate unique **exam access codes**
* View **student performance analytics**
* See detailed question statistics

## Student

* Join exams using **access code**
* Take exams in real time
* Submit answers
* View exam results
* Access exam history

---

# Advanced Features

* JWT Authentication
* Password hashing with bcrypt
* Partial scoring support
* Strict exam mode
* Violation tracking
* Automatic grading
* Detailed analytics

---

# Technologies

### Backend

* Node.js
* Express.js
* PostgreSQL
* JWT Authentication
* bcrypt
* REST API

### Database

* PostgreSQL
* JSONB for storing student answers

---

#  Project Structure

```
backend
 ┣ controllers
 ┃ ┣ authController.js
 ┃ ┗ examController.js
 ┣ routes
 ┃ ┣ authRoutes.js
 ┃ ┗ examRoutes.js
 ┣ db.js
 ┗ server.js
```

---

# ⚙️ Kurulum Kılavuzu (Setup Guide)

Bu proje bir **Node.js/Express backend**, bir **PostgreSQL veritabanı** ve bir **React (Vite) frontend**'den oluşur. Aşağıdaki adımları sırasıyla takip ederek projeyi local ortamınızda çalıştırabilirsiniz.

## Gereksinimler (Prerequisites)

* [Node.js](https://nodejs.org/) v18 veya üzeri (npm dahil)
* [PostgreSQL](https://www.postgresql.org/download/) v13 veya üzeri
* [Git](https://git-scm.com/)

## 1️⃣ Projeyi Klonlayın

```bash
git clone https://github.com/yavuzkaymakci/online-exam-platform.git
cd online-exam-platform
```

## 2️⃣ Veritabanını Oluşturun

PostgreSQL kurulu olduğundan emin olun, ardından boş bir veritabanı oluşturun:

```bash
psql -U postgres -c "CREATE DATABASE online_exam;"
```

Tabloları oluşturmak için repoda bulunan şema dosyasını çalıştırın:

```bash
psql -U postgres -d online_exam -f backend/database/schema.sql
```

Bu komut şu tabloları oluşturur: `users`, `exams`, `questions`, `options`, `submissions`.

## 3️⃣ Backend Kurulumu

```bash
cd backend
npm install
```

### Ortam Değişkenlerini (.env) Ayarlayın

`backend` klasöründe `.env.example` dosyasını kopyalayarak `.env` dosyası oluşturun:

```bash
# Windows (PowerShell)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Ardından `.env` içeriğini kendi PostgreSQL bilgilerinize göre düzenleyin:

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=online_exam
DB_PASSWORD=postgres_sifreniz
DB_PORT=5432
JWT_SECRET=cok_gizli_bir_anahtar_belirleyin
PORT=5000
```

> ⚠️ `.env` dosyası `.gitignore` içinde olduğu için repoya gönderilmez. Her ortamda elle oluşturulması gerekir.

### Backend'i Çalıştırın

```bash
# Geliştirme modu (nodemon ile otomatik yeniden başlatma)
npx nodemon index.js

# veya normal mod
node index.js
```

Backend şu adreste çalışacaktır:

```
http://localhost:5000
```

Konsolda `Backend Sunucusu 5000 portunda çalışıyor...` mesajını görmelisiniz.

## 4️⃣ Frontend Kurulumu

Yeni bir terminal açın ve proje köküne dönün:

```bash
cd frontend
npm install
```

### API Adresi

Frontend, backend API'sine `frontend/src/api.js` içinde tanımlı şu adresten istek atar:

```js
const API_URL = "http://localhost:5000/api";
```

Backend'i farklı bir port/adreste çalıştırıyorsanız bu satırı güncelleyin.

### Frontend'i Çalıştırın

```bash
npm run dev
```

Frontend (Vite) varsayılan olarak şu adreste çalışacaktır:

```
http://localhost:5173
```

## 5️⃣ Uygulamayı Kullanma

1. Tarayıcıdan `http://localhost:5173` adresine gidin.
2. Önce **eğitmen (instructor)** rolüyle bir hesap oluşturun (`/register` veya kayıt sayfası).
3. Eğitmen olarak giriş yapıp bir sınav oluşturun; sistem otomatik bir **erişim kodu (access code)** üretecektir.
4. Öğrenci rolüyle ayrı bir hesap oluşturun, bu kodu kullanarak sınava katılabilirsiniz.

## Özet Komutlar

| İşlem | Komut |
|---|---|
| Veritabanı şeması | `psql -U postgres -d online_exam -f backend/database/schema.sql` |
| Backend bağımlılıkları | `cd backend && npm install` |
| Backend çalıştır | `cd backend && node index.js` |
| Frontend bağımlılıkları | `cd frontend && npm install` |
| Frontend çalıştır | `cd frontend && npm run dev` |

---

# API Endpoints

### Authentication

```
POST /api/auth/register
POST /api/auth/login
```

### Exams

```
POST /api/exams/create
POST /api/exams/start
POST /api/exams/submit
GET  /api/exams/:id
GET  /api/exams/access/:code
GET  /api/exams/history/:user_id
GET  /api/exams/instructor/:instructor_id
GET  /api/exams/analytics/:examId
```

---

# 📈 Analytics

The system provides detailed analytics including:

* Average score
* Highest score
* Lowest score
* Total participants
* Question success rate

---

# 🔐 Security

* Password hashing with bcrypt
* JWT-based authentication
* Exam access control
* Student violation tracking

---

#  Future Improvements

* Live proctoring system
* Webcam monitoring
* AI cheating detection
* Timer synchronization
* Deployment on cloud

---

#  Author

Yavuz Selim KAYMAKCI, Computer Engineering Student, Yildiz Technical University
Interested in **Backend Development, Distributed Systems, and AI applications**.
