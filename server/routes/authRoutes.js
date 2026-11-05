import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const MAX_INTENTOS = 5;
const MINUTOS_BLOQUEO = 15;
const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const opcionesCookie = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
};

function iniciarSesion(res, usuario) {
  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.cookie('token', token, opcionesCookie);
}

function datosPublicos(u) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

// POST /api/auth/registro
router.post('/registro', async (req, res) => {
  try {
    const nombre = String(req.body.name || '').trim();
    const correo = String(req.body.email || '').trim().toLowerCase();
    const clave = String(req.body.password || '');
    const confirmacion = String(req.body.confirmPassword || '');

    if (!nombre || !correo || !clave || !confirmacion) {
      return res.status(400).json({ mensaje: 'Completa todos los campos' });
    }
    if (!EMAIL_VALIDO.test(correo)) {
      return res.status(400).json({ mensaje: 'El correo no tiene un formato válido' });
    }
    if (clave.length < 8) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 8 caracteres' });
    }
    if (clave.length > 72) {
      return res.status(400).json({ mensaje: 'La contraseña no puede tener más de 72 caracteres' });
    }
    if (clave !== confirmacion) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }
    if (req.body.acceptedPrivacy !== true) {
      return res.status(400).json({ mensaje: 'Debes aceptar el aviso de privacidad' });
    }

    const hash = await bcrypt.hash(clave, 10);
    const [resultado] = await pool.query(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [nombre, correo, hash]
    );

    const usuario = { id: resultado.insertId, name: nombre, email: correo, role: 'customer' };
    iniciarSesion(res, usuario);
    res.status(201).json(datosPublicos(usuario));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ mensaje: 'Ya existe una cuenta con ese correo' });
    }
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo crear la cuenta. Intenta de nuevo' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const correo = String(req.body.email || '').trim().toLowerCase();
    const clave = String(req.body.password || '');
    const generico = { mensaje: 'Correo o contraseña incorrectos' };

    if (!correo || !clave) {
      return res.status(400).json({ mensaje: 'Escribe tu correo y tu contraseña' });
    }

    const [filas] = await pool.query(
      `SELECT *, (locked_until IS NOT NULL AND locked_until > NOW()) AS bloqueado
       FROM users WHERE email = ?`,
      [correo]
    );
    const usuario = filas[0];
    if (!usuario) return res.status(401).json(generico);

    if (usuario.bloqueado) {
      return res.status(429).json({
        mensaje: `Demasiados intentos fallidos. Intenta de nuevo en ${MINUTOS_BLOQUEO} minutos`,
      });
    }

    const coincide = await bcrypt.compare(clave, usuario.password_hash);
    if (!coincide) {
      const intentos = usuario.failed_attempts + 1;
      if (intentos >= MAX_INTENTOS) {
        await pool.query(
          'UPDATE users SET failed_attempts = 0, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
          [MINUTOS_BLOQUEO, usuario.id]
        );
      } else {
        await pool.query('UPDATE users SET failed_attempts = ? WHERE id = ?', [intentos, usuario.id]);
      }
      return res.status(401).json(generico);
    }

    await pool.query('UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ?', [usuario.id]);
    iniciarSesion(res, usuario);
    res.json(datosPublicos(usuario));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'No se pudo iniciar sesión. Intenta de nuevo' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    sameSite: 'lax',
    secure: opcionesCookie.secure,
  });
  res.json({ mensaje: 'Sesión cerrada' });
});

// GET /api/auth/yo  →  datos del usuario con sesión iniciada
router.get('/yo', requireAuth, async (req, res) => {
  try {
    const [filas] = await pool.query(
      'SELECT id, name, email, role FROM users WHERE id = ?',
      [req.user.id]
    );
    if (filas.length === 0) {
      return res.status(401).json({ mensaje: 'Sesión no válida' });
    }
    res.json(filas[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: 'Error al obtener tu sesión' });
  }
});

export default router;