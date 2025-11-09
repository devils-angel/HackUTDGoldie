import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5003"
    : "http://backend:5003");

const API = axios.create({
  baseURL,
});

// ...existing code...
export const loginUser = (data) => API.post("/login", data);
export const registerUser = (data) => API.post("/register", data);
export const fetchData = () => API.get("/data");
export const applyForLoan = (data) => API.post("/loan-application/submit", data);
export const fetchPendingRequests = () => API.get("/loan-application/pending");
export const approveLoanApplication = (applicationId) =>
  API.post(`/loan-application/${applicationId}/approve`);
export const rejectLoanApplication = (applicationId, reason) =>
  API.post(`/loan-application/${applicationId}/reject`, { reason });
export const fetchLoanApplications = (params = {}) =>
  API.get("/loan-application/list", { params });
export const fetchUserLoans = (email, limit = 50) =>
  API.get("/loan-application/user", { params: { email, limit } });
// export const applyForLoan = (data) => API.post("/loan", data);
