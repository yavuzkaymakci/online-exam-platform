import { useState } from "react";
import { loginUser, registerUser } from "../api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: "", email: "", password: "", role: "student" });
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isLogin) {
        const res = await loginUser({ email: formData.email, password: formData.password });
        if (res.success) {
          login(res.user, res.token);
          if (res.user.role === 'instructor') navigate('/instructor-dashboard');
          else navigate('/student-dashboard');
        } else {
          alert(res.message);
        }
      } else {
        const res = await registerUser(formData);
        if (res.success) {
          alert("Kayıt başarılı! Lütfen giriş yapınız.");
          setIsLogin(true);
        } else {
          alert(res.message);
        }
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen flex w-full font-sans">
      
      {/* --- SOL TARAF: LOGO VE KURUMSAL ALAN --- */}
      <div className="hidden lg:flex w-1/2 bg-[#0F2C59] flex-col justify-center items-center text-white p-12 relative overflow-hidden">
        
        {/* Arka plan deseni */}
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

        <div className="z-10 text-center flex flex-col items-center">
            {/* AMBLEM DÜZENLEMESİ YAPILDI */}
            {/* p-8 yerine p-2 kullanıldı (Çerçeve boşluğu azaltıldı) */}
            <div className="bg-white/10 p-2 rounded-full backdrop-blur-md mb-10 shadow-2xl border border-white/20">
                <img 
                    src="/amblem.jpg" 
                    alt="YTÜ Logo" 
                    // w-56 h-56 yerine w-64 h-64 kullanıldı (Logo büyütüldü)
                    className="w-64 h-64 object-contain drop-shadow-xl rounded-full" 
                />
            </div>
            
            <h1 className="text-5xl font-bold mb-4 tracking-wide leading-tight">Yıldız Teknik <br/> Üniversitesi</h1>
            <h2 className="text-2xl font-light opacity-90 text-blue-100 tracking-wider">Çevrimiçi Sınav Sistemi</h2>
            
            <div className="mt-12 text-sm opacity-60 max-w-md mx-auto leading-relaxed">
                <p>Öğrenci ve akademisyenlerimiz için güvenli, hızlı ve modern sınav platformuna hoş geldiniz.</p>
            </div>
        </div>
      </div>

      {/* --- SAĞ TARAF: GİRİŞ FORMU --- */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6 lg:p-12">
        <div className="w-full max-w-[450px] bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
            
            <div className="mb-10 text-center">
                <h3 className="text-3xl font-extrabold text-gray-800 mb-3 tracking-tight">
                    {isLogin ? "Giriş Yapın" : "Hesap Oluşturun"}
                </h3>
                <p className="text-gray-500 text-sm">
                    {isLogin ? "Sınav sistemine erişmek için bilgilerinizi giriniz." : "Yeni bir hesap oluşturmak için formu doldurun."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                {!isLogin && (
                    <div className="form-control w-full">
                        <label className="label text-xs font-bold text-gray-500 mb-1 ml-1">KULLANICI ADI</label>
                        <input type="text" placeholder="Ad Soyad" 
                            className="input input-bordered w-full h-12 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] focus:border-transparent transition-all" 
                            value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} required />
                    </div>
                )}

                <div className="form-control w-full">
                    <label className="label text-xs font-bold text-gray-500 mb-1 ml-1">KURUMSAL EMAIL</label>
                    <input type="email" placeholder="ornek@std.yildiz.edu.tr" 
                        className="input input-bordered w-full h-12 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] focus:border-transparent transition-all" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                </div>

                <div className="form-control w-full">
                    <label className="label text-xs font-bold text-gray-500 mb-1 ml-1">ŞİFRE</label>
                    <input type="password" placeholder="••••••••" 
                        className="input input-bordered w-full h-12 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59] focus:border-transparent transition-all" 
                        value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                </div>

                {!isLogin && (
                    <div className="form-control w-full">
                        <label className="label text-xs font-bold text-gray-500 mb-1 ml-1">HESAP TÜRÜ</label>
                        <select className="select select-bordered w-full h-12 bg-white focus:outline-none focus:ring-2 focus:ring-[#0F2C59]" 
                            value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                            <option value="student">Öğrenci</option>
                            <option value="instructor">Akademisyen</option>
                        </select>
                    </div>
                )}

                <button className="btn bg-[#0F2C59] hover:bg-[#0a1f42] text-white border-none mt-2 w-full h-14 text-lg font-bold tracking-wide shadow-lg hover:shadow-xl transition-all rounded-xl">
                    {isLogin ? "GİRİŞ YAP" : "KAYIT OL"}
                </button>
            </form>

            <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-gray-400">veya</span>
                </div>
            </div>

            <div className="text-center">
                <p className="text-gray-600 text-sm">
                    {isLogin ? "Henüz hesabınız yok mu?" : "Zaten hesabınız var mı?"}
                    <button 
                        className="ml-2 font-bold text-[#0F2C59] hover:underline transition-all"
                        onClick={() => setIsLogin(!isLogin)}
                    >
                        {isLogin ? "Kayıt Olun" : "Giriş Yapın"}
                    </button>
                </p>
            </div>

        </div>
      </div>
    </div>
  );
}