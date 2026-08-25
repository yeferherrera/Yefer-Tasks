import React, {useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Switch,
  Modal,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getAuth, signOut} from '@react-native-firebase/auth';
import {useAuth} from '../context/AuthContext';
import {pedirPermisoNotificaciones, enviarNotificacionPrueba} from '../services/notificaciones';
import notifee from '@notifee/react-native';
import {
  tienePermisoOverlay,
  pedirPermisoOverlay,
  mostrarBurbujaFlotante,
  ocultarBurbujaFlotante,
} from '../services/ventanaFlotante';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';

export function AjustesScreen() {
  const {usuario} = useAuth();
  const [burbujaActiva, setBurbujaActiva] = useState(false);
  const [resumenMatutino, setResumenMatutino] = useState(true);
  const [horaRecordatorio, setHoraRecordatorio] = useState('08:00');
  const [notifPagos, setNotifPagos] = useState(true);
  const [notifTareas, setNotifTareas] = useState(true);
  const [notifIngresos, setNotifIngresos] = useState(true);
  const [notifMora, setNotifMora] = useState(true);
  const [verHoras, setVerHoras] = useState(false);

  async function alternarBurbuja() {
    if (burbujaActiva) {
      await ocultarBurbujaFlotante();
      setBurbujaActiva(false);
      return;
    }
    let permiso = await tienePermisoOverlay();
    if (!permiso) {
      await pedirPermisoOverlay();
      Alert.alert(
        'Activa el permiso',
        'En la pantalla que se abrió, activa "Mostrar sobre otras apps" para YeferTasks y vuelve aquí.',
      );
      return;
    }
    await mostrarBurbujaFlotante();
    setBurbujaActiva(true);
  }

  function salir() {
    Alert.alert('¿Cerrar sesión?', 'Podrás volver a entrar con tu correo.', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Salir', style: 'destructive', onPress: () => signOut(getAuth())},
    ]);
  }

  async function probarNotificacion() {
    const permiso = await pedirPermisoNotificaciones();
    if (!permiso) {
      Alert.alert(
        '⚠️ Sin permiso',
        'Ve a Ajustes del celular → Apps → YeferTasks → Notificaciones y actívalas.',
      );
      return;
    }

    try {
      await notifee.cancelTriggerNotification('test-trigger-notificacion');
    } catch {}

    const enviado = await enviarNotificacionPrueba();
    Alert.alert(
      enviado ? '✅ Notificaciones programadas' : '⚠️ No se pudo enviar',
      enviado
        ? 'Te llegaron 2 notificaciones:\n\n1. Una AHORA (inmediata)\n2. Otra en 10 SEGUNDOS (trigger)\n\nSi la segunda llega sin abrir la app, todo funciona.'
        : 'No se pudo enviar. Revisa que las notificaciones estén activas en los ajustes del celular.',
    );
  }

  function seleccionarHora() {
    setVerHoras(true);
  }

  const iniciales = 'YH';

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.circulosFondo}>
          <View style={styles.circuloGrande} />
          <View style={styles.circuloMediano} />
          <View style={styles.circuloPequeno} />
        </View>

        <Text style={styles.logo}>YeferTasks</Text>
        <Text style={styles.titulo}>Ajustes</Text>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Cuenta</Text>
          <View style={styles.perfil}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciales}</Text>
            </View>
            <View style={styles.perfilInfo}>
              <Text style={styles.nombreUsuario}>Yefererson Herrera</Text>
              <Text style={styles.emailUsuario}>{usuario?.email}</Text>
            </View>
          </View>
          <View style={styles.divisor} />
          <TouchableOpacity style={styles.botonSalir} onPress={salir}>
            <Text style={styles.botonSalirIcono}>⏻</Text>
            <Text style={styles.botonSalirTexto}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Personalización de notificaciones</Text>

          <View style={styles.filaToggle}>
            <View style={styles.filaToggleInfo}>
              <Text style={styles.toggleLabel}>Resumen matutino</Text>
              <Text style={styles.toggleDescripcion}>
                Recibe un resumen diario de tus pendientes al iniciar el día
              </Text>
            </View>
            <Switch
              value={resumenMatutino}
              onValueChange={setResumenMatutino}
              trackColor={{false: colores.divisor, true: colores.primarioBorde}}
              thumbColor={resumenMatutino ? colores.primario : '#f4f3f4'}
            />
          </View>

          {resumenMatutino && (
            <TouchableOpacity style={styles.filaHora} onPress={seleccionarHora}>
              <Text style={styles.horaLabel}>Hora del recordatorio</Text>
              <View style={styles.horaValor}>
                <Text style={styles.horaTexto}>{horaRecordatorio}</Text>
                <Text style={styles.horaFlecha}>›</Text>
              </View>
            </TouchableOpacity>
          )}

          <View style={styles.divisor} />
          <Text style={styles.subseccion}>Tipos de notificación</Text>

          <View style={styles.filaToggle}>
            <View style={styles.tipoNotif}>
              <View style={[styles.tipoIcono, {backgroundColor: colores.pagoFondo}]}>
                <Text style={styles.tipoIconoTexto}>$</Text>
              </View>
              <Text style={styles.toggleLabel}>Pagos</Text>
            </View>
            <Switch
              value={notifPagos}
              onValueChange={setNotifPagos}
              trackColor={{false: colores.divisor, true: colores.primarioBorde}}
              thumbColor={notifPagos ? colores.primario : '#f4f3f4'}
            />
          </View>

          <View style={styles.filaToggle}>
            <View style={styles.tipoNotif}>
              <View style={[styles.tipoIcono, {backgroundColor: colores.tareaFondo}]}>
                <Text style={styles.tipoIconoTexto}>✓</Text>
              </View>
              <Text style={styles.toggleLabel}>Tareas</Text>
            </View>
            <Switch
              value={notifTareas}
              onValueChange={setNotifTareas}
              trackColor={{false: colores.divisor, true: colores.primarioBorde}}
              thumbColor={notifTareas ? colores.primario : '#f4f3f4'}
            />
          </View>

          <View style={styles.filaToggle}>
            <View style={styles.tipoNotif}>
              <View style={[styles.tipoIcono, {backgroundColor: colores.ingresoFondo}]}>
                <Text style={styles.tipoIconoTexto}>↑</Text>
              </View>
              <Text style={styles.toggleLabel}>Ingresos</Text>
            </View>
            <Switch
              value={notifIngresos}
              onValueChange={setNotifIngresos}
              trackColor={{false: colores.divisor, true: colores.primarioBorde}}
              thumbColor={notifIngresos ? colores.primario : '#f4f3f4'}
            />
          </View>

          <View style={styles.filaToggle}>
            <View style={styles.tipoNotif}>
              <View style={[styles.tipoIcono, {backgroundColor: colores.moraFondo}]}>
                <Text style={styles.tipoIconoTexto}>!</Text>
              </View>
              <Text style={styles.toggleLabel}>Mora</Text>
            </View>
            <Switch
              value={notifMora}
              onValueChange={setNotifMora}
              trackColor={{false: colores.divisor, true: colores.primarioBorde}}
              thumbColor={notifMora ? colores.primario : '#f4f3f4'}
            />
          </View>

          <View style={styles.divisor} />
          <TouchableOpacity style={styles.botonSecundario} onPress={probarNotificacion}>
            <Text style={styles.botonSecTexto}>Revisar permiso de notificaciones</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Ventana flotante</Text>
          <Text style={styles.ayuda}>
            Muestra una burbuja sobre otras apps con tus pendientes.
            Tócala para desplegar la lista; arrástrala para moverla.
          </Text>
          <TouchableOpacity style={styles.botonSecundario} onPress={alternarBurbuja}>
            <View style={styles.filaToggle}>
              <Text style={styles.botonSecTexto}>
                {burbujaActiva ? 'Desactivar burbuja flotante' : 'Activar burbuja flotante'}
              </Text>
              <View style={[styles.indicadorEstado, burbujaActiva && styles.indicadorActivo]}>
                <View style={[styles.puntoEstado, burbujaActiva && styles.puntoActivo]} />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloSeccion}>Acerca de</Text>
          <Text style={styles.ayuda}>YeferTasks · v2.3 · Datos en Firebase</Text>
        </View>
      </ScrollView>

      <Modal visible={verHoras} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⏰ Selecciona la hora</Text>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={true}>
              {Array.from({length: 48}, (_, i) => {
                const h = Math.floor(i / 2);
                const m = i % 2 === 0 ? '00' : '30';
                const texto = String(h).padStart(2, '0') + ':' + m;
                const esActual = texto === horaRecordatorio;
                return (
                  <TouchableOpacity
                    key={texto}
                    style={[styles.modalOpcion, esActual && styles.modalOpcionActual]}
                    onPress={() => { setHoraRecordatorio(texto); setVerHoras(false); }}
                  >
                    <Text style={[styles.modalOpcionTexto, esActual && styles.modalOpcionActualTexto]}>
                      {texto}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.modalCerrar} onPress={() => setVerHoras(false)}>
              <Text style={styles.modalCerrarTexto}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  circulosFondo: {position: 'absolute', top: 0, left: 0, right: 0, height: 220},
  circuloGrande: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colores.primario,
    opacity: 0.06,
  },
  circuloMediano: {
    position: 'absolute',
    top: 10,
    left: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colores.primario,
    opacity: 0.04,
  },
  circuloPequeno: {
    position: 'absolute',
    top: 60,
    right: 60,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colores.primarioSuave,
    opacity: 0.3,
  },
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 8},
  titulo: {...tipografia.tituloPantalla, color: colores.texto, marginBottom: espaciado.base},
  tarjeta: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.md,
    ...sombras.sm,
  },
  tituloSeccion: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  perfil: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: espaciado.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colores.primario,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: espaciado.md,
  },
  avatarTexto: {
    ...tipografia.tituloSeccion,
    color: '#FFFFFF',
    fontSize: 18,
  },
  perfilInfo: {flex: 1},
  nombreUsuario: {...tipografia.cuerpoNegrita, color: colores.texto, marginBottom: 2},
  emailUsuario: {...tipografia.caption, color: colores.textoSecundario},
  divisor: {
    height: 1,
    backgroundColor: colores.divisor,
    marginVertical: espaciado.sm,
  },
  botonSalir: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
    gap: espaciado.sm,
  },
  botonSalirIcono: {fontSize: 18, color: colores.moraTexto},
  botonSalirTexto: {fontWeight: '700', fontSize: 15, color: colores.moraTexto},
  filaToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
  },
  filaToggleInfo: {flex: 1, marginRight: espaciado.md},
  toggleLabel: {...tipografia.cuerpo, color: colores.texto},
  toggleDescripcion: {...tipografia.caption, color: colores.textoSecundario, marginTop: 2},
  filaHora: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: espaciado.sm,
  },
  horaLabel: {...tipografia.cuerpo, color: colores.texto},
  horaValor: {flexDirection: 'row', alignItems: 'center', gap: 4},
  horaTexto: {...tipografia.cuerpoNegrita, color: colores.primario},
  horaFlecha: {fontSize: 18, color: colores.primario},
  subseccion: {...tipografia.caption, color: colores.textoSecundario, marginBottom: espaciado.sm},
  tipoNotif: {flexDirection: 'row', alignItems: 'center', flex: 1},
  tipoIcono: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: espaciado.sm,
  },
  tipoIconoTexto: {fontSize: 14, fontWeight: '700'},
  ayuda: {
    ...tipografia.cuerpo,
    color: colores.textoSecundario,
    lineHeight: 22,
    marginBottom: espaciado.sm,
  },
  botonSecundario: {paddingVertical: espaciado.sm + 2},
  botonSecTexto: {fontWeight: '700', fontSize: 15, color: colores.primarioOscuro},
  indicadorEstado: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: colores.divisor,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  indicadorActivo: {
    backgroundColor: colores.primarioBorde,
    alignItems: 'flex-end',
  },
  puntoEstado: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
  },
  puntoActivo: {},
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colores.fondo,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colores.texto,
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colores.divisor,
  },
  modalScroll: {maxHeight: 400},
  modalOpcion: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: colores.divisor,
  },
  modalOpcionActual: {
    backgroundColor: colores.primarioSuave,
  },
  modalOpcionTexto: {
    fontSize: 17,
    color: colores.texto,
    textAlign: 'center',
  },
  modalOpcionActualTexto: {
    color: colores.primario,
    fontWeight: '700',
  },
  modalCerrar: {
    paddingVertical: 14,
    marginTop: 8,
    marginHorizontal: 20,
    backgroundColor: colores.divisor,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCerrarTexto: {
    fontSize: 16,
    fontWeight: '600',
    color: colores.textoSecundario,
  },
});
