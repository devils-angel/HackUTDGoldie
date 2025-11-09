import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5003"
    : "http://backend:5003");

const API = axios.create({
  baseURL,
});

API.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("goldmanToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ...existing code...
export const loginUser = (data) => API.post("/login", data);
export const registerUser = (data) => API.post("/register", data);
export const fetchData = () => API.get("/data");
export const applyForLoan = (data) => API.post("/loan-application/submit", data);
export const fetchPendingRequests = () => API.get("/loan-application/pending");
export const approveLoanApplication = (applicationId, actor) =>
  API.post(`/loan-application/${applicationId}/approve`, { actor });
export const rejectLoanApplication = (applicationId, reason, actor) =>
  API.post(`/loan-application/${applicationId}/reject`, { reason, actor });
export const fetchLoanApplications = (params = {}) =>
  API.get("/loan-application/list", { params });
export const fetchUserLoans = (email, limit = 50) =>
  API.get("/loan-application/user", { params: { email, limit } });
export const fetchApprovalLogs = (params = {}) =>
  API.get("/approval-logs", { params });
export const fetchDashboardOverview = () =>
  API.get("/dashboard/overview");
export const fetchDashboardByRegion = () =>
  API.get("/dashboard/by-region");
export const fetchDashboardByCountry = () =>
  API.get("/dashboard/by-country");
export const fetchDashboardVerificationStats = () =>
  API.get("/dashboard/verification-stats");
export const fetchDashboardFinancialMetrics = () =>
  API.get("/dashboard/financial-metrics");
export const fetchNotifications = (params = {}) =>
  API.get("/notifications", { params });
export const markNotificationsRead = (ids) =>
  API.post("/notifications/read", { ids });
export const fetchBankAccounts = (email) =>
  API.get("/bank-accounts", { params: { email } });
export const addBankAccount = (payload) =>
  API.post("/bank-accounts", payload);
// export const applyForLoan = (data) => API.post("/loan", data);
