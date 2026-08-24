package com.yefertask

import android.annotation.SuppressLint
import android.app.Service
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.IBinder
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import org.json.JSONArray

/**
 * SERVICIO DE VENTANA FLOTANTE
 *
 * Un "Service" es código que Android ejecuta en segundo plano, sin interfaz
 * propia. Este servicio dibuja dos vistas sobre TODAS las apps usando el
 * permiso SYSTEM_ALERT_WINDOW:
 *
 *   1. Una burbuja pequeña (chat-head estilo Messenger) que se puede arrastrar.
 *   2. Un panel expandido con la lista de tareas pendientes.
 *
 * Las tareas llegan como JSON guardado en SharedPreferences (clave
 * "yefertask_pendientes") desde JavaScript cada vez que cambian.
 */
class FloatingBubbleService : Service() {

    companion object {
        const val PREFS = "yefertask_prefs"
        const val KEY_TAREAS = "yefertask_pendientes"
        var instanciaActiva: FloatingBubbleService? = null
    }

    private lateinit var windowManager: WindowManager
    private var burbuja: View? = null
    private var panel: View? = null
    private var expandido = false

    private val paramsBurbuja: WindowManager.LayoutParams
        get() {
            val tipo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
            else
                @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
            return WindowManager.LayoutParams(
                (56 * resources.displayMetrics.density).toInt(),
                (56 * resources.displayMetrics.density).toInt(),
                tipo,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,
                PixelFormat.TRANSLUCENT,
            ).apply {
                gravity = Gravity.TOP or Gravity.START
                x = 24
                y = 200
            }
        }

    override fun onCreate() {
        super.onCreate()
        instanciaActiva = this
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        crearNotificacionForeground()
        mostrarBurbuja()
    }

    /**
     * Android exige que todo servicio en primer plano muestre una
     * notificación discreta indicando que está activo.
     */
    private fun crearNotificacionForeground() {
        val manager = getSystemService(NOTIFICATION_SERVICE) as android.app.NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            manager.createNotificationChannel(
                android.app.NotificationChannel(
                    "burbuja_fg",
                    "Burbuja flotante",
                    android.app.NotificationManager.IMPORTANCE_MIN,
                )
            )
        }
        val notif = android.app.Notification.Builder(this, "burbuja_fg")
            .setContentTitle("Yefer Task")
            .setContentText("Mostrando tus pendientes")
            .setSmallIcon(android.R.drawable.ic_menu_myplaces)
            .build()
        startForeground(1001, notif)
    }

    /** Servicio sin conexión de entrada: devolvemos null */
    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        instanciaActiva = null
        quitarVistas()
        super.onDestroy()
    }

    /** Lee la lista de pendientes que JS dejó en SharedPreferences */
    private fun leerPendientes(): List<Pair<String, String>> {
        val json = getSharedPreferences(PREFS, MODE_PRIVATE)
            .getString(KEY_TAREAS, "[]") ?: "[]"
        val lista = mutableListOf<Pair<String, String>>()
        try {
            val arr = JSONArray(json)
            for (i in 0 until arr.length()) {
                val obj = arr.getJSONObject(i)
                lista.add(Pair(obj.optString("titulo"), obj.optString("fecha")))
            }
        } catch (_: Exception) {}
        return lista
    }

    @SuppressLint("InflateParams", "ClickableViewAccessibility")
    private fun mostrarBurbuja() {
        // Círculo simple dibujado por código (sin imagen extra)
        val densidad = resources.displayMetrics.density
        val size = (56 * densidad).toInt()

        val vista = View(this).apply {
            background = crearCirculo(0xFF5B6BF9.toInt(), size / 2)
            elevation = 8 * densidad
        }
        // El símbolo "$" no es fácil sin TextView; usamos un FrameLayout con texto:
        burbuja = vista

        var inicialX = 0
        var inicialY = 0
        var toqueInicialX = 0f
        var toqueInicialY = 0f
        var movido = false

        vista.setOnTouchListener { _, evento ->
            val params = paramsBurbuja
            when (evento.action) {
                MotionEvent.ACTION_DOWN -> {
                    inicialX = params.x
                    inicialY = params.y
                    toqueInicialX = evento.rawX
                    toqueInicialY = evento.rawY
                    movido = false
                    false
                }
                MotionEvent.ACTION_MOVE -> {
                    val dx = (evento.rawX - toqueInicialX).toInt()
                    val dy = (evento.rawY - toqueInicialY).toInt()
                    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) movido = true
                    params.x = inicialX + dx
                    params.y = inicialY + dy
                    try {
                        windowManager.updateViewLayout(vista, params)
                    } catch (_: Exception) {}
                    true
                }
                MotionEvent.ACTION_UP -> {
                    if (!movido) alternarPanel()
                    true
                }
                else -> false
            }
        }

        try {
            windowManager.addView(vista, paramsBurbuja)
        } catch (_: Exception) {}
    }

    /** Muestra u oculta el panel con la lista de pendientes */
    @SuppressLint("InflateParams")
    private fun alternarPanel() {
        if (expandido) {
            panel?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
            panel = null
            expandido = false
            actualizarBurbuja(false)
        } else {
            panel = construirPanel()
            panel?.let {
                val tipo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O)
                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                else
                    @Suppress("DEPRECATION") WindowManager.LayoutParams.TYPE_PHONE
                val p = WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    (resources.displayMetrics.heightPixels * 0.45).toInt(),
                    tipo,
                    WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL,
                    PixelFormat.TRANSLUCENT,
                ).apply {
                    gravity = Gravity.CENTER
                }
                try {
                    windowManager.addView(it, p)
                    expandido = true
                    actualizarBurbuja(true)
                } catch (_: Exception) {}
            }
        }
    }

    private fun construirPanel(): View {
        val densidad = resources.displayMetrics.density
        val contenedor = android.widget.LinearLayout(this).apply {
            orientation = android.widget.LinearLayout.VERTICAL
            setPadding((16 * densidad).toInt(), (12 * densidad).toInt(), (16 * densidad).toInt(), (12 * densidad).toInt())
            background = android.graphics.drawable.GradientDrawable().apply {
                setColor(0xFFFFFFFF.toInt())
                cornerRadius = 20 * densidad
            }
            elevation = 10 * densidad
        }

        val titulo = android.widget.TextView(this).apply {
            text = "📝 Tareas y pagos pendientes"
            setTextColor(0xFF23272F.toInt())
            textSize = 17f
            setTypeface(typeface, android.graphics.Typeface.BOLD)
        }
        contenedor.addView(titulo)

        val pendientes = leerPendientes()
        if (pendientes.isEmpty()) {
            contenedor.addView(android.widget.TextView(this).apply {
                text = "¡Todo al día! 🎉"
                setTextColor(0xFF5F6673.toInt())
                textSize = 15f
                setPadding(0, (8 * densidad).toInt(), 0, 0)
            })
        } else {
            for ((nombre, fecha) in pendientes.take(8)) {
                val fila = android.widget.TextView(this).apply {
                    text = "• $nombre  ($fecha)"
                    setTextColor(0xFF23272F.toInt())
                    textSize = 14f
                    setPadding(0, (8 * densidad).toInt(), 0, 0)
                }
                contenedor.addView(fila)
            }
        }

        // Cerrar al tocar fuera no es trivial con FLAG_NOT_FOCUSABLE;
        // tocar la burbuja de nuevo colapsa el panel.
        return contenedor
    }

    private fun actualizarBurbuja(expandidoAhora: Boolean) {
        burbuja?.background =
            if (expandidoAhora) crearCirculo(0xFF3E4EC4.toInt(), (28 * resources.displayMetrics.density).toInt())
            else crearCirculo(0xFF5B6BF9.toInt(), (28 * resources.displayMetrics.density).toInt())
    }

    private fun crearCirculo(color: Int, radioPx: Int): android.graphics.drawable.Drawable {
        return android.graphics.drawable.GradientDrawable().apply {
            shape = android.graphics.drawable.GradientDrawable.OVAL
            setColor(color)
        }.also { it.setBounds(0, 0, radioPx * 2, radioPx * 2) }
    }

    private fun quitarVistas() {
        burbuja?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        panel?.let { try { windowManager.removeView(it) } catch (_: Exception) {} }
        burbuja = null
        panel = null
    }
}
