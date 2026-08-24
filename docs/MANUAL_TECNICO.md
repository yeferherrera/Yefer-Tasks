# 📘 MANUAL TÉCNICO — YeferTasks v1.1

> **Autor:** Yefererson Herrera ([@yeferherrera](https://github.com/yeferherrera))
> **Última actualización:** Agosto 2026
> **Repositorio:** [https://github.com/yeferherrera/Yefer-Tasks](https://github.com/yeferherrera/Yefer-Tasks)

---

## 📋 Índice

1. [Descripción del Proyecto](#1-descripción-del-proyecto)
2. [Stack Tecnológico](#2-stack-tecnológico)
3. [Arquitectura del Proyecto](#3-arquitectura-del-proyecto)
4. [Estructura de Datos en Firestore](#4-estructura-de-datos-en-firestore)
5. [Modelo de Estados](#5-modelo-de-estados)
6. [Sistema de Notificaciones](#6-sistema-de-notificaciones)
7. [Comandos Esenciales](#7-comandos-esenciales)
8. [Dependencias Principales](#8-dependencias-principales)
9. [Configuración de Firebase](#9-configuración-de-firebase)
10. [Configuración Android](#10-configuración-android)
11. [Configuración para Producción (Play Store)](#11-configuración-para-producción-play-store)
12. [Variables de Entorno y Seguridad](#12-variables-de-entorno-y-seguridad)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. 📱 Descripción del Proyecto

**YeferTasks** es una aplicación móvil diseñada para la **gestión inteligente de pagos, tareas e ingresos** con un sistema de recordatorios personalizados al estilo Duolingo.

### Características principales

- 💳 Gestión de pagos y tareas con estados visuales (mora, vence hoy, próximo, completado)
- 💰 Registro de ingresos por categoría (salario, freelance, otro)
- 📊 Balance mensual con métricas y gráfica de distribución
- 🔔 Notificaciones inteligentes con mensajes personalizados
- 🫧 Burbuja flotante nativa que muestra pendientes sobre otras apps
- 📅 Calendario integrado con vista de eventos
- 🔐 Autenticación con Firebase Auth (email/password)
- ☁️ Sincronización en tiempo real con Cloud Firestore

### Información del proyecto

| Campo | Valor |
|-------|-------|
| Nombre | YeferTasks |
| Paquete | `com.yefertask` |
| Versión actual | 1.0 (versionCode 1) |
| Autor | Yefererson Herrera |
| Plataforma | Android (iOS preparado) |

---

## 2. 🛠️ Stack Tecnológico

| Tecnología | Versión | Uso |
|------------|---------|-----|
| React Native | 0.87 | Framework multiplataforma para UI |
| TypeScript | 6.x | Tipado estático y seguridad en código |
| React | 19.2.3 | Librería de componentes UI |
| Firebase Auth | 26.3.2 | Autenticación de usuarios (email/password) |
| Firebase Firestore | 26.3.2 | Base de datos en tiempo real (NoSQL) |
| Firebase App | 26.3.2 | Core de Firebase para React Native |
| React Navigation | 7.x | Navegación (Stack + Bottom Tabs) |
| Notifee | 9.1.8 | Notificaciones locales programadas |
| React Native Calendars | 1.1314 | Componente de calendario |
| React Native Safe Area Context | 5.9.1 | Áreas seguras del dispositivo |
| React Native Screens | 4.27.0 | Optimización de pantallas nativas |
| Kotlin | — | Módulo nativo (burbuja flotante) |
| Gradle | 9.4 | Build system para Android |
| Hermes | — | Motor JavaScript optimizado para RN |
| Node.js | ≥22.11.0 | Runtime de desarrollo |
| Java / OpenJDK | 17 | Compilación Android |

---

## 3. 🏗️ Arquitectura del Proyecto

### Estructura de carpetas

```
YeferTask/
├── App.tsx                          # Entry point y navegación principal
├── app.json                         # Configuración de nombre de app
├── package.json                     # Dependencias y scripts
├── tsconfig.json                    # Configuración de TypeScript
│
├── src/
│   ├── components/                  # Componentes reutilizables
│   │   ├── TarjetaItem.tsx          # Tarjeta visual de pago/tarea
│   │   └── EstadoVacio.tsx          # Estado vacío (sin datos)
│   │
│   ├── screens/                     # Pantallas de la app
│   │   ├── InicioScreen.tsx         # Pantalla principal (lista de items)
│   │   ├── CalendarioScreen.tsx     # Vista de calendario
│   │   ├── BalanceScreen.tsx        # Balance mensual + gráfica
│   │   ├── AgregarScreen.tsx        # Formulario crear/editar item
│   │   ├── AjustesScreen.tsx        # Configuración de la app
│   │   ├── LoginScreen.tsx          # Inicio de sesión
│   │   └── RegistroScreen.tsx       # Crear cuenta
│   │
│   ├── context/
│   │   └── AuthContext.tsx           # Proveedor de autenticación (React Context)
│   │
│   ├── domain/
│   │   └── estados.ts               # Lógica de estados (mora, vencimiento, balance)
│   │
│   ├── services/                    # Servicios de negocio
│   │   ├── db.ts                    # CRUD Firestore (items + ingresos)
│   │   ├── recordatorios.ts         # Notificaciones estilo Duolingo (principal)
│   │   ├── notificaciones.ts        # Notificaciones legacy (backup)
│   │   └── ventanaFlotante.ts       # Puente JS → Kotlin (burbuja flotante)
│   │
│   ├── theme/
│   │   └── index.ts                 # Colores, tipografía, sombras, espaciado
│   │
│   ├── types.ts                     # Interfaces y tipos TypeScript centrales
│   │
│   └── utils/
│       └── fechas.ts                # Utilidades de formato y fechas
│
├── android/                         # Código nativo Android
│   └── app/src/main/
│       ├── AndroidManifest.xml      # Permisos y componentes nativos
│       └── java/com/com.yefertask/
│           ├── FloatingBubbleService.kt    # Servicio foreground de burbuja
│           ├── FloatingWindowModule.kt     # Módulo NativeModule (puente RN)
│           ├── FloatingWindowPackage.kt    # Paquete de registro nativo
│           ├── MainActivity.kt             # Actividad principal
│           └── MainApplication.kt          # Inicialización de la app
│
└── docs/
    └── MANUAL_TECNICO.md            # Este archivo
```

### Flujo de navegación

```
App.tsx
├── SafeAreaProvider
│   └── ProveedorAuth (AuthContext)
│       └── NavigationContainer
│           └── NavegacionInterna
│               ├── [Sin sesión] → Stack: LoginScreen → RegistroScreen
│               └── [Con sesión] → Stack:
│                   ├── Principal (Tabs)
│                   │   ├── InicioScreen     🏠
│                   │   ├── CalendarioScreen 📅
│                   │   ├── BalanceScreen    💰
│                   │   └── AjustesScreen    ⚙️
│                   └── AgregarScreen (Modal ⬆️)
```

---

## 4. 🗄️ Estructura de Datos en Firestore

La base de datos usa **Cloud Firestore** con una estructura jerárquica por usuario:

```
firestore/
└── users/
    └── {uid}/
        ├── items/         ← Pagos y tareas
        │   └── {itemId}
        └── ingresos/      ← Ingresos registrados
            └── {ingresoId}
```

### Interfaz `Item` (Pagos y Tareas)

Ubicación: `src/types.ts:11`

```typescript
interface Item {
  id: string;              // ID único de Firestore
  tipo: 'pago' | 'tarea'; // Tipo de item
  titulo: string;          // Nombre del pago/tarea
  monto?: number;          // Monto en COP (opcional para tareas)
  fecha: string;           // Fecha límite (YYYY-MM-DD)
  horaRecordatorio: string;// Hora del recordatorio (HH:MM)
  completado: boolean;     // ¿Está pagado/completado?
  completadoEn?: number;   // Timestamp de completado (Date.now())
  recurrente: boolean;     // ¿Se repite mensualmente?
  notas?: string;          // Notas adicionales
  creadoEn: number;        // Timestamp de creación
}
```

### Interfaz `Ingreso`

Ubicación: `src/types.ts:29`

```typescript
interface Ingreso {
  id: string;                // ID único de Firestore
  titulo: string;            // Nombre del ingreso
  monto: number;             // Monto en COP
  fecha: string;             // Fecha del ingreso (YYYY-MM-DD)
  categoria: TipoIngreso;    // 'salario' | 'freelance' | 'otro'
  recurrente: boolean;       // ¿Se repite mensualmente?
  notas?: string;            // Notas adicionales
  creadoEn: number;          // Timestamp de creación
}
```

### Interfaz `BalanceMes`

Ubicación: `src/types.ts:42`

```typescript
interface BalanceMes {
  totalIngresos: number;    // Suma de ingresos del mes
  totalGastos: number;      // Suma de pagos completados del mes
  balance: number;          // Ingresos - Gastos
  cantidadPagos: number;    // Cantidad de pagos del mes
  cantidadTareas: number;   // Cantidad de tareas del mes
  cantidadMora: number;     // Items en mora
}
```

### Operaciones CRUD (`src/services/db.ts`)

| Función | Descripción |
|---------|-------------|
| `escucharItems(uid, callback, onError)` | Listener en tiempo real de items |
| `escucharIngresos(uid, callback, onError)` | Listener en tiempo real de ingresos |
| `crearItem(uid, item)` | Crear nuevo item |
| `actualizarItem(uid, id, cambios)` | Actualizar item existente |
| `eliminarItem(uid, id)` | Eliminar un item |
| `eliminarItems(uid, ids)` | Eliminación múltiple (batch) |
| `completarYRecurrente(uid, item)` | Marcar completo + crear siguiente si es recurrente |
| `crearIngreso(uid, ingreso)` | Crear nuevo ingreso |
| `actualizarIngreso(uid, id, cambios)` | Actualizar ingreso |
| `eliminarIngreso(uid, id)` | Eliminar ingreso |

> **Nota:** Los items se ordenan por `fecha` ascendente. Los ingresos se ordenan por `fecha` descendente (más recientes primero).

---

## 5. 🔄 Modelo de Estados

Ubicación: `src/domain/estados.ts`

YeferTasks calcula el estado visual de cada item automáticamente usando la función `calcularEstadoItem()`:

### Máquina de estados

```
                    ┌─────────────┐
                    │  completado │ ← completado = true
                    └─────────────┘
                           ↑
                    ┌──────┴──────┐
                    │             │
             ┌──────┴──────┐  ┌──┴───────────┐
             │    mora     │  │  venceHoy    │
             │ fecha < hoy │  │ fecha = hoy  │
             └─────────────┘  └──────────────┘
                    ↑                  ↑
                    │    ┌─────────────┘
                    │    │
             ┌──────┴────┴──┐
             │    proximo    │
             │ fecha > hoy   │
             └───────────────┘
```

### Reglas de transición

| Estado | Condición | Color chip | Icono |
|--------|-----------|------------|-------|
| `mora` | `fecha < hoy` AND `completado = false` | 🔴 Rojo (`#DC2626`) | ⚠️ EN MORA |
| `venceHoy` | `fecha = hoy` AND `completado = false` | 🟡 Amarillo (`#D97706`) | 🔔 VENCE HOY |
| `proximo` | `fecha > hoy` AND `completado = false` | 🔵 Azul (`#4E7CFF`) | 📅 POR PAGAR |
| `completado` | `completado = true` | 🟢 Verde (`#16A34A`) | ✅ PAGADO |

### Cálculo de días de mora

```typescript
// src/domain/estados.ts:8-14
diasMora = Math.floor(
  (fechaHoy - fechaItem) / 86400000  // 86400000 ms = 1 día
)
```

### Balance mensual

La función `calcularBalance()` filtra items por mes actual (`YYYY-MM`) y calcula:
- **totalGastos**: Solo pagos completados del mes
- **totalIngresos**: Todos los ingresos del mes
- **balance**: Ingresos - Gastos

---

## 6. 🔔 Sistema de Notificaciones

YeferTasks implementa un **sistema dual de notificaciones**:

### 6.1 Notificaciones estilo Duolingo (Principal)

Ubicación: `src/services/recordatorios.ts`

#### Canales de notificación

| Canal | ID | Uso |
|-------|----|-----|
| Recordatorios personalizados | `recordatorios-yefertasks` | Notificaciones de items individuales |
| Resumen del día | `resumen-diario-yefertasks` | Resumen matutino de pendientes |

#### Mensajes personalizados

El sistema genera mensajes dinámicos según:

1. **Hora del día**: Mañana (antes de 12), tarde (12-19), noche (después de 19)
2. **Días restantes**: Hoy, mañana, 3 días, más de 3 días
3. **Tipo de item**: Pago (💳) o tarea (📝)
4. **Estado**: Vencido, vence hoy, vence mañana, próximo

**Ejemplos de mensajes:**

```
⚠️ Yefer, esto venció
💳 "Servicio de internet — $85.000" ya pasó su fecha. ¡Revisa esto!

🔔 Yefer, ¡vence HOY!
📝 "Entregar informe mensual" vence hoy. ¡No lo olvides!

📅 Yefer, vence mañana
💳 "Arriendo apartamento — $1.200.000" vence mañana. ¿Ya lo tienes listo?

⏰ Buenos días, Yefer
Te recuerdo que "Pago de salud — $180.000" vence en 3 días.
```

#### Programación de recordatorios

Para cada item se programan **2 notificaciones**:

| Recordatorio | Cuándo se programa |
|-------------|---------------------|
| 1 día antes | `fecha - 1 día` a la `horaRecordatorio` |
| Mismo día | `fecha` a la `horaRecordatorio` |

> Las notificaciones cuyo tiempo ya pasó se omiten automáticamente.

#### Resumen diario

Se programa automáticamente a las **8:00 AM** diariamente:

| Escenario | Mensaje |
|-----------|---------|
| Items en mora | `⚠️ Yefer, tienes X en mora` |
| Pendientes sin mora | `¡Buenos días Yefer! 💰 Tienes X pago(s) pendiente(s)` |
| Sin pendientes | `¡Todo al día, Yefer! 🎉 No tienes pendientes` |

### 6.2 Notificaciones legacy (Backup)

Ubicación: `src/services/notificaciones.ts`

Sistema anterior con canal `recordatorios-yefertask`. Funcional pero reemplazado por el sistema Duolingo.

---

## 7. ⚡ Comandos Esenciales

### Desarrollo

```bash
# Instalar dependencias
npm install

# Iniciar Metro Bundler
npx react-native start

# Ejecutar en dispositivo/emulador Android
npx react-native run-android

# Ejecutar en iOS (requiere macOS + Xcode)
npx react-native run-ios
```

### Verificación de código

```bash
# Verificar tipos TypeScript
npx tsc --noEmit

# Lint con ESLint
npm run lint

# Ejecutar tests
npx jest
```

### Compilación

```bash
# Compilar APK debug
cd android && .\gradlew.bat assembleDebug

# Compilar APK release
cd android && .\gradlew.bat assembleRelease

# Compilar AAB (para Play Store)
cd android && .\gradlew.bat bundleRelease
```

### Control de versiones

```bash
# Agregar todos los cambios
git add .

# Crear commit
git commit -m "feat: descripción del cambio"

# Subir a GitHub
git push origin main
```

---

## 8. 📦 Dependencias Principales

### Dependencias de producción

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `react` | 19.2.3 | Librería core de React |
| `react-native` | 0.87 | Framework multiplataforma |
| `@react-native-firebase/app` | 26.3.2 | Core de Firebase |
| `@react-native-firebase/auth` | 26.3.2 | Autenticación Firebase |
| `@react-native-firebase/firestore` | 26.3.2 | Base de datos Firestore |
| `@notifee/react-native` | 9.1.8 | Notificaciones locales |
| `@react-navigation/native` | 7.3.17 | Core de navegación |
| `@react-navigation/native-stack` | 7.18.9 | Navegación tipo Stack |
| `@react-navigation/bottom-tabs` | 7.18.17 | Navegación inferior (tabs) |
| `react-native-calendars` | 1.1314.0 | Componente de calendario |
| `react-native-safe-area-context` | 5.9.1 | Manejo de áreas seguras |
| `react-native-screens` | 4.27.0 | Optimización de pantallas nativas |

### Dependencias de desarrollo

| Paquete | Versión | Descripción |
|---------|---------|-------------|
| `typescript` | 6.0.3 | Compilador TypeScript |
| `@babel/core` | 7.25.2 | Compilador Babel |
| `@react-native/babel-preset` | 0.87.0 | Preset Babel para RN |
| `@react-native/metro-config` | 0.87.0 | Configuración de Metro Bundler |
| `@react-native/typescript-config` | 0.87.0 | Configuración TS para RN |
| `eslint` | 8.19.0 | Linter de código |
| `prettier` | 2.8.8 | Formateador de código |
| `jest` | 29.6.3 | Framework de testing |
| `react-test-renderer` | 19.2.3 | Renderer de tests |
| `@types/react` | 19.2.0 | Tipos TypeScript para React |
| `@types/jest` | 29.5.13 | Tipos TypeScript para Jest |

---

## 9. 🔥 Configuración de Firebase

### 9.1 Requisitos previos

1. Crear cuenta en [Firebase Console](https://console.firebase.google.com/)
2. Crear un proyecto nuevo (ej: `yefer-tasks`)
3. Registrar la app Android con package name: `com.yefertask`

### 9.2 Archivo `google-services.json`

1. En Firebase Console → Project Settings → Tu app Android
2. Descargar `google-services.json`
3. Colocar en: `android/app/google-services.json`

> ⚠️ **NUNCA** subir este archivo a repositorios públicos. Agregarlo a `.gitignore`.

### 9.3 Habilitar servicios

En Firebase Console, habilitar:

| Servicio | Configuración |
|----------|---------------|
| **Authentication** | Habilitar proveedor "Email/Password" |
| **Cloud Firestore** | Crear base de datos (elegir región: `southamerica-east1` recomendado) |
| **Analytics** | Opcional, para métricas de uso |

### 9.4 Reglas de Firestore (desarrollo)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cada usuario solo ve y edita sus propios datos
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 9.5 Estructura de reglas (producción)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      // Items del usuario
      match /items/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
      // Ingresos del usuario
      match /ingresos/{ingresoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }
  }
}
```

---

## 10. 🤖 Configuración Android

### 10.1 SDK Versions

Ubicación: `android/app/build.gradle`

| Parámetro | Valor |
|-----------|-------|
| `compileSdk` | Versión del proyecto (via rootProject) |
| `minSdkVersion` | Versión mínima soportada |
| `targetSdkVersion` | Versión objetivo |
| `namespace` | `com.yefertask` |
| `applicationId` | `com.yefertask` |
| `versionCode` | `1` |
| `versionName` | `"1.0"` |

### 10.2 Permisos Android

Ubicación: `android/app/src/main/AndroidManifest.xml`

| Permiso | Uso |
|---------|-----|
| `INTERNET` | Conexión a Firebase y servicios web |
| `SYSTEM_ALERT_WINDOW` | Dibujar burbuja flotante sobre otras apps |
| `POST_NOTIFICATIONS` | Mostrar notificaciones (Android 13+) |
| `FOREGROUND_SERVICE` | Mantener servicio de burbuja activo |
| `FOREGROUND_SERVICE_SPECIAL_USE` | Tipo de servicio especial para burbuja |

### 10.3 Componentes nativos

```xml
<!-- MainActivity: Actividad principal -->
<activity
  android:name=".MainActivity"
  android:launchMode="singleTask"
  android:windowSoftInputMode="adjustResize" />

<!-- FloatingBubbleService: Servicio de burbuja flotante -->
<service
  android:name=".FloatingBubbleService"
  android:foregroundServiceType="specialUse" />
```

### 10.4 Signing Config

**Debug** (para desarrollo):

```groovy
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
}
```

> ⚠️ En producción, generar un keystore propio (ver sección 11).

### 10.5 Motor JavaScript

La app usa **Hermes** por defecto (motor JavaScript optimizado para React Native). Para usar JavaScriptCore en su lugar, modificar `gradle.properties`:

```properties
hermesEnabled=false
```

---

## 11. 🚀 Configuración para Producción (Play Store)

### 11.1 Generar Keystore de Release

```bash
keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore yeferTasks-release.keystore \
  -alias yeferTasks \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass TU_CONTRASEÑA_SEGURA \
  -keypass TU_CONTRASEÑA_SEGURA \
  -dname "CN=Yefererson Herrera, OU=Development, O=YeferTasks, L=Ciudad, ST=Estado, C=CO"
```

### 11.2 Configurar signing en build.gradle

```groovy
android {
    signingConfigs {
        release {
            storeFile file('yeferTasks-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: 'TU_CONTRASEÑA'
            keyAlias 'yeferTasks'
            keyPassword System.getenv("KEY_PASSWORD") ?: 'TU_CONTRASEÑA'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }
}
```

### 11.3 Habilitar ProGuard

En `android/app/build.gradle`, cambiar:

```groovy
def enableProguardInReleaseBuilds = true
```

### 11.4 Compilar AAB (Android App Bundle)

```bash
cd android
.\gradlew.bat bundleRelease
```

El archivo AAB se genera en:
```
android/app/build/outputs/bundle/release/app-release.aab
```

### 11.5 Pasos para Play Console

1. Crear cuenta de desarrollador en [Google Play Console](https://play.google.com/console)
2. Crear nueva app → Usar app existente → Subir `app-release.aab`
3. Completar:
   - Descripción corta y larga
   - Capturas de pantalla (phone, tablet)
   - Icono de launcher (512x512 PNG)
   - Política de privacidad (URL)
4. Configurar：
   - Clasificación de contenido
   - Restricciones geográficas
   - Precio (gratis)
5. Revisión y publicación

---

## 12. 🔐 Variables de Entorno y Seguridad

### 12.1 Archivos sensibles

| Archivo | Ubicación | Acción |
|---------|-----------|--------|
| `google-services.json` | `android/app/` | ❌ NO subir a git público |
| `debug.keystore` | `android/app/` | ⚠️ Solo para desarrollo |
| Release keystore | `android/app/` | ❌ NUNCA subir a git |

### 12.2 `.gitignore` recomendado

```gitignore
# Firebase
android/app/google-services.json

# Keystores
android/app/*.keystore
android/app/*.jks

# Build outputs
android/app/build/
android/.gradle/

# Node
node_modules/

# IDE
.idea/
.vscode/
*.iml

# OS
.DS_Store
Thumbs.db
```

### 12.3 Firebase Security Rules

Reglas mínimas de seguridad:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    // Denegar acceso a todo lo demás
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 12.4 Buenas prácticas

- ✅ Usar variables de entorno para contraseñas de keystore
- ✅ Habilitar App Check en Firebase para prevenir abuso
- ✅ Revisar reglas de Firestore periódicamente
- ✅ Usar HTTPS (ya viene por defecto con Firebase)
- ✅ No hardcodear API keys en el código fuente

---

## 13. 🔧 Troubleshooting

### Errores comunes y soluciones

#### 1. `Execution failed for task ':app:checkDebugAarMetadata'`

**Causa:** Versión de SDK incompatible.

**Solución:**
```bash
cd android
.\gradlew.bat clean
cd ..
npm install
npx react-native start --reset-cache
```

#### 2. `Unable to load script from assets 'index.android.bundle'`

**Causa:** Metro Bundler no está corriendo o el bundle no se generó.

**Solución:**
```bash
# Iniciar Metro en otra terminal
npx react-native start

# En otra terminal, compilar
npx react-native run-android
```

#### 3. `Permission denied: SYSTEM_ALERT_WINDOW`

**Causa:** El usuario no concedió permiso de overlay.

**Solución:** La app redirige automáticamente a Ajustes > Aplicaciones > YeferTask > Dibujar sobre otras apps.

#### 4. `Notificaciones no aparecen en Android 13+`

**Causa:** Falta permiso `POST_NOTIFICATIONS`.

**Solución:** La app solicita el permiso automáticamente al iniciar. Verificar en Ajustes > Aplicaciones > YeferTask > Notificaciones.

#### 5. `ERR_PACKAGE_NOT_FOUND` o `Module not found`

**Causa:** `node_modules` incompleto.

**Solución:**
```bash
rm -rf node_modules
npm install
cd android && .\gradlew.bat clean && cd ..
```

#### 6. `Firestores escribe pero no lee`

**Causa:** Reglas de Firestore bloqueando lectura.

**Solución:** Verificar reglas en Firebase Console → Firestore → Reglas. Temporalmente usar reglas de desarrollo (ver sección 9.4).

#### 7. `Build de release falla con ProGuard`

**Causa:** ProGuard elimina clases necesarias de Firebase.

**Solución:** Crear `android/app/proguard-rules.pro`:
```proguard
-keep class com.facebook.react.** { *; }
-keep class io.invertcase.notifee.** { *; }
-keep class com.google.firebase.** { *; }
```

#### 8. `Burbuja flotante no aparece`

**Causa:** Permiso `SYSTEM_ALERT_WINDOW` no concedido o servicio no iniciado.

**Solución:**
1. Verificar permiso en Ajustes
2. Reiniciar la app
3. Verificar logs: `adb logcat | grep FloatingBubble`

#### 9. `TypeScript errors`

**Solución:**
```bash
npx tsc --noEmit
```
Revisar errores reportados y corregir tipos en `src/types.ts`.

#### 10. `Metro Bundler port already in use`

**Solución:**
```bash
# Matar proceso en puerto 8081
npx react-native start --port 8082
```

---

## 📝 Notas Finales

### Arquitectura de decisión

YeferTasks sigue un enfoque **pragmático**:
- **Firebase** para backend sin servidor (BaaS)
- **Kotlin nativo** para features que React Native no soporta directamente (burbuja flotante)
- **Notifee** para notificaciones locales programadas
- **React Navigation** para navegación tipo móvil nativa

### Próximas mejoras sugeridas

- [ ] Soporte iOS (requiere módulo nativo para burbuja)
- [ ] Widgets de Android (app widgets)
- [ ] Exportar datos a CSV/PDF
- [ ] Modo oscuro
- [ ] Autenticación con Google Sign-In
- [ ] Sync offline-first con Firestore persistence

---

> **YeferTasks v1.1** — Desarrollado con ❤️ por Yefererson Herrera
