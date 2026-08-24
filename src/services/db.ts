import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from '@react-native-firebase/firestore';
import type {
  Item,
  ItemSinId,
  Ingreso,
  IngresoSinId,
  PlanCuotas,
  PlanCuotasSinId,
  CuotaIndividual,
} from '../types';

function refItems(uid: string) {
  return collection(getFirestore(), 'users', uid, 'items');
}

function refIngresos(uid: string) {
  return collection(getFirestore(), 'users', uid, 'ingresos');
}

export function escucharItems(
  uid: string,
  alCambiar: (items: Item[]) => void,
  alError: (e: Error) => void,
): () => void {
  return onSnapshot(
    refItems(uid),
    snapshot => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as ItemSinId),
      }));
      items.sort((a, b) => (a.fecha || '').localeCompare(b.fecha || ''));
      console.log('[YeferTasks] Items cargados:', items.length);
      alCambiar(items);
    },
    error => {
      console.error('[YeferTasks] Error escuchando items:', error.message);
      alError(error);
    },
  );
}

export function escucharIngresos(
  uid: string,
  alCambiar: (ingresos: Ingreso[]) => void,
  alError: (e: Error) => void,
): () => void {
  return onSnapshot(
    query(refIngresos(uid), orderBy('fecha', 'desc')),
    snapshot => {
      const ingresos = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as IngresoSinId),
      }));
      alCambiar(ingresos);
    },
    alError,
  );
}

export async function crearItem(uid: string, item: ItemSinId): Promise<string> {
  const ref = await addDoc(refItems(uid), item);
  return ref.id;
}

export async function actualizarItem(
  uid: string,
  id: string,
  cambios: Partial<ItemSinId>,
): Promise<void> {
  await updateDoc(doc(getFirestore(), 'users', uid, 'items', id), cambios);
}

export async function eliminarItem(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'users', uid, 'items', id));
}

export async function eliminarItems(uid: string, ids: string[]): Promise<void> {
  const batch = writeBatch(getFirestore());
  ids.forEach(id => {
    batch.delete(doc(getFirestore(), 'users', uid, 'items', id));
  });
  await batch.commit();
}

export async function completarYRecurrente(
  uid: string,
  item: Item,
): Promise<string | null> {
  if (!item.recurrente) {
    await actualizarItem(uid, item.id, {
      completado: true,
      completadoEn: Date.now(),
    });
    return null;
  }
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) {
    await actualizarItem(uid, item.id, {
      completado: true,
      completadoEn: Date.now(),
    });
    return null;
  }
  const [y, m, d] = item.fecha.split('-').map(Number);
  const proximo = new Date(y, m - 1 + 1, 1);
  const ultimoDia = new Date(
    proximo.getFullYear(),
    proximo.getMonth() + 1,
    0,
  ).getDate();
  const diaFinal = Math.min(d, ultimoDia);
  const fechaNueva = `${proximo.getFullYear()}-${String(proximo.getMonth() + 1).padStart(2, '0')}-${String(diaFinal).padStart(2, '0')}`;

  const batch = writeBatch(getFirestore());
  batch.update(doc(getFirestore(), 'users', uid, 'items', item.id), {
    completado: true,
    completadoEn: Date.now(),
  });
  const nuevoItemRef = doc(refItems(uid));
  batch.set(nuevoItemRef, {
    tipo: item.tipo,
    titulo: item.titulo,
    monto: item.monto ?? null,
    fecha: fechaNueva,
    horaRecordatorio: item.horaRecordatorio ?? '09:00',
    completado: false,
    recurrente: true,
    notas: item.notas ?? null,
    creadoEn: Date.now(),
  });
  await batch.commit();
  return nuevoItemRef.id;
}

export async function crearIngreso(
  uid: string,
  ingreso: IngresoSinId,
): Promise<string> {
  const ref = await addDoc(refIngresos(uid), ingreso);
  return ref.id;
}

export async function actualizarIngreso(
  uid: string,
  id: string,
  cambios: Partial<IngresoSinId>,
): Promise<void> {
  await updateDoc(doc(getFirestore(), 'users', uid, 'ingresos', id), cambios);
}

export async function eliminarIngreso(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'users', uid, 'ingresos', id));
}

function refCuotas(uid: string) {
  return collection(getFirestore(), 'users', uid, 'cuotas');
}

export function escucharCuotas(
  uid: string,
  alCambiar: (planes: PlanCuotas[]) => void,
  alError: (e: Error) => void,
): () => void {
  return onSnapshot(
    query(refCuotas(uid), orderBy('creadoEn', 'desc')),
    snapshot => {
      const planes = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as PlanCuotasSinId),
      }));
      alCambiar(planes);
    },
    alError,
  );
}

export async function crearPlanCuotas(
  uid: string,
  plan: PlanCuotasSinId,
): Promise<string> {
  const ref = await addDoc(refCuotas(uid), plan);
  return ref.id;
}

export async function actualizarPlanCuotas(
  uid: string,
  id: string,
  cambios: Partial<PlanCuotasSinId>,
): Promise<void> {
  await updateDoc(doc(getFirestore(), 'users', uid, 'cuotas', id), cambios);
}

export async function marcarCuotaPagada(
  uid: string,
  planId: string,
  numeroCuota: number,
  cuotas: CuotaIndividual[],
): Promise<void> {
  const actualizadas = cuotas.map(c =>
    c.numero === numeroCuota
      ? {...c, pagado: true, pagadoEn: Date.now()}
      : c,
  );
  const todasPagadas = actualizadas.every(c => c.pagado);
  await updateDoc(doc(getFirestore(), 'users', uid, 'cuotas', planId), {
    cuotas: actualizadas,
    completado: todasPagadas,
  });
}

export async function desmarcarCuotaPagada(
  uid: string,
  planId: string,
  numeroCuota: number,
  cuotas: CuotaIndividual[],
): Promise<void> {
  const actualizadas = cuotas.map(c => {
    if (c.numero !== numeroCuota) return c;
    const {pagadoEn: _removed, ...rest} = c;
    return {...rest, pagado: false};
  });
  await updateDoc(doc(getFirestore(), 'users', uid, 'cuotas', planId), {
    cuotas: actualizadas,
    completado: false,
  });
}

export async function eliminarPlanCuotas(uid: string, id: string): Promise<void> {
  await deleteDoc(doc(getFirestore(), 'users', uid, 'cuotas', id));
}
