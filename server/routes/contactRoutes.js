import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// POST /api/contacto
router.post('/', async (req, res) => {
  const { name, email, message } = req.body || {};

  if (
    typeof name !== 'string' ||
    !name.trim() ||
    name.trim().length > 100
  ) {
    return res.status(400).json({
      mensaje: 'Escribe tu nombre, de hasta 100 caracteres',
    });
  }

  if (
    typeof email !== 'string' ||
    email.trim().length > 150 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      mensaje: 'Escribe un correo electrónico válido',
    });
  }

  if (
    typeof message !== 'string' ||
    !message.trim() ||
    message.trim().length > 5000
  ) {
    return res.status(400).json({
      mensaje: 'Escribe un mensaje de hasta 5000 caracteres',
    });
  }

  try {
    await pool.query(
      `INSERT INTO contact_messages (name, email, message)
       VALUES (?, ?, ?)`,
      [name.trim(), email.trim(), message.trim()]
    );

    res.status(201).json({
      mensaje: 'Recibimos tu mensaje. Gracias por contactar a CubeLand.',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudo guardar tu mensaje. Intenta de nuevo',
    });
  }
});

router.use('/admin', requireAuth, requireRole('staff'));

// GET /api/contacto/admin
router.get('/admin', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT id, name, email, message, is_read, created_at
       FROM contact_messages
       ORDER BY created_at DESC, id DESC`
    );

    res.json(
      filas.map((m) => ({
        ...m,
        is_read: Boolean(m.is_read),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudieron cargar los mensajes',
    });
  }
});

// PATCH /api/contacto/admin/:id/leido
router.patch('/admin/:id/leido', async (req, res) => {
  const id = Number(req.params.id);
  const { is_read } = req.body || {};

  if (
    !Number.isSafeInteger(id) ||
    id <= 0 ||
    typeof is_read !== 'boolean'
  ) {
    return res.status(400).json({
      mensaje: 'Los datos del mensaje no son válidos',
    });
  }

  try {
    const [resultado] = await pool.query(
      'UPDATE contact_messages SET is_read = ? WHERE id = ?',
      [is_read, id]
    );

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        mensaje: 'Mensaje no encontrado',
      });
    }

    res.json({ mensaje: 'Mensaje actualizado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudo actualizar el mensaje',
    });
  }
});

export default router;