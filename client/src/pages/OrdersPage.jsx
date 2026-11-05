import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { peticion } from '../api';
import './order.css';
import './orders.css';

const ESTADOS = {
  pending_payment: 'Pendiente de pago',
  preparing: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const ENTREGAS = {
  delivery: 'Envío a domicilio',
  pickup: 'Recolección en tienda',
};

const moneda = (valor) =>
  Number(valor).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

const numeroPedido = (id) => `CL-${String(id).padStart(5, '0')}`;

const fechaPedido = (fecha) =>
  new Date(fecha).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

function OrdersPage() {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let activo = true;

    peticion('/pedidos')
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
  }, [intento]);

  function reintentar() {
    setError('');
    setCargando(true);
    setIntento((actual) => actual + 1);
  }

  return (
    <section className="hist">
      <div className="hist__inner">
        <div>
          <h1 className="hist__title">Mis pedidos</h1>
          <p className="hist__intro">
            Consulta tus compras y el estado de cada pedido.
          </p>
        </div>

        {cargando ? (
          <p className="hist__message" role="status">
            Cargando tus pedidos…
          </p>
        ) : error ? (
          <div className="hist__empty">
            <p role="alert">{error}</p>
            <button
              type="button"
              className="btn btn--primary"
              onClick={reintentar}
            >
              Reintentar
            </button>
          </div>
        ) : pedidos.length === 0 ? (
          <div className="hist__empty">
            <h2>Todavía no tienes pedidos</h2>
            <p>
              Cuando realices tu primera compra, podrás consultarla aquí.
            </p>
            <Link to="/catalogo" className="btn btn--primary">
              Explorar catálogo
            </Link>
          </div>
        ) : (
          <ul className="hist__list">
            {pedidos.map((pedido) => (
              <li key={pedido.id}>
                <article className="hist__card">
                  <div className="hist__head">
                    <div>
                      <h2 className="hist__number">
                        Pedido {numeroPedido(pedido.id)}
                      </h2>
                      <p className="hist__date">
                        {fechaPedido(pedido.createdAt)}
                      </p>
                    </div>

                    <span
                      className={`ord__status ord__status--${pedido.status}`}
                    >
                      {ESTADOS[pedido.status] || pedido.status}
                    </span>
                  </div>

                  <div className="hist__details">
                    <div>
                      <p>{ENTREGAS[pedido.deliveryType]}</p>
                      <p className="hist__pieces">
                        {pedido.pieces}{' '}
                        {pedido.pieces === 1 ? 'artículo' : 'artículos'}
                      </p>
                    </div>

                    <p className="hist__total">
                      Total: <strong>{moneda(pedido.total)}</strong>
                    </p>
                  </div>

                  <Link
                    to={`/pedidos/${pedido.id}`}
                    className="btn btn--ghost btn--sm"
                    aria-label={`Ver detalle del pedido ${numeroPedido(pedido.id)}`}
                  >
                    Ver detalle
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

export default OrdersPage;