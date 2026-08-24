/**
 * SERVICIO DE NOTIFICACIONES (recordatorios)
 *
 * Usa notifee para programar alarmas LOCALES del celular:
 *  - 1 día antes a la hora elegida
 *  - El mismo día a la hora elegida
 * Funcionan SIN internet porque las agenda el propio Android.
 */
import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
} from '@notifee/react-native';
import type { Item } from '../types';

const CANAL_ID = 'recordatorios-yefertask';

/** Crea el canal de notificación (obligatorio en Android 8+) */
export async function inicializarNotificaciones(): Promise<void> {
  await notifee.createChannel({
    id: CANAL_ID,
    name: 'Recordatorios de pagos y tareas',
    importance: AndroidImportance.HIGH,
    vibration: true,
  });
}

/** Pide el permiso de notificaciones (obligatorio en Android 13+) */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  const ajustes = await notifee.requestPermission();
  // 1 = autorizado, -1 = no decidido aún (también lo tratamos como concedido
  // porque Android lo preguntará al mostrar la primera notificación)
  return ajustes.authorizationStatus >= 0;
}

/**
 * Programa los 2 recordatorios de un item.
 * Devuelve los IDs de las alarmas creadas (se guardan para poder cancelarlas).
 */
export async function programarRecordatorios(item: Item): Promise<string[]> {
  const [horaStr, minutoStr] = item.horaRecordatorio.split(':').map(Number);
  const ids: string[] = [];

  const [y, m, d] = item.fecha.split('-').map(Number);
  const fechasObjetivo = [
    { dia: d - 1, etiqueta: 'vence mañana' },
    { dia: d, etiqueta: '¡VENCE HOY!' },
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
        body: `${item.titulo}${item.monto ? ` — $ ${item.monto.toLocaleString('es-CO')}` : ''}`,
        android: {
          channelId: CANAL_ID,
          smallIcon: 'ic_launcher',
          pressAction: { id: 'default' },
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
  const [y, m, d] = item.fecha.split('-').map(Number);
  await notifee.cancelTriggerNotification(`${item.id}-${d}`);
  await notifee.cancelTriggerNotification(`${item.id}-${d - 1}`);
}
