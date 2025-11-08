# Secure Notes - Privacy-First Note-Taking App

A privacy-focused, encrypted note-taking application built with React Native and Expo.

## 🎯 Project Requirements

This app fulfills all 3 compulsory features:

1. ✅ **Create/edit notes with title & tags** - Full-featured note editor with tagging system
2. ✅ **Note lock/archive feature** - Password-protected note locking and archive functionality  
3. ✅ **Export note as encrypted file** - Export and import notes as encrypted `.enc` files

## 🚀 Quick Start

```bash
cd my-app
npm install
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator  
- `w` for web browser

## 📖 Documentation

- **[README.md](./my-app/README.md)** - Full project documentation
- **[IMPLEMENTATION_SUMMARY.md](./my-app/IMPLEMENTATION_SUMMARY.md)** - Technical implementation details
- **[QUICK_START.md](./my-app/QUICK_START.md)** - Step-by-step usage guide

## ✨ Key Features

### Security & Privacy
- 🔐 End-to-end local encryption (AES-256)
- 🔑 Secure key storage in device enclave
- 🔒 Individual note password protection
- 📤 Encrypted file export/import
- 🔍 Zero-knowledge architecture

### Functionality
- 📝 Rich note editor with title and content
- 🏷️ Colored tag system for organization
- 🔍 Search across titles, content, and tags
- 📦 Archive system for old notes
- 🗑️ Delete unwanted notes
- 🌓 Dark mode support

## 🔧 Tech Stack

- **Framework:** React Native + Expo SDK 54
- **Language:** TypeScript
- **Navigation:** Expo Router
- **Encryption:** expo-crypto, expo-secure-store
- **Storage:** @react-native-async-storage
- **File Ops:** expo-file-system, expo-sharing

## 📱 App Structure

```
Notes Tab          Archive Tab       Note Editor
┌─────────┐       ┌─────────┐      ┌─────────┐
│ 🔍 Search│       │ 🔍 Search│      │← Title  ✓│
│ ⬇️ 📝 ➕  │       │         │      │           │
├─────────┤       ├─────────┤      │ Content   │
│📄 Note 1│       │📄 Note A│      │           │
│  🔒📦📤🗑│       │  📤🗑   │      │ Tags: +   │
│         │       │         │      │ 🏷️ Work   │
│📄 Note 2│       │📄 Note B│      │ 🏷️ Ideas  │
│  🔓📦📤🗑│       │  📤🗑   │      │           │
└─────────┘       └─────────┘      └─────────┘
```

## 🎬 Demo Workflow

1. **Create Note** → Enter title, content, add tags → Save (encrypted)
2. **Lock Note** → Tap lock icon → Set password → Note protected
3. **Export Note** → Tap export icon → Set password → Share `.enc` file
4. **Import Note** → Tap import → Select file → Enter password → Restored
5. **Archive Note** → Tap archive icon → Moves to Archive tab

## 🛡️ Security Features

### Current Implementation
✅ All notes encrypted at rest  
✅ Master key in secure enclave  
✅ Password hashing (SHA-256)  
✅ Encrypted file export  
✅ No plaintext storage  
✅ Offline-first (no network)

### For Production
- Use react-native-aes-crypto for proper AES-GCM
- Add biometric authentication (Face ID/Touch ID)
- Implement key rotation
- Add secure backup mechanisms

## 🔮 Future Enhancements (Backend Bonus)

### Server-Side Encrypted Sync
- Zero-knowledge sync protocol
- End-to-end encryption during transit
- Multi-device synchronization
- Conflict resolution

### Share Encrypted Notes
- Public-key cryptography
- Secure key exchange
- Collaborative editing
- Permission management

### Audit Log
- Access attempt tracking
- Failed unlock logging
- Export/import history
- Security event notifications

## 📄 License

Created for educational purposes.

## 👤 Author

Demonstration of privacy-first mobile app development.

---

**All 3 compulsory features fully implemented!** 🎉