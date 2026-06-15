import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RichTextRenderer from "../components/RichTextRenderer";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const printStyles = `
  @media print {
    /* Ekrandaki her şeyi (modal dahil) tamamen gizle */
    body > *:not(#print-section) {
      display: none !important;
    }
    
    /* Yazdırılacak alanı en üste al ve görünür yap */
    #print-section {
      display: block !important;
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
    }

    .break-inside-avoid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
    
    img {
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  }

  /* Normal ekran görünümünde bu alanı gizle */
  @media screen {
    #print-section {
      display: none;
    }
  }
`;

  const fixImagePaths = (html) => {
    if (!html) return "";
    // Eğer src içinde tam URL yoksa, başına backend adresini ekler
    const API_BASE = "http://localhost:5000";
    return html.replace(/src="uploads\//g, `src="${API_BASE}/uploads/`);
  };

export default function ExamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSubmissionReport, setSelectedSubmissionReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/exams/analytics/${id}`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setData(result);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);


  const openSubmissionReport = async (submissionId) => {
    try {
      setReportLoading(true);

      const res = await fetch(
        `http://localhost:5000/api/exams/analytics/${id}/submissions/${submissionId}`
      );
      const result = await res.json();

      if (!result.success) {
        throw new Error(result.message || "Öğrenci sınav kağıdı getirilemedi.");
      }

      setSelectedSubmissionReport(result.report);
    } catch (error) {
      console.error(error);
      alert(error.message || "Bir hata oluştu.");
    } finally {
      setReportLoading(false);
    }
  };
  const handlePrint = () => {
    const content = document.getElementById("pdf-content").innerHTML;
    
    // Eğer daha önce oluşturulmuşsa temizle, yoksa yeni oluştur
    let printSection = document.getElementById("print-section");
    if (!printSection) {
      printSection = document.createElement("div");
      printSection.id = "print-section";
      document.body.appendChild(printSection);
    }
    
    printSection.innerHTML = content;
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner text-[#0F2C59] loading-lg"></span>
      </div>
    );
  }

  if (!data) {
    return <div className="p-10 text-center text-error">Veri bulunamadı.</div>;
  }

  const ruleSummary = data?.students?.[0]?.student_answers?.[0];
  const wrongCancelsRight = !!ruleSummary?.wrongCancelsRight;
  const wrongCancelsRatio =
    Number(ruleSummary?.wrongCancelsRatio) === 3 ? 3 : 4;

    return (
    <div className="min-h-screen bg-gray-50 font-sans p-8">
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-circle btn-ghost bg-white shadow-sm text-[#0F2C59]"
        >
          ←
        </button>
        <div>
          <h1 className="text-3xl font-bold text-[#0F2C59]">{data.examTitle}</h1>
          <p className="text-gray-500 text-sm">Detaylı Performans Analizi</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex flex-wrap gap-3">
            <div className="badge badge-lg bg-[#0F2C59] text-white border-none px-4 py-4">
              👥 {data.stats.totalParticipants} Katılımcı
            </div>

            <div className="badge badge-lg bg-blue-50 text-blue-700 border border-blue-200 px-4 py-4">
              ⚠️ Negatif soru puanı aktif
            </div>

            <div className="badge badge-lg bg-amber-50 text-amber-800 border border-amber-200 px-4 py-4">
              {wrongCancelsRight
                ? `➗ ${wrongCancelsRatio} yanlış 1 doğruyu götürür`
                : "➗ Yanlış doğruyu götürmez"}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Katılım"
            value={data.stats.totalParticipants}
            label="Öğrenci"
            color="bg-blue-50 text-blue-700"
            icon="👥"
          />
          <StatCard
            title="Ortalama"
            value={Number(data.stats.average).toFixed(2)}
            label="Puan"
            color="bg-yellow-50 text-yellow-700"
            icon="⚖️"
          />
          <StatCard
            title="En Yüksek"
            value={Number(data.stats.max).toFixed(2)}
            label="Puan"
            color="bg-green-50 text-green-700"
            icon="🏆"
          />
          <StatCard
            title="En Düşük"
            value={Number(data.stats.min).toFixed(2)}
            label="Puan"
            color="bg-red-50 text-red-700"
            icon="📉"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">Öğrenci Sıralaması</h2>
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                Puan Sıralı
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="table table-zebra w-full">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th>#</th>
                    <th>Öğrenci</th>
                    <th>Puan</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {data.students.map((std, idx) => (
                    <tr key={idx}>
                      <th className="text-gray-400">{idx + 1}</th>
                      <td>
                        <div className="font-bold text-[#0F2C59]">{std.username}</div>
                        <div className="text-xs opacity-50">{std.email}</div>
                      </td>
                      <td>
                        <span
                          className={`badge font-bold text-white border-none ${
                            Number(std.score) >= 50
                              ? "bg-green-500"
                              : Number(std.score) > 0
                              ? "bg-amber-500"
                              : "bg-red-600"
                          }`}
                        >
                          {Number(std.score).toFixed(2)}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline border-[#0F2C59] text-[#0F2C59] hover:bg-[#0F2C59] hover:text-white"
                          onClick={() => openSubmissionReport(std.submission_id)}
                          disabled={reportLoading}
                        >
                          {reportLoading ? "Yükleniyor..." : "Kağıdı Gör"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-gray-800 mb-6">Soru Bazlı Başarı</h2>

            <div className="space-y-6">
              {data.questionAnalysis.map((q, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-5 last:border-b-0">
                  <div className="flex justify-between items-start gap-4 mb-2 text-sm">
                    <div className="w-3/4 text-gray-700">
                      <div className="font-semibold mb-1">{idx + 1}. Soru</div>
                      <RichTextRenderer
                        content={fixImagePaths(q.text)}
                        className="exam-rich-content text-sm leading-6 text-gray-700"
                      />
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-bold text-[#0F2C59]">%{q.correctRate}</div>
                      <div className="text-xs text-gray-400">
                        Ort: {Number(q.avgScore || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        q.correctRate > 70
                          ? "bg-green-500"
                          : q.correctRate > 40
                          ? "bg-yellow-400"
                          : "bg-red-500"
                      }`}
                      style={{ width: `${q.correctRate}%` }}
                    ></div>
                  </div>

                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                    <span>✅ {q.correctCount} Tam Doğru</span>
                    <span>🟡 {q.partialCount || 0} Kısmi</span>
                    <span>➖ {q.negativeCount || 0} Negatif</span>
                    <span>❌ {q.wrongCount} Yanlış / Boş</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {selectedSubmissionReport && (
        <dialog className="modal modal-open backdrop-blur-md">
          <div className="modal-box w-11/12 max-w-6xl bg-gray-50 shadow-2xl rounded-2xl p-0 overflow-hidden h-[90vh] flex flex-col">
            <div className="bg-[#0F2C59] text-white p-5 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-bold text-2xl">
                  {selectedSubmissionReport.exam.title}
                </h3>
                <p className="text-sm opacity-80">
                  Öğrenci Kağıdı • {selectedSubmissionReport.student.username}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* EKLEDİĞİMİZ BUTON */}
                <button 
                  id="pdf-download-btn"
                  onClick={handlePrint}
                  className="btn btn-sm bg-emerald-600 hover:bg-emerald-700 border-none text-white font-bold"
                >
                  📥 PDF İndir
                </button>

                <button
                  className="btn btn-circle btn-ghost text-white hover:bg-white/20"
                  onClick={() => setSelectedSubmissionReport(null)}
                >
                  ✕
                </button>
              </div>
            </div>

            <div id="pdf-content" className="p-6 overflow-y-auto flex-1 bg-gray-50">
              <style>{printStyles}</style>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Öğrenci</div>
                    <div className="font-bold text-[#0F2C59]">
                      {selectedSubmissionReport.student.username}
                    </div>
                    <div className="text-gray-500">
                      {selectedSubmissionReport.student.email}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Toplam Puan</div>
                    <div className="text-3xl font-black text-[#0F2C59]">
                      {Number(selectedSubmissionReport.submission.score).toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Başlama</div>
                    <div className="font-medium">
                      {selectedSubmissionReport.submission.started_at
                        ? new Date(
                            selectedSubmissionReport.submission.started_at
                          ).toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Bitiş</div>
                    <div className="font-medium">
                      {selectedSubmissionReport.submission.finished_at
                        ? new Date(
                            selectedSubmissionReport.submission.finished_at
                          ).toLocaleString()
                        : "-"}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">İhlal Sayısı</div>
                    <div className="font-medium">
                      {selectedSubmissionReport.submission.violation_count}
                    </div>
                  </div>

                  <div>
                    <div className="text-gray-500">Durum</div>
                    <div className="font-medium">
                      {selectedSubmissionReport.submission.status}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h4 className="font-bold text-gray-800 mb-4">Özet</h4>
                <div className="flex flex-wrap gap-3 text-sm">
                  <span className="badge badge-success p-3">
                    ✅ {selectedSubmissionReport.summary.correctCount} Tam Doğru
                  </span>
                  <span className="badge badge-warning p-3">
                    🟡 {selectedSubmissionReport.summary.partialCount} Kısmi
                  </span>
                  <span className="badge badge-error p-3">
                    ➖ {selectedSubmissionReport.summary.negativeCount} Negatif
                  </span>
                  <span className="badge p-3">
                    ❌ {selectedSubmissionReport.summary.wrongCount} Yanlış / Boş
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                {selectedSubmissionReport.answers.map((ans, idx) => {
                  const scoreEarned = Number(ans.scoreEarned || 0);
                  const isNegative = scoreEarned < 0;

                  return (
                    <div key={idx} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 break-inside-avoid">
                      <div className="flex justify-between items-start gap-4 mb-4">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-500 mb-2">
                            {idx + 1}. Soru
                          </div>
                          <RichTextRenderer
                            content={fixImagePaths(ans.questionText)}
                            className="exam-rich-content text-lg font-bold text-gray-800 leading-8"
                          />
                        </div>

                        <div
                          className={`badge font-bold p-3 border-none text-white shrink-0 ${
                            ans.isCorrect
                              ? "bg-emerald-600"
                              : ans.isPartial
                              ? "bg-amber-500"
                              : isNegative
                              ? "bg-red-700"
                              : "bg-gray-400"
                          }`}
                        >
                          {scoreEarned.toFixed(2)} Puan
                        </div>
                      </div>

                      <div className="mb-4 text-sm text-gray-600">
                        <span className="mr-4">
                          Doğru İşaretleme: {ans.correctHits ?? 0}
                        </span>
                        <span>Yanlış İşaretleme: {ans.wrongHits ?? 0}</span>
                      </div>

                      <div>
                        <h5 className="font-bold text-gray-500 text-sm uppercase mb-3">
                          İşaretlenen Cevaplar
                        </h5>

                        {ans.userAnswer?.length > 0 ? (
                          <ul className="space-y-2">
                            {ans.userAnswer.map((item, i) => (
                              <li
                                key={i}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                <RichTextRenderer
                                  content={fixImagePaths(item)}
                                  className="exam-rich-content text-base text-gray-700"
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-gray-400 italic">
                            Bu soru boş bırakılmış.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}

function StatCard({ title, value, label, color, icon }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">
          {title}
        </div>
        <div className="text-3xl font-extrabold text-gray-800 mt-1">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}
      >
        {icon}
      </div>
    </div>
  );
}