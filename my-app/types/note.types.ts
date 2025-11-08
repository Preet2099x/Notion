export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  isArchived: boolean;
  encryptionKey?: string; // For individual note encryption
}

export interface EncryptedNote {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
  isLocked: boolean;
  isArchived: boolean;
}

export interface AppSettings {
  masterPassword?: string;
  autoLockTimeout?: number;
  theme: 'light' | 'dark';
}

export interface ExportedNote {
  version: string;
  encryptedData: string;
  iv: string;
  salt: string;
  metadata: {
    title: string;
    createdAt: string;
    exportedAt: string;
  };
}
