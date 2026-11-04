import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { API_URL } from '../config';
import './catalog.css';

const NIVELES = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [opciones, setOpciones] = useState({ categorias: [], tipos: [] });
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const q = params.get('q') || '';
  const categoria = params.get('categoria') || '';
  const tipo = params.get('tipo') || '';
  const nivel = params.get('nivel') || '';
  const min = params.get('min') || '';
  const max = params.get('max') || '';
  const consulta = params.toString();
  const hayFiltros = consulta !== '';

  // Opciones de los menús (una sola vez)
  useEffect(() => {
    fetch(`${API_URL}/api/filtros`)
      .then((res) => res.json())
      .then((datos) => setOpciones(datos))
      .catch(() => {});
  }, []);

  // Productos: se vuelven a pedir cada vez que cambia algún filtro
  useEffect(() => {
    let vigente = true;

    fetch(`${API_URL}/api/productos?${consulta}`)
      .then(async (res) => {
        const datos = await res.json();
        if (!res.ok) throw new Error(datos.mensaje || 'Error');
        return datos;
      })
      .then((datos) => {
        if (vigente) {
          setProductos(datos);
          setError(null);
        }
      })
      .catch((e) => {
        if (vigente) {
          setError(
            e.name === 'TypeError'
              ? 'No se pudo cargar el catálogo. Intenta de nuevo más tarde.'
              : e.message
          );
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [consulta]);

  function cambiar(nombre, valor) {
    const nuevos = new URLSearchParams(params);
    if (valor) nuevos.set(nombre, valor);
    else nuevos.delete(nombre);
    setParams(nuevos);
  }

  function aplicarTexto(e) {
    e.preventDefault();
    const datos = new FormData(e.currentTarget);
    const nuevos = new URLSearchParams(params);
    for (const campo of ['q', 'min', 'max']) {
      const valor = String(datos.get(campo) || '').trim();
      if (valor) nuevos.set(campo, valor);
      else nuevos.delete(campo);
    }
    setParams(nuevos);
  }

  return (
    <section className="catalog">
      <div className="catalog__inner">
        <h1 className="catalog__title">Catálogo</h1>
        {!cargando && !error && (
          <p className="catalog__count">
            {productos.length} {productos.length === 1 ? 'producto' : 'productos'}
          </p>
        )}

        <div className="catalog__filters">
          <form className="catalog__form" onSubmit={aplicarTexto} key={`${q}|${min}|${max}`}>
            <input
              className="catalog__field catalog__field--search"
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Buscar por nombre o descripción"
            />
            <input
              className="catalog__field catalog__field--price"
              type="number"
              name="min"
              min="0"
              defaultValue={min}
              placeholder="Precio mín."
            />
            <input
              className="catalog__field catalog__field--price"
              type="number"
              name="max"
              min="0"
              defaultValue={max}
              placeholder="Precio máx."
            />
            <button className="btn btn--primary btn--sm" type="submit">Buscar</button>
          </form>

          <select className="catalog__field" value={categoria} onChange={(e) => cambiar('categoria', e.target.value)}>
            <option value="">Categoría: todas</option>
            {opciones.categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select className="catalog__field" value={tipo} onChange={(e) => cambiar('tipo', e.target.value)}>
            <option value="">Tipo de cubo: todos</option>
            {opciones.tipos.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>

          <select className="catalog__field" value={nivel} onChange={(e) => cambiar('nivel', e.target.value)}>
            <option value="">Nivel: todos</option>
            {Object.entries(NIVELES).map(([valor, texto]) => (
              <option key={valor} value={valor}>{texto}</option>
            ))}
          </select>

          {hayFiltros && (
            <button className="btn btn--ghost btn--sm" onClick={() => setParams({})}>
              Quitar filtros
            </button>
          )}
        </div>

        {cargando && <p className="catalog__msg">Cargando productos…</p>}
        {error && <p className="catalog__msg catalog__msg--error">{error}</p>}
        {!cargando && !error && productos.length === 0 && (
          <p className="catalog__msg">
            {hayFiltros
              ? 'No se encontraron productos. Prueba quitando algún filtro.'
              : 'Por ahora no hay productos disponibles.'}
          </p>
        )}

        {!error && (
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
        )}
      </div>
    </section>
  );
}

export default CatalogPage;