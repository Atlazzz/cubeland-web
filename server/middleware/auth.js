import jwt from 'jsonwebtoken';

// Exige que el usuario haya iniciado sesión
export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET); // { id, role }
    next();
  } catch {
    res.status(401).json({ mensaje: 'Tu sesión expiró. Inicia sesión de nuevo' });
  }
}

// Exige que el usuario tenga uno de los roles indicadoss
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ mensaje: 'No tienes permiso para esta acción' });
    }
    next();
  };
}