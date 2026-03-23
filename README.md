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

# ⚙️ Installation

## 1️⃣ Clone Repository

```
git clone https://github.com/yourusername/online-exam-platform.git
```

## 2️⃣ Install Backend Dependencies

```
cd backend
npm install
```

## 3️⃣ Setup Environment Variables

Create `.env` file based on `.env.example`.

```
DB_USER=postgres
DB_HOST=localhost
DB_NAME=online_exam
DB_PASSWORD=password
DB_PORT=5432
JWT_SECRET=super_secret_key
PORT=5000
```

## 4️⃣ Run Backend

```
node server.js
```

Server will run on:

```
http://localhost:5000
```

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
