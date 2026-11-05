import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { peticion } from '../api';
import './order.css';

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

const INSTRUCCIONES = {
  bank_transfer:
    'Realiza la transferencia con los datos bancarios que te proporcione CubeLand y conserva tu comprobante. Tu pedido se prepara cuando el personal confirme el pago.',
  pay_in_store:
    'Paga en la tienda de CubeLand al recoger tu pedido. Puedes consultar el estado en esta página.',
};

const moneda = (n) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

const numeroPedido = (id) => `CL-${String(id).padStart(5, '0')}`;

function OrderDetail({ id }) {
  const location = useLocation();
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    peticion(`/pedidos/${id}`)
      .then(setPedido)
      .catch((e) =>
        setError(e.status === 404 ? 'No encontramos ese pedido.' : e.message)
      )
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <p className="ord__msg">Cargando pedido…</p>;

  if (error) {
    return (
      <div className="ord__msg">
        <p>{error}</p>
        <Link to="/catalogo" className="btn btn--primary">Ir al catálogo</Link>
      </div>
    );
  }

  const fecha = new Date(pedido.createdAt).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <section className="ord">
      <div className="ord__inner">
        {location.state?.nuevo && (
          <div className="ord__banner">
            <strong>¡Pedido realizado!</strong>
            <span>Tu número de pedido es {numeroPedido(pedido.id)}.</span>
          </div>
        )}

        <div className="ord__head">
          <div>
            <h1 className="ord__title">Pedido {numeroPedido(pedido.id)}</h1>
            <p className="ord__date">{fecha}</p>
          </div>
          <span className={`ord__status ord__status--${pedido.status}`}>
            {ESTADOS[pedido.status]}
          </span>
        </div>

        {pedido.status === 'pending_payment' && (
          <p className="ord__note">{INSTRUCCIONES[pedido.paymentMethod]}</p>
        )}

        <div className="ord__grid">
          <div className="ord__card">
            <h2>Entrega</h2>
            <p>{ENTREGAS[pedido.deliveryType]}</p>
            {pedido.address ? (
              <p className="ord__muted">
                {pedido.address.recipientName}
                <br />
                {pedido.address.street}, {pedido.address.city}, {pedido.address.state}, C.P. {pedido.address.postalCode}
                {pedido.address.phone && (
                  <>
                    <br />
                    Tel. {pedido.address.phone}
                  </>
                )}
              </p>
            ) : (
              <p className="ord__muted">Tepexpan, Acolman, Estado de México</p>
            )}
          </div>

          <div className="ord__card">
            <h2>Pago</h2>
            <p>{PAGOS[pedido.paymentMethod]}</p>
          </div>
        </div>

        <div className="ord__card">
          <h2>Productos</h2>
          <ul className="ord__items">
            {pedido.items.map((i) => (
              <li key={i.productId}>
                <span>{i.name} × {i.quantity}</span>
                <span>{moneda(i.subtotal)}</span>
              </li>
            ))}
          </ul>
          <div className="ord__line"><span>Subtotal</span><span>{moneda(pedido.subtotal)}</span></div>
          <div className="ord__line"><span>Envío</span><span>{pedido.shippingCost > 0 ? moneda(pedido.shippingCost) : 'Sin costo'}</span></div>
          <div className="ord__line ord__line--total"><span>Total</span><span>{moneda(pedido.total)}</span></div>
        </div>

        <Link to="/catalogo" className="btn btn--ghost">Seguir comprando</Link>
      </div>
    </section>
  );
}

function OrderDetailPage() {
  const { id } = useParams();
  return <OrderDetail key={id} id={id} />;
}

export default OrderDetailPage;