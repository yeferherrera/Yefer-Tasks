import React, {useMemo, useState} from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Calendar, LocaleConfig} from 'react-native-calendars';
import {useAuth} from '../context/AuthContext';
import {escucharItems, completarYRecurrente} from '../services/db';
import {TarjetaItem} from '../components/TarjetaItem';
import {EstadoVacio} from '../components/EstadoVacio';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';
import {calcularEstadoItem} from '../domain/estados';
import {hoyISO} from '../utils/fechas';
import type {Item} from '../types';
import {Alert} from 'react-native';

LocaleConfig.locales['es'] = {
  monthNames: [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ],
  monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
  dayNames: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  dayNamesShort: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
  today: 'Hoy',
};
LocaleConfig.defaultLocale = 'es';

export function CalendarioScreen({navigation}: any) {
  const {usuario} = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [diaSeleccionado, setDiaSeleccionado] = useState('');

  React.useEffect(() => {
    if (!usuario) return;
    return escucharItems(usuario.uid, setItems, () => {});
  }, [usuario]);

  const hoy = hoyISO();

  const marcas = useMemo(() => {
    const resultado: Record<string, any> = {};
    for (const item of items) {
      if (item.fecha.length >= 10) {
        const dia = item.fecha.slice(0, 10);
        if (!resultado[dia]) {
          resultado[dia] = {marked: true, dots: []};
        }
        const estado = calcularEstadoItem(item, hoy);
        let color: string = item.tipo === 'pago' ? colores.pagoTexto : colores.tareaTexto;
        if (estado.estado === 'mora') color = colores.moraTexto;
        else if (estado.estado === 'venceHoy') color = colores.advertenciaTexto;
        else if (item.completado) color = colores.completadoTexto;

        resultado[dia].dots.push({key: item.id, color});
      }
    }
    if (diaSeleccionado) {
      resultado[diaSeleccionado] = {
        ...(resultado[diaSeleccionado] || {marked: true, dots: []}),
        selected: true,
        selectedColor: colores.primario,
      };
    }
    return resultado;
  }, [items, diaSeleccionado, hoy]);

  const itemsDelDia = useMemo(
    () =>
      items
        .filter(i => i.fecha.slice(0, 10) === diaSeleccionado)
        .map(i => calcularEstadoItem(i, hoy)),
    [items, diaSeleccionado, hoy],
  );

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView contentContainerStyle={styles.contenido}>
        <Text style={styles.logo}>YeferTasks</Text>
        <Text style={styles.titulo}>Calendario</Text>
        <Text style={styles.subtitulo}>
          Los puntos indican días con pendientes
        </Text>

        <View style={styles.tarjetaCal}>
          <Calendar
            markedDates={marcas}
            markingType="multi-dot"
            onDayPress={dia => setDiaSeleccionado(dia.dateString)}
            theme={{
              calendarBackground: colores.tarjeta,
              textSectionTitleColor: colores.textoSecundario,
              selectedDayBackgroundColor: colores.primario,
              selectedDayTextColor: '#FFFFFF',
              todayTextColor: colores.primarioOscuro,
              dayTextColor: colores.texto,
              textDisabledColor: '#C5CAD3',
              dotColor: colores.primario,
              arrowColor: colores.primarioOscuro,
              monthTextColor: colores.texto,
              textMonthFontWeight: '700',
              textDayFontSize: 16,
            }}
          />
        </View>

        <View style={styles.filaLeyenda}>
          <Punto color={colores.pagoTexto} texto="Pago" />
          <Punto color={colores.tareaTexto} texto="Tarea" />
          <Punto color={colores.moraTexto} texto="Mora" />
          <Punto color={colores.completadoTexto} texto="Pagado" />
        </View>

        {diaSeleccionado !== '' && (
          <>
            <Text style={styles.tituloDia}>{diaSeleccionado}</Text>
            {itemsDelDia.length === 0 ? (
              <EstadoVacio
                icono="🌤️"
                titulo="Nada programado"
                mensaje="Este día está libre. Toca + para agregar algo."
              />
            ) : (
              itemsDelDia.map(item => (
                <TarjetaItem
                  key={item.id}
                  item={item}
                  onToggle={() => {
                    Alert.alert(
                      'Marcar como completado',
                      `¿ "${item.titulo}" está pagado/hecho?`,
                      [
                        {text: 'Cancelar', style: 'cancel'},
                        {
                          text: 'Completar',
                          onPress: () => completarYRecurrente(usuario!.uid, item),
                        },
                      ],
                    );
                  }}
                  onEditar={() =>
                    navigation.navigate('Agregar', {item: items.find(i => i.id === item.id)})
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Punto({color, texto}: {color: string; texto: string}) {
  return (
    <View style={styles.itemLeyenda}>
      <View style={[styles.puntoLeyenda, {backgroundColor: color}]} />
      <Text style={styles.textoLeyenda}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  seguro: {flex: 1, backgroundColor: colores.fondo},
  contenido: {padding: espaciado.base, paddingBottom: espaciado.xl * 3},
  logo: {...tipografia.logo, color: colores.primario, marginBottom: 8},
  titulo: {...tipografia.tituloPantalla, color: colores.texto},
  subtitulo: {
    ...tipografia.cuerpo,
    color: colores.textoSecundario,
    marginBottom: espaciado.base,
  },
  tarjetaCal: {
    backgroundColor: colores.tarjeta,
    borderRadius: radios.tarjeta,
    overflow: 'hidden',
    ...sombras.md,
  },
  filaLeyenda: {
    flexDirection: 'row',
    gap: espaciado.base,
    marginVertical: espaciado.base,
  },
  itemLeyenda: {flexDirection: 'row', alignItems: 'center', gap: 6},
  puntoLeyenda: {width: 8, height: 8, borderRadius: 4},
  textoLeyenda: {fontSize: 13, color: colores.textoSecundario, fontWeight: '500'},
  tituloDia: {
    ...tipografia.tituloSeccion,
    color: colores.texto,
    marginBottom: espaciado.sm,
  },
});
