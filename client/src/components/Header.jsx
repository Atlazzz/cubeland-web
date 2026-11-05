import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import logoCubo from '../assets/images/logo-cubeland-cubo-claro.png';
import logoNombre from '../assets/images/logo-cubeland-nombre-claro.png';
import './header.css';

function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { cantidad } = useCart();

  function buscar(e) {
    e.preventDefault();
    const texto = String(new FormData(e.currentTarget).get('q') || '').trim();
    navigate(texto ? `/catalogo?q=${encodeURIComponent(texto)}` : '/catalogo');
  }

  return (
    <header className="header">
      <div className="header__inner">
        <Link to="/" className="header__logo">
          <img className="header__logo-cubo" src={logoCubo} alt="" />
          <img className="header__logo-nombre" src={logoNombre} alt="CubeLand" />
        </Link>

        <nav className="header__nav">
          <NavLink to="/catalogo" className="header__link">Catálogo</NavLink>
          <NavLink to="/tutoriales" className="header__link">Tutoriales</NavLink>
          <NavLink to="/contacto" className="header__link">Contacto</NavLink>
        </nav>

        <form className="header__search-form" onSubmit={buscar}>
          <input
            className="header__search"
            type="search"
            name="q"
            placeholder="Buscar cubos…"
          />
        </form>

        <div className="header__actions">
          {user ? (
            <>
              <span className="header__user">Hola, {user.name.split(' ')[0]}</span>
              <NavLink
                to="/mis-pedidos"
                className="btn btn--ghost btn--sm header__orders"
              >
                Mis pedidos
              </NavLink>
              <button className="btn btn--ghost btn--sm" onClick={logout}>Salir</button>
            </>
          ) : (
            <Link to="/iniciar-sesion" className="btn btn--ghost btn--sm">Iniciar sesión</Link>
          )}
          <Link to="/carrito" className="icon-btn" aria-label="Carrito">
            🛒
            {cantidad > 0 && <span className="header__cart-count">{cantidad}</span>}
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;