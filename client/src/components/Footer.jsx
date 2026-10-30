import './footer.css';

function Footer() {
  return (
    <footer className="footer" id="contacto">
      <div className="footer__inner">
        <div>
          <p className="footer__brand">CubeLand</p>
          <p className="footer__tagline">Tu mundo, un giro a la vez.</p>
          <p className="footer__small">Tepexpan, Acolman, Estado de México</p>
        </div>

        <nav className="footer__links">
          <a href="#">Aviso de privacidad</a>
          <a href="#">Términos y condiciones</a>
          <a href="#">Política de devoluciones</a>
        </nav>
      </div>
      <p className="footer__copy">© 2026 CubeLand. Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer;