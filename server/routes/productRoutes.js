import { Router } from 'express';
import pool from '../db.js';

const router = Router();

const NIVELES_VALIDOS = ['beginner', 'intermediate', 'advanced'];

// Convierte un texto a número. Devuelve null si no viene y NaN si no es válido.
function aNumero(valor) {
  if (valor === undefined || valor === '') return null;
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0 ? n : NaN;
}

// GET /api/productos?q=&categoria=&tipo=&nivel=&min=&max=
router.get('/', async (req, res) => {
  try {
    const { q, categoria, tipo, nivel, min, max } = req.query;
    const condiciones = ['p.is_active = TRUE'];
    const valores = [];

    if (q && q.trim()) {
      const patron = `%${q.trim()}%`;
      condiciones.push('(p.name LIKE ? OR p.description LIKE ?)');
      valores.push(patron, patron);
    }

    if (categoria) {
      if (!Number.isInteger(Number(categoria))) {
        return res.status(400).json({ mensaje: 'Filtro no válido' });
      }
      condiciones.push('p.category_id = ?');
      valores.push(Number(categoria));
    }

    if (tipo) {
      if (!Number.isInteger(Number(tipo))) {
        return res.status(400).json({ mensaje: 'Filtro no válido' });
      }
      condiciones.push('p.cube_type_id = ?');
      valores.push(Number(tipo));
    }

    if (nivel) {
      if (!NIVELES_VALIDOS.includes(nivel)) {
        return res.status(400).json({ mensaje: 'Filtro no válido' });
      }
      condiciones.push('p.difficulty = ?');
      valores.push(nivel);
    }

    const minimo = aNumero(min);
    const maximo = aNumero(max);
    if (Number.isNaN(minimo) || Number.isNaN(maximo)) {
      return res.status(400).json({ mensaje: 'El rango de precio no es válido' });
    }
    if (minimo !== null && maximo !== null && minimo > maximo) {
      return res.status(400).json({ mensaje: 'El precio mínimo no puede ser mayor que el máximo' });
    }
    if (minimo !== null) {
      condiciones.push('p.price >= ?');
      valores.push(minimo);
    }
    if (maximo !== null) {
      condiciones.push('p.price <= ?');
      valores.push(maximo);
    }

    const [productos] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock, p.difficulty,
              c.name  AS category,
              ct.name AS cube_type
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN cube_types ct ON ct.id = p.cube_type_id
       WHERE ${condiciones.join(' AND ')}
       ORDER BY p.id`,
      valores
    );
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los productos' });
  }
});

// GET /api/productos/destacados
router.get('/destacados', async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT p.id, p.name, p.description, p.price, p.stock,
              p.difficulty, ct.name AS cube_type
       FROM products p
       LEFT JOIN cube_types ct ON ct.id = p.cube_type_id
       WHERE p.is_active = TRUE AND p.is_featured = TRUE
       ORDER BY p.id
       LIMIT 4`
    );

    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudieron cargar los productos destacados',
    });
  }
});

// GET /api/productos/:id  →  detalle de un producto
router.get('/:id', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT p.id, p.name, p.description, p.features, p.price, p.stock, p.difficulty,
              c.name  AS category,
              ct.name AS cube_type
       FROM products p
       JOIN categories c ON c.id = p.category_id
       LEFT JOIN cube_types ct ON ct.id = p.cube_type_id
       WHERE p.id = ? AND p.is_active = TRUE`,
      [req.params.id]
    );

    if (filas.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    const [imagenes] = await pool.query(
      'SELECT image_url FROM product_images WHERE product_id = ? ORDER BY sort_order',
      [req.params.id]
    );

    res.json({ ...filas[0], images: imagenes.map((i) => i.image_url) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener el producto' });
  }
});

export default router;