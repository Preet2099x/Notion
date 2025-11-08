import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Note, Tag } from '@/types/note.types';
import { StorageService } from '@/services/storage.service';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TagPill } from '@/components/notes/tag-pill';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';

export default function NoteEditor() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<Tag[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [existingNoteId, setExistingNoteId] = useState<string | null>(null);
  const [wasLockedOnOpen, setWasLockedOnOpen] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  useEffect(() => {
    loadNote();
    loadAllTags();
    
    // Check if note was locked when opened
    if (params.wasLocked === 'true') {
      setWasLockedOnOpen(true);
      setTempPassword(params.tempPassword as string || null);
    }
  }, []);

  const loadNote = async () => {
    if (params.id) {
      try {
        const notes = await StorageService.getAllNotes();
        const note = notes.find((n) => n.id === params.id);
        if (note) {
          setTitle(note.title);
          setContent(note.content);
          setTags(note.tags);
          setIsLocked(note.isLocked);
          setExistingNoteId(note.id);
        }
      } catch (error) {
        console.error('Failed to load note:', error);
        Alert.alert('Error', 'Failed to load note');
      }
    }
    setIsLoading(false);
  };

  const loadAllTags = async () => {
    try {
      const loadedTags = await StorageService.getAllTags();
      setAllTags(loadedTags);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    // If lock is enabled but no password is set, prompt for it
    if (isLocked && !tempPassword) {
      Alert.alert('Error', 'Please set a password by toggling password protection');
      return;
    }

    try {
      const note: Note = {
        id: (params.id as string) || `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: title.trim(),
        content: content.trim(),
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isLocked: isLocked,
        isArchived: false,
      };

      await StorageService.saveNote(note);
      
      // Handle password protection scenarios
      if (isLocked && tempPassword) {
        // Password was set via toggle or passed from unlock
        try {
          await StorageService.lockNote(note.id, tempPassword);
          router.back();
        } catch (error) {
          console.error('Failed to lock note:', error);
          Alert.alert('Error', 'Failed to set password');
          router.back();
        }
      } else if (!isLocked && wasLockedOnOpen) {
        // User removed password protection - note should stay unlocked
        router.back();
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert('Error', 'Failed to save note');
    }
  };

  const handleToggleLock = (value: boolean) => {
    if (!value && isLocked && existingNoteId) {
      // Removing password protection
      Alert.alert(
        'Remove Password',
        'This will remove the password protection from this note.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: () => {
              setIsLocked(false);
              setTempPassword(null);
            },
          },
        ]
      );
    } else if (value) {
      // Enabling password protection - prompt immediately
      Alert.prompt(
        'Set Password',
        'Enter a password to protect this note. You will need this password to open the note.',
        (password) => {
          if (password && password.trim()) {
            setIsLocked(true);
            setTempPassword(password);
            Alert.alert('Success', 'Password protection enabled. Remember to save your note.');
          } else {
            Alert.alert('Error', 'Password cannot be empty');
          }
        },
        'secure-text'
      );
    } else {
      setIsLocked(value);
    }
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) {
      return;
    }

    const existingTag = allTags.find(
      (t) => t.name.toLowerCase() === newTagName.trim().toLowerCase()
    );

    if (existingTag) {
      if (!tags.find((t) => t.id === existingTag.id)) {
        setTags([...tags, existingTag]);
      }
    } else {
      const newTag: Tag = {
        id: `tag_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: newTagName.trim(),
        color: getRandomColor(),
      };
      StorageService.saveTag(newTag);
      setAllTags([...allTags, newTag]);
      setTags([...tags, newTag]);
    }

    setNewTagName('');
    setShowTagInput(false);
  };

  const handleRemoveTag = (tagId: string) => {
    setTags(tags.filter((t) => t.id !== tagId));
  };

  const getRandomColor = () => {
    const colors = [
      '#FF6B6B',
      '#4ECDC4',
      '#45B7D1',
      '#FFA07A',
      '#98D8C8',
      '#F7DC6F',
      '#BB8FCE',
      '#85C1E2',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.icon} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {params.id ? 'Edit Note' : 'New Note'}
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.headerButton}>
          <Text style={[styles.saveText, { color: colors.tint }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TextInput
          style={[styles.titleInput, { color: colors.text }]}
          placeholder="Title"
          placeholderTextColor={colors.textSecondary}
          value={title}
          onChangeText={setTitle}
          autoFocus={!params.id}
        />

        {/* Encryption Toggle Section */}
        <View style={[styles.encryptionSection, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.encryptionInfo}>
            <View style={styles.encryptionIconContainer}>
              <IconSymbol 
                name={isLocked ? 'lock.fill' : 'lock.open'} 
                size={20} 
                color={isLocked ? '#34C759' : colors.icon} 
              />
            </View>
            <View style={styles.encryptionText}>
              <Text style={[styles.encryptionTitle, { color: colors.text }]}>
                Password Protection
              </Text>
              <Text style={[styles.encryptionDescription, { color: colors.textSecondary }]}>
                {isLocked 
                  ? 'This note requires a password to open'
                  : 'All notes are encrypted. Add password for extra security'}
              </Text>
            </View>
          </View>
          <Switch
            value={isLocked}
            onValueChange={handleToggleLock}
            trackColor={{ false: colors.border, true: '#34C759' }}
            thumbColor="#FFFFFF"
          />
        </View>

        <View style={styles.tagsSection}>
          <View style={styles.tagsHeader}>
            <Text style={[styles.tagsLabel, { color: colors.textSecondary }]}>Tags</Text>
            <TouchableOpacity 
              onPress={() => setShowTagInput(!showTagInput)}
              style={styles.addTagButton}>
              <IconSymbol
                name={showTagInput ? 'xmark' : 'plus'}
                size={20}
                color={colors.tint}
              />
            </TouchableOpacity>
          </View>

          {showTagInput && (
            <View style={styles.tagInputContainer}>
              <TextInput
                style={[
                  styles.tagInput,
                  {
                    backgroundColor: colors.cardBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Tag name"
                placeholderTextColor={colors.textSecondary}
                value={newTagName}
                onChangeText={setNewTagName}
                onSubmitEditing={handleAddTag}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={handleAddTag} style={styles.addButton}>
                <Text style={{ color: colors.tint, fontWeight: '600' }}>Add</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.tagsContainer}>
            {tags.map((tag) => (
              <TagPill
                key={tag.id}
                tag={tag}
                onDelete={() => handleRemoveTag(tag.id)}
              />
            ))}
          </View>
        </View>

        <TextInput
          style={[styles.contentInput, { color: colors.text }]}
          placeholder="Start writing..."
          placeholderTextColor={colors.textSecondary}
          value={content}
          onChangeText={setContent}
          multiline
          textAlignVertical="top"
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 4,
    minWidth: 60,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  encryptionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  encryptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  encryptionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  encryptionText: {
    flex: 1,
  },
  encryptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  encryptionDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
  tagsSection: {
    marginBottom: 16,
  },
  tagsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  addTagButton: {
    backgroundColor: '#007AFF',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagInputContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagInput: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  addButton: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  contentInput: {
    fontSize: 16,
    lineHeight: 24,
    minHeight: 300,
  },
});
