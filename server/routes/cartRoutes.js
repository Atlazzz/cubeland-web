import { Router } from 'express';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth); // todo el carrito exige sesión iniciada

const MAX_POR_PRODUCTO = 99;

function entero(valor) {
  const n = Number(valor);
  return Number.isInteger(n) ? n : null;
}

function redondear(n) {
  return Math.round(n * 100) / 100;
}

async function leerCarrito(userId) {
  const [filas] = await pool.query(
    `SELECT p.id AS product_id, p.name, p.price, p.stock, p.is_active, ci.quantity
     FROM cart_items ci
     JOIN products p ON p.id = ci.product_id
     WHERE ci.user_id = ?
     ORDER BY ci.id`,
    [userId]
  );
  const items = filas.map((f) => {
    const precio = Number(f.price);
    return {
      productId: f.product_id,
      name: f.name,
      price: precio,
      quantity: f.quantity,
      stock: f.stock,
      active: Boolean(f.is_active),
      subtotal: redondear(precio * f.quantity),
    };
  });
  const total = redondear(items.reduce((suma, i) => suma + i.subtotal, 0));
  return { items, total };
}

// GET /api/carrito  →  productos del carrito y total
router.get('/', async (req, res) => {
  try {
    res.json(await leerCarrito(req.user.id));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo cargar tu carrito' });
  }
});

// POST /api/carrito  →  agrega un producto (suma si ya estaba)
router.post('/', async (req, res) => {
  try {
    const productId = entero(req.body.productId);
    const cantidad = entero(req.body.quantity ?? 1);
    if (!productId || productId < 1 || cantidad === null || cantidad < 1 || cantidad > MAX_POR_PRODUCTO) {
      return res.status(400).json({ mensaje: 'La cantidad no es válida' });
    }

    const [productos] = await pool.query(
      'SELECT stock FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    if (productos.length === 0) {
      return res.status(404).json({ mensaje: 'Este producto ya no está disponible' });
    }
    const stock = productos[0].stock;
    if (stock === 0) {
      return res.status(409).json({ mensaje: 'Producto agotado' });
    }

    const [existente] = await pool.query(
      'SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    const deseada = (existente[0]?.quantity || 0) + cantidad;
    const cantidadFinal = Math.min(deseada, stock);

    await pool.query(
      `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?) AS nuevo
       ON DUPLICATE KEY UPDATE quantity = nuevo.quantity`,
      [req.user.id, productId, cantidadFinal]
    );

    const ajustado = cantidadFinal < deseada;
    res.status(ajustado ? 200 : 201).json({
      ajustado,
      quantity: cantidadFinal,
      mensaje: ajustado
        ? `Solo hay ${stock} disponibles. Se ajustó la cantidad en tu carrito.`
        : 'Producto agregado al carrito',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo agregar el producto. Intenta de nuevo' });
  }
});

// PATCH /api/carrito/:productId  →  cambia la cantidad
router.patch('/:productId', async (req, res) => {
  try {
    const productId = entero(req.params.productId);
    const cantidad = entero(req.body.quantity);
    if (!productId || cantidad === null || cantidad < 1 || cantidad > MAX_POR_PRODUCTO) {
      return res.status(400).json({ mensaje: 'La cantidad no es válida' });
    }

    const [enCarrito] = await pool.query(
      'SELECT id FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    if (enCarrito.length === 0) {
      return res.status(404).json({ mensaje: 'Ese producto no está en tu carrito' });
    }

    const [productos] = await pool.query(
      'SELECT stock FROM products WHERE id = ? AND is_active = TRUE',
      [productId]
    );
    if (productos.length === 0) {
      return res.status(404).json({ mensaje: 'Este producto ya no está disponible' });
    }
    const stock = productos[0].stock;
    if (stock === 0) {
      return res.status(409).json({ mensaje: 'Producto agotado' });
    }

    const cantidadFinal = Math.min(cantidad, stock);
    await pool.query(
      'UPDATE cart_items SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [cantidadFinal, req.user.id, productId]
    );

    const ajustado = cantidadFinal < cantidad;
    res.json({
      ajustado,
      quantity: cantidadFinal,
      mensaje: ajustado ? `Solo hay ${stock} disponibles. Se ajustó la cantidad.` : 'Cantidad actualizada',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo actualizar la cantidad. Intenta de nuevo' });
  }
});

// DELETE /api/carrito/:productId  →  quita un producto
router.delete('/:productId', async (req, res) => {
  try {
    const productId = entero(req.params.productId);
    if (!productId) {
      return res.status(400).json({ mensaje: 'Producto no válido' });
    }
    await pool.query(
      'DELETE FROM cart_items WHERE user_id = ? AND product_id = ?',
      [req.user.id, productId]
    );
    res.json({ mensaje: 'Producto eliminado del carrito' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo eliminar el producto. Intenta de nuevo' });
  }
});

export default router;