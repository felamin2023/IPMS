import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import Layout from "./components/Layout";

import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import Home from "./pages/user/Home";
import Dashboard from "./pages/admin/Dashboard";

// Admin pages
import CreateRequestAdmin from "./pages/admin/CreateRequest";
import RequestsAdmin from "./pages/admin/Requests";
import Approvals from "./pages/admin/Approvals";
import MonitoringAdmin from "./pages/admin/Monitoring";
import Reports from "./pages/admin/Reports";
import Settings from "./pages/admin/Settings";

// User pages
import CreateRequestUser from "./pages/user/CreateRequest";
import RequestsUser from "./pages/user/Requests";
import MonitoringUser from "./pages/user/Monitoring";
import SettingsUser from "./pages/user/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />

          {/* App routes use Layout (shows admin or user nav) */}
          <Route element={<Layout />}>
            {/* Protected user routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/create-request" element={<CreateRequestUser />} />
              <Route path="/requests" element={<RequestsUser />} />
              <Route path="/monitoring" element={<MonitoringUser />} />
              <Route path="/settings" element={<SettingsUser />} />
            </Route>

            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route
                path="/admin/create-request"
                element={<CreateRequestAdmin />}
              />
              <Route path="/admin/requests" element={<RequestsAdmin />} />
              <Route path="/admin/approvals" element={<Approvals />} />
              {/* Purchase Orders page removed */}
              <Route path="/admin/monitoring" element={<MonitoringAdmin />} />
              <Route path="/admin/reports" element={<Reports />} />
              <Route path="/admin/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
