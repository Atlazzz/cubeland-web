import logoCubo from '../assets/images/logo-cubeland-cubo-claro.png';
import logoNombre from '../assets/images/logo-cubeland-nombre-claro.png';
import './header.css';

function Header() {
  return (
    <header className="header">
      <div className="header__inner">
        <a href="#inicio" className="header__logo">
            <img className="header__logo-cubo" src={logoCubo} alt="" />
            <img className="header__logo-nombre" src={logoNombre} alt="CubeLand" />
        </a>

        <nav className="header__nav">
          <a href="#catalogo" className="header__link">Catálogo</a>
          <a href="#tutoriales" className="header__link">Tutoriales</a>
          <a href="#contacto" className="header__link">Contacto</a>
        </nav>

        <input
          className="header__search"
          type="search"
          placeholder="Buscar cubos, tutoriales…"
        />

        <div className="header__actions">
          <button className="icon-btn" aria-label="Cuenta">👤</button>
          <button className="icon-btn" aria-label="Carrito">🛒</button>
        </div>
      </div>
    </header>
  );
}

export default Header;