import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {escucharCuotas, eliminarPlanCuotas} from '../services/db';
import {EstadoVacio} from '../components/EstadoVacio';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {resumenPlan, colorearPlan} from '../domain/estados';
import {formatearCOP, hoyISO} from '../utils/fechas';
import type {PlanCuotas} from '../types';

export function CuotasScreen({navigation}: any) {
  const {usuario} = useAuth();
  const [planes, setPlanes] = useState<PlanCuotas[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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

  const activos = useMemo(
    () => planes.filter(p => !p.completado),
    [planes],
  );
  const completados = useMemo(
    () => planes.filter(p => p.completado),
    [planes],
  );

  const totalDeudas = useMemo(
    () => activos.reduce((s, p) => s + p.totalConInteres, 0),
    [activos],
  );
  const totalPagado = useMemo(
    () =>
      activos.reduce((s, p) => {
        const r = resumenPlan(p);
        return s + r.totalPagado;
      }, 0),
    [activos],
  );

  async function alEliminar(plan: PlanCuotas) {
    if (!usuario) return;
    Alert.alert(
      'Eliminar plan',
      `¿Eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarPlanCuotas(usuario.uid, plan.id);
            } catch {
              Alert.alert('Error', 'No se pudo eliminar el plan.');
            }
          },
        },
      ],
    );
  }

  async function onRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }

  function renderPlan(plan: PlanCuotas) {
    const r = resumenPlan(plan);
    const color = colorearPlan(plan);

    return (
      <TouchableOpacity
        key={plan.id}
        style={styles.tarjetaPlan}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('DetalleCuota', {planId: plan.id})}
        onLongPress={() => alEliminar(plan)}>
        <View style={styles.tarjetaHeader}>
          <View style={[styles.chipEstado, {backgroundColor: color.fondo}]}>
            <Text style={[styles.chipEstadoTexto, {color: color.texto}]}>
              {color.chip}
            </Text>
          </View>
          {plan.tasaInteresMensual > 0 && (
            <View style={styles.chipInteres}>
              <Text style={styles.chipInteresTexto}>
                {plan.tasaInteresMensual}% mensual
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.planNombre}>{plan.nombre}</Text>

        <View style={styles.filaValores}>
          <View style={styles.colValor}>
            <Text style={styles.labelValor}>Cuota mensual</Text>
            <Text style={styles.valorPrincipal}>
              {formatearCOP(plan.valorCuota)}
            </Text>
          </View>
          <View style={styles.colValor}>
            <Text style={styles.labelValor}>Total a pagar</Text>
            <Text style={styles.valorSecundario}>
              {formatearCOP(plan.totalConInteres)}
            </Text>
          </View>
        </View>

        <View style={styles.filaProgreso}>
          <Text style={styles.progresoTexto}>
            {r.pagadas} de {r.total} cuotas pagadas
          </Text>
          <Text style={styles.progresoPorcentaje}>{r.porcentaje}%</Text>
        </View>

        <View style={styles.barraProgreso}>
          <View
            style={[
              styles.barraRelleno,
              {
                width: `${r.porcentaje}%`,
                backgroundColor: r.completado
                  ? colores.completadoTexto
                  : colores.primario,
              },
            ]}
          />
        </View>

        <View style={styles.filaResumen}>
          <Text style={styles.resumenItem}>
            Pagado: {formatearCOP(r.totalPagado)}
          </Text>
          <Text style={styles.resumenItem}>
            Restante: {formatearCOP(r.restante)}
          </Text>
        </View>

        {r.proximaPendiente && !r.completado && (
          <View style={styles.filaProxima}>
            <Text style={styles.proximaLabel}>Próxima cuota:</Text>
            <Text style={styles.proximaValor}>
              {formatearCOP(r.proximaPendiente.valor)} —{' '}
              {r.proximaPendiente.fecha}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.seguro}>
      <View style={styles.bgDecorativo}>
        <View
          style={[
            styles.circulo,
            {
              width: 220,
              height: 220,
              top: -70,
              right: -50,
              backgroundColor: colores.cuotaFondo,
            },
          ]}
        />
        <View
          style={[
            styles.circulo,
            {
              width: 160,
              height: 160,
              top: 10,
              left: -60,
              backgroundColor: colores.primarioSuave,
            },
          ]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>YeferTasks</Text>
            <Text style={styles.titulo}>Cuotas</Text>
          </View>
          <TouchableOpacity
            style={styles.botonCrear}
            onPress={() => navigation.navigate('CrearCuota')}>
            <Text style={styles.botonCrearTexto}>+</Text>
          </TouchableOpacity>
        </View>

        {activos.length > 0 && (
          <View style={styles.tarjetaResumenGlobal}>
            <Text style={styles.resumenGlobalTitulo}>Resumen general</Text>
            <View style={styles.filaResumenGlobal}>
              <View style={styles.colResumenGlobal}>
                <Text style={styles.labelResumenGlobal}>Deudas activas</Text>
                <Text style={styles.valorResumenGlobal}>
                  {activos.length}
                </Text>
              </View>
              <View style={styles.colResumenGlobal}>
                <Text style={styles.labelResumenGlobal}>Total deudas</Text>
                <Text style={[styles.valorResumenGlobal, {color: colores.moraTexto}]}>
                  {formatearCOP(totalDeudas)}
                </Text>
              </View>
              <View style={styles.colResumenGlobal}>
                <Text style={styles.labelResumenGlobal}>Pagado</Text>
                <Text style={[styles.valorResumenGlobal, {color: colores.completadoTexto}]}>
                  {formatearCOP(totalPagado)}
                </Text>
              </View>
            </View>
            {totalDeudas > 0 && (
              <View style={styles.barraResumenGlobal}>
                <View
                  style={[
                    styles.barraRellenoGlobal,
                    {
                      width: `${Math.min((totalPagado / totalDeudas) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        )}

        {!cargando && planes.length === 0 && (
          <EstadoVacio
            icono="📊"
            titulo="Sin planes de cuotas"
            mensaje="Crea tu primer plan de cuotas con el botón + de arriba."
          />
        )}

        {activos.length > 0 && (
          <>
            <Text style={styles.seccionTitulo}>Planes activos</Text>
            {activos.map(renderPlan)}
          </>
        )}

        {completados.length > 0 && (
          <>
            <Text style={[styles.seccionTitulo, {marginTop: espaciado.lg}]}>
              Completados ✓
            </Text>
            {completados.map(renderPlan)}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  bgDecorativo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    overflow: 'hidden',
  },
  circulo: {position: 'absolute', borderRadius: 120},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: espaciado.base,
  },
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 4},
  titulo: {...tipografia.tituloPantalla, color: colores.texto},
  botonCrear: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colores.primario,
    justifyContent: 'center',
    alignItems: 'center',
    ...sombras.md,
  },
  botonCrearTexto: {color: '#FFF', fontSize: 26, fontWeight: '300', marginTop: -2},
  tarjetaResumenGlobal: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  resumenGlobalTitulo: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  filaResumenGlobal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  colResumenGlobal: {flex: 1, alignItems: 'center'},
  labelResumenGlobal: {
    ...tipografia.caption,
    color: colores.textoSecundario,
    marginBottom: 4,
  },
  valorResumenGlobal: {...tipografia.cuerpoNegrita, color: colores.texto},
  barraResumenGlobal: {
    height: 6,
    backgroundColor: colores.divisor,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraRellenoGlobal: {
    height: '100%',
    backgroundColor: colores.primario,
    borderRadius: 3,
  },
  seccionTitulo: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.md,
    marginTop: espaciado.sm,
  },
  tarjetaPlan: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.md,
    borderLeftWidth: 4,
    borderLeftColor: colores.cuotaBorde,
    ...sombras.md,
  },
  tarjetaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaciado.sm,
    marginBottom: espaciado.sm,
  },
  chipEstado: {
    borderRadius: radios.chip,
    paddingHorizontal: espaciado.md,
    paddingVertical: 3,
  },
  chipEstadoTexto: {...tipografia.badge},
  chipInteres: {
    backgroundColor: colores.advertenciaFondo,
    borderRadius: radios.chip,
    paddingHorizontal: espaciado.md,
    paddingVertical: 3,
  },
  chipInteresTexto: {
    ...tipografia.badge,
    color: colores.advertenciaTexto,
  },
  planNombre: {
    ...tipografia.cuerpoNegrita,
    color: colores.texto,
    marginBottom: espaciado.md,
  },
  filaValores: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  colValor: {flex: 1},
  labelValor: {
    ...tipografia.caption,
    color: colores.textoSecundario,
    marginBottom: 2,
  },
  valorPrincipal: {
    ...tipografia.cuerpoNegrita,
    color: colores.cuotaTexto,
    fontSize: 18,
  },
  valorSecundario: {
    ...tipografia.cuerpo,
    color: colores.texto,
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
  barraRelleno: {
    height: '100%',
    borderRadius: 4,
  },
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.sm,
  },
  resumenItem: {...tipografia.caption, color: colores.textoSecundario},
  filaProxima: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colores.primarioSuave,
    borderRadius: 10,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    marginTop: espaciado.sm,
  },
  proximaLabel: {...tipografia.caption, color: colores.primarioOscuro},
  proximaValor: {...tipografia.cuerpoNegrita, color: colores.primarioOscuro, fontSize: 13},
});
