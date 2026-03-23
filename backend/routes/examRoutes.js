// examRoutes.js
const router = require('express').Router();
const examController = require('../controllers/examController');

// 1. Hoca: Sınav Oluşturma
router.post('/create', examController.createExam);

// 2. Öğrenci: Sınava BAŞLAMA (Giriş Kontrolü burada yapılır)
router.post('/start', examController.startExam);

// 3. Öğrenci: Sınavı BİTİRME (Cevapları kaydetme)
router.post('/submit', examController.submitExam);

// 4. Öğrenci: Kod ile Sınav Bilgisi Bulma
router.get('/access/:code', examController.getExamByAccessCode);

// 5. Öğrenci: Geçmiş Sınavlarım (Dashboard için)
router.get('/history/:user_id', examController.getStudentHistory);

// 6. Hoca: Kendi Sınavlarını Görme
router.get('/instructor/:instructor_id', examController.getExamsByInstructor);

// 7. Genel: ID ile Sınav Detayı
router.get('/:id', examController.getExamById);

router.get('/analytics/:examId', examController.getExamAnalytics);

module.exports = router;