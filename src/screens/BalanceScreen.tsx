import React, {useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {escucharItems, completarYRecurrente} from '../services/db';
import {TarjetaItem} from '../components/TarjetaItem';
import {EstadoVacio} from '../components/EstadoVacio';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {hoyISO, formatearCOP} from '../utils/fechas';
import type {Item} from '../types';

interface DiaMes {
  dia: number;
  label: string;
  items: Item[];
  total: number;
}

export function BalanceScreen({navigation}: any) {
  const {usuario} = useAuth();
  const [items, setItems] = React.useState<Item[]>([]);
  const [mesSeleccionado, setMesSeleccionado] = React.useState(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });

  React.useEffect(() => {
    if (!usuario) return;
    return escucharItems(usuario.uid, setItems, () => {});
  }, [usuario]);

  const hoy = hoyISO();

  const pagosMes = useMemo(
    () => items.filter(i => i.tipo === 'pago' && i.fecha.slice(0, 7) === mesSeleccionado),
    [items, mesSeleccionado],
  );

  const totalMes = useMemo(
    () => pagosMes.reduce((s, i) => s + (i.monto ?? 0), 0),
    [pagosMes],
  );

  const pagadosMes = useMemo(
    () => pagosMes.filter(i => i.completado),
    [pagosMes],
  );

  const pendientesMes = useMemo(
    () => pagosMes.filter(i => !i.completado),
    [pagosMes],
  );

  const totalPagado = useMemo(
    () => pagadosMes.reduce((s, i) => s + (i.monto ?? 0), 0),
    [pagadosMes],
  );

  const totalPendiente = useMemo(
    () => pendientesMes.reduce((s, i) => s + (i.monto ?? 0), 0),
    [pendientesMes],
  );

  const porcentajePagado = totalMes > 0 ? (totalPagado / totalMes) * 100 : 0;

  const diasDelMes = useMemo(() => {
    const [y, m] = mesSeleccionado.split('-').map(Number);
    const ultimoDia = new Date(y, m, 0).getDate();
    const resultado: DiaMes[] = [];
    for (let d = 1; d <= ultimoDia; d++) {
      const fechaStr = `${mesSeleccionado}-${String(d).padStart(2, '0')}`;
      const itemsDia = pagosMes.filter(i => i.fecha === fechaStr);
      resultado.push({
        dia: d,
        label: new Date(y, m - 1, d).toLocaleDateString('es-CO', {weekday: 'short'}),
        items: itemsDia,
        total: itemsDia.reduce((s, i) => s + (i.monto ?? 0), 0),
      });
    }
    return resultado;
  }, [pagosMes, mesSeleccionado]);

  const maximoDia = Math.max(...diasDelMes.map(d => d.total), 1);

  function mesAnterior() {
    const [y, m] = mesSeleccionado.split('-').map(Number);
    const prev = m === 1 ? 12 : m - 1;
    const year = m === 1 ? y - 1 : y;
    setMesSeleccionado(`${year}-${String(prev).padStart(2, '0')}`);
  }

  function mesSiguiente() {
    const [y, m] = mesSeleccionado.split('-').map(Number);
    const next = m === 12 ? 1 : m + 1;
    const year = m === 12 ? y + 1 : y;
    setMesSeleccionado(`${year}-${String(next).padStart(2, '0')}`);
  }

  const nombreMes = useMemo(() => {
    const [y, m] = mesSeleccionado.split('-').map(Number);
    return new Date(y, m - 1).toLocaleDateString('es-CO', {
      month: 'long',
      year: 'numeric',
    });
  }, [mesSeleccionado]);

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.logo}>YeferTasks</Text>
        <Text style={styles.titulo}>Balance</Text>

        <View style={styles.filaMes}>
          <TouchableOpacity onPress={mesAnterior} style={styles.flechaMes}>
            <Text style={styles.flechaTexto}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.nombreMes}>{nombreMes}</Text>
          <TouchableOpacity onPress={mesSiguiente} style={styles.flechaMes}>
            <Text style={styles.flechaTexto}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tarjetaResumen}>
          <View style={styles.filaResumen}>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Total deudas</Text>
              <Text style={styles.valorResumen}>{formatearCOP(totalMes)}</Text>
            </View>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Pagado</Text>
              <Text style={[styles.valorResumen, {color: colores.completadoTexto}]}>
                {formatearCOP(totalPagado)}
              </Text>
            </View>
          </View>
          <View style={styles.filaResumen}>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Pendiente</Text>
              <Text style={[styles.valorResumen, {color: colores.peligroTexto}]}>
                {formatearCOP(totalPendiente)}
              </Text>
            </View>
            <View style={styles.colResumen}>
              <Text style={styles.labelResumen}>Pagados</Text>
              <Text style={styles.valorResumen}>
                {pagadosMes.length} de {pagosMes.length}
              </Text>
            </View>
          </View>

          <View style={styles.barraProgreso}>
            <View
              style={[
                styles.barraLleno,
                {width: `${porcentajePagado}%`},
              ]}
            />
          </View>
          <Text style={styles.porcentajeTexto}>
            {Math.round(porcentajePagado)}% completado
          </Text>
        </View>

        {pagosMes.length === 0 ? (
          <EstadoVacio
            icono="📊"
            titulo="Sin deudas este mes"
            mensaje="No tienes pagos registrados para este mes."
          />
        ) : (
          <View style={styles.tarjetaGrafica}>
            <Text style={styles.tituloSeccion}>Gastos por día</Text>
            <View style={styles.grafica}>
              {diasDelMes
                .filter(d => d.total > 0)
                .map(d => (
                  <View key={d.dia} style={styles.barraGrupo}>
                    <Text style={styles.barraValor}>
                      {d.total >= 1000 ? `${Math.round(d.total / 1000)}k` : d.total}
                    </Text>
                    <View
                      style={[
                        styles.barra,
                        {
                          height: `${Math.max((d.total / maximoDia) * 100, 4)}%`,
                          backgroundColor:
                            d.items.some(i => i.completado)
                              ? colores.completadoTexto
                              : d.items.some(i => i.fecha < hoy)
                              ? colores.moraTexto
                              : colores.primario,
                        },
                      ]}
                    />
                    <Text style={styles.barraDia}>{d.dia}</Text>
                  </View>
                ))}
            </View>
          </View>
        )}

        {pendientesMes.length > 0 && (
          <View style={styles.tarjetaDetalle}>
            <Text style={styles.tituloSeccion}>Pendientes del mes</Text>
            {pendientesMes.map(item => (
              <TarjetaItem
                key={item.id}
                item={item}
                onToggle={() => {
                  Alert.alert(
                    'Marcar como pagado',
                    `¿ "${item.titulo}" está pagado?`,
                    [
                      {text: 'Cancelar', style: 'cancel'},
                      {
                        text: 'Sí, pagado',
                        onPress: () => completarYRecurrente(usuario!.uid, item),
                      },
                    ],
                  );
                }}
                onEditar={() =>
                  navigation.navigate('Agregar', {item})
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 8},
  titulo: {...tipografia.tituloPantalla, color: colores.texto},
  filaMes: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: espaciado.base,
    gap: espaciado.lg,
  },
  flechaMes: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colores.primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flechaTexto: {fontSize: 22, color: colores.primario, fontWeight: '700'},
  nombreMes: {...tipografia.tituloSeccion, color: colores.texto, textTransform: 'capitalize'},
  tarjetaResumen: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  filaResumen: {flexDirection: 'row', justifyContent: 'space-between', marginBottom: espaciado.sm},
  colResumen: {flex: 1},
  labelResumen: {...tipografia.caption, color: colores.textoSecundario, marginBottom: 2},
  valorResumen: {...tipografia.tituloSeccion, color: colores.texto},
  barraProgreso: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colores.divisor,
    overflow: 'hidden',
    marginTop: espaciado.sm,
  },
  barraLleno: {
    height: '100%',
    borderRadius: 5,
    backgroundColor: colores.primario,
  },
  porcentajeTexto: {
    ...tipografia.caption,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginTop: espaciado.xs,
  },
  tarjetaGrafica: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  tituloSeccion: {...tipografia.tituloSeccion, color: colores.texto, marginBottom: espaciado.md},
  grafica: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 160,
    paddingTop: espaciado.lg,
  },
  barraGrupo: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    height: '100%',
  },
  barraValor: {
    ...tipografia.badge,
    color: colores.textoSecundario,
    marginBottom: 4,
    fontSize: 10,
  },
  barra: {
    width: 20,
    borderRadius: 6,
    minHeight: 4,
  },
  barraDia: {
    ...tipografia.badge,
    color: colores.textoSecundario,
    marginTop: 4,
    fontSize: 10,
  },
  tarjetaDetalle: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    ...sombras.md,
  },
});
