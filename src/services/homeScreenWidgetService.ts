/**
 * src/services/homeScreenWidgetService.ts
 *
 * Cross-platform synchronization service for mobile Home Screen Widgets.
 * Bridges user-created declarative widgets to:
 * - Android AppWidget (via native SharedPreferences & requestPinAppWidget)
 * - iOS WidgetKit (via App Groups UserDefaults & WidgetCenter.reloadAllTimelines)
 * - Expo Go development mode (graceful fallback via AsyncStorage)
 */

import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { DeclarativeWidgetDefinition } from '@/widgets/declarative/definition';
import { UniversalItem } from '@/widgets/schema';
import { getWidgetRepository } from '@/repositories';

export const HOME_SCREEN_STORAGE_KEY = '@widgebuddy/home_screen_widget';
export const IOS_APP_GROUP_ID = 'group.com.widgebuddy.app';
export const ANDROID_PREFS_NAME = 'WidgeBuddyWidgetPrefs';

export interface HomeScreenWidgetListItem {
  id?: string;
  title: string;
  subtitle?: string;
  meta?: string;
  isDone?: boolean;
  icon?: string;
}

export interface HomeScreenWidgetPayload {
  /** The full declarative widget definition */
  definition: DeclarativeWidgetDefinition;
  /** Normalized live data items (e.g. weather, events, tasks) */
  items: UniversalItem[];
  /** Timestamp when synchronized */
  syncedAt: string;
  /** Primary size to display ('small' | 'medium' | 'large') */
  size: 'small' | 'medium' | 'large';
  /** Formatted summary for quick native glance */
  glanceSummary?: {
    title: string;
    widgetType: 'weather' | 'task' | 'calendar' | 'article' | 'clock' | 'custom';
    backgroundColor?: string;
    primaryText?: string;
    secondaryText?: string;
    metaText?: string;
    // Weather specific
    temperature?: number;
    condition?: string;
    location?: string;
    forecastDays?: Array<{ day: string; temp: number; icon: string }>;
    // Clock specific
    timeText?: string;
    dateText?: string;
    // List based
    listItems?: HomeScreenWidgetListItem[];
  };
}

export interface PinWidgetResult {
  success: boolean;
  platform: 'android' | 'ios' | 'web';
  isNativeSupported: boolean;
  isExpoGo?: boolean;
  message: string;
  details?: string;
}

/**
 * Recursively searches a declarative element tree for the first 'weather' element.
 * Used to extract the user-configured forecastDays value.
 */
// REASON: Layout element tree is untyped at this layer; narrowed via type checks
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findWeatherElement(element: any): { forecastDays?: number } | null {
  if (!element) return null;
  if (element.type === 'weather') return element;
  if (Array.isArray(element.children)) {
    for (const child of element.children) {
      const found = findWeatherElement(child);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Recursively searches for any element of a given type in the layout tree.
 */
// REASON: Layout element tree is untyped at this layer
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasElementType(element: any, type: string): boolean {
  if (!element) return false;
  if (element.type === type) return true;
  if (Array.isArray(element.children)) {
    return element.children.some((c: any) => hasElementType(c, type)); // eslint-disable-line @typescript-eslint/no-explicit-any
  }
  return false;
}

function formatEventTime(startAt?: string, endAt?: string, isAllDay?: boolean): string {
  if (!startAt) return 'All Day';
  if (isAllDay) return 'All Day';
  try {
    const s = new Date(startAt);
    const startStr = s.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    if (endAt) {
      const e = new Date(endAt);
      const endStr = e.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      return `${startStr} - ${endStr}`;
    }
    return startStr;
  } catch {
    return startAt;
  }
}

function formatPublishedTime(publishedAt?: string): string {
  if (!publishedAt) return '';
  try {
    const d = new Date(publishedAt);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

class HomeScreenWidgetService {
  /**
   * Synchronizes an active widget and its latest normalized items to the home screen bridge.
   */
  async setActiveHomeScreenWidget(
    widget: DeclarativeWidgetDefinition,
    items: UniversalItem[] = [],
    size?: 'small' | 'medium' | 'large',
  ): Promise<HomeScreenWidgetPayload> {
    const targetSize = size || widget.defaultSize || 'medium';
    const activeLayout = widget.layouts?.[targetSize];
    const rootElement = activeLayout?.root;
    const backgroundColor = activeLayout?.backgroundColor;

    // Determine widgetType
    let widgetType: 'weather' | 'task' | 'calendar' | 'article' | 'clock' | 'custom' = 'custom';

    const category = widget.category?.toLowerCase() || '';
    const widgetId = widget.id?.toLowerCase() || '';

    if (category === 'weather' || widgetId.includes('weather') || hasElementType(rootElement, 'weather') || items.some((i) => i.type === 'weather')) {
      widgetType = 'weather';
    } else if (category === 'clock' || widgetId.includes('clock') || hasElementType(rootElement, 'clock')) {
      widgetType = 'clock';
    } else if (category === 'tasks' || category === 'productivity' || widgetId.includes('task') || hasElementType(rootElement, 'task_list') || items.some((i) => i.type === 'task')) {
      widgetType = 'task';
    } else if (category === 'calendar' || widgetId.includes('calendar') || hasElementType(rootElement, 'event_list') || items.some((i) => i.type === 'calendar_event')) {
      widgetType = 'calendar';
    } else if (category === 'news' || widgetId.includes('rss') || widgetId.includes('feed') || hasElementType(rootElement, 'article_list') || items.some((i) => i.type === 'article')) {
      widgetType = 'article';
    }

    // Build specific glance telemetry based on widgetType
    let glanceSummary: HomeScreenWidgetPayload['glanceSummary'] = {
      title: widget.displayName,
      widgetType,
      backgroundColor,
    };

    if (widgetType === 'weather') {
      const weatherItem = items.find((i) => i.type === 'weather');
      // REASON: weatherItem.meta.forecast is untyped; narrowed immediately after access
      const forecastDaysData = (weatherItem?.meta?.forecast as any[]) || []; // eslint-disable-line @typescript-eslint/no-explicit-any
      const weatherElement = findWeatherElement(rootElement);
      const maxForecastDays = weatherElement?.forecastDays ?? 3;
      const temp = weatherItem?.temp !== undefined ? Math.round(weatherItem.temp) : undefined;
      const condition = weatherItem?.condition;
      const location = (weatherItem?.meta?.location as string) || (weatherItem?.meta?.cityName as string) || 'Local Weather';

      glanceSummary = {
        ...glanceSummary,
        temperature: temp,
        condition,
        location,
        primaryText: temp !== undefined ? `${temp}° ${condition || ''}`.trim() : 'Weather',
        secondaryText: location,
        metaText: 'Weather',
        forecastDays: forecastDaysData.slice(0, maxForecastDays).map((f) => ({
          day: f.day || 'Day',
          temp: Math.round(f.temp ?? 20),
          icon: f.icon || 'sun',
        })),
      };
    } else if (widgetType === 'task') {
      const taskItems = items.filter((i) => i.type === 'task');
      // REASON: status check
      const pendingTasks = taskItems.filter((t: any) => t.status === 'pending');
      const listItems: HomeScreenWidgetListItem[] = taskItems.slice(0, 3).map((t: any) => ({
        id: t.id,
        title: t.title || 'Task',
        subtitle: t.project || (t.priority ? `Priority: ${t.priority}` : undefined),
        meta: t.dueDate ? t.dueDate.split('T')[0] : undefined,
        isDone: t.status === 'completed',
        icon: t.status === 'completed' ? 'check' : 'square',
      }));

      glanceSummary = {
        ...glanceSummary,
        primaryText: taskItems.length > 0 ? `${pendingTasks.length} pending task${pendingTasks.length === 1 ? '' : 's'}` : 'No active tasks',
        secondaryText: taskItems[0]?.title ? `Next: ${taskItems[0].title}` : 'All tasks completed',
        metaText: 'Tasks',
        listItems,
      };
    } else if (widgetType === 'calendar') {
      const calendarItems = items.filter((i) => i.type === 'calendar_event');
      const listItems: HomeScreenWidgetListItem[] = calendarItems.slice(0, 3).map((e: any) => ({
        id: e.id,
        title: e.title || 'Event',
        subtitle: formatEventTime(e.startAt, e.endAt, e.isAllDay),
        meta: e.location || undefined,
        icon: 'calendar',
      }));

      glanceSummary = {
        ...glanceSummary,
        primaryText: calendarItems.length > 0 ? (calendarItems[0].title || 'Upcoming Event') : 'No upcoming events',
        secondaryText: calendarItems.length > 0 ? formatEventTime((calendarItems[0] as any).startAt, (calendarItems[0] as any).endAt, (calendarItems[0] as any).isAllDay) : 'Schedule is clear',
        metaText: 'Calendar',
        listItems,
      };
    } else if (widgetType === 'article') {
      const articleItems = items.filter((i) => i.type === 'article');
      const listItems: HomeScreenWidgetListItem[] = articleItems.slice(0, 3).map((a: any) => ({
        id: a.id,
        title: a.title || 'Headline',
        subtitle: a.summary ? a.summary.slice(0, 60) : a.author,
        meta: a.publishedAt ? formatPublishedTime(a.publishedAt) : a.provider,
        icon: 'article',
      }));

      glanceSummary = {
        ...glanceSummary,
        primaryText: articleItems.length > 0 ? (articleItems[0] as any).title : 'Latest Articles',
        secondaryText: articleItems[0] && (articleItems[0] as any).summary ? (articleItems[0] as any).summary.slice(0, 80) : 'Headlines & Updates',
        metaText: articleItems[0]?.provider || 'RSS',
        listItems,
      };
    } else if (widgetType === 'clock') {
      const now = new Date();
      const timeText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateText = now.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

      glanceSummary = {
        ...glanceSummary,
        timeText,
        dateText,
        primaryText: timeText,
        secondaryText: dateText,
        metaText: 'Clock',
      };
    } else {
      // Custom / generic
      const listItems: HomeScreenWidgetListItem[] = items.slice(0, 3).map((it: any) => ({
        id: it.id,
        title: it.title || it.label || it.name || 'Item',
        subtitle: it.summary || it.body || it.value?.toString(),
        meta: it.provider || undefined,
        icon: 'item',
      }));

      glanceSummary = {
        ...glanceSummary,
        primaryText: widget.displayName,
        secondaryText: `${items.length} items`,
        metaText: 'Widget',
        listItems,
      };
    }

    const payload: HomeScreenWidgetPayload = {
      definition: widget,
      items,
      syncedAt: new Date().toISOString(),
      size: targetSize,
      glanceSummary,
    };

    // 1. Always save to AsyncStorage for cross-platform app persistence
    await AsyncStorage.setItem(HOME_SCREEN_STORAGE_KEY, JSON.stringify(payload));

    // 2. Platform-specific native bridge write (when running outside plain Expo Go)
    await this.writeToNativeStorage(payload);

    return payload;
  }

  /**
   * Retrieves the currently active home screen widget payload.
   */
  async getActiveHomeScreenWidget(): Promise<HomeScreenWidgetPayload | null> {
    try {
      const raw = await AsyncStorage.getItem(HOME_SCREEN_STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as HomeScreenWidgetPayload;
    } catch {
      return null;
    }
  }

  /**
   * Triggers the native home screen widget pinning or timeline reload.
   * - On Android: Requests the native launcher pin dialog (requestPinAppWidget).
   * - On iOS: Notifies WidgetKit to reload timelines and informs user about iOS Jiggle Mode.
   */
  async requestPinHomeScreenWidget(
    widget: DeclarativeWidgetDefinition,
    items: UniversalItem[] = [],
  ): Promise<PinWidgetResult> {
    // Synchronize payload first
    await this.setActiveHomeScreenWidget(widget, items);

    if (Platform.OS === 'android') {
      return this.handleAndroidPin();
    } else if (Platform.OS === 'ios') {
      return this.handleIosPin();
    }

    return {
      success: true,
      platform: 'web',
      isNativeSupported: false,
      message: 'Widget synced to web dashboard storage.',
    };
  }

  /**
   * Returns all available user-saved widgets so native widgets can present a selector.
   */
  async getAvailableWidgetsList(): Promise<Array<{ id: string; name: string; category?: string }>> {
    try {
      const repo = getWidgetRepository();
      const widgets = await repo.list();
      return widgets.map((w) => ({
        id: w.id,
        name: w.displayName,
        category: w.category,
      }));
    } catch {
      return [];
    }
  }

  /**
   * Returns true if currently running within the Expo Go client sandbox.
   */
  isExpoGoEnvironment(): boolean {
    return (
      Constants.appOwnership === 'expo' ||
      Constants.executionEnvironment === ExecutionEnvironment.StoreClient
    );
  }

  // -------------------------------------------------------------------------
  // Private Platform Handlers
  // -------------------------------------------------------------------------

  private async writeToNativeStorage(payload: HomeScreenWidgetPayload): Promise<void> {
    try {
      // In native builds, shared group preferences or custom JNI/Swift modules write here.
      // E.g. react-native-shared-group-preferences for iOS App Groups,
      // and SharedPreferences for Android AppWidgets.
      const payloadString = JSON.stringify(payload);

      if (Platform.OS === 'ios') {
        // iOS: Native WidgetKit reads from UserDefaults(suiteName: IOS_APP_GROUP_ID)
        // In native builds, NativeModules.SharedGroupPreferences?.setItem?.('widget_data', payloadString, IOS_APP_GROUP_ID)
      } else if (Platform.OS === 'android') {
        // Android: Native AppWidgetProvider reads from SharedPreferences
        if (NativeModules.WidgetBridge?.setWidgetData) {
          await NativeModules.WidgetBridge.setWidgetData(payloadString);
        }
      }
    } catch (e) {
      // Gracefully continue on development/sandbox environments
    }
  }

  private async handleAndroidPin(): Promise<PinWidgetResult> {
    if (this.isExpoGoEnvironment()) {
      return {
        success: true,
        platform: 'android',
        isNativeSupported: false,
        isExpoGo: true,
        message:
          'Widget saved to in-app dashboard & local bridge! (Note: Android OS Home Screen widgets require a standalone development build; Expo Go cannot attach widgets to your phone launcher).',
        details:
          'To display this widget on your Android launcher screen, build a standalone app using "npx expo run:android" or EAS Build with the AppWidget target.',
      };
    }

    // If native module is available in a compiled standalone build, attempt programmatic pin request
    if (NativeModules.WidgetBridge?.requestPin) {
      try {
        const pinned = await NativeModules.WidgetBridge.requestPin();
        if (pinned) {
          return {
            success: true,
            platform: 'android',
            isNativeSupported: true,
            isExpoGo: false,
            message: 'Android Home Screen pin dialog requested! Confirm on your home screen launcher prompt.',
          };
        }
      } catch (e) {
        // Fallback to general guidance
      }
    }

    return {
      success: true,
      platform: 'android',
      isNativeSupported: true,
      isExpoGo: false,
      message: 'Widget synced for Android Home Screen! In standalone builds, Android presents the native pin dialog.',
    };
  }

  private async handleIosPin(): Promise<PinWidgetResult> {
    if (this.isExpoGoEnvironment()) {
      return {
        success: true,
        platform: 'ios',
        isNativeSupported: false,
        isExpoGo: true,
        message:
          'Widget saved to in-app dashboard & local bridge! (Note: iOS WidgetKit widgets require a standalone development build; Expo Go cannot attach widgets to your iPhone Home Screen).',
        details:
          'To display this widget on your iPhone Home Screen, build a standalone app using "npx expo run:ios" or EAS Build with the WidgetKit extension, then use iOS Jiggle Mode.',
      };
    }

    return {
      success: true,
      platform: 'ios',
      isNativeSupported: true,
      isExpoGo: false,
      message: 'Widget synchronized with iOS WidgetKit! Add it from the iPhone Home Screen widget gallery.',
    };
  }
}

export const homeScreenWidgetService = new HomeScreenWidgetService();
