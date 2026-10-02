/**
 * src/ui/Icon.tsx
 *
 * Reusable icon component wrapping lucide-react-native.
 */
import React from 'react';
import {
  LayoutDashboard, PlusCircle, Settings, Sun, Moon, Calendar, CheckSquare,
  Layout, Clock, CloudSun, Rss, ChevronRight, Plug, User, Palette,
  CheckCircle2, AlertCircle, Inbox, Plus,
  Trash2, ArrowUp, ArrowDown, Edit3, Eye, Save, Sliders, Layers,
  ChevronDown, ChevronUp, Check, X, Sparkles, Newspaper, BarChart2,
  Activity, Minus, Type, Columns, Smartphone, ExternalLink, ArrowUpDown,
  ShieldCheck, AlertTriangle, Navigation, MapPin, Slash, CloudOff,
  RefreshCw, Circle, XCircle, Lock, Briefcase, Sunrise, Sunset
} from 'lucide-react-native';
import { colors } from './theme';

const iconMap = {
  'layout-dashboard': LayoutDashboard,
  'plus-circle': PlusCircle,
  'settings': Settings,
  'sun': Sun,
  'moon': Moon,
  'calendar': Calendar,
  'check-square': CheckSquare,
  'layout': Layout,
  'clock': Clock,
  'cloud-sun': CloudSun,
  'rss': Rss,
  'chevron-right': ChevronRight,
  'chevron-down': ChevronDown,
  'chevron-up': ChevronUp,
  'plug': Plug,
  'user': User,
  'palette': Palette,
  'check-circle-2': CheckCircle2,
  'alert-circle': AlertCircle,
  'inbox': Inbox,
  'plus': Plus,
  'trash-2': Trash2,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'arrow-up-down': ArrowUpDown,
  'edit-3': Edit3,
  'eye': Eye,
  'save': Save,
  'sliders': Sliders,
  'layers': Layers,
  'check': Check,
  'x': X,
  'sparkles': Sparkles,
  'newspaper': Newspaper,
  'bar-chart-2': BarChart2,
  'activity': Activity,
  'minus': Minus,
  'type': Type,
  'columns': Columns,
  'smartphone': Smartphone,
  'external-link': ExternalLink,
  'shield-check': ShieldCheck,
  'alert-triangle': AlertTriangle,
  'navigation': Navigation,
  'map-pin': MapPin,
  'slash': Slash,
  'cloud-off': CloudOff,
  'refresh-cw': RefreshCw,
  'circle': Circle,
  'x-circle': XCircle,
  'lock': Lock,
  'briefcase': Briefcase,
  'sunrise': Sunrise,
  'sunset': Sunset,
};

export type IconName = keyof typeof iconMap;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 24, color = colors.textMuted }: IconProps) {
  const LucideIcon = iconMap[name];

  if (!LucideIcon) {
    return null;
  }

  return <LucideIcon size={size} color={color} />;
}
