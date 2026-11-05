import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function StaffRoute({ children }) {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <p className="ord__msg">Comprobando acceso…</p>;
  }

  if (!user) {
    return (
      <Navigate
        to="/iniciar-sesion"
        state={{ desde: location.pathname }}
        replace
      />
    );
  }

  if (user.role !== 'staff') {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default StaffRoute;