/**
 * PUENTE JS → NATIVO de la ventana flotante.
 *
 * `NativeModules.VentanaFlotante` es el módulo Kotlin que escribimos en
 * FloatingWindowModule.kt. Aquí lo envolvemos con funciones amigables
 * y tipado TypeScript.
 */
import {NativeModules} from 'react-native';
import type {Item} from '../types';

const nativo = NativeModules.VentanaFlotante as {
  tienePermisoOverlay(): Promise<boolean>;
  pedirPermisoOverlay(): Promise<boolean>;
  mostrarBurbuja(): Promise<boolean>;
  ocultarBurbuja(): Promise<boolean>;
  sincronizarPendientes(json: string): Promise<boolean>;
};

/** ¿El usuario ya concedió "Mostrar sobre otras apps"? */
export function tienePermisoOverlay(): Promise<boolean> {
  return nativo ? nativo.tienePermisoOverlay() : Promise.resolve(false);
}

/** Abre Ajustes para que el usuario active el permiso. Devuelve true si ya estaba activo. */
export function pedirPermisoOverlay(): Promise<boolean> {
  return nativo ? nativo.pedirPermisoOverlay() : Promise.resolve(false);
}

export async function mostrarBurbujaFlotante(): Promise<void> {
  if (!nativo) return;
  try {
    await nativo.mostrarBurbuja();
  } catch {}
}

export async function ocultarBurbujaFlotante(): Promise<void> {
  if (!nativo) return;
  try {
    await nativo.ocultarBurbuja();
  } catch {}
}

/**
 * Manda a la burbuja la lista de pendientes NO completados
 * (máximo 8, los más próximos por fecha).
 */
export async function sincronizarPendientesConBurbuja(
  items: Item[],
): Promise<void> {
  if (!nativo) return;
  const pendientes = items
    .filter(i => !i.completado)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .slice(0, 8)
    .map(i => ({
      titulo: i.titulo,
      fecha: i.fecha.slice(0, 10),
    }));
  try {
    await nativo.sincronizarPendientes(JSON.stringify(pendientes));
  } catch {
    // silencioso: la burbuja es un extra, no debe romper la app
  }
}
