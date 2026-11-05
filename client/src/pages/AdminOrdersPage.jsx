import { useEffect, useState } from 'react';
import { peticion } from '../api';
import AdminNav from '../components/AdminNav';
import './admin.css';

const ESTADOS = {
  pending_payment: 'Pendiente de pago',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const PAGOS = {
  bank_transfer: 'Transferencia bancaria',
  pay_in_store: 'Pago en tienda',
};

const ENTREGAS = {
  delivery: 'Envío a domicilio',
  pickup: 'Recolección en tienda',
};

const numeroPedido = (id) => `CL-${String(id).padStart(5, '0')}`;

const moneda = (valor) =>
  Number(valor).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

function PedidoAdmin({ id, alActualizar }) {
  const [pedido, setPedido] = useState(null);
  const [estado, setEstado] = useState('');
  const [pagoConfirmado, setPagoConfirmado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    let activo = true;

    peticion(`/admin/pedidos/${id}`)
      .then((datos) => {
        if (activo) setPedido(datos);
      })
      .catch((e) => {
        if (activo) setError(e.message);
      });

    return () => {
      activo = false;
    };
  }, [id]);

  if (!pedido) {
    return (
      <p role={error ? 'alert' : 'status'}>
        {error || 'Cargando detalle…'}
      </p>
    );
  }

  const requierePago =
    (pedido.paymentMethod === 'bank_transfer' &&
      pedido.status === 'pending_payment' &&
      estado === 'preparing') ||
    (pedido.paymentMethod === 'pay_in_store' &&
      estado === 'delivered');

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;

    if (!estado) {
      setError('Selecciona el nuevo estado');
      return;
    }

    if (
      estado === 'cancelled' &&
      !window.confirm(
        `¿Cancelar ${numeroPedido(id)} y devolver sus existencias?`
      )
    ) {
      return;
    }

    setGuardando(true);
    setError('');
    setMensaje('');

    let actualizado = false;

    try {
      const respuesta = await peticion(
        `/admin/pedidos/${id}/estado`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: estado,
            expectedStatus: pedido.status,
            paymentConfirmed: pagoConfirmado,
          }),
        }
      );

      actualizado = true;

      // Actualiza el detalle local aunque falle la recarga de la lista.
      setPedido((actual) => ({
        ...actual,
        status: estado,
        allowedStatuses: [],
      }));
      setEstado('');
      setPagoConfirmado(false);
      setMensaje(respuesta.mensaje);

      const detalle = await peticion(`/admin/pedidos/${id}`);
      setPedido(detalle);

      await alActualizar();
    } catch (e) {
      setError(
        actualizado
          ? 'El estado se guardó, pero no se pudo actualizar toda la información. Recarga la página.'
          : e.message
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <article className="admin__form">
      <h2>Pedido {numeroPedido(pedido.id)}</h2>

      {error && <p className="admin__error" role="alert">{error}</p>}
      {mensaje && (
        <p className="admin__success" role="status">{mensaje}</p>
      )}

      <div className="admin__grid">
        <div>
          <p><strong>Cliente:</strong> {pedido.customerName}</p>
          <p><strong>Estado:</strong> {ESTADOS[pedido.status]}</p>
          <p><strong>Pago:</strong> {PAGOS[pedido.paymentMethod]}</p>
          <p><strong>Entrega:</strong> {ENTREGAS[pedido.deliveryType]}</p>
        </div>

        <div>
          {pedido.address ? (
            <>
              <p><strong>Dirección de entrega</strong></p>
              <p>{pedido.address.recipientName}</p>
              <p>{pedido.address.street}</p>
              <p>
                {pedido.address.city}, {pedido.address.state},
                C.P. {pedido.address.postalCode}
              </p>
              <p>Tel. {pedido.address.phone}</p>
            </>
          ) : (
            <p>Recolección en tienda.</p>
          )}
        </div>
      </div>

      <div className="admin__table-wrap">
        <table className="admin__table">
          <thead>
            <tr>
              <th scope="col">Producto</th>
              <th scope="col">Cantidad</th>
              <th scope="col">Precio unitario</th>
              <th scope="col">Importe</th>
            </tr>
          </thead>
          <tbody>
            {pedido.items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.quantity}</td>
                <td>{moneda(item.price)}</td>
                <td>{moneda(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <p>Subtotal: {moneda(pedido.subtotal)}</p>
        <p>Envío: {moneda(pedido.shippingCost)}</p>
        <p><strong>Total: {moneda(pedido.total)}</strong></p>
      </div>

      {pedido.allowedStatuses.length > 0 ? (
        <form onSubmit={guardar}>
          <fieldset disabled={guardando}>
            <label>
              Nuevo estado
              <select
                value={estado}
                onChange={(e) => {
                  setEstado(e.target.value);
                  setPagoConfirmado(false);
                }}
                required
              >
                <option value="">Selecciona un estado</option>
                {pedido.allowedStatuses.map((valor) => (
                  <option key={valor} value={valor}>
                    {ESTADOS[valor]}
                  </option>
                ))}
              </select>
            </label>

            {requierePago && (
              <label className="admin__check">
                <input
                  type="checkbox"
                  checked={pagoConfirmado}
                  onChange={(e) => setPagoConfirmado(e.target.checked)}
                  required
                />
                Confirmo que verifiqué el pago de este pedido.
              </label>
            )}

            {estado === 'cancelled' && (
              <p>
                Se devolverán las existencias. Si hubo un pago,
                su reembolso debe gestionarse por separado.
              </p>
            )}

            <button
              className="btn btn--primary"
              type="submit"
              disabled={!estado || guardando}
            >
              {guardando ? 'Guardando…' : 'Actualizar estado'}
            </button>
          </fieldset>
        </form>
      ) : (
        <p>Este pedido no tiene cambios de estado disponibles.</p>
      )}
    </article>
  );
}

function AdminOrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    peticion('/admin/pedidos')
      .then((datos) => {
        if (activo) setPedidos(datos);
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

  async function actualizarLista() {
    const datos = await peticion('/admin/pedidos');
    setPedidos(datos);
  }

  const visibles = pedidos.filter(
    (pedido) => !filtro || pedido.status === filtro
  );

  return (
    <section className="admin">
      <h1>Administración de pedidos</h1>
      <AdminNav />

      {error && <p className="admin__error" role="alert">{error}</p>}

      <label>
        Filtrar por estado
        <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS).map(([valor, nombre]) => (
            <option key={valor} value={valor}>{nombre}</option>
          ))}
        </select>
      </label>

      {cargando ? (
        <p role="status">Cargando pedidos…</p>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th scope="col">Pedido</th>
                <th scope="col">Cliente</th>
                <th scope="col">Fecha</th>
                <th scope="col">Total</th>
                <th scope="col">Estado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((pedido) => (
                <tr key={pedido.id}>
                  <td>{numeroPedido(pedido.id)}</td>
                  <td>{pedido.customerName}</td>
                  <td>
                    {new Date(pedido.createdAt).toLocaleDateString('es-MX')}
                  </td>
                  <td>{moneda(pedido.total)}</td>
                  <td>{ESTADOS[pedido.status]}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setSeleccionado(pedido.id)}
                    >
                      Consultar
                    </button>
                  </td>
                </tr>
              ))}

              {visibles.length === 0 && (
                <tr>
                  <td colSpan={6}>No hay pedidos para mostrar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {seleccionado !== null && (
        <PedidoAdmin
          key={seleccionado}
          id={seleccionado}
          alActualizar={actualizarLista}
        />
      )}
    </section>
  );
}

export default AdminOrdersPage;