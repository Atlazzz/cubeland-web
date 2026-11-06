import { useEffect, useState } from 'react';
import { peticion } from '../api';
import AdminNav from '../components/AdminNav';
import './admin.css';
import './admin-tutorials.css';

const NIVELES = {
  beginner: 'Principiante',
  easy: 'Fácil',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

const clave = () => crypto.randomUUID();

function nuevoTutorial() {
  return {
    title: '',
    description: '',
    cover_image: '',
    cube_type_id: '',
    difficulty: 'beginner',
    is_active: false,
    blocks: [],
    steps: [],
  };
}

function nuevoCaso() {
  return {
    _key: clave(),
    case_image_url: '',
    case_image_alt: '',
    description: '',
    algorithm: '',
    moves_image_url: '',
    moves_image_alt: '',
  };
}

function nuevoPaso() {
  return {
    _key: clave(),
    title: '',
    instruction: '',
    image_url: '',
    cases: [],
  };
}

function nuevoBloque(tipo) {
  return {
    _key: clave(),
    block_type: tipo,
    text_content: '',
    image_url: '',
    image_alt: '',
  };
}

// Convierte valores NULL de MySQL a campos editables.
function prepararTutorial(t) {
  return {
    title: t.title || '',
    description: t.description || '',
    cover_image: t.cover_image || '',
    cube_type_id: String(t.cube_type_id),
    difficulty: t.difficulty,
    is_active: Boolean(t.is_active),
    blocks: t.blocks.map((b) => ({
      _key: clave(),
      block_type: b.block_type,
      text_content: b.text_content || '',
      image_url: b.image_url || '',
      image_alt: b.image_alt || '',
    })),
    steps: t.steps.map((s) => ({
      _key: clave(),
      title: s.title || '',
      instruction: s.instruction || '',
      image_url: s.image_url || '',
      cases: s.cases.map((c) => ({
        _key: clave(),
        case_image_url: c.case_image_url || '',
        case_image_alt: c.case_image_alt || '',
        description: c.description || '',
        algorithm: c.algorithm || '',
        moves_image_url: c.moves_image_url || '',
        moves_image_alt: c.moves_image_alt || '',
      })),
    })),
  };
}

function mover(lista, indice, desplazamiento) {
  const destino = indice + desplazamiento;

  if (destino < 0 || destino >= lista.length) return lista;

  const copia = [...lista];
  [copia[indice], copia[destino]] = [copia[destino], copia[indice]];

  return copia;
}

function Campo({
  etiqueta,
  valor,
  alCambiar,
  multilinea = false,
  obligatorio = false,
  maximo,
}) {
  const propiedades = {
    value: valor,
    onChange: (e) => alCambiar(e.target.value),
    required: obligatorio,
    maxLength: maximo,
  };

  return (
    <label>
      {etiqueta}
      {multilinea ? (
        <textarea {...propiedades} rows={4} />
      ) : (
        <input {...propiedades} type="text" />
      )}
    </label>
  );
}

function Ordenar({ indice, total, alMover, alEliminar }) {
  return (
    <div className="admin__actions">
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={indice === 0}
        onClick={() => alMover(-1)}
        aria-label="Mover hacia arriba"
      >
        Subir
      </button>

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        disabled={indice === total - 1}
        onClick={() => alMover(1)}
        aria-label="Mover hacia abajo"
      >
        Bajar
      </button>

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={alEliminar}
      >
        Quitar
      </button>
    </div>
  );
}

function AdminTutorialsPage() {
  const [datos, setDatos] = useState({
    tutoriales: [],
    tipos: [],
  });
  const [form, setForm] = useState(nuevoTutorial);
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [modificado, setModificado] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    peticion('/tutoriales/admin')
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
  }, []);

  function modificar(transformar) {
    setForm(transformar);
    setModificado(true);
    setMensaje('');
  }

  function cambiar(campo, valor) {
    modificar((actual) => ({ ...actual, [campo]: valor }));
  }

  function cambiarBloque(indice, campo, valor) {
    modificar((actual) => ({
      ...actual,
      blocks: actual.blocks.map((b, i) =>
        i === indice ? { ...b, [campo]: valor } : b
      ),
    }));
  }

  function cambiarPaso(indice, campo, valor) {
    modificar((actual) => ({
      ...actual,
      steps: actual.steps.map((s, i) =>
        i === indice ? { ...s, [campo]: valor } : s
      ),
    }));
  }

  function cambiarCaso(paso, caso, campo, valor) {
    modificar((actual) => ({
      ...actual,
      steps: actual.steps.map((s, i) =>
        i === paso
          ? {
              ...s,
              cases: s.cases.map((c, j) =>
                j === caso ? { ...c, [campo]: valor } : c
              ),
            }
          : s
      ),
    }));
  }

  function permitirDescartar() {
    return (
      !modificado ||
      window.confirm('¿Descartar los cambios que no has guardado?')
    );
  }

  function nuevo() {
    if (!permitirDescartar()) return;

    setForm(nuevoTutorial());
    setEditando(null);
    setModificado(false);
    setError('');
    setMensaje('');
  }

  async function cargarLista() {
    const respuesta = await peticion('/tutoriales/admin');
    setDatos(respuesta);
  }

  async function editar(id) {
    if (ocupado || !permitirDescartar()) return;

    setOcupado(true);
    setError('');
    setMensaje('');

    try {
      const tutorial = await peticion(`/tutoriales/admin/${id}`);
      setForm(prepararTutorial(tutorial));
      setEditando(id);
      setModificado(false);

      document.getElementById('tutorial-editor')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(false);
    }
  }

  async function guardar(e) {
    e.preventDefault();
    if (ocupado) return;

    setOcupado(true);
    setError('');
    setMensaje('');

    let guardado = false;

    try {
      const respuesta = await peticion(
        editando
          ? `/tutoriales/admin/${editando}`
          : '/tutoriales/admin',
        {
          method: editando ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        }
      );

      guardado = true;
      setEditando(respuesta.id);
      setModificado(false);
      setMensaje(respuesta.mensaje);

      await cargarLista();
    } catch (e) {
      setError(
        guardado
          ? 'El tutorial se guardó, pero no se pudo actualizar la lista. Recarga la página.'
          : e.message
      );
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar(tutorial) {
    if (ocupado) return;

    if (
      !window.confirm(
        `¿Eliminar "${tutorial.title}" junto con todos sus bloques, pasos y casos?`
      )
    ) {
      return;
    }

    if (editando === tutorial.id && !permitirDescartar()) return;

    setOcupado(true);
    setError('');
    setMensaje('');

    let eliminado = false;

    try {
      await peticion(`/tutoriales/admin/${tutorial.id}`, {
        method: 'DELETE',
      });

      eliminado = true;

      if (editando === tutorial.id) {
        setForm(nuevoTutorial());
        setEditando(null);
        setModificado(false);
      }

      setMensaje('Tutorial eliminado.');
      await cargarLista();
    } catch (e) {
      setError(
        eliminado
          ? 'El tutorial se eliminó, pero no se pudo actualizar la lista. Recarga la página.'
          : e.message
      );
    } finally {
      setOcupado(false);
    }
  }

  function quitar(confirmacion, accion) {
    if (window.confirm(confirmacion)) accion();
  }

  return (
    <section className="admin">
      <h1>Administración de tutoriales</h1>
      <AdminNav />

      {error && (
        <p className="admin__error" role="alert">{error}</p>
      )}

      {mensaje && (
        <p className="admin__success" role="status">{mensaje}</p>
      )}

      {cargando ? (
        <p role="status">Cargando tutoriales…</p>
      ) : (
        <>
          <div className="admin__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={ocupado}
              onClick={nuevo}
            >
              Nuevo tutorial
            </button>
          </div>

          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th scope="col">Título</th>
                  <th scope="col">Tipo</th>
                  <th scope="col">Dificultad</th>
                  <th scope="col">Publicación</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {datos.tutoriales.map((t) => (
                  <tr key={t.id}>
                    <td>{t.title}</td>
                    <td>{t.cube_type}</td>
                    <td>{NIVELES[t.difficulty]}</td>
                    <td>{t.is_active ? 'Publicado' : 'Borrador'}</td>
                    <td>
                      <div className="admin__actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={ocupado}
                          onClick={() => editar(t.id)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          disabled={ocupado}
                          onClick={() => eliminar(t)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {datos.tutoriales.length === 0 && (
                  <tr>
                    <td colSpan={5}>Todavía no hay tutoriales.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <form
            id="tutorial-editor"
            className="admin__form"
            onSubmit={guardar}
          >
            <h2>
              {editando ? `Editar tutorial #${editando}` : 'Nuevo tutorial'}
            </h2>

            <fieldset disabled={ocupado}>
              <Campo
                etiqueta="Título general"
                valor={form.title}
                alCambiar={(v) => cambiar('title', v)}
                obligatorio
                maximo={150}
              />

              <Campo
                etiqueta="Ruta o URL de la portada (opcional)"
                valor={form.cover_image}
                alCambiar={(v) => cambiar('cover_image', v)}
                maximo={255}
              />

              <div className="admin__grid">
                <label>
                  Tipo de cubo
                  <select
                    value={form.cube_type_id}
                    onChange={(e) => cambiar('cube_type_id', e.target.value)}
                    required
                  >
                    <option value="">Selecciona un tipo</option>
                    {datos.tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Dificultad
                  <select
                    value={form.difficulty}
                    onChange={(e) => cambiar('difficulty', e.target.value)}
                    required
                  >
                    {Object.entries(NIVELES).map(([valor, nombre]) => (
                      <option key={valor} value={valor}>{nombre}</option>
                    ))}
                  </select>
                </label>
              </div>

              <Campo
                etiqueta="Resumen corto para el listado"
                valor={form.description}
                alCambiar={(v) => cambiar('description', v)}
                multilinea
                maximo={255}
              />

              <h2>Descripción general</h2>
              <p className="tut-admin__help">
                Agrega texto e imágenes para explicar las piezas, caras,
                notación y conceptos necesarios.
              </p>

              {form.blocks.map((b, i) => (
                <section className="tut-admin__box" key={b._key}>
                  <h3>
                    Bloque {i + 1}: {b.block_type === 'text' ? 'Texto' : 'Imagen'}
                  </h3>

                  {b.block_type === 'text' ? (
                    <Campo
                      etiqueta="Texto"
                      valor={b.text_content}
                      alCambiar={(v) => cambiarBloque(i, 'text_content', v)}
                      multilinea
                      obligatorio
                      maximo={15000}
                    />
                  ) : (
                    <>
                      <Campo
                        etiqueta="Ruta o URL de la imagen"
                        valor={b.image_url}
                        alCambiar={(v) => cambiarBloque(i, 'image_url', v)}
                        obligatorio
                        maximo={500}
                      />

                      <Campo
                        etiqueta="Descripción de la imagen"
                        valor={b.image_alt}
                        alCambiar={(v) => cambiarBloque(i, 'image_alt', v)}
                        obligatorio
                        maximo={255}
                      />
                    </>
                  )}

                  <Ordenar
                    indice={i}
                    total={form.blocks.length}
                    alMover={(direccion) =>
                      modificar((actual) => ({
                        ...actual,
                        blocks: mover(actual.blocks, i, direccion),
                      }))
                    }
                    alEliminar={() =>
                      quitar('¿Quitar este bloque?', () =>
                        modificar((actual) => ({
                          ...actual,
                          blocks: actual.blocks.filter((_, j) => j !== i),
                        }))
                      )
                    }
                  />
                </section>
              ))}

              <div className="admin__actions">
                {['text', 'image'].map((tipo) => (
                  <button
                    key={tipo}
                    type="button"
                    className="btn btn--ghost"
                    disabled={form.blocks.length >= 100}
                    onClick={() =>
                      modificar((actual) => ({
                        ...actual,
                        blocks: [...actual.blocks, nuevoBloque(tipo)],
                      }))
                    }
                  >
                    {tipo === 'text' ? 'Agregar texto' : 'Agregar imagen'}
                  </button>
                ))}
              </div>

              <h2>Pasos de resolución</h2>

              {form.steps.map((s, i) => (
                <section className="tut-admin__box" key={s._key}>
                  <h3>Paso {i + 1}</h3>

                  <Campo
                    etiqueta="Título del paso"
                    valor={s.title}
                    alCambiar={(v) => cambiarPaso(i, 'title', v)}
                    obligatorio
                    maximo={120}
                  />

                  <Campo
                    etiqueta="Introducción"
                    valor={s.instruction}
                    alCambiar={(v) => cambiarPaso(i, 'instruction', v)}
                    multilinea
                    maximo={15000}
                  />

                  <Campo
                    etiqueta="Imagen general del paso (opcional)"
                    valor={s.image_url}
                    alCambiar={(v) => cambiarPaso(i, 'image_url', v)}
                    maximo={255}
                  />

                  {s.cases.map((c, j) => (
                    <section className="tut-admin__case" key={c._key}>
                      <h4>Caso {j + 1}</h4>

                      <Campo
                        etiqueta="Imagen del caso (opcional)"
                        valor={c.case_image_url}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'case_image_url', v)
                        }
                        maximo={500}
                      />

                      <Campo
                        etiqueta="Descripción de la imagen del caso"
                        valor={c.case_image_alt}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'case_image_alt', v)
                        }
                        obligatorio={Boolean(c.case_image_url.trim())}
                        maximo={255}
                      />

                      <Campo
                        etiqueta="Descripción del caso"
                        valor={c.description}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'description', v)
                        }
                        multilinea
                        obligatorio
                        maximo={15000}
                      />

                      <Campo
                        etiqueta="Algoritmo (opcional)"
                        valor={c.algorithm}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'algorithm', v)
                        }
                        maximo={500}
                      />

                      <Campo
                        etiqueta="Imagen de movimientos (opcional)"
                        valor={c.moves_image_url}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'moves_image_url', v)
                        }
                        maximo={500}
                      />

                      <Campo
                        etiqueta="Descripción de la imagen de movimientos"
                        valor={c.moves_image_alt}
                        alCambiar={(v) =>
                          cambiarCaso(i, j, 'moves_image_alt', v)
                        }
                        obligatorio={Boolean(c.moves_image_url.trim())}
                        maximo={255}
                      />

                      <Ordenar
                        indice={j}
                        total={s.cases.length}
                        alMover={(direccion) =>
                          cambiarPaso(
                            i,
                            'cases',
                            mover(s.cases, j, direccion)
                          )
                        }
                        alEliminar={() =>
                          quitar('¿Quitar este caso?', () =>
                            cambiarPaso(
                              i,
                              'cases',
                              s.cases.filter((_, indice) => indice !== j)
                            )
                          )
                        }
                      />
                    </section>
                  ))}

                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={s.cases.length >= 100}
                    onClick={() =>
                      cambiarPaso(i, 'cases', [...s.cases, nuevoCaso()])
                    }
                  >
                    Agregar caso
                  </button>

                  <Ordenar
                    indice={i}
                    total={form.steps.length}
                    alMover={(direccion) =>
                      modificar((actual) => ({
                        ...actual,
                        steps: mover(actual.steps, i, direccion),
                      }))
                    }
                    alEliminar={() =>
                      quitar('¿Quitar este paso y todos sus casos?', () =>
                        modificar((actual) => ({
                          ...actual,
                          steps: actual.steps.filter((_, j) => j !== i),
                        }))
                      )
                    }
                  />
                </section>
              ))}

              <button
                type="button"
                className="btn btn--ghost"
                disabled={form.steps.length >= 255}
                onClick={() =>
                  modificar((actual) => ({
                    ...actual,
                    steps: [...actual.steps, nuevoPaso()],
                  }))
                }
              >
                Agregar paso
              </button>

              <label className="admin__check">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => cambiar('is_active', e.target.checked)}
                />
                Publicar tutorial
              </label>

              <p className="tut-admin__help">
                Si no marcas esta casilla, se guardará como borrador.
                Para publicarlo necesitas al menos un paso.
              </p>

              <div className="admin__actions">
                <button type="submit" className="btn btn--primary">
                  {ocupado ? 'Guardando…' : 'Guardar tutorial'}
                </button>
              </div>

              {modificado && (
                <p className="tut-admin__help">
                  Tienes cambios sin guardar.
                </p>
              )}
            </fieldset>
          </form>
        </>
      )}
    </section>
  );
}

export default AdminTutorialsPage;