import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { peticion } from '../api';
import './tutorial-pages.css';

const NIVELES = {
  beginner: 'Principiante',
  easy: 'Fácil',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

function TutorialDetail({ id }) {
  const [tutorial, setTutorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    peticion(`/tutoriales/${encodeURIComponent(id)}`)
      .then((datos) => {
        if (activo) setTutorial(datos);
      })
      .catch((e) => {
        if (activo) {
          setError(
            e.status === 404
              ? 'Este tutorial no existe o no está publicado.'
              : e.message
          );
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  return (
    <section className="tutorial-page">
      <div className="tutorial-page__inner tutorial-read">
        <Link to="/tutoriales" className="tutorial-page__back">
          ← Todos los tutoriales
        </Link>

        {cargando ? (
          <p role="status">Cargando tutorial…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : (
          <>
            <h1>{tutorial.title}</h1>

            {tutorial.cover_image && (
              <img
                className="tutorial-read__cover"
                src={tutorial.cover_image}
                alt={`Portada de ${tutorial.title}`}
              />
            )}

            <div className="tutorial-read__tags">
              <span>{tutorial.cube_type}</span>
              <span>{NIVELES[tutorial.difficulty]}</span>
            </div>

            <section
              className="tutorial-read__intro"
              aria-label="Descripción general"
            >
              {tutorial.description && (
                <p className="tutorial-read__text">
                  {tutorial.description}
                </p>
              )}

              {tutorial.blocks.map((bloque) =>
                bloque.block_type === 'text' ? (
                  <p
                    className="tutorial-read__text"
                    key={bloque.id}
                  >
                    {bloque.text_content}
                  </p>
                ) : (
                  <img
                    className="tutorial-read__image"
                    key={bloque.id}
                    src={bloque.image_url}
                    alt={bloque.image_alt || ''}
                    loading="lazy"
                  />
                )
              )}
            </section>

            {tutorial.steps.map((paso) => (
              <section className="tutorial-read__step" key={paso.id}>
                <h2>{paso.step_number}. {paso.title}</h2>

                {paso.image_url && (
                  <img
                    className="tutorial-read__image"
                    src={paso.image_url}
                    alt={`Ilustración del paso ${paso.step_number}: ${paso.title}`}
                    loading="lazy"
                  />
                )}

                {paso.instruction && (
                  <p className="tutorial-read__text">
                    {paso.instruction}
                  </p>
                )}

                {paso.cases.map((caso) => (
                  <section
                    className="tutorial-read__case"
                    key={caso.id}
                  >
                    <h3>Caso {caso.case_number}</h3>

                    {caso.case_image_url && (
                      <img
                        className="tutorial-read__image tutorial-read__case-image"
                        src={caso.case_image_url}
                        alt={caso.case_image_alt || ''}
                        loading="lazy"
                      />
                    )}

                    <p className="tutorial-read__text">
                      {caso.description}
                    </p>

                    {caso.algorithm && (
                      <div className="tutorial-read__algorithm">
                        <h4>Algoritmo</h4>
                        <code>{caso.algorithm}</code>
                      </div>
                    )}

                    {caso.moves_image_url && (
                      <img
                        className="tutorial-read__image"
                        src={caso.moves_image_url}
                        alt={caso.moves_image_alt || ''}
                        loading="lazy"
                      />
                    )}
                  </section>
                ))}
              </section>
            ))}

            <Link to="/tutoriales" className="btn btn--ghost">
              Ver otros tutoriales
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

function TutorialDetailPage() {
  const { id } = useParams();

  return <TutorialDetail key={id} id={id} />;
}

export default TutorialDetailPage;