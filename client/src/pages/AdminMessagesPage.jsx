import { useEffect, useState } from 'react';
import { peticion } from '../api';
import AdminNav from '../components/AdminNav';
import './admin.css';

function AdminMessagesPage() {
  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    peticion('/contacto/admin')
      .then((datos) => {
        if (activo) setMensajes(datos);
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

  async function cambiarLeido(mensaje) {
    if (actualizando !== null) return;

    setActualizando(mensaje.id);
    setError('');

    const nuevoEstado = !mensaje.is_read;

    try {
      await peticion(`/contacto/admin/${mensaje.id}/leido`, {
        method: 'PATCH',
        body: JSON.stringify({ is_read: nuevoEstado }),
      });

      setMensajes((actuales) =>
        actuales.map((m) =>
          m.id === mensaje.id
            ? { ...m, is_read: nuevoEstado }
            : m
        )
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setActualizando(null);
    }
  }

  return (
    <section className="admin">
      <h1>Mensajes de contacto</h1>
      <AdminNav />

      {error && (
        <p className="admin__error" role="alert">
          {error}
        </p>
      )}

      {cargando ? (
        <p role="status">Cargando mensajes…</p>
      ) : mensajes.length === 0 ? (
        <p>Todavía no hay mensajes.</p>
      ) : (
        mensajes.map((m) => (
          <article className="admin__form" key={m.id}>
            <div className="admin__actions">
              <h2>{m.name}</h2>
              <span>{m.is_read ? 'Leído' : 'Pendiente de leer'}</span>
            </div>

            <a href={`mailto:${encodeURIComponent(m.email)}`}>
              {m.email}
            </a>

            <p className="admin__message-date">
              {new Date(m.created_at).toLocaleString('es-MX')}
            </p>

            <p className="admin__message-text">{m.message}</p>

            <div className="admin__actions">
              <button
                type="button"
                className="btn btn--ghost btn--sm"
                disabled={actualizando !== null}
                onClick={() => cambiarLeido(m)}
              >
                {actualizando === m.id
                  ? 'Guardando…'
                  : m.is_read
                    ? 'Marcar como no leído'
                    : 'Marcar como leído'}
              </button>
            </div>
          </article>
        ))
      )}
    </section>
  );
}

export default AdminMessagesPage;