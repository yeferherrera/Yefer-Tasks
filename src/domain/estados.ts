import type {
  Item,
  EstadoItem,
  ItemConEstado,
  BalanceMes,
  PlanCuotas,
  CuotaIndividual,
} from '../types';
import {hoyISO} from '../utils/fechas';

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

export function calcularValorCuota(
  totalDeuda: number,
  numCuotas: number,
  tasaInteresMensual: number,
): {valorCuota: number; totalConInteres: number; cuotas: CuotaIndividual[]} {
  const r = tasaInteresMensual / 100;
  let valorCuota: number;
  let totalConInteres: number;

  if (r === 0) {
    valorCuota = Math.round(totalDeuda / numCuotas);
    totalConInteres = totalDeuda;
  } else {
    const factor = Math.pow(1 + r, numCuotas);
    valorCuota = Math.round((totalDeuda * r * factor) / (factor - 1));
    totalConInteres = valorCuota * numCuotas;
  }

  const cuotas: CuotaIndividual[] = [];
  let saldo = totalDeuda;

  for (let i = 1; i <= numCuotas; i++) {
    const interesMes = Math.round(saldo * r);
    const capitalMes = valorCuota - interesMes;
    const [y, m] = getFechaMesOffset(new Date(), i - 1);
    const fecha = `${y}-${String(m + 1).padStart(2, '0')}-01`;

    cuotas.push({
      numero: i,
      valor: i === numCuotas ? saldo + interesMes : valorCuota,
      capital: i === numCuotas ? saldo : capitalMes,
      interes: interesMes,
      fecha,
      pagado: false,
    });

    saldo -= capitalMes;
  }

  return {valorCuota, totalConInteres, cuotas};
}

function getFechaMesOffset(base: Date, offset: number): [number, number] {
  const y = base.getFullYear();
  const m = base.getMonth();
  const totalMes = m + offset;
  const anio = y + Math.floor(totalMes / 12);
  const mes = ((totalMes % 12) + 12) % 12;
  return [anio, mes];
}

export function resumenPlan(plan: PlanCuotas) {
  const pagadas = plan.cuotas.filter(c => c.pagado);
  const totalPagado = pagadas.reduce((s, c) => s + c.valor, 0);
  const capitalPagado = pagadas.reduce((s, c) => s + c.capital, 0);
  const interesPagado = pagadas.reduce((s, c) => s + c.interes, 0);
  const proximaPendiente = plan.cuotas.find(c => !c.pagado);
  const porcentaje = Math.round((totalPagado / plan.totalConInteres) * 100);

  return {
    pagadas: pagadas.length,
    total: plan.cuotas.length,
    totalPagado,
    capitalPagado,
    interesPagado,
    restante: plan.totalConInteres - totalPagado,
    proximaPendiente,
    porcentaje,
    completado: pagadas.length === plan.cuotas.length,
  };
}

export function colorearPlan(plan: PlanCuotas) {
  const r = resumenPlan(plan);
  if (r.completado) {
    return {fondo: '#DCFCE7', texto: '#16A34A', borde: '#86EFAC', chip: 'COMPLETADO'};
  }
  if (r.proximaPendiente && r.proximaPendiente.fecha < hoyISO()) {
    return {fondo: '#FEE2E2', texto: '#DC2626', borde: '#FCA5A5', chip: 'EN MORA'};
  }
  return {fondo: '#F3E8FF', texto: '#8B5CF6', borde: '#C4B5FD', chip: 'ACTIVO'};
}
