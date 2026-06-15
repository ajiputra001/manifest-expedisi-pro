import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Expedition from './pages/Expedition';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const ProtectedRoute = ({ children, requiredRole }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) return <div className="h-screen bg-zinc-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full"></div></div>;
  
  if (!currentUser) return <Navigate to="/login" replace />;
  
  if (currentUser.status === 'pending') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950 px-4">
        <div className="max-w-md w-full bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-8 text-center shadow-2xl backdrop-blur-2xl">
            <div className="w-20 h-20 rounded-full bg-amber-500/10 mx-auto flex items-center justify-center mb-6">
                <i className="fa-solid fa-clock text-4xl text-amber-500"></i>
            </div>
            <h2 className="text-2xl font-black text-white mb-2 uppercase tracking-widest">Menunggu Persetujuan</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">Akun toko Anda sedang dalam antrean verifikasi oleh Admin. Silakan hubungi Admin atau tunggu beberapa saat lagi.</p>
            <button onClick={() => { localStorage.removeItem('manifestUser'); window.location.reload(); }} className="px-6 py-2.5 rounded-xl bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 text-xs font-bold tracking-wider transition-all">KELUAR</button>
        </div>
      </div>
    );
  }

  if (requiredRole && currentUser.role !== requiredRole && currentUser.role !== 'developer') {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="expedition/:courierId" element={<Expedition />} />
              <Route path="admin" element={<ProtectedRoute requiredRole="admin"><AdminPanel /></ProtectedRoute>} />
            </Route>
            
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
