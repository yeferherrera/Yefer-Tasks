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
import type {Item, ItemSinId, Ingreso, IngresoSinId} from '../types';

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
    query(refItems(uid), orderBy('fecha', 'asc')),
    snapshot => {
      const items = snapshot.docs.map(d => ({
        id: d.id,
        ...(d.data() as ItemSinId),
      }));
      alCambiar(items);
    },
    alError,
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
): Promise<void> {
  if (!item.recurrente) {
    await actualizarItem(uid, item.id, {
      completado: true,
      completadoEn: Date.now(),
    });
    return;
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
  batch.set(doc(refItems(uid)), {
    tipo: item.tipo,
    titulo: item.titulo,
    monto: item.monto ?? null,
    fecha: fechaNueva,
    horaRecordatorio: item.horaRecordatorio,
    completado: false,
    recurrente: true,
    notas: item.notas ?? null,
    creadoEn: Date.now(),
  } as ItemSinId);
  await batch.commit();
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
