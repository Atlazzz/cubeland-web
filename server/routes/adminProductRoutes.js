import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(requireAuth, requireRole('staff'));

const NIVELES = [
  'beginner',
  'easy',
  'intermediate',
  'advanced',
  'expert',
];

function validarProducto(body) {
  const {
    name,
    description,
    features,
    price,
    stock,
    category_id,
    cube_type_id,
    difficulty,
    is_active,
    is_featured,
  } = body;

  if (typeof name !== 'string' || !name.trim()) {
    return { error: 'Escribe el nombre del producto' };
  }

  if (
    typeof description !== 'string' ||
    typeof features !== 'string'
  ) {
    return { error: 'La descripción y las características no son válidas' };
  }

  // Acepta pesos con hasta dos decimales.
  if (
    !['string', 'number'].includes(typeof price) ||
    !/^\d+(\.\d{1,2})?$/.test(String(price)) ||
    !Number.isFinite(Number(price)) ||
    Number(price) <= 0
  ) {
    return { error: 'El precio debe ser mayor que cero y tener hasta dos decimales' };
  }

  if (
    !['string', 'number'].includes(typeof stock) ||
    !/^\d+$/.test(String(stock)) ||
    !Number.isSafeInteger(Number(stock))
  ) {
    return { error: 'Las existencias deben ser un entero mayor o igual que cero' };
  }

  if (
    !['string', 'number'].includes(typeof category_id) ||
    !/^[1-9]\d*$/.test(String(category_id)) ||
    !Number.isSafeInteger(Number(category_id))
  ) {
    return { error: 'Selecciona una categoría válida' };
  }

  let tipo = null;

  if (cube_type_id !== '' && cube_type_id !== null) {
    if (
      !['string', 'number'].includes(typeof cube_type_id) ||
      !/^[1-9]\d*$/.test(String(cube_type_id)) ||
      !Number.isSafeInteger(Number(cube_type_id))
    ) {
      return { error: 'Selecciona un tipo de cubo válido' };
    }

    tipo = Number(cube_type_id);
  }

  if (difficulty !== '' && !NIVELES.includes(difficulty)) {
    return { error: 'Selecciona una dificultad válida' };
  }

  if (typeof is_active !== 'boolean') {
    return { error: 'El estado del producto no es válido' };
  }

   if (typeof is_featured !== 'boolean') {
    return { error: 'La selección de producto destacado no es válida' };
  }

  return {
    datos: [
      name.trim(),
      description.trim(),
      features.trim(),
      Number(price),
      Number(stock),
      Number(category_id),
      tipo,
      difficulty || null,
      is_active,
      is_featured,
    ],
  };
}

async function referenciasValidas(categoryId, tipoId) {
  const [categorias] = await pool.query(
    'SELECT id FROM categories WHERE id = ?',
    [categoryId]
  );

  if (!categorias.length) return false;

  if (tipoId !== null) {
    const [tipos] = await pool.query(
      'SELECT id FROM cube_types WHERE id = ?',
      [tipoId]
    );

    if (!tipos.length) return false;
  }

  return true;
}

function responderError(error, res) {
  console.error(error);

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      mensaje: 'Ya existe un producto con un dato único igual',
    });
  }

  if (
    error.code === 'ER_DATA_TOO_LONG' ||
    error.code === 'ER_WARN_DATA_OUT_OF_RANGE'
  ) {
    return res.status(400).json({
      mensaje: 'Un campo supera el tamaño permitido por la base de datos',
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      mensaje: 'La categoría o el tipo de cubo ya no están disponibles',
    });
  }

  return res.status(500).json({
    mensaje: 'No se pudo completar la operación',
  });
}

// GET /api/admin/productos
router.get('/', async (req, res) => {
  try {
    const [productos] = await pool.query(
      `SELECT id, name, description, features, price, stock,
              category_id, cube_type_id, difficulty,
              is_active, is_featured
       FROM products
       ORDER BY id DESC`
    );

    const [categorias] = await pool.query(
      'SELECT id, name FROM categories ORDER BY name'
    );

    const [tipos] = await pool.query(
      'SELECT id, name FROM cube_types ORDER BY name'
    );

    res.json({
      productos: productos.map((p) => ({
        ...p,
        price: Number(p.price),
        is_active: Boolean(p.is_active),
        is_featured: Boolean(p.is_featured),
      })),
      categorias,
      tipos,
    });
  } catch (error) {
    responderError(error, res);
  }
});

// POST /api/admin/productos
router.post('/', async (req, res) => {
  const { datos, error } = validarProducto(req.body);

  if (error) return res.status(400).json({ mensaje: error });

  try {
    if (!(await referenciasValidas(datos[5], datos[6]))) {
      return res.status(400).json({
        mensaje: 'La categoría o el tipo de cubo no existen',
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO products
         (name, description, features, price, stock,
          category_id, cube_type_id, difficulty,
          is_active, is_featured)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      datos
    );

    res.status(201).json({ id: resultado.insertId });
  } catch (e) {
    responderError(e, res);
  }
});

// PUT /api/admin/productos/:id
router.put('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'Producto no válido' });
  }

  const { datos, error } = validarProducto(req.body);

  if (error) return res.status(400).json({ mensaje: error });

  try {
    if (!(await referenciasValidas(datos[5], datos[6]))) {
      return res.status(400).json({
        mensaje: 'La categoría o el tipo de cubo no existen',
      });
    }

    const [resultado] = await pool.query(
      `UPDATE products
       SET name = ?, description = ?, features = ?, price = ?,
           stock = ?, category_id = ?, cube_type_id = ?,
           difficulty = ?, is_active = ?, is_featured = ?
       WHERE id = ?`,
      [...datos, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }

    res.json({ mensaje: 'Producto actualizado' });
  } catch (e) {
    responderError(e, res);
  }
});

export default router;