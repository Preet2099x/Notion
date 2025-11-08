import AsyncStorage from '@react-native-async-storage/async-storage';
import { Note, EncryptedNote, Tag, ExportedNote } from '@/types/note.types';
import {
  encryptData,
  decryptData,
  generateIV,
  initializeEncryption,
  getMasterKey,
  deriveKeyFromPassword,
  hashPassword,
} from '@/utils/encryption';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Platform } from 'react-native';

const NOTES_STORAGE_KEY = 'encrypted_notes';
const TAGS_STORAGE_KEY = 'tags';
const SETTINGS_STORAGE_KEY = 'app_settings';

export class StorageService {
  private static masterKey: string | null = null;

  /**
   * Initialize the storage service and encryption
   */
  static async initialize(): Promise<void> {
    try {
      this.masterKey = await initializeEncryption();
    } catch (error) {
      console.error('Failed to initialize storage service:', error);
      throw error;
    }
  }

  /**
   * Get all notes from storage
   */
  static async getAllNotes(): Promise<Note[]> {
    try {
      if (!this.masterKey) {
        await this.initialize();
      }

      const encryptedNotesJson = await AsyncStorage.getItem(NOTES_STORAGE_KEY);
      if (!encryptedNotesJson) {
        return [];
      }

      const encryptedNotes: EncryptedNote[] = JSON.parse(encryptedNotesJson);
      const notes: Note[] = [];

      for (const encNote of encryptedNotes) {
        try {
          const decryptedData = await decryptData(
            encNote.encryptedData,
            this.masterKey!,
            encNote.iv
          );
          const note: Note = {
            ...JSON.parse(decryptedData),
            id: encNote.id,
            isLocked: encNote.isLocked,
            isArchived: encNote.isArchived,
            createdAt: encNote.createdAt,
            updatedAt: encNote.updatedAt,
          };
          notes.push(note);
        } catch (error) {
          console.error(`Failed to decrypt note ${encNote.id}:`, error);
        }
      }

      return notes;
    } catch (error) {
      console.error('Failed to get notes:', error);
      return [];
    }
  }

  /**
   * Save a note
   */
  static async saveNote(note: Note): Promise<void> {
    try {
      if (!this.masterKey) {
        await this.initialize();
      }

      const notes = await this.getAllNotes();
      const existingIndex = notes.findIndex((n) => n.id === note.id);

      if (existingIndex >= 0) {
        notes[existingIndex] = { ...note, updatedAt: new Date().toISOString() };
      } else {
        notes.push({
          ...note,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await this.saveAllNotes(notes);
    } catch (error) {
      console.error('Failed to save note:', error);
      throw error;
    }
  }

  /**
   * Save all notes to storage
   */
  private static async saveAllNotes(notes: Note[]): Promise<void> {
    try {
      if (!this.masterKey) {
        await this.initialize();
      }

      const encryptedNotes: EncryptedNote[] = [];

      for (const note of notes) {
        const iv = await generateIV();
        const noteData = {
          title: note.title,
          content: note.content,
          tags: note.tags,
          encryptionKey: note.encryptionKey,
        };

        const encryptedData = await encryptData(
          JSON.stringify(noteData),
          this.masterKey!,
          iv
        );

        encryptedNotes.push({
          id: note.id,
          encryptedData,
          iv,
          createdAt: note.createdAt,
          updatedAt: note.updatedAt,
          isLocked: note.isLocked,
          isArchived: note.isArchived,
        });
      }

      await AsyncStorage.setItem(
        NOTES_STORAGE_KEY,
        JSON.stringify(encryptedNotes)
      );
    } catch (error) {
      console.error('Failed to save all notes:', error);
      throw error;
    }
  }

  /**
   * Delete a note
   */
  static async deleteNote(noteId: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const filteredNotes = notes.filter((n) => n.id !== noteId);
      await this.saveAllNotes(filteredNotes);
    } catch (error) {
      console.error('Failed to delete note:', error);
      throw error;
    }
  }

  /**
   * Lock a note with a password
   */
  static async lockNote(noteId: string, password: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const note = notes.find((n) => n.id === noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      const hashedPassword = await hashPassword(password);
      note.isLocked = true;
      note.encryptionKey = hashedPassword;

      await this.saveNote(note);
    } catch (error) {
      console.error('Failed to lock note:', error);
      throw error;
    }
  }

  /**
   * Unlock a note with a password
   */
  static async unlockNote(
    noteId: string,
    password: string
  ): Promise<boolean> {
    try {
      const notes = await this.getAllNotes();
      const note = notes.find((n) => n.id === noteId);

      if (!note || !note.encryptionKey) {
        return false;
      }

      const hashedPassword = await hashPassword(password);
      return hashedPassword === note.encryptionKey;
    } catch (error) {
      console.error('Failed to unlock note:', error);
      return false;
    }
  }

  /**
   * Archive or unarchive a note
   */
  static async toggleArchive(noteId: string): Promise<void> {
    try {
      const notes = await this.getAllNotes();
      const note = notes.find((n) => n.id === noteId);

      if (!note) {
        throw new Error('Note not found');
      }

      note.isArchived = !note.isArchived;
      await this.saveNote(note);
    } catch (error) {
      console.error('Failed to toggle archive:', error);
      throw error;
    }
  }

  /**
   * Export a note as an encrypted file
   */
  static async exportNote(note: Note, password: string): Promise<void> {
    try {
      const { key, salt } = await deriveKeyFromPassword(password);
      const iv = await generateIV();

      const noteData = JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
      });

      const encryptedData = await encryptData(noteData, key, iv);

      const exportData: ExportedNote = {
        version: '1.0',
        encryptedData,
        iv,
        salt,
        metadata: {
          title: note.title,
          createdAt: note.createdAt,
          exportedAt: new Date().toISOString(),
        },
      };

      const fileName = `${note.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.enc`;
      const file = new File(Paths.cache, fileName);

      await file.write(JSON.stringify(exportData));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'application/octet-stream',
          dialogTitle: 'Export Encrypted Note',
          UTI: 'public.data',
        });
      }
    } catch (error) {
      console.error('Failed to export note:', error);
      throw error;
    }
  }

  /**
   * Export a note as a plain text file
   */
  static async exportNoteAsText(note: Note): Promise<void> {
    try {
      // Create text content
      let textContent = `${note.title}\n`;
      textContent += '='.repeat(note.title.length) + '\n\n';
      
      if (note.tags.length > 0) {
        textContent += 'Tags: ' + note.tags.map(tag => tag.name).join(', ') + '\n\n';
      }
      
      textContent += note.content + '\n\n';
      textContent += '---\n';
      textContent += `Created: ${new Date(note.createdAt).toLocaleString()}\n`;
      textContent += `Updated: ${new Date(note.updatedAt).toLocaleString()}\n`;

      const fileName = `${note.title.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.txt`;
      const file = new File(Paths.cache, fileName);

      await file.write(textContent);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(file.uri, {
          mimeType: 'text/plain',
          dialogTitle: 'Export Note as Text',
          UTI: 'public.plain-text',
        });
      }
    } catch (error) {
      console.error('Failed to export note as text:', error);
      throw error;
    }
  }

  /**
   * Import an encrypted note file
   */
  static async importNote(password: string): Promise<Note | null> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/octet-stream',
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }

      const fileUri = result.assets[0].uri;
      const file = new File(fileUri);
      const fileContent = await file.text();

      const exportData: ExportedNote = JSON.parse(fileContent);

      const { key } = await deriveKeyFromPassword(password, exportData.salt);
      const decryptedData = await decryptData(
        exportData.encryptedData,
        key,
        exportData.iv
      );

      const noteData = JSON.parse(decryptedData);

      const importedNote: Note = {
        id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: noteData.title,
        content: noteData.content,
        tags: noteData.tags,
        createdAt: exportData.metadata.createdAt,
        updatedAt: new Date().toISOString(),
        isLocked: false,
        isArchived: false,
      };

      await this.saveNote(importedNote);
      return importedNote;
    } catch (error) {
      console.error('Failed to import note:', error);
      throw error;
    }
  }

  /**
   * Get all tags
   */
  static async getAllTags(): Promise<Tag[]> {
    try {
      const tagsJson = await AsyncStorage.getItem(TAGS_STORAGE_KEY);
      return tagsJson ? JSON.parse(tagsJson) : [];
    } catch (error) {
      console.error('Failed to get tags:', error);
      return [];
    }
  }

  /**
   * Save a tag
   */
  static async saveTag(tag: Tag): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const existingIndex = tags.findIndex((t) => t.id === tag.id);

      if (existingIndex >= 0) {
        tags[existingIndex] = tag;
      } else {
        tags.push(tag);
      }

      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(tags));
    } catch (error) {
      console.error('Failed to save tag:', error);
      throw error;
    }
  }

  /**
   * Delete a tag
   */
  static async deleteTag(tagId: string): Promise<void> {
    try {
      const tags = await this.getAllTags();
      const filteredTags = tags.filter((t) => t.id !== tagId);
      await AsyncStorage.setItem(TAGS_STORAGE_KEY, JSON.stringify(filteredTags));
    } catch (error) {
      console.error('Failed to delete tag:', error);
      throw error;
    }
  }

  /**
   * Clear all data (for testing or reset)
   */
  static async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        NOTES_STORAGE_KEY,
        TAGS_STORAGE_KEY,
        SETTINGS_STORAGE_KEY,
      ]);
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}
