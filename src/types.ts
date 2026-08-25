/**
 * Tipos de datos centrales de YeferTasks.
 */

export type TipoItem = 'pago' | 'tarea';

export type EstadoItem = 'mora' | 'venceHoy' | 'proximo' | 'completado';

export type ModuloFiltro = 'todos' | 'por_pagar' | 'en_mora' | 'pagados';

export interface Item {
  id: string;
  tipo: TipoItem;
  titulo: string;
  monto?: number;
  fecha: string;
  horaRecordatorio: string;
  completado: boolean;
  completadoEn?: number;
  recurrente: boolean;
  notas?: string;
  creadoEn: number;
}

export type ItemSinId = Omit<Item, 'id'>;

export type TipoIngreso = 'salario' | 'freelance' | 'otro';

export interface Ingreso {
  id: string;
  titulo: string;
  monto: number;
  fecha: string;
  categoria: TipoIngreso;
  recurrente: boolean;
  notas?: string;
  creadoEn: number;
}

export type IngresoSinId = Omit<Ingreso, 'id'>;

export interface BalanceMes {
  totalIngresos: number;
  totalGastos: number;
  balance: number;
  cantidadPagos: number;
  cantidadTareas: number;
  cantidadMora: number;
}

export interface ItemConEstado extends Item {
  estado: EstadoItem;
  diasMora: number;
}

export interface CuotaIndividual {
  numero: number;
  valor: number;
  capital: number;
  interes: number;
  fecha: string;
  pagado: boolean;
  pagadoEn?: number;
}

export interface PlanCuotas {
  id: string;
  nombre: string;
  totalDeuda: number;
  numCuotas: number;
  tasaInteresMensual: number;
  valorCuota: number;
  totalConInteres: number;
  fechaInicio: string;
  cuotas: CuotaIndividual[];
  completado: boolean;
  notas?: string;
  creadoEn: number;
}

export type PlanCuotasSinId = Omit<PlanCuotas, 'id'>;

export const VERSION_APP = '3.1';
export const CHANGELOG = [
  '🔔 Notificaciones: ahora usan AlarmManager para funcionar con la app cerrada',
  '⏰ Permisos: se verifica permiso de alarma y optimización de batería',
  '📊 Diagnóstico: test de notificaciones muestra estado completo',
  '🛡️ Estabilidad: notificaciones programadas al crear pagos y tareas',
];
