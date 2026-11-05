import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import './add-to-cart.css';

function AddToCart({ productId, stock }) {
  const { user } = useAuth();
  const { agregar } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [cantidad, setCantidad] = useState(1);
  const [estado, setEstado] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const maximo = Math.min(stock, 99);

  if (stock === 0) {
    return (
      <button className="btn btn--primary pd__buy" disabled>
        Producto agotado
      </button>
    );
  }

  async function agregarAlCarrito() {
    if (!user) {
      navigate('/iniciar-sesion', { state: { desde: location.pathname } });
      return;
    }
    setEnviando(true);
    setEstado(null);
    try {
      const respuesta = await agregar(productId, cantidad);
      setEstado({ tipo: 'ok', texto: respuesta.mensaje });
    } catch (e) {
      setEstado({ tipo: 'error', texto: e.message });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="atc">
      <div className="atc__row">
        <div className="atc__qty">
          <button type="button" aria-label="Menos" disabled={cantidad <= 1} onClick={() => setCantidad(cantidad - 1)}>−</button>
          <span>{cantidad}</span>
          <button type="button" aria-label="Más" disabled={cantidad >= maximo} onClick={() => setCantidad(cantidad + 1)}>+</button>
        </div>
        <button className="btn btn--primary atc__add" onClick={agregarAlCarrito} disabled={enviando}>
          {enviando ? 'Agregando…' : 'Agregar al carrito'}
        </button>
      </div>

      {estado && (
        <p className={`atc__msg atc__msg--${estado.tipo}`}>
          {estado.texto}
          {estado.tipo === 'ok' && <Link to="/carrito">Ver carrito</Link>}
        </p>
      )}
    </div>
  );
}

export default AddToCart;