import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { costoEnvio } from '../utils/shipping.js';

const router = Router();
router.use(requireAuth);

class ErrorPedido extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const ENTREGAS = ['delivery', 'pickup'];
const PAGOS = ['bank_transfer', 'pay_in_store'];

// Los cálculos se hacen en centavos para evitar errores de redondeo
const aCentavos = (n) => Math.round(Number(n) * 100);
const aPesos = (c) => c / 100;

// POST /api/pedidos  →  crea el pedido a partir del carrito
router.post('/', async (req, res) => {
  const { deliveryType, paymentMethod } = req.body;
  const addressId = Number(req.body.addressId);

  if (!ENTREGAS.includes(deliveryType)) {
    return res.status(400).json({ mensaje: 'Elige cómo quieres recibir tu pedido' });
  }
  if (!PAGOS.includes(paymentMethod)) {
    return res.status(400).json({ mensaje: 'Elige un método de pago' });
  }
  if (deliveryType === 'delivery' && paymentMethod === 'pay_in_store') {
    return res.status(400).json({
      mensaje: 'El pago en tienda solo está disponible con recolección en tienda',
    });
  }
  if (deliveryType === 'delivery' && !Number.isInteger(addressId)) {
    return res.status(400).json({ mensaje: 'Elige una dirección de entrega' });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Bloquea las filas del carrito y de los productos mientras se procesa el pedido
    const [carrito] = await conn.query(
      `SELECT ci.product_id, ci.quantity, p.name, p.price, p.stock, p.is_active
       FROM cart_items ci
       JOIN products p ON p.id = ci.product_id
       WHERE ci.user_id = ?
       ORDER BY p.id
       FOR UPDATE`,
      [req.user.id]
    );

    if (carrito.length === 0) {
      throw new ErrorPedido(400, 'Tu carrito está vacío');
    }

    for (const item of carrito) {
      if (!item.is_active || item.stock === 0) {
        throw new ErrorPedido(409, `"${item.name}" ya no está disponible. Quítalo del carrito para continuar`);
      }
      if (item.quantity > item.stock) {
        throw new ErrorPedido(409, `Solo hay ${item.stock} de "${item.name}". Ajusta la cantidad en tu carrito`);
      }
    }

    let direccionId = null;
    let envioCentavos = 0;

    if (deliveryType === 'delivery') {
      const [direcciones] = await conn.query(
        'SELECT id, state FROM addresses WHERE id = ? AND user_id = ?',
        [addressId, req.user.id]
      );
      if (direcciones.length === 0) {
        throw new ErrorPedido(400, 'La dirección no es válida');
      }
      const costo = await costoEnvio(conn, direcciones[0].state);
      if (costo === null) {
        throw new ErrorPedido(409, 'Por ahora no enviamos a esa zona. Elige recolección en tienda u otra dirección');
      }
      direccionId = direcciones[0].id;
      envioCentavos = aCentavos(costo);
    }

    const subtotalCentavos = carrito.reduce(
      (suma, i) => suma + aCentavos(i.price) * i.quantity,
      0
    );
    const totalCentavos = subtotalCentavos + envioCentavos;

    const [pedido] = await conn.query(
      `INSERT INTO orders
         (user_id, address_id, payment_method, delivery_type, subtotal, shipping_cost, total)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.id,
        direccionId,
        paymentMethod,
        deliveryType,
        aPesos(subtotalCentavos),
        aPesos(envioCentavos),
        aPesos(totalCentavos),
      ]
    );

    // Se guarda una copia del nombre y del precio de cada producto
    await conn.query(
      'INSERT INTO order_items (order_id, product_id, product_name, unit_price, quantity) VALUES ?',
      [carrito.map((i) => [pedido.insertId, i.product_id, i.name, i.price, i.quantity])]
    );

    for (const item of carrito) {
      const [r] = await conn.query(
        'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
        [item.quantity, item.product_id, item.quantity]
      );
      if (r.affectedRows !== 1) {
        throw new ErrorPedido(409, `Ya no hay existencias suficientes de "${item.name}"`);
      }
    }

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);

    await conn.commit();
    res.status(201).json({ id: pedido.insertId });
  } catch (error) {
    await conn.rollback();
    if (error instanceof ErrorPedido) {
      return res.status(error.status).json({ mensaje: error.message });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo registrar el pedido. Intenta de nuevo' });
  } finally {
    conn.release();
  }
});

// GET /api/pedidos  →  historial del usuario
router.get('/', async (req, res) => {
  try {
    const [filas] = await pool.query(
      `SELECT o.id, o.status, o.total, o.created_at, o.delivery_type,
              (SELECT COALESCE(SUM(quantity), 0) FROM order_items WHERE order_id = o.id) AS pieces
       FROM orders o
       WHERE o.user_id = ?
       ORDER BY o.created_at DESC, o.id DESC`,
      [req.user.id]
    );
    res.json(
      filas.map((f) => ({
        id: f.id,
        status: f.status,
        total: Number(f.total),
        createdAt: f.created_at,
        deliveryType: f.delivery_type,
        pieces: Number(f.pieces),
      }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudieron cargar tus pedidos' });
  }
});

// GET /api/pedidos/:id  →  detalle de un pedido del usuario
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }

    const [pedidos] = await pool.query(
      `SELECT o.id, o.status, o.payment_method, o.delivery_type, o.subtotal,
              o.shipping_cost, o.total, o.created_at,
              a.recipient_name, a.street, a.city, a.state, a.postal_code, a.phone
       FROM orders o
       LEFT JOIN addresses a ON a.id = o.address_id
       WHERE o.id = ? AND o.user_id = ?`,
      [id, req.user.id]
    );
    if (pedidos.length === 0) {
      return res.status(404).json({ mensaje: 'Pedido no encontrado' });
    }
    const p = pedidos[0];

    const [items] = await pool.query(
      `SELECT product_id, product_name, unit_price, quantity
       FROM order_items WHERE order_id = ? ORDER BY id`,
      [id]
    );

    res.json({
      id: p.id,
      status: p.status,
      paymentMethod: p.payment_method,
      deliveryType: p.delivery_type,
      subtotal: Number(p.subtotal),
      shippingCost: Number(p.shipping_cost),
      total: Number(p.total),
      createdAt: p.created_at,
      address: p.recipient_name
        ? {
            recipientName: p.recipient_name,
            street: p.street,
            city: p.city,
            state: p.state,
            postalCode: p.postal_code,
            phone: p.phone,
          }
        : null,
      items: items.map((i) => ({
        productId: i.product_id,
        name: i.product_name,
        price: Number(i.unit_price),
        quantity: i.quantity,
        subtotal: (aCentavos(i.unit_price) * i.quantity) / 100,
      })),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo cargar el pedido' });
  }
});

export default router;