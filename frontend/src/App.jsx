import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import LoanForm from "./components/LoanForm";
import PendingRequests from "./components/PendingRequests";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/loan" element={<LoanForm />} />
        <Route path="/pending" element={<PendingRequests />} />
      </Routes>
    </BrowserRouter>
  );
}
