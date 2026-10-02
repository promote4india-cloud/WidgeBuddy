package com.widgebuddy.app.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class WidgetBridgeModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WidgetBridge"

    @ReactMethod
    fun setWidgetData(payloadString: String, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences("WidgeBuddyWidgetPrefs", Context.MODE_PRIVATE)
            prefs.edit().putString("active_widget_payload", payloadString).apply()

            val intent = Intent(reactContext, WidgeBuddyWidgetProvider::class.java).apply {
                action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
                val widgetManager = AppWidgetManager.getInstance(reactContext)
                val ids = widgetManager.getAppWidgetIds(ComponentName(reactContext, WidgeBuddyWidgetProvider::class.java))
                putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
            }
            reactContext.sendBroadcast(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("WIDGET_DATA_ERROR", e.message, e)
        }
    }

    @ReactMethod
    fun requestPin(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val appWidgetManager = reactContext.getSystemService(AppWidgetManager::class.java)
                val provider = ComponentName(reactContext, WidgeBuddyWidgetProvider::class.java)
                if (appWidgetManager != null && appWidgetManager.isRequestPinAppWidgetSupported) {
                    val success = appWidgetManager.requestPinAppWidget(provider, null, null)
                    promise.resolve(success)
                    return
                }
            }
            promise.resolve(false)
        } catch (e: Exception) {
            promise.reject("PIN_ERROR", e.message, e)
        }
    }
}
