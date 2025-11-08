import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
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

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const [lockModalVisible, setLockModalVisible] = useState(false);
  const [lockModalMode, setLockModalMode] = useState<'lock' | 'unlock'>('lock');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [exportNoteId, setExportNoteId] = useState<string | null>(null);

  // Selection mode state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedNotes, setSelectedNotes] = useState<string[]>([]);

  useEffect(() => {
    loadNotes();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  useEffect(() => {
    filterNotes();
  }, [notes, searchQuery]);

  const loadNotes = async () => {
    try {
      const loadedNotes = await StorageService.getAllNotes();
      const activeNotes = loadedNotes.filter((note) => !note.isArchived);
      setNotes(activeNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
      Alert.alert('Error', 'Failed to load notes');
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

  const handleNotePress = async (note: Note) => {
    if (selectionMode) {
      toggleNoteSelection(note.id);
      return;
    }
    
    if (note.isLocked) {
      setSelectedNoteId(note.id);
      setLockModalMode('unlock');
      setLockModalVisible(true);
    } else {
      router.push({
        pathname: '/note-editor',
        params: { id: note.id },
      });
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

  const handleBulkArchive = async () => {
    if (selectedNotes.length === 0) {
      Alert.alert('No Selection', 'Please select notes to archive');
      return;
    }

    try {
      for (const noteId of selectedNotes) {
        await StorageService.toggleArchive(noteId);
      }
      await loadNotes();
      setSelectionMode(false);
      setSelectedNotes([]);
      Alert.alert('Success', `${selectedNotes.length} note(s) archived`);
    } catch (error) {
      console.error('Bulk archive failed:', error);
      Alert.alert('Error', 'Failed to archive notes');
    }
  };

  const handleBulkExport = async () => {
    if (selectedNotes.length === 0) {
      Alert.alert('No Selection', 'Please select notes to export');
      return;
    }

    try {
      let successCount = 0;
      let failedCount = 0;

      for (const noteId of selectedNotes) {
        const note = notes.find((n) => n.id === noteId);
        if (note) {
          try {
            await StorageService.exportNoteAsText(note);
            successCount++;
          } catch (error) {
            console.error(`Failed to export note ${noteId}:`, error);
            failedCount++;
          }
        } else {
          failedCount++;
        }
      }

      setSelectionMode(false);
      setSelectedNotes([]);

      if (failedCount === 0) {
        Alert.alert('Success', `${successCount} note(s) exported as text files`);
      } else {
        Alert.alert(
          'Partially Complete',
          `${successCount} note(s) exported, ${failedCount} failed`
        );
      }
    } catch (error) {
      console.error('Bulk export failed:', error);
      Alert.alert('Error', 'Failed to export notes');
    }
  };

  const handleLock = (noteId: string, isLocked: boolean) => {
    setSelectedNoteId(noteId);
    setLockModalMode(isLocked ? 'unlock' : 'lock');
    setLockModalVisible(true);
  };

  const handleLockConfirm = async (password: string) => {
    if (!selectedNoteId) return;

    try {
      if (lockModalMode === 'lock') {
        await StorageService.lockNote(selectedNoteId, password);
        Alert.alert('Success', 'Note locked successfully');
      } else {
        const unlocked = await StorageService.unlockNote(selectedNoteId, password);
        if (unlocked) {
          setLockModalVisible(false);
          router.push({
            pathname: '/note-editor',
            params: { id: selectedNoteId },
          });
          return;
        } else {
          Alert.alert('Error', 'Incorrect password');
          return;
        }
      }
      await loadNotes();
      setLockModalVisible(false);
    } catch (error) {
      console.error('Lock/unlock failed:', error);
      Alert.alert('Error', 'Operation failed');
    }
  };

  const handleArchive = async (noteId: string) => {
    try {
      await StorageService.toggleArchive(noteId);
      await loadNotes();
    } catch (error) {
      console.error('Archive failed:', error);
      Alert.alert('Error', 'Failed to archive note');
    }
  };

  const handleExportConfirm = async (password: string) => {
    if (!exportNoteId) return;

    try {
      const note = notes.find((n) => n.id === exportNoteId);
      if (!note) return;

      await StorageService.exportNote(note, password);
      setExportModalVisible(false);
      Alert.alert('Success', 'Note exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export note');
    }
  };

  const handleExport = (noteId: string) => {
    setExportNoteId(noteId);
    setExportModalVisible(true);
  };

  const handleDelete = (noteId: string) => {
    Alert.alert(
      'Delete Note',
      'Are you sure you want to delete this note?',
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

  const handleImport = () => {
    Alert.prompt(
      'Import Note',
      'Enter the password for the encrypted file',
      async (password) => {
        if (password) {
          try {
            const importedNote = await StorageService.importNote(password);
            if (importedNote) {
              await loadNotes();
              Alert.alert('Success', 'Note imported successfully');
            }
          } catch (error) {
            console.error('Import failed:', error);
            Alert.alert('Error', 'Failed to import note. Check your password.');
          }
        }
      },
      'secure-text'
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: colors.text }}>Loading notes...</Text>
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
                onPress={handleBulkArchive} 
                style={styles.headerIconButton}
                disabled={selectedNotes.length === 0}>
                <IconSymbol 
                  name="archivebox" 
                  size={24} 
                  color={selectedNotes.length > 0 ? colors.tint : colors.icon} 
                />
                <Text style={[styles.headerButtonText, { 
                  color: selectedNotes.length > 0 ? colors.tint : colors.icon 
                }]}>Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleBulkExport} 
                style={styles.headerIconButton}
                disabled={selectedNotes.length === 0}>
                <IconSymbol 
                  name="square.and.arrow.up" 
                  size={24} 
                  color={selectedNotes.length > 0 ? colors.tint : colors.icon} 
                />
                <Text style={[styles.headerButtonText, { 
                  color: selectedNotes.length > 0 ? colors.tint : colors.icon 
                }]}>Export</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.title, { color: colors.text }]}>My Notes</Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={toggleSelectionMode} style={styles.headerIconButton}>
                <IconSymbol name="checkmark.circle" size={24} color={colors.tint} />
                <Text style={[styles.headerButtonText, { color: colors.tint }]}>Select</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => router.push('/(tabs)/explore')} 
                style={styles.headerIconButton}>
                <IconSymbol name="archivebox" size={24} color={colors.tint} />
                <Text style={[styles.headerButtonText, { color: colors.tint }]}>Archive</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleImport} style={styles.headerIconButton}>
                <IconSymbol name="square.and.arrow.down" size={24} color={colors.tint} />
                <Text style={[styles.headerButtonText, { color: colors.tint }]}>Import</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <SearchBar value={searchQuery} onChangeText={setSearchQuery} />

      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard
            note={item}
            onPress={() => handleNotePress(item)}
            onLock={() => handleLock(item.id, item.isLocked)}
            onArchive={() => handleArchive(item.id)}
            onExport={() => handleExport(item.id)}
            onDelete={() => handleDelete(item.id)}
            selectionMode={selectionMode}
            isSelected={selectedNotes.includes(item.id)}
            onToggleSelection={() => toggleNoteSelection(item.id)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <IconSymbol name="note.text" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No notes found' : 'No notes yet'}
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              {searchQuery ? 'Try a different search' : 'Tap + to create your first note'}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadNotes} />
        }
      />

      <LockModal
        visible={lockModalVisible}
        mode={lockModalMode}
        onConfirm={handleLockConfirm}
        onCancel={() => setLockModalVisible(false)}
      />

      <LockModal
        visible={exportModalVisible}
        mode="lock"
        title="Export Note"
        onConfirm={handleExportConfirm}
        onCancel={() => setExportModalVisible(false)}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        onPress={() => router.push('/note-editor')}
        style={styles.fab}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
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
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    padding: 4,
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
  listContent: {
    paddingVertical: 8,
    paddingBottom: 80,
  },
  fab: {
    position: 'absolute',
    left: 20,
    bottom: 80,
    backgroundColor: '#007AFF',
    borderRadius: 32,
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  fabText: {
    fontSize: 48,
    fontWeight: '300',
    color: '#FFFFFF',
    lineHeight: 48,
    marginTop: -2,
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
