/**
 * SERVICIO DE NOTIFICACIONES (recordatorios)
 *
 * Usa notifee para programar alarmas LOCALES del celular:
 *  - 1 día antes a la hora elegida
 *  - El mismo día a la hora elegida
 * Funcionan SIN internet porque las agenda el propio Android.
 */
import {Platform, PermissionsAndroid} from 'react-native';
import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';
import type {Item} from '../types';

const CANAL_ID = 'recordatorios-yefertasks';

/** Crea el canal de notificación (obligatorio en Android 8+) */
export async function inicializarNotificaciones(): Promise<void> {
  await notifee.createChannel({
    id: CANAL_ID,
    name: 'Recordatorios de pagos y tareas',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

/** Pide el permiso de notificaciones (obligatorio en Android 13+) */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  try {
    // Android 13+ necesita permiso runtime POST_NOTIFICATIONS
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const resultado = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS',
        {
          title: 'Permiso de notificaciones',
          message:
            'YeferTasks necesita enviar notificaciones para recordarte tus pagos y tareas.',
          buttonPositive: 'Permitir',
          buttonNegative: 'No',
        },
      );
      return resultado === PermissionsAndroid.RESULTS.GRANTED;
    }
    // Android anterior: notifee requestPermission funciona bien
    const ajustes = await notifee.requestPermission();
    return ajustes.authorizationStatus >= 0;
  } catch (e) {
    // Si falla el permiso nativo, intentar con notifee como fallback
    try {
      const ajustes = await notifee.requestPermission();
      return ajustes.authorizationStatus >= 0;
    } catch {
      return false;
    }
  }
}

/**
 * Programa los 2 recordatorios de un item.
 * Devuelve los IDs de las alarmas creadas (se guardan para poder cancelarlas).
 */
export async function programarRecordatorios(item: Item): Promise<string[]> {
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) return [];
  const horaRecordatorio = item.horaRecordatorio ?? '09:00';
  if (!/^\d{2}:\d{2}$/.test(horaRecordatorio)) return [];
  const [horaStr, minutoStr] = horaRecordatorio.split(':').map(Number);
  const ids: string[] = [];

  const [y, m, d] = item.fecha.split('-').map(Number);
  const fechasObjetivo = [
    {dia: d - 1, etiqueta: 'vence mañana'},
    {dia: d, etiqueta: '¡VENCE HOY!'},
  ];

  for (const objetivo of fechasObjetivo) {
    let fecha = new Date(y, m - 1, objetivo.dia, horaStr, minutoStr, 0, 0);

    // Si el "1 día antes" ya pasó (ej: agregaste algo para hoy), saltarlo
    if (fecha.getTime() <= Date.now()) continue;

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fecha.getTime(),
    };

    const esPago = item.tipo === 'pago';
    const id = await notifee.createTriggerNotification(
      {
        id: `${item.id}-${objetivo.dia}`,
        title:
          objetivo.etiqueta === '¡VENCE HOY!'
            ? `⏰ ${esPago ? 'Pago' : 'Tarea'} vence HOY`
            : `📅 ${esPago ? 'Pago' : 'Tarea'} ${objetivo.etiqueta}`,
        body: `${item.titulo}${item.monto != null ? ` — $ ${item.monto.toLocaleString('es-CO')}` : ''}`,
        android: {
          channelId: CANAL_ID,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default'},
          sound: 'default',
          importance: AndroidImportance.HIGH,
        },
      },
      trigger,
    );
    ids.push(id);
  }
  return ids;
}

/** Cancela las alarmas de un item (al editar o eliminar) */
export async function cancelarRecordatorios(item: Item): Promise<void> {
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) return;
  const [y, m, d] = item.fecha.split('-').map(Number);
  await notifee.cancelTriggerNotification(`${item.id}-${d}`);
  await notifee.cancelTriggerNotification(`${item.id}-${d - 1}`);
}

/** Envía una notificación de prueba inmediata + una programada para 10 segundos.
 *  Así el usuario ve que funciona sin abrir la app. */
export async function enviarNotificacionPrueba(): Promise<boolean> {
  try {
    // 1. Asegurar que el canal existe
    await notifee.createChannel({
      id: CANAL_ID,
      name: 'Recordatorios',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // 2. Notificación INMEDIATA (se ve al instante si la app está abierta)
    await notifee.displayNotification({
      title: '✅ YeferTasks - Probando',
      body: 'Esta notificación es inmediata. Cierra la app y espera 10 segundos...',
      android: {
        channelId: CANAL_ID,
        pressAction: {id: 'default'},
        sound: 'default',
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.HIGH,
      },
    });

    // 3. Notificación PROGRAMADA para 10 segundos (prueba de trigger)
    await notifee.createTriggerNotification(
      {
        id: 'test-trigger-notificacion',
        title: '✅ YeferTasks - Trigger funciona!',
        body: 'Esta notificación se programó 10 segundos. Llega aunque la app esté cerrada.',
        android: {
          channelId: CANAL_ID,
          pressAction: {id: 'default'},
          sound: 'default',
          smallIcon: 'ic_launcher',
          importance: AndroidImportance.HIGH,
        },
      },
      {
        type: TriggerType.TIMESTAMP,
        timestamp: Date.now() + 10 * 1000,
      },
    );
    return true;
  } catch (e) {
    console.log('[NOTIFICACIONES] Error:', e);
    return false;
  }
}
