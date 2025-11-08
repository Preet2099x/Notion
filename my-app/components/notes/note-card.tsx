import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Note } from '@/types/note.types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

const { width } = Dimensions.get('window');

interface NoteCardProps {
  note: Note;
  onPress: () => void;
  onLock?: () => void;
  onArchive?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
}

export function NoteCard({
  note,
  onPress,
  onLock,
  onArchive,
  onExport,
  onDelete,
}: NoteCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const preview = note.content.slice(0, 100);
  const hasMore = note.content.length > 100;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
      onPress={onPress}
      activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {note.isLocked && (
            <IconSymbol name="lock.fill" size={16} color={colors.icon} />
          )}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}>
            {note.title || 'Untitled Note'}
          </Text>
        </View>
        <View style={styles.actions}>
          {onLock && (
            <TouchableOpacity onPress={onLock} style={styles.actionButton}>
              <IconSymbol
                name={note.isLocked ? 'lock.fill' : 'lock.open'}
                size={18}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
          {onArchive && (
            <TouchableOpacity onPress={onArchive} style={styles.actionButton}>
              <IconSymbol
                name={note.isArchived ? 'tray.and.arrow.up' : 'archivebox'}
                size={18}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
          {onExport && (
            <TouchableOpacity onPress={onExport} style={styles.actionButton}>
              <IconSymbol
                name="square.and.arrow.up"
                size={18}
                color={colors.icon}
              />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
              <IconSymbol name="trash" size={18} color={colors.icon} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={[styles.preview, { color: colors.textSecondary }]} numberOfLines={3}>
        {preview}
        {hasMore && '...'}
      </Text>

      {note.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {note.tags.slice(0, 3).map((tag) => (
            <View
              key={tag.id}
              style={[styles.tag, { backgroundColor: tag.color + '20' }]}>
              <Text style={[styles.tagText, { color: tag.color }]}>
                {tag.name}
              </Text>
            </View>
          ))}
          {note.tags.length > 3 && (
            <Text style={[styles.moreText, { color: colors.textSecondary }]}>
              +{note.tags.length - 3} more
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.date, { color: colors.textSecondary }]}>
        {new Date(note.updatedAt).toLocaleDateString()} •{' '}
        {new Date(note.updatedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width - 32,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  preview: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moreText: {
    fontSize: 12,
    alignSelf: 'center',
  },
  date: {
    fontSize: 12,
    marginTop: 4,
  },
});
