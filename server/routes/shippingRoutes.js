import { Router } from 'express';
import pool from '../db.js';
import { costoEnvio } from '../utils/shipping.js';

const router = Router();

// GET /api/envio/costo?estado=Jalisco
router.get('/costo', async (req, res) => {
  try {
    const estado = String(req.query.estado || '').trim();
    if (!estado) {
      return res.status(400).json({ mensaje: 'Indica el estado de entrega' });
    }
    const costo = await costoEnvio(pool, estado);
    if (costo === null) {
      return res.status(409).json({
        mensaje: 'Por ahora no enviamos a esa zona. Elige recolección en tienda u otra dirección',
      });
    }
    res.json({ costo });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo calcular el envío' });
  }
});

export default router;