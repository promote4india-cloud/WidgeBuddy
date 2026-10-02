const {
  withAndroidManifest,
  withStringsXml,
  withDangerousMod,
  withMainApplication,
  createRunOncePlugin,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

const WIDGET_CLASS_NAME = '.widget.WidgeBuddyWidgetProvider';
const WIDGET_PACKAGE_NAME = 'com.widgebuddy.app.widget.WidgetBridgePackage()';

/**
 * 1. Inject widget_description into strings.xml
 */
function withWidgetStrings(config) {
  return withStringsXml(config, (modConfig) => {
    const strings = modConfig.modResults.resources.string || [];
    if (!strings.some((s) => s.$.name === 'widget_description')) {
      strings.push({
        $: { name: 'widget_description' },
        _: 'Glanceable live weather and dashboard widget',
      });
    }
    modConfig.modResults.resources.string = strings;
    return modConfig;
  });
}

/**
 * 2. Inject AppWidget receiver into AndroidManifest.xml
 */
function withWidgetReceiver(config) {
  return withAndroidManifest(config, (modConfig) => {
    const mainApp = modConfig.modResults.manifest.application?.[0];
    if (!mainApp) return modConfig;

    mainApp.receiver = mainApp.receiver || [];
    const exists = mainApp.receiver.some(
      (r) => r.$['android:name'] === WIDGET_CLASS_NAME
    );

    if (!exists) {
      mainApp.receiver.push({
        $: {
          'android:name': WIDGET_CLASS_NAME,
          'android:exported': 'true',
          'android:label': 'WidgeBuddy',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.appwidget.action.APPWIDGET_UPDATE',
                },
              },
            ],
          },
        ],
        'meta-data': [
          {
            $: {
              'android:name': 'android.appwidget.provider',
              'android:resource': '@xml/widgebuddy_widget_info',
            },
          },
        ],
      });
    }

    return modConfig;
  });
}

/**
 * 3. Copy Kotlin & XML files into Android project folder
 */
function withWidgetFiles(config) {
  return withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const projectRoot = modConfig.modRequest.projectRoot;
      const androidMain = path.join(
        projectRoot,
        'android',
        'app',
        'src',
        'main'
      );

      // Ensure directories
      const widgetJavaDir = path.join(
        androidMain,
        'java',
        'com',
        'widgebuddy',
        'app',
        'widget'
      );
      const resXmlDir = path.join(androidMain, 'res', 'xml');
      const resLayoutDir = path.join(androidMain, 'res', 'layout');
      const resDrawableDir = path.join(androidMain, 'res', 'drawable');

      [widgetJavaDir, resXmlDir, resLayoutDir, resDrawableDir].forEach((dir) => {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      });

      // Targets source dir
      const targetsAndroid = path.join(projectRoot, 'targets', 'android');

      // 1. Copy WidgeBuddyWidgetProvider.kt
      const providerSource = path.join(
        targetsAndroid,
        'WidgeBuddyWidgetProvider.kt'
      );
      if (fs.existsSync(providerSource)) {
        fs.copyFileSync(
          providerSource,
          path.join(widgetJavaDir, 'WidgeBuddyWidgetProvider.kt')
        );
      }

      // 2. Write WidgetBridgeModule.kt
      const bridgeModuleCode = `package com.widgebuddy.app.widget

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
`;
      fs.writeFileSync(
        path.join(widgetJavaDir, 'WidgetBridgeModule.kt'),
        bridgeModuleCode
      );

      // 3. Write WidgetBridgePackage.kt
      const bridgePackageCode = `package com.widgebuddy.app.widget

import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.uimanager.ViewManager

class WidgetBridgePackage : ReactPackage {
    override fun createNativeModules(reactContext: ReactApplicationContext): List<NativeModule> {
        return listOf(WidgetBridgeModule(reactContext))
    }

    override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
        return emptyList()
    }
}
`;
      fs.writeFileSync(
        path.join(widgetJavaDir, 'WidgetBridgePackage.kt'),
        bridgePackageCode
      );

      // 4. Layout XML
      const layoutSource = path.join(
        targetsAndroid,
        'widgebuddy_widget_layout.xml'
      );
      if (fs.existsSync(layoutSource)) {
        fs.copyFileSync(
          layoutSource,
          path.join(resLayoutDir, 'widgebuddy_widget_layout.xml')
        );
      }

      // 5. Info XML
      const infoXmlCode = `<?xml version="1.0" encoding="utf-8"?>
<appwidget-provider xmlns:android="http://schemas.android.com/apk/res/android"
    android:minWidth="180dp"
    android:minHeight="110dp"
    android:targetCellWidth="4"
    android:targetCellHeight="2"
    android:maxResizeWidth="400dp"
    android:maxResizeHeight="300dp"
    android:resizeMode="horizontal|vertical"
    android:minResizeWidth="140dp"
    android:minResizeHeight="80dp"
    android:updatePeriodMillis="1800000"
    android:initialLayout="@layout/widgebuddy_widget_layout"
    android:previewImage="@mipmap/ic_launcher"
    android:description="@string/widget_description"
    android:widgetCategory="home_screen|keyguard">
</appwidget-provider>
`;
      fs.writeFileSync(
        path.join(resXmlDir, 'widgebuddy_widget_info.xml'),
        infoXmlCode
      );

      // 6. Drawables
      const bgDrawableCode = `<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
    android:shape="rectangle">
    <gradient
        android:angle="315"
        android:startColor="#0F172A"
        android:centerColor="#1E293B"
        android:endColor="#0F172A"
        android:type="linear" />
    <corners android:radius="20dp" />
    <stroke
        android:width="1dp"
        android:color="#334155" />
</shape>
`;
      fs.writeFileSync(
        path.join(resDrawableDir, 'widget_background_rounded.xml'),
        bgDrawableCode
      );

      const sunDrawableCode = `<?xml version="1.0" encoding="utf-8"?>
<vector xmlns:android="http://schemas.android.com/apk/res/android"
    android:width="48dp"
    android:height="48dp"
    android:viewportWidth="24"
    android:viewportHeight="24">
    <path
        android:fillColor="#FBBF24"
        android:pathData="M12,7c-2.76,0 -5,2.24 -5,5s2.24,5 5,5 5,-2.24 5,-5 -2.24,-5 -5,-5zM2,13h2c0.55,0 1,-0.45 1,-1s-0.45,-1 -1,-1L2,11c-0.55,0 -1,0.45 -1,1s0.45,1 1,1zM20,13h2c0.55,0 1,-0.45 1,-1s-0.45,-1 -1,-1h-2c-0.55,0 -1,0.45 -1,1s0.45,1 1,1zM11,2v2c0,0.55 0.45,1 1,1s1,-0.45 1,-1L13,2c0,-0.55 -0.45,-1 -1,-1s-1,0.45 -1,1zM11,20v2c0,0.55 0.45,1 1,1s1,-0.45 1,-1v-2c0,-0.55 -0.45,-1 -1,-1s-1,0.45 -1,1zM5.99,4.58c-0.39,-0.39 -1.03,-0.39 -1.41,0s-0.39,1.03 0,1.41l1.06,1.06c0.39,0.39 1.03,0.39 1.41,0s0.39,-1.03 0,-1.41L5.99,4.58zM18.36,16.95c-0.39,-0.39 -1.03,-0.39 -1.41,0s-0.39,1.03 0,1.41l1.06,1.06c0.39,0.39 1.03,0.39 1.41,0s0.39,-1.03 0,-1.41l-1.06,-1.06zM7.05,18.36l-1.06,1.06c-0.39,0.39 -0.39,1.03 0,1.41s1.03,0.39 1.41,0l1.06,-1.06c0.39,-0.39 0.39,-1.03 0,-1.41s-1.02,-0.39 -1.41,0zM16.95,5.99l1.06,-1.06c0.39,-0.39 0.39,-1.03 0,-1.41s-1.03,-0.39 -1.41,0l-1.06,1.06c-0.39,0.39 -0.39,1.03 0,1.41s1.03,0.39 1.41,0z"/>
</vector>
`;
      fs.writeFileSync(
        path.join(resDrawableDir, 'ic_sun_weather.xml'),
        sunDrawableCode
      );

      return modConfig;
    },
  ]);
}

/**
 * 4. Register package in MainApplication.kt
 */
function withWidgetPackage(config) {
  return withMainApplication(config, (modConfig) => {
    let contents = modConfig.modResults.contents;
    if (!contents.includes(WIDGET_PACKAGE_NAME)) {
      contents = contents.replace(
        /PackageList\(this\)\.packages\.apply\s*\{([\s\S]*?)\}/,
        (match, inner) => {
          return `PackageList(this).packages.apply {${inner}          add(${WIDGET_PACKAGE_NAME})\n        }`;
        }
      );
    }
    modConfig.modResults.contents = contents;
    return modConfig;
  });
}

function withAndroidWidget(config) {
  config = withWidgetStrings(config);
  config = withWidgetReceiver(config);
  config = withWidgetFiles(config);
  config = withWidgetPackage(config);
  return config;
}

module.exports = createRunOncePlugin(
  withAndroidWidget,
  'withAndroidWidget',
  '1.0.0'
);
