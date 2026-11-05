import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './cart.css';

const moneda = (n) =>
  Number(n).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });

function problema(item) {
  if (!item.active || item.stock === 0) {
    return 'Este producto ya no está disponible. Elimínalo para continuar.';
  }
  if (item.quantity > item.stock) {
    return `Solo hay ${item.stock} disponibles. Ajusta la cantidad para continuar.`;
  }
  return null;
}

function CartPage() {
  const { items, total, cargando, cambiar, quitar } = useCart();
  const [error, setError] = useState(null);
  const [aviso, setAviso] = useState(null);

  async function ejecutar(accion) {
    setError(null);
    setAviso(null);
    try {
      const respuesta = await accion();
      if (respuesta?.ajustado) setAviso(respuesta.mensaje);
    } catch (e) {
      setError(e.message);
    }
  }

  const hayProblemas = items.some((i) => problema(i));

  return (
    <section className="cart">
      <div className="cart__inner">
        <h1 className="cart__title">Tu carrito</h1>

        {cargando && <p className="cart__msg">Cargando tu carrito…</p>}
        {error && <p className="cart__msg cart__msg--error">{error}</p>}
        {aviso && <p className="cart__msg cart__msg--aviso">{aviso}</p>}

        {!cargando && items.length === 0 && (
          <div className="cart__empty">
            <p>Tu carrito está vacío.</p>
            <Link to="/catalogo" className="btn btn--primary">Ver el catálogo</Link>
          </div>
        )}

        {!cargando && items.length > 0 && (
          <div className="cart__layout">
            <ul className="cart__list">
              {items.map((item) => {
                const aviso = problema(item);
                return (
                  <li className="cart__item" key={item.productId}>
                    <div className="cart__info">
                      <Link to={`/producto/${item.productId}`} className="cart__name">{item.name}</Link>
                      <span className="cart__unit">{moneda(item.price)} c/u</span>
                      {aviso && <span className="cart__warn">{aviso}</span>}
                    </div>

                    <div className="cart__qty">
                      <button
                        aria-label="Quitar una pieza"
                        disabled={item.quantity <= 1 || !item.active}
                        onClick={() => ejecutar(() => cambiar(item.productId, item.quantity - 1))}
                      >
                        −
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        aria-label="Agregar una pieza"
                        disabled={item.quantity >= item.stock || !item.active}
                        onClick={() => ejecutar(() => cambiar(item.productId, item.quantity + 1))}
                      >
                        +
                      </button>
                    </div>

                    <span className="cart__subtotal">{moneda(item.subtotal)}</span>

                    <button className="cart__remove" onClick={() => ejecutar(() => quitar(item.productId))}>
                      Eliminar
                    </button>
                  </li>
                );
              })}
            </ul>

            <aside className="cart__summary">
              <div className="cart__row">
                <span>Subtotal</span>
                <span>{moneda(total)}</span>
              </div>
              <p className="cart__note">El envío y el método de pago se eligen en el siguiente paso.</p>
              <button className="btn btn--primary cart__checkout" disabled={hayProblemas}>
                Continuar con el pedido
              </button>
              <Link to="/catalogo" className="btn btn--ghost cart__checkout cart__more">Seguir comprando</Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

export default CartPage;