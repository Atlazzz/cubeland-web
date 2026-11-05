import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

const CP_VALIDO = /^\d{5}$/;
const TEL_VALIDO = /^\d{10}$/;

// GET /api/direcciones  →  direcciones del usuario
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT id, recipient_name, street, city, state, postal_code, phone, is_default
       FROM addresses WHERE user_id = ?
       ORDER BY is_default DESC, id DESC`,
      [req.user.id]
    );
    res.json(filas);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudieron cargar tus direcciones' });
  }
});

// POST /api/direcciones  →  agrega una dirección
router.post('/', async (req, res) => {
  try {
    const nombre = String(req.body.recipientName || '').trim();
    const calle = String(req.body.street || '').trim();
    const ciudad = String(req.body.city || '').trim();
    const estado = String(req.body.state || '').trim();
    const cp = String(req.body.postalCode || '').trim();
    const telefono = String(req.body.phone || '').replace(/\s+/g, '');

    if (!nombre || !calle || !ciudad || !estado || !cp) {
      return res.status(400).json({ mensaje: 'Completa todos los campos obligatorios' });
    }
    if (nombre.length > 100 || calle.length > 200 || ciudad.length > 80 || estado.length > 80) {
      return res.status(400).json({ mensaje: 'Alguno de los datos es demasiado largo' });
    }
    if (!CP_VALIDO.test(cp)) {
      return res.status(400).json({ mensaje: 'El código postal debe tener 5 dígitos' });
    }
    if (telefono && !TEL_VALIDO.test(telefono)) {
      return res.status(400).json({ mensaje: 'El teléfono debe tener 10 dígitos' });
    }

    const [existentes] = await pool.query(
      'SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?',
      [req.user.id]
    );
    const esPrimera = existentes[0].total === 0;

    const [resultado] = await pool.query(
      `INSERT INTO addresses
         (user_id, recipient_name, street, city, state, postal_code, phone, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, nombre, calle, ciudad, estado, cp, telefono || null, esPrimera]
    );
    res.status(201).json({ id: resultado.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo guardar la dirección. Intenta de nuevo' });
  }
});

export default router;