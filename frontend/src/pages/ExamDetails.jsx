import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function ExamDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:5000/api/exams/analytics/${id}`)
      .then(res => res.json())
      .then(result => { if(result.success) setData(result); setLoading(false); })
      .catch(err => console.error(err));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><span className="loading loading-spinner text-[#0F2C59] loading-lg"></span></div>;
  if (!data) return <div className="p-10 text-center text-error">Veri bulunamadı.</div>;

  return (
    <div className="min-h-screen bg-gray-50 font-sans p-8">
      
      {/* BAŞLIK ALANI */}
      <div className="max-w-7xl mx-auto mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn btn-circle btn-ghost bg-white shadow-sm text-[#0F2C59]">←</button>
        <div>
            <h1 className="text-3xl font-bold text-[#0F2C59]">{data.examTitle}</h1>
            <p className="text-gray-500 text-sm">Detaylı Performans Analizi</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        
        {/* 1. İSTATİSTİK KARTLARI */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Katılım" value={data.stats.totalParticipants} label="Öğrenci" color="bg-blue-50 text-blue-700" icon="👥" />
            <StatCard title="Ortalama" value={data.stats.average} label="Puan" color="bg-yellow-50 text-yellow-700" icon="⚖️" />
            <StatCard title="En Yüksek" value={data.stats.max} label="Puan" color="bg-green-50 text-green-700" icon="🏆" />
            <StatCard title="En Düşük" value={data.stats.min} label="Puan" color="bg-red-50 text-red-700" icon="📉" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 2. ÖĞRENCİ TABLOSU */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800">Öğrenci Sıralaması</h2>
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">Puan Sıralı</span>
                </div>
                <div className="overflow-x-auto max-h-[500px]">
                    <table className="table table-zebra w-full">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr><th>#</th><th>Öğrenci</th><th>Puan</th></tr>
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
                                        <span className={`badge font-bold text-white border-none ${std.score >= 50 ? 'bg-green-500' : 'bg-red-500'}`}>
                                            {std.score}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* 3. SORU ANALİZİ */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="font-bold text-gray-800 mb-6">Soru Bazlı Başarı</h2>
                <div className="space-y-6">
                    {data.questionAnalysis.map((q, idx) => (
                        <div key={idx}>
                            <div className="flex justify-between mb-2 text-sm">
                                <span className="font-semibold text-gray-700 w-3/4 truncate">{idx + 1}. {q.text}</span>
                                <span className="font-bold text-[#0F2C59]">%{q.correctRate}</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${q.correctRate > 70 ? 'bg-green-500' : q.correctRate > 40 ? 'bg-yellow-400' : 'bg-red-500'}`} 
                                    style={{ width: `${q.correctRate}%` }}
                                ></div>
                            </div>
                            <div className="flex gap-4 mt-1 text-xs text-gray-400">
                                <span>✅ {q.correctCount} Doğru</span>
                                <span>❌ {q.wrongCount} Yanlış</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}

// Ufak bir yardımcı bileşen (StatCard)
function StatCard({ title, value, label, color, icon }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <div className="text-gray-400 text-xs font-bold uppercase tracking-wider">{title}</div>
                <div className="text-3xl font-extrabold text-gray-800 mt-1">{value}</div>
                <div className="text-xs text-gray-400">{label}</div>
            </div>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${color}`}>
                {icon}
            </div>
        </div>
    );
}