import { API_URL } from './config';

export async function peticion(ruta, opciones = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}/api${ruta}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      ...opciones,
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Intenta de nuevo más tarde');
  }
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(datos.mensaje || 'Ocurrió un error. Intenta de nuevo');
    error.status = res.status;
    throw error;
  }
  return datos;
}