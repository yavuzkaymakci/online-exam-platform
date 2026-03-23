import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function StudentDashboard() {
  const [code, setCode] = useState("");
  const [examHistory, setExamHistory] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  
  // Analiz Modalı İçin State
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    if (user?.user_id) {
      fetch(`http://localhost:5000/api/exams/history/${user.user_id}`)
        .then(res => res.json())
        .then(data => {
            if(data.success) setExamHistory(data.history);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const handleJoinExam = async () => {
    if(!code) return alert("Lütfen bir kod girin");
    try {
        const res = await fetch(`http://localhost:5000/api/exams/access/${code}`);
        const data = await res.json();
        if(data.success) navigate(`/exam-intro/${data.exam.exam_id}`);
        else alert("Geçersiz Sınav Kodu!");
    } catch (err) { alert("Bağlantı hatası"); }
  };

  const openAnalysisModal = (exam) => {
      let parsedAnswers = exam.student_answers;
      if (typeof parsedAnswers === 'string') {
          try { parsedAnswers = JSON.parse(parsedAnswers); } catch(e) { parsedAnswers = []; }
      }
      setSelectedExam({ ...exam, student_answers: parsedAnswers });
      setActiveQuestionIndex(0); 
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* NAVBAR */}
      <div className="navbar bg-[#0F2C59] text-white shadow-lg px-8">
        <div className="flex-1">
            <div className="flex items-center gap-4">
                <img src="/amblem.jpg" alt="YTÜ Logo" className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md object-contain bg-white" />
                <span className="text-xl font-bold tracking-wide">Öğrenci Paneli</span>
            </div>
        </div>
        <div className="flex-none gap-4">
            <span className="hidden md:inline text-sm opacity-90">Merhaba, {user?.username}</span>
            <button className="btn btn-sm bg-white/10 border-none text-white hover:bg-white/20" onClick={logout}>Çıkış</button>
        </div>
      </div>

      <div className="container mx-auto p-6 md:p-12 space-y-8">
          
          {/* SINAVA KATIL */}
          <div className="card w-full bg-white shadow-xl overflow-hidden border-l-8 border-[#0F2C59]">
            <div className="card-body md:flex-row items-center gap-8 p-10">
                <div className="flex-1">
                    <h2 className="text-3xl font-bold text-[#0F2C59] mb-2">Yeni Bir Sınava Katıl</h2>
                    <p className="text-gray-500">Eğitmeninizden aldığınız 6 haneli erişim kodunu girerek sınava başlayabilirsiniz.</p>
                </div>
                <div className="flex-none w-full md:w-auto">
                    <div className="join w-full shadow-md">
                        <input type="text" placeholder="KOD GİRİNİZ" 
                            className="input input-bordered input-lg join-item w-full md:w-64 bg-gray-50 text-center font-bold tracking-[0.5em] text-[#0F2C59] focus:outline-none"
                            value={code} onChange={(e) => setCode(e.target.value.toUpperCase())}
                        />
                        <button className="btn btn-lg join-item bg-[#D4AF37] border-none text-[#0F2C59] hover:bg-[#b5952f] font-bold" onClick={handleJoinExam}>SINAVI BUL</button>
                    </div>
                </div>
            </div>
          </div>

          {/* GEÇMİŞ SINAVLAR */}
          <div>
            <h3 className="text-2xl font-bold text-[#0F2C59] mb-6 flex items-center gap-2">
                <span className="w-2 h-8 bg-[#D4AF37] rounded-full"></span>
                Sınav Geçmişim
            </h3>
            
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
                <table className="table w-full">
                    <thead className="bg-gray-100 text-gray-600 uppercase text-xs">
                        <tr>
                            <th className="p-4">Sınav Adı</th>
                            <th>Tarih</th>
                            <th>Puan</th>
                            <th className="text-right">Detay</th>
                        </tr>
                    </thead>
                    <tbody>
                        {examHistory.length === 0 ? (
                            <tr><td colSpan="4" className="text-center p-8 text-gray-400">Henüz tamamlanmış sınavınız yok.</td></tr>
                        ) : (
                            examHistory.map((exam) => (
                                <tr key={exam.submission_id} className="hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-none">
                                    <td className="p-4">
                                        <div className="font-bold text-[#0F2C59]">{exam.title}</div>
                                        <div className="text-xs text-gray-400 bg-gray-100 inline-block px-2 rounded mt-1">{exam.access_code}</div>
                                    </td>
                                    <td className="text-gray-600">{new Date(exam.finished_at).toLocaleDateString()}</td>
                                    <td>
                                        {/* RENK GÜNCELLEMESİ: Emerald ve Rose kullanıldı */}
                                        <div className={`badge badge-lg font-bold text-white border-none ${exam.score >= 50 ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                                            {Number(exam.score).toFixed(0)}
                                        </div>
                                    </td>
                                    <td className="text-right">
                                        <button className="btn btn-sm btn-outline btn-primary" onClick={() => openAnalysisModal(exam)}>
                                            İncele 👁️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
          </div>
      </div>

      {/* --- GELİŞMİŞ ANALİZ MODALI --- */}
      {selectedExam && (
        <dialog className="modal modal-open backdrop-blur-md transition-all">
            <div className="modal-box w-11/12 max-w-7xl bg-gray-50 shadow-2xl rounded-2xl p-0 overflow-hidden h-[90vh] flex flex-col">
                
                {/* 1. Modal Header */}
                <div className="bg-[#0F2C59] text-white p-5 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="font-bold text-2xl">{selectedExam.title}</h3>
                        <p className="text-sm opacity-80">Sonuç Analizi</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <div className="text-xs opacity-70 uppercase">Toplam Puan</div>
                            {/* RENK GÜNCELLEMESİ: Emerald-400 ve Rose-400 (Koyu zemin üstünde okunur pastel tonlar) */}
                            <div className={`text-3xl font-black ${selectedExam.score >= 50 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {Number(selectedExam.score).toFixed(1)}
                            </div>
                        </div>
                        <button className="btn btn-circle btn-ghost text-white hover:bg-white/20" onClick={() => setSelectedExam(null)}>✕</button>
                    </div>
                </div>
                
                {/* 2. Modal Body */}
                <div className="flex flex-1 overflow-hidden">
                    
                    {/* SOL PANEL: Soru Haritası */}
                    <div className="w-1/4 bg-white border-r border-gray-200 p-6 overflow-y-auto hidden md:block">
                        <h4 className="font-bold text-gray-700 mb-4 border-b pb-2">Soru Haritası</h4>
                        <div className="grid grid-cols-4 gap-2">
                            {selectedExam.student_answers?.map((ans, idx) => {
                                const isCorrect = ans.isCorrect;
                                const isPartial = !isCorrect && ans.scoreEarned > 0;
                                const isActive = idx === activeQuestionIndex;
                                
                                return (
                                    <button 
                                        key={idx}
                                        onClick={() => setActiveQuestionIndex(idx)}
                                        className={`
                                            w-full aspect-square rounded-lg font-bold text-sm transition-all border-2
                                            ${isActive ? 'ring-2 ring-[#0F2C59] ring-offset-2 scale-105 z-10' : ''}
                                            ${isCorrect 
                                                // RENK GÜNCELLEMESİ: Emerald-100/700 (Koyu yeşil)
                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                                                : isPartial 
                                                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                                    // RENK GÜNCELLEMESİ: Rose-100/700 (Koyu kırmızı/gül)
                                                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'}
                                        `}
                                    >
                                        {idx + 1}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-6 space-y-2 text-xs text-gray-500">
                            {/* Lejant Renkleri */}
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded"></div> Tam Doğru</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-amber-400 rounded"></div> Kısmi Puan</div>
                            <div className="flex items-center gap-2"><div className="w-3 h-3 bg-rose-500 rounded"></div> Yanlış / Boş</div>
                        </div>
                    </div>

                    {/* SAĞ PANEL: Soru Detayı */}
                    <div className="flex-1 p-8 overflow-y-auto bg-gray-50 flex flex-col items-center">
                        {(() => {
                            const currentAns = selectedExam.student_answers[activeQuestionIndex];
                            if (!currentAns) return <div>Veri yok</div>;

                            const userAnswers = currentAns.userAnswer || []; 
                            
                            return (
                                <div className="w-full max-w-3xl">
                                    {/* Soru Kartı */}
                                    <div className="card bg-white shadow-sm border border-gray-200 mb-6">
                                        <div className="card-body">
                                            <div className="flex justify-between items-start mb-4">
                                                <h2 className="text-xl font-bold text-gray-800 flex gap-3">
                                                    <span className="flex-none bg-[#0F2C59] text-white w-8 h-8 flex items-center justify-center rounded-lg text-sm shadow-md">
                                                        {activeQuestionIndex + 1}
                                                    </span>
                                                    {currentAns.questionText}
                                                </h2>
                                                {/* Puan Rozeti */}
                                                <div className={`badge font-bold p-3 border-none text-white ${currentAns.isCorrect ? 'bg-emerald-600' : 'bg-gray-400'}`}>
                                                    {currentAns.scoreEarned} Puan
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sonuç Kartı (Alert yerine daha şık bir div) */}
                                    <div className={`p-4 rounded-xl border-l-8 shadow-sm mb-6 flex items-center gap-3
                                        ${currentAns.isCorrect 
                                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900' 
                                            : (currentAns.scoreEarned > 0 
                                                ? 'bg-amber-50 border-amber-500 text-amber-900' 
                                                : 'bg-rose-50 border-rose-600 text-rose-900')
                                        }`}
                                    >
                                        {currentAns.isCorrect 
                                            ? <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                <span className="font-bold">Tebrikler! Tam puan aldınız.</span>
                                              </>
                                            : (currentAns.scoreEarned > 0 
                                                ? <><span className="text-2xl">⚠️</span> <span className="font-bold">Kısmi puan aldınız. Eksik işaretleme olabilir.</span></>
                                                : <><span className="text-2xl">❌</span> <span className="font-bold">Yanlış cevap veya boş bırakıldı.</span></>
                                              )
                                        }
                                    </div>

                                    {/* Cevap Analizi */}
                                    <div className="card bg-white shadow-sm border border-gray-200">
                                        <div className="card-body">
                                            <h3 className="font-bold text-gray-500 text-sm uppercase mb-4 border-b pb-2">Verdiğiniz Cevaplar</h3>
                                            
                                            {userAnswers.length > 0 ? (
                                                <ul className="space-y-2">
                                                    {userAnswers.map((ansText, i) => (
                                                        <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700">
                                                            <div className="w-2 h-2 rounded-full bg-[#0F2C59]"></div>
                                                            <span className="font-medium">{ansText}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="text-gray-400 italic bg-gray-50 p-4 rounded-lg text-center">Bu soruyu boş bıraktınız.</div>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* 3. Modal Footer */}
                <div className="p-4 bg-white border-t border-gray-200 flex justify-between shrink-0">
                    <button 
                        className="btn btn-outline border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 gap-2"
                        disabled={activeQuestionIndex === 0}
                        onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                    >
                        ← Önceki Soru
                    </button>

                    <div className="text-sm font-bold text-gray-400 self-center">
                        {activeQuestionIndex + 1} / {selectedExam.student_answers.length}
                    </div>

                    <button 
                        className="btn btn-outline gap-2 border-[#0F2C59] text-[#0F2C59] hover:bg-[#0F2C59] hover:text-white"
                        disabled={activeQuestionIndex === selectedExam.student_answers.length - 1}
                        onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                    >
                        Sonraki Soru →
                    </button>
                </div>

            </div>
        </dialog>
      )}
    </div>
  );
}