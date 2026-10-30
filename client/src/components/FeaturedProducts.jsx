import ProductCard from './ProductCard';
import './featured.css';

const PRODUCTOS = [
  { id: 1, nombre: 'CubeLand Speed Pro', tipo: '3x3', nivel: 'Intermedio',
    descripcion: 'Magnético, tensión ajustable, corte elite.',
    precio: 549, stock: 14, colores: 'rowbygkkk' },
  { id: 2, nombre: 'Mini Cube 2x2', tipo: '2x2', nivel: 'Principiante',
    descripcion: 'Ligero y compacto, ideal para empezar.',
    precio: 249, stock: 3, colores: 'gwrybokkk' },
  { id: 3, nombre: 'CubeLand WR 4x4', tipo: '4x4', nivel: 'Avanzado',
    descripcion: 'Mecanismo reforzado para giros rápidos.',
    precio: 689, stock: 9, colores: 'ybgwrokkk' },
  { id: 4, nombre: 'Pyraminx Elite', tipo: 'Pyraminx', nivel: 'Intermedio',
    descripcion: 'Esquinas magnéticas, giro sin fricción.',
    precio: 399, stock: 21, colores: 'orywgbkkk' },
];

function FeaturedProducts() {
  return (
    <section className="featured" id="catalogo">
      <div className="featured__inner">
        <div className="featured__head">
          <div>
            <h2 className="featured__title">Productos destacados</h2>
            <p className="featured__sub">Una muestra de lo que encontrarás en nuestro catálogo.</p>
          </div>
          <button className="btn btn--ghost">Ver todo el catálogo</button>
        </div>

        <div className="featured__grid">
          {PRODUCTOS.map((p) => (
            <ProductCard key={p.id} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;