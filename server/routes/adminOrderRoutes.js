import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireRole('staff'));

class ErrorPedido extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

function siguientes(pedido) {
  switch (pedido.status) {
    case 'pending_payment':
      return ['preparing', 'cancelled'];

    case 'preparing':
      return [
        pedido.delivery_type === 'delivery' ? 'shipped' : 'delivered',
        'cancelled',
      ];

    case 'shipped':
      return pedido.delivery_type === 'delivery' ? ['delivered'] : [];

    default:
      return [];
  }
}

// GET /api/admin/pedidos
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at,
              o.delivery_type, o.payment_method,
              u.name AS customer_name
       FROM orders o
       JOIN users u ON u.id = o.user_id
       ORDER BY o.created_at DESC, o.id DESC`
    );

    res.json(
      filas.map((p) => ({
        id: p.id,
        status: p.status,
        total: Number(p.total),
        createdAt: p.created_at,
        deliveryType: p.delivery_type,
        paymentMethod: p.payment_method,
        customerName: p.customer_name,
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudieron cargar los pedidos',
    });
  }
});

// GET /api/admin/pedidos/:id
router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(404).json({ mensaje: 'Pedido no encontrado' });
  }

  try {
    const [filas] = await pool.query(
      `SELECT o.*, u.name AS customer_name,
              a.recipient_name, a.street, a.city, a.state,
              a.postal_code, a.phone
       FROM orders o
       JOIN users u ON u.id = o.user_id
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ?`,
      [id]
    );

    if (!filas.length) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const pedido = filas[0];

    const [items] = await pool.query(
      `SELECT id, product_name, unit_price, quantity
       FROM order_items
       WHERE order_id = ?
       ORDER BY id`,
      [id]
    );

    res.json({
      id: pedido.id,
      status: pedido.status,
      customerName: pedido.customer_name,
      deliveryType: pedido.delivery_type,
      paymentMethod: pedido.payment_method,
      subtotal: Number(pedido.subtotal),
      shippingCost: Number(pedido.shipping_cost),
      total: Number(pedido.total),
      allowedStatuses: siguientes(pedido),
      address: pedido.address_id
        ? {
            recipientName: pedido.recipient_name,
            street: pedido.street,
            city: pedido.city,
            state: pedido.state,
            postalCode: pedido.postal_code,
            phone: pedido.phone,
          }
        : null,
      items: items.map((i) => ({
        id: i.id,
        name: i.product_name,
        price: Number(i.unit_price),
        quantity: i.quantity,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudo cargar el detalle del pedido',
    });
  }
});

// PATCH /api/admin/pedidos/:id/estado
router.patch('/:id/estado', async (req, res) => {
  const id = Number(req.params.id);
  const { status, expectedStatus, paymentConfirmed } = req.body;

  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({ mensaje: 'Pedido no válido' });
  }

  if (
    typeof status !== 'string' ||
    typeof expectedStatus !== 'string'
  ) {
    return res.status(400).json({
      mensaje: 'Selecciona un estado válido',
    });
  }

  let conn;
  let transaccion = false;

  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();
    transaccion = true;

    const [filas] = await conn.query(
      'SELECT * FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (!filas.length) {
      throw new ErrorPedido(404, 'Pedido no encontrado');
    }

    const pedido = filas[0];

    if (pedido.status !== expectedStatus) {
      throw new ErrorPedido(
        409,
        'El pedido cambió desde que lo abriste. Vuelve a consultar su detalle'
      );
    }

    if (!siguientes(pedido).includes(status)) {
      throw new ErrorPedido(
        409,
        'Ese cambio de estado no está permitido'
      );
    }

    const confirmarTransferencia =
      pedido.payment_method === 'bank_transfer' &&
      pedido.status === 'pending_payment' &&
      status === 'preparing';

    const confirmarPagoEnTienda =
      pedido.payment_method === 'pay_in_store' &&
      status === 'delivered';

    if (
      (confirmarTransferencia || confirmarPagoEnTienda) &&
      paymentConfirmed !== true
    ) {
      throw new ErrorPedido(
        400,
        'Debes confirmar que verificaste el pago'
      );
    }

    if (status === 'cancelled') {
      // Agrupa por producto y mantiene el orden de bloqueo.
      const [items] = await conn.query(
        `SELECT product_id, SUM(quantity) AS quantity
         FROM order_items
         WHERE order_id = ?
         GROUP BY product_id
         ORDER BY product_id`,
        [id]
      );

      for (const item of items) {
        const [resultado] = await conn.query(
          'UPDATE products SET stock = stock + ? WHERE id = ?',
          [Number(item.quantity), item.product_id]
        );

        if (resultado.affectedRows !== 1) {
          throw new ErrorPedido(
            409,
            'No se pudieron devolver todas las existencias'
          );
        }
      }
    }

    await conn.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, id]
    );

    await conn.commit();
    transaccion = false;

    res.json({
      mensaje:
        status === 'cancelled'
          ? 'Pedido cancelado y existencias devueltas'
          : 'Estado actualizado',
    });
  } catch (error) {
    if (conn && transaccion) {
      await conn.rollback();
    }

    if (error instanceof ErrorPedido) {
      return res.status(error.status).json({
        mensaje: error.message,
      });
    }

    console.error(error);
    res.status(500).json({
      mensaje: 'No se pudo actualizar el pedido. Intenta de nuevo',
    });
  } finally {
    conn?.release();
  }
});

export default router;