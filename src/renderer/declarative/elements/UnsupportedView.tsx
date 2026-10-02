/**
 * src/renderer/declarative/elements/UnsupportedView.tsx
 *
 * Graceful fallback view when an unrecognized or unsupported element type is encountered.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UnsupportedViewProps {
  type?: string;
}

export const UnsupportedView = React.memo(function UnsupportedView({
  type,
}: UnsupportedViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{`Unsupported component: ${type ?? 'unknown'}`}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginVertical: 4,
  },
  text: {
    fontSize: 11,
    color: '#ef4444',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});
