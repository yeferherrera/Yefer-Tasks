import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {colores, tipografia, espaciado, sombras} from '../theme';

interface Props {
  icono: string;
  titulo: string;
  mensaje: string;
}

export function EstadoVacio({icono, titulo, mensaje}: Props) {
  return (
    <View style={styles.contenedor}>
      <View style={styles.iconoContainer}>
        <Text style={styles.icono}>{icono}</Text>
      </View>
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignItems: 'center',
    paddingVertical: espaciado.xl * 2,
    paddingHorizontal: espaciado.lg,
  },
  iconoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colores.primarioSuave,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: espaciado.base,
    ...sombras.sm,
  },
  icono: {fontSize: 36},
  titulo: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.sm,
    textAlign: 'center',
  },
  mensaje: {
    ...tipografia.cuerpo,
    color: colores.textoSecundario,
    textAlign: 'center',
    lineHeight: 24,
  },
});
