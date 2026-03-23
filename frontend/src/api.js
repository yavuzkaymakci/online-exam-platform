const API_URL = "http://localhost:5000/api";

// Yardımcı: Token ile Header oluşturma
const getHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }), // Token varsa ekle
  };
};

export const loginUser = async (credentials) => {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  return res.json();
};

export const registerUser = async (userData) => {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
  return res.json();
};

export const createExam = async (examData) => {
  const res = await fetch(`${API_URL}/exams/create`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(examData),
  });
  return res.json();
};

// Kod ile Sınav Bulma
export const findExamByCode = async (code) => {
    const res = await fetch(`${API_URL}/exams/access/${code}`, {
        method: "GET",
        headers: getHeaders()
    });
    return res.json();
};

export const getInstructorExams = async (instructorId) => {
  const res = await fetch(`${API_URL}/exams/instructor/${instructorId}`, {
    method: "GET",
    headers: getHeaders()
  });
  return res.json();
};