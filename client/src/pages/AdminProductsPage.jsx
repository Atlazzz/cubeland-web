import { useEffect, useState } from 'react';
import { peticion } from '../api';
import './admin.css';

const VACIO = {
  name: '',
  description: '',
  features: '',
  price: '',
  stock: '0',
  category_id: '',
  cube_type_id: '',
  difficulty: '',
  is_active: true,
};

const moneda = (valor) =>
  Number(valor).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });

function AdminProductsPage() {
  const [datos, setDatos] = useState({
    productos: [],
    categorias: [],
    tipos: [],
  });
  const [form, setForm] = useState({ ...VACIO });
  const [editando, setEditando] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [busqueda, setBusqueda] = useState('');

  useEffect(() => {
    let activo = true;

    peticion('/admin/productos')
      .then((respuesta) => {
        if (activo) setDatos(respuesta);
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

  function cambiar(e) {
    const { name, value, type, checked } = e.target;

    setForm((actual) => ({
      ...actual,
      [name]: type === 'checkbox' ? checked : value,
    }));
  }

  function editar(producto) {
    setEditando(producto.id);
    setError('');
    setMensaje('');
    setForm({
      name: producto.name,
      description: producto.description || '',
      features: producto.features || '',
      price: String(producto.price),
      stock: String(producto.stock),
      category_id: String(producto.category_id),
      cube_type_id: producto.cube_type_id
        ? String(producto.cube_type_id)
        : '',
      difficulty: producto.difficulty || '',
      is_active: producto.is_active,
    });

    document.getElementById('admin-product-name')?.focus();
  }

  function limpiar() {
    setEditando(null);
    setForm({ ...VACIO });
  }

  async function guardar(e) {
    e.preventDefault();
    if (guardando) return;

    setGuardando(true);
    setError('');
    setMensaje('');

    let guardado = false;

    try {
      await peticion(
        editando
          ? `/admin/productos/${editando}`
          : '/admin/productos',
        {
          method: editando ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        }
      );

      guardado = true;
      limpiar();

      const respuesta = await peticion('/admin/productos');
      setDatos(respuesta);
      setMensaje('Producto guardado correctamente.');
    } catch (e) {
      setError(
        guardado
          ? 'El producto se guardó, pero no se pudo actualizar la lista. Recarga la página.'
          : e.message
      );
    } finally {
      setGuardando(false);
    }
  }

  const visibles = datos.productos.filter((p) =>
    p.name.toLocaleLowerCase('es-MX').includes(
      busqueda.trim().toLocaleLowerCase('es-MX')
    )
  );

  return (
    <section className="admin">
      <h1>Administración de productos</h1>

      {error && <p className="admin__error" role="alert">{error}</p>}
      {mensaje && <p className="admin__success" role="status">{mensaje}</p>}

      {cargando ? (
        <p role="status">Cargando productos…</p>
      ) : (
        <>
          <form className="admin__form" onSubmit={guardar}>
            <h2>
              {editando ? `Editar producto #${editando}` : 'Nuevo producto'}
            </h2>

            <fieldset disabled={guardando}>
              <label>
                Nombre
                <input
                  id="admin-product-name"
                  name="name"
                  value={form.name}
                  onChange={cambiar}
                  required
                />
              </label>

              <label>
                Descripción
                <textarea
                  name="description"
                  value={form.description}
                  onChange={cambiar}
                  rows={3}
                />
              </label>

              <label>
                Características separadas por comas
                <textarea
                  name="features"
                  value={form.features}
                  onChange={cambiar}
                  rows={2}
                />
              </label>

              <div className="admin__grid">
                <label>
                  Precio (MXN)
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={cambiar}
                    min="0.01"
                    step="0.01"
                    required
                  />
                </label>

                <label>
                  Existencias
                  <input
                    type="number"
                    name="stock"
                    value={form.stock}
                    onChange={cambiar}
                    min="0"
                    step="1"
                    required
                  />
                </label>

                <label>
                  Categoría
                  <select
                    name="category_id"
                    value={form.category_id}
                    onChange={cambiar}
                    required
                  >
                    <option value="">Selecciona una categoría</option>
                    {datos.categorias.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Tipo de cubo
                  <select
                    name="cube_type_id"
                    value={form.cube_type_id}
                    onChange={cambiar}
                  >
                    <option value="">Sin tipo</option>
                    {datos.tipos.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Dificultad
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={cambiar}
                  >
                    <option value="">Sin dificultad</option>
                    <option value="beginner">Principiante</option>
                    <option value="intermediate">Intermedio</option>
                    <option value="advanced">Avanzado</option>
                  </select>
                </label>
              </div>

              <label className="admin__check">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={form.is_active}
                  onChange={cambiar}
                />
                Disponible en el catálogo
              </label>

              <div className="admin__actions">
                <button className="btn btn--primary" type="submit">
                  {guardando ? 'Guardando…' : 'Guardar producto'}
                </button>

                {editando && (
                  <button
                    className="btn btn--ghost"
                    type="button"
                    onClick={limpiar}
                  >
                    Cancelar edición
                  </button>
                )}
              </div>
            </fieldset>
          </form>

          <label className="admin__search">
            Buscar en productos activos e inactivos
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Nombre del producto"
            />
          </label>

          <div className="admin__table-wrap">
            <table className="admin__table">
              <thead>
                <tr>
                  <th scope="col">Producto</th>
                  <th scope="col">Precio</th>
                  <th scope="col">Existencias</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{moneda(p.price)}</td>
                    <td>{p.stock}</td>
                    <td>{p.is_active ? 'Activo' : 'Inactivo'}</td>
                    <td>
                      <button
                        className="btn btn--ghost btn--sm"
                        type="button"
                        disabled={guardando}
                        onClick={() => editar(p)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}

                {visibles.length === 0 && (
                  <tr>
                    <td colSpan={5}>No hay productos para mostrar.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

export default AdminProductsPage;