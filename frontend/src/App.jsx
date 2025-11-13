import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Register from "./components/Register";
import Dashboard from "./components/Dashboard";
import LoanForm from "./components/LoanForm";
import PendingRequests from "./components/PendingRequests";
import ApprovalLogs from "./components/ApprovalLogs";
import Notifications from "./components/Notifications";
import BankAccounts from "./components/BankAccounts";
import { ThemeProvider } from "./context/ThemeContext";

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/loan" element={<LoanForm />} />
          <Route path="/pending" element={<PendingRequests />} />
          <Route path="/logs" element={<ApprovalLogs />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/accounts" element={<BankAccounts />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
