/**
 * src/renderer/declarative/elements/IconView.tsx
 *
 * Renders declarative IconElement mapped to Lucide icons.
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Sun,
  Cloud,
  CloudSun,
  CloudRain,
  Calendar,
  Clock,
  CheckCircle,
  CheckSquare,
  Newspaper,
  TrendingUp,
  DollarSign,
  Users,
  Zap,
  Droplet,
  Wind,
  Bell,
  Heart,
  Server,
  UserMinus,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  HelpCircle,
  LucideIcon,
} from 'lucide-react-native';
import { IconElement, IconElementInput, Action } from '@/widgets/schema';

const ICON_MAP: Record<string, LucideIcon> = {
  'sun': Sun,
  'cloud': Cloud,
  'cloud-sun': CloudSun,
  'cloud-rain': CloudRain,
  'calendar': Calendar,
  'clock': Clock,
  'check-circle': CheckCircle,
  'check-square': CheckSquare,
  'newspaper': Newspaper,
  'trending-up': TrendingUp,
  'dollar-sign': DollarSign,
  'users': Users,
  'zap': Zap,
  'droplet': Droplet,
  'wind': Wind,
  'bell': Bell,
  'heart': Heart,
  'server': Server,
  'user-minus': UserMinus,
  'arrow-up': ArrowUp,
  'arrow-down': ArrowDown,
  'minus': Minus,
  'plus': Plus,
};

interface IconViewProps {
  element: IconElement | IconElementInput;
  onAction?: (action: Action) => void;
}

export const IconView = React.memo(function IconView({
  element,
  onAction,
}: IconViewProps) {
  const IconComponent = ICON_MAP[element.name] ?? HelpCircle;

  let size = 20;
  if (typeof element.size === 'number') {
    size = element.size;
  } else if (element.size === 'small') {
    size = 16;
  } else if (element.size === 'medium') {
    size = 22;
  } else if (element.size === 'large') {
    size = 28;
  }

  const color = element.color ?? '#64748b';

  const iconElement = (
    <View style={styles.container}>
      <IconComponent size={size} color={color} />
    </View>
  );

  if (element.action) {
    return (
      <TouchableOpacity
        onPress={() => onAction?.(element.action!)}
        activeOpacity={0.7}
      >
        {iconElement}
      </TouchableOpacity>
    );
  }

  return iconElement;
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
