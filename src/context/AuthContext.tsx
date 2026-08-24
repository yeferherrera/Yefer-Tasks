import React, {createContext, useContext, useEffect, useState} from 'react';
import {getAuth, onAuthStateChanged, type User} from '@react-native-firebase/auth';

interface AuthEstado {
  usuario: User | null;
  cargando: boolean;
}

const ContextoAuth = createContext<AuthEstado>({
  usuario: null,
  cargando: true,
});

/**
 * PROVEEDOR DE SESIÓN:
 * Escucha a Firebase y sabe en todo momento si hay usuario logueado.
 * Toda la app puede preguntar "¿quién soy?" con useAuth().
 */
export function ProveedorAuth({children}: {children: React.ReactNode}) {
  const [usuario, setUsuario] = useState<User | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // onAuthStateChanged se dispara al abrir la app y en cada login/logout
    const cancelar = onAuthStateChanged(getAuth(), u => {
      setUsuario(u);
      setCargando(false);
    });
    return cancelar;
  }, []);

  return (
    <ContextoAuth.Provider value={{usuario, cargando}}>
      {children}
    </ContextoAuth.Provider>
  );
}

export function useAuth() {
  return useContext(ContextoAuth);
}
