import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { peticion } from '../api';
import { useCart } from '../context/CartContext';
import { ESTADOS } from '../utils/estados';
import './checkout.css';

const moneda = (n) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const FORM_VACIO = {
  recipientName: '',
  street: '',
  city: '',
  state: '',
  postalCode: '',
  phone: '',
};

function CheckoutPage() {
  const navigate = useNavigate();
  const { items, total, cargando, recargar } = useCart();

  const [direcciones, setDirecciones] = useState([]);
  const [direccionesListas, setDireccionesListas] = useState(false);
  const [entrega, setEntrega] = useState('delivery');
  const [direccionId, setDireccionId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);
  const [pago, setPago] = useState('');
  const [costos, setCostos] = useState({});
  const [sinCobertura, setSinCobertura] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Direcciones guardadas del usuario
  useEffect(() => {
    let vigente = true;
    peticion('/direcciones')
      .then((datos) => {
        if (!vigente) return;
        setDirecciones(datos);
        setDireccionId(datos[0]?.id ?? null);
        setMostrarForm(datos.length === 0);
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      })
      .finally(() => {
        if (vigente) setDireccionesListas(true);
      });
    return () => {
      vigente = false;
    };
  }, []);

  const seleccionada = direcciones.find((d) => d.id === direccionId) || null;
  const estadoSel = entrega === 'delivery' && seleccionada ? seleccionada.state : null;

  // Costo de envío del estado de la dirección elegida
  useEffect(() => {
    if (!estadoSel || costos[estadoSel] !== undefined || sinCobertura[estadoSel]) return;
    let vigente = true;
    peticion(`/envio/costo?estado=${encodeURIComponent(estadoSel)}`)
      .then((r) => {
        if (vigente) setCostos((c) => ({ ...c, [estadoSel]: r.costo }));
      })
      .catch((e) => {
        if (vigente) setSinCobertura((s) => ({ ...s, [estadoSel]: e.message }));
      });
    return () => {
      vigente = false;
    };
  }, [estadoSel, costos, sinCobertura]);

  const costoEnvio = entrega === 'pickup' ? 0 : estadoSel ? costos[estadoSel] : undefined;
  const avisoCobertura = estadoSel ? sinCobertura[estadoSel] : null;
  const envioListo = entrega === 'pickup' || (costoEnvio !== undefined && !avisoCobertura);

  function cambiarEntrega(valor) {
    setEntrega(valor);
    if (valor === 'delivery' && pago === 'pay_in_store') setPago('');
  }

  function cambiarCampo(nombre, valor) {
    setForm((f) => ({ ...f, [nombre]: valor }));
  }

  async function guardarDireccion(e) {
    e.preventDefault();
    setError(null);
    try {
      const { id } = await peticion('/direcciones', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setDirecciones(await peticion('/direcciones'));
      setDireccionId(id);
      setMostrarForm(false);
      setForm(FORM_VACIO);
    } catch (err) {
      setError(err.message);
    }
  }

  async function confirmar() {
    setError(null);
    if (entrega === 'delivery' && !seleccionada) {
      return setError('Elige o agrega una dirección de entrega');
    }
    if (!pago) {
      return setError('Elige un método de pago');
    }

    setEnviando(true);
    try {
      const { id } = await peticion('/pedidos', {
        method: 'POST',
        body: JSON.stringify({
          deliveryType: entrega,
          paymentMethod: pago,
          addressId: seleccionada?.id,
        }),
      });
      await recargar().catch(() => {});
      navigate(`/pedidos/${id}`, { replace: true, state: { nuevo: true } });
    } catch (e) {
      setError(e.message);
      setEnviando(false);
    }
  }

  if (cargando || !direccionesListas) {
    return <p className="co__msg">Cargando…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="co__msg">
        <p>Tu carrito está vacío.</p>
        <Link to="/catalogo" className="btn btn--primary">Ver el catálogo</Link>
      </div>
    );
  }

  const totalFinal = total + (costoEnvio || 0);

  return (
    <section className="co">
      <div className="co__inner">
        <h1 className="co__title">Finalizar pedido</h1>

        <div className="co__layout">
          <div className="co__steps">
            <fieldset className="co__box">
              <legend>1. Entrega</legend>
              <label className="co__option">
                <input type="radio" name="entrega" checked={entrega === 'delivery'} onChange={() => cambiarEntrega('delivery')} />
                <span>Envío a domicilio</span>
              </label>
              <label className="co__option">
                <input type="radio" name="entrega" checked={entrega === 'pickup'} onChange={() => cambiarEntrega('pickup')} />
                <span>Recolección en tienda (Tepexpan, Acolman) · sin costo</span>
              </label>
            </fieldset>

            {entrega === 'delivery' && (
              <fieldset className="co__box">
                <legend>2. Dirección de entrega</legend>

                {direcciones.map((d) => (
                  <label className="co__option" key={d.id}>
                    <input type="radio" name="direccion" checked={d.id === direccionId} onChange={() => setDireccionId(d.id)} />
                    <span>
                      <strong>{d.recipient_name}</strong>
                      <br />
                      {d.street}, {d.city}, {d.state}, C.P. {d.postal_code}
                    </span>
                  </label>
                ))}

                {avisoCobertura && <p className="co__error">{avisoCobertura}</p>}

                {!mostrarForm && (
                  <button type="button" className="btn btn--ghost btn--sm co__add" onClick={() => setMostrarForm(true)}>
                    + Agregar otra dirección
                  </button>
                )}

                {mostrarForm && (
                  <form className="co__form" onSubmit={guardarDireccion}>
                    <div className="co__field co__field--wide">
                      <label htmlFor="recipientName">Nombre de quien recibe</label>
                      <input id="recipientName" required maxLength={100} value={form.recipientName} onChange={(e) => cambiarCampo('recipientName', e.target.value)} />
                    </div>
                    <div className="co__field co__field--wide">
                      <label htmlFor="street">Calle, número y colonia</label>
                      <input id="street" required maxLength={200} value={form.street} onChange={(e) => cambiarCampo('street', e.target.value)} />
                    </div>
                    <div className="co__field">
                      <label htmlFor="city">Ciudad o municipio</label>
                      <input id="city" required maxLength={80} value={form.city} onChange={(e) => cambiarCampo('city', e.target.value)} />
                    </div>
                    <div className="co__field">
                      <label htmlFor="state">Estado</label>
                      <select id="state" required value={form.state} onChange={(e) => cambiarCampo('state', e.target.value)}>
                        <option value="">Elige un estado</option>
                        {ESTADOS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                    <div className="co__field">
                      <label htmlFor="postalCode">Código postal</label>
                      <input id="postalCode" required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} value={form.postalCode} onChange={(e) => cambiarCampo('postalCode', e.target.value)} />
                    </div>
                    <div className="co__field">
                      <label htmlFor="phone">Teléfono (10 dígitos, opcional)</label>
                      <input id="phone" inputMode="numeric" value={form.phone} onChange={(e) => cambiarCampo('phone', e.target.value)} />
                    </div>
                    <div className="co__form-actions">
                      <button className="btn btn--primary btn--sm" type="submit">Guardar dirección</button>
                      {direcciones.length > 0 && (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setMostrarForm(false)}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </fieldset>
            )}

            <fieldset className="co__box">
              <legend>{entrega === 'delivery' ? '3' : '2'}. Método de pago</legend>
              <label className="co__option">
                <input type="radio" name="pago" checked={pago === 'bank_transfer'} onChange={() => setPago('bank_transfer')} />
                <span>Transferencia bancaria</span>
              </label>
              {entrega === 'pickup' ? (
                <label className="co__option">
                  <input type="radio" name="pago" checked={pago === 'pay_in_store'} onChange={() => setPago('pay_in_store')} />
                  <span>Pago en tienda al recoger</span>
                </label>
              ) : (
                <p className="co__hint">El pago en tienda solo está disponible con recolección en tienda.</p>
              )}
            </fieldset>
          </div>

          <aside className="co__summary">
            <h2 className="co__summary-title">Resumen</h2>
            <ul className="co__items">
              {items.map((i) => (
                <li key={i.productId}>
                  <span>{i.name} × {i.quantity}</span>
                  <span>{moneda(i.subtotal)}</span>
                </li>
              ))}
            </ul>

            <div className="co__line"><span>Subtotal</span><span>{moneda(total)}</span></div>
            <div className="co__line">
              <span>Envío</span>
              <span>
                {entrega === 'pickup'
                  ? 'Sin costo'
                  : costoEnvio !== undefined
                  ? moneda(costoEnvio)
                  : avisoCobertura
                  ? 'No disponible'
                  : 'Calculando…'}
              </span>
            </div>
            <div className="co__line co__line--total">
              <span>Total</span>
              <span>{envioListo ? moneda(totalFinal) : '—'}</span>
            </div>

            {error && <p className="co__error">{error}</p>}

            <button className="btn btn--primary co__confirm" onClick={confirmar} disabled={enviando || !envioListo}>
              {enviando ? 'Procesando…' : 'Confirmar pedido'}
            </button>
            <Link to="/carrito" className="btn btn--ghost co__confirm co__back">Volver al carrito</Link>
          </aside>
        </div>
      </div>
    </section>
  );
}

export default CheckoutPage;