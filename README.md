# Secure Notes App

Privacy-first note-taking app with encryption, built with React Native + Expo.

## Features

- 📝 Create/edit notes with tags
- 🔒 Password-protect individual notes
- 📦 Archive old notes
- 📤 Export notes as text files
- ✅ Bulk select & export
- 🔍 Search functionality
- 🌓 Dark mode support

## Quick Start

```bash
cd my-app
npm install
npx expo start
```

Press `i` for iOS, `a` for Android, or `w` for web.

## Tech Stack

- React Native + Expo SDK 54
- TypeScript
- expo-crypto (encryption)
- expo-secure-store (key storage)
- Expo Router (navigation)

## Security

- All notes encrypted locally
- Master key in secure device enclave
- Password-protected individual notes
- No plaintext storage

---

Built for privacy and security.