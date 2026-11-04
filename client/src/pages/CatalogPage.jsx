import { useEffect, useState } from 'react';
import ProductCard from '../components/ProductCard';
import { API_URL } from '../config';
import './catalog.css';

const NIVELES = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function CatalogPage() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${API_URL}/api/productos`)
      .then((res) => {
        if (!res.ok) throw new Error('Respuesta no válida');
        return res.json();
      })
      .then((datos) => setProductos(datos))
      .catch(() => setError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.'))
      .finally(() => setCargando(false));
  }, []);

  return (
    <section className="catalog">
      <div className="catalog__inner">
        <h1 className="catalog__title">Catálogo</h1>
        {!cargando && !error && (
          <p className="catalog__count">{productos.length} productos</p>
        )}

        {cargando && <p className="catalog__msg">Cargando productos…</p>}
        {error && <p className="catalog__msg catalog__msg--error">{error}</p>}
        {!cargando && !error && productos.length === 0 && (
          <p className="catalog__msg">Por ahora no hay productos disponibles.</p>
        )}

        <div className="catalog__grid">
          {productos.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              nombre={p.name}
              tipo={p.cube_type || p.category}
              nivel={NIVELES[p.difficulty]}
              descripcion={p.description}
              precio={Number(p.price)}
              stock={p.stock}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;