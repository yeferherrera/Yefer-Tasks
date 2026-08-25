# Guia de Instalacion - YeferTasks

## Requisitos previos

| Programa | Version | Donde bajarlo |
|---|---|---|
| Node.js | v22+ | https://nodejs.org |
| JDK | 17 | https://adoptium.net |
| Android Studio | Ultima version | https://developer.android.com/studio |
| Git | Ultima version | https://git-scm.com |

### Configurar Android Studio
1. Abrir Android Studio → More Actions → SDK Manager
2. Instalar Android 14 (API 34) o superior
3. En SDK Tools, instalar: Android SDK Build-Tools, Android SDK Command-line Tools
4. Configurar variable de entorno ANDROID_HOME:
   - Windows: `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`

---

## Instalacion

### 1. Clonar el proyecto
```bash
git clone https://github.com/yeferherrera/Yefer-Tasks.git
cd Yefer-Tasks
```

### 2. Copiar archivos de Firebase y firma
Estos archivos NO estan en Git por seguridad. Copiarlos de la PC original:

```
Copiar a: android\app\
  - google-services.json     (de Firebase Console)
  - yefer-release.keystore   (contrasena: yefer123456)
```

### 3. Instalar dependencias
```bash
npm install
```

### 4. Compilar APK
```bash
cd android
.\gradlew.bat assembleRelease
```

El APK queda en:
```
android\app\build\outputs\apk\release\app-release.apk
```

### 5. Instalar en el celular
```bash
adb install android\app\build\outputs\apk\release\app-release.apk
```
O copiar el APK al celular e instalarlo manualmente.

---

## Obtener google-services.json

1. Ir a https://console.firebase.google.com
2. Seleccionar el proyecto YeferTasks
3. Configuracion del proyecto (icono engranaje)
4. Pestaña "General"
5. Descargar "google-services.json"
6. Copiarlo en `android\app\`

---

## Dependencias del proyecto

### Dependencias principales (package.json)

| Paquete | Version | Para que sirve |
|---|---|---|
| react | 19.1.0 | Framework UI |
| react-native | 0.87.1 | Framework movil |
| @react-native-firebase/app | 26.3.2 | Firebase core |
| @react-native-firebase/auth | 26.3.2 | Autenticacion |
| @react-native-firebase/firestore | 26.3.2 | Base de datos |
| @notifee/react-native | 9.1.8 | Notificaciones locales |
| react-native-calendars | 1.1306.0 | Calendario |
| @react-native-async-storage/async-storage | 2.1.2 | Almacenamiento local |
| react-native-safe-area-context | 5.4.0 | Safe areas |
| react-native-screens | 4.11.0 | Navegacion |

### Dependencias de desarrollo

| Paquete | Para que sirve |
|---|---|
| typescript | Lenguaje de tipos |
| @types/react | Tipos de React |
| eslint | Linting de codigo |
| prettier | Formateo de codigo |
| jest | Testing |

---

## Estructura de Firebase (Firestore Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Importante: Publicar las reglas manualmente en Firebase Console → Firestore → Reglas.

---

## Comandos utiles

```bash
# Compilar APK release
cd android && .\gradlew.bat assembleRelease

# Verificar errores TypeScript
npx tsc --noEmit

# Limpiar build
cd android && .\gradlew.bat clean

# Ejecutar en emulador
npx react-native run-android

# Ver logs del celular
adb logcat *:S ReactNativeJS:V
```

---

## Solucion de problemas

### Error "SDK not found"
Verificar que ANDROID_HOME esta configurado:
```bash
echo %ANDROID_HOME%
```
Debe mostrar: `C:\Users\TU_USUARIO\AppData\Local\Android\Sdk`

### Error "Could not find google-services.json"
Copiar el archivo a `android\app\` desde Firebase Console.

### Error "Keystore not found"
Copiar `yefer-release.keystore` a `android\app\`

### Build lento
```bash
cd android
.\gradlew.bat clean
.\gradlew.bat assembleRelease --parallel
```

### Notificaciones no llegan
1. Verificar permisos en Ajustes del celular → Apps → YeferTasks → Notificaciones
2. Desactivar bateria optimizada para YeferTasks
3. En Android 13+, aceptar el permiso POST_NOTIFICATIONS
