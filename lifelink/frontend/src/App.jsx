import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Supplies from './pages/Supplies';
import SupplyDetail from './pages/SupplyDetail';
import CreateSupply from './pages/CreateSupply';
import Profile from './pages/Profile';
import Requests from './pages/Requests';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import MySupplies from './pages/MySupplies';
import Favorites from './pages/Favorites';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              padding: '12px 16px',
              fontSize: '14px',
              fontFamily: 'Plus Jakarta Sans, sans-serif',
            },
          }}
        />
        <Layout>
          <Routes>
            {/* Públicas */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/supplies" element={<Supplies />} />
            <Route path="/supplies/:id" element={<SupplyDetail />} />

            {/* Protegidas */}
            <Route path="/publish" element={<ProtectedRoute><CreateSupply /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/messages/:requestId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/my-supplies" element={<ProtectedRoute><MySupplies /></ProtectedRoute>} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />

            {/* 404 */}
            <Route path="*" element={
              <div className="text-center py-20">
                <p className="text-6xl font-bold text-gray-200 mb-4">404</p>
                <p className="text-gray-500">Página no encontrada</p>
              </div>
            } />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}
