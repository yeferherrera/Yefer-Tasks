import React from 'react';
import {StatusBar, TouchableOpacity, Text, View} from 'react-native';
import {NavigationContainer, DefaultTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {ProveedorAuth, useAuth} from './src/context/AuthContext';
import {inicializarCanales, pedirPermiso} from './src/services/recordatorios';
import {LoginScreen} from './src/screens/LoginScreen';
import {RegistroScreen} from './src/screens/RegistroScreen';
import {InicioScreen} from './src/screens/InicioScreen';
import {CalendarioScreen} from './src/screens/CalendarioScreen';
import {AgregarScreen} from './src/screens/AgregarScreen';
import {AjustesScreen} from './src/screens/AjustesScreen';
import {BalanceScreen} from './src/screens/BalanceScreen';
import {colores, sombras} from './src/theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const temaNavegacion = {
  ...DefaultTheme,
  colors: {...DefaultTheme.colors, background: colores.fondo},
};

function TabIcon({name, focused}: {name: string; focused: boolean}) {
  const icons: Record<string, string> = {
    Inicio: focused ? '🏠' : '🏡',
    Calendario: focused ? '📅' : '📆',
    Balance: focused ? '💰' : '💵',
    Ajustes: focused ? '⚙️' : '🔧',
  };
  return (
    <Text style={{fontSize: 22, opacity: focused ? 1 : 0.5}}>
      {icons[name] ?? '•'}
    </Text>
  );
}

function Pestanas() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarActiveTintColor: colores.primario,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: {
          backgroundColor: colores.tarjeta,
          borderTopColor: colores.divisor,
          height: 64 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 8,
          ...sombras.lg,
        },
        tabBarLabelStyle: {fontSize: 11, fontWeight: '600', marginTop: 2},
        tabBarIcon: ({focused}) => (
          <TabIcon name={route.name} focused={focused} />
        ),
      })}>
      <Tabs.Screen name="Inicio" component={InicioScreen} />
      <Tabs.Screen name="Calendario" component={CalendarioScreen} />
      <Tabs.Screen name="Balance" component={BalanceScreen} />
      <Tabs.Screen name="Ajustes" component={AjustesScreen} />
    </Tabs.Navigator>
  );
}

function BotonAgregar({navigation}: any) {
  const insets = useSafeAreaInsets();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate('Agregar')}
      activeOpacity={0.85}
      style={{
        position: 'absolute',
        bottom: 64 + insets.bottom + 20,
        right: 24,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colores.primario,
        justifyContent: 'center',
        alignItems: 'center',
        ...sombras.lg,
      }}>
      <Text style={{color: '#FFF', fontSize: 32, marginTop: -2, fontWeight: '300'}}>
        +
      </Text>
    </TouchableOpacity>
  );
}

function NavegacionInterna() {
  const {usuario, cargando} = useAuth();

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colores.fondo,
        }}>
        <Text style={{fontSize: 48}}>💰</Text>
        <Text
          style={{
            color: colores.primario,
            marginTop: 12,
            fontWeight: '700',
            fontSize: 18,
          }}>
          YeferTasks
        </Text>
        <Text style={{color: colores.textoSecundario, marginTop: 4}}>
          Cargando...
        </Text>
      </View>
    );
  }

  if (!usuario) {
    return (
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Registro" component={RegistroScreen} />
      </Stack.Navigator>
    );
  }

  return (
    <>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen
          name="Principal"
          children={props => (
            <View style={{flex: 1}}>
              <Pestanas />
              <BotonAgregar navigation={props.navigation} />
            </View>
          )}
        />
        <Stack.Screen
          name="Agregar"
          options={{presentation: 'modal', animation: 'slide_from_bottom'}}
          component={AgregarScreen}
        />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  React.useEffect(() => {
    inicializarCanales().catch(() => {});
    pedirPermiso().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ProveedorAuth>
        <NavigationContainer theme={temaNavegacion}>
          <StatusBar barStyle="dark-content" />
          <NavegacionInterna />
        </NavigationContainer>
      </ProveedorAuth>
    </SafeAreaProvider>
  );
}
