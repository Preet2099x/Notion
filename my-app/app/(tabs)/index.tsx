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
        <Text style={[styles.title, { color: colors.text }]}>My Notes</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleImport} style={styles.headerButton}>
            <IconSymbol name="square.and.arrow.down" size={24} color={colors.icon} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/note-editor')}
            style={[styles.headerButton, styles.addButton]}>
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
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
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
