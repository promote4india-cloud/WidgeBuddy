/**
 * src/renderer/declarative/elements/ArticleListView.tsx
 *
 * Renders declarative ArticleListElement (news/RSS feeds) with images, authors, and layouts.
 * Gracefully handles empty data.
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ArticleListElement, ArticleListElementInput, Action, UniversalItem, ArticleItem } from '@/widgets/schema';
import { getItemsByType, formatDate } from '../dataBinding';
import { IconView } from './IconView';

interface ArticleListViewProps {
  element: ArticleListElement | ArticleListElementInput;
  items?: UniversalItem[];
  onAction?: (action: Action) => void;
}

export const ArticleListView = React.memo(function ArticleListView({
  element,
  items,
  onAction,
}: ArticleListViewProps) {
  const articles = getItemsByType(items, 'article');
  const maxItems = element.maxItems ?? 3;
  const emptyMessage = element.emptyMessage ?? 'No articles available';
  const showImage = element.showImage !== false;
  const showTimestamp = element.showTimestamp !== false;
  const visibleArticles = articles.slice(0, maxItems);

  if (visibleArticles.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <IconView element={{ type: 'icon', name: 'newspaper', size: 'small', color: '#a8a29e' }} />
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  const handlePress = (article: ArticleItem) => {
    if (onAction) {
      onAction({
        type: 'open_url',
        url: article.url,
      });
    }
  };

  const isCardLayout = element.layout === 'card';

  return (
    <View style={styles.listContainer}>
      {visibleArticles.map((article) => {
        return (
          <TouchableOpacity
            key={article.id}
            onPress={() => handlePress(article)}
            activeOpacity={0.7}
            style={[styles.articleRow, isCardLayout && styles.articleCard]}
          >
            {element.showImage && article.imageUrl ? (
              <Image source={{ uri: article.imageUrl }} style={styles.thumbnail} />
            ) : null}

            <View style={styles.textContent}>
              <Text style={styles.title} numberOfLines={isCardLayout ? 2 : 1}>
                {article.title}
              </Text>

              {element.showSummary && article.summary ? (
                <Text style={styles.summary} numberOfLines={2}>
                  {article.summary}
                </Text>
              ) : null}

              <View style={styles.metaRow}>
                {element.showAuthor && article.author ? (
                  <Text style={styles.metaText}>{article.author}</Text>
                ) : null}
                {element.showTimestamp && article.publishedAt ? (
                  <Text style={styles.metaText}>{formatDate(article.publishedAt)}</Text>
                ) : null}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  listContainer: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
  },
  articleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  articleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 8,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
  thumbnail: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#44403c',
  },
  textContent: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffedd5',
    lineHeight: 18,
  },
  summary: {
    fontSize: 11,
    color: '#fed7aa',
    lineHeight: 15,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    fontSize: 10,
    color: '#fdba74',
  },
  emptyContainer: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    color: '#a8a29e',
    textAlign: 'center',
  },
});
