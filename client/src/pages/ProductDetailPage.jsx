import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { API_URL } from '../config';
import logoCubo from '../assets/images/logo-cubeland-cubo-claro.png';
import './product-detail.css';
import AddToCart from '../components/AddToCart';

const NIVELES = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function ProductDetail({ id }) {
  const [producto, setProducto] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [imagenActual, setImagenActual] = useState(0);

  useEffect(() => {
    fetch(`${API_URL}/api/productos/${id}`)
      .then((res) => {
        if (res.status === 404) throw new Error('no-encontrado');
        if (!res.ok) throw new Error('error');
        return res.json();
      })
      .then((datos) => setProducto(datos))
      .catch((e) =>
        setError(
          e.message === 'no-encontrado'
            ? 'Este producto ya no está disponible.'
            : 'No se pudo cargar el producto. Intenta de nuevo más tarde.'
        )
      )
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) {
    return <p className="pd__msg">Cargando producto…</p>;
  }

  if (error) {
    return (
      <div className="pd__msg">
        <p>{error}</p>
        <Link to="/catalogo" className="btn btn--primary">Volver al catálogo</Link>
      </div>
    );
  }

  const agotado = producto.stock === 0;
  const pocas = producto.stock > 0 && producto.stock <= 5;
  const caracteristicas = producto.features
    ? producto.features.split(',').map((c) => c.trim())
    : [];
  const precio = Number(producto.price).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

  return (
    <section className="pd">
      <div className="pd__inner">
        <nav className="pd__crumbs">
          <Link to="/catalogo">Catálogo</Link> / <span>{producto.name}</span>
        </nav>

        <div className="pd__grid">
          <div>
            <div className="pd__media">
              {producto.images.length > 0 ? (
                <img src={producto.images[imagenActual]} alt={producto.name} />
              ) : (
                <div className="pd__placeholder">
                  <img src={logoCubo} alt="" />
                  <span>Fotografías próximamente</span>
                </div>
              )}
            </div>

            {producto.images.length > 1 && (
              <div className="pd__thumbs">
                {producto.images.map((url, i) => (
                  <button
                    key={url}
                    className={i === imagenActual ? 'active' : ''}
                    onClick={() => setImagenActual(i)}
                  >
                    <img src={url} alt={`${producto.name}, foto ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="pd__tags">
              <span className="pd__tag">{producto.category}</span>
              {producto.cube_type && <span className="pd__tag">{producto.cube_type}</span>}
              {producto.difficulty && <span className="pd__tag">{NIVELES[producto.difficulty]}</span>}
            </div>

            <h1 className="pd__title">{producto.name}</h1>
            <p className="pd__price">{precio}</p>

            <p className={`pd__stock ${agotado ? 'pd__stock--out' : pocas ? 'pd__stock--low' : ''}`}>
              <span className="pd__dot"></span>
              {agotado
                ? 'Agotado'
                : pocas
                ? `Últimas piezas (${producto.stock})`
                : `En stock (${producto.stock} disponibles)`}
            </p>

            <p className="pd__desc">{producto.description}</p>

            {caracteristicas.length > 0 && (
              <ul className="pd__features">
                {caracteristicas.map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            )}

            <AddToCart productId={producto.id} stock={producto.stock} />
              {agotado ? 'Producto agotado' : 'Agregar al carrito'}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductDetailPage() {
  const { id } = useParams();
  return <ProductDetail key={id} id={id} />;
}

export default ProductDetailPage;