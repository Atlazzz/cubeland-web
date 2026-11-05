import { createContext, useContext, useEffect, useState } from 'react';
import { API_URL } from '../config';

const AuthContext = createContext(null);

async function pedir(ruta, opciones = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api/auth${ruta}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo más tarde');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.mensaje || 'Ocurrió un error. Intenta de nuevo');
  return datos;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al abrir la página, comprueba si ya hay una sesión iniciada
  useEffect(() => {
    pedir('/yo')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCargando(false));
  }, []);

  async function login(email, password) {
    const datos = await pedir('/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(datos);
  }

  async function registrar(formulario) {
    const datos = await pedir('/registro', {
      method: 'POST',
      body: JSON.stringify(formulario),
    });
    setUser(datos);
  }

  async function logout() {
    await pedir('/logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, cargando, login, registrar, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}