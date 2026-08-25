/**
 * RECORDATORIOS ESTILO DUOLINGO — YeferTasks
 *
 * Notificaciones heads-up personalizadas que aparecen en la barra de estado.
 * No son burbuja flotante que siga al usuario; aparecen y se van.
 * Mensajes amigables, personalizados con el nombre del usuario.
 */
import notifee, {
  AndroidImportance,
  TriggerType,
  TimestampTrigger,
  RepeatFrequency,
  AlarmType,
} from '@notifee/react-native';
import {Platform, PermissionsAndroid} from 'react-native';
import type {Item} from '../types';
import {hoyISO} from '../utils/fechas';
import {formatearCOP} from '../utils/fechas';

const CANAL_RECORDATORIOS = 'recordatorios-yefertasks';
const CANAL_RESUMEN = 'resumen-diario-yefertasks';

const NOMBRE_USUARIO = 'Yefer';

const SALUDOS_MANANA = [
  '¡Buenos días',
  'Hola',
  '¡Qué tal',
  '¡Madrugada Productiva',
];

const SALUDOS_TARDE = [
  'Buenas tardes',
  'Hola',
  '¡Hola de nuevo',
];

const SALUDOS_NOCHE = [
  'Buenas noches',
  'Hola',
  'Antes de dormir',
];

function obtenerSaludo(): string {
  const hora = new Date().getHours();
  const opciones =
    hora < 12 ? SALUDOS_MANANA : hora < 19 ? SALUDOS_TARDE : SALUDOS_NOCHE;
  return opciones[Math.floor(Math.random() * opciones.length)];
}

function calcularDiasRestantes(fecha: string): number {
  const hoy = hoyISO();
  const [yh, mh, dh] = hoy.split('-').map(Number);
  const [yf, mf, df] = fecha.split('-').map(Number);
  return Math.floor(
    (new Date(yf, mf - 1, df).getTime() - new Date(yh, mh - 1, dh).getTime()) /
      86400000,
  );
}

function mensajePersonalizado(item: Item): {titulo: string; cuerpo: string} {
  const saludo = obtenerSaludo();
  const esPago = item.tipo === 'pago';
  const dias = calcularDiasRestantes(item.fecha);
  const montoStr = item.monto ? ` — ${formatearCOP(item.monto)}` : '';

  if (item.fecha < hoyISO()) {
    return {
      titulo: `⚠️ ${NOMBRE_USUARIO}, esto venció`,
      cuerpo: `${esPago ? '💳' : '📝'} "${item.titulo}"${montoStr} ya pasó su fecha. ¡Revisa esto!`,
    };
  }

  if (dias === 0) {
    return {
      titulo: `🔔 ${NOMBRE_USUARIO}, ¡vence HOY!`,
      cuerpo: `${esPago ? '💳' : '📝'} "${item.titulo}"${montoStr} vence hoy. ¡No lo olvides!`,
    };
  }

  if (dias === 1) {
    return {
      titulo: `📅 ${NOMBRE_USUARIO}, vence mañana`,
      cuerpo: `${esPago ? '💳' : '📝'} "${item.titulo}"${montoStr} vence mañana. ¿Ya lo tienes listo?`,
    };
  }

  if (dias <= 3) {
    return {
      titulo: `⏰ ${saludo}, ${NOMBRE_USUARIO}`,
      cuerpo: `Te recuerdo que "${item.titulo}"${montoStr} vence en ${dias} días.`,
    };
  }

  return {
    titulo: `📋 ${saludo}, ${NOMBRE_USUARIO}`,
    cuerpo: `${esPago ? '💳' : '📝'} "${item.titulo}"${montoStr} vence el ${item.fecha.slice(5)}`,
  };
}

export async function inicializarCanales(): Promise<void> {
  await notifee.createChannel({
    id: CANAL_RECORDATORIOS,
    name: 'Recordatorios personalizados',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });

  await notifee.createChannel({
    id: CANAL_RESUMEN,
    name: 'Resumen del día',
    importance: AndroidImportance.HIGH,
    vibration: true,
    sound: 'default',
  });
}

export async function pedirPermiso(): Promise<boolean> {
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
  } catch (e) {
    try {
      const ajustes = await notifee.requestPermission();
      return ajustes.authorizationStatus >= 0;
    } catch {
      return false;
    }
  }
}

/**
 * Envía una notificación heads-up inmediata (estilo Duolingo).
 * Aparece arriba y se va sola; no molesta.
 */
export async function notificarItem(item: Item): Promise<void> {
  const msg = mensajePersonalizado(item);
  await notifee.displayNotification({
    title: msg.titulo,
    body: msg.cuerpo,
    android: {
      channelId: CANAL_RECORDATORIOS,
      smallIcon: 'ic_launcher',
      pressAction: {id: 'default'},
      importance: AndroidImportance.HIGH,
    },
  });
}

/**
 * Programa los 2 recordatorios de un item:
 *  - 1 día antes (heads-up)
 *  - El mismo día (heads-up)
 */
export async function programarRecordatorios(item: Item): Promise<string[]> {
  if (!item.horaRecordatorio || !/^\d{2}:\d{2}$/.test(item.horaRecordatorio)) return [];
  const [horaStr, minutoStr] = item.horaRecordatorio.split(':').map(Number);
  const ids: string[] = [];
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) return [];
  const [y, m, d] = item.fecha.split('-').map(Number);

  const objetivos = [
    {dia: d - 1, etiqueta: 'mañana'},
    {dia: d, etiqueta: 'hoy'},
  ];

  for (const objetivo of objetivos) {
    const fecha = new Date(y, m - 1, objetivo.dia, horaStr, minutoStr, 0, 0);
    if (fecha.getTime() <= Date.now()) continue;

    const msg = mensajePersonalizado({
      ...item,
      fecha:
        objetivo.dia === d
          ? item.fecha
          : `${y}-${String(m).padStart(2, '0')}-${String(objetivo.dia).padStart(2, '0')}`,
    });

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: fecha.getTime(),
      alarmManager: {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      },
    };

    const id = await notifee.createTriggerNotification(
      {
        id: `${item.id}-${objetivo.dia}`,
        title: msg.titulo,
        body: msg.cuerpo,
        android: {
          channelId: CANAL_RECORDATORIOS,
          smallIcon: 'ic_launcher',
          pressAction: {id: 'default'},
          importance: AndroidImportance.HIGH,
        },
      },
      trigger,
    );
    ids.push(id);
  }
  return ids;
}

export async function cancelarRecordatorios(item: Item): Promise<void> {
  if (!item.fecha || !/^\d{4}-\d{2}-\d{2}$/.test(item.fecha)) return;
  const [y, m, d] = item.fecha.split('-').map(Number);
  await notifee.cancelTriggerNotification(`${item.id}-${d}`);
  await notifee.cancelTriggerNotification(`${item.id}-${d - 1}`);
}

/**
 * Programa el resumen diario a las 8:00 AM.
 * Muestra cuántos pendientes tiene Yefer para el día.
 */
export async function programarResumenDiario(
  cantidadPendientes: number,
  cantidadMora: number,
): Promise<void> {
  const ahora = new Date();
  const proxima = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + 1,
    8,
    0,
    0,
    0,
  );

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: proxima.getTime(),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  let titulo: string;
  let cuerpo: string;

  if (cantidadMora > 0) {
    titulo = `⚠️ ${NOMBRE_USUARIO}, tienes ${cantidadMora} en mora`;
    cuerpo = `Revisa tus pagos vencidos. También tienes ${cantidadPendientes} pendiente(s) más.`;
  } else if (cantidadPendientes > 0) {
    titulo = `¡Buenos días ${NOMBRE_USUARIO}! 💰`;
    cuerpo = `Tienes ${cantidadPendientes} pago(s) pendiente(s) esta semana. ¡Tú puedes!`;
  } else {
    titulo = `¡Todo al día, ${NOMBRE_USUARIO}! 🎉`;
    cuerpo = 'No tienes pendientes. ¡Disfruta tu día!';
  }

  await notifee.createTriggerNotification(
    {
      id: 'resumen-diario',
      title: titulo,
      body: cuerpo,
      android: {
        channelId: CANAL_RESUMEN,
        smallIcon: 'ic_launcher',
        pressAction: {id: 'default'},
        importance: AndroidImportance.HIGH,
      },
    },
    trigger,
  );
}
