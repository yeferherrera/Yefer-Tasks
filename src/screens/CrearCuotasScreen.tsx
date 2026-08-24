import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {crearPlanCuotas} from '../services/db';
import {calcularValorCuota} from '../domain/estados';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {formatearCOP, hoyISO} from '../utils/fechas';
import {Calendar} from 'react-native-calendars';

export function CrearCuotasScreen({navigation}: any) {
  const {usuario} = useAuth();
  const [nombre, setNombre] = useState('');
  const [totalStr, setTotalStr] = useState('');
  const [numCuotasStr, setNumCuotasStr] = useState('');
  const [interesStr, setInteresStr] = useState('0');
  const [fechaInicio, setFechaInicio] = useState(hoyISO());
  const [notas, setNotas] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const total = useMemo(() => {
    const v = parseInt(totalStr.replace(/\D/g, ''), 10);
    return isNaN(v) ? 0 : v;
  }, [totalStr]);

  const numCuotas = useMemo(() => {
    const v = parseInt(numCuotasStr, 10);
    return isNaN(v) || v < 1 ? 0 : v;
  }, [numCuotasStr]);

  const interes = useMemo(() => {
    const v = parseFloat(interesStr.replace(',', '.'));
    return isNaN(v) || v < 0 ? 0 : v;
  }, [interesStr]);

  const preview = useMemo(() => {
    if (total <= 0 || numCuotas <= 0) {
      return null;
    }
    return calcularValorCuota(total, numCuotas, interes, fechaInicio);
  }, [total, numCuotas, interes, fechaInicio]);

  function formatearInput(valor: string): string {
    const limpio = valor.replace(/\D/g, '');
    return limpio.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }

  async function alGuardar() {
    if (!nombre.trim()) {
      Alert.alert('Nombre requerido', 'Escribe un nombre para el plan.');
      return;
    }
    if (total <= 0) {
      Alert.alert('Valor inválido', 'Ingresa el valor total de la deuda.');
      return;
    }
    if (numCuotas <= 0) {
      Alert.alert('Cuotas inválidas', 'Ingresa el número de cuotas.');
      return;
    }
    if (!usuario) return;

    setGuardando(true);
    try {
      const r = calcularValorCuota(total, numCuotas, interes, fechaInicio);
      const planData: any = {
        nombre: nombre.trim(),
        totalDeuda: total,
        numCuotas,
        tasaInteresMensual: interes,
        valorCuota: r.valorCuota,
        totalConInteres: r.totalConInteres,
        fechaInicio,
        cuotas: r.cuotas,
        completado: false,
        creadoEn: Date.now(),
      };
      if (notas.trim()) {
        planData.notas = notas.trim();
      }
      await crearPlanCuotas(usuario.uid, planData);
      navigation.goBack();
    } catch (e: any) {
      const msg = e?.message || e?.code || JSON.stringify(e);
      Alert.alert('Error', 'No se pudo guardar el plan.\n\n' + msg);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <SafeAreaView style={styles.seguro}>
      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.botonVolver}>← Volver</Text>
            </TouchableOpacity>
            <Text style={styles.titulo}>Nuevo plan de cuotas</Text>
          </View>

          <View style={styles.seccion}>
            <Text style={styles.label}>Nombre de la deuda *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Lavadora, Celular, Carro..."
              placeholderTextColor={colores.textoSecundario}
              value={nombre}
              onChangeText={setNombre}
              maxLength={50}
            />
          </View>

          <View style={styles.seccion}>
            <Text style={styles.label}>Valor total de la deuda *</Text>
            <View style={styles.inputMoneda}>
              <Text style={styles.simboloMoneda}>$</Text>
              <TextInput
                style={styles.inputMonedaValor}
                placeholder="0"
                placeholderTextColor={colores.textoSecundario}
                value={totalStr}
                onChangeText={v => setTotalStr(formatearInput(v))}
                keyboardType="numeric"
                maxLength={15}
              />
            </View>
          </View>

          <View style={styles.fila}>
            <View style={[styles.seccion, {flex: 1}]}>
              <Text style={styles.label}>Número de cuotas *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 6"
                placeholderTextColor={colores.textoSecundario}
                value={numCuotasStr}
                onChangeText={setNumCuotasStr}
                keyboardType="numeric"
                maxLength={3}
              />
            </View>
            <View style={[styles.seccion, {flex: 1}]}>
              <Text style={styles.label}>Interés mensual %</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                placeholderTextColor={colores.textoSecundario}
                value={interesStr}
                onChangeText={setInteresStr}
                keyboardType="decimal-pad"
                maxLength={6}
              />
            </View>
          </View>

          <View style={styles.seccion}>
            <Text style={styles.label}>Fecha de inicio</Text>
            <TouchableOpacity
              style={styles.botonFecha}
              onPress={() => setMostrarCalendario(!mostrarCalendario)}>
              <Text style={styles.fechaTexto}>📅 {fechaInicio}</Text>
            </TouchableOpacity>
            {mostrarCalendario && (
              <Calendar
                current={fechaInicio}
                onDayPress={(day: any) => {
                  setFechaInicio(day.dateString);
                  setMostrarCalendario(false);
                }}
                theme={{
                  calendarBackground: colores.tarjeta,
                  todayTextColor: colores.primario,
                  arrowColor: colores.primario,
                  textDayFontWeight: '500',
                  textMonthFontWeight: '700',
                }}
                style={styles.calendario}
              />
            )}
          </View>

          <View style={styles.seccion}>
            <Text style={styles.label}>Notas (opcional)</Text>
            <TextInput
              style={[styles.input, styles.inputMultilinea]}
              placeholder="Detalles adicionales..."
              placeholderTextColor={colores.textoSecundario}
              value={notas}
              onChangeText={setNotas}
              multiline
              numberOfLines={3}
              maxLength={200}
            />
          </View>

          {preview && (
            <View style={styles.preview}>
              <Text style={styles.previewTitulo}>📊 Vista previa del cálculo</Text>

              <View style={styles.previewCard}>
                <View style={styles.previewFila}>
                  <Text style={styles.previewLabel}>Deuda total</Text>
                  <Text style={styles.previewValor}>{formatearCOP(total)}</Text>
                </View>
                {interes > 0 && (
                  <View style={styles.previewFila}>
                    <Text style={styles.previewLabel}>Interés mensual</Text>
                    <Text style={styles.previewValor}>{interes}%</Text>
                  </View>
                )}
                <View style={styles.previewFila}>
                  <Text style={styles.previewLabel}>Total con intereses</Text>
                  <Text style={[styles.previewValor, {color: colores.moraTexto}]}>
                    {formatearCOP(preview.totalConInteres)}
                  </Text>
                </View>
                <View style={styles.divisor} />
                <View style={styles.previewFila}>
                  <Text style={styles.previewLabel}>Cuota mensual</Text>
                  <Text style={[styles.previewValorGrande, {color: colores.cuotaTexto}]}>
                    {formatearCOP(preview.valorCuota)}
                  </Text>
                </View>
                <Text style={styles.previewSubtitulo}>
                  {numCuotas} pagos de {formatearCOP(preview.valorCuota)}
                </Text>
              </View>

              <Text style={styles.previewDetalleTitulo}>Desglose cuota a cuota:</Text>
              {preview.cuotas.map(c => (
                <View key={c.numero} style={styles.filaCuota}>
                  <View style={styles.filaCuotaIzq}>
                    <View style={styles.numeroCuota}>
                      <Text style={styles.numeroCuotaTexto}>{c.numero}</Text>
                    </View>
                    <View>
                      <Text style={styles.fechaCuota}>{c.fecha}</Text>
                      <Text style={styles.detalleCuota}>
                        Capital: {formatearCOP(c.capital)}
                        {interes > 0 ? ` + Int: ${formatearCOP(c.interes)}` : ''}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.valorCuota}>{formatearCOP(c.valor)}</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity
            style={[styles.botonGuardar, guardando && styles.botonDeshabilitado]}
            onPress={alGuardar}
            disabled={guardando}
            activeOpacity={0.85}>
            <Text style={styles.botonGuardarTexto}>
              {guardando ? 'Guardando...' : 'Crear plan de cuotas'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  header: {marginBottom: espaciado.lg},
  botonVolver: {
    ...tipografia.cuerpo,
    color: colores.primario,
    marginBottom: espaciado.sm,
  },
  titulo: {...tipografia.tituloPantalla, color: colores.texto},
  seccion: {marginBottom: espaciado.base},
  label: {
    ...tipografia.cuerpoNegrita,
    color: colores.texto,
    marginBottom: espaciado.sm,
  },
  input: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.base,
    paddingVertical: 14,
    ...tipografia.cuerpo,
    color: colores.texto,
  },
  inputMultilinea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputMoneda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.base,
  },
  simboloMoneda: {
    ...tipografia.tituloSeccion,
    color: colores.textoSecundario,
    marginRight: espaciado.sm,
  },
  inputMonedaValor: {
    flex: 1,
    paddingVertical: 14,
    ...tipografia.tituloSeccion,
    color: colores.texto,
  },
  fila: {flexDirection: 'row', gap: espaciado.md},
  botonFecha: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.boton,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.base,
    paddingVertical: 14,
  },
  fechaTexto: {...tipografia.cuerpo, color: colores.texto},
  calendario: {
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
    marginTop: espaciado.sm,
  },
  preview: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  previewTitulo: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  previewCard: {
    backgroundColor: colores.cuotaFondo,
    borderRadius: 12,
    padding: espaciado.md,
    marginBottom: espaciado.md,
  },
  previewFila: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  previewLabel: {...tipografia.caption, color: colores.textoSecundario},
  previewValor: {...tipografia.cuerpoNegrita, color: colores.texto},
  previewValorGrande: {
    ...tipografia.montoGrande,
    fontSize: 24,
  },
  previewSubtitulo: {
    ...tipografia.caption,
    color: colores.cuotaTexto,
    textAlign: 'center',
    marginTop: 4,
  },
  divisor: {
    height: 1,
    backgroundColor: colores.cuotaBorde,
    marginVertical: espaciado.sm,
  },
  previewDetalleTitulo: {
    ...tipografia.cuerpoNegrita,
    color: colores.texto,
    marginBottom: espaciado.sm,
  },
  filaCuota: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colores.fondoAcento,
    borderRadius: 10,
    padding: espaciado.md,
    marginBottom: 6,
  },
  filaCuotaIzq: {flexDirection: 'row', alignItems: 'center', gap: espaciado.md},
  numeroCuota: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colores.primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroCuotaTexto: {
    ...tipografia.badge,
    color: colores.primario,
  },
  fechaCuota: {...tipografia.cuerpoNegrita, color: colores.texto, fontSize: 14},
  detalleCuota: {...tipografia.caption, color: colores.textoSecundario},
  valorCuota: {...tipografia.cuerpoNegrita, color: colores.cuotaTexto},
  botonGuardar: {
    backgroundColor: colores.primario,
    borderRadius: radios.botonGrande,
    paddingVertical: 16,
    alignItems: 'center',
    ...sombras.md,
  },
  botonDeshabilitado: {opacity: 0.6},
  botonGuardarTexto: {
    ...tipografia.cuerpoNegrita,
    color: '#FFF',
    fontSize: 17,
  },
});
