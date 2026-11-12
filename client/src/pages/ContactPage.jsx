import { useState } from 'react';
import { peticion } from '../api';
import './contact.css';

const DIRECCION =
  'Carretera Manzana 034, Tepexpan Centro, 55885 Tepexpan, Estado de México';

const CONSULTA_MAPA = encodeURIComponent(DIRECCION);

const VACIO = {
  name: '',
  email: '',
  message: '',
};

function ContactPage() {
  const [form, setForm] = useState({ ...VACIO });
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  function cambiar(e) {
    const { name, value } = e.target;

    setForm((actual) => ({
      ...actual,
      [name]: value,
    }));
  }

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;

    setEnviando(true);
    setError('');
    setMensaje('');

    try {
      const respuesta = await peticion('/contacto', {
        method: 'POST',
        body: JSON.stringify(form),
      });

      setMensaje(respuesta.mensaje);
      setForm({ ...VACIO });
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="contact">
      <div className="contact__inner">
        <header>
          <h1>Contacto</h1>
          <p className="contact__muted">
            Resuelve tus dudas o envíanos un mensaje.
          </p>
        </header>

        <div className="contact__grid">
          <section className="contact__card">
            <h2>Encuéntranos</h2>

            <dl className="contact__info">
              <div>
                <dt>Teléfono</dt>
                <dd>
                  <a href="tel:+525567676767">
                    55 6767 6767
                  </a>
                </dd>
              </div>

              <div>
                <dt>Correo electrónico</dt>
                <dd>
                  <a href="mailto:ganileeyt@gmail.com">
                    ganileeyt@gmail.com
                  </a>
                </dd>
              </div>

              <div>
                <dt>Horario de atención</dt>
                <dd>
                  Lunes a sábado
                  <br />
                  De 9:00 a. m. a 5:00 p. m.
                </dd>
              </div>

              <div>
                <dt>Dirección</dt>
                <dd>{DIRECCION}</dd>
              </div>
            </dl>
          </section>

          <section className="contact__card">
            <h2>Escríbenos</h2>

            <form className="contact__form" onSubmit={enviar}>
              <fieldset disabled={enviando}>
                <label>
                  Nombre
                  <input
                    name="name"
                    value={form.name}
                    onChange={cambiar}
                    maxLength={100}
                    autoComplete="name"
                    required
                  />
                </label>

                <label>
                  Correo electrónico
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={cambiar}
                    maxLength={150}
                    autoComplete="email"
                    required
                  />
                </label>

                <label>
                  Mensaje
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={cambiar}
                    maxLength={5000}
                    rows={6}
                    required
                  />
                </label>

                {error && (
                  <p className="contact__error" role="alert">
                    {error}
                  </p>
                )}

                {mensaje && (
                  <p className="contact__success" role="status">
                    {mensaje}
                  </p>
                )}

                <button type="submit" className="btn btn--primary">
                  {enviando ? 'Enviando…' : 'Enviar mensaje'}
                </button>
              </fieldset>
            </form>
          </section>
        </div>

        <section className="contact__card">
          <h2>Ubicación</h2>

          <iframe
            className="contact__map"
            title="Ubicación de CubeLand"
            src={`https://www.google.com/maps?q=${CONSULTA_MAPA}&output=embed`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />

          <a
            href={`https://www.google.com/maps/search/?api=1&query=${CONSULTA_MAPA}`}
            className="btn btn--ghost"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Maps
          </a>
        </section>
      </div>
    </section>
  );
}

export default ContactPage;