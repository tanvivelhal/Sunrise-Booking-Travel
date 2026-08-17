import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth, roleHome } from './context/AuthContext.jsx';
import { PageLoader } from './components/ui/States.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

import DashboardLayout from './components/layout/DashboardLayout.jsx';
import EmployeeDashboard from './pages/employee/EmployeeDashboard.jsx';
import TravelSearch from './pages/employee/TravelSearch.jsx';
import MyRequests from './pages/employee/MyRequests.jsx';
import BookingsPage from './pages/shared/BookingsPage.jsx';
import BookingDetail from './pages/shared/BookingDetail.jsx';
import NotificationsPage from './pages/shared/NotificationsPage.jsx';

import ManagerDashboard from './pages/manager/ManagerDashboard.jsx';
import ApprovalsPage from './pages/manager/ApprovalsPage.jsx';

import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminAnalytics from './pages/admin/AdminAnalytics.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminPolicies from './pages/admin/AdminPolicies.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader message="Loading your travel data..." />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function RoleRoute({ roles, children }) {
  const { user } = useAuth();
  if (!roles.includes(user.role)) return <Navigate to={roleHome(user.role)} replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated app */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route
          path="/dashboard"
          element={
            <RoleRoute roles={['employee']}>
              <EmployeeDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/travel"
          element={
            <RoleRoute roles={['employee']}>
              <TravelSearch />
            </RoleRoute>
          }
        />
        <Route
          path="/requests"
          element={
            <RoleRoute roles={['employee']}>
              <MyRequests />
            </RoleRoute>
          }
        />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route
          path="/manager"
          element={
            <RoleRoute roles={['manager']}>
              <ManagerDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/approvals"
          element={
            <RoleRoute roles={['manager', 'admin']}>
              <ApprovalsPage />
            </RoleRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <RoleRoute roles={['admin']}>
              <AdminDashboard />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <RoleRoute roles={['admin']}>
              <AdminAnalytics />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <RoleRoute roles={['admin']}>
              <AdminUsers />
            </RoleRoute>
          }
        />
        <Route
          path="/admin/policies"
          element={
            <RoleRoute roles={['admin']}>
              <AdminPolicies />
            </RoleRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
