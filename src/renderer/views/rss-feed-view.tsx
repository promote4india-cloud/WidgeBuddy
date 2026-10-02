/**
 * src/renderer/views/rss-feed-view.tsx
 *
 * Placeholder renderer for the "rss-feed" widget type.
 */

import React from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { WidgetInstance, UniversalItem } from '@/widgets/schema';

interface RssFeedViewProps {
  instance: WidgetInstance;
  items: UniversalItem[];
  isLoading: boolean;
  isError: boolean;
}

export const RssFeedView = React.memo(function RssFeedView({
  items,
  isLoading,
  isError,
}: RssFeedViewProps) {
  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>Feed unavailable</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.placeholder}>No articles</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <View style={styles.articleRow}>
          <Text style={styles.articleTitle} numberOfLines={2}>
            {item.type === 'article' ? item.title : 'Article'}
          </Text>
          {item.type === 'article' && (item.author || item.summary) && (
            <Text style={styles.articleMeta} numberOfLines={1}>
              {item.author ?? item.summary}
            </Text>
          )}
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
    />
  );
});

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  articleRow: { paddingVertical: 6 },
  articleTitle: { fontSize: 13, fontWeight: '600', color: '#1a1a2e' },
  articleMeta: { fontSize: 11, color: '#9ca3af', marginTop: 2 },
  separator: { height: 1, backgroundColor: '#f3f4f6' },
  placeholder: { fontSize: 14, color: '#9ca3af' },
});
