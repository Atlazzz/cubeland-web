import './product-card.css';

const COLORES = {
  y: '#EFC93D', b: '#3465B0', r: '#E8432A',
  g: '#3F9142', o: '#F2932B', w: '#F5F3EF', k: '#302F34',
};

function ProductCard({ nombre, tipo, nivel, descripcion, precio, stock, colores }) {
  const agotado = stock === 0;
  const pocas = stock > 0 && stock <= 5;
  const textoStock = agotado ? 'Agotado' : pocas ? 'Últimas piezas' : 'En stock';

  return (
    <article className="card">
      <div className="card__media">
        <span className="card__stock">
          <span className={`card__dot ${pocas ? 'card__dot--low' : ''} ${agotado ? 'card__dot--out' : ''}`}></span>
          {textoStock}
        </span>
        <div className="mini-cube">
          {colores.split('').map((c, i) => (
            <span key={i} style={{ background: COLORES[c] }}></span>
          ))}
        </div>
      </div>

      <div className="card__body">
        <div className="card__tags">
          <span className="card__tag">{tipo}</span>
          {nivel && <span className="card__tag">{nivel}</span>}
        </div>
        <h3 className="card__title">{nombre}</h3>
        <p className="card__desc">{descripcion}</p>
        <div className="card__foot">
          <span className="card__price">${precio.toLocaleString('es-MX')}</span>
          <button className="btn btn--ghost btn--sm">Ver</button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;