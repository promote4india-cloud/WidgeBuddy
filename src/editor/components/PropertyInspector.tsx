/**
 * src/editor/components/PropertyInspector.tsx
 *
 * Inspector panel allowing users to edit basic properties of any selected element.
 * Dynamically switches form fields based on element type (Text, Icon, Weather, Event, etc.).
 */

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Icon } from '@/ui/Icon';
import { colors, radius, spacing, typography } from '@/ui/theme';
import { useEditorStore } from '@/store/editorStore';
import { findElementById } from '@/editor/utils/treeUtils';
import {
  WidgetElement,
  ContainerElement,
  TextElement,
  IconElement,
  WeatherElement,
  EventElement,
  TaskListElement,
  ArticleListElement,
  MetricElement,
  DividerElement,
  ActionElement,
  TextVariant,
  FontWeight,
  TextAlign,
  WeatherDisplayMode,
  MetricTrend,
  ContainerDirection,
} from '@/widgets/declarative/elements';

const COLOR_SWATCHES = [
  '#0f172a',
  '#2563eb',
  '#6366f1',
  '#8b5cf6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#64748b',
  '#ffffff',
];

interface PillOption<T> {
  label: string;
  value: T;
}

function PillSelector<T extends string | number>({
  label,
  options,
  selectedValue,
  onSelect,
}: {
  label: string;
  options: PillOption<T>[];
  selectedValue: T | undefined;
  onSelect: (val: T) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pillRow}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          return (
            <TouchableOpacity
              key={String(opt.value)}
              style={[styles.pill, isSelected && styles.pillActive]}
              onPress={() => onSelect(opt.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ColorPickerRow({
  label,
  selectedColor,
  onSelect,
}: {
  label: string;
  selectedColor?: string;
  onSelect: (color: string) => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.swatchRow}>
        {COLOR_SWATCHES.map((color) => {
          const isSelected = selectedColor?.toLowerCase() === color.toLowerCase();
          return (
            <TouchableOpacity
              key={color}
              style={[
                styles.swatch,
                { backgroundColor: color },
                color === '#ffffff' && styles.swatchWhite,
                isSelected && styles.swatchSelected,
              ]}
              onPress={() => onSelect(color)}
              activeOpacity={0.8}
            >
              {isSelected && (
                <Icon
                  name="check"
                  size={12}
                  color={color === '#ffffff' || color === '#f59e0b' ? '#0f172a' : '#ffffff'}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function ToggleRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (val: boolean) => void;
}) {
  return (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.surface}
      />
    </View>
  );
}

export function PropertyInspector() {
  const draft = useEditorStore((s) => s.draft);
  const activeSize = useEditorStore((s) => s.activeSize);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const selectElement = useEditorStore((s) => s.selectElement);
  const updateElement = useEditorStore((s) => s.updateElement);
  const updateActiveLayout = useEditorStore((s) => s.updateActiveLayout);

  if (!draft) return null;

  const layout = draft.layouts[activeSize];
  if (!layout) return null;

  const rootContainer = layout.root as unknown as ContainerElement;
  const selectedElement: WidgetElement | null = selectedElementId
    ? findElementById(rootContainer, selectedElementId)
    : null;

  // If no element selected, inspect root layout
  if (!selectedElement) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Icon name="sliders" size={18} color={colors.primary} />
            <Text style={styles.title}>Layout Settings ({activeSize.toUpperCase()})</Text>
          </View>
        </View>

        <Text style={styles.hintText}>
          Configure overall widget background and spacing, or tap any component in the tree to edit its properties.
        </Text>

        <ColorPickerRow
          label="Widget Background"
          selectedColor={layout.backgroundColor || '#ffffff'}
          onSelect={(backgroundColor) => updateActiveLayout({ backgroundColor })}
        />

        <PillSelector<number>
          label="Outer Padding"
          options={[
            { label: '8px', value: 8 },
            { label: '12px', value: 12 },
            { label: '16px', value: 16 },
            { label: '20px', value: 20 },
          ]}
          selectedValue={typeof layout.padding === 'number' ? layout.padding : 14}
          onSelect={(padding) => updateActiveLayout({ padding })}
        />

        <PillSelector<ContainerDirection>
          label="Root Direction"
          options={[
            { label: 'Vertical (Column)', value: 'column' },
            { label: 'Horizontal (Row)', value: 'row' },
            { label: 'Stack', value: 'stack' },
          ]}
          selectedValue={rootContainer.direction || 'column'}
          onSelect={(direction) => updateElement(rootContainer.id!, { direction })}
        />

        <PillSelector<number>
          label="Item Gap"
          options={[
            { label: '4px', value: 4 },
            { label: '8px', value: 8 },
            { label: '12px', value: 12 },
            { label: '16px', value: 16 },
          ]}
          selectedValue={rootContainer.gap ?? 8}
          onSelect={(gap) => updateElement(rootContainer.id!, { gap })}
        />
      </View>
    );
  }

  const handleUpdate = (patch: Partial<WidgetElement>) => {
    if (selectedElement.id) {
      updateElement(selectedElement.id, patch);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="edit-3" size={18} color={colors.primary} />
          <Text style={styles.title}>
            Edit {selectedElement.type.toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => selectElement(null)}
          accessibilityLabel="Deselect component"
        >
          <Icon name="x" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* TEXT ELEMENT INSPECTOR */}
        {selectedElement.type === 'text' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Content</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as TextElement).content}
                onChangeText={(content) => handleUpdate({ content })}
                placeholder="Enter text..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <PillSelector<TextVariant>
              label="Variant"
              options={[
                { label: 'Heading', value: 'heading' },
                { label: 'Title', value: 'title' },
                { label: 'Subtitle', value: 'subtitle' },
                { label: 'Body', value: 'body' },
                { label: 'Caption', value: 'caption' },
              ]}
              selectedValue={(selectedElement as TextElement).variant || 'body'}
              onSelect={(variant) => handleUpdate({ variant })}
            />

            <PillSelector<FontWeight>
              label="Weight"
              options={[
                { label: 'Regular', value: 'regular' },
                { label: 'Medium', value: 'medium' },
                { label: 'Semibold', value: 'semibold' },
                { label: 'Bold', value: 'bold' },
              ]}
              selectedValue={(selectedElement as TextElement).weight || 'regular'}
              onSelect={(weight) => handleUpdate({ weight })}
            />

            <PillSelector<TextAlign>
              label="Alignment"
              options={[
                { label: 'Left', value: 'left' },
                { label: 'Center', value: 'center' },
                { label: 'Right', value: 'right' },
              ]}
              selectedValue={(selectedElement as TextElement).align || 'left'}
              onSelect={(align) => handleUpdate({ align })}
            />

            <ColorPickerRow
              label="Text Color"
              selectedColor={(selectedElement as TextElement).color || '#0f172a'}
              onSelect={(color) => handleUpdate({ color })}
            />
          </>
        )}

        {/* ICON ELEMENT INSPECTOR */}
        {selectedElement.type === 'icon' && (
          <>
            <PillSelector<string>
              label="Icon Name"
              options={[
                { label: 'Sparkles', value: 'sparkles' },
                { label: 'Sun', value: 'sun' },
                { label: 'Cloud', value: 'cloud-sun' },
                { label: 'Calendar', value: 'calendar' },
                { label: 'Tasks', value: 'check-square' },
                { label: 'Activity', value: 'activity' },
                { label: 'News', value: 'newspaper' },
                { label: 'Stats', value: 'bar-chart-2' },
              ]}
              selectedValue={(selectedElement as IconElement).name || 'sparkles'}
              onSelect={(name) => handleUpdate({ name })}
            />

            <PillSelector<'small' | 'medium' | 'large'>
              label="Size"
              options={[
                { label: 'Small (16px)', value: 'small' },
                { label: 'Medium (24px)', value: 'medium' },
                { label: 'Large (32px)', value: 'large' },
              ]}
              selectedValue={
                typeof (selectedElement as IconElement).size === 'string'
                  ? ((selectedElement as IconElement).size as 'small' | 'medium' | 'large')
                  : 'medium'
              }
              onSelect={(size) => handleUpdate({ size })}
            />

            <ColorPickerRow
              label="Icon Color"
              selectedColor={(selectedElement as IconElement).color || colors.primary}
              onSelect={(color) => handleUpdate({ color })}
            />
          </>
        )}

        {/* WEATHER ELEMENT INSPECTOR */}
        {selectedElement.type === 'weather' && (
          <>
            <PillSelector<WeatherDisplayMode>
              label="Display Mode"
              options={[
                { label: 'Current', value: 'current' },
                { label: 'Forecast', value: 'forecast' },
                { label: 'Compact', value: 'compact' },
                { label: 'Detailed', value: 'detailed' },
              ]}
              selectedValue={(selectedElement as WeatherElement).displayMode || 'current'}
              onSelect={(displayMode) => handleUpdate({ displayMode })}
            />

            <PillSelector<'auto' | 'celsius' | 'fahrenheit'>
              label="Temperature Unit"
              options={[
                { label: 'Auto (°C/°F)', value: 'auto' },
                { label: 'Celsius (°C)', value: 'celsius' },
                { label: 'Fahrenheit (°F)', value: 'fahrenheit' },
              ]}
              selectedValue={(selectedElement as WeatherElement).tempUnit || 'auto'}
              onSelect={(tempUnit) => handleUpdate({ tempUnit })}
            />

            <PillSelector<number>
              label="Forecast Days"
              options={[
                { label: '1 Day', value: 1 },
                { label: '3 Days', value: 3 },
                { label: '5 Days', value: 5 },
                { label: '7 Days', value: 7 },
              ]}
              selectedValue={(selectedElement as WeatherElement).forecastDays || 3}
              onSelect={(forecastDays) => handleUpdate({ forecastDays })}
            />

            <ToggleRow
              label="Condition Icon"
              value={(selectedElement as WeatherElement).showConditionIcon ?? true}
              onToggle={(showConditionIcon) => handleUpdate({ showConditionIcon })}
            />
            <ToggleRow
              label="Humidity %"
              value={(selectedElement as WeatherElement).showHumidity ?? false}
              onToggle={(showHumidity) => handleUpdate({ showHumidity })}
            />
            <ToggleRow
              label="Wind Speed"
              value={(selectedElement as WeatherElement).showWind ?? false}
              onToggle={(showWind) => handleUpdate({ showWind })}
            />
            <ToggleRow
              label="Feels Like"
              value={(selectedElement as WeatherElement).showFeelsLike ?? false}
              onToggle={(showFeelsLike) => handleUpdate({ showFeelsLike })}
            />
          </>
        )}

        {/* EVENT ELEMENT INSPECTOR */}
        {selectedElement.type === 'event' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Event Title</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as EventElement).title}
                onChangeText={(title) => handleUpdate({ title })}
                placeholder="Meeting name..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Location</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as EventElement).location || ''}
                onChangeText={(location) => handleUpdate({ location })}
                placeholder="Room, Zoom, or address..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <ColorPickerRow
              label="Calendar Tag Color"
              selectedColor={(selectedElement as EventElement).calendarColor || '#6366f1'}
              onSelect={(calendarColor) => handleUpdate({ calendarColor })}
            />

            <ToggleRow
              label="Show Time"
              value={(selectedElement as EventElement).showTime ?? true}
              onToggle={(showTime) => handleUpdate({ showTime })}
            />
            <ToggleRow
              label="Show Location"
              value={(selectedElement as EventElement).showLocation ?? true}
              onToggle={(showLocation) => handleUpdate({ showLocation })}
            />
            <ToggleRow
              label="All Day Event"
              value={(selectedElement as EventElement).isAllDay ?? false}
              onToggle={(isAllDay) => handleUpdate({ isAllDay })}
            />
          </>
        )}

        {/* TASK LIST ELEMENT INSPECTOR */}
        {selectedElement.type === 'taskList' && (
          <>
            <PillSelector<'pending' | 'completed' | 'all'>
              label="Task Filter"
              options={[
                { label: 'Pending Only', value: 'pending' },
                { label: 'Completed', value: 'completed' },
                { label: 'All Tasks', value: 'all' },
              ]}
              selectedValue={(selectedElement as TaskListElement).filterStatus || 'pending'}
              onSelect={(filterStatus) => handleUpdate({ filterStatus })}
            />

            <PillSelector<number>
              label="Max Items to Show"
              options={[
                { label: '2 items', value: 2 },
                { label: '3 items', value: 3 },
                { label: '5 items', value: 5 },
                { label: '8 items', value: 8 },
              ]}
              selectedValue={(selectedElement as TaskListElement).maxItems || 3}
              onSelect={(maxItems) => handleUpdate({ maxItems })}
            />

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Empty State Message</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as TaskListElement).emptyMessage || ''}
                onChangeText={(emptyMessage) => handleUpdate({ emptyMessage })}
                placeholder="No tasks to show"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <ToggleRow
              label="Checkbox"
              value={(selectedElement as TaskListElement).showCheckbox ?? true}
              onToggle={(showCheckbox) => handleUpdate({ showCheckbox })}
            />
            <ToggleRow
              label="Due Date"
              value={(selectedElement as TaskListElement).showDueDate ?? true}
              onToggle={(showDueDate) => handleUpdate({ showDueDate })}
            />
            <ToggleRow
              label="Priority Badge"
              value={(selectedElement as TaskListElement).showPriority ?? false}
              onToggle={(showPriority) => handleUpdate({ showPriority })}
            />
            <ToggleRow
              label="Allow Check/Uncheck"
              value={(selectedElement as TaskListElement).allowToggle ?? true}
              onToggle={(allowToggle) => handleUpdate({ allowToggle })}
            />
          </>
        )}

        {/* ARTICLE LIST ELEMENT INSPECTOR */}
        {selectedElement.type === 'articleList' && (
          <>
            <PillSelector<'compact' | 'card' | 'headline_only'>
              label="Card Layout"
              options={[
                { label: 'Compact', value: 'compact' },
                { label: 'Card', value: 'card' },
                { label: 'Headline Only', value: 'headline_only' },
              ]}
              selectedValue={(selectedElement as ArticleListElement).layout || 'compact'}
              onSelect={(layout) => handleUpdate({ layout })}
            />

            <PillSelector<number>
              label="Max Articles"
              options={[
                { label: '2', value: 2 },
                { label: '3', value: 3 },
                { label: '5', value: 5 },
              ]}
              selectedValue={(selectedElement as ArticleListElement).maxItems || 3}
              onSelect={(maxItems) => handleUpdate({ maxItems })}
            />

            <ToggleRow
              label="Thumbnails"
              value={(selectedElement as ArticleListElement).showImage ?? true}
              onToggle={(showImage) => handleUpdate({ showImage })}
            />
            <ToggleRow
              label="Timestamps"
              value={(selectedElement as ArticleListElement).showTimestamp ?? true}
              onToggle={(showTimestamp) => handleUpdate({ showTimestamp })}
            />
          </>
        )}

        {/* METRIC ELEMENT INSPECTOR */}
        {selectedElement.type === 'metric' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Label</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as MetricElement).label}
                onChangeText={(label) => handleUpdate({ label })}
                placeholder="Metric name..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Value</Text>
              <TextInput
                style={styles.textInput}
                value={String((selectedElement as MetricElement).value)}
                onChangeText={(val) => handleUpdate({ value: val })}
                placeholder="42, 85%, etc..."
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Change / Subtitle</Text>
              <TextInput
                style={styles.textInput}
                value={String((selectedElement as MetricElement).change || '')}
                onChangeText={(change) => handleUpdate({ change })}
                placeholder="+12% from yesterday"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <PillSelector<MetricTrend>
              label="Trend Indicator"
              options={[
                { label: 'Trending Up', value: 'up' },
                { label: 'Trending Down', value: 'down' },
                { label: 'Flat', value: 'flat' },
              ]}
              selectedValue={(selectedElement as MetricElement).trend || 'up'}
              onSelect={(trend) => handleUpdate({ trend })}
            />
          </>
        )}

        {/* DIVIDER ELEMENT INSPECTOR */}
        {selectedElement.type === 'divider' && (
          <>
            <PillSelector<'horizontal' | 'vertical'>
              label="Orientation"
              options={[
                { label: 'Horizontal', value: 'horizontal' },
                { label: 'Vertical', value: 'vertical' },
              ]}
              selectedValue={(selectedElement as DividerElement).orientation || 'horizontal'}
              onSelect={(orientation) => handleUpdate({ orientation })}
            />

            <PillSelector<number>
              label="Thickness"
              options={[
                { label: '1px', value: 1 },
                { label: '2px', value: 2 },
                { label: '4px', value: 4 },
              ]}
              selectedValue={(selectedElement as DividerElement).thickness || 1}
              onSelect={(thickness) => handleUpdate({ thickness })}
            />

            <ColorPickerRow
              label="Line Color"
              selectedColor={(selectedElement as DividerElement).color || '#e2e8f0'}
              onSelect={(color) => handleUpdate({ color })}
            />
          </>
        )}

        {/* CONTAINER ELEMENT INSPECTOR */}
        {selectedElement.type === 'container' && (
          <>
            <PillSelector<ContainerDirection>
              label="Direction"
              options={[
                { label: 'Vertical (Column)', value: 'column' },
                { label: 'Horizontal (Row)', value: 'row' },
                { label: 'Stack', value: 'stack' },
              ]}
              selectedValue={(selectedElement as ContainerElement).direction || 'column'}
              onSelect={(direction) => handleUpdate({ direction })}
            />

            <PillSelector<number>
              label="Gap Between Children"
              options={[
                { label: '0px', value: 0 },
                { label: '4px', value: 4 },
                { label: '8px', value: 8 },
                { label: '12px', value: 12 },
                { label: '16px', value: 16 },
              ]}
              selectedValue={(selectedElement as ContainerElement).gap ?? 8}
              onSelect={(gap) => handleUpdate({ gap })}
            />

            <ColorPickerRow
              label="Background Color"
              selectedColor={(selectedElement as ContainerElement).backgroundColor || 'transparent'}
              onSelect={(backgroundColor) => handleUpdate({ backgroundColor })}
            />
          </>
        )}

        {/* ACTION ELEMENT INSPECTOR */}
        {selectedElement.type === 'action' && (
          <>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Button Label</Text>
              <TextInput
                style={styles.textInput}
                value={(selectedElement as ActionElement).label || ''}
                onChangeText={(label) => handleUpdate({ label })}
                placeholder="Button Text"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <PillSelector<'primary' | 'secondary' | 'ghost' | 'destructive'>
              label="Button Style"
              options={[
                { label: 'Primary', value: 'primary' },
                { label: 'Secondary', value: 'secondary' },
                { label: 'Ghost', value: 'ghost' },
                { label: 'Destructive', value: 'destructive' },
              ]}
              selectedValue={(selectedElement as ActionElement).style || 'primary'}
              onSelect={(btnStyle) => handleUpdate({ style: btnStyle })}
            />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    ...typography.h3,
    fontSize: 16,
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  hintText: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  scrollArea: {
    maxHeight: 380,
  },
  fieldGroup: {
    marginBottom: spacing.md,
  },
  fieldLabel: {
    ...typography.captionMedium,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  textInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.text,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: {
    backgroundColor: colors.primaryBackground,
    borderColor: colors.primary,
  },
  pillText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchWhite: {
    borderColor: colors.border,
  },
  swatchSelected: {
    borderColor: colors.primary,
    transform: [{ scale: 1.15 }],
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  toggleLabel: {
    ...typography.body,
    fontSize: 14,
    color: colors.text,
  },
});
