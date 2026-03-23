import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { getInstructorExams } from "../api";

export default function InstructorDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.user_id) {
      getInstructorExams(user.user_id)
        .then((data) => {
            if(data.success) setExams(data.exams);
            setLoading(false);
        })
        .catch(err => console.error(err));
    }
  }, [user]);

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert("Kopyalandı: " + code);
  };

return (
  <div className="min-h-screen bg-gray-50 font-sans">
        {/* --- NAVBAR GÜNCELLENDİ --- */}
        <div className="navbar bg-[#0F2C59] text-white px-8 shadow-md">
          <div className="flex-1">
              <div className="flex items-center gap-4">
                  {/* LOGO EKLENDİ */}
                  <img 
                    src="/amblem.jpg" 
                    alt="YTÜ Logo" 
                    className="w-10 h-10 rounded-full border-2 border-white/20 shadow-md object-contain bg-white" 
                  />
                  <span className="text-xl font-bold tracking-wide">Akademisyen Portalı</span>
              </div>
          </div>
          <div className="flex-none gap-4">
              <span className="text-sm opacity-90">{user?.username}</span>
              <button className="btn btn-sm btn-error bg-red-500/20 text-white border-none hover:bg-red-600" onClick={logout}>Çıkış</button>
          </div>
        </div>

          <div className="container mx-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                
                {/* SOL MENÜ & İSTATİSTİK */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Yeni Sınav Butonu */}
                    <div 
                        onClick={() => navigate('/create-exam')}
                        className="group bg-[#0F2C59] text-white p-6 rounded-2xl shadow-xl cursor-pointer hover:bg-[#153a72] transition-all transform hover:-translate-y-1"
                    >
                        <div className="flex flex-col items-center justify-center gap-2">
                            <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-4xl group-hover:scale-110 transition-transform">+</div>
                            <h2 className="text-xl font-bold mt-2">Sınav Oluştur</h2>
                            <p className="text-xs opacity-60 text-center">Yeni bir sınav başlatmak için tıklayın</p>
                        </div>
                    </div>

                    {/* İstatistik Kartı */}
                    <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100">
                        <h3 className="text-gray-500 text-sm uppercase font-bold mb-2">Toplam Sınav</h3>
                        <div className="text-5xl font-extrabold text-[#D4AF37]">{exams.length}</div>
                        <div className="text-xs text-gray-400 mt-2">Aktif ve tamamlanmış</div>
                    </div>
                </div>

                {/* SAĞ LİSTE */}
                <div className="lg:col-span-3">
                    <h2 className="text-2xl font-bold text-[#0F2C59] mb-6 border-b pb-2 border-gray-200">Sınav Listesi</h2>
                    
                    {loading ? <div className="flex justify-center"><span className="loading loading-bars loading-lg text-[#0F2C59]"></span></div> : (
                        <div className="grid gap-5">
                            {exams.length === 0 && <div className="alert alert-info bg-blue-50 text-[#0F2C59]">Henüz sınav kaydı yok.</div>}
                            
                            {exams.map((exam) => (
                                <div key={exam.exam_id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-bold text-gray-800">{exam.title}</h3>
                                            <span className="badge badge-sm bg-[#0F2C59] text-white border-none">{exam.duration_minutes} Dk</span>
                                        </div>
                                        <p className="text-sm text-gray-500 line-clamp-1">{exam.description || "Açıklama girilmemiş."}</p>
                                    </div>

                                    {/* KOD ALANI */}
                                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-lg border border-gray-200" title="Erişim Kodu">
                                        <span className="text-gray-400 text-xs font-bold uppercase">KOD:</span>
                                        <span className="font-mono font-bold text-lg text-[#0F2C59] tracking-widest">{exam.access_code}</span>
                                        <button onClick={() => copyCode(exam.access_code)} className="btn btn-xs btn-circle btn-ghost text-gray-400 hover:text-[#0F2C59]">
                                            📋
                                        </button>
                                    </div>

                                    {/* AKSİYON */}
                                    <button 
                                        className="btn bg-[#D4AF37] hover:bg-[#c29d2b] text-white border-none btn-sm px-6 rounded-lg font-bold shadow-sm"
                                        onClick={() => navigate(`/instructor/exam-details/${exam.exam_id}`)}
                                    >
                                        Analiz 📊
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
          </div>
    </div>
  );
}