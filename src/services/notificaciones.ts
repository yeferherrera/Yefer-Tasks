/**
 * SERVICIO DE NOTIFICACIONES v3 - AlarmManager
 *
 * Usa notifee con AlarmManager (no WorkManager) para que las alarmas
 * funcionen aunque la app esté cerrada, en Doze, o con batería baja.
 *
 * Configuración:
 *  - SET_EXACT_AND_ALLOW_WHILE_IDLE: dispara en Doze mode
 *  - Canal HIGH IMPORTANCE con sonido por defecto
 *  - Verificación de permisos y batería optimizada
 */
import {Platform, PermissionsAndroid, Linking} from 'react-native';
import notifee, {
  AndroidImportance,
  AndroidNotificationSetting,
  TriggerType,
  TimestampTrigger,
  AlarmType,
} from '@notifee/react-native';
import type {Item} from '../types';

const CANAL_ID = 'recordatorios-yefertasks';

// ============================================================
// INICIALIZACIÓN
// ============================================================

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

// ============================================================
// PERMISOS
// ============================================================

/** Pide permiso de notificaciones (Android 13+) */
export async function pedirPermisoNotificaciones(): Promise<boolean> {
  try {
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
    const ajustes = await notifee.requestPermission();
    return ajustes.authorizationStatus >= 0;
  } catch {
    try {
      const ajustes = await notifee.requestPermission();
      return ajustes.authorizationStatus >= 0;
    } catch {
      return false;
    }
  }
}

/** Verifica si el permiso de alarmas exactas está habilitado */
export async function verificarPermisoAlarma(): Promise<boolean> {
  try {
    const settings = await notifee.getNotificationSettings();
    return settings.android.alarm === AndroidNotificationSetting.ENABLED;
  } catch {
    return false;
  }
}

/** Abre ajustes de alarma para que el usuario la habilite */
export async function abrirAjustesAlarma(): Promise<void> {
  try {
    await notifee.openAlarmPermissionSettings();
  } catch {}
}

/** Verifica si la batería optimizada está activa */
export async function verificarBateriaOptimizada(): Promise<boolean> {
  try {
    return await notifee.isBatteryOptimizationEnabled();
  } catch {
    return false;
  }
}

/** Abre ajustes de batería para desactivar optimización */
export async function abrirAjustesBateria(): Promise<void> {
  try {
    await Linking.openSettings();
  } catch {}
}

// ============================================================
// PROGRAMAR RECORDATORIOS (con AlarmManager)
// ============================================================

/**
 * Programa los 2 recordatorios de un item usando AlarmManager.
 * AlarmManager funciona aunque la app esté cerrada.
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

    if (fecha.getTime() <= Date.now()) continue;

    const esPago = item.tipo === 'pago';
    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fecha.getTime(),
      // CLAVE: usar AlarmManager con SET_EXACT_AND_ALLOW_WHILE_IDLE
      // Esto funciona en Doze mode y con batería baja
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

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

/** Cancela las alarmas de un item */
export async function cancelarRecordatorios(item: Item): Promise<void> {
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) return;
  const [y, m, d] = item.fecha.split('-').map(Number);
  await notifee.cancelTriggerNotification(`${item.id}-${d}`);
  await notifee.cancelTriggerNotification(`${item.id}-${d - 1}`);
}

// ============================================================
// NOTIFICACIÓN DE PRUEBA
// ============================================================

/**
 * Envía notificación de prueba:
 *  1. Inmediata (para probar que el canal funciona)
 *  2. Programada para 30 segundos con AlarmManager (para probar background)
 */
export async function enviarNotificacionPrueba(): Promise<{
  inmediata: boolean;
  programada: boolean;
  permisoAlarma: boolean;
  bateriaOptimizada: boolean;
}> {
  const resultado = {
    inmediata: false,
    programada: false,
    permisoAlarma: false,
    bateriaOptimizada: false,
  };

  try {
    // 1. Crear canal
    await notifee.createChannel({
      id: CANAL_ID,
      name: 'Recordatorios',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });

    // 2. Verificar permiso de alarma
    resultado.permisoAlarma = await verificarPermisoAlarma();
    if (!resultado.permisoAlarma) {
      await abrirAjustesAlarma();
      return resultado;
    }

    // 3. Verificar batería optimizada
    resultado.bateriaOptimizada = await verificarBateriaOptimizada();

    // 4. Notificación INMEDIATA
    await notifee.displayNotification({
      title: '✅ YeferTasks - Notificación inmediata',
      body: 'Si ves esto, el canal funciona. Ahora cierra la app...',
      android: {
        channelId: CANAL_ID,
        pressAction: {id: 'default'},
        sound: 'default',
        smallIcon: 'ic_launcher',
        importance: AndroidImportance.HIGH,
      },
    });
    resultado.inmediata = true;

    // 5. Notificación PROGRAMADA para 30 segundos con AlarmManager
    await notifee.createTriggerNotification(
      {
        id: 'test-background-trigger',
        title: '✅ YeferTasks - ¡Llegó sin abrir la app!',
        body: 'Si ves esta notificación, los recordatorios funcionan al 100%.',
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
        timestamp: Date.now() + 30 * 1000,
        // AlarmManager para que funcione con app cerrada
        alarmManager: {
          type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
        },
      },
    );
    resultado.programada = true;
  } catch (e) {
    console.log('[NOTIFICACIONES] Error:', e);
  }

  return resultado;
}
