// Costo de envío según el estado de la dirección.
// Si el estado no tiene tarifa propia, se usa la zona "Resto del país".
export async function costoEnvio(db, estado) {
  const [propia] = await db.query(
    'SELECT cost FROM shipping_rates WHERE zone = ? AND is_active = TRUE',
    [estado]
  );
  if (propia.length > 0) return Number(propia[0].cost);

  const [general] = await db.query(
    "SELECT cost FROM shipping_rates WHERE zone = 'Resto del país' AND is_active = TRUE"
  );
  return general.length > 0 ? Number(general[0].cost) : null;
}