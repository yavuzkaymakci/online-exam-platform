import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Login from "./pages/Login";
import InstructorDashboard from "./pages/InstructorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import CreateExam from "./pages/CreateExam";
import ExamIntro from "./pages/ExamIntro";
import ExamDetails from './pages/ExamDetails';
import TakeExam from "./pages/TakeExam"; // Eski dosyan, adı TakeExam kalsın ama url'i exam-active yapalım

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Giriş Sayfası */}
          <Route path="/login" element={<Login />} />
          
          {/* Hoca Sayfaları */}
          <Route path="/instructor-dashboard" element={<InstructorDashboard />} />
          <Route path="/create-exam" element={<CreateExam />} />
          <Route path="/instructor/exam-details/:id" element={<ExamDetails />} />

          {/* Öğrenci Sayfaları */}
          <Route path="/student-dashboard" element={<StudentDashboard />} />
          
          {/* Sınav Akışı */}
          <Route path="/exam-intro/:id" element={<ExamIntro />} />  {/* Bekleme Odası */}
          <Route path="/exam-active/:id" element={<TakeExam />} />  {/* Aktif Sınav */}

          {/* Varsayılan Yönlendirme */}
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;