import './tutorials.css';
import { Link } from 'react-router-dom';

const TUTORIALES = [
  { id: 1, titulo: 'Primera cara: método capa por capa', tipo: '3x3', nivel: 'Principiante', dificultad: 1, pasos: 8 },
  { id: 2, titulo: 'Cruz y esquinas F2L', tipo: '3x3', nivel: 'Intermedio', dificultad: 2, pasos: 12 },
  { id: 3, titulo: 'Resolver el 2x2 desde cero', tipo: '2x2', nivel: 'Principiante', dificultad: 1, pasos: 6 },
];

function Dificultad({ nivel }) {
  return (
    <div className="tut__dots" aria-label={`Dificultad ${nivel} de 3`}>
      {[1, 2, 3].map((n) => (
        <span key={n} className={n <= nivel ? 'on' : ''}></span>
      ))}
    </div>
  );
}

function Tutorials() {
  return (
    <section className="tut" id="tutoriales">
      <div className="tut__inner">
        <div className="tut__head">
          <div>
            <h2 className="tut__title">Aprende a resolverlo</h2>
            <p className="tut__sub">Guías paso a paso con imágenes, por tipo de cubo y nivel de dificultad.</p>
          </div>
          <Link to="/tutoriales" className="btn btn--ghost">Ver todos los tutoriales</Link>
        </div>

        <div className="tut__grid">
          {TUTORIALES.map((t) => (
            <article className="tut__card" key={t.id}>
              <div className="tut__thumb">
                <div className="tut__steps">
                  <span className="tut__steps-num">{t.pasos}</span>
                  <span className="tut__steps-label">pasos</span>
                </div>
                <Dificultad nivel={t.dificultad} />
              </div>
              <div className="tut__body">
                <h3 className="tut__card-title">{t.titulo}</h3>
                <p className="tut__meta">{t.tipo} · {t.nivel}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Tutorials;