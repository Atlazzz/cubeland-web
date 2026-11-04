import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pool from './db.js';
import productRoutes from './routes/productRoutes.js';
import filterRoutes from './routes/filterRoutes.js';

const app = express();
app.use(cors());
app.use(express.json());

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

app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});