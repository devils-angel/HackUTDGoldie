import axios from "axios";

const baseURL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5002"
    : "http://backend:5002");

const API = axios.create({
  baseURL,
});

// ...existing code...
export const loginUser = (data) => API.post("/login", data);
export const registerUser = (data) => API.post("/register", data);
export const fetchData = () => API.get("/data");
export const applyForLoan = (data) => API.post("/loan-application/submit", data);
// export const applyForLoan = (data) => API.post("/loan", data);
