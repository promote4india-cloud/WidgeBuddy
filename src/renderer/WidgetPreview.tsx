/**
 * src/renderer/WidgetPreview.tsx
 *
 * Interactive preview component for declarative widgets.
 * Allows toggling between sample widget definitions and sizes (small, medium, large).
 * Uses mock normalized data and never connects to external APIs.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  DeclarativeWidgetDefinition,
  WidgetSize,
  Action,
  WIDGET_SIZE_DIMENSIONS,
} from '@/widgets/schema';
import { sampleWidgetDefinitions } from '@/widgets/samples';
import { DeclarativeWidgetRenderer } from './declarative/DeclarativeWidgetRenderer';
import { mockUniversalItems } from './mockData';

export interface WidgetPreviewProps {
  /** Optional initial or fixed widget definition to preview */
  initialDefinition?: DeclarativeWidgetDefinition;
  /** Optional initial size */
  initialSize?: WidgetSize;
}

const SIZES: WidgetSize[] = ['small', 'medium', 'large'];

export const WidgetPreview = React.memo(function WidgetPreview({
  initialDefinition,
  initialSize = 'medium',
}: WidgetPreviewProps) {
  const [selectedWidget, setSelectedWidget] = useState<DeclarativeWidgetDefinition>(
    initialDefinition ?? sampleWidgetDefinitions[0]
  );
  const [selectedSize, setSelectedSize] = useState<WidgetSize>(initialSize);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const dimensions = WIDGET_SIZE_DIMENSIONS[selectedSize];

  const handleAction = (action: Action) => {
    setLastAction(`Action triggered: [${action.type}] ${action.url || action.actionName || action.route || ''}`);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Widget Preview</Text>
        <Text style={styles.subtitle}>
          Preview declarative widgets with mock normalized data
        </Text>
      </View>

      {/* Widget Selector Bar */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Sample Widget</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
          {sampleWidgetDefinitions.map((widget) => {
            const isSelected = selectedWidget.id === widget.id;
            return (
              <TouchableOpacity
                key={widget.id}
                onPress={() => {
                  setSelectedWidget(widget);
                  setLastAction(null);
                }}
                activeOpacity={0.7}
                style={[styles.widgetTab, isSelected && styles.widgetTabActive]}
              >
                <Text
                  style={[
                    styles.widgetTabText,
                    isSelected && styles.widgetTabTextActive,
                  ]}
                >
                  {widget.displayName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Size Selector Bar */}
      <View style={styles.section}>
        <View style={styles.sizeHeaderRow}>
          <Text style={styles.sectionLabel}>Widget Size</Text>
          <Text style={styles.dimText}>
            Grid: {dimensions.w} × {dimensions.h}
          </Text>
        </View>
        <View style={styles.sizeSelector}>
          {SIZES.map((size) => {
            const isSelected = selectedSize === size;
            return (
              <TouchableOpacity
                key={size}
                onPress={() => setSelectedSize(size)}
                activeOpacity={0.7}
                style={[styles.sizeButton, isSelected && styles.sizeButtonActive]}
              >
                <Text
                  style={[
                    styles.sizeButtonText,
                    isSelected && styles.sizeButtonTextActive,
                  ]}
                >
                  {size.toUpperCase()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Canvas / Device Preview Frame */}
      <View style={styles.previewCanvas}>
        <View
          style={[
            styles.previewFrame,
            selectedSize === 'small' && styles.frameSmall,
            selectedSize === 'medium' && styles.frameMedium,
            selectedSize === 'large' && styles.frameLarge,
          ]}
        >
          <DeclarativeWidgetRenderer
            definition={selectedWidget}
            size={selectedSize}
            items={mockUniversalItems}
            onAction={handleAction}
          />
        </View>
      </View>

      {/* Last Action Notification Feedback */}
      {lastAction && (
        <View style={styles.actionFeedback}>
          <Text style={styles.actionFeedbackText}>{lastAction}</Text>
        </View>
      )}

      {/* Widget Metadata Summary */}
      <View style={styles.metadataCard}>
        <Text style={styles.metaTitle}>{selectedWidget.displayName}</Text>
        <Text style={styles.metaDescription}>{selectedWidget.description}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaPill}>v{selectedWidget.version}</Text>
          <Text style={styles.metaPill}>{selectedWidget.category ?? 'general'}</Text>
          <Text style={styles.metaPill}>
            {selectedWidget.connectorTypes && selectedWidget.connectorTypes.length > 0
              ? selectedWidget.connectorTypes.join(', ')
              : 'standalone'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  tabsRow: {
    flexDirection: 'row',
  },
  widgetTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  widgetTabActive: {
    backgroundColor: '#2563eb',
    borderColor: '#3b82f6',
  },
  widgetTabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#94a3b8',
  },
  widgetTabTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  sizeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dimText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
  },
  sizeSelector: {
    flexDirection: 'row',
    backgroundColor: '#1e293b',
    borderRadius: 8,
    padding: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sizeButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 6,
  },
  sizeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  sizeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  sizeButtonTextActive: {
    color: '#ffffff',
  },
  previewCanvas: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  previewFrame: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
  },
  frameSmall: {
    maxWidth: 180,
  },
  frameMedium: {
    maxWidth: 340,
  },
  frameLarge: {
    maxWidth: 360,
  },
  actionFeedback: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#064e3b',
    borderWidth: 1,
    borderColor: '#059669',
  },
  actionFeedbackText: {
    fontSize: 12,
    color: '#6ee7b7',
    textAlign: 'center',
    fontWeight: '500',
  },
  metadataCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  metaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f8fafc',
  },
  metaDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  metaPill: {
    fontSize: 11,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#0f172a',
    color: '#38bdf8',
  },
});
