/**
 * Formatea números como pesos colombianos: 150000 -> "$ 150.000"
 * COP no usa decimales (maximumFractionDigits: 0).
 */
export function formatearCOP(monto: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(monto);
}

/** 'YYYY-MM-DD' -> 'lun 25 ago' para mostrar en listas */
export function formatearFecha(fechaISO: string): string {
  const [y, m, d] = fechaISO.split('-').map(Number);
  const fecha = new Date(y, m - 1, d);
  return fecha.toLocaleDateString('es-CO', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/** Fecha de hoy en formato YYYY-MM-DD usando la zona local */
export function hoyISO(): string {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const dia = String(hoy.getDate()).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

/**
 * Compara una fecha ISO con hoy.
 * devuelve: 'pasado' | 'hoy' | 'manana' | 'futuro'
 */
export function estadoFecha(fechaISO: string): 'pasado' | 'hoy' | 'manana' | 'futuro' {
  if (!fechaISO || fechaISO.length < 10) return 'futuro';
  const hoyStr = hoyISO();
  const manana = new Date();
  manana.setDate(manana.getDate() + 1);
  const mananaStr = `${manana.getFullYear()}-${String(manana.getMonth() + 1).padStart(2, '0')}-${String(manana.getDate()).padStart(2, '0')}`;

  if (fechaISO.slice(0, 10) < hoyStr) return 'pasado';
  if (fechaISO.slice(0, 10) === hoyStr) return 'hoy';
  if (fechaISO.slice(0, 10) === mananaStr) return 'manana';
  return 'futuro';
}
