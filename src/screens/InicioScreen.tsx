import React, {useMemo, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';
import {escucharItems, completarYRecurrente, actualizarItem, eliminarItems} from '../services/db';
import {sincronizarPendientesConBurbuja} from '../services/ventanaFlotante';
import {TarjetaItem} from '../components/TarjetaItem';
import {EstadoVacio} from '../components/EstadoVacio';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {calcularEstadoItem, clasificarItems} from '../domain/estados';
import {hoyISO, formatearCOP} from '../utils/fechas';
import type {Item, ModuloFiltro, ItemConEstado} from '../types';

export function InicioScreen({navigation}: any) {
  const {usuario} = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState<ModuloFiltro>('todos');
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const [modoSeleccion, setModoSeleccion] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  React.useEffect(() => {
    if (!usuario) return;
    return escucharItems(
      usuario.uid,
      lista => {
        setItems(lista);
        setCargando(false);
      },
      () => setCargando(false),
    );
  }, [usuario]);

  React.useEffect(() => {
    sincronizarPendientesConBurbuja(items);
  }, [items]);

  const hoy = hoyISO();
  const mesActual = hoy.slice(0, 7);

  const itemsConEstado = useMemo(() => clasificarItems(items, hoy), [items, hoy]);

  const porPagar = useMemo(
    () => itemsConEstado.filter(i => !i.completado && i.fecha >= hoy),
    [itemsConEstado],
  );

  const enMora = useMemo(
    () => itemsConEstado.filter(i => i.estado === 'mora'),
    [itemsConEstado],
  );

  const pagados = useMemo(
    () => itemsConEstado.filter(i => i.completado),
    [itemsConEstado],
  );

  const visibles = useMemo(() => {
    switch (filtro) {
      case 'por_pagar':
        return porPagar;
      case 'en_mora':
        return enMora;
      case 'pagados':
        return pagados;
      default:
        return itemsConEstado.filter(i => !i.completado);
    }
  }, [filtro, itemsConEstado, porPagar, enMora, pagados]);

  const resumenMes = useMemo(() => {
    const delMes = itemsConEstado.filter(i => i.fecha.startsWith(mesActual));
    const totalMes = delMes.reduce((s, i) => s + (i.monto || 0), 0);
    const pagadosMes = delMes
      .filter(i => i.completado)
      .reduce((s, i) => s + (i.monto || 0), 0);
    return {totalMes, pagadosMes, restante: totalMes - pagadosMes};
  }, [itemsConEstado, mesActual]);

  async function alCompletar(item: Item) {
    if (!usuario) return;
    Alert.alert(
      'Marcar como completado',
      `¿Estás seguro de que "${item.titulo}" está pagado/hecho?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Completar',
          onPress: async () => {
            try {
              await completarYRecurrente(usuario.uid, item);
            } catch {
              Alert.alert('Error', 'No se pudo completar. Intenta de nuevo.');
            }
          },
        },
      ],
    );
  }

  function alEditar(item: Item) {
    navigation.navigate('Agregar', {item});
  }

  function alLargoPress(item: Item) {
    if (!modoSeleccion) {
      setModoSeleccion(true);
      setSeleccion([item.id]);
    }
  }

  function alToggleSeleccion(id: string) {
    setSeleccion(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }

  function cancelarSeleccion() {
    setModoSeleccion(false);
    setSeleccion([]);
  }

  async function eliminarSeleccionados() {
    if (!usuario || seleccion.length === 0) return;
    Alert.alert(
      'Eliminar seleccionados',
      `¿Eliminar ${seleccion.length} elemento(s)?`,
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarItems(usuario.uid, seleccion);
              cancelarSeleccion();
            } catch {
              Alert.alert('Error', 'No se pudieron eliminar.');
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

  const modulos: [ModuloFiltro, string, number][] = [
    ['todos', 'Todos', itemsConEstado.filter(i => !i.completado).length],
    ['por_pagar', 'Por pagar', porPagar.length],
    ['en_mora', 'En mora', enMora.length],
    ['pagados', 'Pagados', pagados.length],
  ];

  return (
    <SafeAreaView style={styles.seguro}>
      <View style={styles.bgDecorativo}>
        <View style={[styles.circulo, {width: 200, height: 200, top: -60, right: -40, backgroundColor: colores.primarioSuave}]} />
        <View style={[styles.circulo, {width: 140, height: 140, top: 20, left: -50, backgroundColor: colores.pagoFondo}]} />
      </View>

      {modoSeleccion && (
        <View style={styles.barraSeleccion}>
          <TouchableOpacity onPress={cancelarSeleccion}>
            <Text style={styles.cancelarSeleccion}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.contadorSeleccion}>
            {seleccion.length} seleccionado(s)
          </Text>
          <TouchableOpacity onPress={eliminarSeleccionados}>
            <Text style={styles.eliminarSeleccion}>🗑</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>YeferTasks</Text>
            <Text style={styles.saludo}>Hola 👋</Text>
          </View>
          {enMora.length > 0 && (
            <View style={styles.badgeMora}>
              <Text style={styles.badgeMoraTexto}>{enMora.length}</Text>
            </View>
          )}
        </View>

        {enMora.length > 0 && (
          <View style={styles.tarjetaAlerta}>
            <Text style={styles.alertaIcono}>⚠️</Text>
            <View style={{flex: 1}}>
              <Text style={styles.alertaTitulo}>
                Tienes {enMora.length} en mora
              </Text>
              <Text style={styles.alertaTexto}>
                Revisa los pagos vencidos para evitar recargos
              </Text>
            </View>
          </View>
        )}

        {resumenMes.totalMes > 0 && (
          <View style={styles.tarjetaResumen}>
            <Text style={styles.resumenTitulo}>Resumen del mes</Text>
            <View style={styles.filaResumen}>
              <View style={styles.colResumen}>
                <Text style={styles.resumenLabel}>Total del mes</Text>
                <Text style={styles.resumenValor}>{formatearCOP(resumenMes.totalMes)}</Text>
              </View>
              <View style={styles.colResumen}>
                <Text style={styles.resumenLabel}>Pagado</Text>
                <Text style={[styles.resumenValor, {color: colores.completadoTexto}]}>
                  {formatearCOP(resumenMes.pagadosMes)}
                </Text>
              </View>
              <View style={styles.colResumen}>
                <Text style={styles.resumenLabel}>Restante</Text>
                <Text style={[styles.resumenValor, {color: colores.moraTexto}]}>
                  {formatearCOP(resumenMes.restante)}
                </Text>
              </View>
            </View>
            {resumenMes.totalMes > 0 && (
              <View style={styles.barraProgreso}>
                <View
                  style={[
                    styles.barraProgresoRelleno,
                    {
                      width: `${Math.min(
                        (resumenMes.pagadosMes / resumenMes.totalMes) * 100,
                        100,
                      )}%`,
                    },
                  ]}
                />
              </View>
            )}
          </View>
        )}

        <View style={styles.filaFiltros}>
          {modulos.map(([valor, texto, count]) => (
            <TouchableOpacity
              key={valor}
              style={[
                styles.chipFiltro,
                filtro === valor && styles.chipActivo,
                valor === 'en_mora' && count > 0 && styles.chipMora,
              ]}
              onPress={() => setFiltro(valor)}>
              <Text
                style={[
                  styles.chipTexto,
                  filtro === valor && styles.chipTextoActivo,
                  valor === 'en_mora' && count > 0 && styles.chipMoraTexto,
                ]}>
                {texto}
              </Text>
              {count > 0 && (
                <View
                  style={[
                    styles.badgeFiltro,
                    filtro === valor && styles.badgeFiltroActivo,
                  ]}>
                  <Text
                    style={[
                      styles.badgeFiltroTexto,
                      filtro === valor && styles.badgeFiltroTextoActivo,
                    ]}>
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {!cargando && visibles.length === 0 && (
          <EstadoVacio
            icono="🎉"
            titulo="Todo al día"
            mensaje={
              items.length === 0
                ? 'Agrega tu primer pago o tarea con el botón + de abajo.'
                : 'No hay nada en esta categoría.'
            }
          />
        )}

        {visibles.map(item => (
          <TarjetaItem
            key={item.id}
            item={item}
            onToggle={() => alCompletar(item)}
            onEditar={() => alEditar(item)}
            onLongPress={() => alLargoPress(item)}
            seleccionado={seleccion.includes(item.id)}
            modoSeleccion={modoSeleccion}
            onToggleSeleccion={() => alToggleSeleccion(item.id)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  bgDecorativo: {position: 'absolute', top: 0, left: 0, right: 0, height: 200, overflow: 'hidden'},
  circulo: {position: 'absolute', borderRadius: 100},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: espaciado.base,
  },
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 4},
  saludo: {...tipografia.tituloPantalla, color: colores.texto},
  badgeMora: {
    backgroundColor: colores.moraFondo,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeMoraTexto: {color: colores.moraTexto, ...tipografia.badge},
  tarjetaAlerta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.moraFondo,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    borderLeftWidth: 4,
    borderLeftColor: colores.moraTexto,
    gap: espaciado.md,
  },
  alertaIcono: {fontSize: 28},
  alertaTitulo: {fontWeight: '700', color: colores.moraTexto, fontSize: 15},
  alertaTexto: {color: colores.textoSecundario, fontSize: 13, marginTop: 2},
  tarjetaResumen: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.base,
    ...sombras.md,
  },
  resumenTitulo: {...tipografia.tituloSeccion, color: colores.texto, marginBottom: espaciado.md},
  filaResumen: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: espaciado.md,
  },
  colResumen: {flex: 1, alignItems: 'center'},
  resumenLabel: {...tipografia.caption, color: colores.textoSecundario, marginBottom: 4},
  resumenValor: {...tipografia.cuerpoNegrita, color: colores.texto},
  barraProgreso: {
    height: 6,
    backgroundColor: colores.divisor,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barraProgresoRelleno: {
    height: '100%',
    backgroundColor: colores.primario,
    borderRadius: 3,
  },
  filaFiltros: {
    flexDirection: 'row',
    gap: espaciado.sm,
    marginBottom: espaciado.base,
    flexWrap: 'wrap',
  },
  chipFiltro: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radios.chip,
    borderWidth: 1.5,
    borderColor: colores.divisor,
    paddingHorizontal: espaciado.md,
    paddingVertical: espaciado.sm,
    backgroundColor: colores.tarjeta,
    gap: 6,
  },
  chipActivo: {
    backgroundColor: colores.primarioSuave,
    borderColor: colores.primario,
  },
  chipMora: {
    borderColor: colores.moraBorde,
  },
  chipMoraTexto: {
    color: colores.moraTexto,
  },
  chipTexto: {
    fontSize: 13,
    fontWeight: '600',
    color: colores.textoSecundario,
  },
  chipTextoActivo: {
    color: colores.primarioOscuro,
  },
  badgeFiltro: {
    backgroundColor: colores.divisor,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  badgeFiltroActivo: {
    backgroundColor: colores.primario,
  },
  badgeFiltroTexto: {
    color: colores.textoSecundario,
    fontSize: 11,
    fontWeight: '700',
  },
  badgeFiltroTextoActivo: {
    color: '#FFF',
  },
  barraSeleccion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colores.primarioSuave,
    paddingHorizontal: espaciado.base,
    paddingVertical: espaciado.sm,
    borderBottomWidth: 1,
    borderBottomColor: colores.primarioBorde,
  },
  cancelarSeleccion: {
    fontSize: 18,
    color: colores.primarioOscuro,
    fontWeight: '700',
  },
  contadorSeleccion: {
    fontWeight: '700',
    color: colores.primarioOscuro,
    fontSize: 14,
  },
  eliminarSeleccion: {fontSize: 20},
});
