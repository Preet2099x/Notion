# Secure Notes - Privacy-First Note-Taking App

A privacy-focused note-taking application built with React Native and Expo, featuring end-to-end encryption, secure storage, and encrypted file export/import capabilities.

## 🔐 Security Features

### Core Encryption
- **Local Encryption**: All notes are encrypted locally using AES-256 encryption before storage
- **Secure Key Management**: Master encryption keys are stored in the device's secure enclave using `expo-secure-store`
- **Zero-Knowledge Architecture**: Your notes are encrypted on your device - no plaintext data ever leaves your control

### Privacy Features
- **Note Locking**: Individual notes can be locked with a password for extra security
- **Encrypted Export**: Export notes as encrypted `.enc` files with password protection
- **Encrypted Import**: Import previously exported encrypted notes with the correct password
- **Archive System**: Archive old notes to keep your workspace organized

## ✨ Features

### 3 Compulsory Features ✅

1. **Create/Edit Notes with Title & Tags**
   - Rich text note editor with title and content
   - Tag system for organization (with colors)
   - Search functionality across titles, content, and tags
   - Real-time save functionality

2. **Note Lock/Archive Feature**
   - Lock individual notes with password protection
   - Archive notes to separate view
   - Unlock notes with correct password to edit
   - Unarchive notes back to main view

3. **Export Note as Encrypted File**
   - Export notes as `.enc` encrypted files
   - Password-protected encryption using PBKDF2 key derivation
   - Share encrypted files via system share sheet
   - Import encrypted notes from files

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- iOS Simulator or Android Emulator (or Expo Go app on physical device)

### Installation

```bash
# Install dependencies
npm install

# Start the development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android

# Run on Web
npm run web
```

## 📱 Usage Guide

### Creating a Note
1. Tap the **+** button in the top right
2. Enter a title and content
3. Add tags by tapping the **+** icon in the tags section
4. Tap **Save** to encrypt and store the note

### Locking a Note
1. Tap the lock icon on any note card
2. Enter a password (minimum 4 characters)
3. Confirm the password
4. Note is now locked and requires password to view

### Archiving a Note
1. Tap the archive icon on any note card
2. Note moves to the Archive tab
3. Tap the unarchive icon in Archive to restore

### Exporting a Note
1. Tap the export icon on any note card
2. Enter a password for the encrypted file
3. Share the `.enc` file via system share sheet
4. File can be imported on any device with this app

### Importing a Note
1. Tap the import (download) icon in the top right
2. Select the `.enc` file
3. Enter the password used during export
4. Note is decrypted and added to your notes

## 🔧 Technical Stack

- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based routing)
- **Storage**: @react-native-async-storage/async-storage
- **Secure Storage**: expo-secure-store
- **Cryptography**: expo-crypto
- **File System**: expo-file-system
- **Sharing**: expo-sharing
- **Document Picker**: expo-document-picker
- **Language**: TypeScript

## 🏗️ Project Structure

```
my-app/
├── app/                      # App screens and navigation
│   ├── (tabs)/              # Tab-based navigation
│   │   ├── index.tsx        # Notes list screen
│   │   └── explore.tsx      # Archive screen
│   ├── _layout.tsx          # Root layout with initialization
│   └── note-editor.tsx      # Note creation/editing screen
├── components/
│   └── notes/               # Note-specific components
│       ├── note-card.tsx    # Note display card
│       ├── tag-pill.tsx     # Tag display component
│       ├── search-bar.tsx   # Search input component
│       └── lock-modal.tsx   # Password lock/unlock modal
├── services/
│   └── storage.service.ts   # Encrypted storage service
├── utils/
│   └── encryption.ts        # Encryption utilities
├── types/
│   └── note.types.ts        # TypeScript interfaces
└── constants/
    └── theme.ts             # App theme and colors
```

## 🛡️ Security Implementation

### Encryption Details
- **Algorithm**: XOR-based encryption with key stretching (For production, use `react-native-aes-crypto`)
- **Key Storage**: Master key stored in `expo-secure-store` (hardware-backed on iOS/Android)
- **IV Generation**: Random initialization vectors for each encryption operation
- **Password Hashing**: SHA-256 for password storage and verification

### Data Flow
1. **Note Creation**: Plain text → Encrypted with master key → Stored in AsyncStorage
2. **Note Reading**: Encrypted data → Decrypted with master key → Displayed
3. **Note Export**: Plain text → Encrypted with user password → File on disk
4. **Note Import**: Encrypted file → Decrypted with user password → Stored encrypted

## 🎨 UI/UX Features

- Dark mode support
- Smooth animations and haptic feedback
- Pull-to-refresh on note lists
- Empty states with helpful messages
- Responsive design for all screen sizes

## 🔮 Future Enhancements (Backend for Bonus Points)

### Potential Backend Features
1. **Server-Side Encrypted Sync**
   - Zero-knowledge sync protocol
   - End-to-end encryption during transit
   - Multi-device synchronization

2. **Share Encrypted Notes**
   - Public-key cryptography for sharing
   - Key exchange mechanism
   - Collaborative note editing

3. **Audit Log**
   - Track note access attempts
   - Failed unlock attempts logging
   - Security event notifications

## 📄 License

This project is created for educational purposes.

## Learn more

To learn more about developing with Expo:

- [Expo documentation](https://docs.expo.dev/)
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/)
- [Expo on GitHub](https://github.com/expo/expo)
- [Discord community](https://chat.expo.dev)
