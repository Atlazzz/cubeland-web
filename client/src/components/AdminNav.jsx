import { NavLink } from 'react-router-dom';

function AdminNav() {
  return (
    <nav className="admin__actions" aria-label="Administración">
      <NavLink
        to="/admin/productos"
        className="btn btn--ghost admin__nav-link"
      >
        Productos
      </NavLink>

      <NavLink
        to="/admin/pedidos"
        className="btn btn--ghost admin__nav-link"
      >
        Pedidos
      </NavLink>

       <NavLink
        to="/admin/tutoriales"
        className="btn btn--ghost admin__nav-link"
      >
        Tutoriales
      </NavLink>

       <NavLink
        to="/admin/mensajes"
        className="btn btn--ghost admin__nav-link"
      >
        Mensajes
      </NavLink>
    </nav>
  );
}

export default AdminNav;