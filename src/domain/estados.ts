import type {Item, EstadoItem, ItemConEstado, BalanceMes} from '../types';

export function calcularEstadoItem(item: Item, hoy: string): ItemConEstado {
  if (item.completado) {
    return {...item, estado: 'completado', diasMora: 0};
  }
  if (item.fecha < hoy) {
    const [y, m, d] = item.fecha.split('-').map(Number);
    const [yh, mh, dh] = hoy.split('-').map(Number);
    const diff = Math.floor(
      (new Date(yh, mh - 1, dh).getTime() - new Date(y, m - 1, d).getTime()) /
        86400000,
    );
    return {...item, estado: 'mora', diasMora: diff};
  }
  if (item.fecha === hoy) {
    return {...item, estado: 'venceHoy', diasMora: 0};
  }
  return {...item, estado: 'proximo', diasMora: 0};
}

export function clasificarItems(
  items: Item[],
  hoy: string,
): ItemConEstado[] {
  return items.map(i => calcularEstadoItem(i, hoy));
}

export function calcularBalance(
  items: Item[],
  ingresos: Array<{monto: number; fecha: string}>,
  hoy: string,
): BalanceMes {
  const mesActual = hoy.slice(0, 7);
  const pagosMes = items.filter(
    i => i.tipo === 'pago' && i.fecha.slice(0, 7) === mesActual,
  );
  const tareasMes = items.filter(
    i => i.tipo === 'tarea' && i.fecha.slice(0, 7) === mesActual,
  );
  const moraItems = items.filter(
    i => !i.completado && i.fecha < hoy && i.tipo === 'pago',
  );

  const totalGastos = pagosMes.reduce(
    (s, i) => s + (i.completado ? (i.monto ?? 0) : 0),
    0,
  );
  const totalIngresos = ingresos
    .filter(i => i.fecha.slice(0, 7) === mesActual)
    .reduce((s, i) => s + i.monto, 0);

  return {
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
    cantidadPagos: pagosMes.length,
    cantidadTareas: tareasMes.length,
    cantidadMora: moraItems.length,
  };
}

export function colorearEstado(estado: EstadoItem) {
  switch (estado) {
    case 'mora':
      return {fondo: '#FEE2E2', texto: '#DC2626', borde: '#FCA5A5', chip: 'EN MORA'};
    case 'venceHoy':
      return {fondo: '#FEF3C7', texto: '#D97706', borde: '#FCD34D', chip: 'VENCE HOY'};
    case 'proximo':
      return {fondo: '#E8F0FF', texto: '#4E7CFF', borde: '#B8D4FE', chip: 'POR PAGAR'};
    case 'completado':
      return {fondo: '#DCFCE7', texto: '#16A34A', borde: '#86EFAC', chip: 'PAGADO'};
  }
}
