import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/common/Toast";
import ProtectedRoute from "./components/common/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import LeaveRequest from "./pages/LeaveRequest";
import LeaveHistory from "./pages/LeaveHistory";
import CalendarPage from "./pages/CalendarPage";
import TeamCalendar from "./pages/TeamCalendar";
import Approvals from "./pages/Approvals";
import UserManagement from "./pages/UserManagement";
import HolidayManagement from "./pages/HolidayManagement";
import LeaveTypeManagement from "./pages/LeaveTypeManagement";
import Reports from "./pages/Reports";
import Profile from "./pages/Profile";
import "./index.css";

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leave-request"
              element={
                <ProtectedRoute>
                  <LeaveRequest />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leave-history"
              element={
                <ProtectedRoute>
                  <LeaveHistory />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />

            <Route
              path="/team-calendar"
              element={
                <ProtectedRoute>
                  <TeamCalendar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/approvals"
              element={
                <ProtectedRoute supervisorOnly>
                  <Approvals />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute adminOnly>
                  <Reports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/users"
              element={
                <ProtectedRoute adminOnly>
                  <UserManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/holidays"
              element={
                <ProtectedRoute adminOnly>
                  <HolidayManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/leave-types"
              element={
                <ProtectedRoute adminOnly>
                  <LeaveTypeManagement />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
