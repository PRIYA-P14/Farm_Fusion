import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AppProvider, useApp } from './context/AppContext';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AnalysePage from './pages/AnalysePage';
import HistoryPage from './pages/HistoryPage';
import ReportPage from './pages/ReportPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import GovernmentHome from './pages/Government/GovernmentHome';
import GovernmentAnalyse from './pages/Government/GovernmentAnalyse';
import GovernmentHistory from './pages/Government/GovernmentHistory';
import GovernmentReport from './pages/Government/GovernmentReport';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, authLoading } = useApp();
  if (authLoading) return null;
  return user ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  const { user } = useApp();
  return (
    <div className="gradient-bg min-h-screen">
      {user && <Navbar />}
      <main className={user ? 'pb-16' : ''}>
        <Routes>
          {/* Auth */}
          <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

          {/* Platform Home */}
          <Route path="/"         element={<ProtectedRoute><HomePage /></ProtectedRoute>} />

          {/* Soil Agent */}
          <Route path="/soil"        element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
          <Route path="/analyse"     element={<ProtectedRoute><AnalysePage /></ProtectedRoute>} />
          <Route path="/history"     element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
          <Route path="/report/:id"  element={<ProtectedRoute><ReportPage /></ProtectedRoute>} />

          {/* Government Agent */}
          <Route path="/government"              element={<ProtectedRoute><GovernmentHome /></ProtectedRoute>} />
          <Route path="/government/analyse"      element={<ProtectedRoute><GovernmentAnalyse /></ProtectedRoute>} />
          <Route path="/government/history"      element={<ProtectedRoute><GovernmentHistory /></ProtectedRoute>} />
          <Route path="/government/report/:id"   element={<ProtectedRoute><GovernmentReport /></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1e293b', color: '#f1f5f9', border: '1px solid #334155' },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
      </BrowserRouter>
    </AppProvider>
  );
}
