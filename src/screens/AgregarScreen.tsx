import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Calendar} from 'react-native-calendars';
import {useAuth} from '../context/AuthContext';
import {crearItem, actualizarItem, eliminarItem} from '../services/db';
import {
  pedirPermisoNotificaciones,
  programarRecordatorios,
  cancelarRecordatorios,
} from '../services/notificaciones';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {hoyISO} from '../utils/fechas';
import type {Item, TipoItem, ItemSinId} from '../types';

export function AgregarScreen({navigation, route}: any) {
  const {usuario} = useAuth();
  const itemEditando: Item | undefined = route.params?.item;

  const [tipo, setTipo] = useState<TipoItem>(itemEditando?.tipo ?? 'pago');
  const [titulo, setTitulo] = useState(itemEditando?.titulo ?? '');
  const [monto, setMonto] = useState(
    itemEditando?.monto != null ? String(itemEditando.monto) : '',
  );
  const [fecha, setFecha] = useState(itemEditando?.fecha ?? hoyISO());
  const [hora, setHora] = useState(itemEditando?.horaRecordatorio ?? '09:00');
  const [recurrente, setRecurrente] = useState(itemEditando?.recurrente ?? false);
  const [notas, setNotas] = useState(itemEditando?.notas ?? '');
  const [verCalendario, setVerCalendario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    if (!usuario) return;
    if (!titulo.trim()) {
      Alert.alert('Falta el título', '¿Cómo se llama este pago o tarea?');
      return;
    }
    if (!/^\d{2}:\d{2}$/.test(hora)) {
      Alert.alert('Hora inválida', 'Escríbela como HH:mm, por ejemplo 09:30.');
      return;
    }
    const montoNum = monto.trim() === '' ? null : Number(monto.replace(/[^\d]/g, ''));
    if (tipo === 'pago' && (montoNum == null || montoNum === 0)) {
      Alert.alert('Falta el valor', 'Escribe cuánto debes pagar (en pesos).');
      return;
    }

    setGuardando(true);
    try {
      pedirPermisoNotificaciones().catch(() => {});

      let id: string;

      if (itemEditando) {
        id = itemEditando.id;
        const updates: any = {};
        updates.tipo = tipo;
        updates.titulo = titulo.trim();
        updates.fecha = fecha;
        updates.horaRecordatorio = hora;
        updates.recurrente = recurrente;
        updates.notas = notas.trim() || null;
        updates.monto = tipo === 'pago' ? (montoNum ?? 0) : null;
        await actualizarItem(usuario.uid, id, updates);
        cancelarRecordatorios(itemEditando).catch(() => {});
      } else {
        const nuevoItem: any = {};
        nuevoItem.tipo = tipo;
        nuevoItem.titulo = titulo.trim();
        nuevoItem.fecha = fecha;
        nuevoItem.horaRecordatorio = hora;
        nuevoItem.completado = false;
        nuevoItem.recurrente = recurrente;
        nuevoItem.notas = notas.trim() || null;
        nuevoItem.monto = tipo === 'pago' ? (montoNum ?? 0) : null;
        nuevoItem.creadoEn = Date.now();
        console.log('[YeferTasks] Guardando item:', JSON.stringify(nuevoItem));
        id = await crearItem(usuario.uid, nuevoItem);
        console.log('[YeferTasks] Item guardado con id:', id);
      }

      programarRecordatorios({
        id,
        tipo,
        titulo: titulo.trim(),
        fecha,
        horaRecordatorio: hora,
        completado: false,
        recurrente,
        notas: notas.trim() || undefined,
        creadoEn: Date.now(),
        monto: tipo === 'pago' ? (montoNum ?? 0) : undefined,
      } as Item).catch(() => {});

      navigation.goBack();
    } catch (e) {
      console.error('[YeferTasks] Error al guardar item:', e);
      Alert.alert('Error', 'No se pudo guardar. Revisa tu conexión e intenta otra vez.');
    } finally {
      setGuardando(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('¿Eliminar?', `"${titulo}" se borrará junto con sus recordatorios.`, [
      {text: 'Cancelar', style: 'cancel'},
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          if (!usuario || !itemEditando) return;
          cancelarRecordatorios(itemEditando).catch(() => {});
          await eliminarItem(usuario.uid, itemEditando.id).catch(() => {});
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.botonVolver}>← Volver</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.logo}>YeferTasks</Text>
        <Text style={styles.titulo}>
          {itemEditando ? 'Editar' : 'Nuevo'} {tipo === 'pago' ? 'pago' : 'tarea'}
        </Text>

        <View style={styles.filaTipos}>
          <TouchableOpacity
            style={[styles.botonTipo, tipo === 'pago' && styles.botonPagoActivo]}
            onPress={() => setTipo('pago')}>
            <Text style={[styles.textoTipo, tipo === 'pago' && styles.textoTipoActivo]}>
              💳 Es un pago
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.botonTipo, tipo === 'tarea' && styles.botonTareaActivo]}
            onPress={() => setTipo('tarea')}>
            <Text style={[styles.textoTipo, tipo === 'tarea' && styles.textoTareaActivo]}>
              📝 Es una tarea
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder={tipo === 'pago' ? 'Ej: Arriendo, Internet, Tarjeta...' : 'Ej: Renovar licencia...'}
          placeholderTextColor={colores.textoSecundario}
          value={titulo}
          onChangeText={setTitulo}
        />

        {tipo === 'pago' && (
          <TextInput
            style={styles.input}
            placeholder="Valor en pesos. Ej: 850000"
            placeholderTextColor={colores.textoSecundario}
            value={monto}
            onChangeText={setMonto}
            keyboardType="number-pad"
          />
        )}

        <TouchableOpacity
          style={styles.selector}
          onPress={() => setVerCalendario(!verCalendario)}>
          <Text style={styles.selectorTexto}>📅 Fecha límite: {fecha}</Text>
        </TouchableOpacity>

        {verCalendario && (
          <View style={styles.calendarioContainer}>
            <Calendar
              onDayPress={d => {
                setFecha(d.dateString);
                setVerCalendario(false);
              }}
              markedDates={{[fecha]: {selected: true, selectedColor: colores.primario}}}
              theme={{
                calendarBackground: colores.tarjeta,
                selectedDayBackgroundColor: colores.primario,
                todayTextColor: colores.primarioOscuro,
                arrowColor: colores.primarioOscuro,
                monthTextColor: colores.texto,
                dayTextColor: colores.texto,
                textDisabledColor: '#C5CAD3',
              }}
              minDate={hoyISO()}
            />
          </View>
        )}

        <Text style={styles.etiqueta}>⏰ Recordar a las:</Text>
        <TouchableOpacity style={styles.selectorHora} onPress={() => {
          const horas = Array.from({length: 24}, (_, i) => String(i).padStart(2, '0') + ':00');
          Alert.alert('¿A qué hora?', 'Selecciona la hora del recordatorio', [
            ...horas.map(h => ({text: h, onPress: () => setHora(h)})),
            {text: 'Cancelar', style: 'cancel' as const},
          ]);
        }}>
          <Text style={styles.selectorHoraTexto}>🕐 {hora}</Text>
          <Text style={styles.selectorHoraFlecha}>Cambiar ›</Text>
        </TouchableOpacity>

        <View style={styles.filaSwitch}>
          <View style={{flex: 1}}>
            <Text style={styles.switchTitulo}>🔁 Se repite cada mes</Text>
            <Text style={styles.switchAyuda}>
              Al completarlo se crea automáticamente el del mes siguiente.
            </Text>
          </View>
          <Switch
            value={recurrente}
            onValueChange={setRecurrente}
            trackColor={{true: colores.primario, false: colores.divisor}}
          />
        </View>

        <TextInput
          style={[styles.input, styles.inputNotas]}
          placeholder="Notas (opcional)"
          placeholderTextColor={colores.textoSecundario}
          value={notas}
          onChangeText={setNotas}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.botonPrincipal, guardando && {opacity: 0.6}]}
          onPress={guardar}
          disabled={guardando}>
          <Text style={styles.botonTexto}>
            {guardando ? '⏳ Guardando...' : itemEditando ? '💾 Guardar cambios' : '💾 Guardar'}
          </Text>
        </TouchableOpacity>

        {itemEditando && (
          <TouchableOpacity style={styles.botonBorrar} onPress={confirmarEliminar}>
            <Text style={styles.botonBorrarTexto}>🗑️ Eliminar este item</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  headerRow: {marginBottom: espaciado.sm},
  botonVolver: {color: colores.primario, fontWeight: '700', fontSize: 15},
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 4},
  titulo: {...tipografia.tituloPantalla, color: colores.texto, marginBottom: espaciado.base},
  filaTipos: {flexDirection: 'row', gap: espaciado.sm, marginBottom: espaciado.base},
  botonTipo: {
    flex: 1,
    borderRadius: radios.boton,
    borderWidth: 2,
    borderColor: colores.divisor,
    backgroundColor: colores.tarjeta,
    paddingVertical: espaciado.base,
    alignItems: 'center',
    ...sombras.sm,
  },
  botonPagoActivo: {
    backgroundColor: colores.pagoFondo,
    borderColor: colores.pagoBorde,
  },
  botonTareaActivo: {
    backgroundColor: colores.tareaFondo,
    borderColor: colores.tareaBorde,
  },
  textoTipo: {fontSize: 15, fontWeight: '600', color: colores.textoSecundario},
  textoTipoActivo: {color: colores.pagoTexto},
  textoTareaActivo: {color: colores.tareaTexto},
  input: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.base,
    paddingVertical: espaciado.base - 2,
    fontSize: 16,
    color: colores.texto,
    marginBottom: espaciado.md,
    ...sombras.sm,
  },
  inputNotas: {height: 80, textAlignVertical: 'top', paddingTop: espaciado.md},
  selector: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.base,
    paddingVertical: espaciado.base - 2,
    marginBottom: espaciado.sm,
    ...sombras.sm,
  },
  selectorTexto: {fontSize: 16, color: colores.texto},
  selectorHora: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.primarioBorde,
    paddingHorizontal: espaciado.base,
    paddingVertical: espaciado.base - 2,
    marginBottom: espaciado.sm,
    ...sombras.sm,
  },
  selectorHoraTexto: {fontSize: 16, fontWeight: '700', color: colores.primario},
  selectorHoraFlecha: {fontSize: 14, fontWeight: '600', color: colores.primarioOscuro},
  calendarioContainer: {
    marginBottom: espaciado.md,
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
    ...sombras.md,
  },
  etiqueta: {...tipografia.cuerpoNegrita, color: colores.texto, marginTop: espaciado.xs, marginBottom: espaciado.sm},
  filaSwitch: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.sm,
  },
  switchTitulo: {...tipografia.cuerpoNegrita, color: colores.texto},
  switchAyuda: {fontSize: 13, color: colores.textoSecundario, marginTop: 2},
  botonPrincipal: {
    backgroundColor: colores.primario,
    borderRadius: radios.botonGrande,
    paddingVertical: espaciado.base,
    alignItems: 'center',
    ...sombras.md,
  },
  botonTexto: {color: '#FFFFFF', fontSize: 17, fontWeight: '700'},
  botonBorrar: {alignItems: 'center', paddingVertical: espaciado.base, marginTop: espaciado.xs},
  botonBorrarTexto: {color: colores.peligroTexto, fontWeight: '700', fontSize: 16},
});
