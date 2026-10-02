package com.widgebuddy.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.widget.RemoteViews
import org.json.JSONObject
import com.widgebuddy.app.R

/**
 * targets/android/WidgeBuddyWidgetProvider.kt
 *
 * Android native AppWidgetProvider that updates Home Screen Widgets
 * from WidgeBuddy's synchronized JSON definition in SharedPreferences.
 */
class WidgeBuddyWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        val prefs = context.getSharedPreferences("WidgeBuddyWidgetPrefs", Context.MODE_PRIVATE)
        val rawJson = prefs.getString("active_widget_payload", null)

        for (appWidgetId in appWidgetIds) {
            updateAppWidget(context, appWidgetManager, appWidgetId, rawJson)
        }
    }

    companion object {
        fun updateAppWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int,
            rawJson: String?
        ) {
            val views = RemoteViews(context.packageName, R.layout.widgebuddy_widget_layout)

            // Setup click to open main app
            val launchIntent = context.packageManager.getLaunchIntentForPackage(context.packageName)
            if (launchIntent != null) {
                launchIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
                val pendingIntent = PendingIntent.getActivity(
                    context,
                    0,
                    launchIntent,
                    PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
                )
                views.setOnClickPendingIntent(R.id.widget_root, pendingIntent)
            }

            if (rawJson != null) {
                try {
                    val root = JSONObject(rawJson)
                    val glance = root.optJSONObject("glanceSummary")

                    val title = glance?.optString("title") ?: "WidgeBuddy"
                    val temp = glance?.optInt("temperature", 21) ?: 21
                    val condition = glance?.optString("condition") ?: "Mostly Sunny"
                    val location = glance?.optString("location") ?: "Local Weather"

                    views.setTextViewText(R.id.widget_title, title)
                    views.setTextViewText(R.id.widget_temperature, "${temp}°")
                    views.setTextViewText(R.id.widget_condition, condition)
                    views.setTextViewText(R.id.widget_location, location)

                    val forecastArray = glance?.optJSONArray("forecastDays")
                    if (forecastArray != null && forecastArray.length() >= 3) {
                        val f1 = forecastArray.getJSONObject(0)
                        val f2 = forecastArray.getJSONObject(1)
                        val f3 = forecastArray.getJSONObject(2)

                        views.setTextViewText(R.id.forecast_day_1, f1.optString("day", "Today"))
                        views.setTextViewText(R.id.forecast_temp_1, "${f1.optInt("temp", 21)}°")

                        views.setTextViewText(R.id.forecast_day_2, f2.optString("day", "Tomorrow"))
                        views.setTextViewText(R.id.forecast_temp_2, "${f2.optInt("temp", 22)}°")

                        views.setTextViewText(R.id.forecast_day_3, f3.optString("day", "Day 3"))
                        views.setTextViewText(R.id.forecast_temp_3, "${f3.optInt("temp", 19)}°")
                    }
                } catch (e: Exception) {
                    views.setTextViewText(R.id.widget_title, "WidgeBuddy")
                    views.setTextViewText(R.id.widget_condition, "Tap to open app")
                }
            }

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
