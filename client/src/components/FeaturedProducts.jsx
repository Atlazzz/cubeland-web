import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from './ProductCard';
import { peticion } from '../api';
import './featured.css';

const NIVELES = {
  beginner: 'Principiante',
  easy: 'Fácil',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  expert: 'Experto',
};

function FeaturedProducts() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;

    peticion('/productos/destacados')
      .then((datos) => {
        if (activo) setProductos(datos);
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

  return (
    <section className="featured" id="catalogo">
      <div className="featured__inner">
        <div className="featured__head">
          <div>
            <h2 className="featured__title">Productos destacados</h2>
            <p className="featured__sub">
              Una muestra de lo que encontrarás en nuestro catálogo.
            </p>
          </div>

          <Link to="/catalogo" className="btn btn--ghost">
            Ver todo el catálogo
          </Link>
        </div>

        {cargando ? (
          <p role="status">Cargando productos destacados…</p>
        ) : error ? (
          <p role="alert">{error}</p>
        ) : productos.length === 0 ? (
          <p>Próximamente encontrarás productos destacados aquí.</p>
        ) : (
          <div className="featured__grid">
            {productos.map((p) => (
              <ProductCard
                key={p.id}
                id={p.id}
                nombre={p.name}
                categoria={p.category || ''}
                tipo={p.cube_type || ''}
                nivel={NIVELES[p.difficulty] || ''}
                descripcion={p.description || ''}
                precio={Number(p.price)}
                stock={Number(p.stock)}
                colores="rowbygkkk"
                imagen={p.image_url}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedProducts;