import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p style={{ padding: '48px 40px', color: 'var(--ink-dim)' }}>Cargando…</p>;
  }
  if (!user) {
    return <Navigate to="/iniciar-sesion" state={{ desde: location.pathname }} replace />;
  }
  return children;
}

export default ProtectedRoute;