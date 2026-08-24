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
