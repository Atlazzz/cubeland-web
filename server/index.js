import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

app.get('/api/salud', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT NOW() AS ahora');
    res.json({ mensaje: 'Conexión con MySQL correcta', ahora: rows[0].ahora });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al conectar con MySQL' });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Servidor en http://localhost:${process.env.PORT}`);
});