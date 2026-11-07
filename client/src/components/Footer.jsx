import { Link } from 'react-router-dom';
import './footer.css';

function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer__inner">
        <div>
          <p className="footer__brand">CubeLand</p>
          <p className="footer__tagline">
            Tu mundo, un giro a la vez.
          </p>
          <p className="footer__small">
            Tepexpan, Acolman, Estado de México
          </p>
        </div>

        <nav className="footer__links" aria-label="Información de CubeLand">
          <Link to="/aviso-de-privacidad">
            Aviso de privacidad
          </Link>

          <Link to="/terminos-y-condiciones">
            Términos y condiciones
          </Link>

          <Link to="/politica-de-devoluciones">
            Política de devoluciones
          </Link>

          <Link to="/contacto">
            Contacto
          </Link>
        </nav>
      </div>

      <p className="footer__copy">
        © 2026 CubeLand. Todos los derechos reservados.
      </p>
    </footer>
  );
}

export default Footer;