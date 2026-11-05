import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { peticion } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const VACIO = { items: [], total: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [carrito, setCarrito] = useState(VACIO);
  const [cargadoPara, setCargadoPara] = useState(null);

  const recargar = useCallback(async () => {
    setCarrito(await peticion('/carrito'));
  }, []);

  // Al iniciar sesión, trae el carrito de ese usuario
  useEffect(() => {
    if (!user) return;
    let vigente = true;
    peticion('/carrito')
      .then((datos) => {
        if (vigente) {
          setCarrito(datos);
          setCargadoPara(user.id);
        }
      })
      .catch(() => {});
    return () => {
      vigente = false;
    };
  }, [user]);

  const listo = Boolean(user) && cargadoPara === user.id;
  const visible = listo ? carrito : VACIO;
  const cargando = Boolean(user) && !listo;

  async function agregar(productId, quantity = 1) {
    const respuesta = await peticion('/carrito', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    await recargar();
    return respuesta;
  }

  async function cambiar(productId, quantity) {
    const respuesta = await peticion(`/carrito/${productId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
    await recargar();
    return respuesta;
  }

  async function quitar(productId) {
    await peticion(`/carrito/${productId}`, { method: 'DELETE' });
    await recargar();
  }

  const cantidad = visible.items.reduce((suma, i) => suma + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items: visible.items, total: visible.total, cantidad, cargando, agregar, cambiar, quitar }}
    >
      {children}
    </CartContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart() {
  return useContext(CartContext);
}