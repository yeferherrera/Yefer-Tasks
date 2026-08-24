import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {
  escucharCuotas,
  marcarCuotaPagada,
  desmarcarCuotaPagada,
} from '../services/db';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {resumenPlan, colorearPlan} from '../domain/estados';
import {formatearCOP, hoyISO} from '../utils/fechas';
import type {PlanCuotas, CuotaIndividual} from '../types';

export function DetalleCuotaScreen({route, navigation}: any) {
  const {usuario} = useAuth();
  const {planId} = route.params;
  const [planes, setPlanes] = useState<PlanCuotas[]>([]);
  const [cargando, setCargando] = useState(true);

  React.useEffect(() => {
    if (!usuario) return;
    return escucharCuotas(
      usuario.uid,
      lista => {
        setPlanes(lista);
        setCargando(false);
      },
      () => setCargando(false),
    );
  }, [usuario]);

  const plan = useMemo(
    () => planes.find(p => p.id === planId) ?? null,
    [planes, planId],
  );

  const resumen = useMemo(() => (plan ? resumenPlan(plan) : null), [plan]);
  const color = useMemo(() => (plan ? colorearPlan(plan) : null), [plan]);

  async function alPagarCuota(cuota: CuotaIndividual) {
    if (!usuario || !plan) return;
    if (cuota.pagado) {
      Alert.alert(
        'Desmarcar cuota',
        `¿Deseas desmarcar la cuota #${cuota.numero}?`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Desmarcar',
            onPress: async () => {
              try {
                await desmarcarCuotaPagada(
                  usuario.uid,
                  plan.id,
                  cuota.numero,
                  plan.cuotas,
                );
              } catch {
                Alert.alert('Error', 'No se pudo actualizar.');
              }
            },
          },
        ],
      );
    } else {
      Alert.alert(
        'Marcar cuota como pagada',
        `¿Confirmas que pagaste la cuota #${cuota.numero} de ${formatearCOP(cuota.valor)}?`,
        [
          {text: 'Cancelar', style: 'cancel'},
          {
            text: 'Confirmar pago',
            onPress: async () => {
              try {
                await marcarCuotaPagada(
                  usuario.uid,
                  plan.id,
                  cuota.numero,
                  plan.cuotas,
                );
              } catch {
                Alert.alert('Error', 'No se pudo actualizar.');
              }
            },
          },
        ],
      );
    }
  }

  if (cargando) {
    return (
      <SafeAreaView style={styles.seguro}>
        <View style={styles.cargando}>
          <Text style={{color: colores.textoSecundario}}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!plan || !resumen || !color) {
    return (
      <SafeAreaView style={styles.seguro}>
        <View style={styles.cargando}>
          <Text style={{color: colores.moraTexto}}>Plan no encontrado</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{color: colores.primario, marginTop: 12}}>← Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.botonVolver}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <View style={[styles.chipEstado, {backgroundColor: color.fondo}]}>
            <Text style={[styles.chipEstadoTexto, {color: color.texto}]}>
              {color.chip}
            </Text>
          </View>
          <Text style={styles.planNombre}>{plan.nombre}</Text>
        </View>

        <View style={styles.tarjetaResumen}>
          <View style={styles.filaResumen}>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Cuota mensual</Text>
              <Text style={[styles.valorResumen, {color: colores.cuotaTexto}]}>
                {formatearCOP(plan.valorCuota)}
              </Text>
            </View>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Total a pagar</Text>
              <Text style={styles.valorResumen}>
                {formatearCOP(plan.totalConInteres)}
              </Text>
            </View>
          </View>

          {plan.tasaInteresMensual > 0 && (
            <View style={styles.filaResumen}>
              <View style={styles.colResumen}>
                <Text style={styles.labelResumen}>Interés mensual</Text>
                <Text style={[styles.valorResumen, {color: colores.advertenciaTexto}]}>
                  {plan.tasaInteresMensual}%
                </Text>
              </View>
              <View style={styles.colResumen}>
                <Text style={styles.labelResumen}>Total intereses</Text>
                <Text style={[styles.valorResumen, {color: colores.moraTexto}]}>
                  {formatearCOP(plan.totalConInteres - plan.totalDeuda)}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.divisor} />

          <View style={styles.filaProgreso}>
            <Text style={styles.progresoTexto}>
              {resumen.pagadas} de {resumen.total} cuotas
            </Text>
            <Text style={styles.progresoPorcentaje}>{resumen.porcentaje}%</Text>
          </View>
          <View style={styles.barraProgreso}>
            <View
              style={[
                styles.barraRelleno,
                {
                  width: `${resumen.porcentaje}%`,
                  backgroundColor: resumen.completado
                    ? colores.completadoTexto
                    : colores.primario,
                },
              ]}
            />
          </View>

          <View style={styles.filaResumenInferior}>
            <Text style={styles.resumenInferior}>
              Pagado: {formatearCOP(resumen.totalPagado)}
            </Text>
            <Text style={[styles.resumenInferior, {color: colores.moraTexto}]}>
              Restante: {formatearCOP(resumen.restante)}
            </Text>
          </View>
        </View>

        {plan.notas && (
          <View style={styles.notasCard}>
            <Text style={styles.notasLabel}>📝 Notas</Text>
            <Text style={styles.notasTexto}>{plan.notas}</Text>
          </View>
        )}

        <Text style={styles.seccionTitulo}>Cuotas del plan</Text>

        {plan.cuotas.map(cuota => {
          const esVencida = !cuota.pagado && cuota.fecha < hoyISO();
          const esHoy = !cuota.pagado && cuota.fecha === hoyISO();

          return (
            <TouchableOpacity
              key={cuota.numero}
              style={[
                styles.tarjetaCuota,
                cuota.pagado && styles.tarjetaCuotaPagado,
                esVencida && styles.tarjetaCuotaVencida,
                esHoy && styles.tarjetaCuotaHoy,
              ]}
              activeOpacity={0.7}
              onPress={() => alPagarCuota(cuota)}>
              <View style={styles.cuotaIzquierda}>
                <View
                  style={[
                    styles.numeroCuota,
                    cuota.pagado && styles.numeroCuotaPagado,
                    esVencida && styles.numeroCuotaVencida,
                  ]}>
                  {cuota.pagado ? (
                    <Text style={styles.checkIcono}>✓</Text>
                  ) : (
                    <Text
                      style={[
                        styles.numeroCuotaTexto,
                        esVencida && {color: '#FFF'},
                      ]}>
                      {cuota.numero}
                    </Text>
                  )}
                </View>
                <View style={styles.cuotaInfo}>
                  <Text style={styles.cuotaFecha}>{cuota.fecha}</Text>
                  <Text style={styles.cuotaDesglose}>
                    Capital: {formatearCOP(cuota.capital)}
                    {cuota.interes > 0 ? ` + Int: ${formatearCOP(cuota.interes)}` : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.cuotaDerecha}>
                <Text
                  style={[
                    styles.cuotaValor,
                    cuota.pagado && {color: colores.completadoTexto},
                    esVencida && {color: colores.moraTexto},
                  ]}>
                  {formatearCOP(cuota.valor)}
                </Text>
                <Text
                  style={[
                    styles.cuotaEstado,
                    cuota.pagado && {color: colores.completadoTexto},
                    esVencida && {color: colores.moraTexto},
                    esHoy && {color: colores.advertenciaTexto},
                  ]}>
                  {cuota.pagado
                    ? 'PAGADO'
                    : esVencida
                    ? 'VENCIDO'
                    : esHoy
                    ? 'VENCE HOY'
                    : 'PENDIENTE'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonVolver: {
    ...tipografia.cuerpo,
    color: colores.primario,
    marginBottom: espaciado.base,
  },
  headerInfo: {marginBottom: espaciado.base},
  chipEstado: {
    alignSelf: 'flex-start',
    borderRadius: radios.chip,
    paddingHorizontal: espaciado.md,
    paddingVertical: 4,
    marginBottom: espaciado.sm,
  },
  chipEstadoTexto: {...tipografia.badge},
  planNombre: {...tipografia.tituloPantalla, color: colores.texto},
  tarjetaResumen: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  colResumen: {flex: 1, alignItems: 'center'},
  labelResumen: {
    ...tipografia.caption,
    color: colores.textoSecundario,
    marginBottom: 4,
  },
  valorResumen: {...tipografia.cuerpoNegrita, color: colores.texto},
  divisor: {
    height: 1,
    backgroundColor: colores.divisor,
    marginVertical: espaciado.md,
  },
  filaProgreso: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progresoTexto: {...tipografia.caption, color: colores.textoSecundario},
  progresoPorcentaje: {...tipografia.cuerpoNegrita, color: colores.primario},
  barraProgreso: {
    height: 8,
    backgroundColor: colores.divisor,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: espaciado.md,
  },
  barraRelleno: {height: '100%', borderRadius: 4},
  filaResumenInferior: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resumenInferior: {...tipografia.caption, color: colores.textoSecundario},
  notasCard: {
    backgroundColor: colores.advertenciaFondo,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    borderLeftWidth: 4,
    borderLeftColor: colores.advertenciaBorde,
  },
  notasLabel: {...tipografia.cuerpoNegrita, color: colores.advertenciaTexto, marginBottom: 4},
  notasTexto: {...tipografia.cuerpo, color: colores.texto, lineHeight: 22},
  seccionTitulo: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  tarjetaCuota: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: 12,
    padding: espaciado.md,
    marginBottom: espaciado.sm,
    borderLeftWidth: 4,
    borderLeftColor: colores.cuotaBorde,
    ...sombras.sm,
  },
  tarjetaCuotaPagado: {
    borderLeftColor: colores.completadoBorde,
    backgroundColor: '#F8FFF8',
  },
  tarjetaCuotaVencida: {
    borderLeftColor: colores.moraBorde,
    backgroundColor: '#FFF8F8',
  },
  tarjetaCuotaHoy: {
    borderLeftColor: colores.advertenciaBorde,
    backgroundColor: '#FFFEF5',
  },
  cuotaIzquierda: {flexDirection: 'row', alignItems: 'center', gap: espaciado.md},
  numeroCuota: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numeroCuotaPagado: {backgroundColor: colores.completadoFondo},
  numeroCuotaVencida: {backgroundColor: colores.moraTexto},
  numeroCuotaTexto: {...tipografia.badge, color: colores.primario, fontSize: 14},
  checkIcono: {...tipografia.cuerpoNegrita, color: colores.completadoTexto},
  cuotaInfo: {},
  cuotaFecha: {...tipografia.cuerpoNegrita, color: colores.texto, fontSize: 14},
  cuotaDesglose: {...tipografia.caption, color: colores.textoSecundario},
  cuotaDerecha: {alignItems: 'flex-end'},
  cuotaValor: {...tipografia.cuerpoNegrita, color: colores.cuotaTexto},
  cuotaEstado: {...tipografia.badge, color: colores.textoSecundario, marginTop: 2},
});
