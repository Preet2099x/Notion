# Quick Start Guide

## Running the App

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm start
   ```

3. **Run on your preferred platform:**
   - iOS: Press `i` or run `npm run ios`
   - Android: Press `a` or run `npm run android`
   - Web: Press `w` or run `npm run web`
   - Physical Device: Scan QR code with Expo Go app

## Testing the Features

### 1. Create Your First Note
- Tap the **+** button in top right corner
- Enter title: "My Secure Note"
- Enter content: "This note is encrypted locally!"
- Tap the + next to "Tags"
- Add a tag: "Personal"
- Tap **Save**

### 2. Lock a Note
- On your note card, tap the **lock icon** (open lock)
- Enter password: "test1234"
- Confirm password: "test1234"
- Note is now locked (shows closed lock icon)
- Try tapping the note - it asks for password!
- Enter "test1234" to unlock and view

### 3. Export a Note
- Tap the **export icon** (share arrow) on a note
- Enter password for the encrypted file: "export123"
- System share sheet appears
- Save or share the `.enc` file

### 4. Import a Note
- Tap the **import icon** (download arrow) in top right
- Select the `.enc` file you exported
- Enter the password: "export123"
- Note is imported and appears in your list!

### 5. Archive a Note
- Tap the **archive icon** (box) on a note
- Note disappears from Notes tab
- Switch to **Archive** tab at bottom
- See your archived note
- Tap archive icon again to restore

### 6. Search Notes
- In the search bar, type any keyword
- Notes filter by title, content, or tags
- Clear search to see all notes

### 7. Delete a Note
- Tap the **trash icon** on any note
- Confirm deletion
- Note is permanently removed

## App Structure

```
📱 Tabs
├── 📝 Notes (Home)
│   ├── Search bar
│   ├── Import button
│   ├── Create note button (+)
│   └── Note cards (with lock/archive/export/delete actions)
└── 📦 Archive
    ├── Search bar
    ├── Archived note cards
    └── Unarchive/delete actions
```

## Keyboard Shortcuts (Web)

- `Cmd/Ctrl + S` - Save note (in editor)
- `Cmd/Ctrl + W` - Close editor
- `Esc` - Cancel modals

## Tips & Tricks

1. **Tags are reusable** - Once created, tags appear in suggestions for other notes
2. **Search is powerful** - Searches across title, content, AND tags
3. **Dark mode** - Automatically follows system preference
4. **Pull to refresh** - Swipe down on note lists to refresh
5. **Password tips** - Use strong passwords for locked notes and exports

## Troubleshooting

### App won't start
```bash
# Clear cache and restart
npm start -- --clear
```

### Import not working
- Make sure you're using the correct password
- File must be .enc format from this app
- Check file isn't corrupted

### Notes not appearing
- Pull down to refresh the list
- Check if note is archived (look in Archive tab)

### Can't unlock note
- Password is case-sensitive
- No "forgot password" feature (by design for security)
- If you forget the password, note stays locked

## Security Notes

- **All notes are encrypted** on your device before storage
- **Master key** is stored in device secure enclave
- **No cloud sync** - everything stays on your device
- **Export files** are encrypted with your password
- **Lost passwords** cannot be recovered (zero-knowledge design)

## Development Notes

### File Structure
```
app/
├── (tabs)/
│   ├── index.tsx       # Notes list screen
│   └── explore.tsx     # Archive screen
└── note-editor.tsx     # Create/edit screen

components/notes/
├── note-card.tsx       # Note display
├── tag-pill.tsx        # Tag component
├── search-bar.tsx      # Search input
└── lock-modal.tsx      # Password modal

services/
└── storage.service.ts  # Encrypted storage

utils/
└── encryption.ts       # Crypto functions
```

### Key Technologies
- React Native + Expo
- expo-crypto (encryption)
- expo-secure-store (key storage)
- AsyncStorage (encrypted data)
- TypeScript

## Next Steps

1. Try creating multiple notes with different tags
2. Lock some notes and leave others unlocked
3. Export a note and share it with yourself
4. Import the exported note
5. Archive old notes to keep workspace clean
6. Try dark mode (change system settings)

Enjoy your secure, privacy-first note-taking! 🔐📝
