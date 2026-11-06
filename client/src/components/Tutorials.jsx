import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { peticion } from '../api';
import './tutorials.css';

const NIVELES = {
  beginner: { nombre: 'Principiante', numero: 1 },
  easy: { nombre: 'Fácil', numero: 2 },
  intermediate: { nombre: 'Intermedio', numero: 3 },
  advanced: { nombre: 'Avanzado', numero: 4 },
  expert: { nombre: 'Experto', numero: 5 },
};

function Dificultad({ nivel }) {
  return (
    <div
      className="tut__dots"
      role="img"
      aria-label={`Dificultad ${nivel} de 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={n <= nivel ? 'on' : ''}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function Tutorials() {
  const [tutoriales, setTutoriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    peticion('/tutoriales')
      .then((datos) => {
        if (activo) {
          setTutoriales(datos.tutoriales.slice(0, 3));
        }
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="tut" id="tutoriales">
      <div className="tut__inner">
        <div className="tut__head">
          <div>
            <h2 className="tut__title">Aprende a resolverlo</h2>
            <p className="tut__sub">
              Guías paso a paso con imágenes, por tipo de cubo
              y nivel de dificultad.
            </p>
          </div>

          <Link to="/tutoriales" className="btn btn--ghost">
            Ver todos los tutoriales
          </Link>
        </div>

        {cargando ? (
          <p role="status">Cargando tutoriales…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : tutoriales.length === 0 ? (
          <p>Próximamente encontrarás tutoriales aquí.</p>
        ) : (
          <div className="tut__grid">
            {tutoriales.map((t) => {
              const nivel = NIVELES[t.difficulty];
              const pasos = Number(t.steps_count);

              return (
                <article className="tut__card" key={t.id}>
                   <div className="tut__thumb">
                    {t.cover_image && (
                      <img
                        className="tut__cover"
                        src={t.cover_image}
                        alt=""
                        loading="lazy"
                      />
                    )}
                  </div>

                  <div className="tut__body">
                    <h3 className="tut__card-title">
                      {t.title}
                    </h3>

                    <p className="tut__meta">
                      {t.cube_type}
                      {nivel && ` · ${nivel.nombre}`}
                    </p>

                    <div className="tut__details">
                      <span className="tut__step-count">
                        {pasos} {pasos === 1 ? 'paso' : 'pasos'}
                      </span>

                      <Link
                      to={`/tutoriales/${t.id}`}
                      className="btn btn--ghost btn--sm"
                    >
                      Leer tutorial
                    </Link>

                      {nivel && (
                        <Dificultad nivel={nivel.numero} />
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Tutorials;