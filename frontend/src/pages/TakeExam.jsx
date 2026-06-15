import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import RichTextRenderer from "../components/RichTextRenderer";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [warnings, setWarnings] = useState(0);
  const [isTerminated, setIsTerminated] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchExam = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await fetch(`http://localhost:5000/api/exams/${id}`);
        const text = await res.text();

        let data = {};
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Sunucudan beklenmeyen yanıt döndü.");
        }

        if (!res.ok || !data.success) {
          throw new Error(data.message || "Sınav yüklenemedi.");
        }

        if (!data.exam || !Array.isArray(data.questions)) {
          throw new Error("Sınav verisi eksik geldi.");
        }

        if (isMounted) {
          setExam(data.exam);
          setQuestions(data.questions);
          setTimeLeft((Number(data.exam.duration_minutes) || 0) * 60);
          setActiveQuestionIndex(0);
        }
      } catch (err) {
        console.error("TakeExam yükleme hatası:", err);
        if (isMounted) {
          setLoadError(err.message || "Sınav yüklenemedi.");
          setExam(null);
          setQuestions([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchExam();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (timeLeft === null || result || isTerminated || !exam) return;

    const timerId = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerId);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, result, isTerminated, exam]);

  const terminateExamOnViolation = async (finalViolationCount) => {
    if (!user?.user_id) return;

    try {
      await fetch("http://localhost:5000/api/exams/terminate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          user_id: user.user_id,
          exam_id: id,
          violations: finalViolationCount
        })
      });
    } catch (error) {
      console.error("Sınav terminate hatası:", error);
    }
  };

  useEffect(() => {
    if (!exam || result || isTerminated) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = warnings + 1;
        setWarnings(newCount);

        const limit = exam.rules?.violation_limit ?? 1;
        if (newCount >= limit) {
          (async () => {
            await terminateExamOnViolation(newCount);
            setIsTerminated(true);
            alert("İHLAL LİMİTİ AŞILDI! Sınavınız iptal ediliyor.");
          })();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [warnings, exam, result, isTerminated, user, id]);

  const formatTime = (seconds) => {
    const safeSeconds = Number(seconds) || 0;
    const m = Math.floor(safeSeconds / 60);
    const s = safeSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleOptionToggle = (questionId, optionId) => {
    if (result || isTerminated || timeLeft === 0) return;

    setAnswers((prev) => {
      const currentSelected = prev[questionId] || [];

      if (currentSelected.includes(optionId)) {
        return {
          ...prev,
          [questionId]: currentSelected.filter((id) => id !== optionId),
        };
      }

      return {
        ...prev,
        [questionId]: [...currentSelected, optionId],
      };
    });
  };

  const submitExamToBackend = async () => {
    if (!user || !user.user_id) {
      return alert("HATA: Kullanıcı oturumu bulunamadı!");
    }

    setIsSubmitting(true);

    const formattedAnswers = Object.keys(answers).map((qId) => ({
      question_id: parseInt(qId, 10),
      selected_options: answers[qId],
    }));

    const payload = {
      exam_id: id,
      user_id: user.user_id,
      answers: formattedAnswers,
      violations: warnings,
    };

    try {
      const response = await fetch("http://localhost:5000/api/exams/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await response.text();

      let data = {};
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Sunucudan geçersiz yanıt alındı.");
      }

      if (!response.ok) {
        throw new Error(data.message || text || "Gönderme hatası");
      }

      if (data.success) {
        setResult(data);
        window.scrollTo(0, 0);
        document.getElementById("finish_confirm_modal")?.close();
      } else {
        alert("İşlem Başarısız: " + (data.message || "Bilinmeyen hata"));
      }
    } catch (error) {
      console.error("Gönderme hatası:", error);
      alert(`BAĞLANTI HATASI:\n${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinishClick = () => {
    document.getElementById("finish_confirm_modal")?.showModal();
  };

  const handleAutoSubmit = () => {
    alert("SÜRE DOLDU! Sınavınız otomatik olarak gönderiliyor.");
    submitExamToBackend();
  };

  const currentQ = useMemo(() => {
    return questions[activeQuestionIndex] || null;
  }, [questions, activeQuestionIndex]);

  const isLastQuestion = activeQuestionIndex === questions.length - 1;
  const violationLimit = exam?.rules?.violation_limit ?? 1;
  const wrongCancelsRight = !!exam?.rules?.wrong_cancels_right;
  const wrongCancelsRatio =
    Number(exam?.rules?.wrong_cancels_ratio) === 3 ? 3 : 4;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#0F2C59]"></span>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-red-200 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-3">Sınav Yüklenemedi</h1>
          <p className="text-gray-600 mb-6">{loadError}</p>
          <div className="flex gap-3 justify-center">
            <button
              className="btn btn-outline"
              onClick={() => window.location.reload()}
            >
              Yeniden Dene
            </button>
            <button
              className="btn bg-[#0F2C59] text-white border-none hover:bg-[#1a3b6e]"
              onClick={() => navigate("/student-dashboard")}
            >
              Panele Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!exam || !currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-3">Sınav Yüklenemedi</h1>
          <p className="text-gray-600 mb-6">
            Sınav verisi eksik veya soru listesi boş geldi.
          </p>
          <button
            className="btn bg-[#0F2C59] text-white border-none hover:bg-[#1a3b6e]"
            onClick={() => navigate("/student-dashboard")}
          >
            Panele Dön
          </button>
        </div>
      </div>
    );
  }

  if (isTerminated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-4 text-center">
        <h1 className="text-5xl font-bold text-error mb-4">SINAV İPTAL EDİLDİ 🚨</h1>
        <p className="text-xl text-gray-700">
          Çok fazla sekme değiştirdiniz veya kural ihlali yaptınız.
        </p>
        <button
          className="btn btn-outline btn-error mt-8"
          onClick={() => navigate("/student-dashboard")}
        >
          Panele Dön
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-base-200 p-4">
        <div className="card w-full max-w-md bg-white shadow-2xl p-8 text-center border-t-8 border-success rounded-xl">
          <h1 className="text-4xl font-bold text-success mb-2">Tebrikler! 🎉</h1>
          <p className="text-gray-500">Sınav tamamlandı ve cevaplarınız kaydedildi.</p>
          <div className="py-8 my-6 bg-gray-50 rounded-xl border border-gray-100">
            <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">
              Toplam Puan
            </div>
            <div className="text-6xl font-black text-[#0F2C59]">
              {Number(result.score).toFixed(2)}
            </div>
          </div>
          <button
            className="btn bg-[#0F2C59] text-white hover:bg-[#1a3b6e] w-full border-none h-12 text-lg"
            onClick={() => navigate("/student-dashboard")}
          >
            SONUÇLARIMI İNCELE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 font-sans">
      <dialog
        id="finish_confirm_modal"
        className="modal modal-bottom sm:modal-middle backdrop-blur-md"
      >
        <div className="modal-box border-t-8 border-[#D4AF37]">
          <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
            🏁 Sınavı Bitir?
          </h3>
          <p className="py-4 text-gray-600">
            Sınavı bitirmek üzeresiniz. Cevaplarınız kaydedilecek ve puanınız hesaplanacaktır.
            <br />
            <span className="text-sm font-bold text-[#0F2C59] mt-2 block">
              {
                questions.length -
                Object.keys(answers).filter((k) => answers[k]?.length > 0).length
              }{" "}
              boş sorunuz var.
            </span>
          </p>
          <div className="modal-action flex gap-3 w-full">
            <form method="dialog" className="w-full flex gap-3">
              <button className="btn btn-ghost flex-1 text-gray-600 bg-gray-100 hover:bg-gray-200">
                Vazgeç
              </button>
              <button
                type="button"
                className="btn bg-[#0F2C59] text-white hover:bg-[#1a3b6e] flex-1 font-bold"
                onClick={submitExamToBackend}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="loading loading-spinner"></span>
                ) : (
                  "Evet, Bitir"
                )}
              </button>
            </form>
          </div>
        </div>
      </dialog>

      <div className="navbar bg-[#0F2C59] text-white px-8 shadow-md sticky top-0 z-50">
        <div className="flex-1 truncate">
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-wide">{exam.title}</span>
            <span className="text-xs opacity-70 font-mono">
              Öğrenci: {user?.username}
            </span>
          </div>
        </div>

        <div className="flex-none flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs bg-white/10 px-3 py-2 rounded-lg">
            <span>⚠️ Hak: {violationLimit}</span>
            <span>•</span>
            <span>
              {wrongCancelsRight
                ? `${wrongCancelsRatio} yanlış 1 doğruyu götürür`
                : "Yanlış götürmez"}
            </span>
          </div>

          {warnings > 0 && (
            <div className="badge badge-error gap-1 animate-pulse font-bold text-white p-3">
              ⚠️ {warnings} İHLAL
            </div>
          )}

          <div
            className={`text-2xl font-mono font-black px-4 py-1 rounded-lg border-2 ${
              timeLeft < 60
                ? "text-red-500 border-red-500 bg-white animate-pulse"
                : "text-white border-white/30 bg-[#0F2C59]"
            }`}
          >
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-3 order-2 lg:order-1">
          <div className="card bg-white shadow-sm border border-gray-200 sticky top-24">
            <div className="card-body p-4">
              <h3 className="font-bold text-[#0F2C59] mb-3 text-sm uppercase tracking-wider border-b border-gray-100 pb-2">
                Soru Haritası
              </h3>

              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, idx) => {
                  const isAnswered =
                    answers[q.question_id] && answers[q.question_id].length > 0;
                  const isActive = idx === activeQuestionIndex;

                  return (
                    <button
                      key={q.question_id || idx}
                      onClick={() => setActiveQuestionIndex(idx)}
                      className={`w-full aspect-square rounded-md font-bold text-sm transition-all border-2 ${
                        isActive
                          ? "bg-[#0F2C59] text-white border-[#0F2C59] scale-110 shadow-md z-10"
                          : isAnswered
                          ? "bg-[#D4AF37] text-white border-[#D4AF37] opacity-90"
                          : "bg-white text-gray-400 border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#0F2C59] rounded"></div> Şu Anki Soru
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#D4AF37] rounded"></div> Cevaplanmış
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 border border-gray-300 rounded"></div> Boş
                </div>
              </div>

              <button
                className="btn btn-error btn-outline w-full mt-6 btn-sm font-bold"
                onClick={handleFinishClick}
              >
                SINAVI BİTİR 🏁
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-9 order-1 lg:order-2">
          <div className="card bg-white shadow-lg border border-gray-200 min-h-[500px]">
            <div className="bg-gray-50 p-5 border-b border-gray-200 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-10 h-10 rounded-full bg-[#0F2C59] text-white font-bold text-xl shadow-md">
                  {activeQuestionIndex + 1}
                </span>
                <h2 className="font-bold text-gray-700 text-lg">Soru</h2>
              </div>
              <div className="badge badge-ghost font-bold text-[#0F2C59] p-3">
                {currentQ.points} Puan
              </div>
            </div>

            <div className="card-body p-6 md:p-8">
              <div className="mb-6">
                <RichTextRenderer
                  content={currentQ.question_text}
                  className="exam-rich-content text-gray-800 text-lg leading-relaxed"
                />
              </div>

              {currentQ.question_image && (
                <div className="mb-8 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex justify-center p-4">
                  <img
                    src={currentQ.question_image}
                    alt="Soru Görseli"
                    className="max-h-[400px] w-auto object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              <div className="grid gap-3">
                {currentQ.options.map((opt, oIndex) => {
                  const isSelected = (answers[currentQ.question_id] || []).includes(
                    opt.option_id
                  );
                  const letter = String.fromCharCode(65 + oIndex);

                  return (
                    <label
                      key={opt.option_id}
                      className={`flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all group ${
                        isSelected
                          ? "border-[#0F2C59] bg-blue-50 shadow-md"
                          : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 mt-1 flex-none flex items-center justify-center rounded-md font-bold text-sm transition-colors ${
                          isSelected
                            ? "bg-[#0F2C59] text-white"
                            : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
                        }`}
                      >
                        {letter}
                      </div>

                      <input
                        type="checkbox"
                        className="checkbox checkbox-primary hidden"
                        checked={isSelected}
                        onChange={() =>
                          handleOptionToggle(currentQ.question_id, opt.option_id)
                        }
                      />

                      <div
                        className={`flex-1 select-none ${
                          isSelected ? "text-[#0F2C59]" : "text-gray-600"
                        }`}
                      >
                        <RichTextRenderer
                          content={opt.option_text}
                          className="exam-rich-content text-base md:text-lg font-medium"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-between rounded-b-xl sticky bottom-0 z-10">
              <button
                className="btn btn-outline border-gray-300 text-gray-600 hover:bg-gray-200 hover:border-gray-400 gap-2 min-w-[120px]"
                disabled={activeQuestionIndex === 0}
                onClick={() => setActiveQuestionIndex((p) => p - 1)}
              >
                ← Önceki
              </button>

              {isLastQuestion ? (
                <button
                  className="btn bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F2C59] font-extrabold gap-2 min-w-[140px] shadow-lg border-none"
                  onClick={handleFinishClick}
                >
                  SINAVI BİTİR 🏁
                </button>
              ) : (
                <button
                  className="btn btn-outline gap-2 min-w-[120px] border-[#0F2C59] text-[#0F2C59] hover:bg-[#0F2C59] hover:text-white"
                  onClick={() => setActiveQuestionIndex((p) => p + 1)}
                >
                  Sonraki →
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}