import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Note } from '@/types/note.types';
import { StorageService } from '@/services/storage.service';
import { NoteCard } from '@/components/notes/note-card';
import { SearchBar } from '@/components/notes/search-bar';
import { LockModal } from '@/components/notes/lock-modal';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function ArchiveScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  React.useEffect(() => {
    filterNotes();
  }, [notes, searchQuery]);

  const loadNotes = async () => {
    try {
      const loadedNotes = await StorageService.getAllNotes();
      const archivedNotes = loadedNotes.filter((note) => note.isArchived);
      setNotes(archivedNotes);
    } catch (error) {
      console.error('Failed to load archived notes:', error);
      Alert.alert('Error', 'Failed to load archived notes');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const filterNotes = () => {
    if (!searchQuery.trim()) {
      setFilteredNotes(notes);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = notes.filter(
      (note) =>
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags.some((tag) => tag.name.toLowerCase().includes(query))
    );
    setFilteredNotes(filtered);
  };

  const handleNotePress = (note: Note) => {
    if (selectionMode) {
      toggleNoteSelection(note.id);
      return;
    }
    
    if (note.isLocked) {
      setSelectedNoteId(note.id);
      setLockModalVisible(true);
    } else {
      router.push({
        pathname: '/note-editor',
        params: { id: note.id },
      });
    }
  };

  const handleUnlockConfirm = async (password: string) => {
    if (!selectedNoteId) return;

    try {
      const unlocked = await StorageService.unlockNote(selectedNoteId, password);
      if (unlocked) {
        setLockModalVisible(false);
        router.push({
          pathname: '/note-editor',
          params: { 
            id: selectedNoteId,
            wasLocked: 'true',
            tempPassword: password,
          },
        });
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
    } catch (error) {
      console.error('Unlock failed:', error);
      Alert.alert('Error', 'Failed to unlock note');
    }
  };

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNotes((prev) => {
      if (prev.includes(noteId)) {
        return prev.filter((id) => id !== noteId);
      } else {
        return [...prev, noteId];
      }
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    setSelectedNotes([]);
  };

  const handleBulkUnarchive = async () => {
    if (selectedNotes.length === 0) {
      Alert.alert('No Selection', 'Please select notes to unarchive');
      return;
    }

    try {
      let successCount = 0;
      let failedCount = 0;
      const totalCount = selectedNotes.length;

      for (const noteId of selectedNotes) {
        try {
          const allNotes = await StorageService.getAllNotes();
          const note = allNotes.find((n) => n.id === noteId);
          
          if (!note) {
            console.error(`Note ${noteId} not found`);
            failedCount++;
            continue;
          }

          await StorageService.toggleArchive(noteId);
          successCount++;
        } catch (error) {
          console.error(`Failed to unarchive note ${noteId}:`, error);
          failedCount++;
        }
      }

      setSelectionMode(false);
      setSelectedNotes([]);
      await loadNotes();

      if (failedCount === 0) {
        Alert.alert('Success', `${successCount} note(s) moved to My Notes`);
      } else {
        Alert.alert(
          'Partially Complete',
          `${successCount} of ${totalCount} note(s) unarchived, ${failedCount} failed`
        );
      }
    } catch (error) {
      console.error('Bulk unarchive failed:', error);
      Alert.alert('Error', 'Failed to unarchive notes. Please try again.');
    }
  };

  const handleBulkDelete = () => {
    if (selectedNotes.length === 0) {
      Alert.alert('No Selection', 'Please select notes to delete');
      return;
    }

    Alert.alert(
      'Delete Notes',
      `Are you sure you want to permanently delete ${selectedNotes.length} note(s)? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              let successCount = 0;
              let failedCount = 0;

              for (const noteId of selectedNotes) {
                try {
                  await StorageService.deleteNote(noteId);
                  successCount++;
                } catch (error) {
                  console.error(`Failed to delete note ${noteId}:`, error);
                  failedCount++;
                }
              }

              await loadNotes();
              setSelectionMode(false);
              setSelectedNotes([]);

              if (failedCount === 0) {
                Alert.alert('Success', `${successCount} note(s) deleted`);
              } else {
                Alert.alert(
                  'Partially Complete',
                  `${successCount} note(s) deleted, ${failedCount} failed`
                );
              }
            } catch (error) {
              console.error('Bulk delete failed:', error);
              Alert.alert('Error', 'Failed to delete notes');
            }
          },
        },
      ]
    );
  };

  const handleUnarchive = async (noteId: string) => {
    try {
      await StorageService.toggleArchive(noteId);
      await loadNotes();
      Alert.alert('Success', 'Note moved to My Notes');
    } catch (error) {
      console.error('Unarchive failed:', error);
      Alert.alert('Error', 'Failed to unarchive note. Please try again.');
    }
  };

  const handleDelete = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to permanently delete this note?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.deleteNote(noteId);
              await loadNotes();
            } catch (error) {
              console.error('Delete failed:', error);
              Alert.alert('Error', 'Failed to delete note');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading archived notes...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        {selectionMode ? (
          <>
            <View style={styles.selectionHeader}>
              <TouchableOpacity onPress={toggleSelectionMode} style={styles.cancelButton}>
                <Text style={[styles.cancelButtonText, { color: colors.tint }]}>Cancel</Text>
              </TouchableOpacity>
              <Text style={[styles.selectionCount, { color: colors.text }]}>
                {selectedNotes.length} selected
              </Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity 
                onPress={handleBulkUnarchive} 
                style={styles.headerIconButton}
                disabled={selectedNotes.length === 0}>
                <IconSymbol 
                  name="tray.and.arrow.up" 
                  size={24} 
                  color={selectedNotes.length > 0 ? colors.tint : colors.icon} 
                />
                <Text style={[styles.headerButtonText, { 
                  color: selectedNotes.length > 0 ? colors.tint : colors.icon 
                }]}>Unarchive</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleBulkDelete} 
                style={styles.headerIconButton}
                disabled={selectedNotes.length === 0}>
                <IconSymbol 
                  name="trash" 
                  size={24} 
                  color={selectedNotes.length > 0 ? '#FF3B30' : colors.icon} 
                />
                <Text style={[styles.headerButtonText, { 
                  color: selectedNotes.length > 0 ? '#FF3B30' : colors.icon 
                }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>Archive</Text>
            <TouchableOpacity onPress={toggleSelectionMode} style={styles.selectButton}>
              <IconSymbol name="checkmark.circle" size={24} color={colors.tint} />
              <Text style={[styles.selectButtonText, { color: colors.tint }]}>Select</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <SearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search archived notes..."
      />

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => handleNotePress(item)}
            onArchive={() => handleUnarchive(item.id)}
            onDelete={() => handleDelete(item.id)}
            selectionMode={selectionMode}
            isSelected={selectedNotes.includes(item.id)}
            onToggleSelection={() => toggleNoteSelection(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="archivebox" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No archived notes found' : 'No archived notes'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Try a different search'
                : 'Archived notes will appear here'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotes} />
        }
      />

      <LockModal
        visible={lockModalVisible}
        mode="unlock"
        onConfirm={handleUnlockConfirm}
        onCancel={() => setLockModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 4,
  },
  selectButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  selectionCount: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerIconButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  listContent: {
    paddingVertical: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
