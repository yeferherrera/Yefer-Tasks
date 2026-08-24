import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import {getAuth, createUserWithEmailAndPassword} from '@react-native-firebase/auth';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';

export function RegistroScreen({navigation}: any) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [clave2, setClave2] = useState('');
  const [cargando, setCargando] = useState(false);

  async function crearCuenta() {
    if (!correo.trim()) {
      Alert.alert('Falta el correo', 'Escribe tu correo electrónico.');
      return;
    }
    if (clave.length < 6) {
      Alert.alert('Contraseña corta', 'Debe tener al menos 6 caracteres por seguridad.');
      return;
    }
    if (clave !== clave2) {
      Alert.alert('No coinciden', 'Las dos contraseñas deben ser iguales.');
      return;
    }
    setCargando(true);
    try {
      await createUserWithEmailAndPassword(getAuth(), correo.trim(), clave);
    } catch (e: any) {
      const codigo: string = e?.code ?? '';
      let mensaje = 'No pudimos crear la cuenta. Intenta de nuevo.';
      if (codigo.includes('email-already-in-use')) {
        mensaje = 'Ese correo ya tiene una cuenta. Inicia sesión.';
      } else if (codigo.includes('invalid-email')) {
        mensaje = 'El correo no tiene un formato válido.';
      } else if (codigo.includes('network')) {
        mensaje = 'Sin conexión a internet. Revisa tu red.';
      }
      Alert.alert('Error', mensaje);
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={styles.contenedor}>
      <View style={styles.bgDecorativo}>
        <View style={[styles.circulo, {width: 250, height: 250, top: -100, right: -60, backgroundColor: colores.primarioSuave}]} />
        <View style={[styles.circulo, {width: 180, height: 180, top: 40, left: -80, backgroundColor: colores.pagoFondo}]} />
        <View style={[styles.circulo, {width: 120, height: 120, top: 120, right: 20, backgroundColor: colores.tareaFondo}]} />
      </View>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'android' ? undefined : 'padding'}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.titulo}>YeferTasks</Text>
          <Text style={styles.subtitulo}>
            Crea tu cuenta y comienza a organizar tus pagos y tareas en la nube.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Correo electrónico"
            placeholderTextColor={colores.textoSecundario}
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Contraseña (mínimo 6 caracteres)"
            placeholderTextColor={colores.textoSecundario}
            value={clave}
            onChangeText={setClave}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            placeholderTextColor={colores.textoSecundario}
            value={clave2}
            onChangeText={setClave2}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonCargando]}
            onPress={crearCuenta}
            disabled={cargando}>
            {cargando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.botonTexto}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.link}>
            <Text style={styles.linkTexto}>
              Ya tengo cuenta ·{' '}
              <Text style={{color: colores.primarioOscuro, fontWeight: '700'}}>
                Iniciar sesión
              </Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {flex: 1, backgroundColor: colores.fondo},
  bgDecorativo: {position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden'},
  circulo: {position: 'absolute', borderRadius: 150},
  keyboard: {flex: 1},
  scroll: {padding: espaciado.lg, paddingTop: espaciado.lg * 3},
  logo: {fontSize: 64, textAlign: 'center'},
  titulo: {
    ...tipografia.tituloPantalla,
    textAlign: 'center',
    marginTop: espaciado.sm,
    color: colores.primario,
  },
  subtitulo: {
    ...tipografia.cuerpo,
    color: colores.textoSecundario,
    textAlign: 'center',
    marginBottom: espaciado.lg * 1.5,
    marginTop: espaciado.sm,
  },
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
  boton: {
    backgroundColor: colores.primario,
    borderRadius: radios.botonGrande,
    paddingVertical: espaciado.base,
    alignItems: 'center',
    marginTop: espaciado.xs,
    ...sombras.md,
  },
  botonTexto: {color: '#FFFFFF', fontSize: 17, fontWeight: '700'},
  botonCargando: {opacity: 0.6},
  link: {marginTop: espaciado.base, alignItems: 'center', paddingVertical: espaciado.sm},
  linkTexto: {...tipografia.cuerpo, color: colores.textoSecundario},
});
