package com.widgebuddy.app.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.view.View
import android.widget.RemoteViews
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import com.widgebuddy.app.R

/**
 * Android native AppWidgetProvider that updates Home Screen Widgets
 * from WidgeBuddy's synchronized JSON definition in SharedPreferences.
 * Supports Polymorphic Widgets: Weather, Tasks, Calendar Events, Articles, Clock, Custom.
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
                    val widgetType = glance?.optString("widgetType", "weather") ?: "weather"
                    val title = glance?.optString("title") ?: "WidgeBuddy"
                    val metaText = glance?.optString("metaText", "") ?: ""

                    views.setTextViewText(R.id.widget_title, title)
                    if (metaText.isNotEmpty()) {
                        views.setTextViewText(R.id.widget_sync_time, metaText)
                    }

                    // Apply user-selected background color if present
                    val bgColorStr = glance?.optString("backgroundColor", "")
                    if (!bgColorStr.isNullOrEmpty()) {
                        try {
                            val bgColor = Color.parseColor(bgColorStr)
                            views.setInt(R.id.widget_root, "setBackgroundColor", bgColor)
                        } catch (e: IllegalArgumentException) {
                            // Keep default drawable background if color parsing fails
                        }
                    }

                    when (widgetType) {
                        "clock" -> {
                            views.setViewVisibility(R.id.widget_weather_container, View.GONE)
                            views.setViewVisibility(R.id.widget_list_container, View.GONE)
                            views.setViewVisibility(R.id.widget_clock_container, View.VISIBLE)

                            val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())
                            val dateFormat = SimpleDateFormat("EEEE, MMM d", Locale.getDefault())
                            val now = Date()

                            val timeText = glance.optString("timeText", timeFormat.format(now))
                            val dateText = glance.optString("dateText", dateFormat.format(now))

                            views.setTextViewText(R.id.widget_clock_time, timeText)
                            views.setTextViewText(R.id.widget_clock_date, dateText)
                        }

                        "task", "calendar", "article", "custom" -> {
                            views.setViewVisibility(R.id.widget_weather_container, View.GONE)
                            views.setViewVisibility(R.id.widget_clock_container, View.GONE)
                            views.setViewVisibility(R.id.widget_list_container, View.VISIBLE)

                            val listItems = glance.optJSONArray("listItems")
                            val itemCount = listItems?.length() ?: 0

                            if (itemCount == 0) {
                                val emptyMsg = glance.optString("primaryText", "No items to display")
                                views.setTextViewText(R.id.widget_list_empty, emptyMsg)
                                views.setViewVisibility(R.id.widget_list_empty, View.VISIBLE)
                                views.setViewVisibility(R.id.list_item_1, View.GONE)
                                views.setViewVisibility(R.id.list_item_2, View.GONE)
                                views.setViewVisibility(R.id.list_item_3, View.GONE)
                            } else {
                                views.setViewVisibility(R.id.widget_list_empty, View.GONE)

                                val itemRows = arrayOf(R.id.list_item_1, R.id.list_item_2, R.id.list_item_3)
                                val iconViews = arrayOf(R.id.item_icon_1, R.id.item_icon_2, R.id.item_icon_3)
                                val titleViews = arrayOf(R.id.item_title_1, R.id.item_title_2, R.id.item_title_3)
                                val subViews = arrayOf(R.id.item_sub_1, R.id.item_sub_2, R.id.item_sub_3)
                                val metaViews = arrayOf(R.id.item_meta_1, R.id.item_meta_2, R.id.item_meta_3)

                                for (i in 0 until 3) {
                                    if (i < itemCount) {
                                        val item = listItems!!.getJSONObject(i)
                                        val itemTitle = item.optString("title", "")
                                        val itemSubtitle = item.optString("subtitle", "")
                                        val itemMeta = item.optString("meta", "")
                                        val isDone = item.optBoolean("isDone", false)
                                        val iconType = item.optString("icon", "")

                                        val iconSymbol = when {
                                            widgetType == "task" -> if (isDone) "✓" else "○"
                                            widgetType == "calendar" -> "📅"
                                            widgetType == "article" -> "📰"
                                            iconType == "check" -> "✓"
                                            iconType == "square" -> "○"
                                            else -> "•"
                                        }

                                        views.setTextViewText(iconViews[i], iconSymbol)
                                        views.setTextViewText(titleViews[i], itemTitle)
                                        views.setTextViewText(subViews[i], itemSubtitle)
                                        views.setTextViewText(metaViews[i], itemMeta)

                                        views.setViewVisibility(subViews[i], if (itemSubtitle.isNotEmpty()) View.VISIBLE else View.GONE)
                                        views.setViewVisibility(metaViews[i], if (itemMeta.isNotEmpty()) View.VISIBLE else View.GONE)
                                        views.setViewVisibility(itemRows[i], View.VISIBLE)
                                    } else {
                                        views.setViewVisibility(itemRows[i], View.GONE)
                                    }
                                }
                            }
                        }

                        else -> { // Default: Weather
                            views.setViewVisibility(R.id.widget_clock_container, View.GONE)
                            views.setViewVisibility(R.id.widget_list_container, View.GONE)
                            views.setViewVisibility(R.id.widget_weather_container, View.VISIBLE)

                            val temp = glance.optInt("temperature", 21)
                            val condition = glance.optString("condition", "Mostly Sunny")
                            val location = glance.optString("location", "Local Weather")

                            views.setTextViewText(R.id.widget_temperature, "${temp}°")
                            views.setTextViewText(R.id.widget_condition, condition)
                            views.setTextViewText(R.id.widget_location, location)

                            // Dynamically populate forecast days
                            val forecastArray = glance.optJSONArray("forecastDays")
                            val forecastCount = forecastArray?.length() ?: 0

                            if (forecastCount >= 1) {
                                val f1 = forecastArray!!.getJSONObject(0)
                                views.setTextViewText(R.id.forecast_day_1, f1.optString("day", "Today"))
                                views.setTextViewText(R.id.forecast_temp_1, "${f1.optInt("temp", 21)}°")
                                views.setViewVisibility(R.id.forecast_col_1, View.VISIBLE)
                            } else {
                                views.setViewVisibility(R.id.forecast_col_1, View.GONE)
                            }

                            if (forecastCount >= 2) {
                                val f2 = forecastArray!!.getJSONObject(1)
                                views.setTextViewText(R.id.forecast_day_2, f2.optString("day", "Tomorrow"))
                                views.setTextViewText(R.id.forecast_temp_2, "${f2.optInt("temp", 22)}°")
                                views.setViewVisibility(R.id.forecast_col_2, View.VISIBLE)
                            } else {
                                views.setViewVisibility(R.id.forecast_col_2, View.GONE)
                            }

                            if (forecastCount >= 3) {
                                val f3 = forecastArray!!.getJSONObject(2)
                                views.setTextViewText(R.id.forecast_day_3, f3.optString("day", "Day 3"))
                                views.setTextViewText(R.id.forecast_temp_3, "${f3.optInt("temp", 19)}°")
                                views.setViewVisibility(R.id.forecast_col_3, View.VISIBLE)
                            } else {
                                views.setViewVisibility(R.id.forecast_col_3, View.GONE)
                            }

                            if (forecastCount == 0) {
                                views.setViewVisibility(R.id.widget_forecast_row, View.GONE)
                            } else {
                                views.setViewVisibility(R.id.widget_forecast_row, View.VISIBLE)
                            }
                        }
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
