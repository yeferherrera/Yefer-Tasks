package com.yefertask

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import org.json.JSONArray

/**
 * MÓDULO NATIVO — puente entre JavaScript y Android.
 *
 * JS no puede tocar el sistema directamente; este módulo le presta las manos:
 *   - tienePermisoOverlay(): ¿el usuario ya dio "Mostrar sobre otras apps"?
 *   - pedirPermisoOverlay(): abre la pantalla de ajustes para concederlo.
 *   - mostrarBurbuja() / ocultarBurbuja(): arranca y detiene el servicio.
 *   - sincronizarPendientes(json): guarda la lista que mostrará la burbuja.
 */
class VentanaFlotanteModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "VentanaFlotante"

    @ReactMethod
    fun tienePermisoOverlay(promise: Promise) {
        val puede = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M)
            Settings.canDrawOverlays(reactContext)
        else true
        promise.resolve(puede)
    }

    @ReactMethod
    fun pedirPermisoOverlay(promise: Promise) {
        if (Settings.canDrawOverlays(reactContext)) {
            promise.resolve(true)
            return
        }
        // Abre la pantalla del sistema con el interruptor para nuestra app
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactContext.packageName}"),
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        try {
            reactContext.startActivity(intent)
            promise.resolve(false) // aún no concedido; JS debe volver a preguntar
        } catch (e: Exception) {
            promise.reject("ERROR_PERMISO", e)
        }
    }

    @ReactMethod
    fun mostrarBurbuja(promise: Promise) {
        try {
            val intent = Intent(reactContext, FloatingBubbleService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                reactContext.startForegroundService(intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_SERVICIO", e)
        }
    }

    @ReactMethod
    fun ocultarBurbuja(promise: Promise) {
        try {
            reactContext.stopService(Intent(reactContext, FloatingBubbleService::class.java))
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_SERVICIO", e)
        }
    }

    /**
     * JS llama aquí cada vez que cambian los pendientes.
     * Guardamos JSON en SharedPreferences: el servicio lo lee al expandirse.
     */
    @ReactMethod
    fun sincronizarPendientes(json: String, promise: Promise) {
        try {
            JSONArray(json) // validar que sea JSON correcto
            reactContext.getSharedPreferences(FloatingBubbleService.PREFS, 0)
                .edit()
                .putString(FloatingBubbleService.KEY_TAREAS, json)
                .apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR_JSON", e)
        }
    }
}
