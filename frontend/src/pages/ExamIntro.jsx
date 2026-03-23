import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ExamIntro() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    fetch(`http://localhost:5000/api/exams/${id}`)
      .then(res => res.json())
      .then(data => {
        if(data.success) setExam(data.exam);
        setLoading(false);
      })
      .catch(err => {
          console.error(err);
          setLoading(false);
      });
  }, [id]);

  // --- MODAL YÖNETİMİ ---
  const openStartModal = () => document.getElementById('start_confirm_modal').showModal();
  const openCancelModal = () => document.getElementById('cancel_confirm_modal').showModal();

  const handleCancel = () => {
    navigate('/student-dashboard');
  };

  // --- SINAVI BAŞLATMA (API İSTEĞİ) ---
  const confirmStartExam = async () => {
    if (!user) return alert("Oturum hatası, lütfen tekrar giriş yapın.");

    setIsStarting(true); // Butonu disable et

    try {
        const res = await fetch('http://localhost:5000/api/exams/start', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                user_id: user.user_id, 
                exam_id: id 
            })
        });

        const data = await res.json();

        if (data.success) {
            // Başarılı ise yönlendir
            navigate(`/exam-active/${id}`);
        } else {
            // Hata (örn: Zaten çözüldü)
            alert(data.message);
            navigate('/student-dashboard');
        }

    } catch (err) {
        console.error(err);
        alert("Sunucuya bağlanılamadı.");
    } finally {
        setIsStarting(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner text-[#0F2C59] loading-lg"></span></div>;
  if (!exam) return <div className="p-10 text-center text-error font-bold text-xl">Sınav Bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      
      {/* NAVBAR */}
      <div className="navbar bg-[#0F2C59] text-white shadow-lg px-8">
        <div className="flex-1">
            <div className="flex items-center gap-4">
                <img src="/amblem.jpg" alt="YTÜ Logo" className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md object-contain bg-white" />
                <span className="text-xl font-bold tracking-wide">Sınav Giriş Ekranı</span>
            </div>
        </div>
        <div className="flex-none gap-4">
            <span className="hidden md:inline text-sm opacity-90">{user?.username}</span>
            <button className="btn btn-sm bg-white/10 border-none text-white hover:bg-white/20" onClick={logout}>Çıkış</button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-12 flex flex-col items-center justify-center min-h-[80vh]">
        
        {/* --- BAŞLATMA ONAY MODALI --- */}
        <dialog id="start_confirm_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
            <div className="modal-box border-t-8 border-[#D4AF37]">
                <h3 className="font-bold text-2xl text-[#0F2C59] flex items-center gap-3">
                    🚀 Hazır mısınız?
                </h3>
                <p className="py-4 text-gray-600 text-lg">
                    Sınavı başlattığınız anda <strong>süre işlemeye başlayacaktır</strong>. 
                    Bu işlem geri alınamaz ve tarayıcıdan çıkarsanız hakkınız yanabilir.
                </p>
                <div className="modal-action flex gap-3 w-full">
                    <form method="dialog" className="w-full flex gap-3">
                        <button className="btn btn-ghost flex-1 text-gray-600 bg-gray-100 hover:bg-gray-200">
                            Henüz Değil
                        </button>
                        <button 
                            type="button" 
                            className="btn bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F2C59] font-extrabold flex-1 border-none" 
                            onClick={confirmStartExam}
                            disabled={isStarting}
                        >
                            {isStarting ? <span className="loading loading-spinner"></span> : "BAŞLAT"}
                        </button>
                    </form>
                </div>
            </div>
        </dialog>

        {/* --- VAZGEÇME ONAY MODALI --- */}
        <dialog id="cancel_confirm_modal" className="modal modal-bottom sm:modal-middle backdrop-blur-md">
            <div className="modal-box border-t-8 border-gray-500">
                <h3 className="font-bold text-2xl text-gray-800 flex items-center gap-3">
                    🚪 Ayrılmak İstiyor musunuz?
                </h3>
                <p className="py-4 text-gray-600">
                    Sınava girmeden ana sayfaya dönmek üzeresiniz. Sınav hakkınız saklı kalacaktır.
                </p>
                <div className="modal-action flex gap-3 w-full">
                    <form method="dialog" className="w-full flex gap-3">
                        <button className="btn btn-ghost flex-1 text-gray-700 bg-gray-100">Kal</button>
                        <button className="btn btn-outline border-gray-400 text-gray-600 hover:bg-gray-200 hover:text-gray-800 flex-1" onClick={handleCancel}>Panele Dön</button>
                    </form>
                </div>
            </div>
        </dialog>


        {/* --- ANA KART --- */}
        <div className="card w-full bg-white shadow-2xl overflow-hidden border border-gray-200 rounded-2xl">
            
            {/* Kart Başlığı */}
            <div className="bg-[#0F2C59] p-8 text-center text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                
                <h1 className="text-4xl font-bold mb-2 tracking-wide relative z-10">{exam.title}</h1>
                <p className="opacity-80 relative z-10">{exam.description || "Lütfen aşağıdaki kuralları dikkatlice okuyunuz."}</p>
                
                <div className="flex justify-center gap-4 mt-6 relative z-10">
                    <div className="badge bg-white/20 text-white border-none p-4 gap-2">
                        ⏱️ {exam.duration_minutes} Dakika
                    </div>
                    <div className="badge bg-white/20 text-white border-none p-4 gap-2">
                        📝 Tek Oturum
                    </div>
                </div>
            </div>

            <div className="card-body p-8 md:p-12">
                
                {/* Kurallar Listesi */}
                <div className="bg-blue-50 border-l-4 border-[#0F2C59] p-6 rounded-r-xl mb-8">
                    <h3 className="font-bold text-[#0F2C59] text-lg mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Sınav Kuralları & Uyarılar
                    </h3>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-3">
                            <span className="mt-1 text-[#D4AF37] font-bold">1.</span>
                            <span>Sınav süresi <strong>{exam.duration_minutes} dakika</strong>dır. Süre bittiğinde sınav otomatik kapanır.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 text-[#D4AF37] font-bold">2.</span>
                            <span>Sınav sırasında <strong>tam ekran modunda</strong> kalmanız gerekmektedir. Sekme değiştirmek ihlal sayılır.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 text-[#D4AF37] font-bold">3.</span>
                            <span>Sınavı başlattığınız an giriş hakkınız kullanılır. İnternet bağlantınızı kontrol ediniz.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <span className="mt-1 text-[#D4AF37] font-bold">4.</span>
                            <span>Sorular arasında geçiş yapabilirsiniz. "Sınavı Bitir" demeden cevaplarınız kesinleşmez.</span>
                        </li>
                    </ul>
                </div>

                {/* Aksiyon Butonları */}
                <div className="flex flex-col-reverse md:flex-row gap-4 items-center justify-center">
                    <button 
                        className="btn btn-lg btn-ghost text-gray-500 w-full md:w-auto hover:bg-gray-100"
                        onClick={openCancelModal}
                    >
                        Vazgeç ve Dön
                    </button>
                    
                    <button 
                        className="btn btn-lg bg-[#D4AF37] hover:bg-[#b5952f] text-[#0F2C59] font-extrabold w-full md:w-auto px-12 shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all border-none"
                        onClick={openStartModal}
                    >
                        SINAVI BAŞLAT 🚀
                    </button>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}