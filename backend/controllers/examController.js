const pool = require('../db');

// Rastgele 6 haneli Sınav Kodu üretici
const generateCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

// Güvenli string dönüştürme
const normalizeHtmlText = (value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
};

// Güvenli sayı dönüştürme
const normalizePoints = (value, fallback = 10) => {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};

// Rules normalize et
const normalizeRules = (rules = {}) => {
  return {
    scoring_type: rules?.scoring_type || "partial",
    strict_mode: !!rules?.strict_mode,
    wrong_cancels_right: !!rules?.wrong_cancels_right,
    wrong_cancels_ratio: Number(rules?.wrong_cancels_ratio) === 3 ? 3 : 4,
    browser_lock: rules?.browser_lock !== false,
    violation_limit: Math.max(1, Number(rules?.violation_limit) || 1),
  };
};

// Sınav Oluşturma (Rich Text + Resim Destekli)
exports.createExam = async (req, res) => {
  const {
    instructor_id,
    title,
    description,
    duration_minutes,
    rules,
    questions
  } = req.body;

  const accessCode = generateCode();
  const client = await pool.connect();

  try {
    if (!instructor_id) {
      return res.status(400).json({ success: false, message: "Eğitmen bilgisi eksik." });
    }

    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: "Sınav başlığı zorunludur." });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: "En az bir soru eklemelisiniz." });
    }

    await client.query('BEGIN');

    const insertExamText = `
      INSERT INTO exams (
        instructor_id,
        title,
        description,
        duration_minutes,
        rules,
        is_published,
        access_code
      )
      VALUES ($1, $2, $3, $4, $5, true, $6)
      RETURNING exam_id, access_code
    `;

    const normalizedRules = normalizeRules(rules);

    const examRes = await client.query(insertExamText, [
      instructor_id,
      normalizeHtmlText(title),
      normalizeHtmlText(description),
      normalizePoints(duration_minutes, 60),
      normalizedRules,
      accessCode
    ]);

    const examId = examRes.rows[0].exam_id;

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i] || {};

      const questionText = normalizeHtmlText(q.question_text);
      const questionImage = q.question_image || "";
      const questionPoints = normalizePoints(q.points, 10);
      const options = Array.isArray(q.options) ? q.options : [];

      if (!questionText && !questionImage) {
        throw new Error(`Soru ${i + 1} için metin veya görsel bulunamadı.`);
      }

      if (options.length < 2) {
        throw new Error(`Soru ${i + 1} için en az 2 şık gereklidir.`);
      }

      if (!options.some(opt => !!opt.is_correct)) {
        throw new Error(`Soru ${i + 1} için en az 1 doğru cevap seçilmelidir.`);
      }

      const insertQText = `
        INSERT INTO questions (exam_id, question_text, question_image, points, order_index)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING question_id
      `;

      const qRes = await client.query(insertQText, [
        examId,
        questionText,
        questionImage,
        questionPoints,
        i
      ]);

      const qId = qRes.rows[0].question_id;

      for (let j = 0; j < options.length; j++) {
        const opt = options[j] || {};
        const optionText = normalizeHtmlText(opt.option_text);

        if (!optionText) {
          throw new Error(`Soru ${i + 1}, Şık ${j + 1} boş bırakılamaz.`);
        }

        await client.query(
          'INSERT INTO options (question_id, option_text, is_correct) VALUES ($1, $2, $3)',
          [qId, optionText, !!opt.is_correct]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Sınav başarıyla oluşturuldu",
      examId,
      accessCode
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Sınav oluşturma hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası: " + error.message
    });
  } finally {
    client.release();
  }
};

// ID ile sınav getirme (Öğrenci Sınavı Çözerken)
exports.getExamById = async (req, res) => {
  const { id } = req.params;

  try {
    const examRes = await pool.query(
      'SELECT * FROM exams WHERE exam_id = $1',
      [id]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sınav bulunamadı'
      });
    }

    const exam = examRes.rows[0];

    const questionsRes = await pool.query(
      `
      SELECT question_id, question_text, question_image, points, order_index
      FROM questions
      WHERE exam_id = $1
      ORDER BY order_index
      `,
      [id]
    );

    const questions = questionsRes.rows;

    for (const q of questions) {
      const optionsRes = await pool.query(
        `
        SELECT option_id, option_text
        FROM options
        WHERE question_id = $1
        `,
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

// Erişim Kodu ile Sınav Bulma
exports.getExamByAccessCode = async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT exam_id, title, description, duration_minutes, instructor_id
      FROM exams
      WHERE access_code = $1
      `,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Geçersiz sınav kodu."
      });
    }

    res.json({ success: true, exam: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

exports.terminateExam = async (req, res) => {
  const { user_id, exam_id, violations } = req.body;

  try {
    const updateQuery = `
      UPDATE submissions
      SET score = 0,
          status = 'TERMINATED',
          violation_count = $1,
          student_answers = '[]'::jsonb,
          finished_at = NOW()
      WHERE user_id = $2 AND exam_id = $3
      RETURNING submission_id
    `;

    const result = await pool.query(updateQuery, [
      violations || 0,
      user_id,
      exam_id
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Aktif sınav kaydı bulunamadı."
      });
    }

    res.json({
      success: true,
      message: "Sınav ihlal nedeniyle sonlandırıldı."
    });
  } catch (error) {
    console.error("Terminate Exam Hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası"
    });
  }
};

exports.submitExam = async (req, res) => {
  const { exam_id, user_id, answers, violations } = req.body;
  const client = await pool.connect();

  try {
    const examRes = await client.query(
      'SELECT * FROM exams WHERE exam_id = $1',
      [exam_id]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sınav bulunamadı"
      });
    }

    const exam = examRes.rows[0];
    const rules = normalizeRules(exam.rules || {});

    const questionsRes = await client.query(
      `
      SELECT q.question_id, q.question_text, q.points, o.option_id, o.option_text, o.is_correct
      FROM questions q
      JOIN options o ON q.question_id = o.question_id
      WHERE q.exam_id = $1
      `,
      [exam_id]
    );

    const questionMap = {};

    questionsRes.rows.forEach(row => {
      if (!questionMap[row.question_id]) {
        questionMap[row.question_id] = {
          text: row.question_text,
          points: Number(row.points) || 0,
          options: {}
        };
      }

      questionMap[row.question_id].options[row.option_id] = {
        text: row.option_text,
        isCorrect: row.is_correct
      };
    });

    let totalScore = 0;
    const detailedAnswers = [];
    const incomingAnswers = Array.isArray(answers) ? answers : [];

    for (const ans of incomingAnswers) {
      const qId = ans.question_id;
      const userSelectedOptionIds = Array.isArray(ans.selected_options)
        ? ans.selected_options
        : [];

      const qData = questionMap[qId];
      if (!qData) continue;

      const allCorrectOptionIds = Object.keys(qData.options)
        .filter(optId => qData.options[optId].isCorrect === true)
        .map(Number);

      let correctHits = 0;
      let wrongHits = 0;
      const selectedOptionTexts = [];

      userSelectedOptionIds.forEach(optId => {
        if (!qData.options[optId]) return;

        if (qData.options[optId].isCorrect) correctHits++;
        else wrongHits++;

        selectedOptionTexts.push(qData.options[optId].text);
      });

      let questionScore = 0;
      const totalCorrectCount = allCorrectOptionIds.length;

      const pointPerCorrectOption =
        totalCorrectCount > 0 ? qData.points / totalCorrectCount : 0;

      const cancelRatio = rules.wrong_cancels_right
        ? (Number(rules.wrong_cancels_ratio) === 3 ? 3 : 4)
        : null;

      const penaltyPerWrong =
        cancelRatio && totalCorrectCount > 0
          ? pointPerCorrectOption / cancelRatio
          : 0;

      // ÇOKLU DOĞRU SORULAR:
      // - yanlış işaretleme varsa direkt yanlış
      // - yanlış yoksa işaretlenen doğru kadar kısmi puan
      if (totalCorrectCount > 1) {
        if (wrongHits > 0) {
          questionScore = 0;
        } else {
          questionScore = correctHits * pointPerCorrectOption;
        }
      } else {
        // TEK DOĞRU SORULAR:
        // - doğruysa tam puan
        // - yanlışsa soru bazında eksi puan olabilir
        if (correctHits > 0 && wrongHits === 0) {
          questionScore = qData.points;
        } else if (wrongHits > 0) {
          if (rules.wrong_cancels_right) {
            questionScore = 0 - (wrongHits * penaltyPerWrong);
          } else {
            questionScore = 0;
          }
        } else {
          questionScore = 0;
        }
      }

      // strict mode açıksa yanlış işaretleme varsa direkt sıfır
      if (rules.strict_mode && wrongHits > 0) {
        questionScore = 0;
      }

      // burada soru puanını 0'a çekmiyoruz
      totalScore += questionScore;

      const isFullyCorrect =
        correctHits === totalCorrectCount && wrongHits === 0;

      const isPartial =
        totalCorrectCount > 1 &&
        wrongHits === 0 &&
        correctHits > 0 &&
        correctHits < totalCorrectCount;

      detailedAnswers.push({
        questionId: qId,
        questionText: qData.text,
        userAnswer: selectedOptionTexts,
        isCorrect: isFullyCorrect,
        isPartial,
        scoreEarned: Number(questionScore.toFixed(4)),
        correctHits,
        wrongHits,
        pointPerCorrectOption: Number(pointPerCorrectOption.toFixed(4)),
        penaltyPerWrong: Number(penaltyPerWrong.toFixed(4)),
        wrongCancelsRight: !!rules.wrong_cancels_right,
        wrongCancelsRatio: cancelRatio,
      });
    }

    // toplam puan 0'ın altına düşmesin
    totalScore = Number(Math.max(0, totalScore).toFixed(4));

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
      violations || 0,
      JSON.stringify(detailedAnswers),
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

// Sınava Giriş (Başlatma)
exports.startExam = async (req, res) => {
  const { user_id, exam_id } = req.body;

  try {
    const query = `
      INSERT INTO submissions (user_id, exam_id, status, started_at)
      VALUES ($1, $2, 'IN_PROGRESS', NOW())
      RETURNING submission_id
    `;

    await pool.query(query, [user_id, exam_id]);

    res.json({ success: true, message: "Sınav başlatıldı, başarılar!" });

  } catch (error) {
    if (error.code === '23505') {
      const checkRes = await pool.query(
        'SELECT status FROM submissions WHERE user_id = $1 AND exam_id = $2',
        [user_id, exam_id]
      );

        const status = checkRes.rows[0]?.status;

        if (status === 'COMPLETED') {
        return res.status(403).json({
            success: false,
            message: "Bu sınavı zaten tamamladınız. Tekrar giremezsiniz."
        });
        }

        if (status === 'TERMINATED') {
        return res.status(403).json({
            success: false,
            message: "Bu sınav ihlal nedeniyle sonlandırılmıştır. Tekrar giremezsiniz."
        });
        }

        return res.json({
        success: true,
        message: "Sınava kaldığınız yerden devam ediliyor..."
        });
    }

    console.error("Start Exam Hatası:", error);
    res.status(500).json({ success: false, message: "Sunucu hatası" });
  }
};

// Öğrencinin Geçmiş Sınavları
exports.getStudentHistory = async (req, res) => {
  const { user_id } = req.params;

  try {
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
exports.getSubmissionReport = async (req, res) => {
  const { examId, submissionId } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT
        s.submission_id,
        s.exam_id,
        s.user_id,
        s.score,
        s.status,
        s.started_at,
        s.finished_at,
        s.violation_count,
        s.student_answers,
        e.title AS exam_title,
        e.access_code,
        u.username,
        u.email
      FROM submissions s
      JOIN exams e ON s.exam_id = e.exam_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.exam_id = $1 AND s.submission_id = $2
      LIMIT 1
      `,
      [examId, submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "İlgili öğrenci sınav kaydı bulunamadı."
      });
    }

    const row = result.rows[0];

    let parsedAnswers = row.student_answers;
    if (typeof parsedAnswers === "string") {
      try {
        parsedAnswers = JSON.parse(parsedAnswers);
      } catch (e) {
        parsedAnswers = [];
      }
    }

    if (!Array.isArray(parsedAnswers)) {
      parsedAnswers = [];
    }

    const summary = parsedAnswers.reduce(
      (acc, ans) => {
        const scoreEarned = Number(ans.scoreEarned || 0);

        if (ans.isCorrect) acc.correctCount += 1;
        else if (ans.isPartial) acc.partialCount += 1;
        else if (scoreEarned < 0) acc.negativeCount += 1;
        else acc.wrongCount += 1;

        return acc;
      },
      {
        correctCount: 0,
        partialCount: 0,
        negativeCount: 0,
        wrongCount: 0
      }
    );

    return res.json({
      success: true,
      report: {
        exam: {
          exam_id: row.exam_id,
          title: row.exam_title,
          access_code: row.access_code
        },
        student: {
          user_id: row.user_id,
          username: row.username,
          email: row.email
        },
        submission: {
          submission_id: row.submission_id,
          score: Number(row.score || 0),
          status: row.status,
          started_at: row.started_at,
          finished_at: row.finished_at,
          violation_count: row.violation_count || 0
        },
        summary,
        answers: parsedAnswers
      }
    });
  } catch (error) {
    console.error("Submission Report Hatası:", error);
    return res.status(500).json({
      success: false,
      message: "Sunucu hatası: " + error.message
    });
  }
};

exports.getExamAnalytics = async (req, res) => {
  const { examId } = req.params;

  try {
    const examRes = await pool.query(
      'SELECT title FROM exams WHERE exam_id = $1',
      [examId]
    );

    if (examRes.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sınav bulunamadı"
      });
    }

    const examTitle = examRes.rows[0].title;

    const submissionsRes = await pool.query(
      `
      SELECT s.*, u.username, u.email
      FROM submissions s
      JOIN users u ON s.user_id = u.user_id
      WHERE s.exam_id = $1 AND s.status = 'COMPLETED'
      ORDER BY s.score DESC
      `,
      [examId]
    );

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
    const average = (totalScore / totalParticipants).toFixed(2);
    const maxScore = Math.max(...submissions.map((s) => Number(s.score)));
    const minScore = Math.min(...submissions.map((s) => Number(s.score)));

    const questionStats = {};

    submissions.forEach((sub) => {
      let answers = sub.student_answers;

      if (typeof answers === "string") {
        try {
          answers = JSON.parse(answers);
        } catch (e) {
          answers = [];
        }
      }

      if (answers && Array.isArray(answers)) {
        answers.forEach((ans, index) => {
          const qKey = ans.questionId ? `q_${ans.questionId}` : `idx_${index}`;

          if (!questionStats[qKey]) {
            questionStats[qKey] = {
              text: ans.questionText || `Soru ${index + 1}`,
              correct: 0,
              partial: 0,
              negative: 0,
              wrong: 0,
              totalScore: 0,
              seen: 0
            };
          }

          const scoreEarned = Number(ans.scoreEarned || 0);
          const isCorrect = !!ans.isCorrect;
          const isPartial = !!ans.isPartial;

          questionStats[qKey].seen += 1;
          questionStats[qKey].totalScore += scoreEarned;

          if (isCorrect) {
            questionStats[qKey].correct += 1;
          } else if (scoreEarned < 0) {
            questionStats[qKey].negative += 1;
          } else if (isPartial) {
            questionStats[qKey].partial += 1;
          } else {
            questionStats[qKey].wrong += 1;
          }
        });
      }
    });

    const questionAnalysis = Object.values(questionStats).map((q) => ({
      text: q.text,
      correctCount: q.correct,
      partialCount: q.partial,
      negativeCount: q.negative,
      wrongCount: q.wrong,
      avgScore: q.seen > 0 ? Number((q.totalScore / q.seen).toFixed(2)) : 0,
      correctRate: ((q.correct / totalParticipants) * 100).toFixed(0)
    }));

    res.json({
      success: true,
      examTitle,
      stats: {
        average,
        max: Number(maxScore.toFixed(2)),
        min: Number(minScore.toFixed(2)),
        totalParticipants
      },
      students: submissions,
      questionAnalysis
    });

  } catch (error) {
    console.error("Analiz Hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası: " + error.message
    });
  }
};