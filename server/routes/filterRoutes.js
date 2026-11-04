import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/filtros  →  categorías y tipos de cubo
router.get('/', async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT id, name FROM categories ORDER BY name');
    const [tipos] = await pool.query('SELECT id, name FROM cube_types ORDER BY id');
    res.json({ categorias, tipos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener los filtros' });
  }
});

export default router;