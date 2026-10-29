import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './features/dashboard/Dashboard';
import Rooms from './features/rooms/Rooms';
import Bookings from './features/bookings/Bookings';
import CheckInOut from './features/bookings/CheckInOut';
import Expenses from './features/expenses/Expenses';
import Settings from './features/settings/Settings';
import Guests from './features/guests/Guests';
import Billing from './features/billing/Billing';
import Payments from './features/billing/Payments';
import Reports from './features/reports/Reports';
import Users from './features/users/Users';
import Login from './features/auth/Login';
import { useAuth } from './store/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuth(state => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/*" element={
          <ProtectedRoute>
            <DashboardLayout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/rooms" element={<Rooms />} />
                <Route path="/guests" element={<Guests />} />
                <Route path="/bookings" element={<Bookings />} />
                <Route path="/check-in-out" element={<CheckInOut />} />
                <Route path="/billing" element={<Billing />} />
                <Route path="/payments" element={<Payments />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/users" element={<Users />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </DashboardLayout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
