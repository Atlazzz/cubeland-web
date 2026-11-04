import { Link } from 'react-router-dom';
import './coming-soon.css';

function ComingSoonPage({ titulo, descripcion }) {
  return (
    <section className="soon">
      <div className="soon__box">
        <span className="soon__tag">Próximamente</span>
        <h1 className="soon__title">{titulo}</h1>
        <p className="soon__text">{descripcion}</p>
        <Link to="/" className="btn btn--primary">Volver al inicio</Link>
      </div>
    </section>
  );
}

export default ComingSoonPage;