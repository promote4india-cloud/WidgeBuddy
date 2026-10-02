# Mobile Home Screen Widgets Guide

> **Status**: Architecture & Implementation Guide  
> **Topic**: Why in-app widgets differ from OS home-screen widgets, and how to enable native launcher widgets.

---

## 1. The Two Widget Surfaces

In WidgeBuddy, there are two distinct places where widgets can exist:

| Surface | Where it lives | Technology | Current Status |
|---|---|---|---|
| **In-App Dashboard** | Inside the WidgeBuddy app (`app/(tabs)/dashboard.tsx`) | React Native views (`DeclarativeWidgetRenderer.tsx`) | **Fully Functional** |
| **Mobile Home Screen** | Your phone's OS home screen / launcher desktop | iOS WidgetKit (SwiftUI) & Android AppWidget (RemoteViews/Glance) | **Requires Native Build** |

When you create or save a widget in the app (via the Widget Editor or Start From Template), it is **immediately added to your in-app Dashboard**.

---

## 2. Why Created Widgets Are Not On Your Phone's Home Screen

If you create a widget in WidgeBuddy and do not see it on your physical phone's home screen, this occurs due to three technical and operating system realities:

### Reason 1: Expo Go Sandbox Limitation
If you run the app using `npx expo start` and test it inside the **Expo Go** mobile app:
- **Expo Go is a pre-compiled sandbox client.** It cannot execute custom native iOS/Android code or native background extensions.
- Both Apple (iOS WidgetKit) and Google (Android AppWidgets) require separate native binaries/targets compiled by Xcode or Android Gradle.
- Expo Go cannot register home screen widgets with your phone's operating system launcher.

### Reason 2: OS Security Models & User Interaction
- **iOS (Apple iPhones & iPads)**:  
  Apple's security model **strictly prohibits any application from programmatically placing a widget onto the user's home screen**. No app in the App Store can do this. The user *must* manually:
  1. Long-press an empty area on their iPhone Home Screen until the apps jiggle.
  2. Tap the `+` icon in the top-left corner.
  3. Search for **WidgeBuddy**.
  4. Select the widget size and tap **Add Widget**.
- **Android**:  
  Android provides an API (`AppWidgetManager.requestPinAppWidget`) allowing apps to request a home screen pin dialog, or users can open their launcher's **Widgets** menu to drag the widget out. However, this requires a compiled native application with an active `AppWidgetProvider` in `AndroidManifest.xml`.

### Reason 3: Native Targets Need to be Compiled into a Development Build
The WidgeBuddy repository includes native widget code templates in `targets/`:
- `targets/ios/WidgeBuddyWidget.swift` (SwiftUI WidgetKit extension reading App Group `group.com.widgebuddy.app`)
- `targets/android/WidgeBuddyWidgetProvider.kt` (Android AppWidgetProvider reading `WidgeBuddyWidgetPrefs`)
- `targets/android/widgebuddy_widget_layout.xml` & `widgebuddy_widget_info.xml`

These files must be compiled into a custom native build (via `npx expo prebuild` or EAS Build) rather than running in Expo Go.

---

## 3. How Data Flows to Native Widgets

```
[User Saves Widget in App]
           │
           ▼
[WidgetRepository (AsyncStorage / Supabase)]
           │
           ▼
[homeScreenWidgetService.ts]
   ├── 1. Saves full JSON definition to AsyncStorage
   ├── 2. Generates simplified `glanceSummary` payload
   └── 3. Writes payload to OS shared storage:
          ├── iOS: UserDefaults(suiteName: "group.com.widgebuddy.app")
          └── Android: SharedPreferences("WidgeBuddyWidgetPrefs")
                      │
                      ▼
[Native OS Home Screen Widget]
   ├── iOS: WidgeBuddyWidget.swift renders SwiftUI view
   └── Android: WidgeBuddyWidgetProvider.kt updates RemoteViews
```

---

## 4. How to Enable and Test Native Home Screen Widgets

To transition from the in-app dashboard to native OS home screen widgets on your mobile device:

### Step 1: Create a Development Build
Do not use Expo Go for native widget testing. Generate native project folders:
```bash
npx expo prebuild
```
Or create a development build with EAS:
```bash
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

### Step 2: Link Native Targets
- **iOS**: Add a Widget Extension target in Xcode (or use an Expo config plugin like `@bacons/apple-targets`), point it to `targets/ios/WidgeBuddyWidget.swift`, and ensure the App Group `group.com.widgebuddy.app` is enabled on both the main app target and the widget target.
- **Android**: Include `WidgeBuddyWidgetProvider.kt` and its XML resources in `android/app/src/main/`, then declare the receiver in `AndroidManifest.xml`:
  ```xml
  <receiver
      android:name=".widget.WidgeBuddyWidgetProvider"
      android:exported="true">
      <intent-filter>
          <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
      </intent-filter>
      <meta-data
          android:name="android.appwidget.provider"
          android:resource="@xml/widgebuddy_widget_info" />
  </receiver>
  ```

### Step 3: Run on Physical Device or Emulator
```bash
# Android
npx expo run:android

# iOS (requires macOS with Xcode)
npx expo run:ios
```

### Step 4: Add Widget to Home Screen
- **On Android**: Long-press any empty space on your phone launcher, tap **Widgets**, find **WidgeBuddy**, and place it on your home screen.
- **On iOS**: Long-press on the iPhone home screen until apps jiggle, tap the `+` button in the top corner, search for **WidgeBuddy**, and tap **Add Widget**.
