import React from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {formatearCOP, formatearFecha, estadoFecha} from '../utils/fechas';
import {calcularEstadoItem, colorearEstado} from '../domain/estados';
import {hoyISO} from '../utils/fechas';
import type {Item} from '../types';

interface Props {
  item: Item;
  onToggle: () => void;
  onEditar: () => void;
  onLongPress?: () => void;
  seleccionado?: boolean;
  modoSeleccion?: boolean;
  onToggleSeleccion?: () => void;
}

export function TarjetaItem({
  item,
  onToggle,
  onEditar,
  onLongPress,
  seleccionado,
  modoSeleccion,
  onToggleSeleccion,
}: Props) {
  const itemConEstado = calcularEstadoItem(item, hoyISO());
  const estilos = colorearEstado(itemConEstado.estado);
  const esPago = item.tipo === 'pago';

  return (
    <Pressable
      style={[
        styles.tarjeta,
        seleccionado && styles.tarjetaSeleccionada,
        {borderLeftColor: estilos.borde, borderLeftWidth: 4},
      ]}
      android_ripple={{color: colores.divisor}}
      onPress={modoSeleccion ? onToggleSeleccion : onEditar}
      onLongPress={onLongPress}>
      <Pressable
        style={[
          styles.check,
          item.completado && styles.checkActivo,
          seleccionado && styles.checkSeleccion,
        ]}
        onPress={modoSeleccion ? onToggleSeleccion : onToggle}
        accessibilityLabel={
          item.completado
            ? `Marcar ${item.titulo} como pendiente`
            : `Marcar ${item.titulo} como completado`
        }>
        <Text style={styles.checkTexto}>
          {seleccionado ? '✓' : item.completado ? '✓' : ''}
        </Text>
      </Pressable>

      <View style={styles.centro}>
        <Text
          style={[
            styles.titulo,
            item.completado && styles.tituloCompletado,
          ]}
          numberOfLines={2}>
          {item.titulo}
        </Text>

        <View style={styles.filaChips}>
          <View style={[styles.chip, {backgroundColor: estilos.fondo}]}>
            <Text style={[styles.chipTexto, {color: estilos.texto}]}>
              {estilos.chip}
            </Text>
          </View>
          <View style={[styles.chip, {backgroundColor: estilos.fondo}]}>
            <Text style={[styles.chipTexto, {color: estilos.texto}]}>
              {esPago ? '💳' : '📝'} {item.tipo === 'pago' ? 'Pago' : 'Tarea'}
            </Text>
          </View>
          <View style={[styles.chip, {backgroundColor: estilos.fondo}]}>
            <Text style={[styles.chipTexto, {color: estilos.texto}]}>
              📅 {formatearFecha(item.fecha)}
            </Text>
          </View>
          {item.recurrente && (
            <View style={[styles.chip, {backgroundColor: colores.primarioSuave}]}>
              <Text style={[styles.chipTexto, {color: colores.primarioOscuro}]}>
                🔁 Mensual
              </Text>
            </View>
          )}
        </View>

        {item.completado && (
          <View style={styles.filaAcciones}>
            <Pressable style={styles.botonAccion} onPress={onEditar}>
              <Text style={styles.textoAccion}>✏️ Editar</Text>
            </Pressable>
          </View>
        )}
      </View>

      {esPago && item.monto != null && (
        <Text
          style={[
            styles.monto,
            item.completado && styles.tituloCompletado,
          ]}>
          {formatearCOP(item.monto)}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    padding: espaciado.base,
    marginBottom: espaciado.md,
    ...sombras.sm,
  },
  tarjetaSeleccionada: {
    backgroundColor: colores.primarioSuave,
  },
  check: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2.5,
    borderColor: colores.primario,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: espaciado.md,
  },
  checkActivo: {
    backgroundColor: colores.completadoTexto,
    borderColor: colores.completadoTexto,
  },
  checkSeleccion: {
    backgroundColor: colores.primario,
    borderColor: colores.primario,
  },
  checkTexto: {color: '#FFF', fontSize: 18, fontWeight: '700'},
  centro: {flex: 1, marginRight: espaciado.sm},
  titulo: {...tipografia.cuerpoNegrita, color: colores.texto},
  tituloCompletado: {textDecorationLine: 'line-through', color: colores.textoSecundario},
  filaChips: {flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6},
  chip: {borderRadius: radios.chip, paddingHorizontal: 10, paddingVertical: 3},
  chipTexto: {fontSize: 11, fontWeight: '700'},
  filaAcciones: {marginTop: 8, flexDirection: 'row', gap: 8},
  botonAccion: {
    backgroundColor: colores.primarioSuave,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  textoAccion: {fontSize: 12, fontWeight: '700', color: colores.primarioOscuro},
  monto: {...tipografia.cuerpoNegrita, color: colores.texto},
});
