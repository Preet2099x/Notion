import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Tag } from '@/types/note.types';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TagPillProps {
  tag: Tag;
  onPress?: () => void;
  onDelete?: () => void;
  selected?: boolean;
}

export function TagPill({ tag, onPress, onDelete, selected }: TagPillProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: selected ? tag.color : tag.color + '20',
          borderColor: tag.color,
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}>
      <Text
        style={[
          styles.text,
          { color: selected ? '#FFFFFF' : tag.color },
        ]}>
        {tag.name}
      </Text>
      {onDelete && (
        <TouchableOpacity onPress={onDelete} style={styles.deleteButton}>
          <IconSymbol
            name="xmark.circle.fill"
            size={16}
            color={selected ? '#FFFFFF' : tag.color}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: '500',
  },
  deleteButton: {
    marginLeft: 4,
  },
});
