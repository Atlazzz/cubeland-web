import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import 'dotenv/config';
import pool from './db.js';
import productRoutes from './routes/productRoutes.js';
import filterRoutes from './routes/filterRoutes.js';
import authRoutes from './routes/authRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import { requireAuth, requireRole } from './middleware/auth.js';

if (!process.env.JWT_SECRET) {
  console.error('Falta JWT_SECRET en el archivo .env');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.get('/api/salud', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS ahora');
    res.json({ mensaje: 'Conexión con MySQL correcta', ahora: rows[0].ahora });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al conectar con MySQL' });
  }
});

app.use('/api/productos', productRoutes);
app.use('/api/filtros', filterRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/carrito', cartRoutes);
app.use('/api/direcciones', addressRoutes);
app.use('/api/envio', shippingRoutes);
app.use('/api/pedidos', orderRoutes);

// Ruta de prueba: solo el personal autorizado puede entrar (RF-23)
app.get('/api/admin/ping', requireAuth, requireRole('staff'), (req, res) => {
  res.json({ mensaje: 'Acceso de personal autorizado' });
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});