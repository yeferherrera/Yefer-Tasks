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
} from 'react-native';
import {getAuth, signInWithEmailAndPassword} from '@react-native-firebase/auth';
import {colores, tipografia, espaciado, radios, sombras} from '../theme';

export function LoginScreen({navigation}: any) {
  const [correo, setCorreo] = useState('');
  const [clave, setClave] = useState('');
  const [cargando, setCargando] = useState(false);

  async function entrar() {
    if (!correo.trim() || !clave) {
      Alert.alert('Faltan datos', 'Escribe tu correo y contraseña.');
      return;
    }
    setCargando(true);
    try {
      await signInWithEmailAndPassword(getAuth(), correo.trim(), clave);
    } catch (e: any) {
      const codigo: string = e?.code ?? '';
      let mensaje = 'No pudimos iniciar sesión. Intenta de nuevo.';
      if (codigo.includes('user-not-found') || codigo.includes('wrong-password')) {
        mensaje = 'Correo o contraseña incorrectos.';
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
        <View style={styles.caja}>
          <Text style={styles.logo}>💰</Text>
          <Text style={styles.titulo}>YeferTasks</Text>
          <Text style={styles.subtitulo}>Tus pagos y tareas, siempre en orden</Text>

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
            placeholder="Contraseña"
            placeholderTextColor={colores.textoSecundario}
            value={clave}
            onChangeText={setClave}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.boton, cargando && styles.botonCargando]}
            onPress={entrar}
            disabled={cargando}>
            {cargando ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.botonTexto}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('Registro')}
            style={styles.link}>
            <Text style={styles.linkTexto}>
              ¿No tienes cuenta?{' '}
              <Text style={{color: colores.primarioOscuro, fontWeight: '700'}}>
                Regístrate
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: colores.fondo,
    justifyContent: 'center',
    padding: espaciado.lg,
  },
  bgDecorativo: {position: 'absolute', top: 0, left: 0, right: 0, height: 300, overflow: 'hidden'},
  circulo: {position: 'absolute', borderRadius: 150},
  keyboard: {flex: 1},
  caja: {},
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
