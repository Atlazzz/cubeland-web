import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { peticion } from '../api';
import './tutorial-pages.css';

const NIVELES = {
  beginner: 'Principiante',
  easy: 'Fácil',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

function TutorialsPage() {
  const [params, setParams] = useSearchParams();

  const q = params.get('q') || '';
  const tipo = params.get('tipo') || '';
  const nivel = params.get('nivel') || '';
  const consulta = new URLSearchParams({ q, tipo, nivel }).toString();

  const [texto, setTexto] = useState(q);
  const [datos, setDatos] = useState({ tutoriales: [], tipos: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setTexto(q);
  }, [q]);

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setError('');

    peticion(`/tutoriales?${consulta}`)
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
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
  }, [consulta]);

  function filtrar(campo, valor) {
    const siguientes = new URLSearchParams(params);

    if (valor) siguientes.set(campo, valor);
    else siguientes.delete(campo);

    setParams(siguientes);
  }

  function buscar(e) {
    e.preventDefault();
    filtrar('q', texto.trim());
  }

  return (
    <section className="tutorial-page">
      <div className="tutorial-page__inner">
        <header>
          <h1>Tutoriales</h1>
          <p className="tutorial-page__muted">
            Aprende a resolver tu cubo paso a paso.
          </p>
        </header>

        <form className="tutorial-page__filters" onSubmit={buscar}>
          <label>
            Buscar tutoriales
            <input
              type="search"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={150}
              placeholder="Título, notación, aristas…"
            />
          </label>

          <label>
            Tipo de cubo
            <select
              value={tipo}
              onChange={(e) => filtrar('tipo', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              {datos.tipos.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>

          <label>
            Dificultad
            <select
              value={nivel}
              onChange={(e) => filtrar('nivel', e.target.value)}
            >
              <option value="">Todas las dificultades</option>
              {Object.entries(NIVELES).map(([valor, nombre]) => (
                <option key={valor} value={valor}>{nombre}</option>
              ))}
            </select>
          </label>

          <div className="tutorial-page__actions">
            <button className="btn btn--primary" type="submit">
              Buscar
            </button>

            <button
              className="btn btn--ghost"
              type="button"
              onClick={() => {
                setTexto('');
                setParams({});
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        {cargando ? (
          <p role="status">Cargando tutoriales…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : datos.tutoriales.length === 0 ? (
          <p>No encontramos tutoriales con esos criterios.</p>
        ) : (
          <div className="tutorial-page__grid">
            {datos.tutoriales.map((t) => {
              const pasos = Number(t.steps_count);

              return (
                <article className="tutorial-page__card" key={t.id}>
                  {t.cover_image ? (
                    <img
                      className="tutorial-page__thumb"
                      src={t.cover_image}
                      alt=""
                      loading="lazy"
                    />
                  ) : (
                    <div className="tutorial-page__placeholder">
                      Guía paso a paso
                    </div>
                  )}

                  <div className="tutorial-page__card-body">
                    <h2>{t.title}</h2>

                    <p className="tutorial-page__muted">
                      {t.cube_type} · {NIVELES[t.difficulty]}
                    </p>

                    {t.description && <p>{t.description}</p>}

                    <p className="tutorial-page__muted">
                      {pasos} {pasos === 1 ? 'paso' : 'pasos'}
                    </p>

                    <Link
                      to={`/tutoriales/${t.id}`}
                      className="btn btn--primary"
                    >
                      Leer tutorial
                    </Link>
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

export default TutorialsPage;