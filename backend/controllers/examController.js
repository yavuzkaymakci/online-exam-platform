const pool = require('../db');

// Rastgele 6 haneli Sınav Kodu üretici
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Sınav Oluşturma (Resim Destekli)
exports.createExam = async (req, res) => {
  const { instructor_id, title, description, duration_minutes, rules, questions } = req.body;
  const accessCode = generateCode();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Sınavı Kaydet
    const insertExamText = `
      INSERT INTO exams (instructor_id, title, description, duration_minutes, rules, is_published, access_code)
      VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING exam_id, access_code
    `;
    const examRes = await client.query(insertExamText, [instructor_id, title, description, duration_minutes, rules, accessCode]);
    const examId = examRes.rows[0].exam_id;

    // 2. Soruları Kaydet
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const questionPoints = parseInt(q.points) || 10;

      const insertQText = `
        INSERT INTO questions (exam_id, question_text, question_image, points, order_index)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING question_id
      `;
      
      const qRes = await client.query(insertQText, [examId, q.question_text, q.question_image, questionPoints, i]);
      const qId = qRes.rows[0].question_id;

      // Şıkları Kaydet
      for (const opt of q.options) {
        await client.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
          [qId, opt.option_text, opt.is_correct]
        );
      }
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, message: "Sınav başarıyla oluşturuldu", examId, accessCode });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Sınav oluşturma hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
  } finally {
    client.release();
  }
};

// ID ile sınav getirme (Öğrenci Sınavı Çözerken)
exports.getExamById = async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Sınav bilgilerini çek
    const examRes = await pool.query('SELECT * FROM exams WHERE exam_id = $1', [id]);
    if (examRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Sınav bulunamadı' });
    }
    const exam = examRes.rows[0];

    // 2. Soruları çek
    const questionsRes = await pool.query(
      'SELECT question_id, question_text, question_image, points, order_index FROM questions WHERE exam_id = $1 ORDER BY order_index',
      [id]
    );
    const questions = questionsRes.rows;

    // 3. Şıkları çek (is_correct gizli, öğrenci kopya çekemesin diye)
    for (const q of questions) {
      const optionsRes = await pool.query(
        'SELECT option_id, option_text FROM options WHERE question_id = $1',
        [q.question_id]
      );
      q.options = optionsRes.rows; 
    }

    res.json({ success: true, exam, questions });

  } catch (error) {
    console.error('Sınav getirme hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası' });
  }
};

// Erişim Kodu ile Sınav Bulma (Öğrenci Dashboard için)
exports.getExamByAccessCode = async (req, res) => {
    const { code } = req.params;
    try {
      const result = await pool.query(
          'SELECT exam_id, title, description, duration_minutes, instructor_id FROM exams WHERE access_code = $1', 
          [code]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "Geçersiz sınav kodu." });
      }
      
      res.json({ success: true, exam: result.rows[0] });
    } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};
exports.submitExam = async (req, res) => {
    const { exam_id, user_id, answers, violations } = req.body;
    
    // Veritabanı bağlantısı al
    const client = await pool.connect();
  
    try {
        // 1. Sınav Kuralları ve Doğru Cevapları Çek
        const examRes = await client.query('SELECT * FROM exams WHERE exam_id = $1', [exam_id]);
        const exam = examRes.rows[0];
        const rules = exam.rules || {};
  
        // Soruları ve şıkları çek
        const questionsRes = await client.query(`
            SELECT q.question_id, q.question_text, q.points, o.option_id, o.option_text, o.is_correct
            FROM questions q
            JOIN options o ON q.question_id = o.question_id
            WHERE q.exam_id = $1
        `, [exam_id]);
        const questionMap = {};
        questionsRes.rows.forEach(row => {
            if (!questionMap[row.question_id]) {
                questionMap[row.question_id] = { 
                    text: row.question_text,
                    points: row.points, 
                    options: {} 
                };
            }
            questionMap[row.question_id].options[row.option_id] = {
                text: row.option_text,
                isCorrect: row.is_correct
            };
        });
  
        let totalScore = 0;
        let detailedAnswers = []; 
  
        for (const ans of answers) {
            const qId = ans.question_id;
            const userSelectedOptionIds = ans.selected_options || []; 
            const qData = questionMap[qId];
  
            if (!qData) continue; 
  
            const allCorrectOptionIds = Object.keys(qData.options)
                .filter(optId => qData.options[optId].isCorrect === true)
                .map(Number);
            
            let correctHits = 0;
            let wrongHits = 0;
            let selectedOptionTexts = []; 
            userSelectedOptionIds.forEach(optId => {
                if (qData.options[optId].isCorrect) correctHits++;
                else wrongHits++;
                
               
                if(qData.options[optId]) selectedOptionTexts.push(qData.options[optId].text);
            });
  
            let questionScore = 0;
            const totalCorrectCount = allCorrectOptionIds.length;
  
            if (rules.strict_mode && wrongHits > 0) {
                questionScore = 0;
            } else if (rules.scoring_type === 'partial') {
                if (totalCorrectCount > 0) {
                    const pointPerOption = qData.points / totalCorrectCount;
                    questionScore = correctHits * pointPerOption;
                }
            } else {
                if (correctHits === totalCorrectCount && wrongHits === 0) {
                    questionScore = qData.points;
                }
            }
            totalScore += Math.max(0, questionScore);

            detailedAnswers.push({
                questionId: qId,
                questionText: qData.text,
                userAnswer: selectedOptionTexts, 
                isCorrect: (questionScore === qData.points),
                scoreEarned: questionScore
            });
        }
        const updateQuery = `
            UPDATE submissions 
            SET score = $1, 
                status = 'COMPLETED', 
                violation_count = $2, 
                student_answers = $3::jsonb, 
                finished_at = NOW()
            WHERE user_id = $4 AND exam_id = $5
            RETURNING submission_id
        `;

        await client.query(updateQuery, [
            totalScore, 
            violations, 
            JSON.stringify(detailedAnswers), // JSON verisi
            user_id, 
            exam_id
        ]);
  
        res.json({ 
            success: true, 
            score: totalScore, 
            message: "Sınav başarıyla tamamlandı."
        });
  
    } catch (error) {
        console.error('Sınav hesaplama hatası:', error);
        res.status(500).json({ success: false, message: 'Hesaplama hatası' });
    } finally {
        client.release();
    }
};
exports.getExamsByInstructor = async (req, res) => {
  const { instructor_id } = req.params;

  try {
    // Sınavları oluşturulma tarihine göre (en yeni en üstte) getir
    const result = await pool.query(
      'SELECT * FROM exams WHERE instructor_id = $1 ORDER BY created_at DESC',
      [instructor_id]
    );

    res.json({ success: true, exams: result.rows });
  } catch (error) {
    console.error("Sınavları getirme hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Sınava Giriş (Başlatma) Fonksiyonu
exports.startExam = async (req, res) => {
    const { user_id, exam_id } = req.body;

    try {
        // Doğrudan INSERT deniyoruz. 
        // Eğer öğrenci daha önce girdiyse veritabanı "Unique Constraint" hatası verecek.
        const query = `
            INSERT INTO submissions (user_id, exam_id, status, started_at)
            VALUES ($1, $2, 'IN_PROGRESS', NOW())
            RETURNING submission_id
        `;
        
        await pool.query(query, [user_id, exam_id]);

        res.json({ success: true, message: "Sınav başlatıldı, başarılar!" });

    } catch (error) {
        // Hata kodu 23505 = Unique Violation (Zaten kayıt var)
        if (error.code === '23505') {
            const checkRes = await pool.query(
                'SELECT status FROM submissions WHERE user_id = $1 AND exam_id = $2',
                [user_id, exam_id]
            );
            
            if (checkRes.rows[0].status === 'COMPLETED') {
                return res.status(403).json({ 
                    success: false, 
                    message: "Bu sınavı zaten tamamladınız. Tekrar giremezsiniz." 
                });
            } else {
                return res.json({ 
                    success: true, 
                    message: "Sınava kaldığınız yerden devam ediliyor..." 
                });
            }
        }

        console.error("Start Exam Hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

//Öğrencinin Geçmiş Sınavları
exports.getStudentHistory = async (req, res) => {
    const { user_id } = req.params;

    try {
        // exams tablosuyla birleştirip sınav başlığını da çekiyoruz
        const query = `
            SELECT s.*, e.title, e.access_code 
            FROM submissions s
            JOIN exams e ON s.exam_id = e.exam_id
            WHERE s.user_id = $1 AND s.status = 'COMPLETED'
            ORDER BY s.finished_at DESC
        `;
        
        const result = await pool.query(query, [user_id]);
        res.json({ success: true, history: result.rows });

    } catch (error) {
        console.error("Geçmiş getirme hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası" });
    }
};

exports.getExamAnalytics = async (req, res) => {
    const { examId } = req.params;

    try {
        const examRes = await pool.query('SELECT title FROM exams WHERE exam_id = $1', [examId]);
        if (examRes.rows.length === 0) return res.status(404).json({ success: false, message: "Sınav bulunamadı" });
        
        const examTitle = examRes.rows[0].title;

        const qCountRes = await pool.query('SELECT COUNT(*) FROM questions WHERE exam_id = $1', [examId]);
        const totalQuestionCount = parseInt(qCountRes.rows[0].count);

        const submissionsRes = await pool.query(`
            SELECT s.*, u.username, u.email 
            FROM submissions s
            JOIN users u ON s.user_id = u.user_id
            WHERE s.exam_id = $1 AND s.status = 'COMPLETED'
            ORDER BY s.score DESC
        `, [examId]);

        const submissions = submissionsRes.rows;
        const totalParticipants = submissions.length;

        if (totalParticipants === 0) {
            return res.json({ 
                success: true, 
                examTitle,
                stats: { average: 0, max: 0, min: 0, totalParticipants: 0 }, 
                students: [], 
                questionAnalysis: [] 
            });
        }

        const totalScore = submissions.reduce((sum, sub) => sum + Number(sub.score), 0);
        const average = (totalScore / totalParticipants).toFixed(1);
        const maxScore = Math.max(...submissions.map(s => Number(s.score)));
        const minScore = Math.min(...submissions.map(s => Number(s.score)));

        let questionStats = {}; 

        submissions.forEach(sub => {
            let answers = sub.student_answers;
            if (typeof answers === 'string') {
                try { answers = JSON.parse(answers); } catch(e) { answers = []; }
            }

            if(answers && Array.isArray(answers)) {
                answers.forEach((ans, index) => {
                    const qKey = ans.questionId ? `q_${ans.questionId}` : `idx_${index}`;
                    
                    if (!questionStats[qKey]) {
                        questionStats[qKey] = { 
                            text: ans.questionText || `Soru ${index + 1}`, 
                            correct: 0, 
                            wrong: 0 
                        };
                    }

                    if (ans.isCorrect) questionStats[qKey].correct += 1;
                    else questionStats[qKey].wrong += 1;
                });
            }
        });

        const questionAnalysis = Object.values(questionStats).map(q => ({
            text: q.text,
            correctCount: q.correct,
            wrongCount: q.wrong,
            correctRate: ((q.correct / totalParticipants) * 100).toFixed(0)
        }));

        res.json({
            success: true,
            examTitle,
            stats: { average, max: maxScore, min: minScore, totalParticipants },
            students: submissions,
            questionAnalysis
        });

    } catch (error) {
        console.error("Analiz Hatası:", error);
        res.status(500).json({ success: false, message: "Sunucu hatası: " + error.message });
    }
};