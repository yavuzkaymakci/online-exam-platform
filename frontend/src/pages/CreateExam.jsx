import { useState } from "react";
import { createExam } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreateExam() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State'ler
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0); 
  const [createdExamCode, setCreatedExamCode] = useState(null);
  const [questionToDelete, setQuestionToDelete] = useState(null);

  // --- SINAV DATASI ---
  const [examInfo, setExamInfo] = useState({
    instructor_id: user?.user_id || 1, 
    title: "",
    description: "",
    duration_minutes: 60,
  });

  const [rules, setRules] = useState({
    scoring_type: "partial", 
    strict_mode: false, 
    wrong_cancels_right: false, 
    browser_lock: true, 
    violation_limit: 3 
  });

  const [questions, setQuestions] = useState([
    {
      question_text: "",
      question_image: "", 
      points: 10, 
      options: [{ option_text: "", is_correct: false }, { option_text: "", is_correct: false }],
    },
  ]);

  // --- YARDIMCI METODLAR ---
  
  const addQuestion = () => {
    const newQuestions = [...questions, { question_text: "", question_image: "", points: 10, options: [{ option_text: "", is_correct: false }, { option_text: "", is_correct: false }] }];
    setQuestions(newQuestions);
    setActiveQuestionIndex(newQuestions.length - 1); 
  };

  const handleDeleteClick = (index) => {
    if (questions.length === 1) return alert("En az bir soru olmalıdır, silemezsiniz.");
    setQuestionToDelete(index); 
    document.getElementById('delete_confirm_modal').showModal(); 
  };

  const confirmDeleteQuestion = () => {
    if (questionToDelete === null) return;

    const n = [...questions]; 
    n.splice(questionToDelete, 1); 
    setQuestions(n);

    if (questionToDelete === questions.length - 1 && questionToDelete > 0) {
        setActiveQuestionIndex(questionToDelete - 1);
    } else if (activeQuestionIndex >= n.length) {
        setActiveQuestionIndex(n.length - 1);
    }
    
    setQuestionToDelete(null); 
    document.getElementById('delete_confirm_modal').close(); // Modalı kapat
  };

  const cancelDelete = () => {
    setQuestionToDelete(null);
    document.getElementById('delete_confirm_modal').close(); // Modalı kapat
  };

  const addOption = (qIndex) => { const n = [...questions]; n[qIndex].options.push({ option_text: "", is_correct: false }); setQuestions(n); };
  
  const handleQuestionChange = (f, v) => { 
      const n = [...questions]; 
      n[activeQuestionIndex][f] = v; 
      setQuestions(n); 
  };

  const handleOptionChange = (oi, f, v) => { 
      const n = [...questions]; 
      n[activeQuestionIndex].options[oi][f] = v; 
      setQuestions(n); 
  };

  const removeOption = (qIndex, oIndex) => {
    const n = [...questions];
    if (n[qIndex].options.length <= 2) return alert("En az 2 şık olmalıdır.");
    n[qIndex].options.splice(oIndex, 1);
    setQuestions(n);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const n = [...questions];
        n[activeQuestionIndex].question_image = reader.result; 
        setQuestions(n);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    const n = [...questions];
    n[activeQuestionIndex].question_image = "";
    setQuestions(n);
  };

  const totalPoints = questions.reduce((acc, curr) => acc + (parseInt(curr.points) || 0), 0);

  const handleCancelClick = () => {
    document.getElementById('cancel_confirm_modal').showModal();
  };

  const confirmCancel = () => {
    navigate(-1); 
  };

  const handlePublishClick = () => {
    if (!examInfo.title) return alert("Lütfen sınav başlığı giriniz.");
    
    for (let i = 0; i < questions.length; i++) {
        if (!questions[i].question_text && !questions[i].question_image) return alert(`Soru ${i+1} için metin veya görsel girmediniz.`);
        if (questions[i].options.length < 2) return alert(`Soru ${i+1} için en az 2 seçenek girmelisiniz.`);
        if (!questions[i].options.some(o => o.is_correct)) return alert(`Soru ${i+1} için doğru cevabı işaretlemediniz.`);
    }

    document.getElementById('publish_confirm_modal').showModal();
  };

  const confirmPublish = async () => {
    const payload = { ...examInfo, instructor_id: user?.user_id, rules, questions };
    
    try {
        const result = await createExam(payload);
        if (result.success) {
            setCreatedExamCode(result.accessCode); 
            document.getElementById('success_modal').showModal(); 
        }
    } catch (err) {
        alert("Hata: " + err.message);
    }
  };

  const currentQ = questions[activeQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-20">
      
      {/* NAVBAR */}
      <div className="navbar bg-[#0F2C59] text-white px-8 shadow-lg sticky top-0 z-50">
        <div className="flex-1">
            <div className="flex items-center gap-4">
                <img src="/amblem.jpg" alt="YTÜ Logo" className="w-10 h-10 rounded-full border-2 border-white/20 bg-white object-contain" />
                <div>
                    <span className="text-xl font-bold tracking-wide block leading-none">Sınav Oluşturucu</span>
                    <span className={`text-xs font-bold mt-1 block ${totalPoints === 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                        Toplam Puan: {totalPoints} / 100
                    </span>
                </div>
            </div>
        </div>
        <div className="flex-none gap-4">
            <button className="btn btn-sm btn-ghost text-white/80 hover:text-white hover:bg-white/10" onClick={handleCancelClick}>Vazgeç ve Çık</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* SUCCESS MODAL */}
        <dialog id="success_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
          <div className="modal-box text-center shadow-2xl rounded-2xl p-10 border-t-8 border-[#0F2C59]">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl shadow-inner">🎉</div>
            <h3 className="font-bold text-3xl text-[#0F2C59] mb-2">Sınav Oluşturuldu!</h3>
            <p className="py-2 text-gray-600">Öğrencilerinizle paylaşmanız gereken erişim kodu:</p>
            <div className="bg-gray-100 p-6 rounded-xl my-6 border-2 border-dashed border-gray-400">
              <span className="text-5xl font-black tracking-[0.2em] text-[#0F2C59] font-mono">{createdExamCode}</span>
            </div>
            <div className="modal-action justify-center w-full">
              <button className="btn bg-[#0F2C59] text-white hover:bg-[#1a3b6e] w-full btn-lg" onClick={() => navigate('/instructor-dashboard')}>Panele Dön</button>
            </div>
          </div>
        </dialog>

        {/* --- DÜZELTİLEN BÖLÜM: SİLME ONAY MODALI --- */}
        <dialog id="delete_confirm_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
            <div className="modal-box border-t-8 border-red-500">
                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                    <span className="text-red-500 text-3xl">⚠️</span> Soruyu Sil?
                </h3>
                <p className="py-4 text-gray-600 text-lg">
                    <span className="font-bold text-gray-900">{questionToDelete + 1}. Soruyu</span> silmek üzeresiniz. Bu işlem geri alınamaz.
                </p>
                {/* FORM YAPISI KALDIRILDI, DÜZ DIV EKLENDİ */}
                <div className="modal-action flex gap-3 w-full">
                    <button className="btn btn-ghost flex-1 text-gray-600 bg-gray-100 hover:bg-gray-200" onClick={cancelDelete}>
                        Vazgeç
                    </button>
                    <button className="btn btn-error flex-1 font-bold text-white bg-red-600 hover:bg-red-700 border-none" onClick={confirmDeleteQuestion}>
                        Evet, Sil
                    </button>
                </div>
            </div>
        </dialog>

        {/* PUBLISH CONFIRM MODAL */}
        <dialog id="publish_confirm_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
            <div className="modal-box border-t-8 border-[#D4AF37]">
                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                    🚀 Sınavı Yayınla?
                </h3>
                <p className="py-4 text-gray-600">
                    Sınav oluşturulacak ve öğrencilerin erişimine açılacaktır. <br/>
                    <span className="text-sm text-gray-400 mt-2 block">Toplam {questions.length} soru, {totalPoints} puan.</span>
                </p>
                <div className="modal-action flex gap-3 w-full">
                    <form method="dialog" className="w-full flex gap-3">
                        <button className="btn btn-ghost flex-1 text-gray-600 bg-gray-100">Kontrol Et</button>
                        <button className="btn bg-[#0F2C59] text-white hover:bg-[#1a3b6e] flex-1 font-bold" onClick={confirmPublish}>Evet, Yayınla</button>
                    </form>
                </div>
            </div>
        </dialog>

        {/* CANCEL CONFIRM MODAL */}
        <dialog id="cancel_confirm_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
            <div className="modal-box border-t-8 border-gray-500">
                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                    🚪 Çıkmak İstiyor musunuz?
                </h3>
                <p className="py-4 text-gray-600 text-lg">
                    Kaydedilmemiş tüm değişiklikleriniz kaybolacak.
                </p>
                <div className="modal-action flex gap-3 w-full">
                    <form method="dialog" className="w-full flex gap-3">
                        <button className="btn btn-ghost flex-1 text-gray-700 bg-gray-100">Hayır, Kal</button>
                        <button className="btn btn-error btn-outline flex-1 font-bold" onClick={confirmCancel}>Evet, Çık</button>
                    </form>
                </div>
            </div>
        </dialog>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

            {/* --- SOL KOLON --- */}
            <div className="lg:col-span-3 space-y-6">
                
                {/* Sınav Ayarları Kartı (Aynı) */}
                <div className="card bg-white shadow-md border border-gray-300">
                    <div className="bg-gray-100 p-3 border-b border-gray-300 font-bold text-[#0F2C59] flex items-center gap-2">
                        <span>⚙️</span> Sınav Ayarları
                    </div>
                    <div className="card-body p-5 gap-4">
                        <div className="form-control">
                            <label className="label-text font-bold text-gray-700 mb-1">Sınav Başlığı</label>
                            <input type="text" className="input input-bordered w-full bg-gray-50 border-gray-300 focus:border-[#0F2C59] focus:bg-white transition-all text-gray-800 font-medium" 
                                value={examInfo.title} onChange={(e) => setExamInfo({...examInfo, title: e.target.value})} placeholder="Örn: Vize Sınavı" />
                        </div>
                        <div className="form-control">
                            <label className="label-text font-bold text-gray-700 mb-1">Süre (Dakika)</label>
                            <input type="number" className="input input-bordered w-full bg-gray-50 border-gray-300 focus:border-[#0F2C59] font-mono font-bold text-lg" 
                                value={examInfo.duration_minutes} onChange={(e) => setExamInfo({...examInfo, duration_minutes: parseInt(e.target.value)})} placeholder="60" />
                        </div>
                         <div className="form-control bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <label className="label cursor-pointer justify-between">
                                <span className="label-text font-bold text-gray-700 text-sm">Tarayıcı Kilidi</span>
                                <input type="checkbox" className="toggle toggle-success toggle-sm" checked={rules.browser_lock} onChange={(e) => setRules({...rules, browser_lock: e.target.checked})} />
                            </label>
                        </div>
                    </div>
                </div>

                {/* Soru Listesi Kartı (Aynı) */}
                <div className="card bg-white shadow-md border border-gray-300">
                    <div className="bg-gray-100 p-3 border-b border-gray-300 font-bold text-[#0F2C59] flex justify-between items-center">
                        <span>📑 Soru Listesi</span>
                        <span className="badge bg-[#0F2C59] text-white border-none">{questions.length}</span>
                    </div>
                    <div className="card-body p-4">
                        <div className="grid grid-cols-4 gap-2">
                            {questions.map((_, idx) => (
                                <button key={idx} onClick={() => setActiveQuestionIndex(idx)}
                                    className={`btn btn-sm font-bold border-2 ${activeQuestionIndex === idx 
                                        ? 'bg-[#0F2C59] text-white border-[#0F2C59] hover:bg-[#1a3b6e]' 
                                        : 'bg-white text-gray-600 border-gray-300 hover:border-[#0F2C59] hover:text-[#0F2C59]'}`}>
                                    {idx + 1}
                                </button>
                            ))}
                            <button onClick={addQuestion} className="btn btn-sm btn-outline border-dashed border-2 border-green-500 text-green-600 hover:bg-green-50 hover:border-green-600 hover:text-green-700 font-bold" title="Yeni Soru Ekle">+</button>
                        </div>
                    </div>
                </div>

                <button 
                    className="btn bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F2C59] font-extrabold w-full shadow-lg h-14 text-lg border-none transform hover:-translate-y-1 transition-all" 
                    onClick={handlePublishClick}
                >
                    SINAVI YAYINLA 🚀
                </button>
            </div>

            {/* --- SAĞ KOLON (EDİTÖR) --- */}
            <div className="lg:col-span-9">
                <div className="card bg-white shadow-lg border border-gray-300 min-h-[650px]">
                    <div className="bg-gray-50 p-5 border-b border-gray-300 flex justify-between items-center rounded-t-xl">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-[#0F2C59] text-white flex items-center justify-center font-bold text-2xl shadow-md border-4 border-white ring-1 ring-gray-200">
                                {activeQuestionIndex + 1}
                            </div>
                            <div>
                                <h2 className="font-bold text-gray-800 text-xl">Soru Düzenle</h2>
                                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">İçerik ve Cevaplar</span>
                            </div>
                        </div>
                        <button onClick={() => handleDeleteClick(activeQuestionIndex)} className="btn btn-sm btn-ghost text-red-500 hover:bg-red-50 font-bold gap-2 border border-transparent hover:border-red-200">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            Sil
                        </button>
                    </div>

                    <div className="card-body p-8">
                        {/* Soru Metni & Puan */}
                        <div className="flex flex-col gap-2 mb-8">
                            <div className="flex justify-between items-end mb-1">
                                <label className="font-bold text-gray-700">Soru Metni</label>
                                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-sm">
                                    <span className="text-xs font-bold text-[#0F2C59] uppercase">Puan Değeri:</span>
                                    <input type="number" className="input input-xs w-16 text-center font-black text-lg text-[#0F2C59] bg-transparent focus:outline-none border-b-2 border-blue-300 focus:border-[#0F2C59] rounded-none px-0 h-8" 
                                        value={currentQ.points} onChange={(e) => handleQuestionChange('points', e.target.value)} />
                                </div>
                            </div>
                            
                            <textarea 
                                placeholder="Sorunun detaylı metnini buraya giriniz..." 
                                className="textarea textarea-bordered w-full h-36 text-lg leading-relaxed bg-gray-50 border-gray-300 focus:border-[#0F2C59] focus:bg-white focus:ring-1 focus:ring-[#0F2C59] shadow-inner resize-y transition-all text-gray-800" 
                                value={currentQ.question_text} onChange={(e) => handleQuestionChange('question_text', e.target.value)} 
                            />
                        </div>

                        {/* Resim Yükleme */}
                        <div className="mb-10">
                            {!currentQ.question_image ? (
                                <div className="border-2 border-dashed border-gray-300 rounded-2xl p-8 flex flex-col items-center justify-center gap-3 text-gray-400 hover:border-[#0F2C59] hover:bg-blue-50/30 hover:text-[#0F2C59] transition-all cursor-pointer relative bg-gray-50 group">
                                    <input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageUpload} />
                                    <div className="p-4 bg-white rounded-full shadow-sm border border-gray-200 group-hover:scale-110 transition-transform">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                    </div>
                                    <span className="font-bold text-sm">Görsel Eklemek İçin Tıklayın</span>
                                </div>
                            ) : (
                                <div className="relative border-2 border-gray-200 rounded-2xl overflow-hidden bg-gray-100 flex justify-center py-6 group shadow-inner">
                                    <img src={currentQ.question_image} alt="Soru" className="max-h-[350px] object-contain shadow-lg rounded-lg bg-white" />
                                    <button onClick={removeImage} className="absolute top-4 right-4 btn btn-sm btn-circle btn-error text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity transform hover:scale-110">✕</button>
                                </div>
                            )}
                        </div>

                        {/* Şıklar */}
                        <div className="space-y-5 bg-white rounded-xl">
                            {/* ... Şıklar listesi (aynı) ... */}
                            {currentQ.options.map((opt, oIndex) => {
                                const letter = String.fromCharCode(65 + oIndex); 
                                return (
                                    <div key={oIndex} className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all shadow-sm group ${opt.is_correct ? 'border-green-500 bg-green-50/50 shadow-green-100' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}>
                                        <div className={`w-10 h-10 flex-none flex items-center justify-center rounded-lg font-black text-lg shadow-sm ${opt.is_correct ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 border border-gray-200'}`}>
                                            {letter}
                                        </div>
                                        <div className="flex-1">
                                            <input type="text" placeholder={`Seçenek ${letter} metni`} className={`input input-ghost w-full focus:bg-white h-12 font-medium text-gray-800 placeholder-gray-400 text-lg border-transparent focus:border-transparent ${opt.is_correct ? 'font-bold text-green-900' : ''}`}
                                                value={opt.option_text} onChange={(e) => handleOptionChange(oIndex, 'option_text', e.target.value)} />
                                        </div>
                                        <div className="tooltip" data-tip={opt.is_correct ? "Doğru Cevap" : "Doğru Olarak İşaretle"}>
                                            <label className="cursor-pointer label p-2 hover:bg-black/5 rounded-full transition-colors">
                                                <input type="checkbox" className={`checkbox checkbox-lg border-2 ${opt.is_correct ? 'checkbox-success' : 'checkbox-primary border-gray-300'}`} 
                                                    checked={opt.is_correct} onChange={(e) => handleOptionChange(oIndex, 'is_correct', e.target.checked)} />
                                            </label>
                                        </div>
                                        <button onClick={() => removeOption(activeQuestionIndex, oIndex)} className="btn btn-sm btn-circle btn-ghost text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                );
                            })}
                            <button onClick={() => addOption(activeQuestionIndex)} className="btn btn-block btn-outline border-dashed border-2 border-gray-300 text-gray-500 hover:border-[#0F2C59] hover:text-[#0F2C59] hover:bg-blue-50 font-bold h-12 mt-4 gap-2">
                                + Yeni Seçenek Ekle
                            </button>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-300 flex justify-between rounded-b-xl items-center sticky bottom-0 z-10">
                        <button className="btn btn-outline border-gray-300 text-gray-600 hover:bg-gray-200 hover:border-gray-400 gap-2 min-w-[120px]" 
                            disabled={activeQuestionIndex === 0} onClick={() => setActiveQuestionIndex(p => p - 1)}>
                            ← Önceki Soru
                        </button>
                        <div className="text-sm font-bold text-gray-400">
                            {activeQuestionIndex + 1} / {questions.length}
                        </div>
                        {/* GÜNCELLEME: Yeni Soru Ekle Butonu Beyaz Text Eklendi */}
                        {activeQuestionIndex === questions.length - 1 ? (
                            <button className="btn btn-primary gap-2 min-w-[140px] shadow-lg bg-[#0F2C59] border-none hover:bg-[#1a3b6e] text-white" onClick={addQuestion}>
                                Yeni Soru Ekle +
                            </button>
                        ) : (
                             <button className="btn btn-outline gap-2 min-w-[120px] border-[#0F2C59] text-[#0F2C59] hover:bg-[#0F2C59] hover:text-white" onClick={() => setActiveQuestionIndex(p => p + 1)}>
                                Sonraki Soru →
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}