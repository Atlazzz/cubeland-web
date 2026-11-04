import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/productos  →  lista de productos activos
router.get('/', async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.id, p.name, p.description, p.price, p.stock, p.difficulty,
             c.name  AS category,
             ct.name AS cube_type
      FROM products p
      JOIN categories c ON c.id = p.category_id
      LEFT JOIN cube_types ct ON ct.id = p.cube_type_id
      WHERE p.is_active = TRUE
      ORDER BY p.id
    `);
    res.json(productos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los productos' });
  }
});

export default router;